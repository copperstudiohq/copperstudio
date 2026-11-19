import * as THREE from "./vendor/three.module.js";
import {capRenderDistance} from './render-distance.js';
import { BLUE_OCEAN_START_X, WATER_LEVEL, getIceDepth, getIceSection, pointInPolygon } from "./terrain.js";
import { getSeabedHeight } from "./seabed.js";
import { getIceSpikes } from "./ice-spikes.js";
import { createCreatureSurfaceMaps, applyCreatureSurface } from "./creature-materials.js";
import { createTubeCoralAnatomy } from "./tube-coral-anatomy.js";

const SCALE = 25;
const TAU = Math.PI * 2;
const LEAF_VEINS = [
  [[-0.7, 0, 0.73], [0, 0, 1.025]], [[0, 0, 1.025], [0.7, 0, 0.73]],
  [[-0.2, 0, 1], [-0.45, 0.45, 0.8]], [[0.2, 0, 1], [0.45, -0.45, 0.8]],
];

/** Individual hollow tube, with z at its ground attachment; dimensions use simulation units.
 * @typedef {{id:string,clusterId:string,x:number,y:number,z:number,height:number,radius:number,seed:number}} TubeCoral
 */
/** A downward plant attached to a tapered glacier's bottom plane. z is the root, z-length the lowest frond.
 * @typedef {{id:string,platformId:string,x:number,y:number,z:number,length:number,width:number,seed:number,attachment:'underside'}} HangingPlant
 */

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function edgeDistance(x, y, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - a.x - dx * t, y - a.y - dy * t);
}

function reservedRoute(x, y, radius) {
  return Math.hypot(x, y) < 32 + radius
    || edgeDistance(x, y, { x: 0, y: 0 }, { x: 180, y: 0 }) < 22 + radius
    || edgeDistance(x, y, { x: 0, y: 0 }, { x: 300, y: 100 }) < 18 + radius;
}

/** Seeded blue ground tubes and purple glacier plants; no flora enters the blue-ocean biome.
 * @param {import('./terrain.js').Platform[]} platforms
 * @param {(import('./terrain.js').Platform & {z?:number})[]} submergedIce
 * @param {number} [seed]
 * @returns {{tubeCoral:TubeCoral[],hangingPlants:HangingPlant[]}}
 */
export function createFlora(platforms, submergedIce, seed = 1) {
  if (!Number.isFinite(seed)) throw new TypeError("Flora seed must be a finite number.");
  const rng = random(seed ^ 0xf10aa);
  const ice = [...platforms, ...submergedIce];
  const spikeCache = new Map();
  const spikesFor = (floe) => {
    if (!spikeCache.has(floe.id)) spikeCache.set(floe.id, getIceSpikes(floe));
    return spikeCache.get(floe.id);
  };
  /** @type {TubeCoral[]} */
  const tubeCoral = [];
  for (let cluster = 0; cluster < 34; cluster++) {
    const nearWreck = cluster < 15;
    const angle = rng() * TAU, distance = 170 + rng() * 430;
    const centerX = nearWreck ? Math.cos(angle) * distance : -2550 + rng() * 3400;
    const centerY = nearWreck ? Math.sin(angle) * distance : -2450 + rng() * 4900;
    const count = 4 + Math.floor(rng() * 3);
    for (let index = 0; index < count; index++) {
      const heading = rng() * TAU, offset = index ? 12 + rng() * 17 : 0;
      const x = centerX + Math.cos(heading) * offset, y = centerY + Math.sin(heading) * offset;
      const radius = 4 + rng() * 7, height = 23 + rng() * 43;
      const z = getSeabedHeight(x, y);
      if (x + radius >= BLUE_OCEAN_START_X || z + height > WATER_LEVEL - 12
        || reservedRoute(x, y, radius + 20)) continue;
      const nearby = ice.filter((floe) => Math.abs(x - floe.x) <= floe.rx + radius
        && Math.abs(y - floe.y) <= floe.ry + radius);
      const clipsIce = nearby.some((floe) => {
        const top = floe.z ?? 0, bottom = top - getIceDepth(floe);
        for (let step = 0; step <= 5; step++) {
          const level = z + height * step / 5;
          if (level < bottom || level > top) continue;
          const section = getIceSection(floe, level - top);
          if ([[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius]]
            .some(([dx, dy]) => pointInPolygon(section, x + dx, y + dy))) return true;
        }
        return spikesFor(floe).some((spike) => spike.z - spike.length < z + height
          && Math.hypot(x - spike.x, y - spike.y) < radius + spike.radius + 4);
      });
      if (clipsIce || tubeCoral.some((tube) => Math.hypot(tube.x - x, tube.y - y) < tube.radius + radius + 2)) continue;
      tubeCoral.push({ id: `blue-tube-${tubeCoral.length}`, clusterId: `tube-cluster-${cluster}`,
        x, y, z, height, radius, seed: Math.floor(rng() * 0x100000000) });
    }
  }

  /** @type {HangingPlant[]} */
  const hangingPlants = [];
  const eligible = ice.filter((floe) => floe.id === "floe-0" || floe.kind === "glacier"
    || (floe.z !== undefined && getIceDepth(floe) >= 65));
  for (const floe of eligible) {
    const depth = getIceDepth(floe), vertices = getIceSection(floe, -depth);
    const z = (floe.z ?? 0) - depth;
    const target = floe.id === "floe-0" ? 6 : floe.kind === "glacier" ? 4 : 1;
    let placed = 0;
    for (let attempt = 0; attempt < 450 && placed < target; attempt++) {
      const edgeIndex = Math.floor(rng() * vertices.length);
      const a = vertices[edgeIndex], b = vertices[(edgeIndex + 1) % vertices.length];
      const along = rng(), fraction = 0.58 + rng() * 0.29;
      const x = floe.x + (a.x + (b.x - a.x) * along - floe.x) * fraction;
      const y = floe.y + (a.y + (b.y - a.y) * along - floe.y) * fraction;
      const width = floe.id === "floe-0" ? 3 + rng() * 3 : 5 + rng() * 6;
      const clearance = width + 5;
      if (x + clearance >= BLUE_OCEAN_START_X || !pointInPolygon(vertices, x, y)
        || (floe.id === "floe-0" && reservedRoute(x, y, clearance))) continue;
      if (Math.min(...vertices.map((p, index) => edgeDistance(x, y, p, vertices[(index + 1) % vertices.length]))) < clearance) continue;
      if (spikesFor(floe).some((spike) => Math.hypot(x - spike.x, y - spike.y) < spike.radius + clearance)) continue;
      if (hangingPlants.some((plant) => plant.platformId === floe.id
        && Math.hypot(x - plant.x, y - plant.y) < plant.width + clearance)) continue;
      const floor = Math.max(...[[0, 0], [clearance, 0], [-clearance, 0], [0, clearance], [0, -clearance]]
        .map(([dx, dy]) => getSeabedHeight(x + dx, y + dy)));
      const length = Math.min(32 + rng() * 48, z - floor - 12);
      if (length < 16) continue;
      hangingPlants.push({ id: `purple-hanging-${hangingPlants.length}`, platformId: floe.id,
        x, y, z, length, width, attachment: "underside", seed: Math.floor(rng() * 0x100000000) });
      placed++;
    }
  }
  return { tubeCoral, hangingPlants };
}

function instanced(parent, geometry, material, count, name, dynamic = false) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.receiveShadow = true;
  if (dynamic) mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // A moving frond can exceed its first-frame bounding sphere slightly.
  mesh.frustumCulled = !dynamic;
  parent.add(mesh);
  return mesh;
}

/** Dim tissue between fine luminous veins keeps each frond legible rather than
 * turning the whole leaf into an evenly emissive oval. The mask follows the
 * sphere's local X/Y leaf surface, including the reverse side.
 */
function leafVeinTexture() {
  const size = 128, bytes = new Uint8Array(size * size * 4);
  const band = (distance, width) => Math.exp(-((distance / width) ** 2));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / (size - 1), v = y / (size - 1);
    const px = -Math.cos(u * TAU) * Math.sin(v * Math.PI), py = Math.cos(v * Math.PI);
    let veins = band(py, 0.035);
    for (const root of [0.12, 0.34, 0.56]) {
      const along = Math.abs(px) - root;
      if (along < 0 || along > 0.27) continue;
      veins = Math.max(veins, band(py + Math.sign(px) * along * 1.65, 0.025) * (1 - along / 0.32));
    }
    const tissue = (Math.sin(px * 51 + py * 37) * Math.cos(py * 29) + 1) * 0.018;
    const value = Math.round(Math.min(1, 0.045 + tissue + veins * 0.9) * 255);
    bytes.set([value, value, value, 255], (y * size + x) * 4);
  }
  const texture = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true; texture.needsUpdate = true;
  return texture;
}

/** Ten instanced batches render detailed blue tubes and glowing purple fronds.
 * Animation uses the caller's simulation clock, so pausing also pauses the flora.
 */
export class FloraRenderer {
  /** @param {{tubeCoral?:TubeCoral[],hangingPlants?:HangingPlant[]}} world */
  constructor(world, sharedMaterials = {}) {
    this.group = new THREE.Group();
    this.group.name = "croba-arctic-flora";
    this.materials = {
      blue: new THREE.MeshStandardMaterial({ color: 0x237fa8, roughness: 0.82, emissive: 0x073045, emissiveIntensity: 0.035, vertexColors: true }),
      inner: new THREE.MeshStandardMaterial({ color: 0x021b2c, roughness: 0.95, side: THREE.BackSide, vertexColors: true }),
      rim: new THREE.MeshStandardMaterial({ color: 0x328fb0, roughness: 0.76, emissive: 0x092d3f, emissiveIntensity: 0.025, vertexColors: true }),
      dark: new THREE.MeshBasicMaterial({ color: 0x010811 }),
      vine: new THREE.MeshStandardMaterial({ color: 0x8134cf, roughness: 0.55, emissive: 0x6419bc, emissiveIntensity: 0.75 }),
      leaf: new THREE.MeshStandardMaterial({ color: 0xac55e9, roughness: 0.6, emissive: 0x7a24d5, emissiveIntensity: 0.8 }),
      bulb: new THREE.MeshStandardMaterial({ color: 0xbe79ff, emissive: 0x983cff, emissiveIntensity: 1.6, roughness: 0.4 }),
      vein: new THREE.MeshStandardMaterial({ color: 0xc188ff, emissive: 0x7f32d7, emissiveIntensity: 1.1, roughness: 0.45 }),
      halo: new THREE.MeshBasicMaterial({ color: 0x9034ff, transparent: true, opacity: 0.07,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    };
    this.surfaceMaps = { tube: createCreatureSurfaceMaps("tube-coral"), plant: createCreatureSurfaceMaps("skin") };
    for (const texture of this.surfaceMaps.tube.textures) texture.repeat.set(2, 3);
    for (const texture of this.surfaceMaps.plant.textures) texture.repeat.set(2, 2);
    for (const material of [this.materials.blue, this.materials.rim, this.materials.inner])
      applyCreatureSurface(material, this.surfaceMaps.tube, material === this.materials.blue ? 0.38 : material === this.materials.rim ? 0.28 : 0.18);
    for (const material of [this.materials.vine, this.materials.leaf, this.materials.bulb, this.materials.vein])
      applyCreatureSurface(material, this.surfaceMaps.plant, 0.28);
    this.leafEmission = leafVeinTexture();
    this.materials.leaf.emissiveMap = this.leafEmission;
    this.materials.vine.emissiveMap = this.surfaceMaps.plant.map;
    this.materials.bulb.emissiveMap = this.surfaceMaps.plant.map;
    this.materials.ridge = this.materials.blue.clone();
    this.materials.ridge.emissiveIntensity = 0.025;
    this.geometries = {
      ...createTubeCoralAnatomy(),
      stem: new THREE.CylinderGeometry(0.7, 1, 1, 5),
      leaf: new THREE.SphereGeometry(1, 8, 5),
      bulb: new THREE.IcosahedronGeometry(1, 1),
      halo: new THREE.SphereGeometry(1, 8, 5),
    };
    const tubes = world.tubeCoral ?? [];
    this.tubes = {
      outer: instanced(this.group, this.geometries.outer, this.materials.blue, tubes.length, "blue-hollow-tube-walls"),
      inner: instanced(this.group, this.geometries.inner, this.materials.inner, tubes.length, "dark-inner-tube-walls"),
      rim: instanced(this.group, this.geometries.rim, this.materials.rim, tubes.length, "open-blue-tube-rims"),
      bottom: instanced(this.group, this.geometries.bottom, this.materials.dark, tubes.length, "deep-tube-interiors"),
    };
    this.ridges = instanced(this.group, this.geometries.ridge, this.materials.ridge, tubes.length, "blue-tube-organic-growth-scars");
    this.transform = new THREE.Object3D();
    this.leafMatrix = new THREE.Matrix4();
    this.up = new THREE.Vector3(0, 1, 0);
    this.direction = new THREE.Vector3();
    this.start = new THREE.Vector3();
    this.end = new THREE.Vector3();
    tubes.forEach((tube, index) => {
      const rng = random(tube.seed);
      const tint = new THREE.Color().setScalar(0.78 + rng() * 0.22);
      this.transform.position.set(tube.x / SCALE, tube.z / SCALE, tube.y / SCALE);
      this.transform.rotation.set(0, rng() * TAU, 0);
      this.transform.scale.set(tube.radius / SCALE, tube.height / SCALE, tube.radius / SCALE);
      this.transform.updateMatrix();
      for (const mesh of Object.values(this.tubes)) {
        mesh.setMatrixAt(index, this.transform.matrix);
        if (mesh !== this.tubes.bottom) mesh.setColorAt(index, tint);
      }
      this.ridges.setMatrixAt(index, this.transform.matrix);
      this.ridges.setColorAt(index, tint);
    });
    for (const mesh of [...Object.values(this.tubes), this.ridges]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    this.fronds = [];
    for (const plant of world.hangingPlants ?? []) {
      const rng = random(plant.seed);
      for (let index = 0; index < 4; index++) {
        this.fronds.push({ plant, phase: rng() * TAU, angle: index * TAU / 4 + rng() * 0.4,
          length: plant.length * (0.73 + index * 0.09), spread: plant.width * (0.45 + rng() * 0.35) });
      }
    }
    this.stems = instanced(this.group, this.geometries.stem, this.materials.vine, this.fronds.length * 5, "purple-dangling-vines", true);
    this.leaves = instanced(this.group, this.geometries.leaf, this.materials.leaf, this.fronds.length * 3, "purple-hanging-fronds", true);
    this.bulbs = instanced(this.group, this.geometries.bulb, this.materials.bulb, this.fronds.length * 3, "purple-glowing-bulbs", true);
    this.veins = instanced(this.group, this.geometries.stem, this.materials.vein, this.fronds.length * 12, "luminous-purple-leaf-veins", true);
    this.halos = instanced(this.group, this.geometries.halo, this.materials.halo, this.fronds.length, "purple-bioluminescent-halos", true);
    this.disposed = false;
    this.poseTime = undefined;
    this.update(0, true);
  }

  point(frond, fraction, time, target) {
    const { plant } = frond;
    const bend = Math.sin(fraction * Math.PI * 0.8) * frond.spread;
    const sway = Math.sin(time * 0.7 + frond.phase) * 2.5 * fraction;
    return target.set((plant.x + Math.cos(frond.angle) * bend + sway) / SCALE,
      (plant.z - frond.length * fraction) / SCALE,
      (plant.y + Math.sin(frond.angle) * bend + sway * 0.6) / SCALE);
  }

  /** @param {number} time @param {boolean} [reducedMotion] @param {THREE.Vector3} [_cameraPosition] */
  update(time, reducedMotion = false, cameraPosition,quality={}) {
    if (this.disposed) return;
    const animation = reducedMotion || !Number.isFinite(time) ? 0 : time;
    const range=capRenderDistance(quality,80);
    if(animation===this.poseTime&&range===this.cullRange&&(!cameraPosition||this.lastCamera&&cameraPosition.distanceToSquared(this.lastCamera)<.16))return;
    this.lastCamera=cameraPosition?.clone();this.cullRange=range;
    let visibleFronds=0;
    this.fronds.forEach(frond => {
      if(cameraPosition&&Math.hypot(frond.plant.x/SCALE-cameraPosition.x,frond.plant.z/SCALE-cameraPosition.y,frond.plant.y/SCALE-cameraPosition.z)>range+frond.length/SCALE)return;
      const index=visibleFronds++;
      for (let section = 0; section < 5; section++) {
        const a = this.point(frond, section / 5, animation, this.start);
        const b = this.point(frond, (section + 1) / 5, animation, this.end);
        this.direction.subVectors(b, a);
        const length = this.direction.length();
        this.transform.position.copy(a).add(b).multiplyScalar(0.5);
        this.transform.quaternion.setFromUnitVectors(this.up, this.direction.divideScalar(length));
        this.transform.scale.set(0.026, length, 0.026);
        this.transform.updateMatrix();
        this.stems.setMatrixAt(index * 5 + section, this.transform.matrix);
      }
      for (let leaf = 0; leaf < 3; leaf++) {
        const fraction = 0.35 + leaf * 0.23;
        this.transform.position.copy(this.point(frond, fraction, animation, this.start));
        this.transform.rotation.set(0.3, frond.angle, leaf % 2 ? -0.5 : 0.5);
        this.transform.scale.set(frond.plant.width / SCALE * 0.36, 0.17, 0.035);
        this.transform.updateMatrix();
        this.leaves.setMatrixAt(index * 3 + leaf, this.transform.matrix);
        this.leafMatrix.copy(this.transform.matrix);
        for (const [vein, [a, b]] of LEAF_VEINS.entries()) {
          this.start.set(...a).applyMatrix4(this.leafMatrix);
          this.end.set(...b).applyMatrix4(this.leafMatrix);
          this.direction.subVectors(this.end, this.start);
          const length = this.direction.length();
          this.transform.position.copy(this.start).add(this.end).multiplyScalar(0.5);
          this.transform.quaternion.setFromUnitVectors(this.up, this.direction.divideScalar(length));
          this.transform.scale.set(0.0035, length, 0.0035);
          this.transform.updateMatrix(); this.veins.setMatrixAt(index * 12 + leaf * 4 + vein, this.transform.matrix);
        }
      }
      this.transform.position.copy(this.point(frond, 1, animation, this.start));
      this.transform.quaternion.identity();
      this.transform.scale.setScalar(0.095);
      this.transform.updateMatrix(); this.bulbs.setMatrixAt(index * 3, this.transform.matrix);
      this.transform.scale.setScalar(0.24);
      this.transform.updateMatrix(); this.halos.setMatrixAt(index, this.transform.matrix);
      for (let node = 1; node <= 2; node++) {
        this.transform.position.copy(this.point(frond, node * 0.32, animation, this.start));
        this.transform.scale.setScalar(0.035);
        this.transform.updateMatrix(); this.bulbs.setMatrixAt(index * 3 + node, this.transform.matrix);
      }
    });
    for (const [mesh,multiplier] of [[this.stems,5],[this.leaves,3],[this.veins,12],[this.bulbs,3],[this.halos,1]]){mesh.count=visibleFronds*multiplier;mesh.instanceMatrix.needsUpdate=true;}
    this.poseTime = animation;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const mesh of [...Object.values(this.tubes), this.ridges, this.stems, this.leaves, this.veins, this.bulbs, this.halos]) mesh.dispose();
    Object.values(this.geometries).forEach((geometry) => geometry.dispose());
    Object.values(this.materials).forEach((material) => material.dispose());
    Object.values(this.surfaceMaps).forEach((maps) => maps.dispose());
    this.leafEmission.dispose();
    this.group.removeFromParent(); this.group.clear();
  }
}
