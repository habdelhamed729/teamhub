import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt
from sqlalchemy import text

from app.config import settings
from app.embeddings.parsers import parse_tiptap_document
from app.prompts.loader import load_prompt
from app.workflows.state import DocumentTasksState

# ---------------------------------------------------------------------------
# Structured LLM Output Schemas
# ---------------------------------------------------------------------------
class ExtractedTask(BaseModel):
    title: str = Field(description="A concise summary of the task to be done.")
    description: Optional[str] = Field(None, description="Detailed description of the task, context, and what constitutes completion.")
    assignee_raw: Optional[str] = Field(None, description="The name or pronoun of the person or team assigned to this task, as mentioned in the text (e.g. 'Mazen', 'Hassan', 'everybody', 'someone').")
    priority: str = Field(description="The priority of the task: must be one of 'low', 'medium', 'high', 'urgent'. Default to 'medium' if unclear.")
    due_date: Optional[str] = Field(None, description="The deadline or target completion date if mentioned, formatted as YYYY-MM-DD or None.")

class ExtractedTasksSchema(BaseModel):
    tasks: List[ExtractedTask] = Field(description="A list of tasks extracted from the document.")


# ---------------------------------------------------------------------------
# Rule-based Ambiguity Helper
# ---------------------------------------------------------------------------
def identify_ambiguity(task: Dict[str, Any]) -> List[str]:
    reasons = []
    assignee = (task.get("assignee_raw") or "").strip().lower()
    due_date = (task.get("due_date") or "").strip().lower()
    title = (task.get("title") or "").strip()

    # Vague assignees
    vague_assignees = {"someone", "anyone", "anybody", "team", "everybody", "everyone", "us", "devs", "designer", "qa", "member"}
    if not assignee:
        reasons.append("Assignee is missing.")
    elif assignee in vague_assignees:
        reasons.append(f"Assignee '{task['assignee_raw']}' is vague/unspecified.")

    # Vague due dates
    vague_dates = {"soon", "asap", "later", "someday", "next week", "this month"}
    if due_date in vague_dates:
        reasons.append(f"Due date '{task['due_date']}' is vague.")
    
    if len(title) < 4:
        reasons.append("Task title is too short or lacks description.")

    return reasons


# ---------------------------------------------------------------------------
# Graph Nodes
# ---------------------------------------------------------------------------
async def read_document_node(state: DocumentTasksState, config: RunnableConfig) -> Dict[str, Any]:
    """Fetch the document from the PostgreSQL database and parse TipTap content to text."""
    db = config["configurable"]["db"]
    document_id = state["document_id"]
    workspace_id = state["workspace_id"]

    stmt = text(
        'SELECT content FROM "Document" '
        'WHERE id = :doc_id AND workspace_id = :workspace_id AND is_archived = false'
    )
    res = await db.execute(stmt, {"doc_id": document_id, "workspace_id": workspace_id})
    row = res.fetchone()
    
    if not row:
        raise ValueError(f"Document {document_id} not found in workspace {workspace_id}")

    content_json = row[0]
    parsed_text = parse_tiptap_document(content_json).strip()
    
    return {
        "document_text": parsed_text,
        "status": "extracting"
    }


async def extract_tasks_node(state: DocumentTasksState, config: RunnableConfig) -> Dict[str, Any]:
    """Send document text to LLM and parse structured task details."""
    text_content = state.get("document_text") or ""
    if not text_content:
        return {"extracted_tasks": []}

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.STRONG_LLM_MODEL,
        temperature=0.1
    )

    system_prompt = load_prompt("extract_actions_v1.txt")
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Extract tasks from this document content:\n\n{text}")
    ])

    structured_llm = llm.with_structured_output(ExtractedTasksSchema)
    chain = prompt | structured_llm

    result = await chain.ainvoke({"text": text_content})
    tasks = [task.model_dump() for task in result.tasks]

    return {"extracted_tasks": tasks}


async def check_ambiguity_node(state: DocumentTasksState) -> Dict[str, Any]:
    """Scan all extracted tasks and compile items needing clarification."""
    tasks = state.get("extracted_tasks") or []
    ambiguous = []

    for idx, task in enumerate(tasks):
        reasons = identify_ambiguity(task)
        if reasons:
            ambiguous.append({
                "index": str(idx),
                "task": task,
                "reasons": reasons
            })

    return {
        "ambiguous_tasks": ambiguous,
        "status": "clarifying" if ambiguous else "matching"
    }


def route_after_ambiguity(state: DocumentTasksState) -> str:
    """Branch checking if human clarification is needed."""
    if state.get("ambiguous_tasks"):
        return "ask_human_clarification"
    return "detect_owners"


async def ask_human_clarification_node(state: DocumentTasksState) -> Dict[str, Any]:
    """Raise a graph interrupt awaiting human clarification for ambiguous tasks."""
    user_response = interrupt({
        "type": "clarification_required",
        "ambiguous_tasks": state["ambiguous_tasks"]
    })

    # When resumed, user_response maps index string to updated properties:
    # { "0": { "assignee_raw": "Mazen", "due_date": "2026-06-15" } }
    updated_tasks = list(state.get("extracted_tasks") or [])
    for idx_str, updates in user_response.items():
        try:
            idx = int(idx_str)
            if 0 <= idx < len(updated_tasks):
                for key, val in updates.items():
                    if val is not None:
                        updated_tasks[idx][key] = val
        except Exception:
            pass

    return {
        "extracted_tasks": updated_tasks,
        "ambiguous_tasks": [],  # Clear ambiguity after clarification
        "status": "matching"
    }


async def detect_owners_node(state: DocumentTasksState, config: RunnableConfig) -> Dict[str, Any]:
    """Query workspace members and run semantic/string matching to link assignee strings to database users."""
    db = config["configurable"]["db"]
    workspace_id = state["workspace_id"]
    tasks = state.get("extracted_tasks") or []

    # Get workspace members
    stmt = text("""
        SELECT u.id, u.display_name, u.email 
        FROM "User" u
        JOIN "WorkspaceMember" wm ON u.id = wm.user_id
        WHERE wm.workspace_id = :workspace_id
    """)
    res = await db.execute(stmt, {"workspace_id": workspace_id})
    members = [{"id": str(row[0]), "display_name": row[1], "email": row[2]} for row in res.fetchall()]

    matched_owners = {}
    for idx, task in enumerate(tasks):
        assignee_raw = (task.get("assignee_raw") or "").strip().lower()
        if not assignee_raw:
            continue

        matched_id = None
        # Try exact matching on email or display name first
        for m in members:
            disp = m["display_name"].lower()
            email = m["email"].lower()
            if assignee_raw == disp or assignee_raw == email:
                matched_id = m["id"]
                break
        
        # Try prefix/substring matching if no exact match
        if not matched_id:
            for m in members:
                disp = m["display_name"].lower()
                if assignee_raw in disp or disp in assignee_raw:
                    matched_id = m["id"]
                    break

        if matched_id:
            matched_owners[str(idx)] = matched_id

    return {
        "matched_owners": matched_owners,
        "status": "approving"
    }


async def draft_tasks_node(state: DocumentTasksState) -> Dict[str, Any]:
    """Combine tasks and owner resolutions to compile the final task drafts list."""
    tasks = state.get("extracted_tasks") or []
    matched = state.get("matched_owners") or {}

    task_drafts = []
    for idx, task in enumerate(tasks):
        assignee_id = matched.get(str(idx))
        task_drafts.append({
            "title": task["title"],
            "description": task.get("description"),
            "assignee_id": assignee_id,
            "priority": task.get("priority", "medium").lower(),
            "due_date": task.get("due_date")
        })

    return {"task_drafts": task_drafts}


async def ask_board_and_approval_node(state: DocumentTasksState) -> Dict[str, Any]:
    """Raise graph interrupt requesting board configuration and final user edits/approvals."""
    approval_response = interrupt({
        "type": "approval_required",
        "task_drafts": state["task_drafts"]
    })

    # When resumed, approval_response contains:
    # { "board_id": "...", "new_board_name": "...", "approved_tasks": [...] }
    board_id = approval_response.get("board_id")
    new_board_name = approval_response.get("new_board_name")
    approved_tasks = approval_response.get("approved_tasks") or []

    return {
        "board_id": board_id,
        "new_board_name": new_board_name,
        "task_drafts": approved_tasks,
    }


async def create_tasks_node(state: DocumentTasksState, config: RunnableConfig) -> Dict[str, Any]:
    """Commit the approved drafts to PostgreSQL, creating board/ToDo columns as needed."""
    db = config["configurable"]["db"]
    creator_id = config["configurable"]["user_id"]
    workspace_id = state["workspace_id"]

    board_id = state.get("board_id")
    new_board_name = state.get("new_board_name")
    drafts = state.get("task_drafts") or []

    # 1. Resolve Board ID (create new board if name specified)
    if not board_id and new_board_name:
        board_id = str(uuid.uuid4())
        insert_board_stmt = text("""
            INSERT INTO "Board" (id, "workspaceId", name, description, "createdAt", "updatedAt")
            VALUES (:id, :workspace_id, :name, :description, NOW(), NOW())
        """)
        await db.execute(insert_board_stmt, {
            "id": board_id,
            "workspace_id": workspace_id,
            "name": new_board_name,
            "description": "Created automatically via AI task extraction"
        })

    if not board_id:
        raise ValueError("Either board_id or new_board_name must be supplied to commit tasks.")

    # 2. Find or Create "To Do" Column on target Board
    col_stmt = text("""
        SELECT id FROM "BoardColumn"
        WHERE "boardId" = :board_id AND LOWER(name) IN ('to do', 'todo', 'to-do')
        ORDER BY "order" ASC
        LIMIT 1
    """)
    res = await db.execute(col_stmt, {"board_id": board_id})
    row = res.fetchone()
    column_id = str(row[0]) if row else None

    if not column_id:
        column_id = str(uuid.uuid4())
        # Calculate new order value
        order_stmt = text('SELECT COALESCE(MAX("order"), -1) FROM "BoardColumn" WHERE "boardId" = :board_id')
        res_order = await db.execute(order_stmt, {"board_id": board_id})
        max_order = res_order.scalar()
        new_order = max_order + 1

        insert_col_stmt = text("""
            INSERT INTO "BoardColumn" (id, "boardId", name, "order", "createdAt", "updatedAt")
            VALUES (:id, :board_id, :name, :order, NOW(), NOW())
        """)
        await db.execute(insert_col_stmt, {
            "id": column_id,
            "board_id": board_id,
            "name": "To Do",
            "order": new_order
        })

    # 3. Create Tasks and TaskAssignees
    created_ids = []
    
    # Calculate starting order for tasks
    order_stmt = text('SELECT COALESCE(MAX("order"), -1) FROM "Task" WHERE "columnId" = :column_id')
    res_order = await db.execute(order_stmt, {"column_id": column_id})
    start_order = res_order.scalar() + 1

    for idx, draft in enumerate(drafts):
        task_id = str(uuid.uuid4())
        title = draft["title"]
        description = draft.get("description") or ""
        priority = draft.get("priority", "medium")
        if priority not in ["low", "medium", "high", "urgent"]:
            priority = "medium"

        # Resolve due date string to datetime if provided
        due_date_dt = None
        due_date_str = draft.get("due_date")
        if due_date_str:
            try:
                due_date_dt = datetime.strptime(due_date_str, "%Y-%m-%d")
            except Exception:
                pass

        insert_task_stmt = text("""
            INSERT INTO "Task" (id, "columnId", "boardId", "creatorId", title, description, priority, "order", "dueDate", "createdAt", "updatedAt")
            VALUES (:id, :column_id, :board_id, :creator_id, :title, :description, :priority, :order, :due_date, NOW(), NOW())
        """)
        await db.execute(insert_task_stmt, {
            "id": task_id,
            "column_id": column_id,
            "board_id": board_id,
            "creator_id": creator_id,
            "title": title,
            "description": description,
            "priority": priority,
            "order": start_order + idx,
            "due_date": due_date_dt
        })

        # Insert Assignee
        assignee_id = draft.get("assignee_id")
        if assignee_id:
            insert_assignee_stmt = text("""
                INSERT INTO "TaskAssignee" ("taskId", "userId", "assignedAt")
                VALUES (:task_id, :user_id, NOW())
            """)
            await db.execute(insert_assignee_stmt, {"task_id": task_id, "user_id": assignee_id})

        created_ids.append(task_id)

    # Commit everything
    await db.commit()

    return {
        "created_task_ids": created_ids,
        "status": "completed"
    }


# ---------------------------------------------------------------------------
# Construct the StateGraph
# ---------------------------------------------------------------------------
workflow = StateGraph(DocumentTasksState)

# Register nodes
workflow.add_node("read_document", read_document_node)
workflow.add_node("extract_tasks", extract_tasks_node)
workflow.add_node("check_ambiguity", check_ambiguity_node)
workflow.add_node("ask_human_clarification", ask_human_clarification_node)
workflow.add_node("detect_owners", detect_owners_node)
workflow.add_node("draft_tasks", draft_tasks_node)
workflow.add_node("ask_board_and_approval", ask_board_and_approval_node)
workflow.add_node("create_tasks", create_tasks_node)

# Map edge connections
workflow.add_edge(START, "read_document")
workflow.add_edge("read_document", "extract_tasks")
workflow.add_edge("extract_tasks", "check_ambiguity")

workflow.add_conditional_edges(
    "check_ambiguity",
    route_after_ambiguity,
    {
        "ask_human_clarification": "ask_human_clarification",
        "detect_owners": "detect_owners"
    }
)

workflow.add_edge("ask_human_clarification", "detect_owners")
workflow.add_edge("detect_owners", "draft_tasks")
workflow.add_edge("draft_tasks", "ask_board_and_approval")
workflow.add_edge("ask_board_and_approval", "create_tasks")
workflow.add_edge("create_tasks", END)
