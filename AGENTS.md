# Agent Instructions — MMO001

Diablo-like MMORPG (HTML Canvas + Node.js + Socket.IO).

## Before coding

1. Read [TODO.md](TODO.md) for the next unchecked item
2. Plan before implementing
3. Follow [.cursor/rules/](.cursor/rules/) and the [mmo-feature-development skill](.cursor/skills/mmo-feature-development/SKILL.md)

## Workflow

```
TODO item → plan → feature/<name> branch → implement → test → docs + version → merge main → commit-and-push or push (when asked) → next branch
```

## GitHub

| | |
|---|---|
| Repository | [github.com/wanglen/mmo001](https://github.com/wanglen/mmo001) |
| Remote | `origin` → `https://github.com/wanglen/mmo001.git` |
| Default branch | `main` (tracks `origin/main`) |

- Create feature branches from `main`; when the user asks to **commit and push**, run `./scripts/commit-and-push.sh "message"` (merges into `main` and pushes when not already on `main`)
- Use `gh` for pull requests and GitHub issues when requested
- Never force-push `main`

## Key files

| File | Purpose |
|------|---------|
| `TODO.md` | Roadmap checklist |
| `CHANGELOG.md` | Version history (Keep a Changelog) |
| `shared/` | Constants, events, shared algorithms |
| `server/` | Express, Socket.IO, game logic |
| `public/js/` | Client game loop, render, UI |

## Commands

```bash
npm install
npm test       # run unit tests
npm start      # http://localhost:3000
npm run dev    # auto-reload
./scripts/commit-and-push.sh "Your message"   # test, commit, merge to main if needed, push main
./scripts/update-server.sh                    # remote: pull, rebuild Docker, restart
```

## Rules summary

- Clean, modular code; server-authoritative gameplay
- One feature per branch; bump semver + CHANGELOG on merge
- **When the user approves changes, merge the feature branch to `main`** (after tests pass and work is committed)
- **Unit tests required** for pure logic and bug fixes; run `npm test` before merge
- JSDoc on public APIs; update README when behavior changes
- Never commit `.env` or credentials
