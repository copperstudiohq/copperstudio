import { JELLYFISH_SPIRES, JELLYFISH_SPIRES_SPIRES } from './jellyfish-spires-data.js';
import { getJellyfishSpiresCollision } from './jellyfish-spires.js';

const orbitBounds = new WeakMap();
const intersects = (a, b) => a.minX <= b.maxX && a.maxX >= b.minX
  && a.minY <= b.maxY && a.maxY >= b.minY && a.minZ <= b.maxZ && a.maxZ >= b.minZ;

/** Prepared orbits normally clear every rock bounding box. Cache that cheap
 * proof once per animal; only an exceptional overlap needs triangle queries.
 * No tentacle-chain collision work is added to ordinary simulation frames.
 */
export function preparedLanternDriftClearsSpires(fish, x, y, z) {
  if (!fish || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return false;
  let cached = orbitBounds.get(fish);
  if (!cached || cached.key[0] !== fish.homeX || cached.key[1] !== fish.homeY || cached.key[2] !== fish.homeZ
    || cached.key[3] !== fish.headRadius || cached.key[4] !== fish.tentacleLength) {
    const key = [fish.homeX, fish.homeY, fish.homeZ, fish.headRadius, fish.tentacleLength];
    if (!key.every(Number.isFinite) || fish.headRadius <= 0 || fish.tentacleLength <= 0) return false;
    const radial = fish.headRadius * 1.1 + 3;
    const bounds = { minX: fish.homeX - 60 - radial, maxX: fish.homeX + 60 + radial,
      minY: fish.homeY - 50 - radial, maxY: fish.homeY + 50 + radial,
      minZ: fish.homeZ - 16 - fish.tentacleLength - fish.headRadius * .2 - 3,
      maxZ: fish.homeZ + 16 + fish.headRadius + 3 };
    cached = { key, nearby: JELLYFISH_SPIRES_SPIRES.filter(spire => intersects(bounds, spire.bounds)) };
    orbitBounds.set(fish, cached);
  }
  if (Math.abs(x - fish.homeX) > 60 || Math.abs(y - fish.homeY) > 50 || Math.abs(z - fish.homeZ) > 16)
    return lanternClearsJellyfishSpires(fish, x, y, z);
  const region = JELLYFISH_SPIRES, reach = fish.headRadius * 1.1;
  if (x - reach < region.minX || x + reach > region.maxX || y - reach < region.minY || y + reach > region.maxY) return false;
  if (!cached.nearby.length) return true;
  const radial = fish.headRadius * 1.1 + 3;
  const bounds = { minX: x - radial, maxX: x + radial, minY: y - radial, maxY: y + radial,
    minZ: z - fish.tentacleLength - fish.headRadius * .2 - 3, maxZ: z + fish.headRadius + 3 };
  return !cached.nearby.some(spire => intersects(bounds, spire.bounds)) || lanternClearsJellyfishSpires(fish, x, y, z);
}

/** Conservative bell-and-trailing-arm envelope. Each sphere contains its
 * complete section of the vertical cylinder, including the moving arm tips.
 * This uses the same rock triangles as player collision and barnacle support.
 * @param {{headRadius:number,tentacleLength:number}} fish
 * @param {number} x @param {number} y @param {number} z Simulation coordinates.
 * @param {number} [margin] Additional rock clearance, in simulation units.
 */
export function lanternClearsJellyfishSpires(fish, x, y, z, margin = 3) {
  if (![x, y, z, fish?.headRadius, fish?.tentacleLength, margin].every(Number.isFinite)
    || fish.headRadius <= 0 || fish.tentacleLength <= 0 || margin < 0) return false;
  const radial = fish.headRadius * 1.1;
  const region = JELLYFISH_SPIRES;
  if (x - radial < region.minX || x + radial > region.maxX
    || y - radial < region.minY || y + radial > region.maxY) return false;
  const low = z - fish.tentacleLength - fish.headRadius * .2;
  const high = z + fish.headRadius;
  const sections = Math.max(1, Math.ceil((high - low) / 50));
  const span = (high - low) / sections;
  const radius = Math.hypot(radial, span / 2) + margin;
  const point = { x, y, z: low + span / 2 };
  for (let section = 0; section < sections; section++) {
    point.z = low + (section + .5) * span;
    if (getJellyfishSpiresCollision(point, radius)) return false;
  }
  return true;
}
