import { PLAYER_RADIUS } from './house-plan.mjs';

export const DUNGEON_NAME = 'The Under Neath';
export const CELL = { halfWidth: 2.43, back: 5.42 };
export const GATE = { width: 1.84, spring: 1.96, depth: .24 };
export const HALL = { halfWidth: 1.46, end: -16.03 };
export const STAIRS = { start: -10.62, steps: 9, tread: .41, rise: .165 };
export const PALLET = { x: 1.69, z: 3.93, width: .85, length: 1.97 };
export const PRISONER = { x: -1.43, z: 1.37, radius: .31 };
export const DUNGEON_SPAWN = { x: 0, z: 3.57, yaw: 0, pitch: -.025 };
export const DUNGEON_STAIRS = { x: 0, z: -14.93, yaw: Math.PI, pitch: 0 };
export const CELL_BED = { depth: 2.54, width: .83, length: 1.74 };

export const SIDE_HALLS = [
  { x0: -5.89, x1: -HALL.halfWidth, z0: -4.94, z1: -2.32 },
  { x0: -8.47, x1: -5.89, z0: -10.19, z1: -2.32 },
  { x0: -5.89, x1: -HALL.halfWidth, z0: -10.19, z1: -7.66 },
  { x0: HALL.halfWidth, x1: 5.27, z0: -6.95, z1: -4.27 },
  { x0: 5.27, x1: 7.84, z0: -10.19, z1: -4.27 },
  { x0: HALL.halfWidth, x1: 5.27, z0: -10.19, z1: -7.62 },
];
export const CELL_ROOMS = [
  { id: 'west-near', wall: -8.47, z: -4.29 },
  { id: 'west-far', wall: -8.47, z: -7.69 },
  { id: 'east-near', wall: 7.84, z: -5.79 },
  { id: 'east-far', wall: 7.84, z: -8.73 },
].map((cell) => {
  const side = Math.sign(cell.wall);
  const back = cell.wall + side * 3.12;
  const halfWidth = 1.23;
  return { ...cell, side, halfWidth, x0: Math.min(cell.wall, back), x1: Math.max(cell.wall, back),
    z0: cell.z - halfWidth, z1: cell.z + halfWidth };
});
const passages = [{ x0: -HALL.halfWidth, x1: HALL.halfWidth, z0: HALL.end, z1: 0 }, ...SIDE_HALLS, ...CELL_ROOMS];

function inPassage(x, z) {
  return passages.some(({ x0, x1, z0, z1 }) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
}

/** Extract the outer edges of the joined rectangles for both collision and masonry. */
function passageEdges(lines, cuts, occupied, axis) {
  const edges = [];
  for (const line of lines) {
    let from = null;
    for (let i = 0; i < cuts.length - 1; i++) {
      const at = cuts[i];
      const middle = (at + cuts[i + 1]) / 2;
      const border = occupied(line + .001, middle) !== occupied(line - .001, middle);
      if (border && from === null) from = at;
      if (!border && from !== null) {
        edges.push({ axis, line, from, to: at });
        from = null;
      }
    }
    if (from !== null) edges.push({ axis, line, from, to: cuts.at(-1) });
  }
  return edges;
}

const xCuts = [...new Set(passages.flatMap(({ x0, x1 }) => [x0, x1]))].sort((a, b) => a - b);
const zCuts = [...new Set(passages.flatMap(({ z0, z1 }) => [z0, z1]))].sort((a, b) => a - b);
export const HALL_WALLS = [
  ...passageEdges(xCuts, zCuts, inPassage, 'x'),
  ...passageEdges(zCuts, xCuts, (z, x) => inPassage(x, z), 'z').filter(({ line }) => line !== 0 && line !== HALL.end),
];

function wallClear(x, z, { axis, line, from, to }) {
  const normal = axis === 'x' ? x : z;
  const along = axis === 'x' ? z : x;
  const nearest = Math.max(from, Math.min(along, to));
  return Math.hypot(normal - line, along - nearest) >= PLAYER_RADIUS;
}

export function dungeonFloor(z) {
  const steps = Math.max(0, Math.min(STAIRS.steps, Math.ceil((STAIRS.start - z) / STAIRS.tread)));
  return steps * STAIRS.rise;
}

export function canWalkDungeon(x, z, gateOpen, openCells, prisonerPresent = true) {
  const radius = PLAYER_RADIUS;
  if (z > CELL.back - radius || z < HALL.end + radius) return false;
  if (Math.abs(z) < GATE.depth / 2 + radius) {
    if (!gateOpen || Math.abs(x) >= GATE.width / 2 - radius) return false;
  }
  if (z > 0) {
    return Math.abs(x) < CELL.halfWidth - radius
      && (!prisonerPresent || Math.hypot(x - PRISONER.x, z - PRISONER.z) >= PRISONER.radius + radius) && (
      Math.abs(x - PALLET.x) >= PALLET.width / 2 + radius
      || Math.abs(z - PALLET.z) >= PALLET.length / 2 + radius
    );
  }
  if (gateOpen && z > -GATE.width - radius && Math.abs(x + GATE.width / 2) < radius + .04) return false;
  for (const cell of CELL_ROOMS) {
    const depth = (x - cell.wall) * cell.side;
    const across = z - cell.z;
    const open = openCells?.has(cell.id);
    if (Math.abs(depth) < GATE.depth / 2 + radius && Math.abs(across) < cell.halfWidth + radius
      && (!open || Math.abs(across) >= GATE.width / 2 - radius)) return false;
    if (open && depth > 0 && depth < GATE.width + radius
      && Math.abs(across + cell.side * GATE.width / 2) < radius + .04) return false;
    if (Math.abs(depth - CELL_BED.depth) < CELL_BED.width / 2 + radius
      && Math.abs(across) < CELL_BED.length / 2 + radius) return false;
  }
  return inPassage(x, z) && HALL_WALLS.every((wall) => wallClear(x, z, wall));
}

function lookingToward(player, x, z, threshold = -.14) {
  return -(x - player.x) * Math.sin(player.yaw) - (z - player.z) * Math.cos(player.yaw) > threshold;
}

export function dungeonAction(player, gateOpen, openCells, prisonerPresent = true) {
  if (!gateOpen && player.z > 0 && Math.hypot(player.x, player.z) < 1.94 && lookingToward(player, 0, 0)) return 'gate';
  if (gateOpen && player.z < -14.07 && lookingToward(player, 0, HALL.end)) return 'tower';
  const distance = Math.hypot(player.x - PRISONER.x, player.z - PRISONER.z);
  if (prisonerPresent && player.z > .25 && distance < 2.73
    && lookingToward(player, PRISONER.x, PRISONER.z, distance * .64)) return 'prisoner';
  for (const cell of CELL_ROOMS) {
    if (!openCells?.has(cell.id) && Math.hypot(player.x - cell.wall, player.z - cell.z) < 1.55
      && lookingToward(player, cell.wall, cell.z, .08)) return cell.id;
  }
  return null;
}
