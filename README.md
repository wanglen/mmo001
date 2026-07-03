# MMO001

A browser-based MMORPG MVP built with **HTML Canvas** and **Node.js**. The goal is a Diablo-like action RPG with real-time multiplayer, starting from a simple playable prototype.

## Features (current)

- Procedural map generation with grass, water, and forest clusters
- Character selection (Warrior, Mage, Ranger)
- Server-authoritative movement with collision detection
- Canvas rendering with camera follow and viewport culling
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

### Controls

- **WASD** or **Arrow keys** — move your character
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
├── TODO.md           # Development roadmap
├── CHANGELOG.md      # Version history
└── package.json
```

## Socket events

| Event        | Direction | Description                          |
|--------------|-----------|--------------------------------------|
| `join`       | Client → Server | Join with character class and name |
| `move`       | Client → Server | Send movement direction          |
| `worldState` | Server → Client | Map, player, and entity state    |
| `error`      | Server → Client | Error messages                   |

## Roadmap

See [TODO.md](TODO.md) for the full Diablo-like MMORPG roadmap (combat, loot, skills, zones, multiplayer, and more).

## License

Private project — all rights reserved.
