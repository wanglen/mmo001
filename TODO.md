# MMO001 — Roadmap

Promoted from [PENDINGS.md](PENDINGS.md) at **v3.9.0**. One item per feature branch; check off and bump semver on merge.

---

## World & exploration

- [x] **Map-bound quest objectives** — kills/fetch only count in the target zone (`requiredMapId` on objectives); Forest Patrol skeletons in wilderness would not progress the quest
- [x] **Restore last position on login** — today saves `mapId/x/y` but always spawns town; option: resume where you logged out (with safe fallback if map invalid)
- [ ] **Zone outposts** — small safe-ish hubs or NPCs in Dark Forest / Scorched Desert (guide, turn-in, or mini-vendor) instead of town-only quest flow
- [x] **Biome spawn tables** — weight skeletons in forest, bats in desert, goblins in wilderness; optional new types later (wraith, scorpion)
- [ ] **Per-party dungeon instancing** — separate monster/boss/chest state per party instead of one shared server dungeon
- [ ] **Dungeon & boss quest line** — quest chain tied to `dungeonLord`, chest clears, or boss room entry
- [ ] **Quest waypoints** — minimap marker or HUD hint toward portal / objective zone
- [ ] **Persist fog of war** — save revealed tiles per character (watch payload size; chunk bitmap or hash)

---

## Combat & progression

- [ ] **More elite modifiers** — expand beyond Extra Fast / Fire Enchanted / Champion; fix Fire Enchanted applying poison if unintended
- [ ] **Resistance gear** — more affixes / uniques with fire/cold/lightning/poison resist; tie to desert/forest hazards
- [ ] **Player debuff bar** — show stun/slow/poison/bleed on HUD (server already tracks status effects)
- [ ] **Floating damage numbers** — optional combat text for hits, crits, heals
- [ ] **Passive HP regen** — out-of-combat only (mirror MP regen pattern in `shared/regen.js`) or consumable/regen shrines in zones
- [ ] **Explicit level cap** — document and enforce max level with endgame XP sink

---

## Items & economy

- [ ] **Crafting / salvaging** — break down magic+ gear for mats; craft potions or socket fillers
- [ ] **More gear templates & uniques** — class-flavored drops, zone-themed items (desert nomad set, forest ranger set)
- [ ] **Second vendor or traveling merchant** — forest/desert stock (anti-venom, heat potions) or rotating town inventory
- [ ] **Fetch quests & potion stacks** — consume partial stacks when turning in fetch objectives
- [ ] **Account-wide stash** — optional shared storage across alts on same account

---

## UI / HUD

- [x] **UI theme tokens** — CSS design tokens + four anime theme packs (`jrpg`, `shonen`, `darkfan`, `isekai`); wire core panels to `var(--…)`
- [x] **UI theme settings** — Settings → Appearance → UI style; persist in `localStorage` (`shared/uiThemeSettings.js`)
- [x] **UI theme auth + HUD chrome** — tokenize auth, character select, skill bar, chat, quest tracker, loading/death
- [x] **UI theme panels** — inventory, stash, vendor, trade, skill tree, dialogue, social, tooltips
- [x] **UI theme canvas HUD** — PlayerHud / Minimap / HpBar read shared theme palette
- [x] **UI theme polish** — motion accents, README/CHANGELOG, align style board
- [ ] **Graphics options** — UI scale, reduce particles, optional fullscreen
- [ ] **Full quest log panel** — browse active + completed quests (tracker is minimal today)
- [ ] **Damage / loot filter** — hide ground labels below rarity threshold
- [ ] **Party member map indicator** — show party dots on minimap when on same map

---

## Audio & presentation

- [ ] **Forest & desert music** — unique tracks in `shared/musicTracks.js` (currently reuse wilderness mood)
- [ ] **Zone ambient SFX** — wind/desert, forest birds, dungeon drip
- [ ] **Boss intro sting** — audio + brief UI banner on boss aggro

---

## Lower priority / larger scope

- [x] **New classes** — Blood Necromancer (HP-cost thralls + blood skills); further classes (e.g. Paladin) still open
- [ ] **Hand-authored maps** — Tiled import pipeline vs pure procedural only
- [ ] **Horizontal scaling** — multiple world shards, cross-server chat

---

## DevOps & quality

- [ ] **CI pipeline (GitHub Actions)** — `npm test` on PR/push
- [x] **Content validation hardening** — validate quest prerequisites, NPC ids, monster types, item keys in `validateContent.js`
- [x] **Per-player Ollama quest generation** — runtime procedural quests via local `mmo001-quests` model; defs on character state
- [ ] **Playwright smoke tests** — login → move → kill → loot → vendor (headless browser)
- [ ] **Load test** — many concurrent sockets on one map; profile interest management
- [ ] **Structured error reporting** — client breadcrumbs for path_failed / disconnect reasons

---

## Quick wins (small diffs)

- [ ] **Minimap portal labels** — show target zone name on hover
- [ ] **Chat command help** — `/help` listing `/w`, `/p`, channels
- [ ] **Sell junk button** — vendor sells all grey/common gear under a gold threshold
- [ ] **Stack potions on loot pickup** — auto-merge into partial stacks when bag has room (server already stacks on add?)
- [ ] **Boss kill world toast** — broadcast to players on same map when dungeon lord dies

---

## Next tasks (recommended order)

1. Dungeon & boss quest line
2. Zone outposts
3. CI pipeline (GitHub Actions)

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

## Completed (v3.3.x – v3.9.0)

<details>
<summary>Shipped through v3.9.0</summary>

### v3.9 — Quests
- [x] Zone quest line (Forest Patrol, Desert Scourge, Frontier Resupply)

### v3.8 — World
- [x] Dark Forest and Scorched Desert maps with portals, biome rendering, and scaled spawns

### v3.7 — Inventory & economy
- [x] Inventory sort
- [x] Gems and runes in stash
- [x] Vendor potion stacks

### v3.6 — Combat & polish
- [x] Level-scaled monsters
- [x] Solo management pause
- [x] Online list updates on disconnect
- [x] Combat balance pass

### v3.3.x – v3.5.0 — Playtesting
- [x] Portal auto-teleport, interruptible recall
- [x] Dungeon boss respawn tuning, openable chests
- [x] Item pickup message, socket overwrite warning, gem/rune icons
- [x] Bottom HUD layout, world event toasts

</details>
