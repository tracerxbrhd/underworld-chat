#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE"
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

if [ -z "${MINIO_ROOT_PASSWORD:-}" ] || [ "${#MINIO_ROOT_PASSWORD}" -lt 8 ]; then
  echo "MINIO_ROOT_PASSWORD must be at least 8 characters long."
  exit 1
fi

if [ "${S3_ACCESS_KEY:-}" != "${MINIO_ROOT_USER:-}" ] || [ "${S3_SECRET_KEY:-}" != "${MINIO_ROOT_PASSWORD:-}" ]; then
  echo "S3_ACCESS_KEY/S3_SECRET_KEY should match MINIO_ROOT_USER/MINIO_ROOT_PASSWORD in the current production setup."
  echo "Either align those values in $ENV_FILE or add a separate MinIO service-account provisioning step."
  exit 1
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis minio
sleep 5
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm createbuckets
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend python manage.py migrate --noinput
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend python manage.py collectstatic --noinput
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
