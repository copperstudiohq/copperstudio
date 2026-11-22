export const WALL_THICKNESS = .28;
export const DOOR_WIDTH = 1.72;
export const DOOR_HEIGHT = 2.54;
export const FLOOR_LEVEL = .32;
export const HOUSE_BASE_OFFSET = -.10;
export const PLAYER_RADIUS = .39;
export const PLAYER_EYE_HEIGHT = 1.78;
export const TABLE_HEIGHT = .77;
export const MEAL_SEAT_HEIGHT = .40;
export const CHILD_FOOTREST_HEIGHT = .17;

const ADULT_STOOL_HEIGHT = .47;
const CHILD_STOOL_HEIGHT = .55;

const mealHosts = new Set(['woodcutter', 'weaver', 'common']);
const familyHomes = new Set(['apothecary', 'keeper', 'croft']);

const roomStyles = {
  woodcutter: { side: 1, accent: '#784832', extra: 'woodpile' },
  weaver: { side: -1, accent: '#4e6267', extra: 'loom' },
  common: { side: 1, accent: '#725641', extra: 'settle' },
  apothecary: { side: -1, accent: '#5c6246', extra: 'workbench' },
  hunter: { side: 1, accent: '#726045', extra: 'chest' },
  keeper: { side: -1, accent: '#63536a', extra: 'desk' },
  croft: { side: 1, accent: '#785d3b', extra: 'crates' },
  woodland: { side: 1, accent: '#576047', extra: 'chest' },
};

const tradeFurniture = {
  woodpile: { w: 1.15, d: .52, h: .46 },
  loom: { w: 1.24, d: .66, h: 1.65 },
  settle: { w: 1.25, d: .55, h: .46 },
  workbench: { w: 1.34, d: .63, h: .93 },
  chest: { w: 1.02, d: .53, h: .49 },
  desk: { w: 1.14, d: .60, h: .76 },
  crates: { w: 1.02, d: .54, h: .42 },
};

function familySeats(table, side) {
  return [
    { x: table.x, z: table.z - table.d / 2 - .53, yaw: 0, radius: .28, seatHeight: ADULT_STOOL_HEIGHT },
    { x: table.x, z: table.z + table.d / 2 + .53, yaw: Math.PI, radius: .28, seatHeight: ADULT_STOOL_HEIGHT },
    { x: table.x - side * (table.w / 2 + .49), z: table.z + .04, yaw: side * Math.PI / 2,
      radius: .23, seatHeight: CHILD_STOOL_HEIGHT, child: true },
  ];
}

/** Local coordinates are shared by the furnishings and their walkable footprints. */
export function roomPlan(house) {
  const { w, d } = house;
  const style = roomStyles[house.id];
  const { side } = style;
  const isCommon = house.id === 'common';
  const dining = { kind: 'table', x: -side * w * .22, z: -.18, w: isCommon ? .93 : .86, d: isCommon ? 2.28 : 1.72, h: TABLE_HEIGHT };
  const seating = isCommon ? { kind: 'bench', w: .55, d: 2.16, h: .46 } : { kind: 'bed', w: 1.10, d: 2.26, h: .57 };
  const furnishings = [
    { kind: 'hearth', x: .30, z: -d / 2 + .55, w: 1.60, d: .76, h: 1.18 },
    dining,
    { ...seating, x: side * (w / 2 - .99), z: .44 },
    { kind: 'shelf', x: -side * (w / 2 - .66), z: -d / 2 + .60, w: .94, d: .37, h: 1.73 },
    { kind: style.extra, x: side * (w / 2 - 1.05), z: -d / 2 + .79, ...tradeFurniture[style.extra] },
  ];
  if (house.woodland) {
    furnishings.push({
      kind: 'stool', x: dining.x, z: dining.z + dining.d / 2 + .42, w: .39, d: .39, h: ADULT_STOOL_HEIGHT,
    });
  }
  return {
    accent: style.accent,
    residents: house.woodland ? [] : familyHomes.has(house.id) ? familySeats(dining, side)
      : [{ x: side * (w / 2 - 1.03), z: d / 2 - .83, yaw: -side * 1.20, radius: .32 }],
    mealSeat: mealHosts.has(house.id)
      ? { x: dining.x + side * (dining.w / 2 + .53), z: dining.z, side } : null,
    furnishings,
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

export function blocksResident(local, house, radius = PLAYER_RADIUS, except = null) {
  return house.room?.residents?.some((resident) =>
    resident !== except && Math.hypot(local.x - resident.x, local.z - resident.z) < resident.radius + radius) ?? false;
}

export function blocksPlayer(local, house, doorOpen, furnishings, radius = PLAYER_RADIUS, exceptResident = null) {
  const x = Math.abs(local.x);
  const wallClearance = WALL_THICKNESS / 2 + radius;
  const halfW = house.w / 2;
  const halfD = house.d / 2;
  const doorWidth = house.doorWidth ?? DOOR_WIDTH;
  const alongDoor = (local.z - halfD) * (house.doorOutward ? 1 : -1);
  if (doorOpen && alongDoor >= 0 && alongDoor <= doorWidth
    && Math.abs(local.x + doorWidth / 2) < radius + .06) return true;
  if (x > halfW + wallClearance || Math.abs(local.z) > halfD + wallClearance) return false;
  if (Math.abs(x - halfW) < wallClearance || Math.abs(local.z + halfD) < wallClearance) return true;
  if (Math.abs(local.z - halfD) < wallClearance
    && (!doorOpen || x >= doorWidth / 2 - radius - .05)) return true;
  if (blocksResident(local, house, radius, exceptResident)) return true;
  return furnishings.some((piece) => Math.abs(local.x - piece.x) < piece.w / 2 + radius
    && Math.abs(local.z - piece.z) < piece.d / 2 + radius);
}

export function doorSweepOccupied(local, house) {
  const doorWidth = house.doorWidth ?? DOOR_WIDTH;
  const dx = local.x + doorWidth / 2;
  const dz = (local.z - house.d / 2) * (house.doorOutward ? 1 : -1);
  return dx >= -PLAYER_RADIUS && dz >= -PLAYER_RADIUS
    && Math.hypot(dx, dz) < doorWidth + PLAYER_RADIUS + .06;
}
