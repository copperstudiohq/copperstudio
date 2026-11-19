import { EYE_HEIGHT, getIceDepth, getIceScale, getPlatformVertices, pointInPolygon } from "./terrain.js";
import { getSeabedHeight, SEABED_GRID } from "./seabed.js";

const TAU = Math.PI * 2;
const FLOOR_CLEARANCE = EYE_HEIGHT + 5;

/** A downward cone in simulation units. z is its wide attachment/base plane;
 * the sharp tip is at z-length. x/y are absolute world coordinates.
 * @typedef {{id:string,x:number,y:number,z:number,radius:number,length:number,seed:number}} IceSpike
 */

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hash(text) {
  let value = 2166136261;
  for (const character of text) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}

function edgeDistance(x, y, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - a.x - dx * t, y - a.y - dy * t);
}

/** Grid triangles are affine, so their vertex maximum conservatively clears
 * all ground beneath the cone's bounding square, including steep cliff lips. */
function highestGround(x, y, radius) {
  const { minX, minY, step } = SEABED_GRID;
  const left = Math.floor((x - radius - minX) / step);
  const right = Math.ceil((x + radius - minX) / step);
  const top = Math.floor((y - radius - minY) / step);
  const bottom = Math.ceil((y + radius - minY) / step);
  let height = getSeabedHeight(x, y);
  for (let column = left; column <= right; column++) {
    for (let row = top; row <= bottom; row++)
      height = Math.max(height, getSeabedHeight(minX + column * step, minY + row * step));
  }
  return height;
}

function inReservedCrashRoute(x, y, radius) {
  if (Math.hypot(x, y) < radius + 32) return true;
  return [
    [{ x: 0, y: 0 }, { x: 180, y: 0 }, 22],
    [{ x: 0, y: 0 }, { x: 300, y: 100 }, 18],
  ].some(([a, b, clearance]) => edgeDistance(x, y, a, b) < radius + clearance);
}

/** Seeded physical spikes attached to the actual tapered ice base. Surface
 * islands receive 8–20 cones where floor clearance allows. A low submerged
 * chunk may receive fewer or none rather than closing the swimming passage.
 * @param {import('./terrain.js').Platform & {z?:number}} floe @returns {IceSpike[]}
 */
export function getIceSpikes(floe) {
  if (!floe || typeof floe.id !== "string" || ![floe.x, floe.y, floe.rx, floe.ry].every(Number.isFinite)
    || floe.rx <= 0 || floe.ry <= 0 || (floe.z !== undefined && !Number.isFinite(floe.z)))
    throw new TypeError("Ice spikes need a named ice volume with finite coordinates and positive radii.");
  const depth = getIceDepth(floe);
  const scale = getIceScale(floe, -depth);
  const vertices = getPlatformVertices(floe).map((p) => ({
    x: floe.x + (p.x - floe.x) * scale,
    y: floe.y + (p.y - floe.y) * scale,
  }));
  const z = (floe.z ?? 0) - depth;
  const rng = random(hash(floe.id) ^ (floe.seed >>> 0));
  const target = Math.min(20, Math.max(8, Math.round(Math.sqrt(floe.rx * floe.ry) * 0.075)));
  const maxRadius = Math.min(20, Math.max(4, Math.min(floe.rx, floe.ry) * scale * 0.12));
  /** @type {IceSpike[]} */
  const spikes = [];
  for (let attempt = 0; attempt < 3000 && spikes.length < target; attempt++) {
    const index = Math.floor(rng() * vertices.length);
    const a = vertices[index], b = vertices[(index + 1) % vertices.length];
    const along = rng(), fraction = 0.55 + rng() * 0.30;
    const x = floe.x + (a.x + (b.x - a.x) * along - floe.x) * fraction;
    const y = floe.y + (a.y + (b.y - a.y) * along - floe.y) * fraction;
    if (!pointInPolygon(vertices, x, y)) continue;
    const edge = Math.min(...vertices.map((p, i) => edgeDistance(x, y, p, vertices[(i + 1) % vertices.length])));
    let radius = Math.min(3 + rng() * Math.max(1, maxRadius - 3), edge - 0.5);
    if (radius < 2.5) continue;
    const available = z - highestGround(x, y, radius) - FLOOR_CLEARANCE;
    if (available < 10) continue;
    const length = Math.min(available, radius * (4 + rng() * 3) + 10);
    radius = Math.min(radius, length * 0.28);
    if (radius < 2.5 || (floe.id === "floe-0" && inReservedCrashRoute(x, y, radius))) continue;
    if (spikes.some((spike) => Math.hypot(x - spike.x, y - spike.y) < radius + spike.radius + 2)) continue;
    spikes.push({ id: `${floe.id}-underside-spike-${spikes.length}`, x, y, z,
      radius, length, seed: Math.floor(rng() * 0x100000000) });
  }
  return spikes;
}

/** Cone radius at an absolute vertical world height; zero beyond the cone.
 * @param {IceSpike} spike @param {number} z @returns {number}
 */
export function getIceSpikeRadiusAt(spike, z) {
  if (z < spike.z - spike.length || z > spike.z) return 0;
  return spike.radius * (z - (spike.z - spike.length)) / spike.length;
}

/** Collision of a vertical swimmer cylinder with downward cones. The widest
 * overlapping section determines lateral clearance. nx/ny are a horizontal
 * unit escape direction; normal is the actual sloped cone normal. escape is
 * an absolute safe x/y at unchanged feet z, suitable for iterative resolution.
 * @param {IceSpike[]} spikes @param {number} x @param {number} y @param {number} z
 * @param {number} [bodyHeight] @param {number} [radius]
 * @returns {{spike:IceSpike,nx:number,ny:number,nz:number,normal:{x:number,y:number,z:number},penetration:number,sectionZ:number,escape:{x:number,y:number}}|null}
 */
export function getIceSpikeCollision(spikes, x, y, z, bodyHeight = EYE_HEIGHT, radius = 5) {
  if (![x, y, z, bodyHeight, radius].every(Number.isFinite) || bodyHeight < 0 || radius < 0)
    throw new TypeError("Ice spike collision needs finite coordinates and non-negative body dimensions.");
  let nearest = null;
  for (const spike of spikes) {
    if (z > spike.z || z + bodyHeight < spike.z - spike.length) continue;
    const sectionZ = Math.min(spike.z, z + bodyHeight);
    const sectionRadius = getIceSpikeRadiusAt(spike, sectionZ);
    const dx = x - spike.x, dy = y - spike.y;
    const distance = Math.hypot(dx, dy), clearance = sectionRadius + radius;
    if (distance > clearance) continue;
    const nx = distance > 1e-8 ? dx / distance : Math.cos((spike.seed ?? 0) % TAU);
    const ny = distance > 1e-8 ? dy / distance : Math.sin((spike.seed ?? 0) % TAU);
    const slope = spike.radius / spike.length, normalLength = Math.hypot(1, slope);
    const penetration = clearance - distance;
    if (nearest && nearest.penetration >= penetration) continue;
    nearest = { spike, nx, ny, nz: -slope / normalLength,
      normal: { x: nx / normalLength, y: ny / normalLength, z: -slope / normalLength },
      penetration, sectionZ,
      escape: { x: spike.x + nx * (clearance + 0.01), y: spike.y + ny * (clearance + 0.01) } };
  }
  return nearest;
}
