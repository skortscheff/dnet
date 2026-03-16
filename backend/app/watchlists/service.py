from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.watchlists.models import Watchlist
from app.watchlists.schemas import WatchlistCreate
from app.teams.models import TeamMember


async def create_watchlist(
    db: AsyncSession, user_id: uuid.UUID, data: WatchlistCreate
) -> Watchlist:
    if data.team_id:
        member = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == data.team_id,
                TeamMember.user_id == user_id,
            )
        )
        if not member.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Not a member of that team")

    record = Watchlist(
        user_id=user_id,
        team_id=data.team_id,
        label=data.label,
        input=data.input,
        input_type=data.input_type,
        check_interval_minutes=data.check_interval_minutes,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def list_watchlists(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> list[Watchlist]:
    # Include watchlists owned by user plus any shared via a team the user belongs to
    team_ids_q = select(TeamMember.team_id).where(TeamMember.user_id == user_id)
    result = await db.execute(
        select(Watchlist)
        .where(
            or_(
                Watchlist.user_id == user_id,
                Watchlist.team_id.in_(team_ids_q),
            )
        )
        .order_by(Watchlist.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def get_watchlist(
    db: AsyncSession, watchlist_id: uuid.UUID, user_id: uuid.UUID
) -> Watchlist:
    team_ids_q = select(TeamMember.team_id).where(TeamMember.user_id == user_id)
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id,
            or_(
                Watchlist.user_id == user_id,
                Watchlist.team_id.in_(team_ids_q),
            ),
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return record


async def delete_watchlist(
    db: AsyncSession, watchlist_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        return False
    await db.delete(record)
    await db.commit()
    return True
