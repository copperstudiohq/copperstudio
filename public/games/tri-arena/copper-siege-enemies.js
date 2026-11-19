import * as THREE from './assets/three.module.js';
import { addGolemJoint, animateGolemMagic } from './golem-magic.js';
import { GROUND_SUPPORT_PROFILES, registerGroundSupports } from './ground-support.js';

export const COPPER_SIEGE_TYPES = Object.freeze(['copper-drill-worm', 'copper-head-catapult']);
const cube = new THREE.BoxGeometry(1, 1, 1);
const colors = { copper: 0xbc7446, edge: 0xe6a46b, shadow: 0x78462f, patina: 0x397b74, dark: 0x172b2d, blue: 0x2fa5f2, cyan: 0x7ddaff };
const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, roughness: .48, metalness: .72, flatShading: true }),
]));
materials.blue.emissive.set(0x1764c1); materials.blue.emissiveIntensity = .35;
materials.cyan.emissive.set(0x2fa5f2); materials.cyan.emissiveIntensity = .45;
const up = new THREE.Vector3(0, 1, 0), delta = new THREE.Vector3();
const origin = new THREE.Vector3(), kneePoint = new THREE.Vector3(), footPoint = new THREE.Vector3();
const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

function joint(parent, name, x = 0, y = 0, z = 0) {
  const group = new THREE.Group(); group.name = name; group.position.set(x, y, z); parent.add(group); return group;
}
function box(parent, name, color, position, size, anatomy = 'body', extra = {}) {
  const mesh = new THREE.Mesh(cube, materials[color]);
  mesh.name = name; mesh.position.set(...position); mesh.scale.set(...size);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, anatomicalPart: anatomy, critical: anatomy === 'core', ...extra };
  parent.add(mesh); return mesh;
}
function segment(mesh, from, to, width, depth = width) {
  delta.subVectors(to, from);
  mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.scale.set(width, delta.length(), depth);
  mesh.quaternion.setFromUnitVectors(up, delta.normalize());
}
const weaponAlive = (motion, id) => !motion.weaponState?.[id] || motion.weaponState[id].remaining > 0;

function createWorm() {
  const root = new THREE.Group(); root.name = 'copper-drill-worm';
  const body = joint(root, 'drill-worm-body'), segments = [], links = [], cleats = [];
  for (let index = 0; index < 6; index++) {
    const section = joint(body, `worm-segment-${index}`, 0, .86, 1.55 - index * .8);
    const taper = 1 - index * .045;
    const hull = box(section, 'worm-armored-segment', 'copper', [0, 0, 0], [1.36 * taper, .95 * taper, .77]);
    box(section, 'worm-dorsal-plate', 'edge', [0, .43 * taper, -.02], [.91 * taper, .18, .71]);
    box(section, 'worm-belly-runner', 'shadow', [0, -.43 * taper, 0], [.96 * taper, .2, .74]);
    for (const side of [-1, 1]) {
      box(section, 'worm-side-armor', 'edge', [side * .64 * taper, -.01, 0], [.17, .64 * taper, .63]);
      box(section, 'worm-armor-inset', 'patina', [side * .735 * taper, .04, -.04], [.045, .22, .31], 'body', { detailPriority: 5, surfaceDetail: true });
      cleats.push(box(section, 'worm-crawl-cleat', 'shadow', [side * .48 * taper, -.7, .07], [.3, .17, .46], 'arm'));
    }
    section.userData = { index, restZ: section.position.z, hull, taper };
    if (index > 0) {
      const link = box(section, 'worm-blue-intersegment-link', 'blue', [0, 0, .43], [.64 * taper, .58 * taper, .18]);
      link.userData.rigParent = segments[index - 1].userData.hull.uuid;
      hull.userData.rigParent = link.uuid;
      links.push({ anchor: link, adjacent: [segments[index - 1].userData.hull, hull], phase: index * .8 });
    }
    segments.push(section);
  }
  const front = segments[0], head = joint(front, 'worm-drill-head', 0, 0, .53);
  const collar = box(head, 'worm-drill-collar', 'shadow', [0, 0, 0], [1.42, 1.05, .23], 'head');
  collar.userData.rigParent = front.userData.hull.uuid;
  const core = box(front, 'worm-blue-core', 'cyan', [0, .12, .4], [.18, .18, .12], 'core', { detailPriority: 95, surfaceDetail: true });
  for (const side of [-1, 1]) box(head, 'worm-side-sensor', 'blue', [side * .56, .33, .135], [.2, .16, .065], 'head', { detailPriority: 30, surfaceDetail: true });
  const drill = joint(head, 'worm-rotating-drill', 0, 0, .14), drillParts = [];
  for (let step = 0; step < 6; step++) {
    const width = 1.25 - step * .18, z = .12 + step * .22;
    const shaft = box(drill, `worm-drill-step-${step}`, step % 2 ? 'copper' : 'edge', [0, 0, z], [width, width, .26], 'arm', { weaponId: 'drill' });
    shaft.userData.rigParent = (drillParts.at(-1) || collar).uuid;
    drillParts.push(shaft);
    for (let side = 0; side < 2; side++) {
      const angle = step * .8 + side * Math.PI, radius = width * .49;
      const tooth = box(drill, 'worm-spiral-cutting-tooth', 'edge', [Math.cos(angle) * radius, Math.sin(angle) * radius, z + .08], [.2, .2, .28], 'arm', { weaponId: 'drill', rigParent: shaft.uuid });
      tooth.rotation.z = angle;
    }
  }
  const tail = joint(segments.at(-1), 'worm-blunt-armored-tail', 0, 0, -.49);
  box(tail, 'worm-blunt-tail-cap', 'shadow', [0, 0, 0], [.88, .7, .34]);
  box(tail, 'worm-tail-copper-bumper', 'edge', [0, 0, -.16], [.96, .76, .17]);
  root.userData = { type: 'copper-drill-worm', siegeEnemy: true, body, head, core, eye: core,
    segments, drill, tail, cleats, limbs: [], action: { phase: 'chase', since: 0, last: null, value: 0, from: 0, spin: 0 } };
  for (const link of links) addGolemJoint(root, link.anchor, link.adjacent, { name: 'worm-magic-joint', phase: link.phase });
  registerGroundSupports(root, cleats);
  return root;
}

function poseCrawlerLeg(leg, forward = 0, lift = 0, bob = 0, bodyDrop = 0) {
  const data = leg.userData;
  leg.position.y = .88 + bob - bodyDrop;
  kneePoint.set(data.side * .35, -.3 - bob * .5, data.front * .11);
  footPoint.set(data.side * .62, -.78 - bob + bodyDrop + lift, .08 + forward);
  data.knee.position.copy(kneePoint); data.foot.position.copy(footPoint);
  segment(data.upper, origin, kneePoint, .26);
  segment(data.lower, kneePoint, footPoint, .22);
}

/** The shield robot's copper helmet, centered for both loaded and flying ammo. */
export function createShieldRobotHead(extra = {}) {
  const head = new THREE.Group(); head.name = 'shield-robot-head';
  head.userData.shieldRobotHead = true;
  const plate = (name, color, position, size, detail = {}) => box(head, name, color, position, size, 'arm',
    { ...extra, ...detail, critical: false });
  const back = plate('shield-head-back', 'copper', [0, -.07, -.3], [.74, .68, .18]);
  const attached = { rigParent: back.uuid };
  plate('shield-head-interior', 'dark', [0, -.08, -.02], [.62, .6, .46], attached);
  plate('shield-head-roof', 'edge', [0, .26, .01], [.8, .14, .75], attached);
  plate('shield-head-brow', 'copper', [0, .17, .35], [.78, .12, .18], attached);
  for (const side of [-1, 1]) {
    plate('shield-head-side', 'copper', [side * .36, -.06, -.01], [.14, .62, .67], attached);
    plate('shield-head-cheek', 'copper', [side * .235, -.21, .35], [.27, .42, .18], attached);
    plate('shield-head-cheek-edge', 'edge', [side * .235, -.4, .36], [.28, .07, .2], attached);
  }
  plate('shield-head-crest', 'shadow', [0, .37, -.05], [.13, .13, .58], attached);
  plate('shield-head-visor-slot', 'dark', [0, .055, .245], [.61, .1, .045],
    { ...attached, detailPriority: 50, surfaceDetail: true });
  return head;
}

function createCatapult() {
  const root = new THREE.Group(); root.name = 'copper-head-catapult';
  const body = joint(root, 'head-catapult-body');
  const chassis = box(body, 'catapult-copper-chassis', 'copper', [0, .92, 0], [1.52, .57, 2.15]);
  box(body, 'catapult-underframe', 'shadow', [0, .65, 0], [1.34, .22, 1.95]);
  box(body, 'catapult-front-bumper', 'edge', [0, .93, 1.12], [1.62, .36, .2]);
  box(body, 'catapult-rear-bumper', 'edge', [0, .93, -1.12], [1.62, .36, .2]);
  const core = box(body, 'catapult-blue-core', 'cyan', [0, 1.12, 1.225], [.19, .19, .07], 'core', { detailPriority: 95, surfaceDetail: true });
  for (const side of [-1, 1]) {
    box(body, 'catapult-side-armor', 'edge', [side * .78, .99, 0], [.17, .44, 1.7]);
    box(body, 'catapult-patina-inset', 'patina', [side * .88, 1.02, .1], [.045, .21, .65], 'body', { detailPriority: 5, surfaceDetail: true });
    box(body, 'catapult-throwing-tower', 'copper', [side * .57, 1.63, -.22], [.28, 1.25, .4]);
    box(body, 'catapult-tower-cap', 'edge', [side * .57, 2.22, -.22], [.4, .18, .53]);
  }
  const axle = box(body, 'catapult-blue-axle', 'blue', [0, 2.07, -.22], [1.58, .25, .27]);
  const launcher = joint(body, 'catapult-throwing-arm', 0, 2.07, -.22);
  const beam = box(launcher, 'catapult-launcher-beam', 'copper', [0, .15, 0], [.29, 1.96, .3], 'arm', { rigParent: axle.uuid });
  box(launcher, 'catapult-launcher-spine', 'edge', [0, .22, -.19], [.12, 1.62, .1], 'arm', { rigParent: beam.uuid });
  const weight = box(launcher, 'catapult-counterweight', 'shadow', [0, -.78, 0], [.77, .45, .58], 'arm', { rigParent: beam.uuid });
  box(launcher, 'catapult-counterweight-cap', 'edge', [0, -.79, .31], [.8, .31, .1], 'arm', { rigParent: weight.uuid });
  const cup = joint(launcher, 'catapult-head-cup', 0, 1.1, 0);
  const pan = box(cup, 'catapult-cup-base', 'shadow', [0, 0, 0], [.93, .18, .94], 'arm', { weaponId: 'launcher', rigParent: beam.uuid });
  for (const side of [-1, 1]) box(cup, 'catapult-cup-rim', 'edge', [side * .48, .13, 0], [.14, .36, .99], 'arm', { weaponId: 'launcher', rigParent: pan.uuid });
  box(cup, 'catapult-cup-back', 'copper', [0, .13, -.46], [.92, .34, .13], 'arm', { weaponId: 'launcher', rigParent: pan.uuid });
  const ammo = createShieldRobotHead({ weaponId: 'launcher', rigParent: pan.uuid });
  ammo.name = 'catapult-shield-robot-head-ammo'; ammo.position.set(0, .54, .02); cup.add(ammo);
  const legs = [], links = [];
  for (const front of [-1, 1]) for (const side of [-1, 1]) {
    const leg = joint(root, 'catapult-crawler-leg', side * .68, .88, front * .76);
    const hip = box(leg, 'catapult-leg-hip', 'blue', [0, 0, 0], [.28, .28, .28], 'arm', { rigParent: chassis.uuid });
    const upper = box(leg, 'catapult-upper-leg', 'copper', [0, 0, 0], [1, 1, 1], 'arm', { localVoxelGrid: true, rigParent: hip.uuid });
    const knee = box(leg, 'catapult-blue-knee', 'blue', [0, 0, 0], [.29, .27, .28], 'arm', { rigParent: upper.uuid });
    const lower = box(leg, 'catapult-lower-leg', 'edge', [0, 0, 0], [1, 1, 1], 'arm', { localVoxelGrid: true, rigParent: upper.uuid });
    const foot = box(leg, 'catapult-planted-foot', 'shadow', [0, 0, 0], [.58, .18, .62], 'leg', { rigParent: lower.uuid });
    leg.userData = { side, front, upper, knee, lower, foot, gaitOffset: side === front ? 0 : .5 };
    poseCrawlerLeg(leg); legs.push(leg);
    links.push({ anchor: hip, adjacent: [chassis, upper] }, { anchor: knee, adjacent: [upper, lower] });
  }
  root.userData = { type: 'copper-head-catapult', siegeEnemy: true, body, core, eye: core, legs, limbs: legs,
    launcher, cup, ammo, axle, action: { phase: 'chase', since: 0, last: null, value: 0, from: 0 } };
  launcher.rotation.x = -.9;
  // Keep the loaded shield robot's recessed T-shaped visor upright in its cup.
  ammo.rotation.x = .9;
  for (const link of links) addGolemJoint(root, link.anchor, link.adjacent, { name: 'catapult-magic-joint' });
  addGolemJoint(root, axle, [chassis, beam], { name: 'catapult-magic-axle' });
  registerGroundSupports(root, legs);
  return root;
}

export function createCopperSiegeEnemy(type) {
  if (type === 'copper-drill-worm') return createWorm();
  if (type === 'copper-head-catapult') return createCatapult();
  throw new TypeError(`Unknown copper siege enemy: ${String(type)}`);
}

/** Articulate only source parts; missing voxel cells stay missing through every animation. */
export function animateCopperSiegeEnemy(root, time, speed = 0, phase = 'chase', motion = {}) {
  const data = root.userData, action = data.action;
  const clock = Number.isFinite(time) ? time : 0;
  const actualSpeed = Number.isFinite(speed) ? Math.abs(speed) : 0;
  const maxDrop = GROUND_SUPPORT_PROFILES[data.type].maxDrop;
  const bodyDrop = Number.isFinite(motion.bodyDrop) ? Math.max(0, Math.min(maxDrop, motion.bodyDrop)) : 0;
  const distance = Number.isFinite(motion.distance) ? Math.max(0, motion.distance) : Math.max(0, clock) * actualSpeed;
  const dt = action.last === null ? 0 : Math.min(.05, Math.max(0, clock - action.last));
  if (phase !== action.phase) { action.from = action.value; action.phase = phase; action.since = clock; }
  const target = phase === 'windup' ? 1 : phase === 'strike' ? -1 : 0;
  const duration = phase === 'strike' ? .13 : phase === 'windup' ? .28 : .38;
  action.value = THREE.MathUtils.lerp(action.from, target, smooth((clock - action.since) / duration));
  if (data.type === 'copper-drill-worm') {
    const moving = Math.min(1, actualSpeed / 2.8) * (1 - bodyDrop / maxDrop);
    data.segments.forEach((section, index) => {
      section.position.x = Math.sin(distance * 2.1 - index * .62) * moving * .23;
      section.position.y = .86 + Math.sin(distance * 3.2 - index * .8) * moving * .055 - bodyDrop;
      section.position.z = section.userData.restZ - action.value * .12 * (1 - index / 6);
      section.rotation.y = Math.cos(distance * 2.1 - index * .62) * moving * .13;
      section.rotation.x = action.value * .035;
    });
    for (const cleat of data.cleats) cleat.position.y = -.7 + bodyDrop;
    if (weaponAlive(motion, 'drill')) action.spin += dt * (phase === 'windup' ? 18 : phase === 'strike' ? 36 : 6);
    data.drill.rotation.z = action.spin;
    // The wide rotating square drill hinges upward only when its corners would meet the floor.
    let drillRadius = .625 * (Math.abs(Math.cos(action.spin)) + Math.abs(Math.sin(action.spin)));
    for (let step = 0; step < 6; step++) {
      const angle = action.spin + step * .8;
      drillRadius = Math.max(drillRadius, (1.25 - step * .18) * .49 * Math.abs(Math.sin(angle))
        + .1 * (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle))));
    }
    data.head.position.y = Math.max(0, drillRadius + .025 + Math.max(0, action.value) * .075 - data.segments[0].position.y);
  } else {
    const cycle = distance / 1.1, moving = actualSpeed > .03 && bodyDrop < maxDrop;
    const bob = moving ? Math.abs(Math.sin(cycle * Math.PI * 2)) * .035 * (1 - bodyDrop / maxDrop) : 0;
    data.body.position.y = bob - bodyDrop;
    data.body.rotation.x = -action.value * .035;
    for (const leg of data.legs) {
      const t = ((cycle + leg.userData.gaitOffset) % 1 + 1) % 1;
      const swing = Math.max(0, (t - .62) / .38);
      const forward = !moving ? 0 : t < .62 ? 1.1 * (.31 - t) : 1.1 * .62 * (-.5 + smooth(swing));
      const lift = moving ? Math.sin(Math.PI * swing) * .23 : 0;
      poseCrawlerLeg(leg, forward, lift, bob, bodyDrop);
    }
    if (weaponAlive(motion, 'launcher')) data.launcher.rotation.x = -.9 - action.value * (action.value > 0 ? .3 : 2.05);
    data.ammo.rotation.x = -data.launcher.rotation.x;
  }
  action.last = clock;
  animateGolemMagic(root, clock, motion.partState);
}
