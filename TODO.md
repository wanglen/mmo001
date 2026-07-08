# MMO001 — Roadmap

MVP complete (v3.3.0): accounts, multiplayer, combat, loot, quests, economy, polish, and Docker deployment.

Work below comes from playtesting feedback. One item per feature branch; check off and bump semver on merge.

---

## Gameplay & zones

### Portals & travel
- [x] **Portal auto-teleport** — clicking a portal pathfinds to it; travel triggers on arrival (no extra click on the tile)
- [x] **Interruptible recall** — town recall (**T**) cancels on click-to-move, monster hit, or starting combat (verify/fix current behavior)

### Dungeon
- [ ] **Dungeon boss respawn** — reduce how often the dungeon lord respawns
- [ ] **Dungeon chests** — spawn landmark chests in dungeon rooms (generator / placement)

---

## Feedback & UI

### Pickup & inventory
- [x] **Item pickup message** — brief on-screen or chat notice when loot is collected
- [x] **Socket overwrite warning** — confirm before replacing a gem already socketed in gear
- [x] **Gem and rune icons** — distinct icons for socketables (inventory, tooltips, socket UI)

### Layout
- [x] **Bottom HUD layout** — fix elements clipped or misaligned at the bottom of the viewport (skill bar, orbs, chat overlap)

### World log
- [x] **World event list** — transient toast feed for notable events (kills, level-ups, quest updates, party/trade notices)

---

## Backlog (optional)

- [ ] CI pipeline (GitHub Actions) — skipped for now; run `npm test` locally before merge

---

## Next tasks (recommended order)

1. [ ] **Dungeon boss respawn tuning**
2. [ ] **Dungeon chest spawning**

---

## Workflow

```
TODO item → plan → feature/<name> → implement → npm test → docs + version → merge main
```

Commit and push when ready:

```bash
./scripts/commit-and-push.sh "Your message"
```

See [AGENTS.md](AGENTS.md) and [.cursor/skills/mmo-feature-development/SKILL.md](.cursor/skills/mmo-feature-development/SKILL.md).
