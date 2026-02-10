"""
Schemas for institution security credentials.
"""
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class InstitutionSecurityCredentialCreate(BaseSchema):
    """Request payload when creating a credential."""

    type_id: int = Field(..., description="Reference data ID for the credential type")
    key: str = Field(..., min_length=1, max_length=255, description="Credential key")
    value: str = Field(..., min_length=1, max_length=1000, description="Credential value")


class InstitutionSecurityCredentialUpdate(BaseSchema):
    """Request payload when updating a credential."""

    type_id: Optional[int] = Field(None, description="Reference data ID for the credential type")
    key: Optional[str] = Field(None, min_length=1, max_length=255)
    value: Optional[str] = Field(None, min_length=1, max_length=1000)


class InstitutionSecurityCredentialResponse(BaseSchema):
    """Response payload returned to the frontend for a credential."""

    id: int
    institution_id: int
    type_id: int
    type_label: str
    key: Optional[str]
    value: Optional[str]
    created_at: datetime
    updated_at: datetime
