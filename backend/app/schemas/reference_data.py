"""Schemas for reference data responses."""

from pydantic import ConfigDict

from app.schemas.base import BaseSchema


class ReferenceDataResponse(BaseSchema):
    """Schema that exposes reference data lookup rows."""

    model_config = ConfigDict(**BaseSchema.model_config, from_attributes=True)

    id: int
    class_key: str
    reference_value: str
    sort_index: int
