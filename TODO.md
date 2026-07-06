# MMO001 — Diablo-like MMORPG Roadmap

Current MVP: procedural map, character select, WASD movement, Canvas rendering, Socket.IO (single-player, multiplayer-ready).

---

## Phase 1 — Core Game Feel (Diablo foundation)

### Movement & camera
- [x] Switch from WASD-only to **click-to-move** (pathfind toward cursor)
- [x] Add **mouse aim** for attacks/skills (direction from player to cursor)
- [x] Improve camera: smooth follow, zoom, optional slight isometric tilt
- [x] Replace colored squares with **sprite sheets** (walk, idle, attack animations)
- [x] **Context-sensitive cursor** — change mouse icon by action (move, attack, interact, etc.)

### Combat basics
- [x] Add player stats: `HP`, `MP`, `STR`, `DEX`, `INT`, `VIT`, `level`, `xp`
- [x] Implement **basic attack** (click enemy or auto-attack nearest target)
- [x] Server-authoritative **damage calculation** and hit validation
- [x] Add **attack cooldowns** and swing animations
- [x] Show **HP bars** above player and enemies

### Enemies
- [x] Create `Monster` entity (server-side, like `Player`)
- [x] Spawn mobs on the map (static spawn points or zones)
- [x] Simple AI: idle → aggro when player near → chase → attack
- [x] Mob death: despawn, drop XP (loot deferred to Phase 2)
- [x] Add 2–3 enemy types (melee, ranged, fast)

---

## Phase 2 — Loot & Character Progression

### Items & inventory
- [x] Define item schema: `{ id, name, type, rarity, stats, slot }`
- [x] Rarity tiers: Common, Magic, Rare, Unique (Diablo-style colors)
- [x] Ground loot drops (visible on map, click to pick up)
- [x] Inventory grid UI (e.g. 10×4)
- [x] Equip slots: weapon, helm, chest, gloves, boots, ring, amulet
- [x] Stat bonuses from equipped gear applied server-side

### Leveling
- [x] XP curve per level
- [x] Level-up grants stat points (+5 per level)
- [x] Level-up UI feedback (flash, sound, stat allocation screen)
- [x] Persist character progress (JSON file or SQLite to start)

### Skills
- [x] Skill bar (6–8 slots, hotkeys 1–8)
- [x] 2–3 skills per class (Warrior: cleave, charge; Mage: fireball, frost nova)
- [x] MP cost, cooldowns, AoE vs single-target
- [x] Skill visuals (projectiles, ground effects, melee arcs)

---

## Phase 2.1 — In-Game Visual Polish

### UI / representation
- [x] Improve **character** representation in game
- [x] Improve **items** representation in game (ground loot, inventory icons)
- [x] Improve **monsters** representation in game
- [x] Add **map fog** — hide unexplored / off-screen areas; grey or muted overlay for obscured tiles (align with void `#0c0e14` palette)

---

## Phase 3 — World & Content

### Maps & zones
- [x] Multiple zones (town, wilderness, dungeon)
- [x] Zone transitions (portals, doors, loading new map)
- [x] Town hub: safe zone, full hp/mp recovery, no combat, NPCs, teleportation using "T" key after 6 seconds continuous press.
- [x] Dungeon maps: tighter layouts, higher mob density, boss room

### Map generation improvements
- [x] Room + corridor dungeon generator (Diablo-style)
- [x] Hand-crafted landmark tiles (walls, doors, chests)
- [x] Minimap UI

### NPCs & quests
- [x] NPC entity type (static, interactable)
- [x] Dialogue UI (simple text boxes)
- [x] Quest system: kill X, fetch item, talk to NPC
- [x] Quest rewards: XP, gold, items

---

## Phase 4 — Multiplayer (MMO layer)

### Real-time sync
- [x] Enable `io.emit` broadcasts (other players visible on map)
- [x] Sync other players' position, animation state, HP
- [x] Nameplates and class icons above other players

### Social
- [x] Global and zone chat
- [x] Whisper / private messages
- [x] Party system (invite, accept, shared XP range)
- [x] Player list / online count

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
- [x] Death screen + respawn at spawn (town zone deferred)
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
2. [x] **Add monsters + basic combat** — core Diablo loop
3. [x] **Click-to-move + mouse aim** — Diablo control scheme
4. [x] **HP / XP / level system** — progression loop
5. [x] **Ground loot + inventory** — ARPG reward loop
