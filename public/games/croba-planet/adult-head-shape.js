import { ADULT_SQUID_HEAD_Y_SCALE } from './adult-squid-anatomy.js';

/** The adult mantle is an oval cut by two planar cheeks. Width stays 2R.
 * A value of one preserves the original oval, including archived animals. */
export const ADULT_HEAD_SIDE_RATIO = .92;
export const headSideRatio = squid => squid?.headSideRatio ?? 1;

export function flattenHeadGeometry(geometry, ratio) {
  const points = geometry.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i), radius = Math.hypot(x, points.getY(i), points.getZ(i));
    points.setX(i, Math.max(-radius, Math.min(radius, x / ratio)));
  }
  points.needsUpdate = true;
  geometry.computeVertexNormals(); geometry.computeBoundingSphere(); geometry.computeBoundingBox();
  return geometry;
}

/** Projection onto an ellipse/ellipsoid for exterior points; radial boundary
 * for interior points. The scalar solve is bounded and allocation-light. */
function ellipsoid(point, axes) {
  const squared = axes.map(a => a * a);
  const gauge = Math.hypot(...point.map((p, i) => p / axes[i]));
  if (gauge <= 1) return gauge > 1e-12 ? point.map(p => p / gauge) : axes.map((a, i) => i ? 0 : a);
  let low = 0, high = Math.max(...axes) * Math.hypot(...point), lambda = high / 2;
  for (let i = 0; i < 24; i++) {
    let value = -1, slope = 0;
    for (let j = 0; j < point.length; j++) {
      const d = squared[j] + lambda, term = squared[j] * point[j] ** 2;
      value += term / d ** 2; slope -= 2 * term / d ** 3;
    }
    if (Math.abs(value) < 1e-12) break;
    if (value > 0) low = lambda; else high = lambda;
    const next = lambda - value / slope;
    lambda = next > low && next < high ? next : (low + high) / 2;
  }
  return point.map((p, i) => squared[i] * p / (squared[i] + lambda));
}

/** Closest exterior surface of the capped oval, in head-local coordinates.
 * Plane, curved shell and rim contacts share the exact visual side profile. */
export function closestFlatHeadLocal(point, radius, ratio, height = ADULT_SQUID_HEAD_Y_SCALE) {
  const p = [point.x / radius, point.y / radius, point.z / radius];
  const axes = [1 / ratio, height, 1];
  const inside = Math.abs(p[0]) <= 1 && Math.hypot(...p.map((v, i) => v / axes[i])) <= 1;
  const curve = ellipsoid(p, axes), candidates = [];
  if (Math.abs(curve[0]) <= 1 + 1e-10) candidates.push({ point: curve,
    normal: curve.map((v, i) => v / axes[i] ** 2) });
  const rim = Math.sqrt(1 - ratio ** 2), diskAxes = [axes[1] * rim, rim];
  const inDisk = Math.hypot(p[1] / diskAxes[0], p[2] / diskAxes[1]) <= 1;
  const yz = inDisk ? p.slice(1) : ellipsoid(p.slice(1), diskAxes);
  for (const side of [-1, 1]) candidates.push({ point: [side, ...yz], normal: [side, 0, 0] });
  let best, distance = Infinity;
  for (const candidate of candidates) {
    const d = Math.hypot(...p.map((v, i) => v - candidate.point[i]));
    if (d < distance) { best = candidate; distance = d; }
  }
  // At the rim, an exterior contact normal lies between shell and cheek.
  const n = !inside && distance > 1e-10 ? p.map((v, i) => (v - best.point[i]) / distance) : best.normal;
  const length = Math.hypot(...n) || 1;
  return { x: best.point[0] * radius, y: best.point[1] * radius, z: best.point[2] * radius,
    nx: n[0] / length, ny: n[1] / length, nz: n[2] / length,
    distance: distance * radius * (inside ? -1 : 1) };
}
