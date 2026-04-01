#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
CONFIRM_DESTROY="${CONFIRM_DESTROY:-}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE"
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-underworld-chat-prod}"

if [ "$CONFIRM_DESTROY" != "underworld-chat" ]; then
  echo "Refusing to destroy the production stack without confirmation."
  echo "Run again with: CONFIRM_DESTROY=underworld-chat ./scripts/destroy-prod.sh"
  exit 1
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v --remove-orphans

cat <<EOF

Production stack stopped and named volumes removed for project ${PROJECT_NAME}.
Repository files were left intact.

EOF
