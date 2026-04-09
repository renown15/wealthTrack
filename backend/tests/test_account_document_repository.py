"""Tests for AccountDocumentRepository."""
import pytest

from app.repositories.account_document_repository import AccountDocumentRepository


@pytest.mark.asyncio
async def test_create_and_list_document(db_session, account):
    repo = AccountDocumentRepository(db_session)
    doc = await repo.create(
        user_id=account.user_id,
        account_id=account.id,
        filename="test.pdf",
        content_type="application/pdf",
        file_data=b"pdfcontent",
        description="A test doc",
    )
    await db_session.flush()

    docs = await repo.list_for_account(account.id, account.user_id)
    assert len(docs) == 1
    assert docs[0].id == doc.id
    assert docs[0].filename == "test.pdf"
    assert docs[0].description == "A test doc"


@pytest.mark.asyncio
async def test_list_returns_empty_for_no_documents(db_session, account):
    repo = AccountDocumentRepository(db_session)
    docs = await repo.list_for_account(account.id, account.user_id)
    assert docs == []


@pytest.mark.asyncio
async def test_get_by_id_returns_document(db_session, account):
    repo = AccountDocumentRepository(db_session)
    doc = await repo.create(
        user_id=account.user_id,
        account_id=account.id,
        filename="img.jpg",
        content_type="image/jpeg",
        file_data=b"imgdata",
    )
    await db_session.flush()

    fetched = await repo.get_by_id(doc.id, account.user_id)
    assert fetched is not None
    assert fetched.id == doc.id


@pytest.mark.asyncio
async def test_get_by_id_returns_none_for_wrong_user(db_session, account):
    repo = AccountDocumentRepository(db_session)
    doc = await repo.create(
        user_id=account.user_id,
        account_id=account.id,
        filename="secret.pdf",
        content_type="application/pdf",
        file_data=b"data",
    )
    await db_session.flush()

    fetched = await repo.get_by_id(doc.id, user_id=99999)
    assert fetched is None


@pytest.mark.asyncio
async def test_update_description(db_session, account):
    repo = AccountDocumentRepository(db_session)
    doc = await repo.create(
        user_id=account.user_id,
        account_id=account.id,
        filename="file.pdf",
        content_type="application/pdf",
        file_data=b"x",
        description=None,
    )
    await db_session.flush()

    updated = await repo.update_description(doc.id, account.user_id, "New description")
    assert updated is not None
    assert updated.description == "New description"


@pytest.mark.asyncio
async def test_update_description_returns_none_for_missing(db_session, account):
    repo = AccountDocumentRepository(db_session)
    result = await repo.update_description(99999, account.user_id, "x")
    assert result is None


@pytest.mark.asyncio
async def test_delete_document(db_session, account):
    repo = AccountDocumentRepository(db_session)
    doc = await repo.create(
        user_id=account.user_id,
        account_id=account.id,
        filename="todelete.pdf",
        content_type="application/pdf",
        file_data=b"bye",
    )
    await db_session.flush()

    await repo.delete(doc)
    await db_session.flush()

    docs = await repo.list_for_account(account.id, account.user_id)
    assert docs == []
