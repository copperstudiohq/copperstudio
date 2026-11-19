import { DRILL_MINE_PIT } from './drill-mine-layout.js';

// Deliberately uneven, stable placements: these are scenery, not spawn routes.
const placements = {
  north: [[18, 13, 7, 8], [-28, 25, 8, 9], [2, 32, 6, 7], [29, 42, 7, 8], [-12, 73, 8, 9], [11, 101, 7, 8]],
  south: [[-24, 12, 8, 7], [8, 23, 6, 9], [29, 48, 7, 8], [-8, 65, 8, 7], [-29, 89, 6, 8], [17, 100, 8, 9]],
  east: [[-19, 18, 6, 7], [23, 52, 7, 9], [-5, 61, 8, 8], [-24, 78, 6, 9], [14, 96, 7, 8], [0, 102, 8, 9]],
  west: [[20, 35, 7, 8], [-4, 44, 8, 7], [-23, 58, 6, 9], [7, 70, 7, 8], [24, 83, 6, 7], [-12, 93, 8, 8]],
};
export const DRILL_MINE_UPPER_TUNNELS = Object.freeze(Object.entries(placements).flatMap(([wall, rooms]) =>
  rooms.map(([lateral, base, width, height], index) => Object.freeze({ id: `upper-${wall}-${index + 1}`,
    wall, lateral, base, width, height, depth: 8, active: false }))));

/** Carving includes projecting rock corbels, while the actual room remains 8m deep. */
export function minePortalBounds(portal) {
  const { wall, lateral, width, height, base = 0, depth = 20 } = portal;
  const low = lateral - width / 2, high = lateral + width / 2;
  const y = { minY: base, maxY: base + height };
  if (wall === 'north') return { minX: low, maxX: high, minZ: -DRILL_MINE_PIT.halfDepth - depth - .2, maxZ: -DRILL_MINE_PIT.halfDepth + 6, ...y };
  if (wall === 'south') return { minX: low, maxX: high, minZ: DRILL_MINE_PIT.halfDepth - 6, maxZ: DRILL_MINE_PIT.halfDepth + depth + .2, ...y };
  if (wall === 'east') return { minZ: low, maxZ: high, minX: DRILL_MINE_PIT.halfWidth - 6, maxX: DRILL_MINE_PIT.halfWidth + depth + .2, ...y };
  if (wall === 'west') return { minZ: low, maxZ: high, minX: -DRILL_MINE_PIT.halfWidth - depth - .2, maxX: -DRILL_MINE_PIT.halfWidth + 6, ...y };
  throw new RangeError(`Unknown mine portal wall: ${String(wall)}`);
}
