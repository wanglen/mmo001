#!/usr/bin/env bash
# Create the custom Ollama model used for per-player quest generation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODELFILE="$ROOT/server/llm/Modelfile"
MODEL_NAME="${OLLAMA_MODEL:-mmo001-quests}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama not found in PATH. Install Ollama first: https://ollama.com" >&2
  exit 1
fi

echo "Pulling base model llama3.2 (if needed)..."
ollama pull llama3.2

echo "Creating custom model: $MODEL_NAME"
ollama create "$MODEL_NAME" -f "$MODELFILE"
echo "Done. Set OLLAMA_MODEL=$MODEL_NAME (default) and ensure Ollama is running."
