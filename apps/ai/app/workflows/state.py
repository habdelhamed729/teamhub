from typing import TypedDict, List, Dict, Optional, Any

class DocumentTasksState(TypedDict):
    workspace_id: str
    document_id: str
    document_text: Optional[str]
    extracted_tasks: List[Dict[str, Any]]
    ambiguous_tasks: List[Dict[str, Any]]
    human_clarification: Dict[str, Any]  # Stored as string-keyed dict (e.g. "0": "response") for JSON serialization compat
    matched_owners: Dict[str, Any]
    task_drafts: List[Dict[str, Any]]
    board_id: Optional[str]
    new_board_name: Optional[str]
    created_task_ids: List[str]
    status: str  # 'extracting' | 'clarifying' | 'matching' | 'approving' | 'completed'

class AutoAssignmentState(TypedDict):
    workspace_id: str
    board_id: str
    max_workload: int
    unassigned_tasks: List[Dict[str, Any]]
    members: List[Dict[str, Any]]
    assignments: Dict[str, str]  # taskId -> userId
    overloaded_members: List[str]
    status: str  # 'loading' | 'assigning' | 'validating' | 'completed'
    iteration: int
