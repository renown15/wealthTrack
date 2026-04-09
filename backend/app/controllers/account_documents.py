"""
Controller handlers for account document upload, download, and delete.
Documents are attached directly to accounts (not tied to a tax period).
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.account_document_repository import AccountDocumentRepository
from app.repositories.account_repository import AccountRepository
from app.schemas.base import BaseSchema

router = APIRouter(prefix="/accounts", tags=["account-documents"])


class AccountDocumentResponse(BaseSchema):
    """Account document metadata response (no file_data)."""

    id: int
    account_id: int
    filename: str
    description: Optional[str] = None
    content_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/{account_id}/documents", response_model=list[AccountDocumentResponse])
async def list_documents(
    account_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[AccountDocumentResponse]:
    """List documents for an account."""
    account_repo = AccountRepository(session)
    if not await account_repo.get_by_id(account_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    doc_repo = AccountDocumentRepository(session)
    docs = await doc_repo.list_for_account(account_id, current_user.id)
    return [AccountDocumentResponse.model_validate(d) for d in docs]


@router.post(
    "/{account_id}/documents",
    response_model=AccountDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    account_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(default=None),
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountDocumentResponse:
    """Upload a document for an account."""
    account_repo = AccountRepository(session)
    if not await account_repo.get_by_id(account_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    content = await file.read()
    doc_repo = AccountDocumentRepository(session)
    doc = await doc_repo.create(
        user_id=current_user.id,
        account_id=account_id,
        filename=file.filename or "document",
        description=description,
        content_type=file.content_type,
        file_data=content,
    )
    await session.commit()
    return AccountDocumentResponse.model_validate(doc)


@router.get("/documents/{doc_id}/download")
async def download_document(
    doc_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> Response:
    """Download an account document by ID."""
    doc_repo = AccountDocumentRepository(session)
    doc = await doc_repo.get_by_id(doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return Response(
        content=doc.file_data,
        media_type=doc.content_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'},
    )


@router.patch("/documents/{doc_id}", response_model=AccountDocumentResponse)
async def update_document_description(
    doc_id: int,
    description: Optional[str] = Form(default=None),
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> AccountDocumentResponse:
    """Update the description of an account document."""
    doc_repo = AccountDocumentRepository(session)
    doc = await doc_repo.update_description(doc_id, current_user.id, description)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    await session.commit()
    return AccountDocumentResponse.model_validate(doc)


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Delete an account document by ID."""
    doc_repo = AccountDocumentRepository(session)
    doc = await doc_repo.get_by_id(doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    await doc_repo.delete(doc)
    await session.commit()
