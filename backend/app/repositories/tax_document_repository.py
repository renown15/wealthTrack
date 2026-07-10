"""
Repository for TaxDocument CRUD operations.
"""
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.tax_document import TaxDocument
from app.models.tax_period import TaxPeriod
from app.models.tax_return import TaxReturn


class TaxDocumentRepository:
    """Handles TaxDocument database operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_all_for_user(self, user_id: int) -> list[dict[str, Any]]:
        """All the user's tax documents with account + period labels.

        Selects metadata columns only — never the file bytes — since the
        library can span every uploaded document.
        """
        stmt = (
            select(
                TaxDocument.id,
                TaxDocument.tax_return_id,
                TaxDocument.filename,
                TaxDocument.description,
                TaxDocument.content_type,
                TaxDocument.created_at,
                Account.name.label("account_name"),
                TaxPeriod.name.label("period_name"),
            )
            .outerjoin(TaxReturn, TaxReturn.id == TaxDocument.tax_return_id)
            .outerjoin(Account, Account.id == TaxReturn.account_id)
            .outerjoin(TaxPeriod, TaxPeriod.id == TaxReturn.tax_period_id)
            .where(TaxDocument.user_id == user_id)
            .order_by(
                # Hub-level documents (no return, hence no period) sort first.
                TaxPeriod.start_date.desc().nullsfirst(),
                Account.name.asc(),
                TaxDocument.created_at.asc(),
            )
        )
        result = await self.session.execute(stmt)
        return [dict(row) for row in result.mappings().all()]

    async def list_for_return(self, tax_return_id: int, user_id: int) -> list[TaxDocument]:
        """List documents for a tax return, ordered by creation date."""
        stmt = (
            select(TaxDocument)
            .where(
                TaxDocument.tax_return_id == tax_return_id,
                TaxDocument.user_id == user_id,
            )
            .order_by(TaxDocument.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, doc_id: int, user_id: int) -> Optional[TaxDocument]:
        """Get a document by ID, scoped to the user."""
        stmt = select(TaxDocument).where(
            TaxDocument.id == doc_id,
            TaxDocument.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        user_id: int,
        tax_return_id: Optional[int],
        filename: str,
        content_type: Optional[str],
        file_data: bytes,
        description: Optional[str] = None,
    ) -> TaxDocument:
        """Persist a new document."""
        now = datetime.utcnow()
        doc = TaxDocument()
        doc.user_id = user_id
        doc.tax_return_id = tax_return_id
        doc.filename = filename
        doc.description = description
        doc.content_type = content_type
        doc.file_data = file_data
        doc.created_at = now
        doc.updated_at = now
        self.session.add(doc)
        await self.session.flush()
        await self.session.refresh(doc)
        return doc

    async def update_description(
        self, doc_id: int, user_id: int, description: Optional[str]
    ) -> Optional[TaxDocument]:
        """Update the description of a document."""
        doc = await self.get_by_id(doc_id, user_id)
        if not doc:
            return None
        doc.description = description
        await self.session.flush()
        await self.session.refresh(doc)
        return doc

    async def delete(self, doc: TaxDocument) -> None:
        """Delete a document."""
        await self.session.delete(doc)
        await self.session.flush()
