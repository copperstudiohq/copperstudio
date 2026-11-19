import * as THREE from "./vendor/three.module.js";

const UP = new THREE.Vector3(0, 1, 0);

/** Repeatable prototype variation; the level always loads literal prepared placements. */
export function plantRandom(seed = 1) {
  let value = seed >>> 0;
  return () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Smooth indexed botanical surfaces with a per-vertex bioluminescence mask.
 * Prototypes use render axes (Y up), a ground anchor at the origin and metre-like
 * normalized dimensions. The renderer supplies the prepared height/width scale.
 */
export class PlantMesh {
  constructor() {
    this.positions = []; this.colors = []; this.uvs = []; this.glow = []; this.indices = [];
    this.normalSeams = [];
  }

  /** @param {number} rows @param {number} columns
   * @param {(u:number,v:number)=>THREE.Vector3} pointAt
   * @param {number|((u:number,v:number)=>number)} colorAt
   * @param {number|((u:number,v:number)=>number)} [glowAt] @param {boolean} [flip]
   */
  grid(rows, columns, pointAt, colorAt, glowAt = 0, flip = false) {
    if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1)
      throw new RangeError("Plant grids need positive integer row and column counts.");
    const start = this.positions.length / 3;
    for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
      const u = row / rows, v = column / columns, p = pointAt(u, v);
      if (![p.x, p.y, p.z].every(Number.isFinite)) throw new TypeError("Plant surface points must be finite.");
      const tint = new THREE.Color(typeof colorAt === "function" ? colorAt(u, v) : colorAt);
      this.positions.push(p.x, p.y, p.z); this.colors.push(tint.r, tint.g, tint.b);
      this.uvs.push(v, u); this.glow.push(Math.max(0, Math.min(1,
        typeof glowAt === "function" ? glowAt(u, v) : glowAt)));
    }
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const a = start + row * (columns + 1) + column, b = a + columns + 1;
      this.indices.push(...(flip ? [a, b, a + 1, a + 1, b, b + 1] : [a, a + 1, b, a + 1, b + 1, b]));
    }
    const at = (index) => new THREE.Vector3().fromArray(this.positions, index * 3);
    for (let row = 0; row <= rows; row++) {
      const first = start + row * (columns + 1), last = first + columns;
      if (at(first).distanceToSquared(at(last)) > 1e-12) continue;
      const ring = Array.from({ length: columns + 1 }, (_, index) => first + index);
      this.normalSeams.push(ring.every((index) => at(index).distanceToSquared(at(first)) < 1e-12)
        ? ring : [first, last]);
    }
    return this;
  }

  /** A continuous, tapered stem following a prepared prototype path. */
  tube(points, radii, color = 0xffffff, sides = 8, glow = 0) {
    if (points.length < 2) return this;
    const frames = points.map((p, index) => {
      const tangent = points[Math.min(points.length - 1, index + 1)].clone()
        .sub(points[Math.max(0, index - 1)]).normalize();
      return new THREE.Quaternion().setFromUnitVectors(UP, tangent.lengthSq() ? tangent : UP);
    });
    return this.grid(points.length - 1, sides, (u, v) => {
      const index = Math.round(u * (points.length - 1));
      const radius = Array.isArray(radii) ? radii[index] : radii;
      return new THREE.Vector3(Math.cos(v * Math.PI * 2) * radius, 0,
        Math.sin(v * Math.PI * 2) * radius).applyQuaternion(frames[index]).add(points[index]);
    }, color, glow, true);
  }

  /** A cupped leaf with a raised midrib, tapered outline and curved tip.
   * @param {THREE.Vector3} root @param {THREE.Vector3} tip @param {number} width
   * @param {number|((u:number,v:number)=>number)} color
   * @param {{segments?:number,columns?:number,curve?:number,cup?:number,twist?:number,glow?:number|((u:number,v:number)=>number)}} [options]
   */
  leaf(root, tip, width, color, options = {}) {
    const { segments = 10, columns = 4, curve = 0.08, cup = 0.12, twist = 0.15, glow = 0 } = options;
    const axis = tip.clone().sub(root), side = new THREE.Vector3(-axis.z, 0, axis.x);
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0); side.normalize();
    const normal = new THREE.Vector3().crossVectors(side, axis).normalize();
    return this.grid(segments, columns, (u, v) => {
      const cross = v * 2 - 1, envelope = Math.sin(u * Math.PI) ** 0.65;
      return root.clone().lerp(tip, u).addScaledVector(side,
        cross * width * envelope + Math.sin(u * Math.PI) * curve)
        .addScaledVector(normal, Math.sin(u * Math.PI) * curve
          + width * envelope * (cup * cross * cross + twist * cross * Math.sin(u * Math.PI * 2)));
    }, color, glow);
  }

  /** Closed round pods, seed heads and bulbs; scaled in local prototype units. */
  ellipsoid(center, radii, color, { segments = 12, rings = 8, glow = 0 } = {}) {
    return this.grid(rings, segments, (u, v) => new THREE.Vector3(
      Math.sin(u * Math.PI) * Math.cos(v * Math.PI * 2) * radii.x,
      Math.cos(u * Math.PI) * radii.y,
      Math.sin(u * Math.PI) * Math.sin(v * Math.PI * 2) * radii.z,
    ).add(center), color, glow);
  }

  /** Center the ground anchor and normalize height while retaining leaf detail. */
  geometry({ normalizeHeight = true } = {}) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(this.uvs, 2));
    geometry.setAttribute("plantGlow", new THREE.Float32BufferAttribute(this.glow, 1));
    geometry.setIndex(this.indices); geometry.computeBoundingBox();
    if (normalizeHeight && this.positions.length) {
      const { min, max } = geometry.boundingBox, height = max.y - Math.min(0, min.y);
      if (height > 1e-8) geometry.translate(0, -Math.min(0, min.y), 0).scale(1, 1 / height, 1);
    }
    geometry.computeVertexNormals();
    const normals = geometry.attributes.normal, average = new THREE.Vector3(), entry = new THREE.Vector3();
    for (const seam of this.normalSeams) {
      average.set(0, 0, 0);
      seam.forEach((index) => average.add(entry.fromBufferAttribute(normals, index)));
      average.normalize(); seam.forEach((index) => normals.setXYZ(index, average.x, average.y, average.z));
    }
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    return geometry;
  }
}
