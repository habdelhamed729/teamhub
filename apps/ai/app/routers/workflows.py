from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List, Optional
import uuid

from app.database import get_db, async_session
from app.utils.auth import verify_service_token
from app.workflows.checkpointer import SQLAlchemyCheckpointSaver
from app.workflows.document_tasks import workflow
from app.workflows.auto_assigner import workflow as auto_assign_workflow
from langgraph.types import Command

class StartAutoAssignRequest(BaseModel):
    board_id: str
    max_workload: Optional[int] = 10

class ResumeAutoAssignRequest(BaseModel):
    thread_id: str
    assignments: Dict[str, str]

router = APIRouter(prefix="/workflows", tags=["workflows"])

class StartDocumentTasksRequest(BaseModel):
    document_id: str

class ResumeDocumentTasksRequest(BaseModel):
    thread_id: str
    payload: Dict[str, Any]

@router.post(
    "/document-tasks/start",
    status_code=status.HTTP_200_OK,
    summary="Start a document tasks extraction workflow"
)
async def start_document_tasks(
    request: StartDocumentTasksRequest,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db)
):
    thread_id = str(uuid.uuid4())
    config = {
        "configurable": {
            "thread_id": thread_id,
            "db": db,
            "user_id": context["user_id"]
        }
    }

    checkpointer = SQLAlchemyCheckpointSaver(async_session)
    compiled_graph = workflow.compile(checkpointer=checkpointer)

    initial_state = {
        "workspace_id": context["workspace_id"],
        "document_id": request.document_id,
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

    try:
        final_state = await compiled_graph.ainvoke(initial_state, config)
        
        # Check if the graph was interrupted (LangGraph returns normally on interrupts)
        state_info = await compiled_graph.aget_state(config)
        if state_info.next:
            await db.commit()
            values = state_info.values
            interrupts = [task.interrupts for task in state_info.tasks if task.interrupts]
            active_interrupt = interrupts[0][0] if interrupts else None
            interrupt_val = active_interrupt.value if hasattr(active_interrupt, "value") else active_interrupt

            return {
                "thread_id": thread_id,
                "workspace_id": values.get("workspace_id"),
                "status": values.get("status"),
                "next_step": list(state_info.next),
                "interrupt": interrupt_val,
                "ambiguous_tasks": values.get("ambiguous_tasks", []),
                "task_drafts": values.get("task_drafts", [])
            }

        await db.commit()
        return {
            "thread_id": thread_id,
            "workspace_id": final_state.get("workspace_id"),
            "status": final_state.get("status", "completed"),
            "created_task_ids": final_state.get("created_task_ids", []),
            "task_drafts": final_state.get("task_drafts", []),
            "ambiguous_tasks": []
        }
    except Exception as e:
        # Check if state is interrupted (HITL)
        state_info = await compiled_graph.aget_state(config)
        if state_info.next:
            await db.commit()
            values = state_info.values
            interrupts = [task.interrupts for task in state_info.tasks if task.interrupts]
            active_interrupt = interrupts[0][0] if interrupts else None

            # Unpack interrupt values if they are a list/tuple
            interrupt_val = active_interrupt.value if hasattr(active_interrupt, "value") else active_interrupt

            return {
                "thread_id": thread_id,
                "workspace_id": values.get("workspace_id"),
                "status": values.get("status"),
                "next_step": list(state_info.next),
                "interrupt": interrupt_val,
                "ambiguous_tasks": values.get("ambiguous_tasks", []),
                "task_drafts": values.get("task_drafts", [])
            }
        else:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Workflow execution failed: {str(e)}"
            )

@router.post(
    "/document-tasks/resume",
    status_code=status.HTTP_200_OK,
    summary="Resume a paused document tasks workflow thread"
)
async def resume_document_tasks(
    request: ResumeDocumentTasksRequest,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db)
):
    thread_id = request.thread_id
    config = {
        "configurable": {
            "thread_id": thread_id,
            "db": db,
            "user_id": context["user_id"]
        }
    }

    checkpointer = SQLAlchemyCheckpointSaver(async_session)
    compiled_graph = workflow.compile(checkpointer=checkpointer)

    try:
        # Resume the workflow using the Command resume payload
        final_state = await compiled_graph.ainvoke(Command(resume=request.payload), config)
        
        # Check if the graph was interrupted again
        state_info = await compiled_graph.aget_state(config)
        if state_info.next:
            await db.commit()
            values = state_info.values
            interrupts = [task.interrupts for task in state_info.tasks if task.interrupts]
            active_interrupt = interrupts[0][0] if interrupts else None
            interrupt_val = active_interrupt.value if hasattr(active_interrupt, "value") else active_interrupt

            return {
                "thread_id": thread_id,
                "workspace_id": values.get("workspace_id"),
                "status": values.get("status"),
                "next_step": list(state_info.next),
                "interrupt": interrupt_val,
                "ambiguous_tasks": values.get("ambiguous_tasks", []),
                "task_drafts": values.get("task_drafts", [])
            }

        await db.commit()
        return {
            "thread_id": thread_id,
            "workspace_id": final_state.get("workspace_id"),
            "status": final_state.get("status", "completed"),
            "created_task_ids": final_state.get("created_task_ids", []),
            "task_drafts": final_state.get("task_drafts", []),
            "ambiguous_tasks": []
        }
    except Exception as e:
        state_info = await compiled_graph.aget_state(config)
        if state_info.next:
            await db.commit()
            values = state_info.values
            interrupts = [task.interrupts for task in state_info.tasks if task.interrupts]
            active_interrupt = interrupts[0][0] if interrupts else None
            
            interrupt_val = active_interrupt.value if hasattr(active_interrupt, "value") else active_interrupt

            return {
                "thread_id": thread_id,
                "workspace_id": values.get("workspace_id"),
                "status": values.get("status"),
                "next_step": list(state_info.next),
                "interrupt": interrupt_val,
                "ambiguous_tasks": values.get("ambiguous_tasks", []),
                "task_drafts": values.get("task_drafts", [])
            }
        else:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to resume workflow: {str(e)}"
            )

@router.get(
    "/threads/{thread_id}/state",
    status_code=status.HTTP_200_OK,
    summary="Get the current execution state of a workflow thread"
)
async def get_workflow_state(
    thread_id: str,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db)
):
    config = {
        "configurable": {
            "thread_id": thread_id,
            "db": db,
            "user_id": context["user_id"]
        }
    }

    checkpointer = SQLAlchemyCheckpointSaver(async_session)
    
    # Try document tasks first
    compiled_graph = workflow.compile(checkpointer=checkpointer)
    state_info = await compiled_graph.aget_state(config)
    is_auto_assign = False

    # If state_info has no values, or if values doesn't contain 'document_id', try auto-assign
    if not state_info or not state_info.values or "document_id" not in state_info.values:
        compiled_graph = auto_assign_workflow.compile(checkpointer=checkpointer)
        state_info = await compiled_graph.aget_state(config)
        is_auto_assign = True

    if not state_info or not state_info.values:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow state thread not found"
        )

    values = state_info.values
    interrupts = [task.interrupts for task in state_info.tasks if task.interrupts]
    active_interrupt = interrupts[0][0] if interrupts else None
    
    interrupt_val = active_interrupt.value if hasattr(active_interrupt, "value") else active_interrupt

    if is_auto_assign:
        return {
            "thread_id": thread_id,
            "workspace_id": values.get("workspace_id"),
            "board_id": values.get("board_id"),
            "status": values.get("status"),
            "next_step": list(state_info.next),
            "interrupt": interrupt_val,
            "assignments": values.get("assignments", {}),
            "overloaded_members": values.get("overloaded_members", []),
            "unassigned_tasks": values.get("unassigned_tasks", []),
            "members": values.get("members", [])
        }
    else:
        return {
            "thread_id": thread_id,
            "workspace_id": values.get("workspace_id"),
            "status": values.get("status"),
            "next_step": list(state_info.next),
            "interrupt": interrupt_val,
            "ambiguous_tasks": values.get("ambiguous_tasks", []),
            "task_drafts": values.get("task_drafts", [])
        }

@router.post(
    "/auto-assign/start",
    status_code=status.HTTP_200_OK,
    summary="Start a board auto-assignment optimization workflow"
)
async def start_auto_assign(
    request: StartAutoAssignRequest,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db)
):
    thread_id = str(uuid.uuid4())
    config = {
        "configurable": {
            "thread_id": thread_id,
            "db": db,
            "user_id": context["user_id"]
        }
    }

    checkpointer = SQLAlchemyCheckpointSaver(async_session)
    compiled_graph = auto_assign_workflow.compile(checkpointer=checkpointer)

    initial_state = {
        "workspace_id": context["workspace_id"],
        "board_id": request.board_id,
        "max_workload": request.max_workload or 10,
        "unassigned_tasks": [],
        "members": [],
        "assignments": {},
        "overloaded_members": [],
        "status": "loading",
        "iteration": 0
    }

    try:
        final_state = await compiled_graph.ainvoke(initial_state, config)
        
        state_info = await compiled_graph.aget_state(config)
        if state_info.next:
            await db.commit()
            values = state_info.values
            interrupts = [task.interrupts for task in state_info.tasks if task.interrupts]
            active_interrupt = interrupts[0][0] if interrupts else None
            interrupt_val = active_interrupt.value if hasattr(active_interrupt, "value") else active_interrupt

            return {
                "thread_id": thread_id,
                "workspace_id": values.get("workspace_id"),
                "board_id": values.get("board_id"),
                "status": values.get("status"),
                "next_step": list(state_info.next),
                "interrupt": interrupt_val,
                "assignments": values.get("assignments", {}),
                "overloaded_members": values.get("overloaded_members", []),
                "unassigned_tasks": values.get("unassigned_tasks", []),
                "members": values.get("members", [])
            }

        await db.commit()
        return {
            "thread_id": thread_id,
            "workspace_id": final_state.get("workspace_id"),
            "board_id": final_state.get("board_id"),
            "status": final_state.get("status", "completed"),
            "assignments": final_state.get("assignments", {}),
            "unassigned_tasks": [],
            "members": []
        }
    except Exception as e:
        state_info = await compiled_graph.aget_state(config)
        if state_info.next:
            await db.commit()
            values = state_info.values
            interrupts = [task.interrupts for task in state_info.tasks if task.interrupts]
            active_interrupt = interrupts[0][0] if interrupts else None
            interrupt_val = active_interrupt.value if hasattr(active_interrupt, "value") else active_interrupt

            return {
                "thread_id": thread_id,
                "workspace_id": values.get("workspace_id"),
                "board_id": values.get("board_id"),
                "status": values.get("status"),
                "next_step": list(state_info.next),
                "interrupt": interrupt_val,
                "assignments": values.get("assignments", {}),
                "overloaded_members": values.get("overloaded_members", []),
                "unassigned_tasks": values.get("unassigned_tasks", []),
                "members": values.get("members", [])
            }
        else:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Auto-assignment failed to start: {str(e)}"
            )

@router.post(
    "/auto-assign/resume",
    status_code=status.HTTP_200_OK,
    summary="Resume a paused auto-assignment workflow thread with approved/edited assignments"
)
async def resume_auto_assign(
    request: ResumeAutoAssignRequest,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db)
):
    thread_id = request.thread_id
    config = {
        "configurable": {
            "thread_id": thread_id,
            "db": db,
            "user_id": context["user_id"]
        }
    }

    checkpointer = SQLAlchemyCheckpointSaver(async_session)
    compiled_graph = auto_assign_workflow.compile(checkpointer=checkpointer)

    try:
        final_state = await compiled_graph.ainvoke(Command(resume=request.assignments), config)
        
        state_info = await compiled_graph.aget_state(config)
        if state_info.next:
            await db.commit()
            values = state_info.values
            interrupts = [task.interrupts for task in state_info.tasks if task.interrupts]
            active_interrupt = interrupts[0][0] if interrupts else None
            interrupt_val = active_interrupt.value if hasattr(active_interrupt, "value") else active_interrupt

            return {
                "thread_id": thread_id,
                "workspace_id": values.get("workspace_id"),
                "board_id": values.get("board_id"),
                "status": values.get("status"),
                "next_step": list(state_info.next),
                "interrupt": interrupt_val,
                "assignments": values.get("assignments", {}),
                "overloaded_members": values.get("overloaded_members", []),
                "unassigned_tasks": values.get("unassigned_tasks", []),
                "members": values.get("members", [])
            }

        await db.commit()
        return {
            "thread_id": thread_id,
            "workspace_id": final_state.get("workspace_id"),
            "board_id": final_state.get("board_id"),
            "status": final_state.get("status", "completed"),
            "assignments": final_state.get("assignments", {}),
            "unassigned_tasks": [],
            "members": []
        }
    except Exception as e:
        state_info = await compiled_graph.aget_state(config)
        if state_info.next:
            await db.commit()
            values = state_info.values
            interrupts = [task.interrupts for task in state_info.tasks if task.interrupts]
            active_interrupt = interrupts[0][0] if interrupts else None
            interrupt_val = active_interrupt.value if hasattr(active_interrupt, "value") else active_interrupt

            return {
                "thread_id": thread_id,
                "workspace_id": values.get("workspace_id"),
                "board_id": values.get("board_id"),
                "status": values.get("status"),
                "next_step": list(state_info.next),
                "interrupt": interrupt_val,
                "assignments": values.get("assignments", {}),
                "overloaded_members": values.get("overloaded_members", []),
                "unassigned_tasks": values.get("unassigned_tasks", []),
                "members": values.get("members", [])
            }
        else:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Auto-assignment failed to resume: {str(e)}"
            )

