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

- [x] Add `server/app/WorldStateBuilder.js`
- [x] Move `buildWorldState()` into builder (`server/app/worldState.js` delegates)
- [x] Core slice: map, player shell, remote players, version, npcs
- [x] Combat slice: monsters, combatFx, skillFx
- [x] World slice: loot (`serializeLootWorld` on loot plugin; portals remain in map payload)
- [x] Plugins expose `serializeWorld` on manifest

### B.2 Player serialization

- [x] Split `Player.toJSON()` into `composePlayer(player, now, plugins)`
- [x] Core: position, stats, class, dead, mapId
- [x] Loot plugin: inventory, equipment
- [x] Quest plugin: questState
- [x] Economy plugin: gold
- [x] Combat plugin: skill bar, cooldowns

### B.3 Tests

- [x] `tests/server/app/WorldStateBuilder.test.js` — snapshot keys stable vs. fixture player
- [x] Existing tests still pass; no client changes required yet

---

## Phase C — Server event bus

**Branch:** `refactor/server-event-bus`  
**Risk:** Medium — behavior must stay identical

### C.1 Bus

- [x] Add `server/app/EventBus.js` — sync, in-process `on` / `emit`
- [x] Document event names in `shared/plugins/domainEvents.js` (domain events, not socket events)

### C.2 Rewire cross-talk

- [x] `monster:killed` — combat emits; quests + loot + economy subscribe
- [x] `player:disconnect` — core emits; social + economy subscribe
- [x] `player:teleported` — zones emit; combat/AI reset if needed
- [x] Remove direct imports: `combat.js` → `quests.js` (and similar)

### C.3 Tests

- [x] Unit tests for quest progress on `monster:killed` via bus (no socket)

---

## Phase D — Client bootstrap & UI registry

**Branch:** `refactor/client-bootstrap`  
**Risk:** Low–medium

### D.1 App shell

- [x] Add `public/js/app/PluginHost.js` — register client plugins, `blocksGameInput()`
- [x] Add `public/js/app/UIManager.js` — panel show/hide, z-index, backdrop
- [x] Rename/split `main.js` → `app/bootstrap.js` (keep `main.js` re-export during transition)

### D.2 Client plugins (move panels + wiring together)

- [x] `public/js/plugins/social/` — ChatPanel, SocialPanel, socket bindings
- [x] `public/js/plugins/economy/` — VendorPanel, TradePanel
- [x] `public/js/plugins/quests/` — DialoguePanel, QuestTracker
- [x] `public/js/plugins/core/` — CharacterSelect, DisconnectModal, inventory wiring

### D.3 Reusable components

- [x] Add `public/js/components/Panel.js` — base: show, hide, backdrop, `isVisible`
- [x] Extract `public/js/components/ItemRow.js` from inventory/vendor/trade duplication
- [x] Optional: `public/js/ui/Panel.js` adapter wrapping existing panels

---

## Phase E — Split `Game.js`

**Branch:** `refactor/split-game`  
**Risk:** Medium — input regressions likely; test manually

### E.1 Core loop

- [x] Add `public/js/core/GameLoop.js` — rAF, `setWorldState`, pause/death flags
- [x] Add `public/js/core/InputRouter.js` — delegates to active plugin; chat focus escape hatch
- [x] Move `Camera`, `PathFollower`, `FogOfWar` under `core/` (re-export old paths temporarily)

### E.2 Input plugins

- [x] `public/js/plugins/combat/CombatInput.js` — attack chase, skill hotkeys, aim
- [x] `public/js/plugins/world/InteractionInput.js` — NPC, portal, loot click
- [x] `public/js/plugins/economy/` — `blocksGameInput()` when vendor/trade open (replace ad-hoc check in Game)

### E.3 Thin Game facade

- [x] Reduce `Game.js` to composition root or delete after `bootstrap.js` owns lifecycle
- [x] Target: no file &gt; ~300 lines in client gameplay path

---

## Phase F — Folder alignment & entities

**Branch:** `refactor/entities-layout`  
**Risk:** Low — mostly moves + import updates

### F.1 Server entities

- [x] `server/players/` → `server/entities/Player.js` + `PlayerManager.js`
- [x] `server/monsters/` → `server/entities/Monster.js` + `MonsterManager.js`
- [x] `server/items/LootManager.js` → `server/entities/LootManager.js`
- [x] Add `server/entities/Npc.js` (optional) — wrap town NPC data currently on map JSON

### F.2 Systems → plugin folders

- [x] `server/systems/combat.js` → `server/plugins/combat/combat.js` (etc.)
- [x] Keep `server/systems/gameLoop.js` in `app/` or `core/`
- [x] Update `tests/server/` paths to mirror

### F.3 Shared kernel split

- [x] `shared/events.js` → `shared/kernel/events.js` (re-export from old path)
- [x] Group combat-related shared modules under `shared/plugins/combat/`
- [x] Avoid big-bang: re-export barrels at old paths until imports migrated

---

## Phase G — Render layer registry (optional)

**Branch:** `refactor/render-layers`  
**Risk:** Low

- [x] `Renderer.js` accepts ordered `{ id, draw(ctx, state) }` layers
- [x] Plugins register: monsters, loot, players, FX, fog, HUD
- [x] Decouple `Renderer` from direct `PlayerHud` / `Minimap` imports

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
| `Game.js` ~729 lines | E | [x] |
| `socketHandlers.js` ~559 lines | A, B | [x] |
| `main.js` manual wiring | D | [x] |
| Three `io.on('connection')` | A | [x] |
| `broadcastAllFn` closure hack | A | [x] |
| `Player.toJSON()` kitchen sink | B | [x] |
| Full world blob every 50 ms | B, I | [ ] |
| `combat` imports `quests` directly | C | [x] |
| No tests for socket wiring | A | [x] |
| `TODO.md` target structure mismatch | F | [x] |

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
