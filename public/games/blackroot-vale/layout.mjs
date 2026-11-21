import { blocksPlayer, FLOOR_LEVEL, HOUSE_BASE_OFFSET, houseToWorld, PLAYER_RADIUS, roomPlan, worldToHouse } from './house-plan.mjs';

/** The world uses x for east and z for south. */
export const WORLD_HALF = 280;
export const FOREST_LINE = -23;
export const FIELD_LINE = 51;
export const DISTANT_TOWER = { x: -131, z: 849, height: 180 };
export const VIEWS = {
  village: { x: 0, z: 37, yaw: 0, pitch: 0.028 },
  forest: { x: -0.6, z: -47, yaw: 0.035, pitch: 0.055 },
  field: { x: 5.1, z: 77, yaw: Math.PI - .035, pitch: -.012 },
};

export const ZONES = {
  village: 'Thornwick Village',
  forest: 'Blackroot Forest',
  field: 'South Field',
};

export const HOUSES = [
  { id: 'woodcutter', name: 'Woodcutter’s Cottage', x: -9.8, z: 20, w: 9, d: 7, h: 3.8, yaw: 0.88, style: 0 },
  { id: 'weaver', name: 'Weaver’s House', x: 10.6, z: 16, w: 9.7, d: 8, h: 4.3, yaw: -0.58, style: 1 },
  { id: 'common', name: 'Common House', x: -16.3, z: 5.5, w: 10.2, d: 7.3, h: 4.9, yaw: 0.72, style: 2 },
  { id: 'apothecary', name: 'Apothecary’s House', x: 15.1, z: 0.5, w: 9, d: 7.1, h: 4.35, yaw: -0.81, style: 0 },
  { id: 'hunter', name: 'Hunter’s Lodge', x: -11, z: -12.6, w: 8.2, d: 6.9, h: 3.7, yaw: 0.59, style: 1 },
  { id: 'keeper', name: 'Keeper’s House', x: 9.9, z: -15.4, w: 8, d: 7.2, h: 5.9, yaw: -0.43, style: 2 },
  { id: 'croft', name: 'Croft House', x: 23.2, z: -9.5, w: 7, d: 6.4, h: 3.6, yaw: -0.79, style: 0 },
].map((house) => ({ ...house, baseY: foundationY(house), room: roomPlan(house) }));
export const WELL = { x: -4.1, z: -1.5, radius: 1.6 };
export const LAMPS = [[-3.9, 23], [4.1, 13.2], [-4.8, 6], [3.5, -2], [-3.6, -14], [3.5, -28]];
export const FENCES = [
  [[-23, 24], [-6, 26.4]], [[4.8, 26], [20.5, 23]], [[20.5, 23], [27, 4]],
  [[-19, -17], [-7, -20]], [[5.4, -22], [25, -15]],
];

export const MAIN_TRAIL = [
  [2, 73], [0, 43], [0, 26], [0.5, 12], [0.5, -1], [-0.5, -16], [0.2, -32],
  [-1, -48], [-4, -62], [-6, -77], [-12, -91], [-10, -113], [-2, -134],
  [-10, -157], [-24, -181], [-18, -206], [-1, -229], [15, -250],
];
export const SIDE_TRAILS = [
  [[-4, -62], [5, -70], [16, -77], [22, -87], [29, -99], [31, -120], [26, -150], [16, -168], [-10, -157]],
  [[-12, -91], [-21, -98], [-34, -102], [-49, -113], [-50, -131], [-33, -150], [-14, -148], [-2, -134]],
  [[0.5, 12], [7, 8], [16, 4], [25, -3], [28, -12]],
  [[0.5, -1], [-6, -3], [-12, -1], [-22, 4], [-27, 13]],
];

export function seeded(seed) {
  return function random() {
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ seed >>> 15, seed | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function groundHeight(x, z) {
  const edge = Math.max(0, Math.min(1, (-z - 12) / 28));
  const village = 0.14 * Math.sin(x * 0.13 + z * 0.08) + 0.13 * Math.cos(z * 0.18);
  const woods = 0.76 * Math.sin(z * 0.078 + x * 0.046) + 0.54 * Math.cos(x * 0.15 - z * 0.034)
    + 0.46 * Math.sin(z * 0.16 + x * 0.11);
  const meadow = Math.max(0, Math.min(1, (z - 49) / 28));
  const roll = 2.65 * Math.sin(z * .033 - x * .011) + 1.35 * Math.cos(x * .048 + z * .017) + 1.60;
  return village + edge * woods + meadow * roll;
}

function segmentDistance(x, z, [ax, az], [bx, bz]) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
}

export function trailDistance(x, z, trails = [MAIN_TRAIL, ...SIDE_TRAILS]) {
  let nearest = Number.POSITIVE_INFINITY;
  for (const trail of trails) {
    for (let index = 1; index < trail.length; index++) {
      nearest = Math.min(nearest, segmentDistance(x, z, trail[index - 1], trail[index]));
    }
  }
  return nearest;
}

export function houseContains(x, z, house, pad = 0) {
  const local = worldToHouse(x, z, house);
  return Math.abs(local.x) < house.w / 2 + pad && Math.abs(local.z) < house.d / 2 + pad;
}

export function houseAt(x, z) {
  return HOUSES.find((house) => houseContains(x, z, house, -.04));
}

function foundationY(house) {
  let height = groundHeight(house.x, house.z) + HOUSE_BASE_OFFSET;
  for (const x of [-house.w / 2, 0, house.w / 2]) {
    for (const z of [-house.d / 2, 0, house.d / 2]) {
      const point = houseToWorld(x, z, house);
      height = Math.max(height, groundHeight(point.x, point.z) - FLOOR_LEVEL + .074);
    }
  }
  return height;
}

export function walkSurface(x, z) {
  const house = houseAt(x, z);
  return house ? house.baseY + FLOOR_LEVEL : groundHeight(x, z);
}

export function doorwayAt(x, z) {
  return HOUSES.find((house) => {
    const local = worldToHouse(x, z, house);
    return Math.abs(local.x) < 1.20 && Math.abs(local.z - house.d / 2) < 2.35;
  });
}

export function canStand(x, z, obstacles = [], openDoors) {
  const radius = PLAYER_RADIUS;
  if (Math.hypot(x, z) > WORLD_HALF - 12) return false;
  if (HOUSES.some((house) => blocksPlayer(worldToHouse(x, z, house), house, openDoors?.has(house.id), house.room.furnishings))) return false;
  if (Math.hypot(x - WELL.x, z - WELL.z) < WELL.radius + radius) return false;
  if (LAMPS.some(([lx, lz]) => Math.hypot(x - lx, z - lz) < radius + .09)) return false;
  if (FENCES.some(([start, end]) => segmentDistance(x, z, start, end) < radius + .08)) return false;
  return !obstacles.some((item) => (
    Math.abs(x - item.x) < item.radius + radius && Math.abs(z - item.z) < item.radius + radius
    && Math.hypot(x - item.x, z - item.z) < item.radius + radius
  ));
}

export function regionAt(z) {
  if (z < FOREST_LINE) return 'forest';
  return z > FIELD_LINE ? 'field' : 'village';
}
