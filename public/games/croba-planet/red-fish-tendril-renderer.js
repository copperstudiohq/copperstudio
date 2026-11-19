import * as THREE from './vendor/three.module.js';
import { RED_FISH_TENDRIL_SEGMENTS, RED_FISH_TENDRIL_ROOTS, redFishTendrilRestPoint, redFishTendrilRadius } from './red-fish-tendril-physics.js';
import { redFishAppearance } from './red-fish-skin.js';

const finite = point => point && [point.x, point.y, point.z].every(Number.isFinite);

/** One connected tube batch copies the four simulated chains. Shared rings
 * keep bends smooth; rendering never advances the physics or moves the fish. */
export class RedFishTendrilRenderer {
  constructor(capacity, material, { mobile = false } = {}) {
    this.capacity = capacity; this.sides = mobile ? 5 : 8; this.count = 0;
    const rings = RED_FISH_TENDRIL_SEGMENTS + 1, stride = this.sides + 1;
    const vertices = capacity * RED_FISH_TENDRIL_ROOTS.length * rings * stride;
    const positions = new Float32Array(vertices * 3), normals = new Float32Array(vertices * 3);
    const colors = new Float32Array(vertices * 3), uv = new Float32Array(vertices * 2), indices = [];
    const tint = new THREE.Color(), rootColor = new THREE.Color(0xa71715), tipColor = new THREE.Color(0xc3251b);
    for (let chain = 0; chain < capacity * RED_FISH_TENDRIL_ROOTS.length; chain++) {
      const start = chain * rings * stride;
      for (let node = 0; node < rings; node++) for (let side = 0; side <= this.sides; side++) {
        const vertex = start + node * stride + side, u = node / RED_FISH_TENDRIL_SEGMENTS;
        tint.copy(rootColor).lerp(tipColor, u * .6);
        colors.set([tint.r, tint.g, tint.b], vertex * 3); uv.set([side / this.sides, u], vertex * 2);
        if (node < RED_FISH_TENDRIL_SEGMENTS && side < this.sides) {
          const a = vertex, b = a + stride; indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); this.geometry.setIndex(indices);
    this.geometry.setAttribute('fishAppearance', new THREE.BufferAttribute(new Float32Array(vertices), 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(this.geometry, material); this.mesh.name = 'red-fish-physical-tendrils';
    this.mesh.visible = false; this.mesh.castShadow = false; this.mesh.receiveShadow = true;
    this.points = Array.from({ length: rings }, () => new THREE.Vector3());
    this.tangent = new THREE.Vector3(); this.previousSide = new THREE.Vector3();
    this.side = new THREE.Vector3(); this.up = new THREE.Vector3(); this.normal = new THREE.Vector3();
    this.axis = new THREE.Vector3(); this.rest = { x: 0, y: 0, z: 0 }; this.bounds = new THREE.Box3();
  }

  begin() { this.count = 0; this.bounds.makeEmpty(); }

  fish(fish, reducedMotion = false) {
    if (this.count >= this.capacity) throw new RangeError('Red fish tendril batch exceeds its prepared population.');
    const scale = fish.lengthMeters, stride = this.sides + 1, rings = this.points.length;
    for (let chain = 0; chain < RED_FISH_TENDRIL_ROOTS.length; chain++) {
      redFishTendrilRestPoint(fish, chain, 0, this.rest);
      const nodes = fish.tendrilNodes?.[chain], root = nodes?.[0];
      // Held prey and teleports can move before a physics tick. Never leave
      // detached tubes at the old location while the fish is being carried.
      const useRest = reducedMotion || !!fish.squidHeldBy || !Array.isArray(nodes) || nodes.length !== rings || !finite(root)
        || Math.hypot(root.x - this.rest.x, root.y - this.rest.y, root.z - this.rest.z) > .03 * scale * 25
        || nodes.some(node => !finite(node));
      for (let node = 0; node < rings; node++) {
        const point = useRest ? redFishTendrilRestPoint(fish, chain, node, this.rest) : nodes[node];
        this.points[node].set(point.x / 25, point.z / 25, point.y / 25);
      }
      for (let node = 0; node < rings; node++) {
        const point = this.points[node], before = this.points[Math.max(0, node - 1)], after = this.points[Math.min(rings - 1, node + 1)];
        this.tangent.copy(after).sub(before).normalize();
        if (this.tangent.lengthSq() < .5) this.tangent.set(0, 0, 1);
        if (node === 0) {
          this.axis.set(0, Math.abs(this.tangent.y) > .9 ? 0 : 1, Math.abs(this.tangent.y) > .9 ? 1 : 0);
          this.side.crossVectors(this.tangent, this.axis).normalize();
        } else {
          // Parallel transport avoids the corkscrew seams from independently
          // facing every segment toward a global up vector.
          this.side.copy(this.previousSide).addScaledVector(this.tangent, -this.previousSide.dot(this.tangent));
          if (this.side.lengthSq() < 1e-8) {
            this.axis.set(0, Math.abs(this.tangent.y) > .9 ? 0 : 1, Math.abs(this.tangent.y) > .9 ? 1 : 0);
            this.side.crossVectors(this.tangent, this.axis);
          }
          this.side.normalize();
        }
        this.previousSide.copy(this.side); this.up.crossVectors(this.side, this.tangent).normalize();
        const radius = redFishTendrilRadius(fish, node) / 25;
        const start = ((this.count * RED_FISH_TENDRIL_ROOTS.length + chain) * rings + node) * stride;
        for (let side = 0; side <= this.sides; side++) {
          const angle = side / this.sides * Math.PI * 2;
          this.normal.copy(this.side).multiplyScalar(Math.cos(angle)).addScaledVector(this.up, Math.sin(angle));
          const vertex = start + side;
          this.geometry.attributes.position.setXYZ(vertex, point.x + this.normal.x * radius,
            point.y + this.normal.y * radius, point.z + this.normal.z * radius);
          this.geometry.attributes.normal.setXYZ(vertex, this.normal.x, this.normal.y, this.normal.z);
          this.geometry.attributes.fishAppearance.setX(vertex, redFishAppearance(fish));
        }
        this.axis.copy(point).addScalar(radius); this.bounds.expandByPoint(this.axis);
        this.axis.copy(point).addScalar(-radius); this.bounds.expandByPoint(this.axis);
      }
    }
    this.count++;
  }

  finish() {
    this.geometry.setDrawRange(0, this.count * RED_FISH_TENDRIL_ROOTS.length * RED_FISH_TENDRIL_SEGMENTS * this.sides * 6);
    this.mesh.visible = this.count > 0;
    if (!this.count) return;
    this.geometry.attributes.position.needsUpdate = true; this.geometry.attributes.normal.needsUpdate = true;
    this.geometry.attributes.fishAppearance.needsUpdate = true;
    this.geometry.boundingBox ??= new THREE.Box3(); this.geometry.boundingBox.copy(this.bounds);
    this.geometry.boundingSphere ??= new THREE.Sphere(); this.bounds.getBoundingSphere(this.geometry.boundingSphere);
  }

  dispose() { this.geometry.dispose(); this.mesh.removeFromParent(); }
}
