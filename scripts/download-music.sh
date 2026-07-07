#!/usr/bin/env bash
# Download CC0 zone music loops from OpenGameArt into public/assets/audio/music/.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/public/assets/audio/music"
BASE="https://opengameart.org/sites/default/files"

mkdir -p "$DEST"

curl -fsSL -o "$DEST/town.ogg" "$BASE/RPG_Town_Ambience_1.ogg"
curl -fsSL -o "$DEST/wilderness.ogg" "$BASE/RPG_Ambient_4_The_Dark_Wood_.ogg"
curl -fsSL -o "$DEST/dungeon.ogg" "$BASE/dungeon_ambient_1.ogg"

echo "Music tracks saved to $DEST"
ls -la "$DEST"/*.ogg
