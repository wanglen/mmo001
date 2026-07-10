#!/usr/bin/env bash
# Pull latest code, ensure the Ollama quest model exists, rebuild the Docker image,
# and restart the MMO001 server.
# Run from the repo root on a remote host, e.g. ./scripts/update-server.sh
#
# Env:
#   BRANCH=main          — git branch to deploy
#   COMPOSE="docker compose"
#   SKIP_OLLAMA=1        — skip ./scripts/ollama-setup-quest-model.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BRANCH="${BRANCH:-main}"
COMPOSE="${COMPOSE:-docker compose}"

log() {
  printf '[update-server] %s\n' "$*"
}

die() {
  printf '[update-server] ERROR: %s\n' "$*" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || die "git is not installed"
command -v docker >/dev/null 2>&1 || die "docker is not installed"
$COMPOSE version >/dev/null 2>&1 || die "docker compose is not available (set COMPOSE if needed)"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  die "not a git repository: $ROOT"
fi

if [[ -n "$(git status --porcelain)" ]]; then
  die "working tree has uncommitted changes; commit or stash before updating"
fi

log "Fetching and pulling origin/$BRANCH..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

mkdir -p data/characters

if [[ "${SKIP_OLLAMA:-0}" == "1" ]]; then
  log "Skipping Ollama quest model setup (SKIP_OLLAMA=1)"
elif command -v ollama >/dev/null 2>&1; then
  log "Ensuring Ollama quest model is up to date..."
  ./scripts/ollama-setup-quest-model.sh
else
  log "WARNING: ollama not in PATH — skip quest model setup (install Ollama or set SKIP_OLLAMA=1)"
fi

log "Building image and restarting containers..."
$COMPOSE build --pull
$COMPOSE up -d --remove-orphans

log "Pruning dangling images..."
docker image prune -f >/dev/null 2>&1 || true

log "Done. Service status:"
$COMPOSE ps

PORT="${PORT:-3000}"
log "Server should be available at http://localhost:${PORT}"
