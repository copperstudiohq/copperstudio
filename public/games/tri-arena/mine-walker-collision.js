import { MINE_WALKER_LAYOUT as LAYOUT, mineWalkerLadderHeight } from './mine-walker-layout.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = value => Number.isFinite(value) ? value : 0;
const offsetY = owner => finite(owner.elevation) - finite(owner.bodyDrop);
const intact = (owner, id) => owner.structureState?.[id]?.remaining !== 0;
const surfaces = [LAYOUT.ladder.landing,
  { id: LAYOUT.floorId, x: 0, z: 0, width: LAYOUT.width, depth: LAYOUT.depth, topY: LAYOUT.floorY }];

export function mineWalkerLocal(owner, x, z) {
  const dx = x - owner.x, dz = z - owner.z, sine = Math.sin(owner.angle || 0), cosine = Math.cos(owner.angle || 0);
  return { x: cosine * dx - sine * dz, z: sine * dx + cosine * dz };
}
export function mineWalkerPoint(owner, point) {
  const sine = Math.sin(owner.angle || 0), cosine = Math.cos(owner.angle || 0);
  return { x: owner.x + cosine * point.x + sine * point.z, y: offsetY(owner) + finite(point.y),
    z: owner.z - sine * point.x + cosine * point.z };
}
export function insideMineWalkerRoom(owner, actor) {
  const local = mineWalkerLocal(owner, actor.x, actor.z), height = finite(actor.elevation) - offsetY(owner);
  return Math.abs(local.x) < LAYOUT.width / 2 - .15 && Math.abs(local.z) < LAYOUT.depth / 2 + .05
    && height >= LAYOUT.floorY - .25 && height < LAYOUT.roofY;
}

function supportAt(owner, actor, x, z, standing = false) {
  if (owner.hp !== undefined && owner.hp <= 0) return null;
  const local = mineWalkerLocal(owner, x, z), highest = finite(actor.elevation) + .235;
  let support = null;
  for (const surface of surfaces) {
    if (!intact(owner, surface.id)) continue;
    if (Math.abs(local.x - surface.x) > surface.width / 2 + .005 || Math.abs(local.z - surface.z) > surface.depth / 2 + .005) continue;
    const kind = surface.id === LAYOUT.floorId ? 'room' : 'landing';
    const y = kind === 'room' ? offsetY(owner) + surface.topY : mineWalkerLadderHeight(owner.bodyDrop);
    if (y <= 0 || y > highest) continue;
    const closer = standing && Math.abs(finite(actor.elevation) - y) < Math.abs(finite(actor.elevation) - (support?.height ?? -Infinity));
    if (!support || closer || !standing && y > support.height) support = { height: y, surface: kind, id: surface.id };
  }
  return support;
}

/** The top landing ignores body hover; the room floor follows it without high-floor teleporting. */
export function mineWalkerFloor(owner, actor, x, z) {
  return supportAt(owner, actor, x, z)?.height ?? 0;
}

const walls = [
  { id: 'walker-left-wall', minX: -4.02, maxX: -3.72, minZ: -3.3, maxZ: 3.3, minY: 10.2, maxY: 14.7 },
  { id: 'walker-right-wall', minX: 3.72, maxX: 4.02, minZ: -3.3, maxZ: 3.3, minY: 10.2, maxY: 14.7 },
  { id: 'walker-front-wall', minX: -4.02, maxX: 4.02, minZ: 3, maxZ: 3.3, minY: 10.2, maxY: 14.7 },
  { id: 'walker-rear-wall', minX: -4.02, maxX: -1.2, minZ: -3.3, maxZ: -3, minY: 10.2, maxY: 14.7 },
  { id: 'walker-rear-wall', minX: 1.2, maxX: 4.02, minZ: -3.3, maxZ: -3, minY: 10.2, maxY: 14.7 },
  { id: 'walker-rear-upper', minX: -1.2, maxX: 1.2, minZ: -3.3, maxZ: -3, minY: 13.3, maxY: 14.7 },
];

function pushFromBox(point, box, radius) {
  const x = clamp(point.x, box.minX, box.maxX), z = clamp(point.z, box.minZ, box.maxZ);
  const awayX = point.x - x, awayZ = point.z - z, distance = Math.hypot(awayX, awayZ);
  if (distance >= radius) return;
  if (distance > 1e-6) { point.x += awayX / distance * (radius - distance); point.z += awayZ / distance * (radius - distance); }
  else {
    const exits = [{ gap: point.x - box.minX, x: box.minX - radius, z: point.z }, { gap: box.maxX - point.x, x: box.maxX + radius, z: point.z },
      { gap: point.z - box.minZ, x: point.x, z: box.minZ - radius }, { gap: box.maxZ - point.z, x: point.x, z: box.maxZ + radius }];
    Object.assign(point, exits.sort((a, b) => a.gap - b.gap)[0]);
  }
}

/** Substeps prevent dashes from crossing the room's real closed walls. */
export function separateMineWalkerPlayer(owner, actor, previous = actor) {
  const radius = .42, height = finite(actor.elevation) - offsetY(owner);
  const count = Math.max(1, Math.min(128, Math.ceil(Math.hypot(actor.x - previous.x, actor.z - previous.z) / .2)));
  const dx = (actor.x - previous.x) / count, dz = (actor.z - previous.z) / count;
  const at = { x: previous.x, z: previous.z };
  for (let step = 0; step < count; step++) {
    at.x += dx; at.z += dz;
    for (const wall of walls) {
      if (!intact(owner, wall.id) || height + 1.8 <= wall.minY || height >= wall.maxY) continue;
      const point = mineWalkerLocal(owner, at.x, at.z); pushFromBox(point, wall, radius);
      Object.assign(at, mineWalkerPoint(owner, point));
    }
  }
  actor.x = at.x; actor.z = at.z;
}

export function captureMineWalkerPassenger(owner, actor) {
  if (actor.mineWalkerClimb?.ownerId === owner.id) {
    if (!ladderIntact(owner, actor.mineWalkerClimb.fraction, actor.mineWalkerClimb.fraction)) return null;
    return { x: 0, z: LAYOUT.ladder.climbZ, surface: 'ladder', fraction: actor.mineWalkerClimb.fraction };
  }
  if (actor.groundActorId !== owner.id || finite(actor.jumpVelocity) > 0) return null;
  const support = supportAt(owner, actor, actor.x, actor.z, true);
  if (!support || Math.abs(finite(actor.elevation) - support.height) > .25) return null;
  const base = support.surface === 'room' ? offsetY(owner) : mineWalkerLadderHeight(owner.bodyDrop) - LAYOUT.floorY;
  return { ...mineWalkerLocal(owner, actor.x, actor.z), heightOffset: finite(actor.elevation) - base, surface: support.surface };
}
export function carryMineWalkerPassenger(owner, actor, passenger) {
  if (!passenger) return false;
  const point = mineWalkerPoint(owner, passenger);
  actor.x = point.x; actor.z = point.z;
  if (passenger.surface === 'ladder') {
    actor.elevation = mineWalkerLadderHeight(owner.bodyDrop) * passenger.fraction;
    if (actor.mineWalkerClimb?.ownerId === owner.id) actor.mineWalkerClimb.fraction = passenger.fraction;
  } else {
    const base = passenger.surface === 'landing' ? mineWalkerLadderHeight(owner.bodyDrop) - LAYOUT.floorY : offsetY(owner);
    actor.elevation = Math.max(0, base + passenger.heightOffset);
  }
  actor.groundHeight = actor.elevation;
  return true;
}

function ladderIntact(owner, from, to) {
  if (owner.hp <= 0 || !intact(owner, LAYOUT.ladder.id)) return false;
  const count = LAYOUT.ladder.sections.length;
  const first = Math.min(count - 1, Math.max(0, Math.floor(Math.min(from, to) * count)));
  const last = Math.min(count - 1, Math.max(0, Math.floor(Math.max(from, to) * count)));
  for (let index = first; index <= last; index++) if (!intact(owner, LAYOUT.ladder.sections[index].id)) return false;
  return true;
}

export function detachMineWalkerClimb(actor) {
  if (!actor.mineWalkerClimb) return false;
  delete actor.mineWalkerClimb; actor.groundActorId = null; actor.groundHeight = 0;
  return true;
}

/** Return true only when ladder climbing consumes normal movement and gravity. */
export function updateMineWalkerClimb(owner, actor, dt, input = {}) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Ladder climbing needs a nonnegative finite time step.');
  const attached = actor.mineWalkerClimb?.ownerId === owner.id;
  if (dt === 0) return attached;
  // Raw forward/back controls remain intuitive while the camera or carrier turns.
  // World-only callers can supply camera yaw, or retain the owner-relative fallback.
  const heading = Number.isFinite(input.angle) ? input.angle : owner.angle || 0;
  const sine = Math.sin(heading), cosine = Math.cos(heading);
  const lateral = Number.isFinite(input.strafe) ? input.strafe : cosine * finite(input.x) - sine * finite(input.z);
  const forward = Number.isFinite(input.climb) ? input.climb : sine * finite(input.x) + cosine * finite(input.z);
  if (input.jump || input.dash || finite(actor.dashTime) > 0 || finite(actor.jumpVelocity) > 0 || Math.abs(lateral) > .35) {
    if (attached) detachMineWalkerClimb(actor);
    return false;
  }
  const height = mineWalkerLadderHeight(owner.bodyDrop);
  if (!attached) {
    if (actor.mineWalkerClimb || owner.hp <= 0) return false;
    const local = mineWalkerLocal(owner, actor.x, actor.z);
    if (Math.abs(local.x) > 1 || Math.abs(local.z - LAYOUT.ladder.climbZ) > 1.1) return false;
    const fromBottom = forward > .15 && finite(actor.elevation) <= .25;
    const fromTop = forward < -.15 && actor.groundActorId === owner.id && Math.abs(finite(actor.elevation) - height) <= .25
      && intact(owner, LAYOUT.ladder.landing.id) && intact(owner, LAYOUT.floorId);
    if (!fromBottom && !fromTop) return false;
    const fraction = fromTop ? 1 : 0;
    if (!ladderIntact(owner, fraction, fraction)) return false;
    actor.mineWalkerClimb = { ownerId: owner.id, fraction };
  }
  const previous = actor.mineWalkerClimb.fraction, next = clamp(previous + clamp(forward, -1, 1) * LAYOUT.ladder.speed * dt / height, 0, 1);
  const fraction = next < 1e-9 ? 0 : next > 1 - 1e-9 ? 1 : next;
  if (!ladderIntact(owner, previous, fraction)) { detachMineWalkerClimb(actor); return false; }
  if (fraction === 1 && forward > 0) {
    if (!intact(owner, LAYOUT.ladder.landing.id) || !intact(owner, LAYOUT.floorId)) { detachMineWalkerClimb(actor); return false; }
    const exit = mineWalkerPoint(owner, { x: 0, z: LAYOUT.ladder.exitZ });
    actor.x = exit.x; actor.z = exit.z; actor.elevation = LAYOUT.floorY + offsetY(owner);
    delete actor.mineWalkerClimb; actor.groundHeight = actor.elevation; actor.groundActorId = owner.id; actor.jumpVelocity = 0;
    return true;
  }
  actor.mineWalkerClimb.fraction = fraction;
  carryMineWalkerPassenger(owner, actor, { x: 0, z: LAYOUT.ladder.climbZ, surface: 'ladder', fraction });
  actor.groundActorId = owner.id; actor.jumpVelocity = 0;
  if (fraction === 0 && forward < 0) { detachMineWalkerClimb(actor); actor.elevation = 0; }
  return true;
}
