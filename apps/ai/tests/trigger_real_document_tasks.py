import sys
import asyncio
import uuid
from datetime import datetime
from sqlalchemy import text

from app.database import async_session
from app.workflows.checkpointer import SQLAlchemyCheckpointSaver
from app.workflows.document_tasks import workflow
from langgraph.types import Command

async def get_real_context():
    """Find a non-archived document and a matching workspace user in the database."""
    async with async_session() as session:
        # 1. Fetch first active document
        doc_stmt = text('SELECT id, workspace_id, title FROM "Document" WHERE is_archived = false LIMIT 1')
        doc_res = await session.execute(doc_stmt)
        doc = doc_res.fetchone()
        
        if not doc:
            return None, None, None, None
            
        doc_id = uuid.UUID(doc[0])
        workspace_id = uuid.UUID(doc[1])
        doc_title = doc[2]
        
        # 2. Fetch a user ID in the same workspace to act as the task creator
        member_stmt = text('SELECT user_id FROM "WorkspaceMember" WHERE workspace_id = :ws_id LIMIT 1')
        member_res = await session.execute(member_stmt, {"ws_id": str(workspace_id)})
        member = member_res.fetchone()
        
        user_id = uuid.UUID(member[0]) if member else None
        
        return doc_id, workspace_id, doc_title, user_id

async def run_interactive_workflow():
    print("=" * 60)
    print("INTERACTIVE LANGGRAPH WORKFLOW TESTER")
    print("=" * 60)
    
    # 1. Load context
    doc_id, workspace_id, doc_title, user_id = await get_real_context()
    if not doc_id:
        print("\n[Error] No active non-archived documents found in your database.")
        print("Please create a document in the TeamHub frontend first before running this test.")
        return
        
    if not user_id:
        print(f"\n[Error] Found document '{doc_title}' but no workspace members found for workspace '{workspace_id}'.")
        return

    print(f"\nDocument Title:   '{doc_title}' (ID: {doc_id})")
    print(f"Workspace ID:     {workspace_id}")
    print(f"Actor (User ID):  {user_id}")
    
    # 2. Compile Graph
    thread_id = str(uuid.uuid4())
    print(f"Generated Thread ID: {thread_id}")
    
    async with async_session() as session:
        checkpointer = SQLAlchemyCheckpointSaver(async_session)
        compiled_graph = workflow.compile(checkpointer=checkpointer)
        
        config = {
            "configurable": {
                "thread_id": thread_id,
                "db": session,
                "user_id": str(user_id)
            }
        }
        
        initial_state = {
            "workspace_id": str(workspace_id),
            "document_id": str(doc_id),
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
        
        # 3. Start Graph Execution
        print("\n--> Starting graph execution (ainvoke)...")
        await compiled_graph.ainvoke(initial_state, config)
        await session.commit()
        
        # Check if we hit an interrupt
        state_info = await compiled_graph.aget_state(config)
        
        # --- INTERRUPT CYCLE 1: Human Clarification ---
        if "ask_human_clarification" in state_info.next:
            print("\n" + "!" * 50)
            print("INTERRUPT: AI needs human clarification for ambiguous tasks!")
            print("!" * 50)
            
            ambiguous_tasks = state_info.values.get("ambiguous_tasks") or []
            clarification_payload = {}
            
            for item in ambiguous_tasks:
                idx = item["index"]
                task = item["task"]
                reasons = item["reasons"]
                
                print(f"\nTask Index {idx}: '{task['title']}'")
                print(f"  Description: {task.get('description')}")
                print(f"  Vague fields: {', '.join(reasons)}")
                
                print("Please clarify:")
                assignee_raw = input(f"  Assignee Name (current: '{task.get('assignee_raw')}'): ").strip()
                due_date = input(f"  Due Date (YYYY-MM-DD) (current: '{task.get('due_date')}'): ").strip()
                
                clarification_payload[idx] = {
                    "assignee_raw": assignee_raw if assignee_raw else task.get("assignee_raw"),
                    "due_date": due_date if due_date else task.get("due_date")
                }
            
            print("\n--> Resuming graph execution with human clarifications...")
            # Commit the session edits to save checkpoint before calling resume
            await session.commit()
            await compiled_graph.ainvoke(Command(resume=clarification_payload), config)
            await session.commit()
            state_info = await compiled_graph.aget_state(config)

        # --- INTERRUPT CYCLE 2: Board Selection & Approval ---
        if "ask_board_and_approval" in state_info.next:
            print("\n" + "!" * 50)
            print("INTERRUPT: Awaiting board selection & draft approvals!")
            print("!" * 50)
            
            drafts = state_info.values.get("task_drafts") or []
            print(f"\nExtracted Task Drafts ({len(drafts)}):")
            for idx, d in enumerate(drafts):
                print(f"  {idx + 1}. Title:       {d['title']}")
                print(f"     Description: {d.get('description')}")
                print(f"     Assignee ID: {d.get('assignee_id')}")
                print(f"     Priority:    {d['priority']}")
                print(f"     Due Date:    {d.get('due_date')}")
                print("-" * 30)

            # Query existing boards
            board_stmt = text('SELECT id, name FROM "Board" WHERE "workspaceId" = :ws_id')
            board_res = await session.execute(board_stmt, {"ws_id": str(workspace_id)})
            boards = board_res.fetchall()
            
            print("\nTarget Boards:")
            for i, b in enumerate(boards):
                print(f"  [{i}] {b[1]} (ID: {b[0]})")
            print("  [N] Create a New Board")
            
            board_choice = input("\nSelect Board Index or type 'N': ").strip()
            
            board_id = None
            new_board_name = None
            
            if board_choice.upper() == 'N':
                new_board_name = input("Enter new board name: ").strip()
                if not new_board_name:
                    new_board_name = "New Board (AI Tasks)"
            else:
                try:
                    idx = int(board_choice)
                    if 0 <= idx < len(boards):
                        board_id = boards[idx][0]
                except ValueError:
                    pass
                    
            if not board_id and not new_board_name:
                # Default to first board if available
                if boards:
                    board_id = boards[0][0]
                    print(f"No valid board chosen. Defaulting to first board: '{boards[0][1]}'")
                else:
                    new_board_name = "AI Task Board"
                    print("No boards exist. Creating new board: 'AI Task Board'")

            confirm = input("\nType 'approve' to commit and create tasks: ").strip().lower()
            if confirm != "approve":
                print("Cancelled task creation.")
                return

            approval_payload = {
                "board_id": board_id,
                "new_board_name": new_board_name,
                "approved_tasks": drafts
            }

            print("\n--> Committing tasks to Kanban board...")
            await session.commit()
            final_state = await compiled_graph.ainvoke(Command(resume=approval_payload), config)
            await session.commit()
            
            print("\n" + "=" * 50)
            print("SUCCESS: Graph completed execution!")
            print("=" * 50)
            print(f"Status:             {final_state.get('status')}")
            print(f"Created Task Count: {len(final_state.get('created_task_ids') or [])}")
            print(f"Task IDs:           {', '.join(final_state.get('created_task_ids') or [])}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')
        
    asyncio.run(run_interactive_workflow())
