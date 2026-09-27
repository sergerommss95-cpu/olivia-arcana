"""Token handling tests — own JWT roundtrip + Supabase fallback path."""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import api.auth as auth
from db.models import Base, User

SUPABASE_SECRET = "test-supabase-secret"


@pytest.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as session:
        yield session
    await engine.dispose()


@pytest.fixture
def supabase_secret(monkeypatch):
    monkeypatch.setattr(auth, "SUPABASE_JWT_SECRET", SUPABASE_SECRET)


def _supabase_token(
    email="sb@example.com",
    aud="authenticated",
    exp_delta=timedelta(hours=1),
    secret=SUPABASE_SECRET,
):
    sub = str(uuid.uuid4())
    claims = {
        "sub": sub,
        "email": email,
        "aud": aud,
        "exp": datetime.now(timezone.utc) + exp_delta,
        "user_metadata": {"full_name": "Test User"},
    }
    return sub, jwt.encode(claims, secret, algorithm="HS256")


async def test_own_jwt_roundtrip(db):
    user = User(email="own@example.com")
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = auth.create_token(user.id, user.email)
    resolved = await auth.get_current_user(token, db)
    assert resolved.id == user.id
    assert resolved.email == "own@example.com"


async def test_supabase_token_provisions_user(db, supabase_secret):
    sub, token = _supabase_token(email="new@example.com")
    user = await auth.get_current_user(token, db)
    assert user.supabase_id == sub
    assert user.email == "new@example.com"
    assert user.name == "Test User"

    # Second call resolves the same row — no duplicate provisioning.
    again = await auth.get_current_user(token, db)
    assert again.id == user.id


async def test_supabase_token_links_existing_email(db, supabase_secret):
    existing = User(email="link@example.com")
    db.add(existing)
    await db.commit()
    await db.refresh(existing)

    sub, token = _supabase_token(email="link@example.com")
    user = await auth.get_current_user(token, db)
    assert user.id == existing.id
    assert user.supabase_id == sub


async def test_bad_audience_rejected(db, supabase_secret):
    _, token = _supabase_token(aud="wrong-audience")
    with pytest.raises(HTTPException) as exc:
        await auth.get_current_user(token, db)
    assert exc.value.status_code == 401


async def test_expired_rejected(db, supabase_secret):
    _, token = _supabase_token(exp_delta=timedelta(hours=-1))
    with pytest.raises(HTTPException) as exc:
        await auth.get_current_user(token, db)
    assert exc.value.status_code == 401


async def test_wrong_signature_rejected(db, supabase_secret):
    _, token = _supabase_token(secret="some-other-secret")
    with pytest.raises(HTTPException) as exc:
        await auth.get_current_user(token, db)
    assert exc.value.status_code == 401


async def test_garbage_token_rejected(db, supabase_secret):
    with pytest.raises(HTTPException) as exc:
        await auth.get_current_user("not-a-jwt", db)
    assert exc.value.status_code == 401


async def test_supabase_disabled_when_secret_unset(db, monkeypatch):
    monkeypatch.setattr(auth, "SUPABASE_JWT_SECRET", "")
    _, token = _supabase_token()
    with pytest.raises(HTTPException) as exc:
        await auth.get_current_user(token, db)
    assert exc.value.status_code == 401
