"""
Repository for TaxDocument CRUD operations.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tax_document import TaxDocument


class TaxDocumentRepository:
    """Handles TaxDocument database operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

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
        tax_return_id: int,
        filename: str,
        content_type: Optional[str],
        file_data: bytes,
    ) -> TaxDocument:
        """Persist a new document."""
        now = datetime.utcnow()
        doc = TaxDocument()
        doc.user_id = user_id
        doc.tax_return_id = tax_return_id
        doc.filename = filename
        doc.content_type = content_type
        doc.file_data = file_data
        doc.created_at = now
        doc.updated_at = now
        self.session.add(doc)
        await self.session.flush()
        await self.session.refresh(doc)
        return doc

    async def delete(self, doc: TaxDocument) -> None:
        """Delete a document."""
        await self.session.delete(doc)
        await self.session.flush()
