import * as THREE from './vendor/three.module.js';
import { CRAB_SIZE } from './crab-size.js';

/** The shared outer surface also anchors the shell's small marine plants.
 * @param {number} u Height fraction, 0–1. @param {number} angle Radians.
 */
export function crabShellRadiusAt(u, angle) {
  const spiral = u * Math.PI * 2 * 5.4 - angle;
  const crease = Math.exp(-((Math.sin(spiral * .5) / .15) ** 2));
  const growth = Math.sin(u * Math.PI * 2 * 64 + angle * .25);
  return ((CRAB_SIZE.shellWidth * .5 - .002) * (1 - u) ** .74 + .002)
    * (1 - crease * .11 + growth * .012);
}

const resolution = mobile => mobile ? [40, 20] : [64, 32];
const point = (u, angle, inside = false) => {
  const radius = Math.max(.001, crabShellRadiusAt(u, angle) - (inside ? .004 : 0));
  return [Math.sin(angle) * radius, u * CRAB_SIZE.shellHeight, Math.cos(angle) * radius];
};

/** Exact point on the rendered outer triangle, not on an idealized curve.
 * Plant holdfasts therefore touch both the phone and desktop shell meshes.
 * @param {number} u @param {number} angle @param {{mobile?:boolean}} [quality]
 */
export function crabShellSurfaceAt(u, angle, { mobile = false } = {}) {
  const [rows, columns] = resolution(mobile), tau = Math.PI * 2;
  const row = Math.min(rows - 1, Math.floor(u * rows)), f = u * rows - row;
  const column = ((angle % tau + tau) % tau) / tau * columns, col = Math.floor(column), g = column - col;
  const a = new THREE.Vector3(...point(row / rows, col / columns * tau));
  const b = new THREE.Vector3(...point(row / rows, (col + 1) / columns * tau));
  const c = new THREE.Vector3(...point((row + 1) / rows, col / columns * tau));
  if (f + g <= 1) return a.multiplyScalar(1 - f - g).addScaledVector(b, g).addScaledVector(c, f);
  const d = new THREE.Vector3(...point((row + 1) / rows, (col + 1) / columns * tau));
  return b.multiplyScalar(1 - f).addScaledVector(c, 1 - g).addScaledVector(d, f + g - 1);
}

/** Original tall marine-snail shell. Spiral sutures, growth ridges and an open,
 * thick aperture are actual surfaces. Pigment multiplies neutral PBR relief.
 * Its unusually tall proportions are the requested alien carried-shell design.
 */
export function createCrabCarriedShell({ mobile = false } = {}) {
  const [rows, columns] = resolution(mobile);
  const position = [], color = [], uv = [], index = [], outerFaces = [];
  const gold = new THREE.Color(0xe6ac35), ridge = new THREE.Color(0x9b5b16), inner = new THREE.Color(0x3b220e);
  const tint = new THREE.Color();
  const vertices = (rows + 1) * (columns + 1);
  for (const inside of [false, true]) for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const u = row / rows, angle = col / columns * Math.PI * 2;
    position.push(...point(u, angle, inside)); uv.push(col / columns, u * 4);
    const spiral = u * Math.PI * 2 * 5.4 - angle;
    tint.copy(inside ? inner : gold).lerp(ridge, inside ? .08 : Math.exp(-((Math.sin(spiral * .5) / .19) ** 2)) * .75);
    tint.multiplyScalar(.91 + .09 * Math.sin(angle * 11 + u * 173) ** 2);
    color.push(tint.r, tint.g, tint.b);
  }
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const u = (row + .5) / rows, angle = (col + .5) / columns * Math.PI * 2;
    const apertureAngle = Math.atan2(Math.sin(angle - Math.PI), Math.cos(angle - Math.PI));
    if (((u - .075) / .13) ** 2 + (apertureAngle / .95) ** 2 < 1) continue;
    const a = row * (columns + 1) + col, b = a + columns + 1;
    // Increasing angle winds clockwise viewed from above; both normals face
    // into their corresponding free space rather than inverting the shell.
    outerFaces.push([a, a + 1, b], [a + 1, b + 1, b]);
  }
  const edges = new Map();
  for (const face of outerFaces) {
    index.push(...face); index.push(face[0] + vertices, face[2] + vertices, face[1] + vertices);
    for (let i = 0; i < 3; i++) {
      const a = face[i], b = face[(i + 1) % 3], key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (edges.has(key)) edges.delete(key); else edges.set(key, [a, b]);
    }
  }
  for (const [a, b] of edges.values()) index.push(a, a + vertices, b, b, a + vertices, b + vertices);
  const geometry = new THREE.BufferGeometry(); geometry.name = 'carried-spiral-shell';
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(position.length), 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(index);
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometry.userData = { carriedShell: true, aperture: true, whorls: 5.4, pigment: 'gold',
    widthMeters: CRAB_SIZE.shellWidth, heightMeters: CRAB_SIZE.shellHeight };
  return geometry;
}
