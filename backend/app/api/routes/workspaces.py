
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember

router = APIRouter(prefix="/workspaces", tags=["Workspace members"])


class AddWorkspaceMemberRequest(BaseModel):
    email: EmailStr


class WorkspaceMemberResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    user_id: UUID
    full_name: str
    email: str
    role: str


@router.post(
    "/{workspace_id}/members",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_workspace_member(
    workspace_id: UUID,
    payload: AddWorkspaceMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workspace = db.get(Workspace, workspace_id)

    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")

    owner_membership = db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.role == "owner",
        )
    )

    if (
        owner_membership is None
        or workspace.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Only the workspace owner can add members",
        )

    email = str(payload.email).strip().lower()
    user = db.scalar(select(User).where(User.email == email))

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found. Ask them to register first.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="This user account is inactive",
        )

    existing_membership = db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    )

    if existing_membership is not None:
        raise HTTPException(
            status_code=409,
            detail="This user is already a workspace member",
        )

    membership = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user.id,
        role="member",
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return WorkspaceMemberResponse(
        id=membership.id,
        workspace_id=membership.workspace_id,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=membership.role,
    )
