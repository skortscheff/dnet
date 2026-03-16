from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.teams.models import Team, TeamMember
from app.teams.schemas import TeamCreate


async def create_team(
    db: AsyncSession, owner_id: uuid.UUID, data: TeamCreate
) -> Team:
    team = Team(name=data.name, owner_id=owner_id)
    db.add(team)
    await db.flush()
    # Auto-add owner as a member with role "owner"
    member = TeamMember(team_id=team.id, user_id=owner_id, role="owner")
    db.add(member)
    await db.commit()
    await db.refresh(team)
    return team


async def list_teams(db: AsyncSession, user_id: uuid.UUID) -> list[Team]:
    team_ids_q = select(TeamMember.team_id).where(TeamMember.user_id == user_id)
    result = await db.execute(
        select(Team).where(Team.id.in_(team_ids_q)).order_by(Team.created_at.desc())
    )
    return list(result.scalars().all())


async def get_team(
    db: AsyncSession, team_id: uuid.UUID, user_id: uuid.UUID
) -> Team:
    member_q = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
    )
    if not member_q.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Team not found")
    result = await db.execute(select(Team).where(Team.id == team_id))
    return result.scalar_one()


async def list_members(
    db: AsyncSession, team_id: uuid.UUID, user_id: uuid.UUID
) -> list[TeamMember]:
    await get_team(db, team_id, user_id)
    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id)
    )
    return list(result.scalars().all())


async def invite_member(
    db: AsyncSession, team_id: uuid.UUID, owner_id: uuid.UUID, email: str
) -> TeamMember:
    team = await get_team(db, team_id, owner_id)
    if team.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Only the team owner can invite members")

    user_q = await db.execute(select(User).where(User.email == email))
    user = user_q.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    member = TeamMember(team_id=team_id, user_id=user.id, role="member")
    db.add(member)
    try:
        await db.commit()
        await db.refresh(member)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="User is already a member")
    return member


async def remove_member(
    db: AsyncSession, team_id: uuid.UUID, owner_id: uuid.UUID, member_user_id: uuid.UUID
) -> bool:
    team = await get_team(db, team_id, owner_id)
    if team.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Only the team owner can remove members")
    if member_user_id == owner_id:
        raise HTTPException(status_code=400, detail="Owner cannot remove themselves")

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == member_user_id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        return False
    await db.delete(record)
    await db.commit()
    return True


async def delete_team(
    db: AsyncSession, team_id: uuid.UUID, owner_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(Team).where(Team.id == team_id, Team.owner_id == owner_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        return False
    await db.delete(record)
    await db.commit()
    return True
