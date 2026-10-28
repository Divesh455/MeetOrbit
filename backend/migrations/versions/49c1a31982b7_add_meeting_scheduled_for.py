
"""Add scheduled_for to meetings."""

from alembic import op
import sqlalchemy as sa

revision = "49c1a31982b7"
down_revision = "b7c4d9e2a610"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "meetings",
        sa.Column(
            "scheduled_for",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("meetings", "scheduled_for")
