from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    WorkspaceResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    existing_user = db.scalar(select(User).where(User.email == email))

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
    )

    try:
        db.add(user)
        db.flush()

        workspace = Workspace(
            name=f"{user.full_name}'s Workspace",
            created_by=user.id,
        )
        db.add(workspace)
        db.flush()

        membership = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role="owner",
        )
        db.add(membership)

        db.commit()
        db.refresh(user)

        return user

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not create account with these details",
        ) from None

    except Exception:
        db.rollback()
        raise


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    user = db.scalar(select(User).where(User.email == email))

    if (
        user is None
        or not verify_password(payload.password, user.password_hash)
        or not user.is_active
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get("/me/workspaces", response_model=list[WorkspaceResponse])
def get_my_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = db.scalars(
        select(WorkspaceMember).where(WorkspaceMember.user_id == current_user.id)
    ).all()

    return [
        WorkspaceResponse(
            id=membership.workspace.id,
            name=membership.workspace.name,
            role=membership.role,
        )
        for membership in memberships
    ]
