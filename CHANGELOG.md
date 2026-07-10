# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Documentation

- README, TODO, AGENTS, and tests docs updated for v3.9.0 (zones, quests, inventory/economy features)

## [3.12.0] - 2026-07-09

### Added

- **New monster types** — wolf (wilderness), wraith (forest, slows on hit), scorpion (desert, poisons on hit), ghoul (dungeon); biome spawn tables updated with zone-specific weights
- **Biome spawn tables** — wilderness favors goblins/wolves, Dark Forest skeletons/wraiths, Scorched Desert bats/scorpions, dungeon skeletons/ghouls

## [3.11.0] - 2026-07-09

### Added

- **Biome spawn tables** — wilderness favors goblins, Dark Forest favors skeletons, Scorched Desert favors bats; dungeon skews skeleton/goblin mix

## [3.10.0] - 2026-07-09

### Added

- **Map-bound quest objectives** — optional `requiredMapId` on kill objectives; goblin, forest, and desert quests only count kills in the matching zone; progress text shows zone name
- **Restore last position on login** — characters reconnect on their saved map and coordinates; invalid map ids or unwalkable tiles fall back safely

### Fixed

- **Wilderness zone portal visibility** — Dark Forest and Scorched Desert gates show labeled arch markers (NW/NE); fog and minimap pre-reveal gate tiles so the desert portal is discoverable

## [3.9.0] - 2026-07-09

### Added

- **Zone quest line** — after the starter chain, Eldon sends you to clear skeletons in the Dark Forest and bats in the Scorched Desert; Mira requests a mana potion for frontier patrols

## [3.8.0] - 2026-07-09

### Added

- **Dark Forest and Scorched Desert** — two new instanced zones reachable from wilderness portals; dense forest and dune biomes with tougher scaled monster spawns; distinct HUD labels, minimap colors, and biome rendering

### Fixed

- **Dark Forest biome** — forest map no longer shows the wilderness zone badge or default green palette

## [3.7.0] - 2026-07-09

### Added

- **Inventory sort** — Sort button in the inventory panel reorganizes backpack by equipment slot, rarity, and name (server-authoritative)
- **Gems and runes in stash** — socketables can be stored in and retrieved from the town shared stash (right-click → Store in stash)
- **Vendor potion stacks** — sell view groups potions by type with a quantity picker (partial sells across stacked bag slots)

## [3.6.3] - 2026-07-08

### Fixed

- **Online list on disconnect** — disconnected players are removed from the online list immediately

## [3.6.2] - 2026-07-08

### Added

- **Solo management pause** — inventory, stash, stat points, and skill tree pause gameplay only when you are the only player online; multiplayer sessions keep moving as before

### Fixed

- **Inventory close while solo** — I and Esc work again when solo pause freezes gameplay with the inventory open

## [3.6.1] - 2026-07-08

### Fixed

- **Player damage tuning** — lowered melee and skill damage so common monsters survive several hits; crits can still finish weak targets in one blow
- **Skill balance pass** — tier 1/2/3 damage now scales with skill-point investment (T3 hits hardest per cast); skills crit from DEX; Poison Arrow applies poison DoT

## [3.6.0] - 2026-07-08

### Added

- **Level-scaled monsters** — new spawns scale HP, damage, and XP from average player level on the map (+3 levels in dungeon)

## [3.5.0] - 2026-07-08

### Changed

- **Dungeon boss respawn** — dungeon lord waits 3 minutes after defeat before respawning (was ~15 seconds)
- **Dungeon chests** — openable landmark chests in side rooms (loot or gold; per-character, persisted)

## [3.4.0] - 2026-07-07

### Added

- **World event list** — transient toast notifications for kills, level-ups, quest progress, loot pickups, party invites, and trade notices (auto-dismiss; does not block minimap or zone badge)

## [3.3.4] - 2026-07-07

### Fixed

- **Skill cooldown spam** — client input respects synced cooldown remaining (was treating remaining ms as a timestamp); optimistic local cooldown on cast

## [3.3.3] - 2026-07-07

### Fixed

- **Bottom HUD layout** — XP bar and recall hint sit above the skill bar (not behind it); bottom canvas scrim hides world sprites under the HUD; skill bar uses a solid background

## [3.3.2] - 2026-07-07

### Added

- **Item pickup message** — system chat notice when loot is successfully collected
- **Socket gem overwrite** — right-click a gem to replace a socketed gem (in-game confirm dialog); replaced gem returns to inventory
- **Gem and rune icons** — distinct inventory/tooltip icons and colors for ruby, sapphire, emerald, diamond, and rune socketables

## [3.3.1] - 2026-07-07

### Changed

- **Portal auto-teleport** — clicking a portal pathfinds to it; zone travel triggers automatically on arrival (no second click on the tile)

### Fixed

- **Interruptible town recall** — recall cast (**T**) cancels when moving, attacking, using skills, or taking monster damage (client no longer blocks input during the cast)

## [3.3.0] - 2026-07-07

### Added

- **DevOps** — `.env.example`, centralized `server/config.js`, cloud VPS deployment guide, and `tests/README.md` documenting combat/loot/movement validation tests

### Changed

- Docker Compose loads optional `.env`, passes `SESSION_SECRET` and legacy account vars, and warns when production runs without a stable session secret

## [3.2.3] - 2026-07-07

### Added

- **Settings menu** — **O** / **Esc** opens volume sliders (SFX, music, mute), graphics note, and default keybind reference; preferences persist in localStorage
- **Zone loading screen** — portal travel shows zone name, spinner, and “Entering …” hint until map tiles arrive

## [3.2.2] - 2026-07-07

### Added

- Canvas particle bursts for blood on hits, skill impacts, and level-up celebrations

## [3.2.1] - 2026-07-07

### Changed

- Zone background music uses CC0 looped OGG tracks (town piano ambience, dark woods, dungeon cave) instead of procedural oscillators

## [3.2.0] - 2026-07-07

### Added

- **Procedural audio** — Web Audio SFX (combat, skills, pickup, level-up, death, zone travel) and zone-aware ambient music (town / wilderness / dungeon)

## [3.1.6] - 2026-07-07

### Fixed

- Docker build on ARM64 when `better-sqlite3` prebuilds are missing — multi-stage image compiles native deps with build tools, runtime stage stays slim

## [3.1.5] - 2026-07-07

### Fixed

- Docker build on ARM64 (e.g. Oracle Cloud) — use `node:20-bookworm-slim` so `better-sqlite3` loads prebuilt binaries instead of compiling on Alpine/musl

## [3.1.4] - 2026-07-07

### Added

- **Interest management** — monsters, loot, and remote players sync only within ~720px of the viewer (plus visible map chunks)
- **Delta world sync** — entity upsert/remove patches between full snapshots (~3s); client merges deltas locally
- **Chunk map streaming** — on zone travel, server sends visible 16×16 tile chunks instead of the full map grid

### Changed

- Server simulation uses a shared **20 Hz** tick constant (`GAME_TICK_MS`); broadcasts include tick/seq metadata

## [3.0.0] - 2026-07-07

### Added

- **Accounts:** register and sign in before character select; signed session tokens (set `SESSION_SECRET` in production)
- **SQLite persistence:** characters stored in `data/game.db` (up to 8 per account)
- **Legacy migration:** existing `data/characters/*.json` saves import into a `legacy` account on first DB init (`legacy` / `legacy` by default)
- **Anti-cheat:** server rejects move packets that arrive too fast; loot pickup range validated with tolerance

### Changed

- Character list API (`GET /api/characters`) requires authentication; socket connections require a valid session token
- Character create/delete/join are scoped to the signed-in account

### Breaking

- Must create an account and sign in before creating or playing a character
- Character saves moved from flat JSON files to SQLite (`data/game.db`); use the `legacy` account to access migrated saves

## [2.5.1] - 2026-07-07

### Changed

- **Warrior skills** — each skill now has a distinct role and VFX:
  - **Cleave** — narrow frontal cone slash
  - **Charge** — dash with short stun on hit
  - **Whirlwind** — 360° spin hitting all nearby enemies
  - **Shield Bash** — single-target strike with stun
  - **Iron Will** — defensive pulse that slows nearby foes and heals the warrior

## [2.5.0] - 2026-07-07

### Added

- **Character build:** per-class skill trees with tiered prerequisites; earn 1 skill point per level-up
- Skill tree UI (**K** key) — learn skills, assign hotbar slots (1–7), view build presets (Berserker, Pyromancer, etc.)
- Town respec — reset skills to starters for gold (`100 + level × 50`); refunds earned skill points
- 8 new skills across warrior, mage, and ranger (Whirlwind, Shield Bash, Meteor, Frost Nova, Poison Arrow, and more)

### Changed

- Skill hotbar is player-owned (persisted) instead of fixed per class; only unlocked skills can be cast

### Fixed

- Skill tree Learn button ignored clicks due to 50ms world-state re-renders wiping the DOM
- Chain Spark and other ranged ground-AoE skills missing VFX (`targetX`/`targetY` not sent to renderer)

## [2.4.1] - 2026-07-07

### Added

- Diablo-style floating item tooltips in inventory and stash (no layout shift on hover)
- Potion stacking in bag and stash (up to 20 per slot) with stack count badges

### Changed

- Inventory panel uses full height for equipment + backpack grid; bottom inspect bar removed

## [2.4.0] - 2026-07-07

### Added

- **Advanced items:** random affixes on Magic/Rare gear (`+STR`, `+life`, `% damage`); socketed items with gems/runes; set bonuses (Nomad's Trail, Bulwark); shared stash in town (`B` key)

### Fixed

- Client bootstrap crash when `stashPanel` was not passed from plugin context to `Game`

## [2.3.1] - 2026-07-07

### Added

- Diablo-style action cursors — sword (attack), arrow (move), hand (loot), portal swirl, speech bubble (NPCs), coin bag (vendor)

### Fixed

- Combat test flake when crit one-shot killed the test monster

## [2.3.0] - 2026-07-07

### Added

- **Combat depth:** critical hits (DEX-based), dodge (DEX-based), elemental resistances on monsters and players
- Status effects — stun (blocks move/attack/skills), slow, poison DoT, bleed DoT; elites apply on-hit debuffs
- Elite/champion mobs (~12% spawn) with modifiers: Extra Fast, Fire Enchanted, Champion
- Boss phase scaling — damage and attack speed increase at 66% and 33% HP; bosses guarantee loot with higher rare/unique odds

### Changed

- **Architecture (Phase D):** client bootstrap shell (`public/js/app/bootstrap.js`, `PluginHost.js`, `UIManager.js`); feature panels moved under `public/js/plugins/` with `registerClient` wiring; reusable `Panel` and `ItemRow` components; `main.js` re-exports bootstrap
- **Architecture (Phase E):** split `Game.js` into `GameLoop`, `InputRouter`, and input plugins (`CombatInput`, `InteractionInput`, `CoreInput`); moved `Camera`, `PathFollower`, `FogOfWar` to `public/js/core/`
- **Architecture (Phase F):** aligned server folders — entities under `server/entities/`, game logic under `server/plugins/*`, `gameLoop` in `app/`; shared kernel split (`shared/kernel/events.js`, `shared/plugins/combat/`); re-export stubs at old paths
- **Architecture (Phase G):** render layer registry in `Renderer.js` with ordered `{ id, order, draw }` layers; HUD and minimap decoupled into `render/layers/`
- **Architecture (Phase H):** quest, skill, and vendor data moved to `shared/content/*.json`; validated at server startup via `loadGameContent()`; helpers remain in JS modules
- Cursor rules and agent docs updated for plugin-based layout (`.cursor/rules/architecture.mdc`); removed `REFACTOR.md`

## [2.2.0] - 2026-07-06

### Changed

- **Architecture (Phase A):** server socket handlers refactored into a plugin registry (`server/app/HandlerRegistry.js`) with feature modules under `server/plugins/` (core, combat, loot, quests, social, economy); bootstrap moved to `server/app/createServer.js`; removed `broadcastAllFn` init workaround
- **Architecture (Phase B):** composable world-state builder (`server/app/WorldStateBuilder.js`) and plugin-driven player serialization (`server/app/composePlayer.js`); `Player.toJSON()` delegates to plugin slices
- **Architecture (Phase C):** in-process server event bus (`server/app/EventBus.js`) with domain events in `shared/plugins/domainEvents.js`; combat, quests, loot, economy, social, and combat plugins subscribe via `registerBus` instead of direct cross-imports

## [2.1.0] - 2026-07-06

### Added

- **Economy & trade:** monster gold drops, town vendor Brok (buy potions/gear, sell loot at 40% buy price)
- Player-to-player trade window (4 item slots + gold per side, ready/confirm, range check)
- Multiplayer loot rules: killer + nearby party members get 30s exclusive pickup; then free-for-all
- Locked loot shown dimmed on ground; non-eligible players cannot click to pick up

## [2.0.0] - 2026-07-06

### Added

- **Social layer:** global and zone chat, whispers (`/w Name msg`), party chat (`/p msg`), online player list with count, party invites (accept/decline/leave)
- Party XP sharing for members on the same map within range
- Diablo-style life/mana resource orbs and bottom XP bar (HUD moved off top-left to avoid UI overlap)
- Disconnect modal with page reload when session ends or connection drops in-game
- `sessionEnd` socket event for server-initiated session replacement
- One character per active session; duplicate login evicts the previous client

### Changed

- Chat panel and social roster layout; compact inline party invite buttons for large online lists
- Game hotkeys (I, C, T, WASD, skills) disabled while typing in chat
- Play reconnects the socket before join (fixes re-login after server disconnect)
- Character select returns via full reload after forced disconnect

## [1.27.0] - 2026-07-06

### Added

- Real-time multiplayer sync: other players on the same map are visible with interpolated movement
- Class-colored badge on player nameplates; remote HP and animation state broadcast at 20 Hz

### Changed

- World state broadcasts go to all connected clients on move, combat, and disconnect (not only the acting player)
- Remote player payloads exclude inventory and quest data

## [1.26.0] - 2026-07-06

### Added

- Quest system with kill, fetch, and talk objectives; quest dialogue with accept/turn-in; left-side quest tracker; gold rewards persisted on character save
- Starter quest chain from town NPCs Mira and Eldon (goblin hunt, healing supplies, report errand)

## [1.25.0] - 2026-07-05

### Added

- Minimap UI (top-right): fog-of-war aware terrain, portal markers, and player dot

## [1.24.0] - 2026-07-05

### Added

- Instanced dungeon landmark tiles: stone room walls, wooden doorways on corridor-facing edges, and decorative chests in side rooms

## [1.23.0] - 2026-07-05

### Changed

- Instanced dungeon generator: scattered non-overlapping rooms, minimum-spanning-tree corridors with optional loop paths, entry and boss rooms at opposite ends of the layout
- Wilderness dungeon gate: larger scaled pocket (~25×25 tiles on the 120×90 map), placed far from spawn with gate on the edge facing the player and an carved path to the portal

## [1.22.0] - 2026-07-05

### Added

- Modal character inventory (Diablo-style sheet with dimmed backdrop); open with **I**, close with **Esc** or backdrop click
- Potion hotkeys on skill bar: **8** health, **9** mana — dimmed when empty or resource full, stack count when quantity > 1

### Changed

- Skill bar split into skills (keys 1–7) and potion slots; polished styling with cooldown timers and MP costs
- Inventory layout: labeled Equipped/Backpack sections, horizontal item inspect footer, no overlap with skill bar

## [1.21.0] - 2026-07-05

### Added

- Inventory right-click context menu (equip, use, unequip, destroy)
- Stat comparison when hovering bag items — green/red deltas vs currently equipped gear in the same slot
- Server-authoritative item destroy from bag or equipment slots

### Changed

- Inventory panel enlarged to at least half the screen with scaled slots and typography
- Item inspect stays visible while the cursor is anywhere in the panel (not only over slots)

## [1.20.1] - 2026-07-05

### Fixed

- Wilderness maps again show a dungeon entrance (stone arch zone + portal) leading to the instanced dungeon
- Portals require an explicit click to use; walking into range no longer auto-triggers travel

### Changed

- Reduced attack miss rate: wider melee range, larger click/projectile hit areas, server attack leeway for movement lag
- HP and mana potions use red and light blue inventory icons for quick identification

## [1.20.0] - 2026-07-05

### Added

- Instanced dungeon map: procedural room-and-corridor layout with rock walls
- Boss room at the far end of the dungeon with **Dungeon Lord** boss (large HP bar, always-visible nameplate)
- Dungeon mob density doubled on the instanced dungeon map

### Changed

- Dungeon map no longer reuses the open wilderness generator; corridors are tighter with higher monster count

### Fixed

- Town wilderness portal could be placed on blocked tiles with no path from spawn; gate path is now carved and aligned to the south gate

## [1.19.1] - 2026-07-05

### Added

- Game version label (bottom-left of canvas) sourced from server `package.json`
- Version shown on character selection screen via `/api/version`

### Fixed

- In-game version no longer sits under the inventory panel (moved to bottom-left)

## [1.19.0] - 2026-07-05

### Added

- Dockerfile and `docker-compose.yml` to run the game server in a container; `./data` bind-mounted for character saves
- `scripts/update-server.sh` for remote deploys (git pull, rebuild image, restart)

## [1.18.0] - 2026-07-05

### Added

- Town hub: entire town map is a safe zone with full HP/MP recovery
- NPCs Mira (innkeeper) and Eldon (guide) with click-to-talk dialogue
- Press **T** outside town to start a 6-second recall cast to town (interruptible; progress ring + glow)

## [1.17.0] - 2026-07-05

### Added

- Zone transitions: separate instanced maps for town, wilderness, and dungeon
- Clickable portals between areas with loading overlay; `mapId` persisted on character save
- Portal glow markers and labels on the map; respawn always returns to town

### Changed

- Server runs per-map monster and loot managers; players only see others on the same map

## [1.16.0] - 2026-07-05

### Added

- Multiple map zones: town (safe hub), wilderness (default), and a distant dungeon pocket with stone arch marker
- Zone badge in HUD showing current area; dungeon has higher monster density (+35% spawns)

## [1.15.0] - 2026-07-05

### Added

- Map fog of war: translucent grey veil on unexplored terrain only; monsters and loot hidden until explored; explored areas stay clear

## [1.14.0] - 2026-07-05

### Added

- Spawn town (`id: town`): cleared grass hub with wooden fence, house, well, and cobble paths; no monster spawns or combat

### Changed

- Monster names show on hover only; player and monster nameplates stacked above HP bars (no overlap)
- World map enlarged to 120×90 tiles (3× previous size); monster count and obstacles scale with map area
- Monster population scaled to original density (108 on current map, was 12 on 40×30)
- World state updates omit map tiles after join to reduce network payload

## [1.13.0] - 2026-07-05

### Added

- Per-type monster pixel sprites (goblin, skeleton, bat) with walk animation, ground shadow, nameplate, and hit flash

### Changed

- Map boundary UX: directional cliff faces with grass transition, dark void outside the world, and camera clamping so the view stays framed at edges

## [1.12.0] - 2026-07-05

### Added

- Per-template item icons on ground loot (pixel art, rarity glow, bob animation) and in inventory/equipment slots
- Item inspect panel shows icon above stats; `templateKey` persisted on drops for reliable icon lookup

## [1.11.1] - 2026-07-05

### Changed

- Class-distinct character sprites (warrior armor, mage robes/staff, ranger hood/bow), overhead HP bar, nameplate, and ground shadow
- Default camera zoom increased (1.6×) so map, characters, monsters, loot, and combat FX appear larger on screen; scroll wheel still adjusts zoom

## [1.11.0] - 2026-07-05

### Added

- Health and mana potions drop from monsters (~38% of successful loot rolls); click in inventory to use

## [1.10.2] - 2026-07-05

### Changed

- MP regen only out of combat (3s after attack/skill/damage); faster rates than first pass (mage ~40s empty→full between fights)

### Fixed

- Skills blocked at 0 MP (client no longer fires FX without mana; server uses floored MP for costs)
- Character select list empty after broken `SkillBar.js` syntax prevented app startup
- Player dies at 0 HP: actions blocked, monsters stop targeting, respawn at spawn with full HP/MP

## [1.10.1] - 2026-07-05

### Added

- Character selection screen lists saved heroes (name + class); create and delete characters
- `GET /api/characters` for the selection UI
- Characters saved by **name only** (legacy `name_class` files migrate on load)

### Changed

- Wider projectile hit detection (less missing while moving); skills use server position for aim
- Reduced level-1 skill damage so mobs are not one-shot

### Fixed

- Character delete failed for heroes still stored as legacy `name_class` save files

## [1.10.0] - 2026-07-05

### Added

- Skill bar (8 slots, hotkeys **1**–**8**) with MP cost and cooldown overlays
- Class skills: Warrior (Cleave, Charge), Mage (Fireball, Frost Nova), Ranger (Arrow Shot, Multishot)
- Server-authoritative skill casting with MP drain, cooldowns, and AoE/single-target damage
- Skill visuals: melee arcs, dash trails, projectiles, and ground AoE effects


### Changed

- Inventory and equipment slots use pixel-style icons per item type (weapon, helm, chest, etc.), tinted by rarity
- Item inspect panel below inventory shows name, rarity, slot, and formatted stat bonuses on hover

### Fixed

- Inspect panel no longer flickers when hovering items (fixed height, stable hover handling)

## [1.9.0] - 2026-07-05

### Added

- Accelerating XP curve per level (`50·L² + 50·L`)
- +5 stat points per level-up; manual STR/DEX/INT/VIT allocation (reopen with **C**)
- Level-up panel with flash, sound, current stats readout, and stat buttons
- Character persistence to `data/characters/*.json` (stats, position, inventory, equipment)

### Changed

- Level-up no longer auto-increases stats; spend points via UI or `allocateStat` socket event

### Fixed

- **C** key reliably opens stat panel (keyboard focus, direct key handler)
- Unspent stat points persist after **Continue**; no separate “skill points” counter
- Legacy saves with `skillPoints` merge into `statPoints` on load
- Loot click chases pickup when out of range; inventory/equipment layout improvements

## [1.8.0] - 2026-07-05

### Added

- 8-directional click-to-move with diagonal pathfinding (A*)
- Diagonal keyboard movement (e.g. W+D); speed-normalized so diagonals are not faster

### Changed

- Pathfinding avoids cutting corners through blocked tiles
- Movement directions shared in `shared/movement.js` (server + client)

## [1.7.0] - 2026-07-05

### Added

- Item schema with type, rarity, stats, and equip slot
- Rarity tiers: Common, Magic, Rare, Unique (color-coded)
- Ground loot drops on monster kill; click to pick up
- 10×4 inventory grid and 7 equipment slots (weapon, helm, chest, gloves, boots, ring, amulet)
- Server-authoritative equip/unequip with stat bonuses applied to combat
- Inventory panel UI (toggle with **I**); loot cursor on hover

### Changed

- Combat damage uses effective STR including equipped gear
- `worldState` includes `loot`, player `inventory`, and `equipment`

## [1.6.0] - 2026-07-03

### Added

- Context-sensitive cursor (pointer on ground, alias on enemies)
- Monsters: goblin, skeleton, bat with spawn on map load
- Click-to-attack with server damage, range check, and cooldown
- Monster AI: aggro and chase when player is near
- XP rewards on kill with level-up stat scaling
- HP bars above monsters; attack animation on player sprite
- Direction arrow retained on character facing

### Changed

- Removed dashed aim line to cursor (facing arrow remains)
- Left-click on enemy attacks; left-click on ground moves

## [1.5.0] - 2026-07-03

### Added

- Player stats: HP, MP, STR, DEX, INT, VIT, level, and XP
- Class-based base stats (warrior, mage, ranger)
- HUD with HP/MP bars and stat readout

## [1.4.0] - 2026-07-03

### Added

- Programmatic sprite sheets per class (warrior, mage, ranger)
- Idle, walk (2-frame), and attack animations with direction rows
- Shared sprite frame resolver with unit tests

### Changed

- Characters render from sprite atlas instead of colored squares

## [1.3.0] - 2026-07-03

### Added

- Smooth camera follow with lerp (no instant snap)
- Mouse wheel zoom (0.6×–1.8×)
- Pseudo-isometric Y-axis compression for a Diablo-like view
- Shared camera math module with unit tests

## [1.2.0] - 2026-07-03

### Added

- Mouse aim: character facing follows cursor for future attacks/skills
- Aim line visual from player to cursor
- Server `aim` socket event with authoritative facing state
- Unit tests for shared aim helpers

## [1.1.0] - 2026-07-03

### Added

- Click-to-move with A* pathfinding around water and trees
- Move target indicator on the map
- WASD remains available and cancels an active click path
- Cursor rules, agent skill, and AGENTS.md for development workflow
- Unit test suite with Node.js built-in test runner (`npm test`)

## [1.0.0] - 2026-07-03

### Added

- Initial MVP: browser client with HTML Canvas rendering
- Node.js backend with Express and Socket.IO
- Procedural map generator (40×30 tile grid with grass, water, trees)
- Character selection screen (Warrior, Mage, Ranger)
- Server-authoritative movement with WASD / arrow key controls
- Collision detection for water and tree tiles
- Modular project structure (`server/`, `public/`, `shared/`)
- Development roadmap in `TODO.md`
- Project documentation (`README.md`, `CHANGELOG.md`)
- Git versioning with `.gitignore`

### Fixed

- Map generation: replaced cascading noise algorithm with grass-first clustered obstacles so ~76% of the map is walkable (was ~5%)

[1.6.0]: https://github.com/user/mmo001/releases/tag/v1.6.0
[1.5.0]: https://github.com/user/mmo001/releases/tag/v1.5.0
[1.4.0]: https://github.com/user/mmo001/releases/tag/v1.4.0
[1.3.0]: https://github.com/user/mmo001/releases/tag/v1.3.0
[1.2.0]: https://github.com/user/mmo001/releases/tag/v1.2.0
[1.1.0]: https://github.com/user/mmo001/releases/tag/v1.1.0
[1.0.0]: https://github.com/user/mmo001/releases/tag/v1.0.0
