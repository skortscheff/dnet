from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.core.database import get_db
from app.saved_results import service
from app.saved_results.schemas import SavedResultCreate, SavedResultOut

router = APIRouter(prefix="/saved-results", tags=["saved-results"])


@router.post("", response_model=SavedResultOut, status_code=status.HTTP_201_CREATED)
async def create_saved_result(
    data: SavedResultCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavedResultOut:
    return await service.save_result(db=db, user_id=current_user.id, data=data)


@router.get("", response_model=list[SavedResultOut])
async def get_saved_results(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SavedResultOut]:
    return await service.list_saved_results(db=db, user_id=current_user.id, limit=limit, offset=offset)


@router.delete("/{result_id}")
async def remove_saved_result(
    result_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    deleted = await service.delete_saved_result(db=db, result_id=result_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved result not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
