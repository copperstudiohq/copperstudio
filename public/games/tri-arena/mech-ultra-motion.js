/** A rounded route keeps the entire root outside the rectangular island's corners. */
export const ULTRA_PATROL = Object.freeze({ radiusX: 70, radiusZ: 60, exponent: 4,
  speed: 2.4, acceleration: .9, turnRate: .22, roamSeconds: 5,
  stride: 6, stompSeconds: .28, anticipationSeconds: .4, heave: .24 });
export const ULTRA_ATTACK_ROUTE = Object.freeze({ radiusX: 46, radiusZ: 40 });

const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
const legIds = Object.freeze(Array.from({ length: 8 }, (_, index) => `ultra-leg-${index}`));

/** Aggregate sever counts and structural maps describe the same eight legs. */
export function getUltraPatrolMobility(owner) {
  const cutSupports = legIds.reduce((count, id) => count + (owner.structureState?.[id]?.remaining === 0 ? 1 : 0), 0);
  const lost = Math.max(cutSupports, clamp(Math.floor(finite(owner.legsLost)), 0, 8));
  return (8 - lost) / 8;
}

export function ultraPatrolRoutePoint(angle, route = 'outer') {
  const radii = route === 'attack' ? ULTRA_ATTACK_ROUTE : ULTRA_PATROL;
  const x = Math.cos(angle), z = Math.sin(angle), scale = Math.pow(x ** 4 + z ** 4, -.25);
  return { x: radii.radiusX * x * scale, z: radii.radiusZ * z * scale };
}

export function ultraPatrolRouteError(owner, route = 'outer') {
  const radii = route === 'attack' ? ULTRA_ATTACK_ROUTE : ULTRA_PATROL;
  const phase = Math.atan2(finite(owner.z) / radii.radiusZ, finite(owner.x) / radii.radiusX);
  const point = ultraPatrolRoutePoint(phase, route);
  return Math.abs(Math.hypot(finite(owner.x), finite(owner.z)) - Math.hypot(point.x, point.z));
}

/** Pure, deterministic patrol calculation; no game, render, or collision dependencies. */
export function getUltraPatrolStep(owner, dt, { route = 'outer' } = {}) {
  if (!owner?.ultra) throw new TypeError('Ultra patrol requires an initialized owner.');
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Ultra patrol time must be finite and nonnegative.');
  const startX = finite(owner.x), startZ = finite(owner.z);
  const radii = route === 'attack' ? ULTRA_ATTACK_ROUTE : ULTRA_PATROL, state = owner.ultra;
  const mobility = getUltraPatrolMobility(owner), topSpeed = ULTRA_PATROL.speed * mobility;
  const startDistance = finite(state.walkDistance), halfStride = ULTRA_PATROL.stride / 2;
  let x = startX, z = startZ, angle = finite(owner.angle), speed = Math.min(topSpeed, finite(state.walkSpeed)), distance = 0;
  let pauseRemaining = finite(state.walkPauseRemaining, ULTRA_PATROL.anticipationSeconds);
  let pauseTotal = finite(state.walkPauseTotal, ULTRA_PATROL.anticipationSeconds);
  let nextStomp = finite(state.walkNextStomp, (Math.floor(startDistance / halfStride) + 1) * halfStride);
  // Integrate the inward/outward approach and orbit together, so the cinematic
  // origin and arbitrary War placements join the route without a teleport.
  for (let remaining = dt; remaining > 1e-10;) {
    const step = Math.min(.05, remaining); remaining -= step;
    if (mobility === 0) break;
    if (pauseRemaining > 1e-9) {
      pauseRemaining = Math.max(0, pauseRemaining - step); speed = Math.max(0, speed - 3 * step); continue;
    }
    speed = Math.min(topSpeed, speed + ULTRA_PATROL.acceleration * mobility * step);
    const phase = Math.hypot(x, z) > .001 ? Math.atan2(z / radii.radiusZ, x / radii.radiusX) : -Math.PI / 2;
    const ring = ultraPatrolRoutePoint(phase, route), radius = Math.hypot(x, z) / Math.hypot(ring.x, ring.z);
    const radial = Math.sin(clamp((1 - radius) / .18, -1, 1) * Math.PI / 2), orbit = Math.sqrt(Math.max(0, 1 - radial * radial));
    const next = ultraPatrolRoutePoint(phase + .0001, route), tangentLength = Math.hypot(next.x - ring.x, next.z - ring.z) / .0001;
    const nextPhase = phase + orbit * speed * step / Math.max(1, radius * tangentLength);
    const nextRadius = radius + radial * speed * step / Math.hypot(ring.x, ring.z), point = ultraPatrolRoutePoint(nextPhase, route);
    const targetX = point.x * nextRadius, targetZ = point.z * nextRadius;
    const dx = targetX - x, dz = targetZ - z, travel = Math.hypot(dx, dz);
    const scale = Math.min(1, speed * step / Math.max(1e-12, travel), (nextStomp - startDistance - distance) / Math.max(1e-12, travel));
    x += dx * scale; z += dz * scale; distance += travel * scale;
    if (startDistance + distance >= nextStomp - 1e-8) {
      nextStomp += halfStride; pauseRemaining = ULTRA_PATROL.stompSeconds; pauseTotal = pauseRemaining;
    }
    const facing = Math.atan2(-x, -z);
    angle += clamp(angleDelta(angle, facing), -ULTRA_PATROL.turnRate * mobility * step, ULTRA_PATROL.turnRate * mobility * step);
  }
  const velocityX = dt > 0 ? (x - startX) / dt : 0, velocityZ = dt > 0 ? (z - startZ) / dt : 0;
  const stepPhase = ((startDistance + distance) / ULTRA_PATROL.stride) % 1, stomping = pauseRemaining > 1e-9;
  const heave = mobility === 0 ? 0 : stomping ? -.08 * Math.sin(Math.PI * (1 - pauseRemaining / pauseTotal)) ** 2
    : ULTRA_PATROL.heave * Math.sin(Math.PI * (startDistance + distance) / halfStride) ** 2;
  const targetElevation = finite(state.walkGroundElevation) + heave;
  const elevation = finite(owner.elevation) + clamp(targetElevation - finite(owner.elevation), -.65 * dt, .65 * dt);
  return { x, z, angle, elevation,
    distance, speed, velocityX, velocityZ, stepPhase, stomping, pauseRemaining, pauseTotal, nextStomp,
    localVelocityX: Math.cos(angle) * velocityX - Math.sin(angle) * velocityZ,
    localVelocityZ: Math.sin(angle) * velocityX + Math.cos(angle) * velocityZ };
}

export function stopUltraPatrol(owner) {
  Object.assign(owner.ultra, { moving: false, walkSpeed: 0, walkVelocityX: 0, walkVelocityZ: 0,
    walkLocalVelocityX: 0, walkLocalVelocityZ: 0, stomping: false,
    walkPauseRemaining: ULTRA_PATROL.anticipationSeconds, walkPauseTotal: ULTRA_PATROL.anticipationSeconds });
}

/** Settle the actual collision root before locking any warning or drill pose. */
export function settleUltraPatrol(owner, dt) {
  stopUltraPatrol(owner);
  const ground = finite(owner.ultra.walkGroundElevation), delta = ground - finite(owner.elevation);
  owner.elevation = Math.abs(delta) <= .55 * dt ? ground : finite(owner.elevation) + Math.sign(delta) * .55 * dt;
  return Math.abs(owner.elevation - ground) < 1e-8;
}

/** Apply the shared patrol calculation to a battle actor or an arena preview. */
export function advanceUltraPatrol(owner, dt, options) {
  const step = getUltraPatrolStep(owner, dt, options);
  Object.assign(owner, { x: step.x, z: step.z, angle: step.angle, elevation: step.elevation });
  Object.assign(owner.ultra, { walkDistance: finite(owner.ultra.walkDistance) + step.distance,
    moving: step.distance > 1e-8, walkSpeed: step.speed,
    walkVelocityX: step.velocityX, walkVelocityZ: step.velocityZ,
    walkLocalVelocityX: step.localVelocityX, walkLocalVelocityZ: step.localVelocityZ,
    stepPhase: step.stepPhase, stomping: step.stomping, walkPauseRemaining: step.pauseRemaining,
    walkPauseTotal: step.pauseTotal, walkNextStomp: step.nextStomp });
  return step.distance;
}
