import { PLAYER_RADIUS } from './house-plan.mjs';

export const TOWER_NAME = 'The Ruined Tower';
export const TOWER_SPAWN = { x: 0, z: 6.63, yaw: 0, pitch: .005 };
export const TOWER_LEVEL = 3.42;
export const TOWER_WIDTH = 6.25;
export const TOWER_LENGTH = 7.54;
export const SERVICE_DOOR = { x: -3.73, z: -3.37 };
export const THRONE_ROOM = {
  name: 'The Throne Room',
  gate: -TOWER_LENGTH,
  entryHalf: 1.85,
  entryEnd: -9.65,
  halfWidth: 6.66,
  back: -23.55,
  height: 5.6,
  seat: -21.34,
  armrestX: .68,
  dais: { front: -19.22, halfWidth: 2.35, steps: 3, rise: .18, tread: .39 },
  riders: [{ x: -3.74, z: -18.00, yaw: .21 }, { x: 3.74, z: -18.00, yaw: -.40, plagueMask: true }],
};
export const TOWER_STAIRS = [
  { x0: -5.73, x1: -3.04, from: 4.35, to: -3.63, base: 0 },
  { x0: 3.04, x1: 5.73, from: -3.63, to: 4.35, base: TOWER_LEVEL },
].map((stair) => ({ ...stair, steps: 19, rise: .18, tread: .42 }));
export const TOWER_PLATFORMS = [
  { x0: -TOWER_WIDTH, x1: TOWER_WIDTH, z0: -TOWER_LENGTH, z1: TOWER_LENGTH, y: 0 },
  { x0: -TOWER_WIDTH, x1: TOWER_WIDTH, z0: -TOWER_LENGTH, z1: -3.63, y: TOWER_LEVEL },
  { x0: -3.04, x1: 3.04, z0: -3.63, z1: 3.57, y: TOWER_LEVEL },
  { x0: -TOWER_WIDTH, x1: TOWER_WIDTH, z0: 4.35, z1: TOWER_LENGTH, y: TOWER_LEVEL * 2 },
  { x0: -TOWER_WIDTH, x1: 3.04, z0: SERVICE_DOOR.z, z1: 4.35, y: TOWER_LEVEL * 2 },
];

export function inThroneRoom(z, height) {
  return z < THRONE_ROOM.gate && height >= TOWER_LEVEL - .02 && height <= TOWER_LEVEL + .56;
}

function throneWalkHeight(x, z, height) {
  const { entryEnd, entryHalf, halfWidth, back, riders, dais, seat } = THRONE_ROOM;
  const width = z >= entryEnd - PLAYER_RADIUS ? entryHalf : halfWidth;
  if (Math.abs(x) > width - PLAYER_RADIUS || z < back + PLAYER_RADIUS) return null;
  if (riders.some((rider) => Math.hypot(x - rider.x, z - rider.z) < PLAYER_RADIUS + .48)) return null;
  if (Math.abs(x) < 1.42 && z < seat + .78 && z > seat - 1.0) return null;
  const level = Math.abs(x) < dais.halfWidth
    ? Math.max(0, Math.min(dais.steps, Math.ceil((dais.front - z) / dais.tread))) : 0;
  const floor = TOWER_LEVEL + level * dais.rise;
  return Math.abs(floor - height) < .26 ? floor : null;
}

export function towerWalkHeight(x, z, height) {
  if (z < THRONE_ROOM.gate + PLAYER_RADIUS) return throneWalkHeight(x, z, height);
  if (Math.abs(x) > TOWER_WIDTH - PLAYER_RADIUS || z > TOWER_LENGTH - PLAYER_RADIUS) return null;
  let floor = null;
  for (const { x0, x1, z0, z1, y } of TOWER_PLATFORMS) {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1 && Math.abs(y - height) < .26) floor = Math.max(floor ?? y, y);
  }
  for (const { x0, x1, from, to, base, steps, rise, tread } of TOWER_STAIRS) {
    if (x < x0 + .10 || x > x1 - .10 || z < Math.min(from, to) || z > Math.max(from, to)) continue;
    const y = base + Math.min(steps, Math.ceil(Math.abs(z - from) / tread)) * rise;
    if (Math.abs(y - height) < .26) floor = Math.max(floor ?? y, y);
  }
  if (floor === TOWER_LEVEL * 2 && Math.abs(x - SERVICE_DOOR.x) < 1
    && z < SERVICE_DOOR.z + PLAYER_RADIUS) return null;
  return floor;
}

function nearDoor(player, x, z) {
  const dx = x - player.x;
  const dz = z - player.z;
  const distance = Math.hypot(dx, dz);
  return distance < .67 || (distance < 1.65 && -dx * Math.sin(player.yaw) - dz * Math.cos(player.yaw) > .12);
}

export function towerAction(player, height) {
  if (height < .06 && nearDoor(player, 0, TOWER_LENGTH)) return 'back';
  if (height === TOWER_LEVEL * 2 && nearDoor(player, SERVICE_DOOR.x, SERVICE_DOOR.z)) return 'battlefield';
  return null;
}

export function towerLanding(height) {
  if (height >= TOWER_LEVEL * 2) return 'Broken crown';
  if (height >= TOWER_LEVEL) return 'Guard hall';
  return 'Lower gallery';
}

export function guardCanSee(guard, player, floor) {
  const dx = player.x - guard.x;
  const dz = player.z - guard.z;
  const distance = Math.hypot(dx, dz);
  return player.z >= THRONE_ROOM.gate && Math.abs(floor - guard.y) < .38 && distance < 4.85
    && (distance < 1.2 || dx * Math.sin(guard.yaw) + dz * Math.cos(guard.yaw) > distance * .65);
}
