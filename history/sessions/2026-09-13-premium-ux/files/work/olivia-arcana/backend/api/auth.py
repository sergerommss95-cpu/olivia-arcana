"""Auth endpoints — register, login, me, update birth data."""

import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from jose import jwt, JWTError

from db.database import get_db
from db.models import User

router = APIRouter()

# ── Config ──
SECRET_KEY = os.getenv("JWT_SECRET", "olivia-arcana-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Schemas ──
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UpdateBirthData(BaseModel):
    birth_year: int
    birth_month: int
    birth_day: int
    birth_hour: int = 12
    birth_minute: int = 0
    birth_city: str | None = None
    birth_lat: float = 40.71
    birth_lon: float = -74.01
    birth_tz: float = -5
    sun_sign: str | None = None
    moon_sign: str | None = None
    rising_sign: str | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str | None
    sun_sign: str | None
    moon_sign: str | None
    rising_sign: str | None
    birth_year: int | None
    birth_month: int | None
    birth_day: int | None
    birth_city: str | None


# ── Helpers ──
def create_token(user_id: int, email: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": str(user_id), "email": email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id, "email": user.email, "name": user.name,
        "sun_sign": user.sun_sign, "moon_sign": user.moon_sign, "rising_sign": user.rising_sign,
        "birth_year": user.birth_year, "birth_month": user.birth_month, "birth_day": user.birth_day,
        "birth_city": user.birth_city,
    }


async def get_current_user(token: str, db: AsyncSession) -> User:
    """Decode JWT and return user."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub", 0))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Endpoints ──

@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == req.email.lower().strip()))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        email=req.email.lower().strip(),
        password_hash=pwd_context.hash(req.password),
        name=req.name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id, user.email)
    return TokenResponse(access_token=token, user=user_to_dict(user))


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email.lower().strip()))
    user = result.scalar_one_or_none()

    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.id, user.email)
    return TokenResponse(access_token=token, user=user_to_dict(user))


@router.get("/me", response_model=UserResponse)
async def get_me(authorization: str = "", db: AsyncSession = Depends(get_db)):
    # Extract Bearer token
    token = authorization.replace("Bearer ", "").strip() if authorization else ""
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")

    user = await get_current_user(token, db)
    return UserResponse(**user_to_dict(user))


@router.put("/me/birth-data")
async def update_birth_data(
    data: UpdateBirthData,
    authorization: str = "",
    db: AsyncSession = Depends(get_db),
):
    token = authorization.replace("Bearer ", "").strip() if authorization else ""
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")

    user = await get_current_user(token, db)

    user.birth_year = data.birth_year
    user.birth_month = data.birth_month
    user.birth_day = data.birth_day
    user.birth_hour = data.birth_hour
    user.birth_minute = data.birth_minute
    user.birth_city = data.birth_city
    user.birth_lat = data.birth_lat
    user.birth_lon = data.birth_lon
    user.birth_tz = data.birth_tz
    user.sun_sign = data.sun_sign
    user.moon_sign = data.moon_sign
    user.rising_sign = data.rising_sign

    await db.commit()
    return {"status": "ok", "user": user_to_dict(user)}
