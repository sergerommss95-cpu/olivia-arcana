"""Membership answers must reflect authenticated, current server entitlement."""

from datetime import datetime, timedelta, timezone

import httpx
import pytest
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from api import auth, payments
from db.database import get_db
from db.models import Base, User
from services.paddle_service import _apply_subscription


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
async def client(db):
    app = FastAPI()
    app.include_router(payments.router, prefix="/api/payments")

    async def use_db():
        yield db

    app.dependency_overrides[get_db] = use_db
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as http:
        yield http


async def make_user(db, **fields):
    user = User(email="member@example.com", **fields)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def test_bearer_header_resolves_paid_member(client, db):
    user = await make_user(db, tier="premium", subscription_status="active")
    token = auth.create_token(user.id, user.email)
    response = await client.get("/api/payments/status", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["is_paid"] is True
    assert response.json()["tier"] == "premium"
    assert (await client.get("/api/payments/status")).status_code == 401
    # Tokens in URLs are deliberately not accepted.
    assert (await client.get("/api/payments/status", params={"authorization": f"Bearer {token}"})).status_code == 401


@pytest.mark.parametrize("status, days_ago, expected", [
    ("past_due", 1, True), ("past_due", 5, False),
    ("canceled", 1, True), ("canceled", 5, False),
])
async def test_expiry_grace_uses_model_and_handles_naive_database_dates(client, db, status, days_ago, expected):
    user = await make_user(db, tier="insight", subscription_status=status,
                           subscription_period_end=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days_ago))
    token = auth.create_token(user.id, user.email)
    response = await client.get("/api/payments/status", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["tier"] == "insight"
    assert response.json()["is_paid"] is expected


async def test_supabase_only_bearer_resolves(client, db, monkeypatch):
    from jose import jwt
    monkeypatch.setattr(auth, "SUPABASE_JWT_SECRET", "test-supabase-secret")
    await make_user(db, tier="vip", subscription_status="active", supabase_id="member-uuid")
    token = jwt.encode({"sub": "member-uuid", "email": "member@example.com", "aud": "authenticated",
                        "exp": datetime.now(timezone.utc) + timedelta(hours=1)}, "test-supabase-secret", algorithm="HS256")
    response = await client.get("/api/payments/status", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["is_paid"] is True


async def test_webhook_stores_real_utc_datetime(db):
    user = await make_user(db)
    await _apply_subscription({
        "id": "sub_test", "status": "active", "custom_data": {"user_id": str(user.id), "price_key": "insight_monthly"},
        "current_billing_period": {"ends_at": "2027-01-04T12:30:00+02:00"},
    }, db)
    await db.refresh(user)
    assert user.subscription_period_end == datetime(2027, 1, 4, 10, 30)
    assert user.is_paid is True


def test_payment_routes_read_authorization_from_headers():
    app = FastAPI()
    app.include_router(payments.router, prefix="/api/payments")
    schema = app.openapi()
    for path, method in [("/status", "get"), ("/paddle/checkout", "post"), ("/paddle/portal", "post"), ("/stars/invoice", "post")]:
        parameters = schema["paths"]["/api/payments" + path][method]["parameters"]
        assert any(p["name"] == "authorization" and p["in"] == "header" for p in parameters)
