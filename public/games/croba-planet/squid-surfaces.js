import { BLUE_OCEAN_START_X, BLUE_OCEAN_FLOOR, WORLD_BOUNDS } from "./terrain.js";
import { getSeabedHeight, SEABED_GRID } from "./seabed.js";
import { getForestCollision } from "./forest-terrain.js";

/** @typedef {{x:number,y:number,z:number}} Point3 */
/** @typedef {{linkIndex:number,along:number,point:Point3,surfacePoint:Point3,normal:Point3,kind:'seabed'|'stone'|'forest',penetration?:number,correctedPoint?:Point3}} SurfaceContact */
const finite = (p) => Boolean(p && [p.x, p.y, p.z].every(Number.isFinite));
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a, b, scale) => ({ x: a.x + b.x * scale, y: a.y + b.y * scale, z: a.z + b.z * scale });
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

/** Closest point on a finite terrain triangle, including its edges and vertices. */
function closestTriangle(p, a, b, c) {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a);
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(a, ab, d1 / (d1 - d3));
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(a, ac, d2 / (d2 - d6));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return add(b, sub(c, b), (d4 - d3) / (d4 - d3 + d5 - d6));
  const denominator = 1 / (va + vb + vc);
  return add(add(a, ab, vb * denominator), ac, vc * denominator);
}

function triangle(a, b, c) {
  const ab = sub(b, a), ac = sub(c, a);
  const normal = { x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z, z: ab.x * ac.y - ab.y * ac.x };
  const length = Math.hypot(normal.x, normal.y, normal.z);
  return { a, b, c, normal: { x: normal.x / length, y: normal.y / length, z: normal.z / length },
    high: Math.max(a.z, b.z, c.z) };
}

function terrainCell(column, row, cache) {
  const key = `${column}:${row}`;
  if (cache.has(key)) return cache.get(key);
  const { minX, minY, step } = SEABED_GRID;
  const x = minX + column * step, y = minY + row * step;
  const vertex = (dx, dy) => ({ x: x + dx, y: y + dy, z: getSeabedHeight(x + dx, y + dy) });
  const a = vertex(0, 0), b = vertex(step, 0), c = vertex(0, step), d = vertex(step, step);
  const faces = [triangle(a, b, c), triangle(b, d, c)];
  cache.set(key, faces);
  return faces;
}

function stoneFaces(world) {
  const { maxX, minY, maxY } = WORLD_BOUNDS;
  const borders = Array.isArray(world?.borders) ? world.borders : [
    { kind: "stone", x: maxX + 90, y: 0, rx: 90, ry: maxY, baseZ: BLUE_OCEAN_FLOOR, height: 360 },
    { kind: "stone", x: (BLUE_OCEAN_START_X + maxX) / 2, y: minY - 90,
      rx: (maxX - BLUE_OCEAN_START_X) / 2, ry: 90, baseZ: BLUE_OCEAN_FLOOR, height: 360 },
    { kind: "stone", x: (BLUE_OCEAN_START_X + maxX) / 2, y: maxY + 90,
      rx: (maxX - BLUE_OCEAN_START_X) / 2, ry: 90, baseZ: BLUE_OCEAN_FLOOR, height: 360 },
  ];
  const faces = [];
  for (const border of borders) {
    if (border?.kind !== "stone" || ![border.x, border.y, border.rx, border.ry].every(Number.isFinite)) continue;
    const low = Number.isFinite(border.baseZ) ? border.baseZ : BLUE_OCEAN_FLOOR;
    const high = Number.isFinite(border.height) ? border.height : 360;
    if (Math.abs(border.x - border.rx - maxX) < 0.001)
      faces.push({ axis: "x", at: maxX, start: border.y - border.ry, end: border.y + border.ry,
        low, high, normal: { x: -1, y: 0, z: 0 } });
    if (Math.abs(border.y + border.ry - minY) < 0.001)
      faces.push({ axis: "y", at: minY, start: Math.max(BLUE_OCEAN_START_X, border.x - border.rx), end: border.x + border.rx,
        low, high, normal: { x: 0, y: 1, z: 0 } });
    if (Math.abs(border.y - border.ry - maxY) < 0.001)
      faces.push({ axis: "y", at: maxY, start: Math.max(BLUE_OCEAN_START_X, border.x - border.rx), end: border.x + border.rx,
        low, high, normal: { x: 0, y: -1, z: 0 } });
  }
  return faces;
}

function candidate(point, surfacePoint, normal, radius, kind, inside) {
  const distance = Math.hypot(point.x - surfacePoint.x, point.y - surfacePoint.y, point.z - surfacePoint.z);
  const signed = inside ? -distance : distance;
  const contact = { point: { ...point }, surfacePoint: { ...surfacePoint }, normal: { ...normal }, kind };
  const penetration = radius - signed;
  if (penetration > 0.01) {
    contact.penetration = penetration;
    contact.correctedPoint = add(surfacePoint, normal, radius + 0.01);
    const corrected = contact.correctedPoint;
    // A triangle edge can border a higher neighbour: never project a pin below solid ground.
    corrected.z = Math.max(corrected.z, getSeabedHeight(corrected.x, corrected.y) + 0.01);
  }
  return { gap: signed - radius, distance, contact };
}

/** Find one real blue-ocean solid contact for an eight-link adult arm. Regular
 * contacts keep the existing axis point verbatim. Penetrations additionally
 * provide correctedPoint so the solver can project the link before pinning it.
 * @param {{borders?:object[]}} world @param {Point3[]} arm
 * @param {{radius?:number,taper?:number,tolerance?:number}} [options]
 * @returns {SurfaceContact|null}
 */
export function findSquidSurfaceContact(world, arm, options = {}) {
  if (!options || typeof options !== "object") return null;
  const { radius = 45, taper = 0.84, tolerance = 1 } = options;
  if (!world || !Array.isArray(arm) || arm.length !== 9 || !arm.every(finite)
    || ![radius, taper, tolerance].every(Number.isFinite) || radius <= 0 || taper <= 0 || taper > 1 || tolerance < 0) return null;
  const walls = stoneFaces(world), cache = new Map();
  let queries = 0;
  const evaluate = (linkIndex, along) => {
    if (queries++ >= 256) return null;
    const a = arm[linkIndex], b = arm[linkIndex + 1], point = add(a, sub(b, a), along);
    if (point.x < BLUE_OCEAN_START_X || point.x > WORLD_BOUNDS.maxX + radius
      || point.y < WORLD_BOUNDS.minY - radius || point.y > WORLD_BOUNDS.maxY + radius) return null;
    const localRadius = radius * taper ** linkIndex * (1 - (1 - taper) * along);
    let best = null;
    const accept = (entry) => { if (!best || entry.gap < best.gap) best = entry; };
    const forest = getForestCollision(world, point, localRadius + tolerance + 6.25);
    if (forest) accept(candidate(point, forest.point, forest.normal, localRadius, "forest", forest.inside));
    for (const wall of walls) {
      const horizontal = wall.axis === "x" ? point.y : point.x;
      if (horizontal < wall.start || horizontal > wall.end || point.z < wall.low || point.z > wall.high) continue;
      const surface = { ...point, [wall.axis]: wall.at };
      const signed = dot(sub(point, surface), wall.normal);
      if (signed <= localRadius + tolerance + 6.25)
        accept(candidate(point, surface, wall.normal, localRadius, "stone", signed < 0));
    }
    const { minX, minY, step, columns, rows } = SEABED_GRID;
    const extent = localRadius + tolerance + 6.25;
    const inside = point.z < getSeabedHeight(point.x, point.y) - 0.00001;
    let terrain = null;
    for (let column = clamp(Math.floor((point.x - extent - minX) / step), 0, columns - 2);
      column <= clamp(Math.floor((point.x + extent - minX) / step), 0, columns - 2); column++) {
      for (let row = clamp(Math.floor((point.y - extent - minY) / step), 0, rows - 2);
        row <= clamp(Math.floor((point.y + extent - minY) / step), 0, rows - 2); row++) {
        for (const face of terrainCell(column, row, cache)) {
          if (!inside && point.z > face.high + extent) continue;
          const surface = closestTriangle(point, face.a, face.b, face.c);
          if (surface.x < BLUE_OCEAN_START_X) continue;
          const entry = candidate(point, surface, face.normal, localRadius, "seabed", inside);
          if ((inside || entry.gap <= tolerance + 6.25) && (!terrain || entry.distance < terrain.distance)) terrain = entry;
        }
      }
    }
    if (terrain) accept(terrain);
    if (best) Object.assign(best.contact, { linkIndex, along });
    return best;
  };
  let result = null;
  for (let link = 0; link < 8; link++) {
    const length = Math.hypot(arm[link + 1].x - arm[link].x, arm[link + 1].y - arm[link].y, arm[link + 1].z - arm[link].z);
    const steps = Math.max(1, Math.ceil(length / 12.5));
    if (steps > 128) return null; // Reject severely stretched, nonphysical input rather than doing unbounded work.
    let nearest = null, nearestAlong = 0;
    for (let sample = 0; sample <= steps; sample++) {
      const along = sample / steps, entry = evaluate(link, along);
      if (entry && (!nearest || entry.gap < nearest.gap)) { nearest = entry; nearestAlong = along; }
    }
    // Refine possible between-sample touches; do not turn a hovering near miss into a grip.
    if (nearest && nearest.gap <= tolerance + 6.25) {
      let low = Math.max(0, nearestAlong - 1 / steps), high = Math.min(1, nearestAlong + 1 / steps);
      for (let iteration = 0; iteration < 8; iteration++) {
        const left = low + (high - low) / 3, right = high - (high - low) / 3;
        const a = evaluate(link, left), b = evaluate(link, right);
        if (a && a.gap < nearest.gap) nearest = a;
        if (b && b.gap < nearest.gap) nearest = b;
        if ((a?.gap ?? Infinity) < (b?.gap ?? Infinity)) high = right; else low = left;
      }
      if (nearest.gap <= tolerance && (!result || nearest.gap < result.gap)) result = nearest;
    }
  }
  return result?.contact ?? null;
}
