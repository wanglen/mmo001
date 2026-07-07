# MMO001

A browser-based MMORPG MVP built with **HTML Canvas** and **Node.js**. The goal is a Diablo-like action RPG with real-time multiplayer, starting from a simple playable prototype.

## Features (current)

- Procedural map generation with grass, water, and forest clusters
- Character selection (Warrior, Mage, Ranger)
- Server-authoritative movement with collision detection
- Animated sprite sheets per class (idle, walk, attack) with class silhouettes, overhead HP bar, and nameplate
- Per-template item icons on ground loot and inventory (sword, staff, bow, armor, potions, etc.)
- Combat: click enemies to attack, 3 mob types with distinct pixel sprites, HP bars, monster chase AI, retaliate on hit, XP on kill
- Advanced combat: crits (DEX), dodge (DEX), elemental resistances, status effects (stun/slow/poison/bleed), elite modifiers (~12% spawn), boss phases with scaled damage and guaranteed loot
- **Items:** Magic/Rare affixes, sockets + gems, item sets with worn bonuses, town stash (`B`)
- Loot: per-item pixel icons on ground (rarity glow) and in inventory; click to pick up; potions usable from bag
- Inventory: 10×4 grid, 7 equip slots, stat bonuses from gear (server-side); hover to compare vs equipped, right-click for actions, destroy unwanted items
- Leveling: XP curve, +5 stat points per level-up, allocation UI (reopen with C), JSON character save; quest rewards grant XP, gold, and items
- Login spawn: characters always enter at **town spawn** when you connect (inventory, quests, and progress are restored from save)
- **Economy:** gold from quests and monster kills; vendor NPC Brok in town (buy/sell); player trade via online list (⇄)
- **Loot rules:** party-shared pickup lock for 30s after a kill, then free-for-all
- Skills: class skill bar (keys 1–7), HP/MP potion hotkeys (8/9) with stack counts, cooldowns, server-authoritative damage
- Death at 0 HP: blocked actions, respawn button restores HP/MP at spawn
- Map fog of war: translucent grey veil on unexplored terrain only; monsters and loot hidden until explored; explored areas stay clear; top-right minimap shows revealed terrain, portals, and player position
- World zones: town safe hub, wilderness (default), instanced dungeon (scattered rooms + branching corridors + boss room, with wall/door/chest landmarks), and wilderness dungeon pocket; zone name shown in HUD
- Zone transitions: click glowing portals to travel between separate town, wilderness, and dungeon maps (loading overlay on travel)
- Town hub: full HP/MP recovery in town, NPC dialogue and quests (Mira & Eldon), press **T** for interruptible 6s recall to town
- Multiplayer sync: other players on the same map are visible in real time (position, walk/attack animation, HP) with class-colored nameplate badges
- Social: global/zone chat, whispers (`/w Name msg`), party chat (`/p msg`), online player list, party invites, and shared XP within party range
- Socket.IO broadcasts world state to all clients at 20 Hz

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

### Remote updates

After cloning the repo on a server, pull and redeploy with:

```bash
./scripts/update-server.sh
```

The script fast-forwards `main`, rebuilds the image, and restarts Compose. Character data in `./data` is preserved. Override the branch with `BRANCH=feature/foo ./scripts/update-server.sh` if needed.

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

Tests use Node.js built-in test runner. Coverage includes pathfinding, collision, combat, skills, items, inventory, and player management.

### Controls

- **Click** — move (8-way pathfinding with diagonals), pick up loot, attack/chase enemy, talk to NPCs, or use portals; cursor icon reflects the action (sword, hand, speech bubble, etc.)
- **Mouse** — aim / facing direction (character faces cursor)
- **Scroll wheel** — zoom in/out

- **C** — open character stats / spend stat points (when available)
- **1**–**7** — class skills (MP cost, cooldowns)
- **8** / **9** — use health / mana potion from bag (dimmed when none or resource full)
- **WASD** / **Arrow keys** — move including diagonals (e.g. W+D); cancels click path
- **I** / **Esc** — toggle character inventory (modal sheet, dimmed world)
- **B** (town only) — shared stash; right-click bag items to store, stash items to take
- **Inventory** — left-click equip; right-click equip/use/unequip/destroy; hover bag gear to compare vs equipped
- **T** (outside town) — start 6s recall cast to town; interrupted by movement, combat, or damage
- **Enter** — focus chat; **Esc** blurs chat while typing
- **Chat** — Global / Zone channels; `/w Name message` whisper; `/p message` party chat (left column, above resource orbs)
- **Online panel** (top-left) — player list, invite to party (+), trade (⇄), accept/decline invites
- **Vendor** — click Brok in town to buy potions/gear or sell items from your bag
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
│   ├── persistence/  # Character JSON save/load
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

See [TODO.md](TODO.md) for the full Diablo-like MMORPG roadmap (combat, loot, skills, zones, multiplayer, and more).

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
