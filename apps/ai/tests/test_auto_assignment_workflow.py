import pytest
import uuid
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
from sqlalchemy import text

from app.database import async_session
from app.workflows.checkpointer import SQLAlchemyCheckpointSaver
from app.workflows.auto_assigner import workflow, AutoAssignmentSchema, TaskAssignmentItem
from langgraph.types import Command

@pytest.mark.asyncio
@patch("app.workflows.auto_assigner.ChatGroq")
async def test_auto_assignment_workflow_execution(mock_chat_groq):
    """Verify the full auto_assigner graph cycle, testing constraints, rebalancing, HITL interrupt, and DB updates."""
    # 1. Mock LLM responses for generate_assignments and rebalance nodes
    mock_llm_instance = MagicMock()
    mock_chat_groq.return_value = mock_llm_instance
    
    mock_chain_initial = AsyncMock()
    # Initial LLM assignment makes Mazen overloaded:
    # Mazen has 5 active points. Allocating "Optimize queries" (high priority = 3 points) to Mazen brings him to 8 points (exceeding threshold of 7).
    mock_chain_initial.return_value = AutoAssignmentSchema(assignments=[
        TaskAssignmentItem(task_id="task-unassigned-1", user_id="user-mazen", reasoning="Mazen does DB stuff"),
        TaskAssignmentItem(task_id="task-unassigned-2", user_id="user-hassan", reasoning="Hassan does styling")
    ])
    mock_chain_initial.ainvoke.return_value = mock_chain_initial.return_value

    mock_chain_rebalance = AsyncMock()
    # Rebalanced LLM assignment shifts the task to Hassan:
    mock_chain_rebalance.return_value = AutoAssignmentSchema(assignments=[
        TaskAssignmentItem(task_id="task-unassigned-1", user_id="user-hassan", reasoning="Hassan has more points capacity"),
        TaskAssignmentItem(task_id="task-unassigned-2", user_id="user-hassan", reasoning="Hassan does styling")
    ])
    mock_chain_rebalance.ainvoke.return_value = mock_chain_rebalance.return_value

    # with_structured_output is called multiple times: first for initial matching, then for rebalancing
    mock_llm_instance.with_structured_output.side_effect = [mock_chain_initial, mock_chain_rebalance]

    # 2. Mock Database AsyncSession to capture checkpoints and return test data
    db_mock = AsyncMock()
    saved_checkpoints = {}

    def mock_add(obj):
        if hasattr(obj, "checkpoint_id"):
            saved_checkpoints[obj.checkpoint_id] = obj
    db_mock.add.side_effect = mock_add

    # Define mock return records for execute calls
    board_columns = [
        ("col-todo", "To Do"),
        ("col-done", "Done")
    ]
    workspace_members = [
        ("user-mazen", "Mazen"),
        ("user-hassan", "Hassan")
    ]
    # Active board tasks: Mazen has a Medium task and a High task (2+3 = 5 points)
    active_board_tasks = [
        ("user-mazen", "medium", "col-todo"),
        ("user-mazen", "high", "col-todo")
    ]
    # Task completion history
    history_records = [
        ("user-mazen", "Database index optimization", "Added indices to fast queries", "high"),
        ("user-hassan", "CSS layout fixing", "Centered the div on landing page", "low")
    ]
    # Unassigned tasks on target board
    unassigned_tasks = [
        ("task-unassigned-1", "Optimize queries", "Speed up dashboard loads", "high"),
        ("task-unassigned-2", "Fix navbar alignment", "Header links are off-grid", "low")
    ]

    async def mock_execute(sql, params=None):
        sql_str = str(sql).lower()
        mock_result = MagicMock()

        # Checkpoints loading
        if "graph_checkpoints" in sql_str:
            compiled_params = sql.compile().params if hasattr(sql, "compile") else {}
            param_vals = list(compiled_params.values())
            
            matched_checkpoint = None
            for val in param_vals:
                if val in saved_checkpoints:
                    matched_checkpoint = saved_checkpoints[val]
                    break
                    
            if "select" in sql_str:
                if matched_checkpoint:
                    row = (
                        matched_checkpoint.thread_id,
                        matched_checkpoint.checkpoint_ns,
                        matched_checkpoint.checkpoint_id,
                        matched_checkpoint.parent_checkpoint_id,
                        matched_checkpoint.checkpoint_blob,
                        matched_checkpoint.metadata_blob,
                        matched_checkpoint.created_at
                    )
                    mock_result.fetchone.return_value = row
                else:
                    mock_result.fetchone.return_value = None
            return mock_result

        # Column list
        if "boardcolumn" in sql_str and "taskassignee" not in sql_str:
            mock_result.fetchall.return_value = board_columns
            return mock_result

        # Workspace member list
        if "workspacemember" in sql_str:
            mock_result.fetchall.return_value = workspace_members
            return mock_result

        # Unassigned tasks (must check before other taskassignee queries)
        if "left join" in sql_str:
            mock_result.fetchall.return_value = unassigned_tasks
            return mock_result

        # Completed task history (contains both taskassignee and boardcolumn/board)
        if "taskassignee" in sql_str and ("boardcolumn" in sql_str or "workspace_id" in sql_str) and "done" in sql_str:
            mock_result.fetchall.return_value = history_records
            return mock_result

        # Active tasks (contains taskassignee, but no done /completed check)
        if "taskassignee" in sql_str and "boardcolumn" not in sql_str:
            mock_result.fetchall.return_value = active_board_tasks
            return mock_result

        # Default fallback
        mock_result.fetchall.return_value = []
        mock_result.fetchone.return_value = None
        return mock_result

    db_mock.execute.side_effect = mock_execute

    # 3. Setup LangGraph state machine config
    thread_id = str(uuid.uuid4())
    config = {
        "configurable": {
            "thread_id": thread_id,
            "db": db_mock,
            "user_id": "test-user-admin"
        }
    }

    # Use in-memory SQL checkpoint mock
    checkpointer = SQLAlchemyCheckpointSaver(async_session)
    compiled_graph = workflow.compile(checkpointer=checkpointer)

    # State parameters
    initial_state = {
        "workspace_id": "workspace-1",
        "board_id": "board-1",
        "max_workload": 7,  # Max Points constraint threshold
        "unassigned_tasks": [],
        "members": [],
        "assignments": {},
        "overloaded_members": [],
        "status": "loading",
        "iteration": 0
    }

    # 4. Invoke Phase 1: Executes load_context, generate_assignments, validate_workload (Mazen overloaded), rebalance, validate_workload, and interrupts at approval
    state = await compiled_graph.ainvoke(initial_state, config)
    
    # Verify interrupt state
    state_info = await compiled_graph.aget_state(config)
    assert state_info.next == ("ask_human_approval",)
    
    values = state_info.values
    # Check that iteration count is incremented due to rebalancing cycle
    assert values["iteration"] == 2
    # Check that assignments were correctly loaded
    assert values["assignments"]["task-unassigned-1"] == "user-hassan"
    assert values["assignments"]["task-unassigned-2"] == "user-hassan"

    # 5. Invoke Phase 2: Resume workflow yielding final approval
    resume_payload = {
        "task-unassigned-1": "user-mazen", # Override assignment back to Mazen
        "task-unassigned-2": "user-hassan"
    }
    
    final_state = await compiled_graph.ainvoke(Command(resume=resume_payload), config)
    
    # Verify completed status
    assert final_state["status"] == "completed"
    assert final_state["assignments"] == resume_payload

    # Verify database commit queries were called
    db_mock.commit.assert_called()
