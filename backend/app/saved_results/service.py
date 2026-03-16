from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.saved_results.models import SavedResult
from app.saved_results.schemas import SavedResultCreate


async def save_result(db: AsyncSession, user_id: uuid.UUID, data: SavedResultCreate) -> SavedResult:
    record = SavedResult(
        user_id=user_id,
        permalink_id=data.permalink_id,
        label=data.label,
        input=data.input,
        input_type=data.input_type,
    )
    db.add(record)
    try:
        await db.commit()
        await db.refresh(record)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already saved")
    return record


async def list_saved_results(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> list[SavedResult]:
    result = await db.execute(
        select(SavedResult)
        .where(SavedResult.user_id == user_id)
        .order_by(SavedResult.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def delete_saved_result(db: AsyncSession, result_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(SavedResult).where(SavedResult.id == result_id, SavedResult.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if record is None:
        return False
    await db.delete(record)
    await db.commit()
    return True
