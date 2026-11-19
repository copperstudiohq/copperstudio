import * as THREE from './assets/three.module.js';

const AXES = ['x', 'y', 'z'];
const durablePartCache = new WeakMap();

/** Rest bounds include broken pixels, so cached bounds always remain conservative. */
function durableParts(body) {
  const cached = durablePartCache.get(body);
  if (cached?.source === body.durableCells) return cached.parts;
  const groups = new Map();
  for (const cell of body.durableCells) {
    const part = cell.partRef;
    if (!groups.has(part)) groups.set(part, { part, cells: [], bounds: new THREE.Box3() });
    const group = groups.get(part);
    group.cells.push(cell); group.bounds.expandByPoint(cell.position);
  }
  const parts = [...groups.values()].map(group => ({ part: group.part, cells: group.cells,
    center: group.bounds.getCenter(new THREE.Vector3()), halfExtent: group.bounds.getSize(new THREE.Vector3()).multiplyScalar(.5) }));
  durablePartCache.set(body, { source: body.durableCells, parts });
  return parts;
}

/** Intersect a finite segment with one voxel in its part's rest coordinates. */
function intersectVoxel(origin, direction, center, halfSize, limit) {
  let entry = 0, exit = limit, hitAxis = -1, hitSign = 0;
  for (let axis = 0; axis < 3; axis++) {
    const key = AXES[axis], delta = direction[key];
    const low = center[key] - halfSize[key], high = center[key] + halfSize[key];
    if (Math.abs(delta) < 1e-12) {
      if (origin[key] < low || origin[key] > high) return null;
      continue;
    }
    const a = (low - origin[key]) / delta, b = (high - origin[key]) / delta;
    const near = Math.min(a, b);
    if (near >= entry) { entry = near; hitAxis = axis; hitSign = delta > 0 ? -1 : 1; }
    exit = Math.min(exit, Math.max(a, b));
    if (entry > exit) return null;
  }
  if (hitAxis < 0) {
    // Starting inside is already contact. Use the nearest outward face, including
    // stationary segments, instead of inventing a zero or non-finite normal.
    let nearest = Infinity;
    for (let axis = 0; axis < 3; axis++) {
      const key = AXES[axis], offset = origin[key] - center[key];
      const distance = halfSize[key] - Math.abs(offset);
      if (distance < nearest) { nearest = distance; hitAxis = axis; hitSign = offset < 0 ? -1 : 1; }
    }
  }
  return { fraction: Math.max(0, entry), axis: hitAxis, sign: hitSign };
}

/**
 * Closest contact between a world-space blade segment and active durable pixels.
 * Radius expands each local slab by the world-space radius projected onto that
 * slab's normal; this also supports nonuniform root and animated part scales.
 * Nonzero radius uses conservative expanded-box coverage at voxel corners.
 *
 * @param {import('./voxel-body.js').VoxelBody[]} bodies
 * @param {THREE.Vector3} origin
 * @param {THREE.Vector3} target
 * @param {{radius?: number}} options
 */
export function findShieldContact(bodies, origin, target, { radius = 0 } = {}) {
  if (!Array.isArray(bodies)) throw new TypeError('Shield contact bodies must be an array.');
  if (![origin, target].every(point => point?.isVector3 && AXES.every(axis => Number.isFinite(point[axis])))) {
    throw new TypeError('Shield contact requires finite Vector3 endpoints.');
  }
  if (!Number.isFinite(radius) || radius < 0) throw new RangeError('Shield contact radius must be nonnegative and finite.');
  const length = origin.distanceTo(target);
  let closest = null;
  for (const body of bodies) {
    if (!body?.durableCells?.length) continue;
    body.updateParts();
    for (const group of durableParts(body)) {
      const world = new THREE.Matrix4().multiplyMatrices(body.model.matrixWorld, group.part.delta);
      const determinant = world.determinant();
      if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-15) continue;
      const inverse = world.clone().invert(), e = inverse.elements;
      const localOrigin = origin.clone().applyMatrix4(inverse);
      const direction = target.clone().applyMatrix4(inverse).sub(localOrigin);
      const halfSize = new THREE.Vector3(
        body.size * .5 + radius * Math.hypot(e[0], e[4], e[8]),
        body.size * .5 + radius * Math.hypot(e[1], e[5], e[9]),
        body.size * .5 + radius * Math.hypot(e[2], e[6], e[10]));
      if (!intersectVoxel(localOrigin, direction, group.center, group.halfExtent.clone().add(halfSize), closest?.fraction ?? 1)) continue;
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(world);
      for (const cell of group.cells) {
        if (!cell.active || cell.cutHits <= 1) continue;
        const hit = intersectVoxel(localOrigin, direction, cell.position, halfSize, closest?.fraction ?? 1);
        if (!hit || (closest && hit.fraction >= closest.fraction)) continue;
        const normal = new THREE.Vector3().setComponent(hit.axis, hit.sign).applyMatrix3(normalMatrix).normalize();
        closest = { body, cell, point: origin.clone().lerp(target, hit.fraction), normal,
          distance: length * hit.fraction, fraction: hit.fraction };
        if (hit.fraction === 0) return closest;
      }
    }
  }
  return closest;
}
