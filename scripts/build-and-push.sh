#!/usr/bin/env bash
set -euo pipefail

DOCKER_USER="ihainan"
DATE_TAG=$(date +%Y%m%d)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

build_and_push() {
  local name="$1"
  local context="$2"

  echo "==> Building $name"
  docker build --platform linux/amd64 \
    -t "$DOCKER_USER/$name:$DATE_TAG" \
    -t "$DOCKER_USER/$name:latest" \
    "$context"

  echo "==> Pushing $name"
  docker push "$DOCKER_USER/$name:$DATE_TAG"
  docker push "$DOCKER_USER/$name:latest"
}

build_and_push orbit-backend  "$ROOT/backend"
build_and_push orbit-frontend "$ROOT/frontend"

echo "Done. Tagged as $DATE_TAG and latest."
