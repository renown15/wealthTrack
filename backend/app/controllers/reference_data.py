"""Controller that exposes reference-data lookup rows."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.reference_data import ReferenceDataResponse
from app.services.reference_data import list_reference_data_by_class

router = APIRouter(prefix="/reference-data", tags=["reference-data"])


@router.get("/{class_key}", response_model=list[ReferenceDataResponse])
async def list_reference_data(
    class_key: str,
    session: AsyncSession = Depends(get_db),
) -> list[ReferenceDataResponse]:
    """Return all lookup rows for the requested reference-data class."""
    entries = await list_reference_data_by_class(session, class_key)
    return [ReferenceDataResponse.from_orm(entry) for entry in entries]
