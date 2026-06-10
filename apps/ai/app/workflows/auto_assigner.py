import uuid
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt
from sqlalchemy import text

from app.config import settings
from app.prompts.loader import load_prompt
from app.workflows.state import AutoAssignmentState

# ---------------------------------------------------------------------------
# Structured LLM Output Schemas
# ---------------------------------------------------------------------------
class TaskAssignmentItem(BaseModel):
    task_id: str = Field(description="The unique identifier (UUID) of the task being assigned.")
    user_id: Optional[str] = Field(None, description="The unique identifier (UUID) of the assigned workspace user, or None if it should remain unassigned.")
    reasoning: str = Field(description="Brief explanation of why this user was matched to this task.")

class AutoAssignmentSchema(BaseModel):
    assignments: List[TaskAssignmentItem] = Field(description="List of task assignments recommended by the agent.")


# ---------------------------------------------------------------------------
# Graph Nodes
# ---------------------------------------------------------------------------
async def load_context_node(state: AutoAssignmentState, config: RunnableConfig) -> Dict[str, Any]:
    """Fetch unassigned tasks, member workloads, and task history from PostgreSQL."""
    db = config["configurable"]["db"]
    board_id = state["board_id"]
    workspace_id = state["workspace_id"]

    # 1. Fetch Board Columns to check for active vs completed columns
    cols_stmt = text('SELECT id, name FROM "BoardColumn" WHERE "boardId" = :board_id')
    res_cols = await db.execute(cols_stmt, {"board_id": board_id})
    cols = res_cols.fetchall()
    
    active_col_ids = []
    completed_keywords = {'done', 'completed', 'complete', 'archive', 'archived'}
    for col_id, col_name in cols:
        if (col_name or "").lower().strip() not in completed_keywords:
            active_col_ids.append(col_id)

    # 2. Fetch Workspace Members
    members_stmt = text("""
        SELECT wm.user_id, u.display_name
        FROM "WorkspaceMember" wm
        JOIN "User" u ON wm.user_id = u.id
        WHERE wm.workspace_id = :workspace_id
    """)
    res_members = await db.execute(members_stmt, {"workspace_id": workspace_id})
    members_rows = res_members.fetchall()

    # 3. Fetch Active Tasks on Board (for active workload calculation)
    active_tasks_stmt = text("""
        SELECT ta."userId", t.priority, t."columnId"
        FROM "TaskAssignee" ta
        JOIN "Task" t ON ta."taskId" = t.id
        WHERE t."boardId" = :board_id
    """)
    res_active = await db.execute(active_tasks_stmt, {"board_id": board_id})
    active_rows = res_active.fetchall()

    priority_weights = {"low": 1, "medium": 2, "high": 3, "urgent": 5}
    workload_map = {uid: 0 for uid, _ in members_rows}

    for user_id, priority, col_id in active_rows:
        if col_id in active_col_ids and user_id in workload_map:
            weight = priority_weights.get((priority or "").lower(), 2)
            workload_map[user_id] += weight

    # 4. Fetch Completed Task History in Workspace (for skill profile)
    history_stmt = text("""
        SELECT ta."userId", t.title, t.description, t.priority
        FROM "TaskAssignee" ta
        JOIN "Task" t ON ta."taskId" = t.id
        JOIN "BoardColumn" bc ON t."columnId" = bc.id
        JOIN "Board" b ON bc."boardId" = b.id
        WHERE b."workspaceId" = :workspace_id AND LOWER(bc.name) IN ('done', 'completed', 'complete')
        ORDER BY t."createdAt" DESC
    """)
    res_history = await db.execute(history_stmt, {"workspace_id": workspace_id})
    history_rows = res_history.fetchall()

    history_map = {uid: [] for uid, _ in members_rows}
    for user_id, title, desc, priority in history_rows:
        if user_id in history_map and len(history_map[user_id]) < 8:
            task_desc = f"- Title: {title} (Priority: {priority})"
            if desc:
                task_desc += f", Desc: {desc[:60]}..."
            history_map[user_id].append(task_desc)

    # Compile member context list
    members_list = []
    for user_id, display_name in members_rows:
        hist_text = "\n".join(history_map.get(user_id, []))
        if not hist_text:
            hist_text = "No completed tasks history."
        members_list.append({
            "id": user_id,
            "name": display_name,
            "workload_points": workload_map.get(user_id, 0),
            "history": hist_text
        })

    # 5. Fetch Unassigned Tasks on Board
    unassigned_stmt = text("""
        SELECT t.id, t.title, t.description, t.priority 
        FROM "Task" t
        LEFT JOIN "TaskAssignee" ta ON t.id = ta."taskId"
        WHERE t."boardId" = :board_id AND ta."userId" IS NULL
    """)
    res_unassigned = await db.execute(unassigned_stmt, {"board_id": board_id})
    unassigned_rows = res_unassigned.fetchall()

    unassigned_list = []
    for tid, title, desc, priority in unassigned_rows:
        unassigned_list.append({
            "id": tid,
            "title": title,
            "description": desc or "",
            "priority": (priority or "medium").lower()
        })

    return {
        "unassigned_tasks": unassigned_list,
        "members": members_list,
        "status": "assigning"
    }


async def generate_assignments_node(state: AutoAssignmentState, config: RunnableConfig) -> Dict[str, Any]:
    """Call LLM to propose matching assignments under max capacity constraint."""
    unassigned_tasks = state.get("unassigned_tasks") or []
    members = state.get("members") or []
    max_workload = state.get("max_workload", 10)

    if not unassigned_tasks:
        return {"assignments": {}, "status": "completed"}

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.STRONG_LLM_MODEL,
        temperature=0.1
    )

    tasks_str = ""
    for t in unassigned_tasks:
        tasks_str += f"- Task ID: {t['id']}\n  Title: {t['title']}\n  Description: {t['description']}\n  Priority: {t['priority']}\n\n"

    members_str = ""
    for m in members:
        members_str += f"Member ID: {m['id']}\nName: {m['name']}\nCurrent Active Workload Points: {m['workload_points']}\nCompleted Task History:\n{m['history']}\n\n"

    prompt_template = load_prompt("auto_assign_v1.txt")

    prompt = ChatPromptTemplate.from_messages([
        ("system", prompt_template),
        ("human", "Perform task allocation.")
    ])

    structured_llm = llm.with_structured_output(AutoAssignmentSchema)
    chain = prompt | structured_llm

    result = await chain.ainvoke({
        "max_workload": max_workload,
        "tasks_str": tasks_str,
        "members_str": members_str
    })

    assignments = {item.task_id: item.user_id for item in result.assignments if item.user_id}
    return {
        "assignments": assignments,
        "status": "validating",
        "iteration": 0
    }


async def validate_workload_node(state: AutoAssignmentState) -> Dict[str, Any]:
    """Calculate point allocations and check if any member exceeds point capacity."""
    assignments = state.get("assignments") or {}
    members = state.get("members") or []
    unassigned_tasks = state.get("unassigned_tasks") or []
    max_workload = state.get("max_workload", 10)

    priority_weights = {"low": 1, "medium": 2, "high": 3, "urgent": 5}
    points_map = {m["id"]: m["workload_points"] for m in members}
    task_points = {t["id"]: priority_weights.get(t["priority"], 2) for t in unassigned_tasks}

    for task_id, user_id in assignments.items():
        if user_id and user_id in points_map:
            points_map[user_id] += task_points.get(task_id, 2)

    overloaded = []
    for user_id, pts in points_map.items():
        if pts > max_workload:
            overloaded.append(user_id)

    return {
        "overloaded_members": overloaded,
        "iteration": state.get("iteration", 0) + 1
    }


def route_after_validation(state: AutoAssignmentState) -> str:
    """Determine whether to rebalance or request human approval."""
    overloaded = state.get("overloaded_members") or []
    iteration = state.get("iteration", 0)
    if overloaded and iteration < 3:
        return "rebalance"
    return "ask_human_approval"


async def rebalance_assignments_node(state: AutoAssignmentState, config: RunnableConfig) -> Dict[str, Any]:
    """Call LLM with specialized prompt to shift tasks away from overloaded members."""
    unassigned_tasks = state.get("unassigned_tasks") or []
    members = state.get("members") or []
    max_workload = state.get("max_workload", 10)
    previous_assignments = state.get("assignments") or {}
    overloaded_ids = state.get("overloaded_members") or []

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.STRONG_LLM_MODEL,
        temperature=0.1
    )

    tasks_str = ""
    for t in unassigned_tasks:
        tasks_str += f"- Task ID: {t['id']}\n  Title: {t['title']}\n  Priority: {t['priority']}\n\n"

    members_str = ""
    for m in members:
        members_str += f"Member ID: {m['id']}\nName: {m['name']}\nCurrent Active Workload Points: {m['workload_points']}\nCompleted Task History:\n{m['history']}\n\n"

    overloaded_names = []
    members_map = {m["id"]: m for m in members}
    for uid in overloaded_ids:
        if uid in members_map:
            overloaded_names.append(members_map[uid]["name"])

    prev_assignments_str = "\n".join([f"- Task {tid} assigned to user {uid}" for tid, uid in previous_assignments.items()])

    prompt_template = load_prompt("rebalance_assign_v1.txt")

    prompt = ChatPromptTemplate.from_messages([
        ("system", prompt_template),
        ("human", "Rebalance the task allocations.")
    ])

    structured_llm = llm.with_structured_output(AutoAssignmentSchema)
    chain = prompt | structured_llm

    result = await chain.ainvoke({
        "max_workload": max_workload,
        "overloaded_names": ", ".join(overloaded_names),
        "prev_assignments_str": prev_assignments_str,
        "tasks_str": tasks_str,
        "members_str": members_str
    })

    assignments = {item.task_id: item.user_id for item in result.assignments if item.user_id}
    return {
        "assignments": assignments,
        "status": "validating"
    }


async def ask_human_approval_node(state: AutoAssignmentState) -> Dict[str, Any]:
    """Raise a graph interrupt awaiting human approval/modifications."""
    user_response = interrupt({
        "type": "approval_required",
        "assignments": state["assignments"],
        "overloaded_members": state["overloaded_members"]
    })

    # Expected user response: { "task_id_A": "user_id_X", "task_id_B": "user_id_Y" }
    return {
        "assignments": user_response,
        "status": "completed"
    }


async def commit_assignments_node(state: AutoAssignmentState, config: RunnableConfig) -> Dict[str, Any]:
    """Save finalized task assignments to PostgreSQL database."""
    db = config["configurable"]["db"]
    assignments = state.get("assignments") or {}

    for task_id, user_id in assignments.items():
        if not user_id:
            continue

        # 1. Clean existing assignees for safety
        delete_stmt = text('DELETE FROM "TaskAssignee" WHERE "taskId" = :task_id')
        await db.execute(delete_stmt, {"task_id": task_id})

        # 2. Insert assignee relation
        insert_stmt = text("""
            INSERT INTO "TaskAssignee" ("taskId", "userId", "assignedAt")
            VALUES (:task_id, :user_id, NOW())
        """)
        await db.execute(insert_stmt, {
            "task_id": task_id,
            "user_id": user_id
        })

    await db.commit()
    return {
        "status": "completed"
    }


# ---------------------------------------------------------------------------
# Graph Compilation
# ---------------------------------------------------------------------------
builder = StateGraph(AutoAssignmentState)

# Register nodes
builder.add_node("load_context", load_context_node)
builder.add_node("generate_assignments", generate_assignments_node)
builder.add_node("validate_workload", validate_workload_node)
builder.add_node("rebalance", rebalance_assignments_node)
builder.add_node("ask_human_approval", ask_human_approval_node)
builder.add_node("commit_assignments", commit_assignments_node)

# Set edges flow
builder.add_edge(START, "load_context")
builder.add_edge("load_context", "generate_assignments")
builder.add_edge("generate_assignments", "validate_workload")

builder.add_conditional_edges(
    "validate_workload",
    route_after_validation,
    {
        "rebalance": "rebalance",
        "ask_human_approval": "ask_human_approval"
    }
)

builder.add_edge("rebalance", "validate_workload")
builder.add_edge("ask_human_approval", "commit_assignments")
builder.add_edge("commit_assignments", END)

workflow = builder
