"""Baseline for the existing MeetOrbit database schema."""

revision = "a6517b965dde"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The existing database already contains the legacy schema.
    pass


def downgrade() -> None:
    # Intentionally do not delete existing database objects.
    pass