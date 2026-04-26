# Olivia Arcana — Daily Content Pipeline
# Generates zodiac videos, story cards, feed images, and posting manifests.
# Deployed as a Cloud Run Job, triggered daily by Cloud Scheduler.

FROM python:3.11-slim

# FFmpeg for video rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir google-cloud-storage google-cloud-secret-manager

# Copy pipeline code
COPY scripts/ scripts/
COPY config/ config/
COPY prompts/ prompts/
COPY templates/ templates/
COPY assets/ assets/
COPY fonts/ fonts/

# Output dir
RUN mkdir -p output

# Default: run the daily pipeline
ENV PYTHONUNBUFFERED=1
CMD ["python", "scripts/daily_pipeline.py", "daily"]
