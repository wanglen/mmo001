# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
