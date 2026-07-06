# MMO001 — Architecture Refactoring Plan

Track plugin-oriented restructuring **before** applying changes to gameplay code. This file is a planning checklist only — do not merge refactor PRs until the phase’s items are checked and `npm test` passes.

**Related docs:** [TODO.md](TODO.md) (game features), [AGENTS.md](AGENTS.md) (workflow)

**Baseline (v2.1.0):** ~170 JS files, modular `shared/` + `server/systems/`, monolithic wiring in `Game.js`, `socketHandlers.js`, `main.js`.

---

## Goals

- [ ] **Feature plugins** — vertical slices (server handlers + shared rules + client UI) register via a manifest
- [ ] **Single socket registry** — one `io.on('connection')`, no `broadcastAllFn` init hack
- [ ] **Composable world state** — plugins contribute serialization slices (path to delta sync)
- [ ] **Slim client shell** — split `Game.js` into loop + input plugins
- [ ] **Server event bus** — decouple cross-feature calls (e.g. combat → quests)

## Non-goals (defer)

- Full ECS framework (bitECS, esengine, etc.)
- Bundler / TypeScript migration (optional later)
- Monorepo / npm packages per plugin
- Breaking changes to gameplay behavior during refactor PRs

---

## Principles

| Keep | Change |
|------|--------|
| `shared/` pure functions + unit tests | Fat integration files |
| Server-authoritative rules in `shared/` | Direct cross-imports between feature systems |
| Native ESM, `/shared/` static serve | Three separate `io.on('connection')` registrars |
| Render sub-modules (`*Renderer.js`) | `main.js` manual callback wiring |
| UI panel classes | God-object `Game.js` |

---

## Target layout

```
shared/
├── kernel/              # events, constants, movement, pathfinding
├── plugins/             # plugin types + per-feature shared exports
│   ├── combat/
│   ├── economy/
│   ├── quests/
│   └── social/
└── content/             # (future) JSON quest/skill/vendor data

server/
├── app/
│   ├── createServer.js
│   ├── HandlerRegistry.js
│   ├── WorldStateBuilder.js
│   └── EventBus.js
├── plugins/
│   ├── core/
│   ├── combat/
│   ├── loot/
│   ├── quests/
│   ├── social/
│   └── economy/
├── entities/            # Player, Monster, LootDrop (slim cores)
├── world/
├── persistence/
└── network/             # thin — registry lives in app/

public/js/
├── app/
│   ├── bootstrap.js     # slim entry (replaces fat main.js)
│   ├── PluginHost.js
│   └── UIManager.js
├── plugins/
│   ├── combat/
│   ├── economy/
│   ├── quests/
│   └── social/
├── core/                # GameLoop, Camera, Input, PathFollower
├── render/              # + optional layer registry
├── components/          # HpBar, ItemRow, reusable DOM bits
└── network/
```

---

## Plugin manifest (reference)

Each feature plugin should export:

```javascript
{
  id: 'economy',
  dependsOn: ['core', 'loot'],
  registerServer(socket, ctx),   // server only
  registerClient(ctx),           // client only
  onDisconnect(playerId, ctx),   // server only
  serializePlayer(player),       // partial player JSON
  serializeWorld(ctx, viewerId), // partial world-state slice
  tick(dt, ctx),                 // optional server tick hook
  blocksGameInput(ctx),          // optional client
}
```

---

## Phase A — Handler registry (server)

**Branch:** `refactor/handler-registry`  
**Risk:** Low — move code, no behavior change

### A.1 Scaffold

- [x] Add `server/app/HandlerRegistry.js` — single `io.on('connection')`, topological plugin order
- [x] Server context bag on `HandlerRegistry` (`world`, `playerManager`, `characterStore`, `partyManager`, `tradeManager`, `broadcast`) — inlined in registry
- [x] Add `server/app/loadPlugins.js` + `server/app/sortPlugins.js` — ordered plugin list + `dependsOn` sort
- [x] Add `shared/plugins/types.js` — JSDoc typedef for `ServerPlugin` (no runtime deps)
- [x] Add `server/app/handlerUtils.js`, `server/app/worldState.js` — shared handler helpers + broadcast

### A.2 Extract plugins (move only)

- [x] `server/plugins/core/` — join, create/delete character, move, aim, respawn, use portal, town recall
- [x] `server/plugins/combat/` — attack, use skill
- [x] `server/plugins/loot/` — pickup, equip, unequip, destroy item, use consumable, allocate stat
- [x] `server/plugins/quests/` — npc interact, quest accept/turn-in
- [x] `server/plugins/social/` — from `socialHandlers.js` (chat, party)
- [x] `server/plugins/economy/` — from `economyHandlers.js` (vendor, trade)

### A.3 Wire bootstrap

- [x] Refactor `server/index.js` → `server/app/createServer.js`; remove `broadcastAllFn` closure hack
- [x] Unified `onDisconnect` — each plugin cleans up its own state
- [x] Thin `server/network/socketHandlers.js`, `socialHandlers.js`, `economyHandlers.js` to re-exports

### A.4 Tests & docs

- [x] Add `tests/server/app/HandlerRegistry.test.js` — plugins load, dependency order, no duplicate event names
- [ ] Smoke: join → move → attack → vendor open still works manually
- [x] Note completion in CHANGELOG under `[Unreleased]` (no version bump until phase group done)

---

## Phase B — Composable world state (server)

**Branch:** `refactor/world-state-builder`  
**Risk:** Medium — snapshot shape must stay compatible

### B.1 Extract builder

- [ ] Add `server/app/WorldStateBuilder.js`
- [ ] Move `buildWorldState()` out of `socketHandlers.js` into builder
- [ ] Core slice: map, player shell, remote players, version
- [ ] Combat slice: monsters, combatFx, skillFx
- [ ] World slice: npcs, loot, portals in map payload
- [ ] Plugins call `registerSerializeWorld(fn)` on load

### B.2 Player serialization

- [ ] Split `Player.toJSON()` into `composePlayer(player, now, plugins)`
- [ ] Core: position, stats, class, dead, mapId
- [ ] Loot plugin: inventory, equipment
- [ ] Quest plugin: questState, gold (or economy plugin for gold)
- [ ] Combat plugin: skill bar, cooldowns if any in JSON

### B.3 Tests

- [ ] `tests/server/app/WorldStateBuilder.test.js` — snapshot keys stable vs. fixture player
- [ ] Existing tests still pass; no client changes required yet

---

## Phase C — Server event bus

**Branch:** `refactor/server-event-bus`  
**Risk:** Medium — behavior must stay identical

### C.1 Bus

- [ ] Add `server/app/EventBus.js` — sync, in-process `on` / `emit`
- [ ] Document event names in `shared/plugins/events.js` (domain events, not socket events)

### C.2 Rewire cross-talk

- [ ] `monster:killed` — combat emits; quests + loot + economy subscribe
- [ ] `player:disconnect` — core emits; social + economy subscribe
- [ ] `player:teleported` — zones emit; combat/AI reset if needed
- [ ] Remove direct imports: `combat.js` → `quests.js` (and similar)

### C.3 Tests

- [ ] Unit tests for quest progress on `monster:killed` via bus (no socket)

---

## Phase D — Client bootstrap & UI registry

**Branch:** `refactor/client-bootstrap`  
**Risk:** Low–medium

### D.1 App shell

- [ ] Add `public/js/app/PluginHost.js` — register client plugins, `blocksGameInput()`
- [ ] Add `public/js/app/UIManager.js` — panel show/hide, z-index, backdrop
- [ ] Rename/split `main.js` → `app/bootstrap.js` (keep `main.js` re-export during transition)

### D.2 Client plugins (move panels + wiring together)

- [ ] `public/js/plugins/social/` — ChatPanel, SocialPanel, socket bindings
- [ ] `public/js/plugins/economy/` — VendorPanel, TradePanel
- [ ] `public/js/plugins/quests/` — DialoguePanel, QuestTracker
- [ ] `public/js/plugins/core/` — CharacterSelect, DisconnectModal, inventory wiring

### D.3 Reusable components

- [ ] Add `public/js/components/Panel.js` — base: show, hide, backdrop, `isVisible`
- [ ] Extract `public/js/components/ItemRow.js` from inventory/vendor/trade duplication
- [ ] Optional: `public/js/ui/Panel.js` adapter wrapping existing panels

---

## Phase E — Split `Game.js`

**Branch:** `refactor/split-game`  
**Risk:** Medium — input regressions likely; test manually

### E.1 Core loop

- [ ] Add `public/js/core/GameLoop.js` — rAF, `setWorldState`, pause/death flags
- [ ] Add `public/js/core/InputRouter.js` — delegates to active plugin; chat focus escape hatch
- [ ] Move `Camera`, `PathFollower`, `FogOfWar` under `core/` (re-export old paths temporarily)

### E.2 Input plugins

- [ ] `public/js/plugins/combat/CombatInput.js` — attack chase, skill hotkeys, aim
- [ ] `public/js/plugins/world/InteractionInput.js` — NPC, portal, loot click
- [ ] `public/js/plugins/economy/` — `blocksGameInput()` when vendor/trade open (replace ad-hoc check in Game)

### E.3 Thin Game facade

- [ ] Reduce `Game.js` to composition root or delete after `bootstrap.js` owns lifecycle
- [ ] Target: no file &gt; ~300 lines in client gameplay path

---

## Phase F — Folder alignment & entities

**Branch:** `refactor/entities-layout`  
**Risk:** Low — mostly moves + import updates

### F.1 Server entities

- [ ] `server/players/` → `server/entities/Player.js` + `PlayerManager.js`
- [ ] `server/monsters/` → `server/entities/Monster.js` + `MonsterManager.js`
- [ ] `server/items/LootManager.js` → `server/entities/LootManager.js`
- [ ] Add `server/entities/Npc.js` (optional) — wrap town NPC data currently on map JSON

### F.2 Systems → plugin folders

- [ ] `server/systems/combat.js` → `server/plugins/combat/combat.js` (etc.)
- [ ] Keep `server/systems/gameLoop.js` in `app/` or `core/`
- [ ] Update `tests/server/` paths to mirror

### F.3 Shared kernel split

- [ ] `shared/events.js` → `shared/kernel/events.js` (re-export from old path)
- [ ] Group combat-related shared modules under `shared/plugins/combat/`
- [ ] Avoid big-bang: re-export barrels at old paths until imports migrated

---

## Phase G — Render layer registry (optional)

**Branch:** `refactor/render-layers`  
**Risk:** Low

- [ ] `Renderer.js` accepts ordered `{ id, draw(ctx, state) }` layers
- [ ] Plugins register: monsters, loot, players, FX, fog, HUD
- [ ] Decouple `Renderer` from direct `PlayerHud` / `Minimap` imports

---

## Phase H — Content packs (optional)

**Branch:** `refactor/content-json`  
**Risk:** Medium — data migration

- [ ] `shared/content/quests.json` from `shared/quests.js` defs
- [ ] `shared/content/skills.json` from `shared/skills.js` defs
- [ ] `shared/content/vendors.json` from vendor stock
- [ ] Load at server startup; validate with schema tests
- [ ] Keep computed helpers in JS; JSON is data only

---

## Phase I — Network optimization (feature roadmap overlap)

**See also:** TODO.md Phase 5+ (interest management, delta sync)

- [ ] Per-plugin delta serialization (`serializeWorldDelta`)
- [ ] Separate channels or event names for high-frequency vs. rare state
- [ ] AOI / zone-based broadcast (only same-map + nearby)
- [ ] Client prediction for movement (optional)

---

## Pain points checklist (verify fixed)

| Issue | Target phase | Done |
|-------|--------------|------|
| `Game.js` ~729 lines | E | [ ] |
| `socketHandlers.js` ~559 lines | A, B | [ ] |
| `main.js` manual wiring | D | [ ] |
| Three `io.on('connection')` | A | [x] |
| `broadcastAllFn` closure hack | A | [x] |
| `Player.toJSON()` kitchen sink | B | [ ] |
| Full world blob every 50 ms | B, I | [ ] |
| `combat` imports `quests` directly | C | [ ] |
| No tests for socket wiring | A | [x] |
| `TODO.md` target structure mismatch | F | [ ] |

---

## Suggested PR order

1. **A** — Handler registry (highest leverage, lowest risk)
2. **B** — World state builder
3. **D** — Client bootstrap (can parallel with C)
4. **C** — Event bus
5. **E** — Split Game.js
6. **F** — Folder moves
7. **G, H, I** — as needed for scale

One phase per branch; merge only when tests pass + manual smoke (vendor, combat, party, trade).

---

## Manual smoke test (run after each phase)

- [ ] Create character → spawn in town
- [ ] Move, aim, attack monster
- [ ] Pick up loot, equip, use potion
- [ ] Talk to NPC, accept/turn in quest
- [ ] Open vendor Brok — buy and sell
- [ ] Party invite + trade with second client
- [ ] Portal to dungeon and back
- [ ] Disconnect/reconnect — save restored

---

## Notes

- Refactor PRs should **not** mix with feature work from [TODO.md](TODO.md); use `refactor/*` branches.
- Prefer re-export shims at old import paths during migration to keep diffs small.
- Bump semver **minor** when a phase group completes and player-facing structure changes (e.g. after E+F); **patch** for internal-only moves.
