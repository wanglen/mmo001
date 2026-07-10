# Tests

Run the full suite from the repo root:

```bash
npm test
```

Tests use the Node.js built-in test runner (`node --test`). Files live under `tests/` and mirror `shared/`, `server/`, and `public/` modules.

## Critical gameplay validation

These cover server-authoritative combat, loot rules, movement, and anti-cheat checks referenced in the DevOps roadmap:

| Area | Test file |
|------|-----------|
| Combat formulas & targeting | `tests/shared/combat.test.js` |
| Server attack processing | `tests/server/systems/combat.test.js` |
| Loot eligibility & pickup lock | `tests/shared/lootRules.test.js` |
| Movement directions & validation | `tests/shared/movement.test.js` |
| Move rate & loot range anti-cheat | `tests/shared/plugins/core/anticheat.test.js` |

Additional coverage includes pathfinding, collision, inventory, vendor sell, world maps, zones, skills, quests, persistence, and world sync.
