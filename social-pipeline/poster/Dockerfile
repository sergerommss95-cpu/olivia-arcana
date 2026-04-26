# Olivia Arcana — Poster Service
# Lightweight FastAPI app that reads from GCS and posts to social platforms.
# Deployed as a Cloud Run Service, triggered by Cloud Scheduler.

FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi>=0.104.0 \
    uvicorn[standard]>=0.24.0 \
    httpx>=0.27.0 \
    google-cloud-storage>=2.14.0

# Copy poster + shared scripts
COPY poster/ poster/
COPY scripts/gcs_client.py scripts/gcs_client.py
COPY scripts/__init__.py scripts/__init__.py
COPY config/ config/

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

CMD ["python", "poster/main.py"]
