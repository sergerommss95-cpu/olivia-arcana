"""Olivia Arcana — FastAPI Backend with Auth."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import init_db
from api.auth import router as auth_router
from api.payments import router as payments_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Olivia Arcana API",
    description="Astrology engine + auth",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3333",
        "https://oliviaarcana.com",
        "https://www.oliviaarcana.com",
        "https://olivia-arcana.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(payments_router, prefix="/api/payments", tags=["payments"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "olivia-arcana"}
