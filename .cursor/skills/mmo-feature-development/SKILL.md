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
- [ ] 8. Commit with imperative message
- [ ] 9. **On user approval** — commit if needed, run `npm test`, merge feature branch to `main` (see merge-on-approval below)
- [ ] 10. Create next feature branch for following TODO item
```

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

1. Commit any uncommitted work on the feature branch (if tests pass)
2. `git checkout main && git merge feature/<branch>`
3. Confirm tests still pass and report result

**Do not** merge without approval. **Do not** push unless asked.

See also [.cursor/rules/mmo-workflow.mdc](../../rules/mmo-workflow.mdc) § Merge on user approval.

## References

- Roadmap: [TODO.md](../../../TODO.md)
- Project rules: [.cursor/rules/](../../rules/)
- Architecture: [README.md](../../../README.md)
