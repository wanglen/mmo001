---
name: mmo-feature-development
description: >-
  Implements MMO001 TODO items with plan-first workflow, feature branches, semver
  releases, and doc updates. Use when implementing roadmap items, playtesting fixes,
  merging to main, commit-and-push, or continuing the Diablo-like MMORPG.
---

# MMO Feature Development

MVP complete (v3.3.0). Roadmap: [TODO.md](../../../TODO.md). Architecture: [.cursor/rules/architecture.mdc](../../rules/architecture.mdc).

## Checklist

```
1. Read TODO.md — next unchecked item
2. Plan scope (files, events, modules)
3. Branch: feature/<name> or fix/<name> from main
4. Minimal correct diff
5. npm test (+ unit tests for pure logic)
6. Smoke test in browser
7. TODO + CHANGELOG + version + README (if needed)
8. commit-and-push.sh — only when user asks
```

## Task hints

| Task | Start here |
|------|------------|
| Portal / zone travel | `InteractionInput.js`, `zoneTransition.js`, `GameLoop.setWorldState` |
| Pickup feedback | `shared/lootRules.js`, loot plugin, chat/toast UI |
| Dungeon chests / boss | `server/map/`, `shared/dungeon.js` |
| HUD layout | `render/layers/`, `style.css`, `InputRouter` modal blocking |
| Audio / settings | `public/js/audio/`, `SettingsPanel`, `shared/audioSettings.js` |
| Debug movement | `DEBUG_EVENTS=1`, `server/debug/eventLog.js` |

## Principles

- Server authoritative; plugin-first (`server/plugins/`, `public/js/plugins/`)
- Pure logic in `shared/`; socket events in `shared/kernel/events.js`
- One TODO item per branch; SQLite in `data/game.db` — never commit `data/` or `.env`

## More detail

- Merge approval, commit-and-push, deployment, semver → [reference.md](reference.md)
- Git rules summary → [.cursor/rules/mmo-workflow.mdc](../../rules/mmo-workflow.mdc)
