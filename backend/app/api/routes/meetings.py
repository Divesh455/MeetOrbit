
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.meeting import Meeting
from app.models.user import User
from app.models.workspace_member import WorkspaceMember
from app.schemas.meeting import (
    MeetingCreate,
    MeetingResponse,
    MeetingUpdate,
)

router = APIRouter(prefix="/workspaces", tags=["Meetings"])


def require_workspace_member(
    workspace_id: UUID,
    user_id: UUID,
    db: Session,
) -> WorkspaceMember:
    membership = db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    return membership


def get_meeting_or_404(
    workspace_id: UUID,
    meeting_id: UUID,
    db: Session,
) -> Meeting:
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

    return meeting


@router.post(
    "/{workspace_id}/meetings",
    response_model=MeetingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_meeting(
    workspace_id: UUID,
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_workspace_member(workspace_id, current_user.id, db)

    title = payload.title.strip()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Meeting title cannot be empty",
        )

    meeting = Meeting(
        id=uuid4(),
        workspace_id=workspace_id,
        title=title,
        description=payload.description,
        status="scheduled",
        scheduled_for=payload.scheduled_for,
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    return meeting


@router.get(
    "/{workspace_id}/meetings",
    response_model=list[MeetingResponse],
)
def list_meetings(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_workspace_member(workspace_id, current_user.id, db)

    statement = (
        select(Meeting)
        .where(Meeting.workspace_id == workspace_id)
        .order_by(Meeting.created_at.desc())
    )

    return list(db.scalars(statement).all())


@router.get(
    "/{workspace_id}/meetings/{meeting_id}",
    response_model=MeetingResponse,
)
def get_meeting(
    workspace_id: UUID,
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_workspace_member(workspace_id, current_user.id, db)

    return get_meeting_or_404(workspace_id, meeting_id, db)


@router.patch(
    "/{workspace_id}/meetings/{meeting_id}",
    response_model=MeetingResponse,
)
def update_meeting(
    workspace_id: UUID,
    meeting_id: UUID,
    payload: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_workspace_member(workspace_id, current_user.id, db)

    meeting = get_meeting_or_404(workspace_id, meeting_id, db)

    if meeting.status != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only scheduled meetings can be edited",
        )

    changes = payload.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide at least one field to update",
        )

    if "title" in changes:
        if changes["title"] is None or not changes["title"].strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Meeting title cannot be empty",
            )
        meeting.title = changes["title"].strip()

    if "description" in changes:
        meeting.description = changes["description"]
        
    if "scheduled_for" in changes:
        meeting.scheduled_for = changes["scheduled_for"]

    db.commit()
    db.refresh(meeting)

    return meeting


@router.delete(
    "/{workspace_id}/meetings/{meeting_id}",
    response_model=MeetingResponse,
)
def cancel_meeting(
    workspace_id: UUID,
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_workspace_member(workspace_id, current_user.id, db)

    meeting = get_meeting_or_404(workspace_id, meeting_id, db)

    if meeting.status != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only scheduled meetings can be cancelled",
        )

    meeting.status = "cancelled"

    db.commit()
    db.refresh(meeting)

    return meeting
