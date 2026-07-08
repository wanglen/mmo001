# MMO Feature Development — Reference

## GitHub

| | |
|---|---|
| Remote | `origin` → `https://github.com/wanglen/mmo001.git` |
| Repo | [github.com/wanglen/mmo001](https://github.com/wanglen/mmo001) |

Never force-push `main`. PRs/issues via `gh` when user requests.

## Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<name>` | `feature/portal-auto-teleport` |
| Fix | `fix/<name>` | `fix/dungeon-boss-respawn` |
| Chore | `chore/<name>` | `chore/cursor-rules` |

## Version bumps

| Change | Bump |
|--------|------|
| Bug fix, UX polish | patch |
| New TODO feature | minor |
| Breaking protocol/API | major |

## CHANGELOG template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- …

### Changed
- …

### Fixed
- …
```

Move `[Unreleased]` entries into the new version section on release.

## Commit and push

When user asks to **commit and push**:

```bash
./scripts/commit-and-push.sh "Imperative message focusing on why"
```

| Env | Effect |
|-----|--------|
| `SKIP_TESTS=1` | Skip `npm test` (docs-only) |
| `COMMIT_MSG="..."` | Alternative to first argument |

Stages all changes, commits on current branch, merges into `main` if needed, pushes `origin/main`.

**Commit only (no push):** manual `git add` + `git commit` — do not use this script.

**Do not add `.github/workflows/`** unless user wants CI.

## Merge on user approval

**Trigger:** "approve", "looks good", "merge it", "LGTM", or explicit merge to `main`.

1. Ensure `npm test` passes and docs/version/TODO updated
2. Commit via `commit-and-push.sh` if user asked; else merge feature branch to `main`
3. Push only when user asks
4. Do **not** merge without explicit approval

## Merge checklist

- [ ] `npm test` passes
- [ ] Browser smoke test
- [ ] Tests for logic changes (`tests/README.md`)
- [ ] No secrets (`.env`, credentials, `PENDINGS.md`)
- [ ] TODO checked off; CHANGELOG + version updated

## Deployment

```bash
cp .env.example .env          # set SESSION_SECRET (≥16 chars) for production
docker compose up --build     # local
./scripts/update-server.sh    # remote VPS: pull, rebuild, restart
```

No GitHub Actions — test locally before every merge.
