"""
Repository for AccountDocument CRUD operations.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_document import AccountDocument


class AccountDocumentRepository:
    """Handles AccountDocument database operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_for_account(
        self, account_id: int, user_id: int
    ) -> list[AccountDocument]:
        """List documents for an account, ordered by creation date."""
        stmt = (
            select(AccountDocument)
            .where(
                AccountDocument.account_id == account_id,
                AccountDocument.user_id == user_id,
            )
            .order_by(AccountDocument.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(
        self, doc_id: int, user_id: int
    ) -> Optional[AccountDocument]:
        """Get a document by ID, scoped to the user."""
        stmt = select(AccountDocument).where(
            AccountDocument.id == doc_id,
            AccountDocument.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        user_id: int,
        account_id: int,
        filename: str,
        content_type: Optional[str],
        file_data: bytes,
        description: Optional[str] = None,
    ) -> AccountDocument:
        """Persist a new document."""
        now = datetime.utcnow()
        doc = AccountDocument()
        doc.user_id = user_id
        doc.account_id = account_id
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
    ) -> Optional[AccountDocument]:
        """Update the description of a document."""
        doc = await self.get_by_id(doc_id, user_id)
        if not doc:
            return None
        doc.description = description
        doc.updated_at = datetime.utcnow()
        await self.session.flush()
        await self.session.refresh(doc)
        return doc

    async def delete(self, doc: AccountDocument) -> None:
        """Delete a document."""
        await self.session.delete(doc)
        await self.session.flush()
