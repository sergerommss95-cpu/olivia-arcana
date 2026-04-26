#!/bin/bash
# Olivia Arcana — Deploy pipeline + poster to Google Cloud Run
# Usage: ./deploy.sh [pipeline|poster|all]

set -euo pipefail

PROJECT="project-f778abe0-d2d9-47df-802"
REGION="us-central1"
REPO="olivia-arcana"
BUCKET="olivia-arcana-daily"

# Colors
G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; NC='\033[0m'

echo -e "${Y}Olivia Arcana — Cloud Deploy${NC}"
echo "Project: $PROJECT  Region: $REGION"
echo ""

# ─── Create Artifact Registry repo (if needed) ───
create_repo() {
    if ! gcloud artifacts repositories describe "$REPO" --location="$REGION" --project="$PROJECT" &>/dev/null; then
        echo -e "${Y}Creating Artifact Registry repo...${NC}"
        gcloud artifacts repositories create "$REPO" \
            --repository-format=docker \
            --location="$REGION" \
            --project="$PROJECT" \
            --description="Olivia Arcana container images"
        gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
    fi
}

# ─── Create GCS bucket (if needed) ───
create_bucket() {
    if ! gsutil ls "gs://$BUCKET" &>/dev/null; then
        echo -e "${Y}Creating Cloud Storage bucket...${NC}"
        gsutil mb -p "$PROJECT" -l "$REGION" "gs://$BUCKET"
        # Auto-delete after 30 days
        cat > /tmp/lifecycle.json << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF
        gsutil lifecycle set /tmp/lifecycle.json "gs://$BUCKET"
        echo -e "${G}Bucket created with 30-day auto-delete${NC}"
    else
        echo "Bucket gs://$BUCKET already exists"
    fi
}

# ─── Deploy Pipeline (Cloud Run Job) ───
deploy_pipeline() {
    echo -e "${Y}Building pipeline image...${NC}"
    local IMAGE="$REGION-docker.pkg.dev/$PROJECT/$REPO/daily-pipeline:latest"

    docker build -t "$IMAGE" -f Dockerfile .
    docker push "$IMAGE"

    echo -e "${Y}Deploying Cloud Run Job...${NC}"
    gcloud run jobs create olivia-daily-pipeline \
        --image="$IMAGE" \
        --region="$REGION" \
        --project="$PROJECT" \
        --memory=2Gi \
        --cpu=2 \
        --max-retries=1 \
        --task-timeout=900 \
        --set-secrets="\
ANTHROPIC_API_KEY=anthropic-api-key:latest,\
ELEVENLABS_API_KEY=elevenlabs-api-key:latest,\
TELEGRAM_BOT_TOKEN=telegram-bot-token:latest" \
        --set-env-vars="GCS_BUCKET=$BUCKET,GOOGLE_CLOUD_PROJECT=$PROJECT" \
        2>/dev/null || \
    gcloud run jobs update olivia-daily-pipeline \
        --image="$IMAGE" \
        --region="$REGION" \
        --project="$PROJECT" \
        --memory=2Gi \
        --cpu=2 \
        --max-retries=1 \
        --task-timeout=900 \
        --set-secrets="\
ANTHROPIC_API_KEY=anthropic-api-key:latest,\
ELEVENLABS_API_KEY=elevenlabs-api-key:latest,\
TELEGRAM_BOT_TOKEN=telegram-bot-token:latest" \
        --set-env-vars="GCS_BUCKET=$BUCKET,GOOGLE_CLOUD_PROJECT=$PROJECT"

    echo -e "${G}Pipeline deployed!${NC}"
}

# ─── Deploy Poster (Cloud Run Service) ───
deploy_poster() {
    echo -e "${Y}Building poster image...${NC}"
    local IMAGE="$REGION-docker.pkg.dev/$PROJECT/$REPO/poster:latest"

    docker build -t "$IMAGE" -f poster/Dockerfile .
    docker push "$IMAGE"

    echo -e "${Y}Deploying Cloud Run Service...${NC}"
    gcloud run deploy olivia-poster \
        --image="$IMAGE" \
        --region="$REGION" \
        --project="$PROJECT" \
        --memory=512Mi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=2 \
        --allow-unauthenticated \
        --set-secrets="\
TELEGRAM_BOT_TOKEN=telegram-bot-token:latest,\
TIKTOK_ACCESS_TOKEN=tiktok-access-token:latest" \
        --set-env-vars="GCS_BUCKET=$BUCKET,GOOGLE_CLOUD_PROJECT=$PROJECT"

    echo -e "${G}Poster deployed!${NC}"
    local URL=$(gcloud run services describe olivia-poster --region="$REGION" --project="$PROJECT" --format='value(status.url)')
    echo -e "  URL: ${G}$URL${NC}"
}

# ─── Setup Cloud Scheduler ───
setup_scheduler() {
    local POSTER_URL=$(gcloud run services describe olivia-poster --region="$REGION" --project="$PROJECT" --format='value(status.url)' 2>/dev/null)
    if [ -z "$POSTER_URL" ]; then
        echo -e "${R}Poster service not deployed yet. Run: ./deploy.sh poster${NC}"
        return 1
    fi

    echo -e "${Y}Setting up Cloud Scheduler...${NC}"

    # Daily generation at 04:00 UTC
    gcloud scheduler jobs create http olivia-generate \
        --schedule="0 4 * * *" \
        --uri="https://$REGION-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$PROJECT/jobs/olivia-daily-pipeline:run" \
        --http-method=POST \
        --oauth-service-account-email="$PROJECT@appspot.gserviceaccount.com" \
        --location="$REGION" \
        --project="$PROJECT" \
        2>/dev/null || echo "  (olivia-generate already exists)"

    # TikTok posting: 10, 12, 14, 16, 18 UTC
    for hour in 10 12 14 16 18; do
        gcloud scheduler jobs create http "olivia-post-tiktok-${hour}" \
            --schedule="0 $hour * * *" \
            --uri="$POSTER_URL/post-next?platform=tiktok" \
            --http-method=POST \
            --location="$REGION" \
            --project="$PROJECT" \
            2>/dev/null || echo "  (olivia-post-tiktok-$hour already exists)"
    done

    # YouTube: 10, 14, 18 UTC
    for hour in 10 14 18; do
        gcloud scheduler jobs create http "olivia-post-youtube-${hour}" \
            --schedule="0 $hour * * *" \
            --uri="$POSTER_URL/post-next?platform=youtube" \
            --http-method=POST \
            --location="$REGION" \
            --project="$PROJECT" \
            2>/dev/null || echo "  (olivia-post-youtube-$hour already exists)"
    done

    # Telegram: 05:15 UTC (all at once)
    gcloud scheduler jobs create http olivia-post-telegram \
        --schedule="15 5 * * *" \
        --uri="$POSTER_URL/post-next?platform=telegram" \
        --http-method=POST \
        --location="$REGION" \
        --project="$PROJECT" \
        2>/dev/null || echo "  (olivia-post-telegram already exists)"

    echo -e "${G}Scheduler configured!${NC}"
}

# ─── Setup Secret Manager ───
setup_secrets() {
    echo -e "${Y}Setting up Secret Manager...${NC}"
    local secrets=("anthropic-api-key" "elevenlabs-api-key" "telegram-bot-token" "tiktok-access-token")

    for secret in "${secrets[@]}"; do
        if ! gcloud secrets describe "$secret" --project="$PROJECT" &>/dev/null; then
            echo -n "  Enter value for $secret (or press Enter to skip): "
            read -r value
            if [ -n "$value" ]; then
                echo -n "$value" | gcloud secrets create "$secret" \
                    --data-file=- \
                    --project="$PROJECT" \
                    --replication-policy=automatic
                echo -e "  ${G}Created: $secret${NC}"
            else
                echo "  Skipped: $secret"
            fi
        else
            echo "  Exists: $secret"
        fi
    done

    # Grant Cloud Run access to secrets
    local SA="${PROJECT}@appspot.gserviceaccount.com"
    for secret in "${secrets[@]}"; do
        gcloud secrets add-iam-policy-binding "$secret" \
            --member="serviceAccount:$SA" \
            --role="roles/secretmanager.secretAccessor" \
            --project="$PROJECT" \
            --quiet 2>/dev/null || true
    done
    echo -e "${G}Secrets configured!${NC}"
}

# ─── Main ───
case "${1:-all}" in
    pipeline)  create_repo; deploy_pipeline ;;
    poster)    create_repo; deploy_poster ;;
    scheduler) setup_scheduler ;;
    secrets)   setup_secrets ;;
    bucket)    create_bucket ;;
    all)
        create_repo
        create_bucket
        setup_secrets
        deploy_pipeline
        deploy_poster
        setup_scheduler
        echo -e "\n${G}All deployed! Pipeline runs daily at 04:00 UTC.${NC}"
        ;;
    *)
        echo "Usage: ./deploy.sh [pipeline|poster|scheduler|secrets|bucket|all]"
        exit 1
        ;;
esac
