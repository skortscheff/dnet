from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service as auth_service
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.auth.schemas import Token, UserCreate, UserOut
from app.core.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    user = await auth_service.register_user(db, body.email, body.password)
    return UserOut.model_validate(user)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    user = await auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = auth_service.create_access_token(str(user.id))
    return Token(access_token=access_token)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)
