from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.alerts import service
from app.alerts.schemas import AlertCreate, AlertOut, AlertUpdate
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.core.database import get_db

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
async def create_alert(
    data: AlertCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AlertOut:
    return await service.create_alert(db=db, user_id=current_user.id, data=data)


@router.get("", response_model=list[AlertOut])
async def list_alerts(
    watchlist_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AlertOut]:
    return await service.list_alerts(
        db=db, user_id=current_user.id, watchlist_id=watchlist_id, limit=limit, offset=offset
    )


@router.patch("/{alert_id}", response_model=AlertOut)
async def update_alert(
    alert_id: uuid.UUID,
    data: AlertUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AlertOut:
    return await service.update_alert(db=db, alert_id=alert_id, user_id=current_user.id, data=data)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    deleted = await service.delete_alert(db=db, alert_id=alert_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
