# MMO001 — Diablo-like MMORPG Roadmap

Current MVP: procedural map, character select, WASD movement, Canvas rendering, Socket.IO (single-player, multiplayer-ready).

---

## Phase 1 — Core Game Feel (Diablo foundation)

### Movement & camera
- [x] Switch from WASD-only to **click-to-move** (pathfind toward cursor)
- [x] Add **mouse aim** for attacks/skills (direction from player to cursor)
- [x] Improve camera: smooth follow, zoom, optional slight isometric tilt
- [x] Replace colored squares with **sprite sheets** (walk, idle, attack animations)

### Combat basics
- [ ] Add player stats: `HP`, `MP`, `STR`, `DEX`, `INT`, `VIT`, `level`, `xp`
- [ ] Implement **basic attack** (click enemy or auto-attack nearest target)
- [ ] Server-authoritative **damage calculation** and hit validation
- [ ] Add **attack cooldowns** and swing animations
- [ ] Show **HP bars** above player and enemies

### Enemies
- [ ] Create `Monster` entity (server-side, like `Player`)
- [ ] Spawn mobs on the map (static spawn points or zones)
- [ ] Simple AI: idle → aggro when player near → chase → attack
- [ ] Mob death: despawn, drop XP, optionally drop loot
- [ ] Add 2–3 enemy types (melee, ranged, fast)

---

## Phase 2 — Loot & Character Progression

### Items & inventory
- [ ] Define item schema: `{ id, name, type, rarity, stats, slot }`
- [ ] Rarity tiers: Common, Magic, Rare, Unique (Diablo-style colors)
- [ ] Ground loot drops (visible on map, click to pick up)
- [ ] Inventory grid UI (e.g. 10×4)
- [ ] Equip slots: weapon, helm, chest, gloves, boots, ring, amulet
- [ ] Stat bonuses from equipped gear applied server-side

### Leveling
- [ ] XP curve per level
- [ ] Level-up grants stat/skill points
- [ ] Level-up UI feedback (flash, sound, stat allocation screen)
- [ ] Persist character progress (JSON file or SQLite to start)

### Skills
- [ ] Skill bar (6–8 slots, hotkeys 1–8)
- [ ] 2–3 skills per class (Warrior: cleave, charge; Mage: fireball, frost nova)
- [ ] MP cost, cooldowns, AoE vs single-target
- [ ] Skill visuals (projectiles, ground effects, melee arcs)

---

## Phase 3 — World & Content

### Maps & zones
- [ ] Multiple zones (town, wilderness, dungeon)
- [ ] Zone transitions (portals, doors, loading new map)
- [ ] Town hub: safe zone, no combat, NPCs
- [ ] Dungeon maps: tighter layouts, higher mob density, boss room

### Map generation improvements
- [ ] Room + corridor dungeon generator (Diablo-style)
- [ ] Hand-crafted landmark tiles (walls, doors, chests)
- [ ] Minimap UI

### NPCs & quests
- [ ] NPC entity type (static, interactable)
- [ ] Dialogue UI (simple text boxes)
- [ ] Quest system: kill X, fetch item, talk to NPC
- [ ] Quest rewards: XP, gold, items

---

## Phase 4 — Multiplayer (MMO layer)

### Real-time sync
- [ ] Enable `io.emit` broadcasts (other players visible on map)
- [ ] Sync other players' position, animation state, HP
- [ ] Nameplates and class icons above other players

### Social
- [ ] Global and zone chat
- [ ] Whisper / private messages
- [ ] Party system (invite, accept, shared XP range)
- [ ] Player list / online count

### Economy & trade
- [ ] Gold currency
- [ ] Vendor NPCs (buy/sell items)
- [ ] Player-to-player trade window
- [ ] Item drop rules in multiplayer (who gets loot)

---

## Phase 5 — Diablo-like Depth

### Combat systems
- [ ] Critical hits, dodge, resistances (fire/cold/lightning/poison)
- [ ] Status effects: stun, slow, poison DoT, bleed
- [ ] Elite/champion mobs with modifiers (extra fast, fire enchanted, etc.)
- [ ] Boss fights: phases, special attacks, unique loot tables

### Items (advanced)
- [ ] Random affixes on Magic/Rare items (`+STR`, `+life`, `% damage`)
- [ ] Socketed items + gems/runes
- [ ] Set items (bonuses for wearing multiple pieces)
- [ ] Stash / shared storage in town

### Character build
- [ ] Skill tree per class
- [ ] Respec option (gold cost or rare item)
- [ ] Multiple viable builds per class

---

## Phase 6 — Production & Scale

### Accounts & persistence
- [ ] User registration / login (JWT or sessions)
- [ ] Save characters to database (PostgreSQL or MongoDB)
- [ ] Multiple characters per account
- [ ] Server-side anti-cheat (validate move speed, damage, loot claims)

### Performance
- [ ] Interest management (only send nearby entities to each client)
- [ ] Game tick loop on server (fixed 20–30 Hz simulation)
- [ ] Delta updates instead of full `worldState` every frame
- [ ] Chunk-based maps for large worlds

### Polish
- [ ] Sound effects and background music
- [ ] Particle effects (blood, spells, level-up)
- [ ] Death screen + respawn in town
- [ ] Settings menu (volume, keybinds, graphics)
- [ ] Loading screens between zones

### DevOps
- [ ] `.gitignore`, README, environment config
- [ ] Basic tests for combat, loot, movement validation
- [ ] CI pipeline
- [ ] Deployment (Docker, cloud hosting)

---

## Target module structure

```
server/
├── systems/
│   ├── combat/
│   ├── loot/
│   ├── quests/
│   ├── skills/
│   └── zones/
├── entities/
│   ├── Player.js
│   ├── Monster.js
│   ├── Item.js
│   └── NPC.js
└── world/
    ├── ZoneManager.js
    └── DungeonGenerator.js

public/js/
├── ui/          (inventory, skills, chat, minimap)
├── combat/
├── entities/    (render monsters, loot, effects)
└── network/     (delta sync, event handlers)
```

---

## Next 5 tasks (recommended order)

1. [ ] **Enable multiplayer broadcast** — see other players (`socketHandlers.js`)
2. [ ] **Add monsters + basic combat** — core Diablo loop
3. [ ] **Click-to-move + mouse aim** — Diablo control scheme
4. [ ] **HP / XP / level system** — progression loop
5. [ ] **Ground loot + inventory** — ARPG reward loop
