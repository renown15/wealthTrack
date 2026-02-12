"""Schemas for reference data responses."""

from datetime import datetime
from typing import Optional

from pydantic import ConfigDict, Field

from app.schemas.base import BaseSchema


class ReferenceDataCreate(BaseSchema):
    """Schema for creating/updating reference data."""

    class_key: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Class key (e.g., 'credential_type')",
    )
    reference_value: str = Field(
        ..., min_length=1, max_length=255, description="Display value"
    )
    sort_index: Optional[int] = Field(None, ge=0, description="Sort order")


class ReferenceDataResponse(BaseSchema):
    """Schema that exposes reference data lookup rows."""

    model_config = ConfigDict(**BaseSchema.model_config, from_attributes=True)

    id: int
    class_key: str
    reference_value: str
    sort_index: int
    updated_at: datetime
