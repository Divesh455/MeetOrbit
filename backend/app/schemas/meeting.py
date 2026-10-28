
from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=5000)
    scheduled_for: datetime | None = None

    @field_validator("scheduled_for")
    @classmethod
    def validate_scheduled_for(
        cls, value: datetime | None
    ) -> datetime | None:
        if value is not None:
            if value.tzinfo is None or value.utcoffset() is None:
                raise ValueError("scheduled_for must include a timezone")
            if value <= datetime.now(timezone.utc):
                raise ValueError("scheduled_for must be in the future")
        return value


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=5000)
    scheduled_for: datetime | None = None

    @field_validator("scheduled_for")
    @classmethod
    def validate_scheduled_for(
        cls, value: datetime | None
    ) -> datetime | None:
        if value is not None:
            if value.tzinfo is None or value.utcoffset() is None:
                raise ValueError("scheduled_for must include a timezone")
            if value <= datetime.now(timezone.utc):
                raise ValueError("scheduled_for must be in the future")
        return value


class MeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    title: str
    description: str | None
    status: str
    scheduled_for: datetime | None
    started_at: datetime | None
    ended_at: datetime | None
    created_at: datetime
    updated_at: datetime
