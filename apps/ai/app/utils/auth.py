from fastapi import Header, HTTPException, status
from app.config import settings

async def verify_service_token(
    x_service_token: str = Header(..., alias="X-Service-Token"),
    x_workspace_id: str = Header(..., alias="X-Workspace-Id"),
    x_user_id: str = Header(..., alias="X-User-Id"),
) -> dict:
    """Verify the internal service token sent by the Node API."""
    if x_service_token != settings.AI_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service token",
        )
    return {
        "workspace_id": x_workspace_id,
        "user_id": x_user_id,
    }
