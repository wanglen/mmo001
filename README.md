# MMO001

A browser-based MMORPG MVP built with **HTML Canvas** and **Node.js**. The goal is a Diablo-like action RPG with real-time multiplayer, starting from a simple playable prototype.

## Features (current)

- Procedural map generation with grass, water, and forest clusters
- Character selection (Warrior, Mage, Ranger)
- Server-authoritative movement with collision detection
- Animated sprite sheets per class (idle, walk, attack) with class silhouettes, overhead HP bar, and nameplate
- Per-template item icons on ground loot and inventory (sword, staff, bow, armor, potions, etc.)
- Combat: click enemies to attack, 3 mob types with distinct pixel sprites, HP bars, monster chase AI, retaliate on hit, XP on kill
- Loot: per-item pixel icons on ground (rarity glow) and in inventory; click to pick up; potions usable from bag
- Inventory: 10×4 grid, 7 equip slots, stat bonuses from gear (server-side)
- Leveling: XP curve, +5 stat points per level-up, allocation UI (reopen with C), JSON character save
- Skills: class skill bar (keys 1–8), MP costs, cooldowns, out-of-combat MP regen, server-authoritative damage and visuals
- Death at 0 HP: blocked actions, respawn button restores HP/MP at spawn
- Map fog of war: translucent grey veil on unexplored terrain only; monsters and loot hidden until explored; explored areas stay clear
- World zones: town safe hub, wilderness (default), and dungeon pocket with higher mob density; zone name shown in HUD
- Zone transitions: click glowing portals to travel between separate town, wilderness, and dungeon maps (loading overlay on travel)
- Town hub: full HP/MP recovery in town, NPC dialogue (Mira & Eldon), press **T** for interruptible 6s recall to town
- Socket.IO architecture ready for multiplayer

## Tech stack

| Layer    | Technology        |
|----------|-------------------|
| Server   | Node.js, Express  |
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

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker

Build and run with Docker Compose (character saves persist in the local `data/` directory):

```bash
mkdir -p data/characters
docker compose up --build
```

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

### Testing

```bash
npm test           # run all unit tests
npm run test:watch # re-run on file changes
```

Tests use Node.js built-in test runner. Coverage includes pathfinding, collision, combat, skills, items, inventory, and player management.

### Controls

- **Click** — move (8-way pathfinding with diagonals), pick up loot, attack/chase enemy, or use portals
- **Mouse** — aim / facing direction (character faces cursor)
- **Scroll wheel** — zoom in/out
- **I** — toggle inventory panel
- **C** — open character stats / spend stat points (when available)
- **1**–**8** — use skills from the skill bar (class-specific; costs MP, has cooldowns; Mage: Fireball, Icebolt)
- **WASD** / **Arrow keys** — move including diagonals (e.g. W+D); cancels click path
- **Inventory** — click item to equip; click potions to drink (restore HP/MP)
- **T** (outside town) — start 6s recall cast to town; interrupted by movement, combat, or damage
- **Click NPC** — talk to town residents

## Project structure

```
mmo001/
├── server/           # Node.js backend
│   ├── index.js      # Express + Socket.IO entry point
│   ├── map/          # Map generation and collision
│   ├── players/      # Player model and manager
│   ├── monsters/     # Monster entities and AI
│   ├── items/        # Ground loot manager
│   ├── persistence/  # Character JSON save/load
│   ├── systems/      # Combat, inventory, game loop
│   └── network/      # Socket event handlers
├── public/           # Static client files
│   ├── js/           # Game loop, rendering, UI, network
│   └── css/
├── shared/           # Constants and events (server + client)
├── tests/            # Unit tests (mirrors server/ and shared/)
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
| `allocateStat` | Client → Server | Spend stat point (str/dex/int/vit) |
| `worldState` | Server → Client | Map, player, monsters, loot, inventory |
| `error`      | Server → Client | Error messages                   |

## Roadmap

See [TODO.md](TODO.md) for the full Diablo-like MMORPG roadmap (combat, loot, skills, zones, multiplayer, and more).

## Development

Contributors and AI agents should follow [AGENTS.md](AGENTS.md).

| Resource | Purpose |
|----------|---------|
| [AGENTS.md](AGENTS.md) | Agent workflow and project conventions |
| [.cursor/rules/](.cursor/rules/) | Cursor rules (workflow, code quality, Node/client standards) |
| [.cursor/rules/unit-tests.mdc](.cursor/rules/unit-tests.mdc) | Unit testing standards |
| [.cursor/skills/mmo-feature-development/](.cursor/skills/mmo-feature-development/) | Feature implementation skill |

**Workflow:** pick a TODO item → plan → `feature/<name>` branch → implement → bump version + CHANGELOG → merge to `main`.

## License

Private project — all rights reserved.
