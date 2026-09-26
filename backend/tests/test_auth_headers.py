"""Exercise HTTP header binding, not just direct token-helper calls."""

import httpx
import pytest
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import api.auth as auth
from db.models import Base, User


BIRTH_DATA = {"birth_year": 1992, "birth_month": 4, "birth_day": 8, "birth_city": "Kyiv"}


@pytest.fixture
async def signed_in_client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with sessions() as db:
        user = User(email="header-test@example.com", name="Header test")
        db.add(user)
        await db.commit()
        await db.refresh(user)
        token = auth.create_token(user.id, user.email)

        async def test_db():
            yield db

        app = FastAPI()
        app.include_router(auth.router, prefix="/api/auth")
        app.dependency_overrides[auth.get_db] = test_db
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            yield client, token, user
    await engine.dispose()


@pytest.mark.parametrize("method,path", [("GET", "/api/auth/me"), ("PUT", "/api/auth/me/birth-data")])
async def test_authorization_header_authenticates_both_account_routes(signed_in_client, method, path):
    client, token, user = signed_in_client
    response = await client.request(method, path, headers={"Authorization": f"Bearer {token}"}, **({"json": BIRTH_DATA} if method == "PUT" else {}))
    assert response.status_code == 200
    profile = response.json()["user"] if method == "PUT" else response.json()
    assert profile["id"] == user.id
    assert profile["email"] == user.email
    if method == "PUT":
        assert profile["birth_city"] == "Kyiv"
        assert user.birth_year == 1992


@pytest.mark.parametrize("method,path", [("GET", "/api/auth/me"), ("PUT", "/api/auth/me/birth-data")])
async def test_query_parameter_cannot_replace_missing_authorization_header(signed_in_client, method, path):
    client, token, user = signed_in_client
    response = await client.request(method, path, params={"authorization": f"Bearer {token}"}, **({"json": BIRTH_DATA} if method == "PUT" else {}))
    assert response.status_code == 401
    assert response.json()["detail"] == "No token provided"
    assert user.birth_year is None


async def test_header_names_are_case_insensitive_and_query_token_cannot_override_them(signed_in_client):
    client, token, _ = signed_in_client
    response = await client.get("/api/auth/me", headers={"authorization": f"Bearer {token}"}, params={"authorization": "Bearer invalid-query-token"})
    assert response.status_code == 200
    response = await client.get("/api/auth/me", headers={"Authorization": "Bearer invalid-header-token"}, params={"authorization": f"Bearer {token}"})
    assert response.status_code == 401
