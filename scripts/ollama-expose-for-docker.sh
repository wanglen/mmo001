#!/usr/bin/env bash
# Make host Ollama listen on all interfaces so Docker containers can reach it.
# Default Ollama bind is 127.0.0.1 only — that blocks host.docker.internal traffic.
#
# Usage:
#   ./scripts/ollama-expose-for-docker.sh
#   SKIP_OLLAMA_EXPOSE=1  — no-op (used by update-server)

set -euo pipefail

if [[ "${SKIP_OLLAMA_EXPOSE:-0}" == "1" ]]; then
  echo "[ollama-expose] skipped (SKIP_OLLAMA_EXPOSE=1)"
  exit 0
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "[ollama-expose] ollama not in PATH — nothing to do" >&2
  exit 0
fi

OVERRIDE_DIR="/etc/systemd/system/ollama.service.d"
OVERRIDE_FILE="${OVERRIDE_DIR}/docker-host.conf"

needs_expose() {
  # If something is already listening on *:11434 (or 0.0.0.0), we're good.
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | grep -qE '[:.]11434\b' || return 0
    if ss -ltn 2>/dev/null | grep -E '[:.]11434\b' | grep -qvE '127\.0\.0\.1|\[::1\]'; then
      return 1
    fi
    return 0
  fi
  return 0
}

if ! needs_expose; then
  echo "[ollama-expose] Ollama already listening beyond localhost — ok"
  exit 0
fi

if [[ ! -d /etc/systemd/system ]] || ! command -v systemctl >/dev/null 2>&1; then
  echo "[ollama-expose] WARNING: systemd not available."
  echo "  Start Ollama with: OLLAMA_HOST=0.0.0.0 ollama serve"
  exit 0
fi

if [[ ! -f /etc/systemd/system/ollama.service ]] && [[ ! -f /lib/systemd/system/ollama.service ]] && ! systemctl cat ollama >/dev/null 2>&1; then
  echo "[ollama-expose] WARNING: ollama systemd unit not found."
  echo "  Start Ollama with: OLLAMA_HOST=0.0.0.0 ollama serve"
  exit 0
fi

if [[ "${EUID}" -ne 0 ]] && ! command -v sudo >/dev/null 2>&1; then
  echo "[ollama-expose] WARNING: need root/sudo to set OLLAMA_HOST=0.0.0.0"
  echo "  Run: sudo ./scripts/ollama-expose-for-docker.sh"
  exit 0
fi

SUDO=()
if [[ "${EUID}" -ne 0 ]]; then
  SUDO=(sudo)
fi

echo "[ollama-expose] Configuring Ollama to listen on 0.0.0.0:11434 (Docker access)..."
"${SUDO[@]}" mkdir -p "$OVERRIDE_DIR"
"${SUDO[@]}" tee "$OVERRIDE_FILE" >/dev/null <<'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
EOF

"${SUDO[@]}" systemctl daemon-reload
"${SUDO[@]}" systemctl restart ollama
echo "[ollama-expose] Done. Ollama should accept connections from Docker via host.docker.internal:11434"
