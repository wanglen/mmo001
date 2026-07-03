# MMO001

A browser-based MMORPG MVP built with **HTML Canvas** and **Node.js**. The goal is a Diablo-like action RPG with real-time multiplayer, starting from a simple playable prototype.

## Features (current)

- Procedural map generation with grass, water, and forest clusters
- Character selection (Warrior, Mage, Ranger)
- Server-authoritative movement with collision detection
- Animated sprite sheets per class (idle, walk, attack) with direction-facing frames
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

Tests use Node.js built-in test runner. Coverage includes pathfinding, collision, map generation, and player management.

### Controls

- **Click** — move to location (A* pathfinding around obstacles)
- **Mouse** — aim / facing direction (yellow dashed line toward cursor)
- **Scroll wheel** — zoom in/out
- **WASD** or **Arrow keys** — manual movement (cancels click path)
- Choose a class and name on the character select screen before entering the world

## Project structure

```
mmo001/
├── server/           # Node.js backend
│   ├── index.js      # Express + Socket.IO entry point
│   ├── map/          # Map generation and collision
│   ├── players/      # Player model and manager
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
| `worldState` | Server → Client | Map, player, and entity state    |
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
