"""Helpers for resolving tax-scope ReferenceData rows.

Scope override values live in ReferenceData under the ``tax_scope_status``
class (e.g. "Out of Scope"), so new states are seed rows, not migrations.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.services.reference_data import list_reference_data_by_class

TAX_SCOPE_CLASS = "tax_scope_status"
OUT_OF_SCOPE = "Out of Scope"


async def get_scope_maps(session: AsyncSession) -> tuple[dict[int, str], dict[str, int]]:
    """Return (id -> value, value -> id) for all tax_scope_status reference rows."""
    rows: list[ReferenceData] = await list_reference_data_by_class(session, TAX_SCOPE_CLASS)
    by_id = {row.id: row.reference_value for row in rows}
    by_value = {row.reference_value: row.id for row in rows}
    return by_id, by_value
