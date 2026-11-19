import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import { createCreatureSurfaceMaps, applyCreatureSurface } from './creature-materials.js';
import { fogVisibilityDepth, sphereViewDepth } from './render-visibility.js';
import { createCrabAnatomy, CRAB_LEG_REST, CRAB_CLAW_ROOTS,
  CRAB_PINCER_HINGES, CRAB_SHELL_MOUNT } from './crab-anatomy.js';
import { createCrabCarriedShell } from './crab-shell.js';
import { CRAB_SIZE, getCrabScale } from './crab-size.js';
import { createCrabShellPlants } from './crab-shell-plants.js';
import { getCrabMotionPose, getCrabLegWorldPath } from './crab-movement.js';

const WORLD_SCALE = 25, UP = new THREE.Vector3(0, 1, 0);
/** @typedef {{id:string,x:number,y:number,z:number,seed:number,scale:number,habitat:string,heading?:number,squidHeldBy?:string,squidRespawnIn?:number}} CrabDescriptor */
/** @typedef {{cameraDirection?:{x:number,y:number,z:number},fogDensity?:number}} CrabVisibility */

function mesh(parent, geometry, material, name, position = [0, 0, 0]) {
  const part = new THREE.Mesh(geometry, material);
  part.name = name; part.position.fromArray(position); parent.add(part); return part;
}
function instances(parent, geometry, material, count, name) {
  const part = new THREE.InstancedMesh(geometry, material, count);
  part.name = name; part.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Articulated poses stay in this conservative local volume; no per-frame scans.
  part.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, .65, 0), 1.1);
  parent.add(part); return part;
}
function transforms() {
  return { a: new THREE.Vector3(), b: new THREE.Vector3(), direction: new THREE.Vector3(),
    scale: new THREE.Vector3(), rotation: new THREE.Quaternion(), matrix: new THREE.Matrix4(),
    inverse: new THREE.Matrix4(), points: Array.from({ length: 4 }, () => [0, 0, 0]),
    local: Array.from({ length: 4 }, () => new THREE.Vector3()) };
}
/** The anatomical bone runs from local Y=0 to Y=1, rooted at its joint. */
function segment(batch, index, a, b, radius, scratch) {
  scratch.direction.subVectors(b, a); const length = scratch.direction.length();
  scratch.rotation.setFromUnitVectors(UP, scratch.direction.divideScalar(length || 1));
  scratch.scale.set(radius, Math.max(length, 1e-6), radius);
  scratch.matrix.compose(a, scratch.rotation, scratch.scale); batch.setMatrixAt(index, scratch.matrix);
}
function joint(batch, index, point, radius, scratch) {
  scratch.rotation.identity(); scratch.scale.setScalar(radius);
  scratch.matrix.compose(point, scratch.rotation, scratch.scale); batch.setMatrixAt(index, scratch.matrix);
}
function createCrab(descriptor, geometry, materials) {
  const root = new THREE.Group(); root.name = descriptor.id;
  for (const part of ['carapace', 'underside', 'eyestalks', 'mouthparts'])
    mesh(root, geometry[part], materials.chitin, `red-${part}`);
  mesh(root, geometry.eyes, materials.eyeGlow, 'black-stalked-eyes');
  mesh(root, geometry.shell, materials.shell, 'carried-spiral-shell', CRAB_SHELL_MOUNT);
  mesh(root, geometry.shellPlants, materials.shellPlants, 'living-shell-plants', CRAB_SHELL_MOUNT);
  const legs = instances(root, geometry.legSegment, materials.chitin, 24, 'eight-articulated-legs');
  const joints = instances(root, geometry.joint, materials.chitin, 24, 'leg-joints');
  const tips = instances(root, geometry.legTip, materials.chitin, 8, 'pointed-walking-feet');
  const arms = instances(root, geometry.legSegment, materials.chitin, 4, 'jointed-claw-arms');
  const fingers = instances(root, geometry.clawMovingFinger, materials.chitin, 6, 'six-moving-pincer-fingers');
  const claws = CRAB_CLAW_ROOTS.map((rest, index) => {
    const group = new THREE.Group(); group.name = index ? 'claw-right' : 'claw-left';
    group.position.fromArray(rest.palm); group.rotation.y = rest.yaw;
    group.scale.setScalar(rest.scale); root.add(group);
    mesh(group, geometry.clawPalm, materials.chitin, 'hard-claw-palm');
    mesh(group, geometry.clawFixedFinger, materials.chitin, 'pincer-fixed-finger');
    const hinges = CRAB_PINCER_HINGES.map((layout) => {
      const frame = new THREE.Group(); frame.name = `pincer-${layout.name}-frame`;
      frame.position.fromArray(layout.position); frame.rotation.z = layout.roll; group.add(frame);
      const hinge = new THREE.Group();
      hinge.name = layout.name === 'top' ? 'pincer-moving-hinge' : `pincer-${layout.name}-hinge`;
      frame.add(hinge); return hinge;
    });
    return { group, hinge: hinges[0], hinges };
  });
  const shadow = mesh(root, geometry.shadow, materials.contactShadow, 'soft-contact-shadow', [0, .005, 0]);
  shadow.rotation.x = -Math.PI / 2; shadow.scale.set(.61, .46, 1);
  return { descriptor, root, legs, joints, tips, arms, fingers, claws, shadow, scratch: transforms(), pose: {},
    localBounds: new THREE.Sphere(new THREE.Vector3(0, CRAB_SIZE.totalHeight * .5, 0), 1.16) };
}
function syncRoot(crab) {
  const { descriptor, root, pose } = crab;
  getCrabMotionPose(descriptor, pose);
  root.position.set(descriptor.x / WORLD_SCALE,
    descriptor.z / WORLD_SCALE + (pose.bodyOffsetMeters || 0), descriptor.y / WORLD_SCALE);
  root.scale.setScalar(getCrabScale(descriptor)); root.quaternion.fromArray(pose.orientation);
  crab.shadow.visible = !descriptor.squidHeldBy;
  root.updateWorldMatrix(true, false);
}
function poseCrab(crab, time, reducedMotion) {
  const { descriptor, root, legs, joints, tips, arms, fingers, claws, scratch } = crab;
  scratch.inverse.copy(root.matrixWorld).invert();
  for (let index = 0; index < 8; index++) {
    getCrabLegWorldPath(descriptor, index, scratch.points);
    for (let point = 0; point < 4; point++) {
      const [x, y, z] = scratch.points[point];
      scratch.local[point].set(x / WORLD_SCALE, z / WORLD_SCALE, y / WORLD_SCALE).applyMatrix4(scratch.inverse);
    }
    const path = scratch.local, radii = CRAB_LEG_REST[index].radii;
    for (let bone = 0; bone < 3; bone++) {
      segment(legs, index * 3 + bone, path[bone], path[bone + 1], radii[bone], scratch);
      joint(joints, index * 3 + bone, path[bone], radii[bone] * 1.12, scratch);
    }
    // Small distal hooks meet the same physical toe, without extending its span.
    scratch.a.copy(path[3]).lerp(path[2], .19);
    segment(tips, index, scratch.a, path[3], .0045, scratch);
  }
  CRAB_CLAW_ROOTS.forEach((rest, index) => {
    for (let bone = 0; bone < 2; bone++) {
      scratch.a.fromArray(rest.arm[bone]); scratch.b.fromArray(rest.arm[bone + 1]);
      segment(arms, index * 2 + bone, scratch.a, scratch.b, rest.radii[bone], scratch);
    }
    const angle = reducedMotion ? .09 : .09 + (1 + Math.sin(time * .8 + index * 1.7)) * .155;
    for (const [finger, hinge] of claws[index].hinges.entries()) {
      hinge.rotation.x = angle;
      hinge.updateWorldMatrix(true, false);
      scratch.matrix.multiplyMatrices(scratch.inverse, hinge.matrixWorld);
      fingers.setMatrixAt(index * 3 + finger, scratch.matrix);
    }
  });
  for (const batch of [legs, joints, tips, arms, fingers]) batch.instanceMatrix.needsUpdate = true;
}

/** Small red seabed decapods with rigid shells and simulation-driven walking. */
export class CrabColony {
  /** @param {CrabDescriptor[]} descriptors @param {Record<string,THREE.Material>} [sharedMaterials]
   * @param {{mobile?:boolean}} [quality] */
  constructor(descriptors, sharedMaterials = {}, quality = {}) {
    if (!Array.isArray(descriptors)) throw new TypeError('CrabColony requires an array of crab descriptors.');
    descriptors.forEach((descriptor, index) => {
      if (![descriptor?.x, descriptor?.y, descriptor?.z].every(Number.isFinite))
        throw new TypeError(`Crab ${descriptor?.id || index} needs finite x, y, and z coordinates.`);
      if (descriptor.scale !== undefined && (!Number.isFinite(descriptor.scale) || descriptor.scale <= 0))
        throw new RangeError(`Crab ${descriptor.id || index} needs a positive scale.`);
      if (descriptor.heading !== undefined && !Number.isFinite(descriptor.heading))
        throw new TypeError(`Crab ${descriptor.id || index} needs a finite heading.`);
    });
    this.group = new THREE.Group(); this.group.name = 'red-root-crab-colony';
    this.geometries = { ...createCrabAnatomy(quality), shell: createCrabCarriedShell(quality), shellPlants: createCrabShellPlants(quality),
      shadow: new THREE.PlaneGeometry(1, 1) };
    this.ownedMaterials = []; this.ownedTextures = [];
    const own = (name, options) => {
      const material = sharedMaterials[name]?.clone() ?? new THREE.MeshPhysicalMaterial(options);
      this.ownedMaterials.push(material); return material;
    };
    this.materials = {
      chitin: own('chitin', { color: 0xffffff, roughness: .48, metalness: .02 }),
      shell: own('shell', { color: 0xffffff, roughness: .4, metalness: .42 }),
      shellPlants: own('shellPlants', { color: 0xffffff, vertexColors: true,
        roughness: .7, metalness: 0, side: THREE.DoubleSide }),
      eyeGlow: own('eyeGlow', { color: 0xffffff, roughness: .12, metalness: 0 }),
    };
    this.surfaceMaps = { armor: createCreatureSurfaceMaps('armor') };
    for (const material of [this.materials.chitin, this.materials.shell]) {
      if (!material.map || !material.normalMap || !material.roughnessMap)
        applyCreatureSurface(material, this.surfaceMaps.armor, material === this.materials.shell ? .16 : .3);
      material.color.set(0xffffff); material.vertexColors = true; material.flatShading = false;
      material.emissive?.set(0); material.emissiveIntensity = 0; material.metalness = .02;
      if (material.isMeshPhysicalMaterial) { material.clearcoat = .23; material.clearcoatRoughness = .32; }
    }
    // Scene chitin albedo already contains red pigment. Keep borrowed relief,
    // but apply baked red/tan pigment only once through neutral body/shell albedo.
    this.materials.chitin.map = this.materials.shell.map = this.surfaceMaps.armor.map;
    this.materials.chitin.normalScale?.setScalar(.3);
    const shell = this.materials.shell;
    shell.roughness = .4; shell.metalness = .42;
    if (shell.isMeshPhysicalMaterial) { shell.clearcoat = .38; shell.clearcoatRoughness = .25; }
    const eye = this.materials.eyeGlow;
    eye.color.set(0xffffff); eye.vertexColors = true; eye.emissive?.set(0); eye.emissiveIntensity = 0;
    eye.map = eye.normalMap = eye.roughnessMap = eye.emissiveMap = null;
    eye.roughness = .12; eye.metalness = 0;
    if (eye.isMeshPhysicalMaterial) { eye.clearcoat = .8; eye.clearcoatRoughness = .08; }
    const pixels = new Uint8Array(32 * 32 * 4);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const alpha = Math.round(Math.max(0, 1 - Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5)) ** 1.6 * 255);
      pixels.set([alpha, alpha, alpha, 255], (y * 32 + x) * 4);
    }
    const shadowMap = new THREE.DataTexture(pixels, 32, 32); shadowMap.needsUpdate = true;
    shadowMap.magFilter = THREE.LinearFilter; this.ownedTextures.push(shadowMap);
    this.materials.contactShadow = new THREE.MeshBasicMaterial({ color: 0x102e33,
      alphaMap: shadowMap, transparent: true, opacity: .27, depthWrite: false });
    this.ownedMaterials.push(this.materials.contactShadow);
    this.crabs = descriptors.map(descriptor => {
      const crab = createCrab(descriptor, this.geometries, this.materials);
      this.group.add(crab.root); syncRoot(crab); poseCrab(crab, 0, true); return crab;
    });
    this.visibilitySphere = new THREE.Sphere(); this.viewDirection = new THREE.Vector3();
    this.visibleCrabs = []; this.disposed = false; this.time = 0;
  }
  /** @param {number} time @param {number} dt @param {boolean} [reducedMotion]
   * @param {THREE.Vector3} [cameraPosition] @param {{mobile?:boolean}} [quality]
   * @param {CrabVisibility} [visibility] */
  update(time, dt, reducedMotion = false, cameraPosition, quality = {}, visibility) {
    if (this.disposed || !Number.isFinite(time) || !Number.isFinite(dt) || dt < 0) return;
    if (dt > 0) this.time = time;
    const direction = visibility?.cameraDirection;
    const length = direction && Math.hypot(direction.x, direction.y, direction.z);
    const fogDepth = cameraPosition && Number.isFinite(length) && length > 1e-8
      ? fogVisibilityDepth(visibility.fogDensity, .002) : Infinity;
    if (Number.isFinite(fogDepth)) this.viewDirection.copy(direction).multiplyScalar(1 / length);
    this.visibleCrabs.length = 0;
    for (const crab of this.crabs) {
      // Position is authoritative even while culled, held, or returning as prey.
      syncRoot(crab);
      crab.viewDistanceSquared = cameraPosition ? crab.root.position.distanceToSquared(cameraPosition) : 0;
      crab.root.visible = !(crab.descriptor.squidRespawnIn > 0) &&
        (!cameraPosition || crab.viewDistanceSquared < capRenderDistance(quality,quality?.mobile ? 65 : 125) ** 2);
      if (crab.root.visible && Number.isFinite(fogDepth)) {
        this.visibilitySphere.copy(crab.localBounds).applyMatrix4(crab.root.matrixWorld);
        crab.root.visible = sphereViewDepth(this.visibilitySphere.center, this.visibilitySphere.radius,
          cameraPosition, this.viewDirection) <= fogDepth;
      }
      if (crab.root.visible) this.visibleCrabs.push(crab);
    }
    const budget = cameraPosition ? (quality?.mobile ? 4 : 8) : Infinity;
    if (cameraPosition) this.visibleCrabs.sort((a, b) => a.viewDistanceSquared - b.viewDistanceSquared);
    for (let index = 0; index < this.visibleCrabs.length; index++) {
      const crab = this.visibleCrabs[index]; crab.root.visible = index < budget;
      if (crab.root.visible && (dt > 0 || reducedMotion)) poseCrab(crab, this.time, reducedMotion);
    }
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.group.traverse(object => { if (object.isInstancedMesh) object.dispose(); });
    Object.values(this.geometries).forEach(geometry => geometry.dispose());
    this.ownedMaterials.forEach(material => material.dispose());
    this.ownedTextures.forEach(texture => texture.dispose());
    Object.values(this.surfaceMaps).forEach(maps => maps.dispose());
    this.group.removeFromParent(); this.group.clear();
  }
}
