import { ULTRA_FLOORS, ULTRA_STAIRS, ULTRA_WALLS, ULTRA_WINDOWS, ULTRA_ROOMS, ultraPoint, ultraLocalPoint } from './mech-ultra-layout.js';
import { ULTRA_COVER_BOXES, ULTRA_TUNNEL_WALLS, ULTRA_ISLAND } from './mech-ultra-cover.js';

const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const intact = (owner, id) => owner.hp > 0 && owner.structureState?.[id]?.remaining !== 0;
const walls = [...ULTRA_WALLS, ...ULTRA_WINDOWS];
const supports = [...ULTRA_FLOORS, ...ULTRA_STAIRS.map(stair => ({ id: stair.id, frame: stair.frame, stair }))];
const hull = [...walls,
  ...ULTRA_FLOORS.map(floor => ({ ...floor, y: floor.topY - .3, height: .6 })),
  ...ULTRA_ROOMS.filter(room => room.frame !== 'body' || room.id === 'ultra-bridge').map(room => ({
    id: room.roofId, frame: room.frame, x: room.x, y: room.roofY + .25, z: room.z,
    width: room.width, height: .5, depth: room.depth,
  })),
];
const arenaWalls = [...ULTRA_COVER_BOXES, ...ULTRA_TUNNEL_WALLS];

/** Segment-vs-OBB in each part's own frame, including tilted and telescoping arms. */
export function ultraHullBlocks(owner, from, to) {
  if (owner.hp <= 0) return false;
  const localFrames = new Map();
  return hull.some(box => {
    if (owner.structureState?.[box.structuralId || box.id]?.remaining === 0) return false;
    if (!localFrames.has(box.frame)) localFrames.set(box.frame, [ultraLocalPoint(owner, from, box.frame), ultraLocalPoint(owner, to, box.frame)]);
    const [a, b] = localFrames.get(box.frame);
    let near = 0, far = 1;
    for (const [axis, extent] of [['x', 'width'], ['y', 'height'], ['z', 'depth']]) {
      const center = finite(box[axis]), half = box[extent] / 2, delta = b[axis] - a[axis];
      if (Math.abs(delta) < 1e-10) { if (a[axis] < center - half || a[axis] > center + half) return false; continue; }
      const first = (center - half - a[axis]) / delta, second = (center + half - a[axis]) / delta;
      near = Math.max(near, Math.min(first, second)); far = Math.min(far, Math.max(first, second));
      if (near > far) return false;
    }
    return far > 1e-6 && near < 1 - 1e-6;
  });
}

/** Project a world X/Z onto a horizontal or pitched physical floor plane. */
function surfaceAt(owner, surface, x, z) {
  const stair = surface.stair;
  const origin = stair ? stair.from : { x: surface.x - surface.width / 2, y: surface.topY, z: surface.z - surface.depth / 2 };
  const along = stair ? { x: stair.to.x - origin.x, y: stair.to.y - origin.y, z: stair.to.z - origin.z }
    : { x: surface.width, y: 0, z: 0 };
  const across = stair ? { x: -along.z / stair.length * stair.width, y: 0, z: along.x / stair.length * stair.width }
    : { x: 0, y: 0, z: surface.depth };
  const a = ultraPoint(owner, origin, surface.frame);
  const b = ultraPoint(owner, { x: origin.x + along.x, y: origin.y + along.y, z: origin.z + along.z }, surface.frame);
  const c = ultraPoint(owner, { x: origin.x + across.x, y: origin.y, z: origin.z + across.z }, surface.frame);
  const ux = b.x - a.x, uz = b.z - a.z, vx = c.x - a.x, vz = c.z - a.z, determinant = ux * vz - uz * vx;
  if (Math.abs(determinant) < 1e-8) return null;
  const dx = x - a.x, dz = z - a.z;
  const u = (dx * vz - dz * vx) / determinant, v = (ux * dz - uz * dx) / determinant;
  if (u < -.004 || u > 1.004 || v < (stair ? -.5 : 0) - .004 || v > (stair ? .5 : 1) + .004) return null;
  return { height: a.y + u * (b.y - a.y) + v * (c.y - a.y), frame: surface.frame, id: surface.id };
}

function supportAt(owner, actor, x, z) {
  let support = null;
  for (const surface of supports) {
    if (!intact(owner, surface.id)) continue;
    const hit = surfaceAt(owner, surface, x, z);
    if (!hit || hit.height <= 0 || hit.height > finite(actor.elevation) + .42) continue;
    if (!support || hit.height > support.height) support = hit;
  }
  return support;
}

export function ultraFloor(owner, actor, x, z) { return supportAt(owner, actor, x, z)?.height ?? 0; }

export function captureUltraPassenger(owner, actor) {
  if (!actor || finite(actor.jumpVelocity) > 0) return null;
  const roomOccupant = actor.ownerId === owner.id && actor.ultraRoom != null && !actor.ultraFalling;
  if (actor.groundActorId !== owner.id && !roomOccupant) return null;
  const surface = supportAt(owner, actor, actor.x, actor.z);
  if (!surface || Math.abs(surface.height - actor.elevation) > .45) return null;
  return { ...ultraLocalPoint(owner, { x: actor.x, y: actor.elevation, z: actor.z }, surface.frame),
    frame: surface.frame, id: surface.id };
}

export function carryUltraPassenger(owner, actor, passenger) {
  if (!passenger || !intact(owner, passenger.id)) return false;
  const point = ultraPoint(owner, passenger, passenger.frame);
  actor.x = point.x; actor.z = point.z; actor.elevation = Math.max(0, point.y);
  actor.groundHeight = actor.elevation; actor.groundActorId = owner.id;
  return true;
}

function pushBox(point, box, radius) {
  const minX = box.x - box.width / 2, maxX = box.x + box.width / 2;
  const minZ = box.z - box.depth / 2, maxZ = box.z + box.depth / 2;
  const dx = point.x - clamp(point.x, minX, maxX), dz = point.z - clamp(point.z, minZ, maxZ), gap = Math.hypot(dx, dz);
  if (gap >= radius) return false;
  if (gap > 1e-8) { point.x += dx / gap * (radius - gap); point.z += dz / gap * (radius - gap); }
  else {
    const exits = [{ gap: point.x - minX, x: minX - radius, z: point.z }, { gap: maxX - point.x, x: maxX + radius, z: point.z },
      { gap: point.z - minZ, x: point.x, z: minZ - radius }, { gap: maxZ - point.z, x: point.x, z: maxZ + radius }];
    const exit = exits.sort((a, b) => a.gap - b.gap)[0]; point.x = exit.x; point.z = exit.z;
  }
  return true;
}

/** Continuous substeps keep a dash from passing through armor or intact glass. */
export function separateUltraPlayer(owner, actor, previous = actor) {
  const count = Math.min(160, Math.max(1, Math.ceil(Math.hypot(actor.x - previous.x, actor.z - previous.z) / .2)));
  const dx = (actor.x - previous.x) / count, dz = (actor.z - previous.z) / count;
  const position = { x: previous.x, z: previous.z };
  for (let step = 0; step < count; step++) {
    position.x += dx; position.z += dz;
    for (const wall of walls) {
      if (!intact(owner, wall.structuralId)) continue;
      const local = ultraLocalPoint(owner, { ...position, y: finite(actor.elevation) }, wall.frame);
      // The inclined shoulder meets the next deck a fraction below its floor.
      // Match floor step clearance so the lower deck's wall cannot seal that door.
      if (local.y + 1.75 < wall.y - wall.height / 2 || local.y >= wall.y + wall.height / 2 - .42) continue;
      if (pushBox(local, wall, .4)) {
        const world = ultraPoint(owner, local, wall.frame); position.x = world.x; position.z = world.z;
      }
    }
  }
  actor.x = position.x; actor.z = position.z;
}

export function separateUltraCover(actor, previous = actor) {
  const count = Math.min(160, Math.max(1, Math.ceil(Math.hypot(actor.x - previous.x, actor.z - previous.z) / .2)));
  const dx = (actor.x - previous.x) / count, dz = (actor.z - previous.z) / count, point = { x: previous.x, z: previous.z };
  for (let index = 0; index < count; index++) {
    point.x += dx; point.z += dz;
    for (const cover of arenaWalls) if (finite(actor.elevation) < cover.height) pushBox(point, cover, finite(actor.radius, .42));
  }
  actor.x = point.x; actor.z = point.z;
}

/** A segment test at the projectile's actual height makes the sharp walls useful cover. */
export function ultraCoverBlocks(from, to) {
  return arenaWalls.some(box => {
    let enter = 0, exit = 1;
    for (const [axis, low, high] of [['x', box.x - box.width / 2, box.x + box.width / 2],
      ['y', 0, box.height], ['z', box.z - box.depth / 2, box.z + box.depth / 2]]) {
      const start = finite(from[axis]), delta = finite(to[axis]) - start;
      if (Math.abs(delta) < 1e-9) { if (start < low || start > high) return false; continue; }
      const a = (low - start) / delta, b = (high - start) / delta;
      enter = Math.max(enter, Math.min(a, b)); exit = Math.min(exit, Math.max(a, b));
      if (enter > exit) return false;
    }
    return enter <= exit && exit >= 0 && enter <= 1;
  });
}

export function ultraArenaActive(state) {
  return state?.arenaId === 'drill-mine' && Boolean(state.ultraEncounter || state.enemies?.some(actor => actor.type === 'mech-spider-tank-ultra' && actor.hp > 0));
}
export function ultraInLava(actor) {
  return finite(actor.elevation) <= .4 && !actor.groundActorId
    && (Math.abs(actor.x) > ULTRA_ISLAND.halfWidth || Math.abs(actor.z) > ULTRA_ISLAND.halfDepth);
}
