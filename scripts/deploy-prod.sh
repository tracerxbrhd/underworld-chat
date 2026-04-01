#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis minio
sleep 5
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm createbuckets
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend python manage.py migrate --noinput
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend python manage.py collectstatic --noinput
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
