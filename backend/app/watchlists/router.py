from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.core.database import get_db
from app.snapshots import service as snapshot_service
from app.snapshots.schemas import SnapshotOut
from app.watchlists import service
from app.watchlists.schemas import WatchlistCreate, WatchlistOut

router = APIRouter(prefix="/watchlists", tags=["watchlists"])


@router.post("", response_model=WatchlistOut, status_code=status.HTTP_201_CREATED)
async def create_watchlist(
    data: WatchlistCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WatchlistOut:
    return await service.create_watchlist(db=db, user_id=current_user.id, data=data)


@router.get("", response_model=list[WatchlistOut])
async def list_watchlists(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[WatchlistOut]:
    return await service.list_watchlists(db=db, user_id=current_user.id, limit=limit, offset=offset)


@router.get("/{watchlist_id}", response_model=WatchlistOut)
async def get_watchlist(
    watchlist_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WatchlistOut:
    return await service.get_watchlist(db=db, watchlist_id=watchlist_id, user_id=current_user.id)


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_watchlist(
    watchlist_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    deleted = await service.delete_watchlist(db=db, watchlist_id=watchlist_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{watchlist_id}/snapshots", response_model=list[SnapshotOut])
async def list_watchlist_snapshots(
    watchlist_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SnapshotOut]:
    # Ensure the user has access to this watchlist
    await service.get_watchlist(db=db, watchlist_id=watchlist_id, user_id=current_user.id)
    return await snapshot_service.list_snapshots(db=db, watchlist_id=watchlist_id, limit=limit, offset=offset)
