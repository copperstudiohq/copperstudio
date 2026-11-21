import { findIsopodSurfaceContact } from './isopod-surface.js';
import { getSeabedHeight } from './seabed.js';
import { wreckBodyPenetration } from './wreck-collision.js';
import {getLifecycleScale} from './lifecycle-scale.js';

export const RED_FISH_TENDRIL_SEGMENTS = 6;
export const RED_FISH_TENDRIL_ROOTS = Object.freeze([
  [-.01261, -.28755, .0957], [.01261, -.3259, .0957],
  [-.01261, .28755, .0957], [.01261, .3259, .0957],
].map(Object.freeze));

const SCALE = 25, STEP = 1 / 120, LINK = .4 / RED_FISH_TENDRIL_SEGMENTS;
const STATES = new WeakMap(), EPS = 1e-10;
const finite = p => p && [p.x, p.y, p.z].every(Number.isFinite);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const point = () => ({ x: 0, y: 0, z: 0 });

// A fixed delicate rest curve. Every link has the same physical length; time
// never enters the rest shape, so a stopped fish actually sheds its energy.
const REST = RED_FISH_TENDRIL_ROOTS.map((root, chain) => {
  const nodes = [root.slice()], side = chain < 2 ? -1 : 1, pair = chain % 2;
  for (let i = 1; i <= RED_FISH_TENDRIL_SEGMENTS; i++) {
    const u = i / RED_FISH_TENDRIL_SEGMENTS, v = (i - 1) / RED_FISH_TENDRIL_SEGMENTS;
    const dx = .010 * (Math.sin(u * Math.PI * 3 + pair) * u - Math.sin(v * Math.PI * 3 + pair) * v);
    const dy = side * .014 * (Math.sin(u * Math.PI * 5 + pair * .7) * u - Math.sin(v * Math.PI * 5 + pair * .7) * v);
    const dz = .4 * (u - v), ratio = LINK / Math.hypot(dx, dy, dz), previous = nodes.at(-1);
    nodes.push([previous[0] + dx * ratio, previous[1] + dy * ratio, previous[2] + dz * ratio]);
  }
  return nodes;
});

/** Radius of the tapered render tube, in simulation units. */
export function redFishTendrilRadius(fish, index) {
  return (.011 * (1 - index / RED_FISH_TENDRIL_SEGMENTS) ** .7 + .0018) * SCALE * fish.lengthMeters*getLifecycleScale(fish);
}

/** Write one rest node in SIM axes (Z up), matching the renderer's YXZ frame:
 * local front=-Z, yaw=-heading-PI/2, positive pitch raises the nose.
 * @param {object} fish @param {number} chain @param {number} index
 * @param {{x:number,y:number,z:number}} [target]
 */
export function redFishTendrilRestPoint(fish, chain, index, target = point()) {
  if (!Number.isInteger(chain) || chain < 0 || chain >= REST.length
    || !Number.isInteger(index) || index < 0 || index > RED_FISH_TENDRIL_SEGMENTS)
    throw new RangeError('Red Fish tendril nodes need a chain from 0–3 and a joint from 0–6.');
  const [x, y, z] = REST[chain][index], pitch = fish.pitch ?? 0;
  const cp = Math.cos(pitch), sp = Math.sin(pitch), ch = Math.cos(fish.heading), sh = Math.sin(fish.heading);
  const back = sp * y + cp * z, up = cp * y - sp * z, scale = SCALE * fish.lengthMeters*getLifecycleScale(fish);
  target.x = fish.x + (-sh * x - ch * back) * scale;
  target.y = fish.y + (ch * x - sh * back) * scale;
  target.z = fish.z + up * scale;
  return target;
}

/** @typedef {{x:number,y:number,z:number,px:number,py:number,pz:number}} TendrilNode */
function reset(fish, state) {
  if (!Array.isArray(fish.tendrilNodes) || fish.tendrilNodes.length !== 4) fish.tendrilNodes = [];
  for (let chain = 0; chain < 4; chain++) {
    let nodes = fish.tendrilNodes[chain];
    if (!Array.isArray(nodes) || nodes.length !== 7) fish.tendrilNodes[chain] = nodes = [];
    for (let i = 0; i <= RED_FISH_TENDRIL_SEGMENTS; i++) {
      let node = nodes[i];
      if (!node || typeof node !== 'object' || Array.isArray(node)) nodes[i] = node = {};
      redFishTendrilRestPoint(fish, chain, i, node);
      node.px = node.x; node.py = node.y; node.pz = node.z;
    }
  }
  state.step = STEP; state.scale = fish.lengthMeters*getLifecycleScale(fish); state.active = true;
  state.x = fish.x; state.y = fish.y; state.z = fish.z;
}

function invalidChain(fish, length) {
  if (!Array.isArray(fish.tendrilNodes) || fish.tendrilNodes.length !== 4) return true;
  for (const nodes of fish.tendrilNodes) {
    if (!Array.isArray(nodes) || nodes.length !== 7) return true;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!finite(node) || ![node.px, node.py, node.pz].every(Number.isFinite)
        || i && distance(node, nodes[i - 1]) > length * 2) return true;
    }
  }
  return false;
}

/** Clamp a unit direction to a spherical cap, preserving its unit length.
 * This is also the exact intersection of a rigid link sphere with a plane. */
function cap(direction, nx, ny, nz, minimum, fallback) {
  if (minimum <= -1) return;
  minimum = Math.min(1, minimum);
  const dot = direction.x * nx + direction.y * ny + direction.z * nz;
  if (dot >= minimum) return;
  let tx = direction.x - nx * dot, ty = direction.y - ny * dot, tz = direction.z - nz * dot;
  let size = Math.hypot(tx, ty, tz);
  if (size < EPS) {
    const projection = fallback.x * nx + fallback.y * ny + fallback.z * nz;
    tx = fallback.x - nx * projection; ty = fallback.y - ny * projection; tz = fallback.z - nz * projection;
    size = Math.hypot(tx, ty, tz);
  }
  if (size < EPS) {
    if (Math.abs(nz) < .8) { tx = ny; ty = -nx; tz = 0; }
    else { tx = nz; ty = 0; tz = -nx; }
    size = Math.hypot(tx, ty, tz);
  }
  const tangent = Math.sqrt(Math.max(0, 1 - minimum * minimum)) / size;
  direction.x = nx * minimum + tx * tangent;
  direction.y = ny * minimum + ty * tangent;
  direction.z = nz * minimum + tz * tangent;
}

function writeLink(parent, node, direction, length) {
  node.x = parent.x + direction.x * length;
  node.y = parent.y + direction.y * length;
  node.z = parent.z + direction.z * length;
}

function envelope(parent, direction, center, radius, length, fallback) {
  const dx = center.x - parent.x, dy = center.y - parent.y, dz = center.z - parent.z;
  const d = Math.hypot(dx, dy, dz);
  if (d < EPS) return;
  // |parent + length*direction - center| <= radius. Project the
  // direction, rather than shortening the node's distance from its parent.
  cap(direction, dx / d, dy / d, dz / d,
    (d * d + length * length - radius * radius) / (2 * d * length), fallback);
}

function contacts(world, parent, node, direction, radius, length, state) {
  const hit = findIsopodSurfaceContact(world, node, length + radius + .01);
  if (hit) {
    const n = hit.normal, p = hit.point;
    cap(direction, n.x, n.y, n.z,
      (radius + (p.x - parent.x) * n.x + (p.y - parent.y) * n.y + (p.z - parent.z) * n.z) / length, state.fallback);
    writeLink(parent, node, direction, length);
  } else {
    const floor = getSeabedHeight(node.x, node.y);
    if (node.z < floor + radius) {
      cap(direction, 0, 0, 1, (floor + radius - parent.z) / length, state.fallback);
      writeLink(parent, node, direction, length);
    }
  }
  if (!state.nearWreck) return;
  const body = state.body; body.radius = radius; body.height = radius * 2; body.bottom = -radius;
  const overlap = wreckBodyPenetration(world.ship, node, body);
  if (overlap <= EPS) return;
  const p = state.probe, probe = .1, gradient = state.gradient;
  Object.assign(p, node);
  for (const axis of ['x', 'y', 'z']) {
    p[axis] += probe; const positive = wreckBodyPenetration(world.ship, p, body);
    p[axis] -= probe * 2; const negative = wreckBodyPenetration(world.ship, p, body); p[axis] += probe;
    gradient[axis] = negative - positive;
  }
  const size = Math.hypot(gradient.x, gradient.y, gradient.z);
  if (size < EPS) return;
  const nx = gradient.x / size, ny = gradient.y / size, nz = gradient.z / size;
  cap(direction, nx, ny, nz, ((overlap * SCALE + .01)
    + (node.x - parent.x) * nx + (node.y - parent.y) * ny + (node.z - parent.z) * nz) / length, state.fallback);
  writeLink(parent, node, direction, length);
}

/** Inertial underwater tendrils; public nodes are transient, all solver scratch
 * stays private. No body pose, spawn or collision radius is changed. The rigid
 * links and their taper stay inside the existing conservative fish sphere.
 * Valid swimming spheres already clear solids, so steady swimming pays for one
 * proximity query per fish; only stressed/near-solid poses need contact passes.
 * @param {object} world @param {object & {tendrilNodes?:TendrilNode[][]}} fish @param {number} dt
 */
export function updateRedFishTendrils(world, fish, dt) {
  if (!Number.isFinite(dt) || dt <= 0 || world.paused) return;
  let state = STATES.get(fish);
  const poseValid = finite(fish) && Number.isFinite(fish.heading) && Number.isFinite(fish.pitch ?? 0)
    && Number.isFinite(fish.lengthMeters * SCALE) && fish.lengthMeters > 0;
  if (!poseValid || fish.lifecycleInactive || fish.squidHeldBy || fish.squidRespawnIn > 0
    || Array.isArray(world.redFish) && !world.redFish.includes(fish)&&!fish.lifecycleRenderOnly
    || finite(world.player) && distance(world.player, fish) > 2000 + .64 * SCALE * fish.lengthMeters) {
    if (state) state.active = false;
    return;
  }
  if (!state) {
    state = { rest: Array.from({ length: 4 }, () => Array.from({ length: 7 }, point)),
      starts: Array.from({ length: 4 }, point), center: point(), direction: point(), fallback: point(),
      probe: point(), gradient: point(), body: { radius: 0, height: 0, bottom: 0 }, scale: 0, active: false };
    STATES.set(fish, state);
  }
  const effectiveLength=fish.lengthMeters*getLifecycleScale(fish),scale = SCALE * effectiveLength, length = LINK * scale;
  const stale = Number.isFinite(world.elapsed) && Number.isFinite(state.elapsed) && world.elapsed - state.elapsed > .2;
  if (!state.active || Math.abs(state.scale-effectiveLength)>Math.max(.001,effectiveLength*.02) || stale || invalidChain(fish, length)
    || Math.hypot(fish.x - state.x, fish.y - state.y, fish.z - state.z) > .64 * scale * 2) reset(fish, state);
  const delta = Math.min(.05, dt), steps = Math.ceil(delta / STEP), h = delta / steps;
  const damping = Math.exp(-7 * h), acceleration = .025 * scale;
  const seed = Number.isFinite(fish.seed) ? fish.seed : 0;
  const current = world.waterCurrent, cx = finite(current) ? current.x : Math.sin(seed) * .012 * scale;
  const cy = finite(current) ? current.y : Math.cos(seed) * .008 * scale;
  const cz = finite(current) ? current.z : 0;
  for (let chain = 0; chain < 4; chain++) {
    Object.assign(state.starts[chain], fish.tendrilNodes[chain][0]);
    for (let i = 0; i <= RED_FISH_TENDRIL_SEGMENTS; i++) redFishTendrilRestPoint(fish, chain, i, state.rest[chain][i]);
  }
  state.nearWreck = world.ship?.designVersion === 2 && Math.hypot(fish.x - world.ship.x, fish.y - world.ship.y) < 400 + scale;
  const body = state.body; body.radius = .64 * scale; body.height = body.radius * 2; body.bottom = -body.radius;
  const wreckContact = state.nearWreck && wreckBodyPenetration(world.ship, fish, body) > EPS;
  const collision = Boolean(findIsopodSurfaceContact(world, fish, .64 * scale + .0128 * scale)) || wreckContact;
  for (let step = 1; step <= steps; step++) {
    const t = step / steps, center = state.center;
    center.x = state.x + (fish.x - state.x) * t;
    center.y = state.y + (fish.y - state.y) * t;
    center.z = state.z + (fish.z - state.z) * t;
    for (let chain = 0; chain < 4; chain++) {
      const nodes = fish.tendrilNodes[chain], root = nodes[0], start = state.starts[chain], target = state.rest[chain][0];
      root.x = start.x + (target.x - start.x) * t; root.y = start.y + (target.y - start.y) * t; root.z = start.z + (target.z - start.z) * t;
      root.px = root.x; root.py = root.y; root.pz = root.z;
      for (let i = 1; i <= RED_FISH_TENDRIL_SEGMENTS; i++) {
        const node = nodes[i], rest = state.rest[chain][i], x = node.x, y = node.y, z = node.z;
        const ratio = h / state.step * damping;
        let vx = (x - node.px) * ratio, vy = (y - node.py) * ratio, vz = (z - node.pz) * ratio;
        const speed = Math.hypot(vx, vy, vz), limit = length * .5;
        if (speed > limit) { const r = limit / speed; vx *= r; vy *= r; vz *= r; }
        node.x += vx + ((rest.x - x) * 30 + cx * 3) * h * h;
        node.y += vy + ((rest.y - y) * 30 + cy * 3) * h * h;
        node.z += vz + ((rest.z - z) * 30 + cz * 3 - acceleration) * h * h;
        node.px = x; node.py = y; node.pz = z;
      }
      for (let i = 1; i <= RED_FISH_TENDRIL_SEGMENTS; i++) {
        const parent = nodes[i - 1], node = nodes[i], direction = state.direction, fallback = state.fallback;
        const rest = state.rest[chain][i], previous = state.rest[chain][i - 1];
        fallback.x = rest.x - previous.x; fallback.y = rest.y - previous.y; fallback.z = rest.z - previous.z;
        let dx = node.x - parent.x, dy = node.y - parent.y, dz = node.z - parent.z, size = Math.hypot(dx, dy, dz);
        if (size < EPS) { dx = fallback.x; dy = fallback.y; dz = fallback.z; size = length; }
        direction.x = dx / size; direction.y = dy / size; direction.z = dz / size;
        const radius = redFishTendrilRadius(fish, i), passes = collision ? 6 : 1;
        for (let pass = 0; pass < passes; pass++) {
          envelope(parent, direction, center, .64 * scale - radius, length, fallback);
          writeLink(parent, node, direction, length);
          if (collision) contacts(world, parent, node, direction, radius, length, state);
        }
        envelope(parent, direction, center, .64 * scale - radius, length, fallback);
        writeLink(parent, node, direction, length);
      }
    }
    state.step = h;
  }
  state.active = true; state.scale = effectiveLength;
  state.x = fish.x; state.y = fish.y; state.z = fish.z; state.elapsed = world.elapsed;
}
