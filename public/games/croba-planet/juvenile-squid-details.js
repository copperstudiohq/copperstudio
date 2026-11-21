import * as THREE from './vendor/three.module.js';
import { capRenderDistance } from './render-distance.js';
import { getSquidOrientation } from './squid-frame.js';
import { getSquidPropulsionState } from './squid-propulsion-anatomy.js';
import { getSquidBlink } from './squid-eyelids.js';
import { flattenHeadGeometry } from './adult-head-shape.js';
import { cutSquidMouthOpening } from './squid-throat.js';
import { cutSquidArmorChannel } from './squid-side-armor.js';
import { createSquidJawGeometry, createSquidMandibleGeometry, createSquidCollarGeometry,
  createSquidCarapaceGeometry } from './adult-squid-details.js';
import { JUVENILE_SQUID_RADIUS_SCALE as RADIUS_SCALE, JUVENILE_SQUID_HEAD_Y_SCALE as HEIGHT,
  JUVENILE_SQUID_HEAD_SIDE_RATIO as SIDE_RATIO, JUVENILE_SQUID_EYE_SCALE as EYE_SCALE,
  JUVENILE_SQUID_EYE_LAYOUT as EYES, JUVENILE_SQUID_MOUTH_LOCAL as MOUTH } from './juvenile-squid-anatomy.js';

const SCALE = 25;
const FORWARD = new THREE.Vector3(0, 0, 1);
const finitePoint = point => Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
const valid = squid => finitePoint(squid) && typeof squid.id === 'string'
  && Number.isFinite(squid.headRadius) && squid.headRadius > 0;
const COUNTS = Object.freeze({ carapace: 1, collar: 1, mandibles: 2, jaws: 2, eyelids: 8 });

function material(source, name, color = 0xffffff) {
  const result = source?.isMeshStandardMaterial ? source.clone() : new THREE.MeshStandardMaterial();
  result.name = name; result.color.setHex(color); result.vertexColors = true;
  result.roughness = .95; result.metalness = 0; result.emissive.setHex(0); result.emissiveIntensity = 0;
  result.side = THREE.DoubleSide;
  return result;
}

function eyelidGeometry() {
  const geometry = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const points = geometry.attributes.position, colors = [], blue = new THREE.Color(0x3078bd);
  for (let vertex = 0; vertex < points.count; vertex++) {
    const fold = Math.sin(Math.acos(Math.min(1, points.getY(vertex))) * 16);
    points.setZ(vertex, points.getZ(vertex) * (1 + .045 * fold));
    const shade = .88 + .12 * fold;
    colors.push(blue.r * shade, blue.g * shade, blue.b * shade);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  geometry.userData.foldedSkin = true;
  return geometry;
}

/** Adult-family relief shared across the entire juvenile population. Five
 * instanced draws borrow the parent's maps; no individual throats, textures,
 * lights, or animal-specific material/geometry clones are created.
 */
export class JuvenileSquidDetails {
  constructor(world = {}, materials = {}) {
    this.group = new THREE.Group(); this.group.name = 'juvenile-crobonic-family-details';
    this.group.userData = { instanceBatches: 5, borrowedMaps: true, blinkClock: 'motion.time' };
    this.renderers = new Map(); this.batches = {}; this.geometries = {}; this.materials = {};
    this.disposed = false;
    this.body = new THREE.Object3D(); this.transform = new THREE.Object3D(); this.matrix = new THREE.Matrix4();
    this.normal = new THREE.Vector3(); this.rotation = new THREE.Quaternion(); this.offset = new THREE.Vector3();
    this.blinkActor = { seed: 0, propulsionTime: 0 };
    for (const squid of world.squids ?? []) if (valid(squid)) this.renderers.set(squid.id, { slot: -1, visible: false });
    if (!this.renderers.size) { this.group.visible = false; return; }
    this.geometries = { carapace: createSquidCarapaceGeometry(2), collar: createSquidCollarGeometry(2, 12),
      mandible: createSquidMandibleGeometry(true, 12), jaw: createSquidJawGeometry(6), eyelid: eyelidGeometry() };
    for (const name of ['carapace', 'collar']) {
      flattenHeadGeometry(this.geometries[name], SIDE_RATIO);
      cutSquidMouthOpening(this.geometries[name]);
    }
    const originalShell = this.geometries.carapace;
    this.geometries.carapace = cutSquidArmorChannel(originalShell, SIDE_RATIO);
    originalShell.dispose();
    const uv = this.geometries.jaw.attributes.uv;
    for (let vertex = 0; vertex < uv.count; vertex++) uv.setXY(vertex, (uv.getX(vertex) + .23) / .46, (uv.getY(vertex) + .11) / .29);
    uv.needsUpdate = true;
    this.materials = { shell: material(materials.gray ?? materials.blue, 'juvenile-blue-plated-shell'),
      collar: material(materials.armor, 'juvenile-flesh-plated-belly'),
      mandibles: material(materials.gray ?? materials.blue, 'juvenile-hard-blue-mandibles'),
      jaws: material(materials.beak, 'juvenile-dark-hooked-beak', 0x18202d),
      eyelids: material(materials.blue ?? materials.gray, 'juvenile-folded-blue-eyelids') };
    this.materials.mandibles.flatShading = true;
    this.materials.jaws.vertexColors = false; this.materials.jaws.side = THREE.FrontSide;
    this.materials.jaws.roughness = .5;
    const geometryNames = { carapace: 'carapace', collar: 'collar', mandibles: 'mandible', jaws: 'jaw', eyelids: 'eyelid' };
    const materialNames = { carapace: 'shell', collar: 'collar', mandibles: 'mandibles', jaws: 'jaws', eyelids: 'eyelids' };
    for (const name of Object.keys(COUNTS)) {
      const mesh = new THREE.InstancedMesh(this.geometries[geometryNames[name]], this.materials[materialNames[name]],
        this.renderers.size * COUNTS[name]);
      mesh.name = `juvenile-squid-${name}`; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.receiveShadow = true; mesh.castShadow = name !== 'eyelids';
      mesh.userData.instancesPerSquid = COUNTS[name];
      this.batches[name] = mesh; this.group.add(mesh);
    }
    this.update(world);
  }

  pose(mesh, slot) {
    this.transform.updateMatrix();
    this.matrix.multiplyMatrices(this.body.matrix, this.transform.matrix);
    mesh.setMatrixAt(slot, this.matrix);
  }

  /** @param {object} world @param {THREE.Vector3} [cameraPosition]
   * @param {{mobile?:boolean}} [quality] @param {boolean} [reducedMotion]
   * @param {(id:string)=>boolean} [visible] Parent colony visibility, when supplied.
   */
  update(world = {}, cameraPosition, quality, reducedMotion = false, visible) {
    if (this.disposed || !this.renderers.size) return;
    let count = 0;
    for (const [id, view] of this.renderers) {
      const squid = world.squids?.find(actor => actor?.id === id);
      view.visible = false; view.slot = -1;
      if (!valid(squid) || squid.squidRespawnIn > 0) continue;
      this.body.position.set(squid.x / SCALE, squid.z / SCALE, squid.y / SCALE);
      const cutoff = capRenderDistance(quality, quality?.mobile ? 60 : 100) + squid.lengthMeters;
      if (visible ? !visible(id) : finitePoint(cameraPosition) && this.body.position.distanceToSquared(cameraPosition) >= cutoff * cutoff) continue;
      view.visible = true; view.slot = count++;
      const radius = squid.headRadius / SCALE * RADIUS_SCALE;
      this.body.quaternion.copy(getSquidOrientation(squid));
      this.body.scale.set(radius, radius * HEIGHT, radius); this.body.updateMatrix();
      this.transform.position.set(0, 0, 0); this.transform.quaternion.identity(); this.transform.scale.set(1, 1, 1);
      this.pose(this.batches.carapace, view.slot);
      const breath = getSquidPropulsionState(squid).breath * (reducedMotion ? .2 : 1);
      this.transform.scale.set(1 + breath * .008, 1 + breath * .015, 1 + breath * .008);
      this.pose(this.batches.collar, view.slot);
      for (let half = 0; half < 2; half++) {
        this.transform.position.set(MOUTH[0], MOUTH[1] + (half ? -.08 : .11), 1.08 + breath * .02 - .015);
        this.transform.rotation.set(0, 0, half ? Math.PI : 0);
        this.transform.scale.set((half ? .94 : 1) * .83, (half ? .65 : .82) * .9, .8);
        this.pose(this.batches.jaws, view.slot * 2 + half);
        const side = half ? 1 : -1;
        this.transform.position.set(side * .60, -.28, .92);
        this.transform.rotation.set(0, side * .12, side * -1.1); this.transform.scale.set(1, 1, 1);
        this.pose(this.batches.mandibles, view.slot * 2 + half);
      }
      this.blinkActor.seed = squid.seed ?? 0; this.blinkActor.propulsionTime = squid.motion?.time ?? 0;
      const closure = getSquidBlink(this.blinkActor, reducedMotion);
      for (let eye = 0; eye < EYES.length; eye++) {
        const x = EYES[eye][0], y = EYES[eye][1], z = Math.sqrt(1 - x * x - y * y);
        this.normal.set(x, y / HEIGHT, z).normalize().multiplyScalar(.65).addScaledVector(FORWARD, .35).normalize();
        this.rotation.setFromUnitVectors(FORWARD, this.normal);
        for (let half = 0; half < 2; half++) {
          this.offset.set(0, (half ? -1 : 1) * .12 * (1 - closure), .020).multiplyScalar(EYE_SCALE).applyQuaternion(this.rotation);
          this.transform.position.set(x, y * HEIGHT, z + .09 * EYE_SCALE).add(this.offset);
          this.transform.position.y /= HEIGHT;
          this.transform.quaternion.copy(this.rotation);
          if (half) this.transform.rotateZ(Math.PI);
          if (closure > .001) this.transform.scale.set(.177 * EYE_SCALE, .133 * EYE_SCALE * closure / HEIGHT, .145 * EYE_SCALE);
          else this.transform.scale.set(0, 0, 0);
          this.pose(this.batches.eyelids, view.slot * 8 + eye * 2 + half);
        }
      }
    }
    for (const name of Object.keys(this.batches)) {
      const mesh = this.batches[name]; mesh.count = count * COUNTS[name]; mesh.visible = count > 0;
      mesh.instanceMatrix.needsUpdate = true;
      if (count) mesh.computeBoundingSphere();
    }
    this.group.visible = count > 0;
  }

  /** Borrowed texture maps and source materials remain owned by the parent. */
  dispose() {
    if (this.disposed) return; this.disposed = true;
    for (const mesh of Object.values(this.batches)) mesh.dispose();
    for (const geometry of Object.values(this.geometries)) geometry.dispose();
    for (const owned of Object.values(this.materials)) owned.dispose();
    this.group.removeFromParent(); this.group.clear(); this.renderers.clear();
  }
}
