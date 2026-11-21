import {capRenderDistance} from './render-distance.js';
import {cutSquidMouthOpening} from './squid-throat.js';
import { paintSquidMantleStripe } from './squid-side-armor.js';
import { flattenHeadGeometry, headSideRatio } from './adult-head-shape.js';
import { SquidPropulsion } from "./squid-propulsion.js";
import { getSquidPropulsionState } from "./squid-propulsion-anatomy.js";
import * as THREE from "./vendor/three.module.js";
import { getSquidOrientation } from "./squid-frame.js";
import { EYE_HEIGHT } from "./terrain.js";
import { createCreatureSurfaceMaps, applyCreatureSurface } from "./creature-materials.js";
import { AdultSquidDetails } from "./adult-squid-details.js";
import { JuvenileSquidDetails } from './juvenile-squid-details.js';
import { JUVENILE_SQUID_RADIUS_SCALE, JUVENILE_SQUID_HEAD_Y_SCALE,
  JUVENILE_SQUID_HEAD_SIDE_RATIO, JUVENILE_SQUID_EYE_SCALE,
  JUVENILE_SQUID_EYE_LAYOUT, JUVENILE_SQUID_MOUTH_LOCAL } from './juvenile-squid-anatomy.js';
import { ADULT_SQUID_EYE_SCALE, ADULT_SQUID_MOUTH_LOCAL, ADULT_SQUID_EYE_LAYOUT, getAdultSquidHeadYScale } from "./adult-squid-anatomy.js";

const SCALE = 25;
const ARMS = 8;
const LINKS = 8;
const PORES = 16;
const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);
const TAPER = 0.84;
const ARM_RADIUS = 0.108;
const ARMOR_PLATES = 8;
const BANDS_PER_ARM = 4;
const BAND_FRACTION = 0.28;
const BAND_START = (1 - BAND_FRACTION) / 2;
const BAND_END = (1 + BAND_FRACTION) / 2;

const finitePoint = (point) => Boolean(point && [point.x, point.y, point.z].every(Number.isFinite));

/** @typedef {{x:number,y:number,z:number}} Point3 */
/** @typedef {{id:string,x:number,y:number,z:number,heading:number,orientation?:{x:number,y:number,z:number,w:number},seed:number,headRadius:number,lengthMeters:number,noticedPlayer?:boolean,tentacles:Point3[][]}} Squid */
/** @typedef {{squids?:Squid[],adultSquids?:Squid[],player?:Point3,squidEncounter?:{squidId:string,phase:string,progress:number}|null}} SquidWorld */

/** A narrow horn jaw curls forward and down; rotating it about local Z
 * creates the matching lower jaw without changing the spherical head. */
function beakGeometry() {
  const shape = new THREE.Shape();
  const profile = [[-0.06, 0.025], [-0.04, 0.12], [0.02, 0.16], [0.16, 0.12],
    [0.28, 0.03], [0.24, 0.012], [0.15, 0.055], [0.04, 0.05]];
  profile.forEach(([forward, up], index) => index
    ? shape.lineTo(forward, up) : shape.moveTo(forward, up));
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.16, steps: 1,
    bevelEnabled: true, bevelSegments: 1, bevelSize: 0.009, bevelThickness: 0.009 })
    .translate(0, 0, -0.08).rotateY(-Math.PI / 2);
}

function batch(parent, geometry, material, count, name, shadows = false) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true;
  mesh.castShadow = shadows;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function validate(squid) {
  if (!squid || typeof squid.id !== "string"
    || ![squid.x, squid.y, squid.z, squid.headRadius].every(Number.isFinite)
    || squid.headRadius <= 0)
    throw new TypeError("A squid renderer needs a named animal with a finite position and positive head radius.");
  if (!Number.isFinite(headSideRatio(squid)) || headSideRatio(squid) <= 0 || headSideRatio(squid) > 1)
    throw new TypeError(`Squid ${squid.id} needs a head side ratio greater than zero and at most one.`);
  if (!Number.isFinite(getAdultSquidHeadYScale(squid)) || getAdultSquidHeadYScale(squid) <= 0)
    throw new TypeError(`Squid ${squid.id} needs a positive finite head height scale.`);
  if (squid.designVersion === 2 && [squid.armLength, squid.armRadius, squid.clawLength, squid.eyeScale]
    .some(value => !Number.isFinite(value) || value <= 0))
    throw new TypeError(`Redesigned squid ${squid.id} needs positive finite arm, claw and eye dimensions.`);
  if (!Array.isArray(squid.tentacles) || squid.tentacles.length !== ARMS
    || squid.tentacles.some((arm) => !Array.isArray(arm) || arm.length !== LINKS + 1
      || arm.some((point) => ![point.x, point.y, point.z].every(Number.isFinite))))
    throw new TypeError(`Squid ${squid.id} needs eight tentacles with nine finite physical points each.`);
}

/** Nine instanced batches render the colony, with a small adult-only detail group. Every arm follows live physics
 * points; the renderer never applies a separate swimming or sinusoidal pose.
 */
export class SquidRenderer {
  /** @param {SquidWorld} world */
  constructor(world, _materials = {}) {
    const squids = [...(world.squids ?? []), ...(world.adultSquids ?? [])];
    squids.forEach(validate);
    this.group = new THREE.Group();
    this.group.name = "arctic-round-headed-squids";
    this.surfaceMaps = { skin: createCreatureSurfaceMaps("scarred-armor", 128, 'classic-squid'), iris: createCreatureSurfaceMaps("collector-iris", 128),
      horn: createCreatureSurfaceMaps("horn", 128, 'classic-squid') };
    // Broad pigment patches and fine living-tissue relief use separate spatial
    // scales, sharing the same small maps across juveniles and the adult.
    this.surfaceMaps.skin.map.repeat.set(2, 2);
    this.surfaceMaps.skin.normalMap.repeat.set(4, 2);
    this.surfaceMaps.skin.roughnessMap.repeat.set(2, 2);
    this.surfaceMaps.horn.normalMap.repeat.set(4, 2);
    this.texture = this.surfaceMaps.skin.map;
    this.materials = {
      blue: new THREE.MeshPhysicalMaterial({ color: 0x267cda, map: this.texture,
        roughness: 0.95, clearcoat: 0.3, clearcoatRoughness: 0.3,
        emissive: 0x031745, emissiveIntensity: 0.16 }),
      pores: new THREE.MeshStandardMaterial({ color: 0x76b2ea, roughness: 0.95 }),
      black: new THREE.MeshPhysicalMaterial({ color: 0x01050a, roughness: 0.17,
        clearcoat: 0.65, clearcoatRoughness: 0.12 }),
      iris: new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xffffff,
        emissiveIntensity: 0.65, roughness: 0.26, clearcoat: 0.7, clearcoatRoughness: 0.14 }),
      beak: new THREE.MeshStandardMaterial({ color: 0x35291f, map: this.texture,
        roughness: 0.9, metalness: 0.04 }),
      gray: new THREE.MeshStandardMaterial({ color: 0x39424a, roughness: 0.95 }),
      armor: new THREE.MeshStandardMaterial({ color: 0xd6a885, map: this.texture,
        roughness: 0.95, metalness: 0.06 }),
      stripes: new THREE.MeshStandardMaterial({ color: 0x267fe3, roughness: 0.85,
        emissive: 0x126aa5, emissiveIntensity: 0.3 }),
    };
    for (const skin of [this.materials.blue, this.materials.gray, this.materials.pores, this.materials.stripes])
      applyCreatureSurface(skin, this.surfaceMaps.skin, skin === this.materials.blue ? 0.65 : 0.38);
    for (const horn of [this.materials.beak, this.materials.armor])
      applyCreatureSurface(horn, this.surfaceMaps.horn, 0.3);
    applyCreatureSurface(this.materials.iris, this.surfaceMaps.iris, 0.12);
    this.materials.blue.clearcoatNormalMap = this.surfaceMaps.skin.normalMap;
    this.materials.blue.clearcoatNormalScale.set(.18, .18);
    this.materials.iris.emissiveMap = this.surfaceMaps.iris.map;
    this.materials.iris.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\ntotalEmissiveRadiance*=vColor;\n#endif');
    };
    this.materials.iris.customProgramCacheKey=()=> 'croba-hunting-iris-v1';
    this.geometries = {
      head: new THREE.SphereGeometry(1, 40, 28),
      detail: new THREE.SphereGeometry(1, 12, 8),
      arm: new THREE.CylinderGeometry(TAPER, 1, 1, 16, 1, true),
      joint: new THREE.SphereGeometry(1, 12, 8),
      beak: beakGeometry(),
      armor: new THREE.SphereGeometry(1, 12, 6, 0, Math.PI / 4 * 0.88, 2.06, Math.PI - 2.06),
      stripe: new THREE.CylinderGeometry(1 - (1 - TAPER) * BAND_END,
        1 - (1 - TAPER) * BAND_START, 1, 10, 1, true),
    };
    const count = squids.length;
    this.heads = batch(this.group, this.geometries.head, this.materials.blue, count, "round-blue-squid-heads", true);
    this.pores = batch(this.group, this.geometries.detail, this.materials.pores, count * PORES, "pale-blue-head-pores");
    this.eyes = batch(this.group, this.geometries.detail, this.materials.iris, count * 4, "four-yellow-squid-eyes");
    this.irises = this.eyes;
    this.eyeTint=new THREE.Color();this.eyes.setColorAt(0,this.eyeTint.setHex(0xffd447));
    this.pupils = batch(this.group, this.geometries.detail, this.materials.black, count * 9, "black-squid-pupils-outlines-and-beak-seam");
    this.beaks = batch(this.group, this.geometries.beak, this.materials.beak, count * 2, "hooked-upper-and-lower-squid-beaks", true);
    this.arms = batch(this.group, this.geometries.arm, this.materials.gray, count * ARMS * LINKS, "eight-gray-squid-tentacles", true);
    this.joints = batch(this.group, this.geometries.joint, this.materials.gray, count * ARMS * (LINKS + 1), "continuous-tentacle-joints");
    this.armor = batch(this.group, this.geometries.armor, this.materials.armor,
      count * ARMOR_PLATES, "peach-ventral-armor-plates", true);
    this.stripes = batch(this.group, this.geometries.stripe, this.materials.stripes,
      count * ARMS * BANDS_PER_ARM, "blue-tentacle-bands");
    this.batches = [
      [this.heads, 1], [this.pores, PORES], [this.eyes, 4], [this.pupils, 9], [this.beaks, 2],
      [this.arms, ARMS * LINKS], [this.joints, ARMS * (LINKS + 1)],
      [this.armor, ARMOR_PLATES], [this.stripes, ARMS * BANDS_PER_ARM],
    ];
    const flatAdult = (world.adultSquids ?? []).find(squid => headSideRatio(squid) < 1);
    if (flatAdult) {
      this.geometries.flatHead = paintSquidMantleStripe(cutSquidMouthOpening(flattenHeadGeometry(this.geometries.head.clone(), headSideRatio(flatAdult))));
      this.materials.adultBlue = this.materials.blue.clone();
      this.materials.adultBlue.vertexColors = true;
      this.flatHeads = batch(this.group, this.geometries.flatHead, this.materials.adultBlue, count, "flat-sided-adult-mantles", true);
      this.batches.push([this.flatHeads, 1]);
    }
    if (world.squids?.length) {
      this.geometries.juvenileHead = paintSquidMantleStripe(flattenHeadGeometry(
        this.geometries.head.clone(), JUVENILE_SQUID_HEAD_SIDE_RATIO));
      this.materials.juvenileBlue = this.materials.blue.clone();
      this.materials.juvenileBlue.vertexColors = true;
      this.juvenileHeads = batch(this.group, this.geometries.juvenileHead,
        this.materials.juvenileBlue, count, 'oval-armored-juvenile-mantles', true);
      this.batches.push([this.juvenileHeads, 1]);
    }
    const adultIds = new Set((world.adultSquids ?? []).map((squid) => squid.id));
    this.renderers = new Map(squids.map((squid, index) =>
      [squid.id, { index, adult: adultIds.has(squid.id), visible: true }]));
    // Per-animal pigment keeps the peaceful juveniles bright and gives the lone
    // adult an aged midnight-blue mantle without another body draw or texture.
    for (const [mesh, perAnimal, tint] of [
      [this.heads, 1, 0x91abc5], [this.pores, PORES, 0x7894b0],
      [this.arms, ARMS * LINKS, 0xb2bbc9], [this.joints, ARMS * (LINKS + 1), 0xb2bbc9],
      [this.armor, ARMOR_PLATES, 0xcbb19c], [this.stripes, ARMS * BANDS_PER_ARM, 0xa0bbda],
    ]) {
      for (const { index, adult } of this.renderers.values()) for (let part = 0; part < perAnimal; part++)
        mesh.setColorAt(index * perAnimal + part, new THREE.Color(adult ? tint : 0xffffff));
    }
    if (this.flatHeads) for (const { index, adult } of this.renderers.values())
      this.flatHeads.setColorAt(index, new THREE.Color(adult ? 0x91abc5 : 0xffffff));
    this.propulsion = new SquidPropulsion(squids, this.materials);
    this.group.add(this.propulsion.group);
    this.adultDetails = new AdultSquidDetails(world, this.materials);
    if (adultIds.size) this.group.add(this.adultDetails.group);
    this.juvenileDetails = new JuvenileSquidDetails(world, this.materials);
    this.group.add(this.juvenileDetails.group);
    this.isSquidVisible = id => this.renderers.get(id)?.visible === true;
    this.transform = new THREE.Object3D();
    this.bodyRotation = new THREE.Quaternion();
    this.eyeRotation = new THREE.Quaternion();
    this.eyeNormal = new THREE.Vector3();
    this.inverseEye = new THREE.Quaternion();
    this.eyeTarget = new THREE.Vector3();
    this.gazeTarget = new THREE.Vector3();
    this.pupilOffset = new THREE.Vector3();
    this.localRotation = new THREE.Quaternion();
    this.a = new THREE.Vector3(); this.b = new THREE.Vector3();
    this.center = new THREE.Vector3(); this.local = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    this.boundsMatrix = new THREE.Matrix4();
    this.boundsPart = new THREE.Sphere();
    this.disposed = false;
    this.update(world, 0, true);
  }

  pose(mesh, index, position, sx, sy, sz, rotation) {
    this.transform.position.copy(position);
    if (rotation) this.transform.quaternion.copy(rotation);
    else this.transform.quaternion.identity();
    this.transform.scale.set(sx, sy, sz);
    this.transform.updateMatrix();
    mesh.setMatrixAt(index, this.transform.matrix);
  }

  localPoint(x, y, z) {
    return this.local.set(x, y, z).applyQuaternion(this.bodyRotation).add(this.center);
  }

  eyePoint(x, y, z, offset = 0) {
    return this.local.set(x, y, z).addScaledVector(this.eyeNormal, offset)
      .applyQuaternion(this.bodyRotation).add(this.center);
  }

  pupilPoint(x, y, z, radius, looking, pupilWidth = 0.052, pupilHeight = 0.081,
    lensDepth = 0.095, pupilClamp = 0.85, irisHeight = 0.155, irisWidth = 0.17) {
    this.pupilOffset.set(0, 0, radius * (lensDepth + 0.01));
    const eyeCenter = this.eyePoint(x, y, z);
    if (looking) {
      this.inverseEye.copy(this.eyeRotation).invert();
      this.eyeTarget.copy(this.gazeTarget).sub(eyeCenter).applyQuaternion(this.inverseEye);
      if (this.eyeTarget.z > 0.0001) {
        let dx = this.eyeTarget.x / this.eyeTarget.z * radius * 0.16;
        let dy = this.eyeTarget.y / this.eyeTarget.z * radius * 0.14;
        const maxX = radius * (irisWidth - pupilWidth) * pupilClamp;
        const maxY = radius * (irisHeight - pupilHeight) * pupilClamp;
        const clamp = Math.max(1, Math.hypot(dx / maxX, dy / maxY));
        dx /= clamp; dy /= clamp;
        const surface = radius * lensDepth * Math.sqrt(Math.max(0,
          1 - (dx / (radius * irisWidth)) ** 2 - (dy / (radius * irisHeight)) ** 2));
        this.pupilOffset.set(dx, dy, surface + radius * 0.01);
      }
    }
    return this.pupilOffset.applyQuaternion(this.eyeRotation).add(eyeCenter);
  }

  hide(index) {
    for (const [mesh, perAnimal] of this.batches)
      for (let item = 0; item < perAnimal; item++)
        mesh.setMatrixAt(index * perAnimal + item, this.hiddenMatrix);
  }

  /** @param {SquidWorld} world @param {number} _time @param {boolean} [_reducedMotion]
   * @param {THREE.Vector3} [cameraPosition] @param {{mobile?:boolean}} [quality]
   */
  update(world, _time, _reducedMotion = false, cameraPosition, quality) {
    if (this.disposed) return;
    const hasCamera = finitePoint(cameraPosition);
    const hasTarget = hasCamera || finitePoint(world.player);
    if (hasCamera) this.gazeTarget.copy(cameraPosition);
    else if (hasTarget) this.gazeTarget.set(world.player.x / SCALE,
      (world.player.z + EYE_HEIGHT) / SCALE, world.player.y / SCALE);
    let anyVisible = false;
    for (const [id, view] of this.renderers) {
      const squid = world.squids?.find((entry) => entry.id === id)
        ?? world.adultSquids?.find((entry) => entry.id === id);
      if (!squid || squid.squidRespawnIn > 0) { view.visible = false; this.hide(view.index); continue; }
      this.center.set(squid.x / SCALE, squid.z / SCALE, squid.y / SCALE);
      // Include the complete three-metre animal in the visibility decision.
      const cutoff = capRenderDistance(quality,quality?.mobile ? 60 : 100) + squid.lengthMeters;
      view.visible = !hasCamera || this.center.distanceToSquared(cameraPosition) < cutoff * cutoff;
      if (!view.visible) { this.hide(view.index); continue; }
      anyVisible = true;
      const index = view.index, radius = squid.headRadius / SCALE * (view.adult ? 1 : JUVENILE_SQUID_RADIUS_SCALE);
      const headYScale = view.adult ? getAdultSquidHeadYScale(squid) : JUVENILE_SQUID_HEAD_Y_SCALE;
      const speciesScale = squid.headRadius / 15;
      this.bodyRotation.copy(getSquidOrientation(squid));
      const targetDistance = hasTarget ? this.center.distanceToSquared(this.gazeTarget) : Infinity;
      const gazeRange = view.adult ? 60 : 10;
      const looking = targetDistance > 0.000001 && targetDistance <= gazeRange * gazeRange;
      const breathing = getSquidPropulsionState(squid).breath * (_reducedMotion ? .004 : .02);
      const headMesh = view.adult ? headSideRatio(squid) < 1 ? this.flatHeads : this.heads : this.juvenileHeads;
      view.headMesh = headMesh;
      this.heads.setMatrixAt(index, this.hiddenMatrix);
      this.flatHeads?.setMatrixAt(index, this.hiddenMatrix);
      this.juvenileHeads?.setMatrixAt(index, this.hiddenMatrix);
      this.pose(headMesh, index, this.center, radius * (1 + breathing), radius * headYScale * (1 + breathing * .55),
        radius * (1 + breathing), this.bodyRotation);
      for (let plate = 0; plate < ARMOR_PLATES; plate++) {
        // Shared plated collars now cover juveniles as well as adult bellies.
        this.armor.setMatrixAt(index * ARMOR_PLATES + plate, this.hiddenMatrix);
      }
      for (let pore = 0; pore < PORES; pore++) {
        const vertical = -0.86 + pore / (PORES - 1) * 1.72;
        const ring = Math.sqrt(1 - vertical * vertical);
        const angle = pore * 2.399963 + (squid.seed % 41) * 0.15;
        this.direction.set(Math.cos(angle) * ring, vertical, Math.sin(angle) * ring);
        this.direction.y /= headYScale;
        this.direction.normalize();
        this.localRotation.setFromUnitVectors(UP, this.direction).premultiply(this.bodyRotation);
        this.a.set(Math.cos(angle) * ring, vertical * headYScale, Math.sin(angle) * ring)
          .applyQuaternion(this.bodyRotation).multiplyScalar(radius * .995).add(this.center);
        this.pose(this.pores, index * PORES + pore, this.a,
          0.017 * speciesScale, 0.006 * speciesScale, 0.023 * speciesScale, this.localRotation);
      }
      for (let row = 0; row < 2; row++) for (let column = 0; column < 2; column++) {
        const eye = row * 2 + column;
        const eyeScale = view.adult ? (squid.eyeScale ?? ADULT_SQUID_EYE_SCALE) : JUVENILE_SQUID_EYE_SCALE;
        const layout = view.adult ? ADULT_SQUID_EYE_LAYOUT : JUVENILE_SQUID_EYE_LAYOUT;
        const modernEye = !view.adult || squid.designVersion === 2;
        const x = radius * layout[eye][0];
        const y = radius * headYScale * layout[eye][1];
        const surfaceZ = Math.sqrt(radius * radius - x * x - (y / headYScale) ** 2);
        const eyeZ = surfaceZ + radius * 0.09 * eyeScale;
        const irisHeight = modernEye ? .12 : .085;
        const lensDepth = 0.085 * eyeScale;
        // A modest outward tilt keeps the inner black borders above the curved head.
        this.eyeNormal.set(x, y / headYScale ** 2, surfaceZ).normalize().multiplyScalar(0.65)
          .addScaledVector(FORWARD, 0.35).normalize();
        this.eyeRotation.setFromUnitVectors(FORWARD, this.eyeNormal).premultiply(this.bodyRotation);
        this.eyes.setColorAt(index*4+eye,this.eyeTint.setHex(squid.noticedPlayer||squid.assistingHunt||squid.huntingPrey||squid.feeding?0xbb52ff:0xffd447));
        this.pose(this.eyes, index * 4 + eye, this.eyePoint(x, y, eyeZ),
          radius * .13 * eyeScale, radius * irisHeight * eyeScale, radius * lensDepth, this.eyeRotation);
        const pupilWidth = (modernEye ? .062 : .075) * eyeScale, pupilHeight = (modernEye ? .030 : .018) * eyeScale;
        this.pose(this.pupils, index * 9 + eye,
          this.pupilPoint(x, y, eyeZ, radius, looking, pupilWidth, pupilHeight, lensDepth,
            .72, irisHeight * eyeScale, .13 * eyeScale),
          radius * pupilWidth, radius * pupilHeight,
          radius * 0.017, this.eyeRotation);
        const rimWidth = view.adult ? .16 : .138, rimHeight = view.adult ? (modernEye ? .145 : .115) : .127;
        const rimDepth = view.adult ? .085 : .075, rimRecess = view.adult ? .033 : .028;
        this.pose(this.pupils, index * 9 + 5 + eye, this.eyePoint(x, y, eyeZ, -radius * rimRecess * eyeScale),
          radius * rimWidth * eyeScale, radius * rimHeight * eyeScale, radius * rimDepth * eyeScale, this.eyeRotation);
      }
      const encounter = world.squidEncounter?.squidId === id ? world.squidEncounter : squid.feeding;
      const eating = encounter?.squidId === id && encounter.phase === "eating";
      if (view.adult) {
        // The adult’s separate, hooked horn halves live in adultDetails.
        this.beaks.setMatrixAt(index * 2, this.hiddenMatrix);
        this.beaks.setMatrixAt(index * 2 + 1, this.hiddenMatrix);
        if(squid.designVersion===2)this.pupils.setMatrixAt(index*9+4,this.hiddenMatrix);
        else this.pose(this.pupils, index * 9 + 4,
          this.localPoint(0, radius * headYScale * ADULT_SQUID_MOUTH_LOCAL[1], radius * (squid.designVersion === 2 ? 1.01 + breathing : .98)),
          radius * (eating ? .19 : .17), radius * headYScale * (eating ? .10 : .08), radius * (squid.designVersion === 2 ? .09 : .018), this.bodyRotation);
      } else {
        this.beaks.setMatrixAt(index * 2, this.hiddenMatrix);
        this.beaks.setMatrixAt(index * 2 + 1, this.hiddenMatrix);
        this.pose(this.pupils, index * 9 + 4,
          this.localPoint(0, radius * headYScale * JUVENILE_SQUID_MOUTH_LOCAL[1], radius * .99),
          radius * .18, radius * headYScale * .11, radius * .035, this.bodyRotation);
      }
      squid.tentacles.forEach((arm, armIndex) => {
        arm.forEach((point, joint) => {
          this.a.set(point.x / SCALE, point.z / SCALE, point.y / SCALE);
          const thickness = ARM_RADIUS * speciesScale * TAPER ** joint;
          this.pose(this.joints, index * ARMS * (LINKS + 1) + armIndex * (LINKS + 1) + joint,
            this.a, thickness, thickness, thickness);
        });
        for (let link = 0; link < LINKS; link++) {
          const start = arm[link], end = arm[link + 1];
          this.a.set(start.x / SCALE, start.z / SCALE, start.y / SCALE);
          this.b.set(end.x / SCALE, end.z / SCALE, end.y / SCALE);
          this.direction.subVectors(this.b, this.a);
          const length = this.direction.length();
          const thickness = ARM_RADIUS * speciesScale * TAPER ** link;
          const part = index * ARMS * LINKS + armIndex * LINKS + link;
          this.localRotation.setFromUnitVectors(UP, this.direction.divideScalar(length || 1));
          this.a.add(this.b).multiplyScalar(0.5);
          this.pose(this.arms, part, this.a, thickness, Math.max(0.0001, length), thickness, this.localRotation);
          if (link % 2 === 1) this.pose(this.stripes,
            index * ARMS * BANDS_PER_ARM + armIndex * BANDS_PER_ARM + (link - 1) / 2,
            this.a, thickness + 0.0015 * speciesScale, Math.max(0.0001, length) * BAND_FRACTION,
            thickness + 0.0015 * speciesScale, this.localRotation);
        }
      });
    }
    this.adultDetails.update(world, cameraPosition, quality, _reducedMotion);
    this.juvenileDetails.update(world, cameraPosition, quality, _reducedMotion, this.isSquidVisible);
    this.propulsion.update(world, id => this.renderers.get(id)?.visible, _reducedMotion);
    this.group.visible = anyVisible;
    for (const [mesh, perAnimal] of this.batches) {
      mesh.instanceMatrix.needsUpdate = true;
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
      // Zero-scale hidden slots remain at the origin to preserve stable animal
      // indices. Exclude those slots from bounds so they cannot pull an otherwise
      // offscreen deep-water batch back into the viewer or shadow frustum.
      mesh.boundingSphere ??= new THREE.Sphere();
      mesh.boundingSphere.makeEmpty();
      if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
      for (const view of this.renderers.values()) {
        if (!view.visible) continue;
        if (mesh === this.beaks || mesh === this.armor) continue;
        if ((mesh === this.heads || mesh === this.flatHeads || mesh === this.juvenileHeads) && mesh !== view.headMesh) continue;
        for (let part = 0; part < perAnimal; part++) {
          mesh.getMatrixAt(view.index * perAnimal + part, this.boundsMatrix);
          mesh.boundingSphere.union(this.boundsPart.copy(mesh.geometry.boundingSphere)
            .applyMatrix4(this.boundsMatrix));
        }
      }
      mesh.visible = !mesh.boundingSphere.isEmpty();
      mesh.boundingBox = null;
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.adultDetails.dispose(); this.juvenileDetails.dispose(); this.propulsion.dispose();
    for (const [mesh] of this.batches) mesh.dispose();
    Object.values(this.geometries).forEach((geometry) => geometry.dispose());
    Object.values(this.materials).forEach((material) => material.dispose());
    Object.values(this.surfaceMaps).forEach((maps) => maps.dispose());
    this.group.removeFromParent();
    this.group.clear();
  }
}
