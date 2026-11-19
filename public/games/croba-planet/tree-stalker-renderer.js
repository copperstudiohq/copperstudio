import {capRenderDistance} from './render-distance.js';
import * as THREE from "./vendor/three.module.js";
import { getForestHeight } from "./forest-terrain.js";
import { EYE_HEIGHT } from "./terrain.js";
import { TREE_STALKER_HEIGHT, TREE_STALKER_MOUTH_LOCAL, TREE_STALKER_EYE_LOCAL } from "./tree-stalker-anatomy.js";

const SCALE = 25;
const HEIGHT = TREE_STALKER_HEIGHT;
const TUBE_LINKS = 6;
const UP = new THREE.Vector3(0, 1, 0);
const STATES = new Set(["camouflaged", "stalking", "sprinting", "retreating"]);
const finitePoint = (point) => Boolean(point && [point.x, point.y, point.z].every(Number.isFinite));

/** @typedef {{id:string,x:number,y:number,z:number,heading:number,state?:'camouflaged'|'stalking'|'sprinting'|'retreating',movePhase?:number,speed?:number,heightMeters?:number,eyeTarget?:{x:number,y:number,z:number}}} TreeStalker */
/** @typedef {{stalkerId:string,phase:'grabbed'|'feeding',progress:number,target?:{x:number,y:number,z:number},cameraPosition?:{x:number,y:number,z:number},tubeTarget?:{x:number,y:number,z:number},tubeProgress?:number}} StalkerEncounter */
/** @typedef {{treeStalkers?:TreeStalker[],forest?:object,player?:{x:number,y:number,z:number},treeStalkerEncounter?:StalkerEncounter|null}} StalkerWorld */

function validate(stalker) {
  if (!finitePoint(stalker) || typeof stalker.id !== "string" || !Number.isFinite(stalker.heading))
    throw new TypeError("A tree stalker needs an id, finite feet position and simulation heading.");
  if (stalker.heightMeters !== undefined && (!Number.isFinite(stalker.heightMeters) || stalker.heightMeters <= 0))
    throw new RangeError(`Tree stalker ${stalker.id} needs a positive height in metres.`);
  if (!STATES.has(stalker.state ?? "camouflaged")) throw new TypeError(`Unknown tree stalker state: ${stalker.state}`);
}

/** Drawing-derived joints in metres, with four antler tips and three hooked
 * digits on each hand and foot. The simulation owns phase and locomotion.
 * @param {TreeStalker} stalker @param {boolean} reducedMotion
 */
export function treeStalkerPose(stalker, reducedMotion = false) {
  const state = stalker.state ?? "camouflaged", moving = state !== "camouflaged";
  const sprint = state === "sprinting", phase = reducedMotion ? 0 : Number.isFinite(stalker.movePhase) ? stalker.movePhase : 0;
  const bob = moving && !reducedMotion ? Math.sin(phase * 2) * (sprint ? .035 : .012) : 0;
  const lean = moving ? sprint ? .28 : .07 : 0;
  const bones = [], knots = [], feet = [];
  const bone = (name, a, b, radius, depth = radius, tint = 0xffffff) => bones.push({ name, a, b, radius, depth, tint });
  const knot = (name, p, radius, dimensions, skin = 0) => knots.push({ name, p, radius, dimensions, skin });
  // Closed, overlapping skin volumes retain a human chest, hollow waist and
  // pelvis. Rib contours are shaded beneath this surface, never separate rods.
  knot("covered-pelvis", [0, 3.50 + bob, 0], .205, [.205, .24, .15]);
  knot("hollow-abdomen", [0, 3.92 + bob, lean * .42 + .005], .14, [.14, .35, .115], 2);
  knot("skin-covered-ribcage", [0, 4.33 + bob, lean * .80], .26, [.26, .39, .17], 1);
  bone("thin-neck", [0, 4.70 + bob, lean], [0, 5.25 + bob, lean + .015], .064);
  // Preserve the original head, eye and antler silhouette, raised one metre.
  bone("long-stump-head", [0, 6.0 + bob, lean + .02], [0, 5.21 + bob, lean + .015], .30, .23);
  for (const side of [-1, 1]) {
    knot(`covered-shoulder-${side}`, [side * .205, 4.61 + bob, lean * .95], .14, [.14, .16, .14]);
    bone(`clavicle-${side}`, [0, 4.65 + bob, lean + .075], [side * .25, 4.67 + bob, lean + .025], .017, .014, 0x9b889d);
    bone(`head-side-bark-${side}`, [side * .245, 5.92 + bob, lean + .11], [side * .18, 5.24 + bob, lean + .13], .018, .016, 0xb2a3b4);
    bone(`head-hanging-bark-${side}`, [side * .12, 5.60 + bob, lean + .19], [side * .10, 5.15 + bob, lean + .14], .012, .010, 0x756373);
    const stem = [side * .22, 5.98 + bob, lean + .015], fork = [side * .49, 6.17 + bob, lean - .01];
    bone(`antler-stem-${side}`, stem, fork, .042);
    bone(`outer-antler-rise-${side}`, fork, [side * .91, 6.34 + bob, lean - .035], .032);
    bone(`outer-antler-hook-${side}`, [side * .91, 6.34 + bob, lean - .035], [side * .98, 6.58 + bob, lean - .025], .021);
    bone(`outer-antler-tip-${side}`, [side * .98, 6.58 + bob, lean - .025], [side * .88, 6.8 + bob, lean], .012);
    bone(`inner-antler-rise-${side}`, fork, [side * .47, 6.47 + bob, lean + .02], .024);
    bone(`inner-antler-tip-${side}`, [side * .47, 6.47 + bob, lean + .02], [side * .36, 6.66 + bob, lean + .03], .012);
    const step = phase + (side > 0 ? Math.PI : 0), swing = moving ? Math.sin(step) : 0;
    const lift = moving && !reducedMotion ? Math.max(0, Math.cos(step)) * (sprint ? .34 : .080) : 0;
    const foot = [side * (moving ? .35 : .39), .12 + lift, moving ? swing * (sprint ? 1.22 : .42) : side * .025];
    const hip = [side * .15, 3.46 + bob, 0];
    const knee = [side * (moving ? .38 : .57), 1.82 + bob, foot[2] * .46 + (moving ? .30 : .09)];
    const groundedFoot = { point: foot, knee, points: [foot] }; feet.push(groundedFoot);
    bone(`upper-leg-${side}`, hip, knee, .045); bone(`lower-leg-${side}`, knee, foot, .031);
    knot(`knee-${side}`, knee, .105); knot(`ankle-${side}`, foot, .075);
    const shoulder = [side * .27, 4.70 + bob, lean];
    const elbow = moving ? [side * .83, 3.96 + bob + swing * .17, lean - swing * (sprint ? .80 : .26)]
      : [side * 1.45, 5.02 + bob, .025];
    const wrist = moving ? [side * 1.15, 3.16 + bob + swing * .26, lean - swing * (sprint ? 1.45 : .45)]
      : [side * 2.25, 3.91 + bob, .085];
    bone(`upper-arm-${side}`, shoulder, elbow, .038); bone(`lower-arm-${side}`, elbow, wrist, .027);
    knot(`shoulder-${side}`, shoulder, .095); knot(`elbow-${side}`, elbow, .087); knot(`wrist-${side}`, wrist, .065);
    for (const finger of [-1, 0, 1]) {
      const bend = [wrist[0] + side * (.13 + (finger + 1) * .025), wrist[1] - .19, wrist[2] + finger * .12];
      const tip = [bend[0] - side * .035, wrist[1] - .43 - (finger === 0 ? .04 : 0), bend[2] + .025];
      bone(`finger-${side}:${finger}-base`, wrist, bend, .018); bone(`finger-${side}:${finger}-tip`, bend, tip, .011);
      const toe = [foot[0] + finger * .12, foot[1] - .035, foot[2] + .16];
      const toeTip = [foot[0] + finger * .17, foot[1] - .11, foot[2] + .29];
      groundedFoot.points.push(toe, toeTip);
      bone(`toe-${side}:${finger}-base`, foot, toe, .019); bone(`toe-${side}:${finger}-tip`, toe, toeTip, .011);
    }
    // A second arm pair grows from the lower ribcage. The original head,
    // torso, legs and upper arms keep their exact anatomy and gait.
    const lowerSwing = moving ? Math.sin(step + Math.PI) : 0;
    const lowerShoulder = [side * .245, 4.17 + bob, lean * .70];
    const lowerElbow = moving ? [side * .78, 3.43 + bob + lowerSwing * .14, lean - lowerSwing * (sprint ? .70 : .23)]
      : [side * 1.28, 4.28 + bob, -.055];
    const lowerWrist = moving ? [side * 1.05, 2.64 + bob + lowerSwing * .23, lean - lowerSwing * (sprint ? 1.25 : .39)]
      : [side * 2.03, 3.11 + bob, .13];
    bone(`secondary-upper-arm-${side}`, lowerShoulder, lowerElbow, .036);
    bone(`secondary-lower-arm-${side}`, lowerElbow, lowerWrist, .026);
    knot(`secondary-shoulder-${side}`, lowerShoulder, .095);
    knot(`secondary-elbow-${side}`, lowerElbow, .083);
    knot(`secondary-wrist-${side}`, lowerWrist, .062);
    for (const finger of [-1, 0, 1]) {
      const bend = [lowerWrist[0] + side * (.13 + (finger + 1) * .025), lowerWrist[1] - .19, lowerWrist[2] + finger * .12];
      const tip = [bend[0] - side * .035, lowerWrist[1] - .43 - (finger === 0 ? .04 : 0), bend[2] + .025];
      bone(`secondary-finger-${side}:${finger}-base`, lowerWrist, bend, .018);
      bone(`secondary-finger-${side}:${finger}-tip`, bend, tip, .011);
    }
  }
  const mouth = [TREE_STALKER_MOUTH_LOCAL[0], TREE_STALKER_MOUTH_LOCAL[1] + bob, lean + TREE_STALKER_MOUTH_LOCAL[2]];
  for (let link = 0; link < TUBE_LINKS; link++)
    bone(`proboscis-link-${link}`, [...mouth], [...mouth], 0, 0, link === TUBE_LINKS - 1 ? 0xe8d6b4 : 0x73616f);
  return { bones, knots, feet, mouth,
    eye: [TREE_STALKER_EYE_LOCAL[0], TREE_STALKER_EYE_LOCAL[1] + bob, lean + TREE_STALKER_EYE_LOCAL[2]] };
}

const blendPoint = (a, b, amount) => a.map((value, index) => value + (b[index] - value) * amount);
const smooth = (value) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

/** Pose only copied drawing joints. Simulation positions and capture clocks remain
 * owned by the encounter; paused redraws reconstruct the exact same hand/tube pose.
 */
function poseCapture(shape, encounter, camera, mouth, size, tubeTarget) {
  const progress = Number.isFinite(encounter.progress) ? Math.max(0, Math.min(1, encounter.progress)) : 0;
  const hold = encounter.phase === "feeding" ? 1 : smooth(progress / .16);
  const boneByName = new Map(shape.bones.map((bone) => [bone.name, bone]));
  const knotByName = new Map(shape.knots.map((knot) => [knot.name, knot]));
  for (const secondary of [false, true]) for (const side of [-1, 1]) {
    const prefix = secondary ? 'secondary-' : '';
    const upper = boneByName.get(`${prefix}upper-arm-${side}`), lower = boneByName.get(`${prefix}lower-arm-${side}`);
    const shoulder = upper.a;
    const drop = secondary ? .95 : .38, spread = secondary ? .37 : .30;
    const wrist = [camera[0] + side * spread / size, camera[1] - drop / size, camera[2] - .10 / size];
    const elbow = [(shoulder[0] + wrist[0]) * .5 + side * .22,
      (shoulder[1] + wrist[1]) * .5 - .20, (shoulder[2] + wrist[2]) * .5 - .12];
    upper.b.splice(0, 3, ...blendPoint(upper.b, elbow, hold));
    lower.b.splice(0, 3, ...blendPoint(lower.b, wrist, hold));
    // The upper/lower bones, knots and finger bases share these joint arrays.
    knotByName.get(`${prefix}elbow-${side}`).p = upper.b;
    knotByName.get(`${prefix}wrist-${side}`).p = lower.b;
    for (const finger of [-1, 0, 1]) {
      const base = boneByName.get(`${prefix}finger-${side}:${finger}-base`), tip = boneByName.get(`${prefix}finger-${side}:${finger}-tip`);
      const offset = secondary ? .57 : 0;
      const bend = [camera[0] + side * .22 / size, camera[1] - (.40 + offset - finger * .065) / size, camera[2] + .015 / size];
      const end = [camera[0] + side * .13 / size, camera[1] - (.43 + offset - finger * .065) / size, camera[2] + .075 / size];
      base.b.splice(0, 3, ...blendPoint(base.b, bend, hold));
      tip.b.splice(0, 3, ...blendPoint(tip.b, end, hold));
    }
  }
  if (encounter.phase !== "feeding") return;
  const extension = Number.isFinite(encounter.tubeProgress)
    ? Math.max(0, Math.min(1, encounter.tubeProgress)) : smooth(progress / .72);
  if (extension <= 0) return;
  const direction = camera.map((value, index) => value - mouth[index]);
  const distance = Math.hypot(...direction);
  if (distance < .01) return;
  for (let index = 0; index < 3; index++) direction[index] /= distance;
  const end = tubeTarget ?? camera.map((value, index) => value - direction[index] * .08 / size);
  // An off-axis bend lets a first-person observer see the tube arrive from the
  // lower face and curl into the helmet, rather than looking down an invisible line.
  const first = [mouth[0] + .27, mouth[1] - .065, mouth[2] + .27];
  const last = camera.map((value, index) => value - direction[index] * .28 / size);
  last[0] += .17 / size; last[1] -= .06 / size;
  const at = (t) => {
    const u = 1 - t;
    return mouth.map((value, index) => value * u ** 3 + first[index] * 3 * u * u * t
      + last[index] * 3 * u * t * t + end[index] * t ** 3);
  };
  for (let link = 0; link < TUBE_LINKS; link++) {
    const tube = boneByName.get(`proboscis-link-${link}`);
    tube.a = at(link / TUBE_LINKS * extension); tube.b = at((link + 1) / TUBE_LINKS * extension);
    // The original bark head sits slightly behind its canonical mouth anchor.
    // Seat the visible tube inside that unchanged skin without moving the
    // encounter's mouth, curve, helmet target or any subsequent joint.
    if (link === 0) {
      const length = Math.hypot(...tube.b.map((value, index) => value - mouth[index]));
      if (length > 1e-8) tube.a = mouth.map((value, index) => value - (tube.b[index] - value) * .05 / length);
    }
    tube.radius = (.023 - link / TUBE_LINKS * .013); tube.depth = tube.radius;
  }
}

function batch(group, geometry, material, count, name) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = true; mesh.receiveShadow = true; group.add(mesh);
  return mesh;
}

/** Subtle rib relief belongs to the closed skin, rather than exposed bones.
 * The static per-instance mask keeps joints unmodified in the same draw call.
 */
function coveredSkinMaterial(bark) {
  const skin = bark.clone(); skin.name = "tree-stalker-covered-gaunt-skin";
  skin.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
attribute float gauntSkin;
varying vec3 vGauntPosition;
varying float vGauntSkin;`).replace("#include <begin_vertex>", `#include <begin_vertex>
vGauntPosition = position;
vGauntSkin = gauntSkin;`);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
varying vec3 vGauntPosition;
varying float vGauntSkin;
float coveredRibRelief(vec3 p) {
  float chest = step(.5, vGauntSkin) * (1.0 - step(1.5, vGauntSkin));
  float front = smoothstep(.1, .65, p.z);
  float edges = smoothstep(.04, .25, abs(p.x)) * (1.0 - smoothstep(.78, .96, abs(p.x)));
  float ends = 1.0 - smoothstep(.48, .84, abs(p.y));
  float rib = pow(.5 + .5 * cos(p.y * 22.0 + abs(p.x) * 2.4), 6.0);
  return .007 * chest * front * edges * ends * rib;
}`).replace("#include <color_fragment>", `#include <color_fragment>
float ribRelief = coveredRibRelief(vGauntPosition);
// Gentle shadow beneath skin-covered ribs; the abdomen remains continuous.
diffuseColor.rgb *= 1.0 - ribRelief * 13.0;
float abdomen = step(1.5, vGauntSkin) * smoothstep(.15, .8, vGauntPosition.z);
diffuseColor.rgb *= 1.0 - .10 * abdomen * (1.0 - abs(vGauntPosition.y));
`).replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
vec3 skinDx = dFdx(-vViewPosition), skinDy = dFdy(-vViewPosition);
vec3 skinRx = cross(skinDy, normal), skinRy = cross(normal, skinDx);
float skinDet = dot(skinDx, skinRx);
vec3 skinGradient = sign(skinDet) * (skinRx * dFdx(ribRelief) + skinRy * dFdy(ribRelief));
normal = normalize(max(abs(skinDet), 1e-10) * normal - skinGradient);
`);
  };
  skin.customProgramCacheKey = () => "tree-stalker-covered-skin-v1";
  return skin;
}

/** A drawing-matched bark creature in four shared batches. Geometry and texture
 * ownership stay fixed; only articulated instance matrices change during play.
 */
export class TreeStalkerRenderer {
  /** @param {StalkerWorld} world @param {{bark?:THREE.MeshStandardMaterial}} [shared] */
  constructor(world = {}, shared = {}) {
    const stalkers = world.treeStalkers ?? []; stalkers.forEach(validate);
    if (new Set(stalkers.map((stalker) => stalker.id)).size !== stalkers.length) throw new TypeError("Tree stalker ids must be unique.");
    this.group = new THREE.Group(); this.group.name = "single-eyed-branch-stalkers";
    this.disposed = false;
    const bark = shared.bark?.isMeshStandardMaterial ? shared.bark.clone()
      : new THREE.MeshStandardMaterial({ color: 0x756273, roughness: .94 });
    bark.name = "tree-stalker-purple-bark-camouflage"; bark.flatShading = false; bark.roughness = .94;
    bark.normalScale.set(.6, .6); bark.metalness = 0;
    if (shared.bark) bark.color.multiply(new THREE.Color(0xb2a2b7));
    this.materials = {
      bark,
      skin: coveredSkinMaterial(bark),
      iris: new THREE.MeshStandardMaterial({ color: 0xd4d6b2, roughness: .32,
        emissive: 0x1c210b, emissiveIntensity: .16 }),
      black: new THREE.MeshStandardMaterial({ color: 0x040707, roughness: .36 }),
    };
    this.geometries = { bone: new THREE.CylinderGeometry(.64, 1, 1, 7, 1),
      knot: new THREE.SphereGeometry(1, 10, 6), eye: new THREE.SphereGeometry(1, 16, 10) };
    const prototype = treeStalkerPose({ state: "camouflaged" });
    this.anatomy = { boneNames: prototype.bones.map((part) => part.name), knotNames: prototype.knots.map((part) => part.name) };
    const count = stalkers.length;
    const skinMask = new Float32Array(count * prototype.knots.length);
    for (let index = 0; index < count; index++) for (const [part, knot] of prototype.knots.entries())
      skinMask[index * prototype.knots.length + part] = knot.skin;
    this.geometries.knot.setAttribute("gauntSkin", new THREE.InstancedBufferAttribute(skinMask, 1));
    this.bones = batch(this.group, this.geometries.bone, bark, count * prototype.bones.length, "twig-limbs-bark-body-and-four-antler-tips");
    this.knots = batch(this.group, this.geometries.knot, this.materials.skin, count * prototype.knots.length, "covered-human-torso-and-articulated-knuckles");
    this.eyes = batch(this.group, this.geometries.eye, this.materials.iris, count, "single-oval-stalker-eyes");
    this.pupils = batch(this.group, this.geometries.eye, this.materials.black, count * 2, "black-eye-outline-and-vertical-pupil");
    this.batches = [[this.bones, prototype.bones.length], [this.knots, prototype.knots.length], [this.eyes, 1], [this.pupils, 2]];
    this.bones.castShadow = this.knots.castShadow = true;
    this.renderers = new Map(stalkers.map((stalker, index) => [stalker.id, { index, visible: true }]));
    this.center = new THREE.Vector3(); this.start = new THREE.Vector3(); this.end = new THREE.Vector3();
    this.direction = new THREE.Vector3(); this.position = new THREE.Vector3(); this.scale = new THREE.Vector3();
    this.rotation = new THREE.Quaternion(); this.bodyRotation = new THREE.Quaternion(); this.inverseRotation = new THREE.Quaternion();
    this.matrix = new THREE.Matrix4(); this.hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    this.gaze = new THREE.Vector3(); this.target = new THREE.Vector3(); this.eye = new THREE.Vector3();
    this.tint = new THREE.Color();
    this.boundsPart = new THREE.Sphere(); this.boundsMatrix = new THREE.Matrix4();
    this.update(world, 0, true);
  }

  localPoint(value, size, target = this.position) {
    return target.fromArray(value).multiplyScalar(size).applyQuaternion(this.bodyRotation).add(this.center);
  }

  pose(mesh, index, position, x, y, z, rotation = this.bodyRotation) {
    this.scale.set(x, y, z); this.matrix.compose(position, rotation, this.scale); mesh.setMatrixAt(index, this.matrix);
  }

  /** @param {StalkerWorld} world @param {number} _time @param {boolean} [reducedMotion]
   * @param {THREE.Vector3} [cameraPosition] @param {{mobile?:boolean}} [quality]
   */
  update(world = {}, _time = 0, reducedMotion = false, cameraPosition, quality = {}) {
    if (this.disposed) return;
    let anyVisible = false;
    for (const [id, view] of this.renderers) {
      const stalker = world.treeStalkers?.find((entry) => entry.id === id);
      if (!stalker || stalker.squidRespawnIn > 0) view.visible = false;
      else {
        validate(stalker);
        this.center.set(stalker.x / SCALE, stalker.z / SCALE, stalker.y / SCALE);
        const range = capRenderDistance(quality,quality.mobile ? 105 : 165) + (stalker.heightMeters ?? HEIGHT);
        view.visible = !finitePoint(cameraPosition) || this.center.distanceToSquared(cameraPosition) < range * range;
      }
      if (!view.visible) {
        for (const [mesh, parts] of this.batches) for (let part = 0; part < parts; part++) mesh.setMatrixAt(view.index * parts + part, this.hiddenMatrix);
        continue;
      }
      anyVisible = true;
      const encounter = world.treeStalkerEncounter?.stalkerId === id
        && ["grabbed", "feeding"].includes(world.treeStalkerEncounter.phase)
        && finitePoint(world.treeStalkerEncounter.cameraPosition) ? world.treeStalkerEncounter : null;
      const size = (stalker.heightMeters ?? HEIGHT) / HEIGHT;
      const shape = treeStalkerPose(encounter ? { ...stalker, state: "camouflaged" } : stalker, reducedMotion);
      // Local +Z faces (cos heading, sin heading) in simulation X/Y.
      this.bodyRotation.setFromAxisAngle(UP, Math.PI / 2 - stalker.heading);
      if (encounter) {
        this.inverseRotation.copy(this.bodyRotation).invert();
        this.target.set(encounter.cameraPosition.x / SCALE, encounter.cameraPosition.z / SCALE, encounter.cameraPosition.y / SCALE)
          .sub(this.center).applyQuaternion(this.inverseRotation).multiplyScalar(1 / size);
        const camera = this.target.toArray();
        let mouth = shape.mouth;
        if (finitePoint(encounter.target)) {
          this.target.set(encounter.target.x / SCALE, encounter.target.z / SCALE, encounter.target.y / SCALE)
            .sub(this.center).applyQuaternion(this.inverseRotation).multiplyScalar(1 / size);
          mouth = this.target.toArray();
        }
        let tubeTarget;
        if (finitePoint(encounter.tubeTarget)) {
          this.target.set(encounter.tubeTarget.x / SCALE, encounter.tubeTarget.z / SCALE, encounter.tubeTarget.y / SCALE)
            .sub(this.center).applyQuaternion(this.inverseRotation).multiplyScalar(1 / size);
          tubeTarget = this.target.toArray();
        }
        poseCapture(shape, encounter, camera, mouth, size, tubeTarget);
      }
      for (const foot of shape.feet) {
        for (const p of foot.points) {
          this.localPoint(p, size);
          const ground = getForestHeight(world, this.position.x * SCALE, this.position.z * SCALE);
          if (ground === null) continue;
          const offset = (ground - stalker.z) / (SCALE * size);
          p[1] += offset;
          if (p === foot.point) foot.knee[1] += offset * .5;
        }
      }
      for (const [part, bone] of shape.bones.entries()) {
        this.start.fromArray(bone.a); this.end.fromArray(bone.b);
        this.direction.subVectors(this.end, this.start); const length = this.direction.length();
        this.rotation.setFromUnitVectors(UP, this.direction.multiplyScalar(1 / Math.max(length, 1e-8))).premultiply(this.bodyRotation);
        this.position.copy(this.start).add(this.end).multiplyScalar(.5 * size).applyQuaternion(this.bodyRotation).add(this.center);
        this.pose(this.bones, view.index * shape.bones.length + part, this.position, bone.radius * size, length * size, bone.depth * size, this.rotation);
        this.bones.setColorAt(view.index * shape.bones.length + part, this.tint.setHex(bone.tint));
      }
      for (const [part, knot] of shape.knots.entries()) {
        const dimensions = knot.dimensions ?? [knot.radius, knot.radius, knot.radius];
        this.pose(this.knots, view.index * shape.knots.length + part, this.localPoint(knot.p, size),
          dimensions[0] * size, dimensions[1] * size, dimensions[2] * size);
      }
      this.localPoint(shape.eye, size, this.eye);
      this.pose(this.pupils, view.index * 2, this.eye, .163 * size, .232 * size, .045 * size);
      this.position.copy(this.eye).addScaledVector(this.direction.set(0, 0, 1).applyQuaternion(this.bodyRotation), .020 * size);
      this.pose(this.eyes, view.index, this.position, .136 * size, .202 * size, .048 * size);
      const hasTarget = Boolean(encounter) || finitePoint(stalker.eyeTarget) || finitePoint(cameraPosition) || finitePoint(world.player);
      if (encounter) this.target.set(encounter.cameraPosition.x / SCALE, encounter.cameraPosition.z / SCALE, encounter.cameraPosition.y / SCALE);
      else if (finitePoint(stalker.eyeTarget)) this.target.set(stalker.eyeTarget.x / SCALE, stalker.eyeTarget.z / SCALE, stalker.eyeTarget.y / SCALE);
      else if (finitePoint(cameraPosition)) this.target.copy(cameraPosition);
      else if (finitePoint(world.player)) this.target.set(world.player.x / SCALE, (world.player.z + EYE_HEIGHT) / SCALE, world.player.y / SCALE);
      this.gaze.set(0, 0, .060 * size);
      if (hasTarget && this.target.distanceToSquared(this.position) < 45 ** 2) {
        this.inverseRotation.copy(this.bodyRotation).invert();
        this.target.sub(this.position).applyQuaternion(this.inverseRotation);
        if (this.target.z > .001) {
          let x = this.target.x / this.target.z * .16 * size, y = this.target.y / this.target.z * .19 * size;
          const clamp = Math.max(1, Math.hypot(x / (.081 * size), y / (.058 * size))); x /= clamp; y /= clamp;
          const front = .048 * size * Math.sqrt(Math.max(0, 1 - (x / (.136 * size)) ** 2 - (y / (.202 * size)) ** 2));
          this.gaze.set(x, y, front + .012 * size);
        }
      }
      this.position.add(this.gaze.applyQuaternion(this.bodyRotation));
      this.pose(this.pupils, view.index * 2 + 1, this.position, .029 * size, .125 * size, .012 * size);
    }
    this.group.visible = anyVisible;
    for (const [mesh, parts] of this.batches) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.boundingSphere ??= new THREE.Sphere(); mesh.boundingSphere.makeEmpty();
      for (const view of this.renderers.values()) if (view.visible) for (let part = 0; part < parts; part++) {
        mesh.getMatrixAt(view.index * parts + part, this.boundsMatrix);
        mesh.boundingSphere.union(this.boundsPart.copy(mesh.geometry.boundingSphere ?? this.computeSphere(mesh.geometry)).applyMatrix4(this.boundsMatrix));
      }
    }
  }

  computeSphere(geometry) { geometry.computeBoundingSphere(); return geometry.boundingSphere; }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const [mesh] of this.batches) mesh.dispose();
    Object.values(this.geometries).forEach((geometry) => geometry.dispose());
    Object.values(this.materials).forEach((material) => material.dispose());
    this.group.removeFromParent(); this.group.clear(); this.renderers.clear();
  }
}
