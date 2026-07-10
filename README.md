# MMO001

A browser-based MMORPG built with **HTML Canvas** and **Node.js**. Diablo-like action RPG with real-time multiplayer — currently at **v4.0.0**.

## Features (current)

- Procedural map generation with grass, water, and forest clusters
- Character selection (Warrior, Mage, Ranger) — up to **8 characters per account**
- **Accounts:** register / sign in with username and password before character select
- Server-authoritative movement with collision detection and move-rate validation
- Animated sprite sheets per class (idle, walk, attack) with class silhouettes, overhead HP bar, and nameplate
- Per-template item icons on ground loot and inventory (sword, staff, bow, armor, potions, etc.)
- Combat: click enemies to attack, **7 mob types** (goblins, skeletons, bats, wolves, wraiths, scorpions, ghouls) with distinct pixel sprites, HP bars, monster chase AI, retaliate on hit, XP on kill; **monsters scale** with player level and zone depth (wilderness → forest → desert → dungeon); each biome favors distinct types (e.g. wolves in wilderness, wraiths in forest, scorpions in desert, ghouls in dungeon)
- Advanced combat: crits (DEX), dodge (DEX), elemental resistances, status effects (stun/slow/poison/bleed), elite modifiers (~12% spawn), boss phases with scaled damage and guaranteed loot
- **Items:** Magic/Rare affixes, sockets + gems (right-click to socket or replace with confirm), item sets with worn bonuses, town shared stash (`B`) including gems and runes
- Loot: per-item pixel icons on ground (rarity glow) and in inventory; click to pick up; chat message on successful pickup; potions usable from bag
- Inventory: 10×4 grid, 7 equip slots, stat bonuses from gear (server-side); **Sort** button (type/rarity); floating tooltips with equip comparison; potions stack up to 20 per slot; right-click for equip/use/stash/destroy/socket
- Leveling: XP curve, +5 stat points per level-up, allocation UI (reopen with C), JSON character save; quest rewards grant XP, gold, and items
- Login spawn: characters resume at **last saved map and position** on connect (invalid map or blocked tiles fall back to that map's spawn); respawn after death still returns to town
- **Economy:** gold from quests and monster kills; vendor NPC Brok in town (buy/sell; **grouped potion stacks** with quantity picker when selling); player trade via online list (⇄)
- **Loot rules:** party-shared pickup lock for 30s after a kill, then free-for-all
- Skills: skill tree per class (**K**), hotbar keys 1–7 (player-assigned), HP/MP potions 8/9, cooldowns, server-authoritative damage
- Death at 0 HP: blocked actions, respawn button restores HP/MP at spawn
- Map fog of war: translucent grey veil on unexplored terrain only; monsters and loot hidden until explored; explored areas stay clear; top-right minimap shows revealed terrain, portals, and player position
- World zones: **town** safe hub; **wilderness** (default outdoor map); **Dark Forest** and **Scorched Desert** (biome maps via wilderness portals, +1/+2 monster level); **dungeon** (instanced rooms, boss, chests); wilderness **dungeon pocket** with stone arch; zone name in HUD and biome-specific minimap/rendering on forest and desert
- Zone transitions: click glowing portals to travel between town, wilderness, dungeon, Dark Forest, and Scorched Desert (loading overlay on travel)
- Town hub: full HP/MP recovery in town; NPC dialogue and **quests** (Mira & Eldon — starter chain plus forest/desert/frontier follow-ups; **Request a task** for local Ollama-generated per-player quests); press **T** for interruptible 6s recall to town
- **Solo management pause:** when you are the only player online, opening inventory, stash, stat points, or skill tree pauses gameplay until you close the panel
- Multiplayer sync: other players on the same map are visible in real time (position, walk/attack animation, HP) with class-colored nameplate badges
- Social: global/zone chat, whispers (`/w Name msg`), party chat (`/p msg`), online player list, party invites, and shared XP within party range
- Socket.IO broadcasts world state at **20 Hz** with interest-filtered entities and delta patches between full snapshots

## Tech stack

| Layer    | Technology        |
|----------|-------------------|
| Server   | Node.js, Express, SQLite (`better-sqlite3`) |
| Real-time| Socket.IO         |
| Client   | Vanilla JS, Canvas 2D |
| Modules  | Native ES modules |

## Requirements

- [Node.js](https://nodejs.org/) 18 or later, **or** [Docker](https://www.docker.com/) with Docker Compose v2

## Getting started

### Local (Node.js)

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run with auto-reload on file changes
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Create an account, then create or select a character.

Copy [`.env.example`](.env.example) to `.env` to override defaults locally:

```bash
cp .env.example .env
```

**Environment (optional)**

| Variable | Purpose |
|----------|---------|
| `SESSION_SECRET` | Signing key for login tokens (required in production; random per restart if unset) |
| `LEGACY_ACCOUNT_USERNAME` / `LEGACY_ACCOUNT_PASSWORD` | Credentials for imported JSON saves (default `legacy` / `legacy`) |
| `PORT` | HTTP port (default `3000`) |
| `DEBUG_EVENTS=1` | Gameplay debug log at `data/debug-events.log` (movement, pathfinding, session events) |
| `DEBUG_LOG_FILE` | Custom path for the debug event log |
| `DEBUG_LOG_MAX_BYTES` | Rotate when the active log exceeds this size (default `5242880`, 5 MiB) |
| `DEBUG_LOG_MAX_FILES` | Archived logs to keep: `log.1` … `log.N` (default `5`) |
| `OLLAMA_ENABLED` | Enable per-player quest generation (default on; set `0` to disable) |
| `OLLAMA_URL` | Ollama base URL (default `http://127.0.0.1:11434` for local Node; Compose defaults to `http://host.docker.internal:11434`) |
| `OLLAMA_MODEL` | Model name (default `mmo001-quests`) |
| `QUEST_GEN_COOLDOWN_MS` | Cooldown between generate requests (default `60000`) |
| `QUEST_GEN_MAX_ACTIVE` | Max concurrent active generated quests (default `3`) |
| `QUEST_GEN_LOG` | Write quest generation attempts to a dedicated log (default on; set `0` to disable) |
| `QUEST_GEN_LOG_FILE` | Path for quest generation JSON log (default `data/quest-generation.log`) |

### Ollama quest generation (optional)

Procedural quests call a **local** Ollama instance on the game server:

```bash
ollama pull llama3.2
./scripts/ollama-setup-quest-model.sh   # creates mmo001-quests from server/llm/Modelfile
# ensure `ollama serve` is running, then npm start
```

Talk to Mira or Eldon with no pending accept/turn-in, then click **Request a task**. Each attempt is appended as a JSON line to `data/quest-generation.log` (success/fail, title, objective fingerprint, duration). When `DEBUG_EVENTS=1`, the same event is also mirrored into `data/debug-events.log`.

With `DEBUG_EVENTS=1`, the server also enables client-side debug reporting in the browser console and merges client events into the same log file.

**Logged events (high signal only)**

| Event | Source | When |
|-------|--------|------|
| `player_join` / `player_disconnect` | server | Session lifecycle |
| `move_rejected` | server | Anti-cheat or rate limit blocked a move |
| `move_blocked` | server | Move hit collision (throttled 1/s) |
| `path_failed` | client | A* could not reach target (`no_path`, `no_walkable_target`) |
| `attack_target_lost` | client | Chase target missing or dead |
| `quest_generate` | server | LLM quest request (also in `quest-generation.log`) |

Character data is stored in `data/game.db`. On first run, existing `data/characters/*.json` files are imported into the legacy account.

### Docker

Build and run with Docker Compose (database and saves persist in the local `data/` directory). The image uses a multi-stage **bookworm-slim** build that compiles `better-sqlite3` when no ARM64 prebuild is available.

Compose uses **`network_mode: host`** so the game process can call host Ollama at `http://127.0.0.1:11434` (bridge/`host.docker.internal` often returns `EHOSTUNREACH` on Linux VPSes). The app listens on host port `PORT` (default `3000`).

```bash
cp .env.example .env   # optional — set SESSION_SECRET for production
mkdir -p data/characters
docker compose up --build
```

Debug logging is **on by default** in Docker (`DEBUG_EVENTS=1`). Disable with `DEBUG_EVENTS=0 docker compose up`.

Quest generation expects **Ollama on the host**. With host networking, the container uses `OLLAMA_URL=http://127.0.0.1:11434` (override with `DOCKER_OLLAMA_URL`).

```bash
docker compose exec mmo001 printenv OLLAMA_URL
curl -sS http://127.0.0.1:11434/api/tags | head
```

`./scripts/update-server.sh` recreates the container, refreshes the quest model, and probes Ollama from inside the container.

Open [http://localhost:3000](http://localhost:3000). Stop with `Ctrl+C`, or run detached:

```bash
docker compose up --build -d
docker compose down
```

To use a different host port, set `PORT` when starting (maps host → container port 3000):

```bash
PORT=8080 docker compose up --build
```

Build the image only:

```bash
docker build -t mmo001:latest .
docker run --rm -p 3000:3000 -v "$(pwd)/data:/app/data" mmo001:latest
```

### Remote updates

After cloning the repo on a server, pull and redeploy with:

```bash
./scripts/update-server.sh
```

The script fast-forwards `main`, refreshes the Ollama quest model (`mmo001-quests`) when `ollama` is on PATH, rebuilds the image, and restarts Compose. Character data in `./data` is preserved. Override the branch with `BRANCH=feature/foo ./scripts/update-server.sh` if needed. Skip model setup with `SKIP_OLLAMA=1`.

### Cloud / VPS deployment

1. **Provision** a Linux VM (e.g. Oracle Cloud, DigitalOcean, Hetzner) with Docker and Docker Compose v2.
2. **Clone** the repo and configure environment:
   ```bash
   git clone https://github.com/wanglen/mmo001.git
   cd mmo001
   cp .env.example .env
   ```
   Edit `.env` and set a stable `SESSION_SECRET` (at least 16 characters). Set `DEBUG_EVENTS=0` in production unless you need debug logs.
3. **Start** the stack:
   ```bash
   mkdir -p data/characters
   docker compose up --build -d
   ```
4. **Open** port `3000` (or your chosen `PORT`) in the host firewall / security list.
5. **Update** after pulling new releases: `./scripts/update-server.sh`

Optional: put **nginx** or **Caddy** in front for HTTPS and proxy WebSocket traffic to `localhost:3000`.

### Commit and push

Stage all changes, run tests, commit, and push to `origin/main`. On a feature branch, the script merges into `main` first:

```bash
./scripts/commit-and-push.sh "Add feature X"
```

Skip tests for docs-only changes: `SKIP_TESTS=1 ./scripts/commit-and-push.sh "Update README"`.

### Testing

```bash
npm test           # run all unit tests
npm run test:watch # re-run on file changes
```

Tests use Node.js built-in test runner. See [`tests/README.md`](tests/README.md) for critical gameplay validation coverage (combat, loot, movement, anti-cheat).

### Controls

- **Audio** — zone background music (CC0 loops from OpenGameArt; see `public/assets/audio/MUSIC_CREDITS.md`) and procedural SFX after your first click or keypress; adjust volumes in **Settings** (**O**)

- **Click** — move (8-way pathfinding with diagonals), pick up loot, attack/chase enemy, talk to NPCs, or use portals; cursor icon reflects the action (sword, hand, speech bubble, etc.)
- **Mouse** — aim / facing direction (character faces cursor)
- **Scroll wheel** — zoom in/out

- **C** — open character stats / spend stat points (when available)
- **K** — skill tree (learn skills, assign hotbar, respec in town)
- **1**–**7** — skills on your hotbar (MP cost, cooldowns)
- **8** / **9** — use health / mana potion from bag (dimmed when none or resource full)
- **WASD** / **Arrow keys** — move including diagonals (e.g. W+D); cancels click path
- **I** / **Esc** — toggle character inventory (modal sheet, dimmed world); **Sort** reorganizes the bag (server-authoritative)
- **O** / **Esc** — settings (audio volume, mute, keybind reference)
- **B** (town only) — shared stash; right-click bag items to store (including gems/runes), stash items to take
- **Inventory** — left-click equip; right-click equip/use/unequip/**store in stash**/destroy/**socket gem**; hover for floating item tooltips (compare vs equipped)
- **T** (outside town) — start 6s recall cast to town; interrupted by movement, combat, or damage
- **Enter** — focus chat; **Esc** blurs chat while typing
- **Chat** — Global / Zone channels; `/w Name message` whisper; `/p message` party chat (left column, above resource orbs)
- **Online panel** (top-left) — player list, invite to party (+), trade (⇄), accept/decline invites
- **Vendor** — click Brok in town to buy potions/gear or sell items; potions are **grouped by type** with a quantity field for partial sells
- **Trade** — stand near the other player on the same map, then request from the online list (⇄); both mark ready to exchange items and gold (chat shows a hint if you are too far)
- **Resource orbs** (bottom corners) — Life (left) and Mana (right) globes with XP bar between; press **C** for full stats

## Project structure

```
mmo001/
├── server/           # Node.js backend
│   ├── index.js      # Express + Socket.IO entry point
│   ├── map/          # Map generation and collision
│   ├── players/      # Player model and manager
│   ├── monsters/     # Monster entities and AI
│   ├── items/        # Ground loot manager
│   ├── persistence/  # SQLite accounts/characters, legacy JSON migration
│   ├── systems/      # Combat, inventory, game loop
│   └── network/      # Socket event handlers
├── public/           # Static client files
│   ├── js/           # Game loop, rendering, UI, network
│   └── css/
├── shared/           # Constants and events (server + client)
├── tests/            # Unit tests (mirrors server/ and shared/)
├── scripts/          # commit-and-push.sh, update-server.sh
├── Dockerfile        # Production server image
├── docker-compose.yml
├── TODO.md           # Development roadmap
├── CHANGELOG.md      # Version history
└── package.json
```

## Socket events

| Event        | Direction | Description                          |
|--------------|-----------|--------------------------------------|
| `join`       | Client → Server | Join with character class and name |
| `move`       | Client → Server | Send movement direction          |
| `aim`        | Client → Server | Send cursor world position for facing |
| `attack`     | Client → Server | Attack monster by id                |
| `pickup`     | Client → Server | Pick up ground loot by id           |
| `equip`      | Client → Server | Equip item from inventory index     |
| `unequip`    | Client → Server | Unequip item from slot              |
| `destroyItem`| Client → Server | Destroy item from bag or equipment  |
| `allocateStat` | Client → Server | Spend stat point (str/dex/int/vit) |
| `worldState` | Server → Client | Map, player, monsters, loot, inventory |
| `error`      | Server → Client | Error messages                   |

## Roadmap

Recommended roadmap items through **v3.9.0** are complete. See [TODO.md](TODO.md) for the optional backlog (e.g. CI pipeline) and [CHANGELOG.md](CHANGELOG.md) for version history.

## Development

Contributors and AI agents should follow [AGENTS.md](AGENTS.md).

| Resource | Purpose |
|----------|---------|
| [AGENTS.md](AGENTS.md) | Agent workflow and project conventions |
| [.cursor/rules/architecture.mdc](.cursor/rules/architecture.mdc) | Plugin layout — where to add server/client/shared code |
| [.cursor/rules/](.cursor/rules/) | Workflow, code quality, Node/client standards |
| [.cursor/rules/unit-tests.mdc](.cursor/rules/unit-tests.mdc) | Unit testing standards |
| [.cursor/skills/mmo-feature-development/](.cursor/skills/mmo-feature-development/) | Feature implementation skill |

**Workflow:** pick a TODO item → plan → `feature/<name>` branch → implement → bump version + CHANGELOG → merge to `main`.

## License

Private project — all rights reserved.
