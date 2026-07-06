const LERP = 0.35;

/**
 * Smooth other players between server snapshots (20 Hz game loop).
 */
export class RemotePlayerDisplay {
  constructor() {
    this.byId = new Map();
  }

  sync(remotes = []) {
    const seen = new Set();

    for (const remote of remotes) {
      seen.add(remote.id);
      const prev = this.byId.get(remote.id);
      if (!prev) {
        this.byId.set(remote.id, { ...remote });
        continue;
      }

      prev.x += (remote.x - prev.x) * LERP;
      prev.y += (remote.y - prev.y) * LERP;
      prev.direction = remote.direction;
      prev.facing = remote.facing ?? remote.direction;
      prev.moving = remote.moving;
      prev.attacking = remote.attacking;
      prev.dead = remote.dead;
      prev.hp = remote.hp;
      prev.maxHp = remote.maxHp;
      prev.level = remote.level;
      prev.name = remote.name;
      prev.characterClass = remote.characterClass;
      prev.townRecallCasting = remote.townRecallCasting;
      prev.townRecallCastMs = remote.townRecallCastMs;
    }

    for (const id of this.byId.keys()) {
      if (!seen.has(id)) this.byId.delete(id);
    }

    return [...this.byId.values()];
  }

  clear() {
    this.byId.clear();
  }
}
