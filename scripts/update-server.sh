#!/usr/bin/env bash
# Pull latest code, ensure the Ollama quest model exists, rebuild the Docker image,
# and restart the MMO001 server.
# Run from the repo root on a remote host, e.g. ./scripts/update-server.sh
#
# Env:
#   BRANCH=main          — git branch to deploy
#   COMPOSE="docker compose"
#   SKIP_OLLAMA=1        — skip Ollama model setup + expose + reachability check
#   SKIP_OLLAMA_EXPOSE=1 — skip OLLAMA_HOST=0.0.0.0 systemd override

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
  log "Skipping Ollama setup (SKIP_OLLAMA=1)"
elif command -v ollama >/dev/null 2>&1; then
  log "Ensuring Ollama quest model is up to date..."
  ./scripts/ollama-setup-quest-model.sh
  log "Ensuring Ollama is reachable from Docker..."
  ./scripts/ollama-expose-for-docker.sh || true
else
  log "WARNING: ollama not in PATH — skip quest model setup (install Ollama or set SKIP_OLLAMA=1)"
fi

log "Building image and restarting containers..."
$COMPOSE build --pull
# network_mode / env changes require recreate (plain `up -d` may leave an old container)
$COMPOSE up -d --force-recreate --remove-orphans

log "Pruning dangling images..."
docker image prune -f >/dev/null 2>&1 || true

if [[ "${SKIP_OLLAMA:-0}" != "1" ]]; then
  log "Checking Ollama reachability from the game container..."
  CONTAINER_OLLAMA_URL="$($COMPOSE exec -T mmo001 printenv OLLAMA_URL 2>/dev/null || true)"
  log "Container OLLAMA_URL=${CONTAINER_OLLAMA_URL:-unknown}"
  if [[ "${CONTAINER_OLLAMA_URL}" == *"host.docker.internal"* ]] || [[ "${CONTAINER_OLLAMA_URL}" == *"172.17."* ]]; then
    log "WARNING: bridge/host.docker.internal URLs often fail on Linux (EHOSTUNREACH)."
    log "  Compose should use host networking + http://127.0.0.1:11434"
  fi
  if $COMPOSE exec -T mmo001 node --input-type=module -e '
const base = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
console.error("probing", base);
const res = await fetch(`${base}/api/tags`);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const body = await res.json();
const names = (body.models || []).map((m) => m.name).join(", ") || "(none)";
console.log(`reachable models: ${names}`);
' ; then
    log "Ollama is reachable from the container"
  else
    log "WARNING: container cannot reach Ollama (quest generation will fail)."
    log "  1) Confirm container URL is http://127.0.0.1:11434 (host network):"
    log "       docker compose exec mmo001 printenv OLLAMA_URL"
    log "  2) From the host: curl -sS http://127.0.0.1:11434/api/tags | head"
    log "  3) Confirm compose uses network_mode: host, then: docker compose up -d --force-recreate"
  fi
fi

log "Done. Service status:"
$COMPOSE ps

PORT="${PORT:-3000}"
log "Server should be available at http://localhost:${PORT}"
