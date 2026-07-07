/**
 * @param {Map<string, object>} prevById
 * @param {object[]} nextList
 * @param {string} [idKey]
 */
export function computeCollectionDelta(prevById, nextList, idKey = 'id') {
  const upsert = [];
  const remove = [];
  const nextIds = new Set();

  for (const item of nextList) {
    const id = item?.[idKey];
    if (id == null) continue;
    nextIds.add(id);
    const prev = prevById.get(id);
    if (!prev || !shallowEntityEqual(prev, item)) {
      upsert.push(item);
    }
  }

  for (const id of prevById.keys()) {
    if (!nextIds.has(id)) remove.push(id);
  }

  return { upsert, remove };
}

/**
 * @param {object[] | null | undefined} current
 * @param {object[] | { upsert?: object[], remove?: string[] } | undefined} patch
 * @param {string} [idKey]
 */
export function applyCollectionDelta(current, patch, idKey = 'id') {
  if (patch == null) return current ?? [];
  if (Array.isArray(patch)) return patch;

  const byId = new Map((current ?? []).map((entry) => [entry[idKey], entry]));
  for (const id of patch.remove ?? []) {
    byId.delete(id);
  }
  for (const entry of patch.upsert ?? []) {
    byId.set(entry[idKey], entry);
  }
  return Array.from(byId.values());
}

/**
 * @param {object | null} localState
 * @param {object} incoming
 */
export function applyWorldStateDelta(localState, incoming) {
  if (!incoming?.sync?.delta) {
    return incoming;
  }

  const base = localState ?? {};
  return {
    ...base,
    sync: incoming.sync,
    player: incoming.player ?? base.player,
    monsters: Array.isArray(incoming.monsters) ? incoming.monsters : base.monsters,
    loot: Array.isArray(incoming.loot) ? incoming.loot : base.loot,
    players: Array.isArray(incoming.players) ? incoming.players : base.players,
    combatFx: incoming.combatFx ?? [],
    skillFx: incoming.skillFx ?? [],
  };
}

/**
 * @param {object} state
 */
export function snapshotEntityCollections(state) {
  return {
    monsters: indexEntities(state.monsters),
    loot: indexEntities(state.loot),
    players: indexEntities(state.players),
  };
}

/**
 * @param {object[] | undefined} list
 * @param {string} [idKey]
 */
export function indexEntities(list, idKey = 'id') {
  const map = new Map();
  for (const item of list ?? []) {
    if (item?.[idKey] != null) map.set(item[idKey], cloneEntity(item));
  }
  return map;
}

/**
 * @param {Map<string, object>} prev
 * @param {object} nextState
 */
export function diffEntityCollections(prev, nextState) {
  return {
    monsters: computeCollectionDelta(prev.monsters, nextState.monsters ?? []),
    loot: computeCollectionDelta(prev.loot, nextState.loot ?? []),
    players: computeCollectionDelta(prev.players, nextState.players ?? []),
  };
}

/**
 * @param {Map<string, object>} prev
 * @param {{ monsters?: object, loot?: object, players?: object }} delta
 */
export function mergeEntitySnapshots(prev, delta) {
  return {
    monsters: applySnapshotDelta(prev.monsters, delta.monsters),
    loot: applySnapshotDelta(prev.loot, delta.loot),
    players: applySnapshotDelta(prev.players, delta.players),
  };
}

function applySnapshotDelta(map, delta) {
  const next = new Map(map);
  for (const id of delta?.remove ?? []) next.delete(id);
  for (const item of delta?.upsert ?? []) next.set(item.id, cloneEntity(item));
  return next;
}

function shallowEntityEqual(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function cloneEntity(entity) {
  return { ...entity };
}
