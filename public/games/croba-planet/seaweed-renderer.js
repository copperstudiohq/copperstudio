import * as THREE from "./vendor/three.module.js";
import { updateInstancedWindBounds } from "./render-visibility.js";
import {capRenderDistance} from './render-distance.js';

const SCALE = 25;
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);

/** @typedef {{id:string,x:number,y:number,z:number,height:number,width:number,heading:number,seed:number,variant:number,normal?:number[]}} SeaweedPatch */

function random(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Indexed ribbons keep a continuous, smooth living surface across their folds. */
class Fronds {
  constructor() { this.positions = []; this.colors = []; this.uvs = []; this.indices = []; }

  vertex(point, color, u, v) {
    const index = this.positions.length / 3;
    this.positions.push(point.x, point.y, point.z);
    const tint = new THREE.Color(color);
    this.colors.push(tint.r, tint.g, tint.b);
    this.uvs.push(u, v);
    return index;
  }

  tube(a, b, radius, tipRadius, color, sides = 6) {
    const axis = b.clone().sub(a), length = axis.length();
    if (length < 1e-7) return;
    const rotation = new THREE.Quaternion().setFromUnitVectors(UP, axis.divideScalar(length));
    const start = this.positions.length / 3;
    for (const [ring, origin] of [a, b].entries()) {
      for (let side = 0; side <= sides; side++) {
        const angle = side / sides * TAU, r = ring ? tipRadius : radius;
        const point = new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r)
          .applyQuaternion(rotation).add(origin);
        this.vertex(point, color, side / sides, ring * length * 3);
      }
    }
    for (let side = 0; side < sides; side++) {
      const a0 = start + side, b0 = a0 + sides + 1;
      this.indices.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1);
    }
  }

  ribbon(base, angle, length, width, seed, detail) {
    const rng = random(seed), rows = detail ? 10 : 5;
    const forward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const side = new THREE.Vector3(-forward.z, 0, forward.x);
    const bend = 0.10 + rng() * 0.08;
    const droop = Math.min(0.03 + rng() * 0.07, base.y * 0.45);
    const start = this.positions.length / 3;
    for (let row = 0; row <= rows; row++) {
      const t = row / rows;
      const center = base.clone().addScaledVector(forward, length * t);
      center.addScaledVector(side, Math.sin(t * TAU + seed) * length * 0.17 * t);
      center.y += Math.sin(t * Math.PI) * bend - t * t * droop;
      const envelope = Math.max(0.025, Math.sin(t * Math.PI) ** 0.45 * (1 - t * 0.20));
      const edge = width * envelope * (0.88 + rng() * 0.20);
      for (const column of [-1, 0, 1]) {
        const point = center.clone().addScaledVector(side, column * edge);
        // Raised midrib and curled, slightly torn edges catch real highlights.
        point.y += column === 0 ? edge * 0.13 : Math.sin(t * TAU * 1.5 + seed) * edge * 0.35;
        const color = column === 0 ? 0xc6e4ef : row > rows * 0.7 ? 0xb5d1df : 0x9fbacb;
        this.vertex(point, color, (column + 1) / 2, t * 2);
      }
    }
    for (let row = 0; row < rows; row++) for (let column = 0; column < 2; column++) {
      const a = start + row * 3 + column, b = a + 3;
      this.indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }

  geometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(this.uvs, 2));
    geometry.setIndex(this.indices);
    geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    return geometry;
  }
}

/** One shared botanical prototype; placement is always the prepared data below. */
export function blueSeaweedGeometry(variant = 0, detail = true) {
  const surface = new Fronds(), seed = 0xb1e000 + variant * 971;
  const stems = 3, segments = detail ? 9 : 5;
  for (let root = 0; root < (detail ? 9 : 5); root++) {
    const rng = random(seed + root * 37);
    const angle = root * 2.4 + variant, reach = 0.17 + rng() * 0.19;
    surface.tube(new THREE.Vector3(0, 0.035, 0),
      new THREE.Vector3(Math.cos(angle) * reach, 0.002, Math.sin(angle) * reach),
      0.017, 0.003, 0x698ea4, detail ? 5 : 4);
  }
  for (let stem = 0; stem < stems; stem++) {
    const rng = random(seed + 1003 + stem * 739);
    const height = 0.76 + rng() * 0.24, phase = rng() * TAU, reach = 0.15 + stem * 0.14;
    const stemPoint = (fraction) => new THREE.Vector3(
      Math.sin(fraction * 2.9 + phase) * reach * fraction,
      fraction * height + 0.015 * (1 - fraction),
      Math.cos(fraction * 3.4 + phase) * reach * fraction,
    );
    for (let segment = 0; segment < segments; segment++)
      surface.tube(stemPoint(segment / segments), stemPoint((segment + 1) / segments),
        0.014 * (1 - segment / segments * 0.55), 0.012 * (1 - segment / segments * 0.55),
        0x90b8d0, detail ? 6 : 5);
    const whorls = 5;
    for (let level = 0; level < whorls; level++) {
      const fraction = 0.13 + level / whorls * 0.76 + rng() * 0.04;
      const length = (0.58 + Math.sin(fraction * Math.PI) * 0.34) * (0.90 + rng() * 0.20);
      const angle = phase + (level % 2 ? Math.PI : 0) + (rng() - 0.5) * 1.3;
      surface.ribbon(stemPoint(fraction), angle, length,
        variant === 1 ? 0.13 : variant === 2 ? 0.22 : 0.18,
        Math.floor(rng() * 100000), detail);
    }
  }
  return surface.geometry();
}

function leafMaterial(shared, time) {
  const material = shared?.clone() ?? new THREE.MeshStandardMaterial({ color: 0x237bb8, roughness: 0.95 });
  material.name = "wet-blue-seaweed-fronds";
  material.vertexColors = true; material.flatShading = false;
  material.side = THREE.DoubleSide; material.forceSinglePass = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.kelpTime = time;
    shader.vertexShader = `uniform float kelpTime;\n${shader.vertexShader}`.replace("#include <begin_vertex>",
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float phase = instanceMatrix[3].x*.27 + instanceMatrix[3].z*.19;
        float weight = smoothstep(.015,1.,position.y);
        transformed.x += (sin(kelpTime*.62+phase+position.y*3.)*.09 + sin(kelpTime*.27+phase)*.045)*weight;
        transformed.z += cos(kelpTime*.48+phase+position.y*2.7)*.075*weight;
      #endif`);
  };
  material.customProgramCacheKey = () => "croba-blue-seaweed-current-v1";
  return material;
}

/** The shader's height-weighted current reaches a fixed displacement envelope. */
function updateKelpBounds(mesh) {
  const height = mesh.geometry.boundingBox.max.y;
  const t = THREE.MathUtils.clamp((height - .015) / .985, 0, 1);
  const weight = t * t * (3 - 2 * t);
  updateInstancedWindBounds(mesh, .135 * weight, .075 * weight);
}

/** Flowing blue kelp, rooted in the fixed level and rendered in six shared batches.
 * @param {{seaweed?:SeaweedPatch[]}} world @param {{blueKelp?:THREE.Material}} [materials]
 */
export class BlueSeaweedRenderer {
  constructor(world, materials = {}) {
    this.group = new THREE.Group(); this.group.name = "blue-seaweed-meadows";
    this.time = { value: 0 }; this.disposed = false;
    this.material = leafMaterial(materials.blueKelp, this.time);
    this.geometries = []; this.batches = [];
    const transform = new THREE.Object3D(),slope=new THREE.Vector3(),heading=new THREE.Quaternion();
    for (let variant = 0; variant < 3; variant++) {
      const entries = (world.seaweed ?? []).filter((patch) => patch.variant === variant);
      const highGeometry = blueSeaweedGeometry(variant, true), lowGeometry = blueSeaweedGeometry(variant, false);
      this.geometries.push(highGeometry, lowGeometry);
      const batch = { entries: [], high: null, low: null };
      for (const [level, geometry] of [["high", highGeometry], ["low", lowGeometry]]) {
        const mesh = new THREE.InstancedMesh(geometry, this.material, entries.length);
        mesh.name = `blue-kelp-${variant}-${level}`;
        mesh.frustumCulled = true; mesh.castShadow = false; mesh.receiveShadow = true;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        batch[level] = mesh; this.group.add(mesh);
      }
      for (const patch of entries) {
        transform.position.set(patch.x / SCALE, patch.z / SCALE, patch.y / SCALE);
        transform.rotation.set(0, patch.heading, 0);
        if(patch.normal){
          if(patch.normal.length!==3||!patch.normal.every(Number.isFinite)||slope.fromArray(patch.normal).lengthSq()<1e-8)
            throw new TypeError(`Seaweed ${patch.id} needs a finite nonzero surface normal.`);
          transform.quaternion.setFromUnitVectors(UP,slope.normalize()).multiply(heading.setFromAxisAngle(UP,patch.heading));
        }
        transform.scale.set(patch.width / SCALE, patch.height / SCALE, patch.width / SCALE);
        transform.updateMatrix();
        batch.entries.push({ rockId:patch.rockId,position: transform.position.clone(), matrix: transform.matrix.clone(),
          tint: new THREE.Color([0xffffff, 0xc7e3ef, 0xdcebf1][patch.seed % 3]) });
      }
      this.batches.push(batch);
    }
    this.update(0, true);
  }

  update(time, reducedMotion = false, cameraPosition, quality = {}) {
    if (this.disposed) return;
    this.time.value = reducedMotion || !Number.isFinite(time) ? 0 : time;
    const mobile = Boolean(quality.mobile), near = mobile ? 12 : 26, far = capRenderDistance(quality,mobile ? 35 : 58);
    if (this.lastCamera && cameraPosition && cameraPosition.distanceToSquared(this.lastCamera) < 0.64
      && this.mobile === mobile && this.cullRange===far&&this.removedRockIds===quality.removedRockIds) return;
    this.removedRockIds=quality.removedRockIds;
    this.lastCamera = cameraPosition?.clone(); this.mobile = mobile; this.cullRange=far;
    for (const batch of this.batches) {
      let high = 0, low = 0;
      for (const entry of batch.entries) {
        if(entry.rockId&&quality.removedRockIds?.has(entry.rockId))continue;
        const distance = cameraPosition ? cameraPosition.distanceTo(entry.position) : 0;
        if (distance > far) continue;
        const mesh = distance < near ? batch.high : batch.low, index = distance < near ? high++ : low++;
        mesh.setMatrixAt(index, entry.matrix); mesh.setColorAt(index, entry.tint);
      }
      for (const [mesh, count] of [[batch.high, high], [batch.low, low]]) {
        mesh.count = count; mesh.visible = count > 0; mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        updateKelpBounds(mesh);
      }
    }
  }

  /** PBR maps are borrowed from the material library; instance buffers belong here. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.group.traverse((object) => { if (object.isInstancedMesh) object.dispose(); });
    this.geometries.forEach((geometry) => geometry.dispose()); this.material.dispose();
    this.group.removeFromParent();
  }
}
