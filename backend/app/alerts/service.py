from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.alerts.models import Alert
from app.alerts.schemas import AlertCreate, AlertUpdate
from app.watchlists.models import Watchlist


async def create_alert(
    db: AsyncSession, user_id: uuid.UUID, data: AlertCreate
) -> Alert:
    # Verify the watchlist exists and belongs to the user
    wl = await db.execute(
        select(Watchlist).where(
            Watchlist.id == data.watchlist_id,
            Watchlist.user_id == user_id,
        )
    )
    if not wl.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Watchlist not found")

    record = Alert(
        user_id=user_id,
        watchlist_id=data.watchlist_id,
        name=data.name,
        channel_type=data.channel_type,
        channel_url=data.channel_url,
        is_active=data.is_active,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def list_alerts(
    db: AsyncSession,
    user_id: uuid.UUID,
    watchlist_id: uuid.UUID | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Alert]:
    q = select(Alert).where(Alert.user_id == user_id)
    if watchlist_id:
        q = q.where(Alert.watchlist_id == watchlist_id)
    q = q.order_by(Alert.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    return list(result.scalars().all())


async def update_alert(
    db: AsyncSession, alert_id: uuid.UUID, user_id: uuid.UUID, data: AlertUpdate
) -> Alert:
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Alert not found")
    if data.name is not None:
        record.name = data.name
    if data.channel_url is not None:
        record.channel_url = data.channel_url
    if data.is_active is not None:
        record.is_active = data.is_active
    await db.commit()
    await db.refresh(record)
    return record


async def delete_alert(
    db: AsyncSession, alert_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        return False
    await db.delete(record)
    await db.commit()
    return True
