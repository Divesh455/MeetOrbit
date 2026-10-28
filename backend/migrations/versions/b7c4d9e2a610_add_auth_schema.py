"""Add user activation and workspace membership."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "b7c4d9e2a610"
down_revision = "a6517b965dde"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.create_table(
        "workspace_members",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey(
                "workspaces.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey(
                "users.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "role",
            sa.String(length=20),
            nullable=False,
            server_default="owner",
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "workspace_id",
            "user_id",
            name="uq_workspace_member",
        ),
    )

    op.create_index(
        "ix_workspace_members_workspace_id",
        "workspace_members",
        ["workspace_id"],
    )

    op.create_index(
        "ix_workspace_members_user_id",
        "workspace_members",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_workspace_members_user_id",
        table_name="workspace_members",
    )
    op.drop_index(
        "ix_workspace_members_workspace_id",
        table_name="workspace_members",
    )
    op.drop_table("workspace_members")
    op.drop_column("users", "is_active")