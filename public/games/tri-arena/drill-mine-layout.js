import { DRILL_MINE_BOUNDS as ARENA_BOUNDS } from './arena-config.js';
export { DRILL_MINE_SIZE, DRILL_MINE_BOUNDS } from './arena-config.js';

const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

export const DRILL_MINE_PIT = freeze({ halfWidth: 36, halfDepth: 30 });
export const DRILL_MINE_CAVERN_HEIGHT = 120;
export const DRILL_MINE_TUNNELS = freeze([
  { id: 'north', wall: 'north', lateral: -16, mouth: { x: -16, z: -30 }, spawn: { x: -16, z: -38 }, exit: { x: -16, z: -29 }, width: 10, height: 10 },
  { id: 'south', wall: 'south', lateral: 19, mouth: { x: 19, z: 30 }, spawn: { x: 19, z: 38 }, exit: { x: 19, z: 29 }, width: 10, height: 10 },
  { id: 'east', wall: 'east', lateral: 11, mouth: { x: 36, z: 11 }, spawn: { x: 46, z: 11 }, exit: { x: 35, z: 11 }, width: 10, height: 10 },
  { id: 'west', wall: 'west', lateral: -13, mouth: { x: -36, z: -13 }, spawn: { x: -46, z: -13 }, exit: { x: -35, z: -13 }, width: 10, height: 10 },
]);

// Each wall has two solid strips around its own offset opening. Collision and
// visible geometry share these bounds, including the formerly open centerlines.
export const DRILL_MINE_ROCK_BOUNDS = freeze(DRILL_MINE_TUNNELS.flatMap(tunnel => {
  const low = tunnel.lateral - tunnel.width / 2, high = tunnel.lateral + tunnel.width / 2;
  if (tunnel.wall === 'north' || tunnel.wall === 'south') {
    const north = tunnel.wall === 'north';
    const strip = { minZ: north ? -ARENA_BOUNDS.z : DRILL_MINE_PIT.halfDepth,
      maxZ: north ? -DRILL_MINE_PIT.halfDepth : ARENA_BOUNDS.z };
    const innerFace = north ? 'maxZ' : 'minZ';
    return [{ ...strip, minX: -ARENA_BOUNDS.x, maxX: low, faces: ['maxX', innerFace] },
      { ...strip, minX: high, maxX: ARENA_BOUNDS.x, faces: ['minX', innerFace] }];
  }
  const west = tunnel.wall === 'west';
  const strip = { minX: west ? -ARENA_BOUNDS.x : DRILL_MINE_PIT.halfWidth,
    maxX: west ? -DRILL_MINE_PIT.halfWidth : ARENA_BOUNDS.x };
  const innerFace = west ? 'maxX' : 'minX';
  return [{ ...strip, minZ: -DRILL_MINE_PIT.halfDepth, maxZ: low, faces: [innerFace, 'maxZ'] },
    { ...strip, minZ: high, maxZ: DRILL_MINE_PIT.halfDepth, faces: [innerFace, 'minZ'] }];
}));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function overlaps(x, z, radius, rock) {
  const dx = x - clamp(x, rock.minX, rock.maxX), dz = z - clamp(z, rock.minZ, rock.maxZ);
  return dx === 0 && dz === 0 || dx * dx + dz * dz < radius * radius - 1e-10;
}

/** Circle clearance against the real rock corners, without gaps at tunnel mouths. */
export function drillMineContains(x, z, radius = 0) {
  return [x, z, radius].every(Number.isFinite) && radius >= 0
    && Math.abs(x) + radius <= ARENA_BOUNDS.x && Math.abs(z) + radius <= ARENA_BOUNDS.z
    && !DRILL_MINE_ROCK_BOUNDS.some(rock => overlaps(x, z, radius, rock));
}

/** Keep ordinary moving actors on the excavation floor; never push into outer rock. */
export function separateDrillMineActor(actor, previous = actor, radius = .4) {
  if (![actor?.x, actor?.z, previous?.x, previous?.z, radius].every(Number.isFinite) || radius < 0 || radius >= 5) {
    throw new RangeError('Mine separation requires finite positions and a radius from 0 to less than 5 metres.');
  }
  const startX = actor.x, startZ = actor.z, before = { x: previous.x, z: previous.z }, margin = radius + .001;
  for (let pass = 0; pass < 3; pass++) for (const rock of DRILL_MINE_ROCK_BOUNDS) {
    if (!overlaps(actor.x, actor.z, radius, rock)) continue;
    const faces = rock.faces.map(face => {
      const axis = face.endsWith('X') ? 'x' : 'z', edge = rock[face], sign = face.startsWith('min') ? -1 : 1;
      const wasOutside = sign * (before[axis] - edge) >= radius - 1e-6;
      return { axis, value: edge + sign * margin, wasOutside, distance: Math.abs(actor[axis] - edge) };
    }).sort((a, b) => Number(b.wasOutside) - Number(a.wasOutside) || a.distance - b.distance);
    actor[faces[0].axis] = faces[0].value;
  }
  actor.x = clamp(actor.x, -ARENA_BOUNDS.x + radius, ARENA_BOUNDS.x - radius);
  actor.z = clamp(actor.z, -ARENA_BOUNDS.z + radius, ARENA_BOUNDS.z - radius);
  return actor.x !== startX || actor.z !== startZ;
}
