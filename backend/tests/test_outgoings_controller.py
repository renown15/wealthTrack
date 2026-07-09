"""Integration tests for the outgoings controller (actual costs + projections)."""
from datetime import date, timedelta

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.reference_data import ReferenceData


@pytest.fixture(autouse=True)
async def outgoing_ref_data(db_session: AsyncSession) -> None:
    """Reference data for actual costs (conftest seeds only a minimal set)."""
    for row in (
        ReferenceData(class_key="account_event_type", reference_value="Actual Cost",
                      sort_index=18),
        ReferenceData(class_key="account_event_type", reference_value="Actual Cost Date",
                      sort_index=19),
        ReferenceData(class_key="event_group_type", reference_value="Actual Cost", sort_index=4),
    ):
        db_session.add(row)
    await db_session.commit()


def _days_ago(days: int) -> str:
    return (date.today() - timedelta(days=days)).isoformat()


async def _record(
    client: AsyncClient, headers: dict[str, str], account_id: int, amount: str, cost_date: str
):
    return await client.post(
        f"/api/v1/accounts/{account_id}/actual-costs",
        headers=headers,
        json={"amount": amount, "cost_date": cost_date},
    )


@pytest.mark.asyncio
async def test_record_actual_cost(
    client: AsyncClient, authenticated_headers: dict[str, str], account: Account
):
    """Recording returns the created item with its group id."""
    response = await _record(client, authenticated_headers, account.id, "142.50", "2026-06-01")
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["accountId"] == account.id
    assert data["amount"] == "142.50"
    assert data["costDate"] == "2026-06-01"
    assert data["groupId"] > 0


@pytest.mark.asyncio
async def test_record_actual_cost_unknown_account(
    client: AsyncClient, authenticated_headers: dict[str, str]
):
    """Recording against a missing account returns 404."""
    response = await _record(client, authenticated_headers, 999999, "10.00", "2026-06-01")
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_record_actual_cost_rejects_non_numeric_amount(
    client: AsyncClient, authenticated_headers: dict[str, str], account: Account
):
    """A non-numeric amount fails validation."""
    response = await _record(client, authenticated_headers, account.id, "not-money", "2026-06-01")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_list_actual_costs_newest_first(
    client: AsyncClient, authenticated_headers: dict[str, str], account: Account
):
    """Listing returns recorded actuals sorted by period date descending."""
    await _record(client, authenticated_headers, account.id, "100.00", "2026-01-15")
    await _record(client, authenticated_headers, account.id, "120.00", "2026-05-15")

    response = await client.get(
        f"/api/v1/accounts/{account.id}/actual-costs", headers=authenticated_headers
    )
    assert response.status_code == status.HTTP_200_OK
    items = response.json()
    assert [i["costDate"] for i in items] == ["2026-05-15", "2026-01-15"]
    assert [i["amount"] for i in items] == ["120.00", "100.00"]


@pytest.mark.asyncio
async def test_delete_actual_cost(
    client: AsyncClient, authenticated_headers: dict[str, str], account: Account
):
    """Deleting removes the group so it no longer appears in the list."""
    created = await _record(client, authenticated_headers, account.id, "55.00", "2026-03-01")
    group_id = created.json()["groupId"]

    response = await client.delete(
        f"/api/v1/outgoings/actual-costs/{group_id}", headers=authenticated_headers
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    items = (
        await client.get(
            f"/api/v1/accounts/{account.id}/actual-costs", headers=authenticated_headers
        )
    ).json()
    assert items == []


@pytest.mark.asyncio
async def test_delete_actual_cost_not_found(
    client: AsyncClient, authenticated_headers: dict[str, str]
):
    """Deleting a missing group returns 404."""
    response = await client.delete(
        "/api/v1/outgoings/actual-costs/999999", headers=authenticated_headers
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_projections_average_recent_actuals(
    client: AsyncClient, authenticated_headers: dict[str, str], account: Account
):
    """Projection is the mean of actuals within the trailing 12 months."""
    await _record(client, authenticated_headers, account.id, "100.00", _days_ago(30))
    await _record(client, authenticated_headers, account.id, "140.00", _days_ago(60))

    response = await client.get("/api/v1/outgoings/projections", headers=authenticated_headers)
    assert response.status_code == status.HTTP_200_OK
    projections = response.json()
    assert len(projections) == 1
    assert projections[0]["accountId"] == account.id
    assert projections[0]["projectedCost"] == "120.00"
    assert projections[0]["actualsCount"] == 2


@pytest.mark.asyncio
async def test_projections_empty_without_actuals(
    client: AsyncClient, authenticated_headers: dict[str, str]
):
    """No recorded actuals means no projections."""
    response = await client.get("/api/v1/outgoings/projections", headers=authenticated_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


@pytest.mark.asyncio
async def test_actual_cost_date_hidden_from_timeline(
    client: AsyncClient, authenticated_headers: dict[str, str], account: Account
):
    """The companion date event is internal and excluded from the account timeline."""
    await _record(client, authenticated_headers, account.id, "77.00", "2026-04-01")

    response = await client.get(
        f"/api/v1/accounts/{account.id}/events", headers=authenticated_headers
    )
    assert response.status_code == status.HTTP_200_OK
    event_types = [e["eventType"] for e in response.json()]
    assert "Actual Cost" in event_types
    assert "Actual Cost Date" not in event_types
