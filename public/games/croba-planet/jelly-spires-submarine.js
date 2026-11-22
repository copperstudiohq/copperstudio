/** Authored, flooded wreck. Geometry and collision share the same closed metal
 * pieces; neither the broken stern nor the side opening has a hidden capsule.
 * Local geometry uses render metres: X starboard, Y up, Z toward the bow.
 * Public positions, radii and contacts use the game's simulation axes (25/m).
 */
const SCALE = 25;
export const SPIRES_SUBMARINE = Object.freeze({
  id: 'spires-exploration-submarine', name: 'Old exploration submarine',
  x: 14100, y: -6000, z: -3594.4859,
  yaw: 1.047197551, pitch: -.077566495, roll: -.065797922,
  rotationOrder: 'XYZ', lengthMeters: 42, beamMeters: 6, boundingRadius: 720,
  sideOpening: Object.freeze({ minZ: -3, maxZ: 4, minY: -1.47, maxY: 1.47 }),
});

function quaternion(pitch, yaw, roll) {
  const sx = Math.sin(pitch / 2), cx = Math.cos(pitch / 2);
  const sy = Math.sin(yaw / 2), cy = Math.cos(yaw / 2);
  const sz = Math.sin(roll / 2), cz = Math.cos(roll / 2);
  return [sx * cy * cz + cx * sy * sz, cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz, cx * cy * cz - sx * sy * sz];
}
function rotate(x, y, z, q, inverse = false) {
  const sign = inverse ? -1 : 1, qx = q[0] * sign, qy = q[1] * sign, qz = q[2] * sign, qw = q[3];
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
  return [x + qw * tx + qy * tz - qz * ty, y + qw * ty + qz * tx - qx * tz, z + qw * tz + qx * ty - qy * tx];
}
const rootRotation = quaternion(SPIRES_SUBMARINE.pitch, SPIRES_SUBMARINE.yaw, SPIRES_SUBMARINE.roll);

/** Convert model-local metres to simulation coordinates. */
export function spiresSubmarineLocalToWorld(x, y, z) {
  const p = rotate(x, y, z, rootRotation);
  return { x: SPIRES_SUBMARINE.x + p[0] * SCALE, y: SPIRES_SUBMARINE.y + p[2] * SCALE,
    z: SPIRES_SUBMARINE.z + p[1] * SCALE };
}

const parts = [];
const PRISM_TRIANGLES = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6,
  0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0];
function addPart(id, kind, material, rawVertices, triangles = PRISM_TRIANGLES) {
  const vertices = rawVertices.map(Math.fround), indices = [...triangles], normals = [];
  const center = [0, 0, 0];
  const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (let i = 0; i < vertices.length; i += 3) {
    for (let a = 0; a < 3; a++) center[a] += vertices[i + a] / (vertices.length / 3);
    bounds.minX = Math.min(bounds.minX, vertices[i]); bounds.maxX = Math.max(bounds.maxX, vertices[i]);
    bounds.minY = Math.min(bounds.minY, vertices[i + 1]); bounds.maxY = Math.max(bounds.maxY, vertices[i + 1]);
    bounds.minZ = Math.min(bounds.minZ, vertices[i + 2]); bounds.maxZ = Math.max(bounds.maxZ, vertices[i + 2]);
  }
  for (let f = 0; f < indices.length; f += 3) {
    const a = indices[f] * 3, b = indices[f + 1] * 3, c = indices[f + 2] * 3;
    const ux = vertices[b] - vertices[a], uy = vertices[b + 1] - vertices[a + 1], uz = vertices[b + 2] - vertices[a + 2];
    const vx = vertices[c] - vertices[a], vy = vertices[c + 1] - vertices[a + 1], vz = vertices[c + 2] - vertices[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const length = Math.hypot(nx, ny, nz);
    if (length < 1e-10) throw new Error(`Degenerate submarine face: ${id}.`);
    nx /= length; ny /= length; nz /= length;
    if (nx * (center[0] - vertices[a]) + ny * (center[1] - vertices[a + 1]) + nz * (center[2] - vertices[a + 2]) > 0) {
      [indices[f + 1], indices[f + 2]] = [indices[f + 2], indices[f + 1]]; nx = -nx; ny = -ny; nz = -nz;
    }
    normals.push(nx, ny, nz);
  }
  parts.push(Object.freeze({ id, kind, material, vertices: Object.freeze(vertices), indices: Object.freeze(indices),
    normals: Object.freeze(normals), bounds: Object.freeze(bounds) }));
}

function sector(id, material, z0, z1, scale0, scale1, angle, sides = 20, inner = .955, transform = null, kind = 'hull-sector') {
  const a = angle * Math.PI * 2 / sides, b = (angle + 1) * Math.PI * 2 / sides, vertices = [];
  for (const [z, scale] of [[z0, scale0], [z1, scale1]]) {
    for (const [theta, ratio] of [[a, 1], [b, 1], [b, inner], [a, inner]]) {
      let p = [Math.sin(theta) * 3 * scale * ratio, Math.cos(theta) * 2.5 * scale * ratio, z];
      if (transform) { p = rotate(...p, transform.q); p = p.map((v, i) => v + transform.position[i]); }
      vertices.push(...p);
    }
  }
  addPart(id, kind, material, vertices);
}
function box(id, material, center, size, rotation = [0, 0, 0], kind = 'box') {
  const q = quaternion(...rotation), vertices = [];
  for (const zz of [-1, 1]) for (const [xx, yy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const p = rotate(xx * size[0] / 2, yy * size[1] / 2, zz * size[2] / 2, q);
    vertices.push(...p.map((v, i) => v + center[i]));
  }
  addPart(id, kind, material, vertices);
}

// Fixed axial stations, not generated geography. The wide starboard breach is
// intentionally absent from both the metal mesh and the collision list.
const stations = [[-11, 1], [-3, 1], [4, 1], [13, 1], [17, .78], [19.5, .055]];
for (let band = 0; band < stations.length - 1; band++) for (let side = 0; side < 20; side++) {
  if (band === 1 && side >= 3 && side <= 6) continue;
  sector(`hull-${band}-${side}`, (band + side) % 9 === 0 ? 'rust' : 'paint',
    stations[band][0], stations[band + 1][0], stations[band][1], stations[band + 1][1], side);
}
for (const [rib, z] of [[0, -8], [1, 7]]) for (let side = 0; side < 20; side++)
  sector(`rib-${rib}-${side}`, 'metal', z - .07, z + .07, .956, .956, side, 20, .89, null, 'rib');
box('interior-deck', 'metal', [0, -1.32, 1], [4.65, .12, 23.4]);
box('bow-end', 'metal', [0, 0, 19.51], [.32, .27, .08]);
box('conning-tower', 'paint', [0, 3.05, 6.5], [1.8, 1.65, 3.6], [0, -.04, 0]);
box('tower-window', 'glass', [0, 3.32, 8.32], [1.3, .45, .08], [0, -.04, 0]);
box('bent-periscope-base', 'metal', [-.38, 4.15, 6], [.15, 1.1, .15], [.06, 0, .15]);
box('bent-periscope-head', 'metal', [-.46, 4.69, 6.22], [.24, .19, .65], [.06, 0, .15]);
box('port-dive-plane', 'rust', [-3.6, -.15, 9.5], [2.4, .13, 2.5], [.04, -.18, .06]);
box('starboard-broken-plane', 'rust', [3.2, -.12, 9.5], [1.35, .15, 2.3], [-.12, .2, -.12]);
box('console-pedestal', 'metal', [-.8, -.6, 11], [1.15, 1.3, .75], [-.18, 0, 0]);
box('console-dark-face', 'glass', [-.8, .08, 11.1], [1.1, .09, .8], [-.18, 0, 0]);

// The severed aft section rests independently on the same gravel bank. Its
// displaced port-side pose is baked into vertices, leaving the root transform
// shared by renderer, contacts and authored preview routes.
const stern = { position: [-6, .06, -17], q: quaternion(-.04, .21, -.12) };
for (let side = 0; side < 20; side++)
  sector(`stern-${side}`, side % 6 === 0 ? 'rust' : 'paint', -4.5, 4, .64, 1, side, 20, .94, stern);
function sternBox(id, material, center, size, rotation = [0, 0, 0]) {
  const c = rotate(...center, stern.q).map((v, i) => v + stern.position[i]);
  // Small fin boxes are authored in the stern's nearby orientation; the hull
  // sectors above remain the exact pressure-shell geometry.
  box(id, material, c, size, [rotation[0] - .04, rotation[1] + .21, rotation[2] - .12]);
}
sternBox('stern-shaft', 'metal', [0, 0, -5], [.35, .35, 2.3]);
sternBox('propeller-hub', 'metal', [0, 0, -6.1], [.7, .7, .5]);
sternBox('propeller-bent-blade', 'rust', [.38, .92, -6.12], [.55, 1.6, .14], [.28, .15, -.38]);
sternBox('propeller-second-blade', 'metal', [-.86, -.3, -6.12], [1.45, .55, .14], [-.12, .2, -.2]);
sternBox('propeller-broken-stub', 'rust', [.33, -.4, -6.12], [.46, .52, .18], [.2, 0, .3]);
sternBox('stern-upper-fin', 'rust', [0, 2.05, -3], [.2, 2.4, 2.4]);
sternBox('stern-port-fin', 'paint', [-2.2, 0, -3], [2.6, .16, 2.3]);
sternBox('stern-starboard-fin', 'rust', [2.2, 0, -3], [2.6, .16, 2.3]);
box('torn-aft-plate', 'rust', [-2.6, -1.75, -12.7], [1.4, .12, 2.8], [.25, -.25, -.2]);
box('fallen-side-plate', 'paint', [3.6, -1.65, -1.5], [1.3, .12, 2.4], [0, -.15, -.2]);

export const SPIRES_SUBMARINE_PARTS = Object.freeze(parts);
const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
const worldBounds = { ...bounds };
for (const part of parts) {
  for (const key of Object.keys(bounds)) bounds[key] = key.startsWith('min') ? Math.min(bounds[key], part.bounds[key]) : Math.max(bounds[key], part.bounds[key]);
  for (let i = 0; i < part.vertices.length; i += 3) {
    const p = spiresSubmarineLocalToWorld(...part.vertices.slice(i, i + 3));
    for (const [axis, value] of Object.entries(p)) {
      const label = axis.toUpperCase(); worldBounds[`min${label}`] = Math.min(worldBounds[`min${label}`], value);
      worldBounds[`max${label}`] = Math.max(worldBounds[`max${label}`], value);
    }
  }
}
export const SPIRES_SUBMARINE_BOUNDS = Object.freeze(bounds);
export const SPIRES_SUBMARINE_WORLD_BOUNDS = Object.freeze(worldBounds);

function outside(p, radius, b) {
  return p.x + radius < b.minX || p.x - radius > b.maxX || p.y + radius < b.minY || p.y - radius > b.maxY || p.z + radius < b.minZ || p.z - radius > b.maxZ;
}
// Closest point on a triangle (edge regions included), written to a reusable
// scratch vector. No THREE dependency enters the gameplay contact path.
const nearest = new Float64Array(3);
function closestTriangle(p, vertices, a, b, c) {
  const ax = vertices[a], ay = vertices[a + 1], az = vertices[a + 2];
  const abx = vertices[b] - ax, aby = vertices[b + 1] - ay, abz = vertices[b + 2] - az;
  const acx = vertices[c] - ax, acy = vertices[c + 1] - ay, acz = vertices[c + 2] - az;
  const apx = p.x - ax, apy = p.y - ay, apz = p.z - az;
  const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  let u = 0, v = 0;
  if (!(d1 <= 0 && d2 <= 0)) {
    const bpx = p.x - vertices[b], bpy = p.y - vertices[b + 1], bpz = p.z - vertices[b + 2];
    const d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
    if (d3 >= 0 && d4 <= d3) u = 1;
    else {
      const vc = d1 * d4 - d3 * d2;
      if (vc <= 0 && d1 >= 0 && d3 <= 0) u = d1 / (d1 - d3);
      else {
        const cpx = p.x - vertices[c], cpy = p.y - vertices[c + 1], cpz = p.z - vertices[c + 2];
        const d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
        if (d6 >= 0 && d5 <= d6) v = 1;
        else {
          const vb = d5 * d2 - d1 * d6;
          if (vb <= 0 && d2 >= 0 && d6 <= 0) v = d2 / (d2 - d6);
          else {
            const va = d3 * d6 - d5 * d4;
            if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { v = (d4 - d3) / (d4 - d3 + d5 - d6); u = 1 - v; }
            else { const denominator = 1 / (va + vb + vc); u = vb * denominator; v = vc * denominator; }
          }
        }
      }
    }
  }
  nearest[0] = ax + abx * u + acx * v; nearest[1] = ay + aby * u + acy * v; nearest[2] = az + abz * u + acz * v;
}

/** Exact sphere/metal contact. Far-away body checks allocate nothing.
 * @returns {{id:string,partId:string,kind:string,normal:{x:number,y:number,z:number},penetration:number,point:{x:number,y:number,z:number}}|null}
 */
export function getSpiresSubmarineCollision(point, radius = 0) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)
    || !Number.isFinite(radius) || radius < 0 || outside(point, radius, worldBounds)) return null;
  const local = rotate((point.x - SPIRES_SUBMARINE.x) / SCALE, (point.z - SPIRES_SUBMARINE.z) / SCALE,
    (point.y - SPIRES_SUBMARINE.y) / SCALE, rootRotation, true);
  const p = { x: local[0], y: local[1], z: local[2] }, r = radius / SCALE;
  let result = null;
  for (const part of parts) {
    if (outside(p, r, part.bounds)) continue;
    const positions = part.vertices, indices = part.indices, n = part.normals;
    let maximum = -Infinity, face = 0;
    for (let f = 0; f < indices.length; f += 3) {
      const a = indices[f] * 3, d = n[f] * (p.x - positions[a]) + n[f + 1] * (p.y - positions[a + 1]) + n[f + 2] * (p.z - positions[a + 2]);
      if (d > maximum) { maximum = d; face = f; }
    }
    if (maximum > r) continue;
    let nx = n[face], ny = n[face + 1], nz = n[face + 2], penetration, px, py, pz;
    if (maximum <= 0) { penetration = r - maximum; px = p.x - nx * maximum; py = p.y - ny * maximum; pz = p.z - nz * maximum; }
    else {
      let best = Infinity;
      for (let f = 0; f < indices.length; f += 3) {
        closestTriangle(p, positions, indices[f] * 3, indices[f + 1] * 3, indices[f + 2] * 3);
        const d = (p.x - nearest[0]) ** 2 + (p.y - nearest[1]) ** 2 + (p.z - nearest[2]) ** 2;
        if (d < best) { best = d; [px, py, pz] = nearest; }
      }
      const gap = Math.sqrt(best); if (gap >= r) continue;
      penetration = r - gap;
      if (gap > 1e-9) { nx = (p.x - px) / gap; ny = (p.y - py) / gap; nz = (p.z - pz) / gap; }
    }
    if (penetration <= 0 || (result && penetration * SCALE <= result.penetration)) continue;
    const normal = rotate(nx, ny, nz, rootRotation);
    result = { id: SPIRES_SUBMARINE.id, partId: part.id, kind: 'spires-submarine',
      normal: { x: normal[0], y: normal[2], z: normal[1] }, penetration: penetration * SCALE,
      point: spiresSubmarineLocalToWorld(px, py, pz) };
  }
  return result;
}

function preview(id, name, eyeLocal, targetLocal) {
  const eye = spiresSubmarineLocalToWorld(...eyeLocal), target = spiresSubmarineLocalToWorld(...targetLocal);
  const dx = target.x - eye.x, dy = target.y - eye.y, dz = target.z - eye.z;
  return Object.freeze({ id, name, player: Object.freeze({ ...eye, z: eye.z - 36 }),
    look: Object.freeze({ yaw: Math.atan2(dx, -dy), pitch: Math.atan2(dz, Math.hypot(dx, dy)) }), target: Object.freeze(target) });
}
export const SPIRES_SUBMARINE_PREVIEWS = Object.freeze([
  preview('submarine', 'The broken exploration submarine', [10, 10, -4], [0, .5, 0]),
  preview('submarine-inside', 'Inside the flooded hull', [0, .6, -5.5], [0, .1, 11]),
  preview('submarine-breach', 'The open side breach', [9, 4.5, .5], [0, .4, .5]),
]);
function feetRoute(points) { return Object.freeze(points.map(p => { const eye = spiresSubmarineLocalToWorld(...p); return Object.freeze({ ...eye, z: eye.z - 36 }); })); }
export const SPIRES_SUBMARINE_ROUTES = Object.freeze({
  breach: feetRoute([[6, 2.2, .5], [3.4, 1.2, .5], [2, .55, .5], [0, .55, .5], [0, .55, 5]]),
  aft: feetRoute([[0, .55, -15], [0, .55, -12], [0, .55, -9], [0, .55, -5], [0, .55, .5]]),
});
