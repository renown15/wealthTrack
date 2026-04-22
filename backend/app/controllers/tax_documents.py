"""
Controller handlers for tax document upload, download, and delete.
"""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.account_repository import AccountRepository
from app.repositories.tax_document_repository import TaxDocumentRepository
from app.repositories.tax_period_repository import TaxPeriodRepository
from app.repositories.tax_return_repository import TaxReturnRepository
from app.schemas.tax import TaxDocumentResponse

router = APIRouter()


async def _get_or_create_return(
    session: AsyncSession,
    user_id: int,
    account_id: int,
    period_id: int,
) -> int:
    """Return existing TaxReturn id or create one for document attachment."""
    return_repo = TaxReturnRepository(session)
    tax_return = await return_repo.get_for_account_period(user_id, account_id, period_id)
    if not tax_return:
        tax_return = await return_repo.upsert(
            user_id=user_id,
            account_id=account_id,
            tax_period_id=period_id,
            income=None,
            capital_gain=None,
            tax_taken_off=None,
        )
    return tax_return.id


@router.get(
    "/periods/{period_id}/accounts/{account_id}/documents",
    response_model=list[TaxDocumentResponse],
)
async def list_documents(
    period_id: int,
    account_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[TaxDocumentResponse]:
    """List documents for an account in a tax period."""
    return_repo = TaxReturnRepository(session)
    tax_return = await return_repo.get_for_account_period(current_user.id, account_id, period_id)
    if not tax_return:
        return []
    doc_repo = TaxDocumentRepository(session)
    docs = await doc_repo.list_for_return(tax_return.id, current_user.id)
    return [TaxDocumentResponse.model_validate(d) for d in docs]


@router.post(
    "/periods/{period_id}/accounts/{account_id}/documents",
    response_model=TaxDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    period_id: int,
    account_id: int,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> TaxDocumentResponse:
    """Upload a document for an account in a tax period."""
    period_repo = TaxPeriodRepository(session)
    if not await period_repo.get_by_id(period_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax period not found")

    account_repo = AccountRepository(session)
    if not await account_repo.get_by_id(account_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    return_id = await _get_or_create_return(session, current_user.id, account_id, period_id)

    content = await file.read()
    doc_repo = TaxDocumentRepository(session)
    doc = await doc_repo.create(
        user_id=current_user.id,
        tax_return_id=return_id,
        filename=file.filename or "document",
        content_type=file.content_type,
        file_data=content,
    )
    await session.commit()
    return TaxDocumentResponse.model_validate(doc)


@router.get("/documents/{doc_id}/download")
async def download_document(
    doc_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> Response:
    """Download a tax document by ID."""
    doc_repo = TaxDocumentRepository(session)
    doc = await doc_repo.get_by_id(doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return Response(
        content=doc.file_data,
        media_type=doc.content_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{doc.filename}"'},
    )


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Delete a tax document by ID."""
    doc_repo = TaxDocumentRepository(session)
    doc = await doc_repo.get_by_id(doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    await doc_repo.delete(doc)
    await session.commit()
