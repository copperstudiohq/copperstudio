import { ultraPoint } from './mech-ultra-layout.js';
import { ULTRA_COVER_BOXES, ULTRA_TUNNEL_WALLS, ULTRA_RIM_TUNNELS } from './mech-ultra-cover.js';

export const ULTRA_ROOF_MISSILE_KIND = 'ultra-roof-missile';
export const ULTRA_ROOF_MISSILES = Object.freeze({ warningSeconds: 1.5, staggerSeconds: .32,
  cooldownSeconds: 13, gravity: 8, impactRadius: 3, damage: 18, projectileCap: 64 });
export const ULTRA_ROOF_MOUNTS = Object.freeze([
  [-6.6, -4.2], [6.6, -4.2], [-6.6, 4.2], [6.6, 4.2],
].map(([x, z], index) => Object.freeze({ id: `ultra-roof-launcher-${index}`, index, x, y: 42, z, muzzleY: 46.6 })));
const covers = [...ULTRA_COVER_BOXES, ...ULTRA_TUNNEL_WALLS,
  ...ULTRA_RIM_TUNNELS.map(tunnel => ({ x: tunnel.spawn.x, z: tunnel.spawn.z,
    width: tunnel.direction.x ? tunnel.depth : tunnel.width + 1.2,
    depth: tunnel.direction.x ? tunnel.width + 1.2 : tunnel.depth,
    minY: tunnel.height, maxY: tunnel.height + .6 }))];
const finitePoint = point => point && ['x', 'y', 'z'].every(axis => Number.isFinite(point[axis]));

/** The launch port remains above the salvaged roof, including its tallest plates. */
export function ultraRoofMuzzle(owner, index) {
  const mount = ULTRA_ROOF_MOUNTS[index];
  if (!mount) throw new RangeError('Ultra roof launcher index must be from 0 to 3.');
  return ultraPoint(owner, { x: mount.x, y: mount.muzzleY, z: mount.z });
}

/** A fixed target and visible flight arc give a running fighter time to get clear. */
export function planUltraRoofFlight(origin, target) {
  if (!finitePoint(origin) || !finitePoint(target)) throw new TypeError('Roof missiles require finite world points.');
  const flightTime = Math.min(5.6, 4.8 + Math.hypot(target.x - origin.x, target.z - origin.z) / 120 * .7);
  const gravity = ULTRA_ROOF_MISSILES.gravity;
  const launchVy = (target.y - origin.y + .5 * gravity * flightTime ** 2) / flightTime;
  return { startX: origin.x, startY: origin.y, startZ: origin.z, targetX: target.x, targetY: target.y, targetZ: target.z,
    vx: (target.x - origin.x) / flightTime, vz: (target.z - origin.z) / flightTime,
    vy: launchVy, launchVy, gravity, flightTime };
}

export function ultraRoofFlightPoint(flight, seconds) {
  if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(flight?.flightTime)) {
    throw new RangeError('Roof missile flight time must be finite and nonnegative.');
  }
  const t = Math.min(seconds, flight.flightTime);
  return { x: flight.startX + flight.vx * t, y: flight.startY + (flight.launchVy ?? flight.vy) * t - .5 * flight.gravity * t ** 2,
    z: flight.startZ + flight.vz * t };
}

/** Return the first solid cover face, rather than exploding behind the wall. */
export function ultraRoofCoverImpact(from, to) {
  if (!finitePoint(from) || !finitePoint(to)) throw new TypeError('Missile cover tests require finite world points.');
  let first = null;
  for (const box of covers) {
    let near = 0, far = 1;
    for (const [axis, low, high] of [['x', box.x - box.width / 2, box.x + box.width / 2],
      ['y', box.minY ?? 0, box.maxY ?? box.height], ['z', box.z - box.depth / 2, box.z + box.depth / 2]]) {
      const delta = to[axis] - from[axis];
      if (Math.abs(delta) < 1e-10) { if (from[axis] < low || from[axis] > high) { near = 2; break; } continue; }
      const a = (low - from[axis]) / delta, b = (high - from[axis]) / delta;
      near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b));
      if (near > far) break;
    }
    if (near > far || near > 1 || far < 0 || first && near >= first.t) continue;
    // A tiny offset keeps blast sightlines on the incoming side of the rock.
    const t = Math.max(0, near - .002);
    first = { t: near, x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t,
      z: from.z + (to.z - from.z) * t, cover: true };
  }
  return first;
}
