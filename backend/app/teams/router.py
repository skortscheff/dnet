from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.core.database import get_db
from app.teams import service
from app.teams.schemas import TeamCreate, TeamInvite, TeamMemberOut, TeamOut

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
async def create_team(
    data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamOut:
    return await service.create_team(db=db, owner_id=current_user.id, data=data)


@router.get("", response_model=list[TeamOut])
async def list_teams(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TeamOut]:
    return await service.list_teams(db=db, user_id=current_user.id)


@router.get("/{team_id}", response_model=TeamOut)
async def get_team(
    team_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamOut:
    return await service.get_team(db=db, team_id=team_id, user_id=current_user.id)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    deleted = await service.delete_team(db=db, team_id=team_id, owner_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Team not found or insufficient permissions")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{team_id}/members", response_model=list[TeamMemberOut])
async def list_members(
    team_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TeamMemberOut]:
    return await service.list_members(db=db, team_id=team_id, user_id=current_user.id)


@router.post("/{team_id}/members", response_model=TeamMemberOut, status_code=status.HTTP_201_CREATED)
async def invite_member(
    team_id: uuid.UUID,
    data: TeamInvite,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamMemberOut:
    return await service.invite_member(
        db=db, team_id=team_id, owner_id=current_user.id, email=data.email
    )


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    removed = await service.remove_member(
        db=db, team_id=team_id, owner_id=current_user.id, member_user_id=user_id
    )
    if not removed:
        raise HTTPException(status_code=404, detail="Member not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
