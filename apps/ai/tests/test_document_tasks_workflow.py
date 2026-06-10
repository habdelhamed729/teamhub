import pytest
import uuid
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
from sqlalchemy import text

from app.database import async_session
from app.workflows.checkpointer import SQLAlchemyCheckpointSaver
from app.workflows.document_tasks import workflow, ExtractedTasksSchema, ExtractedTask
from langgraph.types import Command

@pytest.mark.asyncio
async def test_sqlalchemy_checkpointer():
    """Verify SQLAlchemyCheckpointSaver writes and reads graph checkpoints correctly."""
    thread_id = str(uuid.uuid4())
    async with async_session() as session:
        checkpointer = SQLAlchemyCheckpointSaver(session)
        config = {"configurable": {"thread_id": thread_id, "checkpoint_ns": ""}}
        
        checkpoint = {
            "v": 1,
            "id": "checkpoint-1",
            "ts": "2026-06-10T00:00:00Z",
            "channel_values": {"status": "in-progress"},
            "channel_versions": {},
            "versions_seen": {},
            "updated_channels": []
        }
        metadata = {"source": "update", "step": 1, "parents": {}, "run_id": "test-run-1"}
        
        # Write
        await checkpointer.aput(config, checkpoint, metadata, {})
        
        # Read back
        tup = await checkpointer.aget_tuple(config)
        assert tup is not None
        assert tup.checkpoint["channel_values"]["status"] == "in-progress"
        assert tup.metadata["run_id"] == "test-run-1"
        
        # Clean up
        await session.execute(
            text("DELETE FROM ai.graph_checkpoints WHERE thread_id = :tid"),
            {"tid": thread_id}
        )
        await session.commit()


@pytest.mark.asyncio
@patch("app.workflows.document_tasks.ChatGroq")
async def test_document_tasks_workflow_execution(mock_chat_groq):
    """Dry-run the full document_tasks graph, verifying HITL interrupts and owners mapping."""
    # 1. Mock ChatGroq and output binding
    mock_llm_instance = MagicMock()
    mock_chat_groq.return_value = mock_llm_instance
    
    mock_chain = AsyncMock()
    mock_chain.return_value = ExtractedTasksSchema(tasks=[
        ExtractedTask(
            title="Setup DB migrations",
            description="Run Prisma migrations script",
            assignee_raw="Mazen",
            priority="high",
            due_date="soon"  # Relative, vague date -> Ambiguous
        ),
        ExtractedTask(
            title="Write unit tests",
            description="Add workflow test coverage",
            assignee_raw="Hassan",
            priority="medium",
            due_date="2026-06-25"  # Absolute date -> Safe
        )
    ])
    mock_chain.ainvoke.return_value = mock_chain.return_value
    mock_llm_instance.with_structured_output.return_value = mock_chain

    # 2. Mock Database AsyncSession dynamically to capture checkpoints in memory
    db_mock = AsyncMock()
    db_mock.add = MagicMock()  # Synchronous MagicMock is required so session.add side_effect runs synchronously
    saved_checkpoints = {}

    def mock_add(obj):
        if hasattr(obj, "checkpoint_id"):
            saved_checkpoints[obj.checkpoint_id] = obj
    db_mock.add.side_effect = mock_add

    async def mock_execute(sql, params=None):
        sql_str = str(sql).lower()
        mock_result = MagicMock()

        if "graph_checkpoints" in sql_str:
            # Compile parameters from SQLAlchemy Select statement
            compiled_params = sql.compile().params if hasattr(sql, "compile") else {}
            param_vals = list(compiled_params.values())
            
            # Find if a specific checkpoint ID was requested
            matched_checkpoint = None
            for val in param_vals:
                if val in saved_checkpoints:
                    matched_checkpoint = saved_checkpoints[val]
                    break
            
            if matched_checkpoint:
                mock_result.scalars.return_value.first.return_value = matched_checkpoint
            elif saved_checkpoints:
                latest = list(saved_checkpoints.values())[-1]
                mock_result.scalars.return_value.first.return_value = latest
            else:
                mock_result.scalars.return_value.first.return_value = None
        elif "document" in sql_str:
            # Fetch document
            mock_result.fetchone.return_value = (
                {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Draft tasks here."}]}]},
            )
        elif "workspacemember" in sql_str or "workspace_id" in sql_str:
            # Fetch workspace members
            mock_result.fetchall.return_value = [
                (str(uuid.uuid4()), "Mazen Raafat", "mazen@teamhub.com"),
                (str(uuid.uuid4()), "Hassan Muhammad", "hassan@teamhub.com")
            ]
        elif "boardcolumn" in sql_str:
            # Check or create column
            mock_result.fetchone.return_value = (str(uuid.uuid4()),)
            mock_result.scalar.return_value = 0
        elif "task" in sql_str:
            # Check max task order
            mock_result.scalar.return_value = 0
        else:
            mock_result.scalar.return_value = 0
            mock_result.fetchone.return_value = None
            mock_result.fetchall.return_value = []
        return mock_result

    db_mock.execute.side_effect = mock_execute

    # 3. Setup Graph compilation
    thread_id = str(uuid.uuid4())
    config = {
        "configurable": {
            "thread_id": thread_id,
            "db": db_mock,
            "user_id": str(uuid.uuid4())
        }
    }
    
    checkpointer = SQLAlchemyCheckpointSaver(db_mock)
    compiled = workflow.compile(checkpointer=checkpointer)

    initial_state = {
        "workspace_id": str(uuid.uuid4()),
        "document_id": str(uuid.uuid4()),
        "document_text": None,
        "extracted_tasks": [],
        "ambiguous_tasks": [],
        "human_clarification": {},
        "matched_owners": {},
        "task_drafts": [],
        "board_id": None,
        "new_board_name": None,
        "created_task_ids": [],
        "status": "extracting"
    }

    # STEP A: Start Graph.
    # Expecting interrupt before clarification node due to "soon" and vague "Mazen"
    res_state = await compiled.ainvoke(initial_state, config)
    state_info = await compiled.aget_state(config)
    assert "ask_human_clarification" in state_info.next
    assert len(state_info.values["ambiguous_tasks"]) == 1
    assert state_info.values["ambiguous_tasks"][0]["task"]["title"] == "Setup DB migrations"

    # STEP B: Resume with Human Clarification.
    # Clarify task #0
    clarification_payload = {
        "0": {
            "assignee_raw": "Mazen Raafat",
            "due_date": "2026-06-15"
        }
    }
    
    res_state = await compiled.ainvoke(Command(resume=clarification_payload), config)
    state_info = await compiled.aget_state(config)
    
    # Expecting second interrupt at board selection & approval stage
    assert "ask_board_and_approval" in state_info.next
    assert len(state_info.values["task_drafts"]) == 2
    assert state_info.values["task_drafts"][0]["assignee_id"] is not None  # Mazen Raafat ID is resolved!
    assert state_info.values["task_drafts"][1]["assignee_id"] is not None  # Hassan Muhammad ID is resolved (partial prefix match "Hassan")!

    # STEP C: Resume with Board Approval
    approval_payload = {
        "board_id": None,
        "new_board_name": "Engineering Kanban",
        "approved_tasks": state_info.values["task_drafts"]
    }

    final_res = await compiled.ainvoke(Command(resume=approval_payload), config)
    assert final_res["status"] == "completed"
    assert len(final_res["created_task_ids"]) == 2
    assert db_mock.commit.called

