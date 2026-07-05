# MMO001

A browser-based MMORPG MVP built with **HTML Canvas** and **Node.js**. The goal is a Diablo-like action RPG with real-time multiplayer, starting from a simple playable prototype.

## Features (current)

- Procedural map generation with grass, water, and forest clusters
- Character selection (Warrior, Mage, Ranger)
- Server-authoritative movement with collision detection
- Animated sprite sheets per class (idle, walk, attack) with direction-facing frames
- Combat: click enemies to attack, 3 mob types, HP bars, monster chase AI, retaliate on hit, XP on kill
- Loot: items drop on kill (rarity-colored), click to pick up; health/mana potions usable from inventory
- Inventory: 10×4 grid, 7 equip slots, stat bonuses from gear (server-side)
- Leveling: XP curve, +5 stat points per level-up, allocation UI (reopen with C), JSON character save
- Skills: class skill bar (keys 1–8), MP costs, cooldowns, out-of-combat MP regen, server-authoritative damage and visuals
- Death at 0 HP: blocked actions, respawn button restores HP/MP at spawn
- Socket.IO architecture ready for multiplayer

## Tech stack

| Layer    | Technology        |
|----------|-------------------|
| Server   | Node.js, Express  |
| Real-time| Socket.IO         |
| Client   | Vanilla JS, Canvas 2D |
| Modules  | Native ES modules |

## Requirements

- [Node.js](https://nodejs.org/) 18 or later

## Getting started

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run with auto-reload on file changes
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
npm test           # run all unit tests
npm run test:watch # re-run on file changes
```

Tests use Node.js built-in test runner. Coverage includes pathfinding, collision, combat, skills, items, inventory, and player management.

### Controls

- **Click** — move (8-way pathfinding with diagonals), pick up loot, or attack/chase enemy
- **Mouse** — aim / facing direction (character faces cursor)
- **Scroll wheel** — zoom in/out
- **I** — toggle inventory panel
- **C** — open character stats / spend stat points (when available)
- **1**–**8** — use skills from the skill bar (class-specific; costs MP, has cooldowns; Mage: Fireball, Icebolt)
- **WASD** / **Arrow keys** — move including diagonals (e.g. W+D); cancels click path
- **Inventory** — click item to equip; click potions to drink (restore HP/MP)
- Character selection: pick an existing hero, create a new one, or delete saves (name is the unique key)

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
