"""Controller for the tax briefing pack PDF endpoint."""
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.services.tax_briefing_service import (
    BriefingAuthError,
    BriefingNotFoundError,
    generate_briefing_pack,
)

router = APIRouter()


@router.get("/briefing-pack")
async def get_briefing_pack(
    period_id: int = Query(..., description="Tax period to generate the pack for"),
    member_id: int | None = Query(None, description="Family member; defaults to current user"),
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> Response:
    """Generate and stream a tax briefing pack PDF for the selected member and period."""
    target_id = member_id if member_id is not None else current_user.id
    try:
        pdf_bytes, filename = await generate_briefing_pack(
            session, current_user.id, target_id, period_id
        )
    except BriefingAuthError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except BriefingNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"},
    )
