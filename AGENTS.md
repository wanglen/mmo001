# Agent Instructions — MMO001

Diablo-like MMORPG (Canvas + Node.js + Socket.IO). **MVP complete** — work from [TODO.md](TODO.md) (playtesting fixes).

## Start here

1. Read **next unchecked item** in [TODO.md](TODO.md)
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
- Bump semver + CHANGELOG + check off TODO on merge
- Never commit `.env`, credentials, or `data/`
