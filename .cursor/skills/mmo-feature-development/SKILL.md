---
name: mmo-feature-development
description: >-
  Implements MMO001 roadmap items with plan-first workflow, feature branches,
  semver releases, and doc updates. Use when implementing TODO items, new game
  features, merging to main, or continuing the Diablo-like MMORPG roadmap.
---

# MMO Feature Development

## When to use

Apply this skill for any TODO item, new game system, or merge/release in MMO001.

## Workflow checklist

Copy and track progress:

```
- [ ] 1. Read TODO.md — pick next unchecked item
- [ ] 2. Plan scope (files, events, modules) before coding
- [ ] 3. Create branch: feature/<short-name> from main
- [ ] 4. Implement minimal correct diff
- [ ] 5. Add/update unit tests (`npm test` must pass)
- [ ] 6. Smoke test (npm start, manual or script)
- [ ] 7. Update TODO.md, CHANGELOG.md, README.md, package.json version
- [ ] 8. When the user asks to **commit and push**: `./scripts/commit-and-push.sh "Imperative message"` (runs tests, stages all, commits, pushes current branch)
- [ ] 9. **On user approval** — commit/push if needed, merge feature branch to `main` (see merge-on-approval below)
- [ ] 10. Push `origin main` when the user asks after merge (`git push origin main` or `./scripts/commit-and-push.sh` on `main`)
- [ ] 11. Create next feature branch for following TODO item
```

## GitHub remote

| | |
|---|---|
| Remote | `origin` → `https://github.com/wanglen/mmo001.git` |
| Repo | [github.com/wanglen/mmo001](https://github.com/wanglen/mmo001) |

- `main` tracks `origin/main`
- **Commit + push current branch:** `./scripts/commit-and-push.sh "Your message"` (from repo root; runs `npm test` unless `SKIP_TESTS=1`)
- Feature branch to remote (if not using the script): `git push -u origin HEAD`
- After merge, publish: `git push origin main` or `./scripts/commit-and-push.sh "..."` on `main` (user must ask)
- PRs/issues: use `gh` when the user requests
- Never force-push `main`

## Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<name>` | `feature/mouse-aim` |
| Fix | `fix/<name>` | `fix/map-spawn` |
| Chore | `chore/<name>` | `chore/cursor-rules` |

## Version bumps (package.json)

| Change | Bump |
|--------|------|
| Bug fix, small tweak | patch (1.0.0 → 1.0.1) |
| New feature (TODO item) | minor (1.0.0 → 1.1.0) |
| Breaking API/protocol change | major (1.0.0 → 2.0.0) |

## CHANGELOG entry template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Feature description

### Changed
- Behavior change

### Fixed
- Bug fix
```

Move items from `[Unreleased]` into the new version section on each release.

## Implementation principles

1. **Server authoritative** — client sends intent; server validates and broadcasts
2. **Modular** — new systems under `server/systems/`, new renderers under `public/js/render/`
3. **Shared contracts** — add socket events to `shared/events.js` first
4. **No scope creep** — one TODO item per branch

## Commit and push

When the user requests a **commit and push** (local + remote), use the project script — do not hand-roll `git add` / `git commit` / `git push` unless the user wants commit-only without push:

```bash
./scripts/commit-and-push.sh "Add zone transitions with instanced maps"
```

| Env | Effect |
|-----|--------|
| `SKIP_TESTS=1` | Skip `npm test` (docs-only changes) |
| `COMMIT_MSG="..."` | Message if omitted as first argument |

The script stages **all** changes, commits on the **current branch**, and runs `git push -u origin HEAD`.

**Commit only (no push):** follow the user's git safety rules — manual `git add` + `git commit`; do **not** run `commit-and-push.sh` (it always pushes).

## Merge checklist

- [ ] `npm test` passes
- [ ] Feature works in browser
- [ ] Unit tests added/updated for logic changes
- [ ] No secrets committed
- [ ] TODO item checked off
- [ ] CHANGELOG + version updated
- [ ] README updated if controls/setup changed

## Merge on user approval

**Trigger:** User approves changes ("approve", "looks good", "merge it", "LGTM", or approves merge to `main`).

**Do immediately (no extra confirmation):**

1. Commit and push any uncommitted work on the feature branch when the user asked to publish: `./scripts/commit-and-push.sh "..."` (or commit only if they did not ask to push)
2. `git checkout main && git merge feature/<branch>`
3. Confirm tests still pass and report result

**Do not** merge without approval.

**Push to GitHub** only when the user asks. After merge on `main`, use `git push origin main` or `./scripts/commit-and-push.sh "..."`.

See also [.cursor/rules/mmo-workflow.mdc](../../rules/mmo-workflow.mdc) § Merge on user approval.

## References

- Roadmap: [TODO.md](../../../TODO.md)
- Project rules: [.cursor/rules/](../../rules/)
- Architecture: [README.md](../../../README.md)
