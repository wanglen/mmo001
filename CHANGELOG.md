# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[1.4.0]: https://github.com/user/mmo001/releases/tag/v1.4.0
[1.3.0]: https://github.com/user/mmo001/releases/tag/v1.3.0
[1.2.0]: https://github.com/user/mmo001/releases/tag/v1.2.0
[1.1.0]: https://github.com/user/mmo001/releases/tag/v1.1.0
[1.0.0]: https://github.com/user/mmo001/releases/tag/v1.0.0
