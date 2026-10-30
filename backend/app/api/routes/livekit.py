
from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from livekit import api
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.models.meeting import Meeting
from app.models.user import User
from app.models.workspace_member import WorkspaceMember



router = APIRouter(prefix="/workspaces", tags=["LiveKit"])

TOKEN_TTL_MINUTES = 30


class LiveKitJoinResponse(BaseModel):
    server_url: str
    token: str
    room_name: str
    participant_identity: str
    expires_in_seconds: int


@router.post(
    "/{workspace_id}/meetings/{meeting_id}/join",
    response_model=LiveKitJoinResponse,
)
def join_meeting(
    workspace_id: UUID,
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LiveKitJoinResponse:
    settings = get_settings()

    if not all(
        [
            settings.livekit_url,
            settings.livekit_api_key,
            settings.livekit_api_secret,
        ]
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LiveKit is not configured on the server",
        )

    membership = db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id,
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    meeting = db.scalar(
        select(Meeting).where(
            Meeting.id == meeting_id,
            Meeting.workspace_id == workspace_id,
        )
    )

    if meeting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    if meeting.status not in {"scheduled", "in_progress"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This meeting cannot be joined",
        )

    # Use opaque IDs for LiveKit identity and room name.
    room_name = f"meetorbit-{meeting.id}"
    participant_identity = str(current_user.id)

    try:
        token = (
            api.AccessToken(
                settings.livekit_api_key,
                settings.livekit_api_secret,
            )
            .with_identity(participant_identity)
            .with_name(current_user.full_name)
            .with_ttl(timedelta(minutes=TOKEN_TTL_MINUTES))
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                    can_publish_data=True,
                )
            )
            .to_jwt()
        )
    except Exception:
        # Avoid returning secrets or internal SDK errors to clients.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to issue meeting access credentials",
        ) from None

    return LiveKitJoinResponse(
        server_url=settings.livekit_url,
        token=token,
        room_name=room_name,
        participant_identity=participant_identity,
        expires_in_seconds=TOKEN_TTL_MINUTES * 60,
    )
