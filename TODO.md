# MMO001 — Roadmap

Playtesting phase complete through v3.5.0. New work below comes from [PENDINGS.md](PENDINGS.md). One item per feature branch; check off and bump semver on merge.

---

## Combat & progression

- [x] **Level-scaled monsters** — scale monster stats (HP, damage, XP) with player level or zone depth

---

## Inventory & economy

- [ ] **Gems and runes in stash** — allow socketables to be stored in the shared town stash
- [ ] **Inventory sort** — sort button to organize bag slots (type, rarity, etc.)
- [ ] **Vendor potion stacks** — group potions in sell view; choose how many to sell at once

---

## World & content

- [ ] **More maps and zones** — add new areas (e.g. desert, forest) with portals and spawns
- [ ] **More quests** — additional quest lines tied to new or existing zones

---

## Backlog (optional)

- [ ] CI pipeline (GitHub Actions) — skipped for now; run `npm test` locally before merge

---

## Next tasks (recommended order)

1. [ ] **Inventory sort**
2. [ ] **Gems and runes in stash**
3. [ ] **Vendor potion stacks**
4. [ ] **More maps and zones**
5. [ ] **More quests**

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

---

## Completed (v3.3.x – v3.5.0)

<details>
<summary>Playtesting fixes — all done</summary>

### Portals & travel
- [x] Portal auto-teleport
- [x] Interruptible recall

### Dungeon
- [x] Dungeon boss respawn tuning
- [x] Openable dungeon chests

### Feedback & UI
- [x] Item pickup message
- [x] Socket overwrite warning
- [x] Gem and rune icons
- [x] Bottom HUD layout
- [x] World event toasts

</details>
