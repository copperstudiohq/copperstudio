import { MEGA_DRILL_LAYOUT as LAYOUT } from './mega-drill-layout.js';
import { getMegaDrillSegmentPoses, megaDrillRoomLocal, megaDrillRoomPoint } from './mega-drill-motion.js';
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const intact = (actor, id) => actor.structureState?.[id]?.remaining !== 0;

export function megaDrillFloor(actor, player, x, z) {
  for (const pose of getMegaDrillSegmentPoses(actor.wormDistance)) {
    const point = megaDrillRoomLocal(actor, pose, x, z);
    if (Math.abs(point.x) >= LAYOUT.width / 2 - .15 || Math.abs(point.z) > 3.05) continue;
    if (pose.index === 0 && Math.abs(point.x) <= LAYOUT.ramp.width / 2 && point.z <= 0) {
      return intact(actor, LAYOUT.ramp.id) ? (actor.elevation || 0) + LAYOUT.ramp.topY * clamp((point.z + 3) / 3, 0, 1) : 0;
    }
    if (intact(actor, 'mega-floor') && (player.groundActorId === actor.id || player.elevation >= LAYOUT.deckHeight + (actor.elevation || 0) - .25)) {
      return LAYOUT.deckHeight + (actor.elevation || 0);
    }
  }
  return 0;
}

function wallsFor(index) {
  const walls = [
    { id: 'mega-near-wall', minX: -4.02, maxX: -3.68, minZ: -3, maxZ: 3, minY: 1.75, maxY: 6.7 },
    { id: 'mega-far-wall', minX: 3.68, maxX: 4.02, minZ: -3, maxZ: 3, minY: 1.75, maxY: 6.7 },
  ];
  if (index === 3) walls.push({ id: 'mega-front-wall', minX: -4.02, maxX: 4.02, minZ: 2.52, maxZ: 3, minY: 1.75, maxY: 6.7 });
  const id = index === 0 ? 'mega-rear-wall' : `mega-partition-${index - 1}`;
  for (const [minX, maxX] of [[-4.02, -1.24], [1.24, 4.02]]) walls.push({ id, minX, maxX, minZ: -3.12, maxZ: -2.88, minY: 1.75, maxY: 6.7 });
  return walls;
}

/** Collision uses the same articulated room poses as the rendered model. */
export function separateMegaDrillPlayer(actor, player, previous = player) {
  const poses = getMegaDrillSegmentPoses(actor.wormDistance), height = player.elevation - (actor.elevation || 0), radius = .42;
  const walls = poses.flatMap(pose => wallsFor(pose.index).filter(wall => intact(actor, wall.id)).map(wall => ({ ...wall, pose })));
  const steps = Math.max(1, Math.ceil(Math.hypot(player.x - previous.x, player.z - previous.z) / .2));
  const dx = (player.x - previous.x) / steps, dz = (player.z - previous.z) / steps;
  const at = { x: previous.x, z: previous.z };
  for (let step = 0; step < steps; step++) {
    at.x += dx; at.z += dz;
    for (const wall of walls) {
      if (height + 1.8 <= wall.minY || height >= wall.maxY) continue;
      const point = megaDrillRoomLocal(actor, wall.pose, at.x, at.z);
      const x = clamp(point.x, wall.minX, wall.maxX), z = clamp(point.z, wall.minZ, wall.maxZ);
      const awayX = point.x - x, awayZ = point.z - z, distance = Math.hypot(awayX, awayZ);
      if (distance >= radius) continue;
      if (distance > .00001) { point.x += awayX / distance * (radius - distance); point.z += awayZ / distance * (radius - distance); }
      else {
        const exits = [{ gap: point.x - wall.minX, x: wall.minX - radius, z: point.z }, { gap: wall.maxX - point.x, x: wall.maxX + radius, z: point.z },
          { gap: point.z - wall.minZ, x: point.x, z: wall.minZ - radius }, { gap: wall.maxZ - point.z, x: point.x, z: wall.maxZ + radius }];
        Object.assign(point, exits.sort((a, b) => a.gap - b.gap)[0]);
      }
      Object.assign(at, megaDrillRoomPoint(actor, wall.pose, point.x, point.z));
    }
  }
  player.x = at.x; player.z = at.z;
}

export function captureMegaDrillPassenger(actor, player) {
  if (player.groundActorId !== actor.id) return null;
  for (const pose of getMegaDrillSegmentPoses(actor.wormDistance)) {
    const point = megaDrillRoomLocal(actor, pose, player.x, player.z);
    if (Math.abs(point.x) < LAYOUT.width / 2 && Math.abs(point.z) <= 3.05) return { index: pose.index, ...point };
  }
  return null;
}
export function carryMegaDrillPassenger(actor, player, passenger) {
  if (!passenger) return;
  const pose = getMegaDrillSegmentPoses(actor.wormDistance)[passenger.index];
  Object.assign(player, megaDrillRoomPoint(actor, pose, passenger.x, passenger.z));
}
