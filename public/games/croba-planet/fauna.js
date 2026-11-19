import {capRenderDistance} from './render-distance.js';
import {GoldRockBugRenderer} from './isopod-renderer.js';
import {updateIsopodGaze} from './isopod-gaze.js';
import * as THREE from "./vendor/three.module.js";
import { createCentipede, updateCentipede } from "./centipede.js";
import { beginCentipedeEncounter } from "./centipede-encounter.js";
import { attachIsopodToSurface, updateIsopodSurface } from "./isopod-surface.js";
import { createCreatureSurfaceMaps, applyCreatureSurface } from "./creature-materials.js";
import { SEABED_LEVEL } from "./terrain.js";
import { applyCentipedePatterns, centipedeLegPose, CENTIPEDE_SPIKES, centipedeSpikePose,
  createCentipedeEyeGeometry } from './centipede-details.js';

const SCALE = 25;
const TAU = Math.PI * 2;
const SAFE_CRASH_RADIUS = 180;
const ATTACK_RANGE = 58;
const ATTACK_INTERVAL = 2.2;

/** @typedef {{x:number,y:number,z:number}} Point3 */
/** @typedef {{id:string,x:number,y:number,z:number,homeX:number,homeY:number,seed:number,heading:number,size:number,crawling?:boolean,crawlTurn?:number}} Isopod */
/** @typedef {{id:string,x:number,y:number,z:number,platformId:string,lengthMeters:number,segments:Point3[],heading:number,state:'patrol'|'hunting',attackCooldown:number,phase:number,spacing:number,vertices:{x:number,y:number}[]}} Centipede */

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Seeded alien wildlife. All simulation distances use 25 units per metre.
 * @param {import('./terrain.js').Platform[]} platforms @param {number} [seed]
 * @param {import('./terrain.js').Platform[]} [submergedIce]
 * @param {import('./ice-spikes.js').IceSpike[]} [iceSpikes]
 * @returns {{isopods:Isopod[],centipedes:Centipede[]}}
 */
export function createFauna(platforms, seed = 1, submergedIce = [], iceSpikes = []) {
  if (!Number.isFinite(seed)) throw new TypeError("Wildlife seed must be finite.");
  const rng = random(seed ^ 0xc70ba);
  const isopods = Array.from({ length: 12 }, (_, index) => {
    const blue = index >= 4;
    const homeX = blue ? 1320 + rng() * 2050 : [-100, 240, 510, -320][index];
    const homeY = blue ? (rng() - 0.5) * 2100 : [210, 180, -210, 190][index];
    return { id: `ice-isopod-${index}`, x: homeX, y: homeY,
      z: blue ? -110 - rng() * 100 : SEABED_LEVEL + 30,
      homeX, homeY, seed: Math.floor(rng() * 10000), heading: rng() * TAU,
      size: 0.65 + rng() * 0.65 };
  });
  const habitat = { platforms, submergedIce, iceSpikes };
  for (const pod of isopods) {
    if (!attachIsopodToSurface(habitat, pod))
      throw new Error(`Could not find supported underwater ground for ${pod.id}.`);
  }
  const centipedes = [];
  const giantGlacier = platforms.find((p) => p.id === "hunting-glacier")
    ?? platforms.filter((p) => Math.hypot(p.x, p.y) > 500).sort((a, b) => b.rx * b.ry - a.rx * a.ry)[0];
  if (giantGlacier) {
    const length = giantGlacier.id === "hunting-glacier" ? 60
      : Math.min(60, Math.floor(Math.min(giantGlacier.rx, giantGlacier.ry) * 1.6 / SCALE));
    if (length >= 4) centipedes.push(createCentipede(giantGlacier, length, 147));
  }
  return { isopods, centipedes };
}

/** Follow supported island routes; only the head can deliver a fatal bite.
 * @param {import('./world.js').World & {isopods:Isopod[],centipedes:Centipede[]}} world @param {number} dt
 */
export function updateFauna(world, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const delta = Math.min(0.05, dt);
  const time = world.elapsed || 0;
  for (const pod of world.isopods ?? []) {
    if (pod.squidHeldBy || pod.squidRespawnIn > 0) {
      pod.crawling = false; pod.crawlTurn = 0; continue;
    }
    updateIsopodSurface(world, pod, time, delta);
    updateIsopodGaze(world,pod,delta);
  }
  let nearest = Infinity;
  let active = false;
  const player = world.player;
  const sheltered = Math.hypot(player.x - (world.ship?.x ?? 0), player.y - (world.ship?.y ?? -30)) < (world.ship?.shelterRadius ?? SAFE_CRASH_RADIUS);
  for (const hunter of world.centipedes ?? []) {
    if (hunter.squidHeldBy || hunter.squidRespawnIn > 0) continue;
    if (world.centipedeEncounter?.hunterId === hunter.id) continue;
    hunter.attackCooldown = Math.max(0, hunter.attackCooldown - delta);
    const distance = Math.hypot(player.x - hunter.x, player.y - hunter.y, player.z - hunter.z);
    const target = !player.swimming && !player.underwater && !sheltered ? player : null;
    const canHunt = updateCentipede(hunter, world.platforms, target, delta);
    if (canHunt) { nearest = Math.min(nearest, distance); active = true; }
    if (canHunt && !player.jumping && !player.falling && distance <= ATTACK_RANGE && hunter.attackCooldown === 0
      && !world.squidEncounter && !world.centipedeEncounter && !world.treeStalkerEncounter) {
      if (beginCentipedeEncounter(world, hunter)) hunter.attackCooldown = ATTACK_INTERVAL;
    }
  }
  world.threat = { active, distance: nearest,
    message: active ? "ICE CENTIPEDE HUNTING — GET TO WATER" : "NO HUNTER DETECTED" };
}

function instances(parent, geometry, material, count, name) {
  const object = new THREE.InstancedMesh(geometry, material, count);
  object.name = name;
  object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  object.frustumCulled = true;
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

/** Both the viewer and the shadow light need bounds from the current joint pose. */
function refreshInstances(object) {
  object.instanceMatrix.needsUpdate = true;
  object.computeBoundingSphere();
}

/** A segment's local X follows its 3D spine; local Y points out from its belly. */
function segmentFrame(hunter, index) {
  const segment = hunter.segments[index];
  const previous = hunter.segments[Math.max(0, index - 1)];
  let fx, fy, fz;
  if (index === 0) {
    fx = Math.cos(hunter.heading) * Math.cos(hunter.pitch || 0);
    fy = Math.sin(hunter.pitch || 0);
    fz = Math.sin(hunter.heading) * Math.cos(hunter.pitch || 0);
  } else {
    const length = Math.hypot(previous.x - segment.x, previous.y - segment.y,
      previous.z - segment.z) || 1;
    fx = (previous.x - segment.x) / length;
    fy = (previous.z - segment.z) / length;
    fz = (previous.y - segment.y) / length;
  }
  const horizontal = Math.hypot(fx, fz) || 1;
  const forward = new THREE.Vector3(fx, fy, fz);
  const right = new THREE.Vector3(-fz / horizontal, 0, fx / horizontal);
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const rotation = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(forward, up, right));
  return { origin: [segment.x / SCALE, segment.z / SCALE, segment.y / SCALE],
    forward, up, right, rotation };
}

function framePoint(frame, x, y, z) {
  return [frame.origin[0] + frame.forward.x * x + frame.up.x * y + frame.right.x * z,
    frame.origin[1] + frame.forward.y * x + frame.up.y * y + frame.right.y * z,
    frame.origin[2] + frame.forward.z * x + frame.up.z * y + frame.right.z * z];
}

/** Low-draw-call armored aliens. Spine positions are shared with the simulation. */
export class FaunaRenderer {
  constructor(world, materials = {}, quality = {}) {
    this.group = new THREE.Group();
    this.group.name = "croba-alien-fauna";
    this.geometries = {
      plate: new THREE.SphereGeometry(1, 12, 8),
      shell: new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2),
      rim: new THREE.TorusGeometry(1, 0.032, 5, 32).rotateX(Math.PI / 2),
      spike: new THREE.ConeGeometry(1, 1, 7),
      rib: new THREE.TorusGeometry(1, 0.022, 4, 18, Math.PI).rotateY(Math.PI / 2),
      bone: new THREE.CylinderGeometry(0.65, 1, 1, 5),
      claw: new THREE.CylinderGeometry(0.06, 1, 1, 7),
      eye: createCentipedeEyeGeometry(),
    };
    this.ownedMaterials = [
      new THREE.MeshPhysicalMaterial({ color: 0xbc2028, roughness: 0.38, metalness: 0.08,
        clearcoat: 0.3, clearcoatRoughness: 0.23, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x284752, roughness: 0.4, metalness: 0.22 }),
      new THREE.MeshStandardMaterial({ color: 0x798188, roughness: 0.55, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0xff8156, emissive: 0xff451a, emissiveIntensity: 2.4 }),
      new THREE.MeshStandardMaterial({ color: 0xa7eff3, emissive: 0x3acada, emissiveIntensity: 1.8 }),
      new THREE.MeshStandardMaterial({ color: 0xffcd46, roughness: 0.25, metalness: 0.72, emissive: 0x9d6c09, emissiveIntensity: 0.24 }),
      new THREE.MeshStandardMaterial({ color: 0xf7faf8, roughness: 0.6, emissive: 0x45575b, emissiveIntensity: 0.16 }),
      new THREE.MeshStandardMaterial({ color: 0x343e43, roughness: 0.72, metalness: 0.12 }),
      new THREE.MeshStandardMaterial({ color: 0x030708, roughness: 1 }),
    ];
    const [podShell, dark, hunterShell, orange, cyan, gold, white, seam, mouth] = this.ownedMaterials;
    this.surfaceMaps = { armor: createCreatureSurfaceMaps("armor"), skin: createCreatureSurfaceMaps("skin"),
      iris: createCreatureSurfaceMaps("iris") };
    for (const surface of [podShell, hunterShell, dark, seam])
      applyCreatureSurface(surface, this.surfaceMaps.armor, surface === podShell ? 0.5 : 0.35);
    applyCreatureSurface(gold, this.surfaceMaps.armor, 0.14);
    applyCreatureSurface(white, this.surfaceMaps.skin, 0.2);
    const markedShell = applyCentipedePatterns(hunterShell.clone());
    this.ownedMaterials.push(markedShell);
    const blackEyes = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true,
      roughness: .28, metalness: 0, clearcoat: .28, clearcoatRoughness: .3, emissive: 0x000000 });
    this.ownedMaterials.push(blackEyes);
    for (const eye of [orange, cyan]) {
      applyCreatureSurface(eye, this.surfaceMaps.iris, 0.1);
      eye.emissiveMap = this.surfaceMaps.iris.map;
      eye.roughness = 0.2;
    }
    this.renderers = new Map();
    this.isopods=new GoldRockBugRenderer(world,{shell:podShell,dark,gold},this.surfaceMaps,quality);
    this.group.add(this.isopods.group);
    for (const hunter of world.centipedes ?? []) {
      const group = new THREE.Group(); group.name = hunter.id; this.group.add(group);
      const count = hunter.segments.length;
      this.renderers.set(hunter.id, { group,
        plates: instances(group, this.geometries.shell, markedShell, count, "centipede-armored-segments"),
        bellies: instances(group, this.geometries.plate, white, count, "white-centipede-underside"),
        ribs: instances(group, this.geometries.rib, seam, count * 2, "centipede-carapace-grooves"),
        collars: instances(group, this.geometries.rim, seam, count, "centipede-dorsal-spine-collars"),
        spikes: instances(group, this.geometries.spike, hunterShell, count * CENTIPEDE_SPIKES.length, "gray-centipede-armor-spikes"),
        legs: instances(group, this.geometries.bone, dark, count * 4, "centipede-jointed-leg-pairs"),
        eyes: instances(group, this.geometries.eye, blackEyes, 4, "hunter-black-eyes-white-rings"),
        jaws: instances(group, this.geometries.claw, hunterShell, 4, "centipede-mandibles"),
        mouth: instances(group, this.geometries.plate, mouth, 1, "centipede-mouth-cavity"),
        appendages: instances(group, this.geometries.bone, dark, 16, "centipede-segmented-feelers-and-terminal-legs"),
        motion: { x: hunter.x, y: hunter.y, z: hunter.z, phase: 0 },
      });
    }
    this.transform = new THREE.Object3D();
    this.start = new THREE.Vector3(); this.end = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0); this.direction = new THREE.Vector3();
    this.eyeRotations = [-1, 1].map(side => new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1), new THREE.Vector3(.25, .15, side * .956).normalize()));
    this.disposed = false;
    this.update(world, 0, true);
  }

  pose(object, index, x, y, z, sx, sy, sz, heading = 0) {
    this.transform.position.set(x, y, z);
    this.transform.rotation.set(0, heading, 0);
    this.transform.scale.set(sx, sy, sz);
    this.transform.updateMatrix(); object.setMatrixAt(index, this.transform.matrix);
  }

  poseOnFrame(object, index, frame, x, y, z, sx, sy, sz, localRotation) {
    this.transform.position.set(...framePoint(frame, x, y, z));
    this.transform.quaternion.copy(frame.rotation);
    if (localRotation) this.transform.quaternion.multiply(localRotation);
    this.transform.scale.set(sx, sy, sz);
    this.transform.updateMatrix(); object.setMatrixAt(index, this.transform.matrix);
  }

  bone(object, index, a, b, radius) {
    this.start.set(...a); this.end.set(...b);
    this.direction.subVectors(this.end, this.start);
    const length = this.direction.length();
    this.transform.position.copy(this.start).add(this.end).multiplyScalar(0.5);
    this.transform.quaternion.setFromUnitVectors(this.up, this.direction.divideScalar(length || 1));
    this.transform.scale.set(radius, length, radius);
    this.transform.updateMatrix(); object.setMatrixAt(index, this.transform.matrix);
  }

  update(world, time, reducedMotion = false, cameraPosition, quality = {}) {
    if (this.disposed) return;
    const range = capRenderDistance(quality,quality?.mobile ? 65 : 80);
    const near = (p) => !cameraPosition || Math.hypot(p.x / SCALE - cameraPosition.x,
      p.z / SCALE - cameraPosition.y, p.y / SCALE - cameraPosition.z) < range;
    this.isopods.update(world,time,reducedMotion,cameraPosition,quality);
    for (const hunter of world.centipedes ?? []) {
      const view = this.renderers.get(hunter.id); if (!view) continue;
      view.group.visible = !(hunter.squidRespawnIn > 0) && hunter.segments.some(near);
      if (!view.group.visible) continue;
      const width = hunter.lengthMeters >= 50 ? 0.85 : 0.30;
      const encounter = world.centipedeEncounter?.hunterId === hunter.id
        ? world.centipedeEncounter : null;
      const progress = Number.isFinite(encounter?.progress)
        ? Math.max(0, Math.min(1, encounter.progress)) : 0;
      const opening = encounter?.phase === "bitten" ? Math.sin(progress * Math.PI)
        : encounter?.phase === "eating" ? 0.12 + Math.sin(progress * Math.PI * 3) ** 2 * 0.22 : 0;
      const motion = view.motion, travel = Math.hypot(hunter.x - motion.x, hunter.y - motion.y, hunter.z - motion.z);
      if (!reducedMotion && !encounter && travel < hunter.spacing * 2)
        motion.phase = (motion.phase + travel / SCALE / (width * 2.2) * TAU) % TAU;
      motion.x = hunter.x; motion.y = hunter.y; motion.z = hunter.z;
      const gaitPhase = reducedMotion || encounter ? 0 : motion.phase;
      for (let index = 0; index < hunter.segments.length; index++) {
        const frame = segmentFrame(hunter, index);
        const taper = index > hunter.segments.length - 5 ? 0.58 : 1;
        const plateLength = hunter.spacing / SCALE * (index % 2 ? .62 : .68);
        this.poseOnFrame(view.plates, index, frame, 0, width * 0.52, 0,
          plateLength, width * 0.50 * taper, width * taper);
        this.poseOnFrame(view.bellies, index, frame, 0, width * 0.44, 0,
          hunter.spacing / SCALE * 0.64, width * 0.21 * taper, width * 0.82 * taper);
        const ribOffset = Math.min(0.32, hunter.spacing / SCALE * 0.26);
        const crossSection = Math.sqrt(1 - (ribOffset / plateLength) ** 2) * 1.01;
        for (const [ribIndex, offset] of [-ribOffset, ribOffset].entries())
          this.poseOnFrame(view.ribs, index * 2 + ribIndex, frame, offset, width * 0.52, 0,
            0.8, width * 0.50 * taper * crossSection, width * taper * crossSection);
        const collar = centipedeSpikePose(CENTIPEDE_SPIKES[3], width, taper, plateLength);
        this.poseOnFrame(view.collars, index, frame, ...collar.base,
          width * .085 * taper, .45, width * .085 * taper);
        for (let spike = 0; spike < CENTIPEDE_SPIKES.length; spike++) {
          const pose = centipedeSpikePose(CENTIPEDE_SPIKES[spike], width, taper, plateLength);
          this.bone(view.spikes, index * CENTIPEDE_SPIKES.length + spike,
            framePoint(frame, ...pose.base), framePoint(frame, ...pose.tip), pose.radius);
        }
        for (const [sideIndex, side] of [-1, 1].entries()) {
          const leg = centipedeLegPose(gaitPhase, index, side, width);
          const knee = framePoint(frame, ...leg.knee), foot = framePoint(frame, ...leg.foot);
          this.bone(view.legs, index * 4 + sideIndex * 2,
            framePoint(frame, ...leg.hip), knee, width * 0.085);
          this.bone(view.legs, index * 4 + sideIndex * 2 + 1, knee, foot, width * 0.07);
        }
      }
      const head = segmentFrame(hunter, 0);
      view.mouth.visible = Boolean(encounter);
      this.poseOnFrame(view.mouth, 0, head, width * 1.45, width * 0.4, 0,
        width * 0.55, width * (0.18 + opening * 0.32), width * (0.45 + opening * 0.2));
      for (const [index, side] of [-1, 1].entries()) {
        for (const [eye, position] of [[.32, .94], [.86, .78]].entries())
          this.poseOnFrame(view.eyes, index * 2 + eye, head, width * position[0], width * position[1], side * width * .55,
            width * .15, width * .15, width * .15, this.eyeRotations[index]);
        const start = framePoint(head, width, width * 0.45, side * width * 0.45);
        const middle = framePoint(head, width * 1.8, width * 0.35,
          side * width * (0.65 + opening * 0.45));
        const tip = framePoint(head, width * (2.2 - opening * 0.15), width * 0.30,
          side * width * (0.20 + opening * 0.9));
        this.bone(view.jaws, index * 2, start, middle, width * 0.16);
        this.bone(view.jaws, index * 2 + 1, middle, tip, width * 0.1);
        // A single pair of jointed sensory antennae projects beyond the head.
        // Their gentle probing is tied to physical gait rather than wall time.
        for (let link = 0; link < 5; link++) {
          const point = u => framePoint(head, width * (.65 + u * 3.4),
            width * (.92 + Math.sin(u * Math.PI) * .24 - u * .16),
            side * width * (.36 + u * 1.6 + Math.sin(gaitPhase * .5 + u * 2) * .12 * u));
          this.bone(view.appendages, index * 5 + link, point(link / 5), point((link + 1) / 5), width * (.047 - link * .007));
        }
      }
      const tail = segmentFrame(hunter, hunter.segments.length - 1);
      for (const [index, side] of [-1, 1].entries()) {
        const points = [[-.20, .42, side * .60], [-1.0, .46, side * 1.05], [-1.90, .33, side * 1.42], [-2.8, .16, side * 1.55]];
        for (let link = 0; link < 3; link++) this.bone(view.appendages, 10 + index * 3 + link,
          framePoint(tail, ...points[link].map(value => value * width)),
          framePoint(tail, ...points[link + 1].map(value => value * width)), width * (.065 - link * .018));
      }
      for (const object of [view.plates, view.bellies, view.ribs, view.collars, view.spikes, view.legs, view.eyes, view.jaws, view.mouth, view.appendages])
        refreshInstances(object);
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.isopods.dispose();
    this.group.traverse((object) => { if (object.isInstancedMesh) object.dispose(); });
    Object.values(this.geometries).forEach((geometry) => geometry.dispose());
    this.ownedMaterials.forEach((material) => material.dispose());
    Object.values(this.surfaceMaps).forEach((maps) => maps.dispose());
    this.group.removeFromParent();
    this.group.clear(); this.renderers.clear();
  }
}
