#!/usr/bin/env bash
# Stage changes, commit, and push the current branch to origin.
#
# Usage:
#   ./scripts/commit-and-push.sh "Add feature X"
#   COMMIT_MSG="Fix bug Y" ./scripts/commit-and-push.sh
#   SKIP_TESTS=1 ./scripts/commit-and-push.sh "Docs only"
#
# Options (env):
#   COMMIT_MSG   — commit message (alternative to first argument)
#   SKIP_TESTS=1 — skip npm test before commit
#   RUN_TESTS=0  — same as SKIP_TESTS=1 (default: run tests)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RUN_TESTS="${RUN_TESTS:-1}"
SKIP_TESTS="${SKIP_TESTS:-0}"

log() {
  printf '[commit-and-push] %s\n' "$*"
}

die() {
  printf '[commit-and-push] ERROR: %s\n' "$*" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || die "git is not installed"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  die "not a git repository: $ROOT"
fi

MSG="${1:-${COMMIT_MSG:-}}"
if [[ -z "$MSG" ]]; then
  die 'commit message required — ./scripts/commit-and-push.sh "Your message"'
fi

if [[ -z "$(git status --porcelain)" ]]; then
  die "nothing to commit (working tree clean)"
fi

BRANCH="$(git branch --show-current)"
if [[ -z "$BRANCH" ]]; then
  die "detached HEAD — checkout a branch before committing"
fi

if [[ "$RUN_TESTS" == "1" && "$SKIP_TESTS" != "1" ]]; then
  command -v npm >/dev/null 2>&1 || die "npm is not installed (set SKIP_TESTS=1 to skip tests)"
  log "Running tests..."
  npm test
fi

log "Staging all changes..."
git add -A

log "Creating commit on $BRANCH..."
git commit -m "$MSG"

log "Pushing to origin/$BRANCH..."
git push -u origin HEAD

log "Done. $(git log -1 --oneline)"
