/** Shared dimensions keep the visible floor, combat bounds and spawning in agreement. */
export const ARENA_SIZE = Object.freeze({ width: 64, depth: 48, halfWidth: 32, halfDepth: 24 });
export const ARENA_BOUNDS = Object.freeze({ x: 31, z: 23 });
export const ARENA_SPAWN_RADIUS = Object.freeze({ x: 26, z: 18 });
export const DRILL_MINE_SIZE = Object.freeze({ width: 96, depth: 80, halfWidth: 48, halfDepth: 40 });
export const DRILL_MINE_BOUNDS = Object.freeze({ x: 47, z: 39 });
export const DRILL_MINE_SPAWN_RADIUS = Object.freeze({ x: 42, z: 34 });

export const getArenaSize = arenaId => arenaId === 'drill-mine' ? DRILL_MINE_SIZE : ARENA_SIZE;
export const getArenaBounds = arenaId => arenaId === 'drill-mine' ? DRILL_MINE_BOUNDS : ARENA_BOUNDS;
export const getArenaSpawnRadius = arenaId => arenaId === 'drill-mine' ? DRILL_MINE_SPAWN_RADIUS : ARENA_SPAWN_RADIUS;
