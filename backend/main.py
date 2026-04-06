"""
Olivia Arcana — FastAPI Backend
Wraps the existing astrology engine (kerykeion) with REST endpoints.
"""

import sys
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add parent dir to path so we can import src.astrology
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.api.chart import router as chart_router
from backend.api.daily import router as daily_router
from backend.api.compatibility import router as compat_router
from backend.api.transits import router as transits_router
from backend.api.ask import router as ask_router

app = FastAPI(
    title="Olivia Arcana API",
    description="Astrology engine powered by NASA JPL ephemeris",
    version="1.0.0",
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3333",
        "https://olivia-arcana.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chart_router, prefix="/api", tags=["chart"])
app.include_router(daily_router, prefix="/api", tags=["daily"])
app.include_router(compat_router, prefix="/api", tags=["compatibility"])
app.include_router(transits_router, prefix="/api", tags=["transits"])
app.include_router(ask_router, prefix="/api", tags=["ask"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "olivia-arcana"}
