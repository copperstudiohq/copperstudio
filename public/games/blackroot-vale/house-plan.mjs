export const WALL_THICKNESS = .28;
export const DOOR_WIDTH = 1.72;
export const DOOR_HEIGHT = 2.54;
export const FLOOR_LEVEL = .32;
export const HOUSE_BASE_OFFSET = -.10;
export const PLAYER_RADIUS = .39;

const roomStyles = {
  woodcutter: { side: 1, accent: '#784832', extra: 'woodpile' },
  weaver: { side: -1, accent: '#4e6267', extra: 'loom' },
  common: { side: 1, accent: '#725641', extra: 'settle' },
  apothecary: { side: -1, accent: '#5c6246', extra: 'workbench' },
  hunter: { side: 1, accent: '#726045', extra: 'chest' },
  keeper: { side: -1, accent: '#63536a', extra: 'desk' },
  croft: { side: 1, accent: '#785d3b', extra: 'crates' },
};

/** Local coordinates are shared by the furnishings and their walkable footprints. */
export function roomPlan(house) {
  const { w, d } = house;
  const style = roomStyles[house.id];
  const { side } = style;
  const isCommon = house.id === 'common';
  return {
    accent: style.accent,
    furnishings: [
      { kind: 'hearth', x: .30, z: -d / 2 + .61, w: 1.92, d: .92 },
      { kind: 'table', x: -side * w * .22, z: -.18, w: 1.29, d: isCommon ? 2.28 : 1.73 },
      { kind: isCommon ? 'bench' : 'bed', x: side * (w / 2 - .99), z: .44, w: 1.22, d: isCommon ? 2.75 : 2.17 },
      { kind: 'shelf', x: -side * (w / 2 - .66), z: -d / 2 + .68, w: 1.05, d: .51 },
      { kind: style.extra, x: side * (w / 2 - 1.05), z: -d / 2 + .79, w: 1.30, d: .67 },
    ],
  };
}

export function worldToHouse(x, z, house) {
  const dx = x - house.x;
  const dz = z - house.z;
  const cos = Math.cos(house.yaw);
  const sin = Math.sin(house.yaw);
  return { x: dx * cos - dz * sin, z: dx * sin + dz * cos };
}

export function houseToWorld(x, z, house) {
  const cos = Math.cos(house.yaw);
  const sin = Math.sin(house.yaw);
  return { x: house.x + x * cos + z * sin, z: house.z - x * sin + z * cos };
}

export function blocksPlayer(local, house, doorOpen, furnishings) {
  const x = Math.abs(local.x);
  const wallClearance = WALL_THICKNESS / 2 + PLAYER_RADIUS;
  const halfW = house.w / 2;
  const halfD = house.d / 2;
  if (x > halfW + wallClearance || Math.abs(local.z) > halfD + wallClearance) return false;
  if (Math.abs(x - halfW) < wallClearance || Math.abs(local.z + halfD) < wallClearance) return true;
  if (Math.abs(local.z - halfD) < wallClearance
    && (!doorOpen || x >= DOOR_WIDTH / 2 - PLAYER_RADIUS - .05)) return true;
  if (doorOpen && local.z <= halfD && local.z >= halfD - DOOR_WIDTH
    && Math.abs(local.x + DOOR_WIDTH / 2) < PLAYER_RADIUS + .06) return true;
  return furnishings.some((piece) => Math.abs(local.x - piece.x) < piece.w / 2 + PLAYER_RADIUS
    && Math.abs(local.z - piece.z) < piece.d / 2 + PLAYER_RADIUS);
}

export function doorSweepOccupied(local, house) {
  const dx = local.x + DOOR_WIDTH / 2;
  const dz = house.d / 2 - local.z;
  return dx >= -PLAYER_RADIUS && dz >= -PLAYER_RADIUS
    && Math.hypot(dx, dz) < DOOR_WIDTH + PLAYER_RADIUS + .06;
}
