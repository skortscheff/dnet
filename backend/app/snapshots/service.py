from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.snapshots.models import Snapshot


async def list_snapshots(
    db: AsyncSession,
    watchlist_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
) -> list[Snapshot]:
    result = await db.execute(
        select(Snapshot)
        .where(Snapshot.watchlist_id == watchlist_id)
        .order_by(Snapshot.taken_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def get_snapshot(db: AsyncSession, snapshot_id: uuid.UUID) -> Snapshot | None:
    result = await db.execute(
        select(Snapshot).where(Snapshot.id == snapshot_id)
    )
    return result.scalar_one_or_none()
