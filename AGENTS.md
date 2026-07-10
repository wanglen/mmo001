# Agent Instructions — MMO001

Diablo-like MMORPG (Canvas + Node.js + Socket.IO). **v3.9.0** — work from [TODO.md](TODO.md) (promoted from PENDINGS).

## Start here

1. Read [TODO.md](TODO.md) — next unchecked item (see **Next tasks** for suggested order)
2. Follow [.cursor/skills/mmo-feature-development/SKILL.md](.cursor/skills/mmo-feature-development/SKILL.md) for workflow, merge, and release
3. Follow [.cursor/rules/](.cursor/rules/) — **code-quality** (always), **architecture** (when editing server/client/shared)

Personal notes: `PENDINGS.md` (gitignored) → promote into `TODO.md` before coding.

## Commands

```bash
npm test && npm start    # verify before merge; smoke test
./scripts/commit-and-push.sh "message"   # only when user asks to commit and push
./scripts/update-server.sh               # remote Docker deploy
```

## Non-negotiables

- Server-authoritative gameplay; one TODO item per branch
- `npm test` before merge; unit tests for pure logic and bug fixes
- Bump semver + CHANGELOG + README/TODO when user-facing behavior changes
- Never commit `.env`, credentials, or `data/`

## World content (reference)

| Map ID | Label | Notes |
|--------|-------|--------|
| `town` | Town | Safe hub, NPCs, vendor, stash |
| `wilderness` | Wilderness | Hub to forest, desert, dungeon |
| `forest` | Dark Forest | +1 monster level, dense biome |
| `desert` | Scorched Desert | +2 monster level, dune biome |
| `dungeon` | Dungeon | Instanced, boss, chests |

Quest content: `shared/content/quests.json` (starter chain + zone follow-ups).
