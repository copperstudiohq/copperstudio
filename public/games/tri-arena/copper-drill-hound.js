import * as THREE from './assets/three.module.js';
import { addGolemJoint, animateGolemMagic } from './golem-magic.js';

export const COPPER_DRILL_HOUND_TYPE = 'copper-drill-hound';
/** Actor origin and scale, placing an existing robot's pelvis on the saddle. */
export const HOUND_RIDER_SEAT = Object.freeze({ x: 0, y: .95, z: -.15, scale: .8 });
const cube = new THREE.BoxGeometry(1, 1, 1);
const palette = { copper: 0xbc7446, edge: 0xe6a46b, shadow: 0x78462f, patina: 0x397b74, dark: 0x172b2d, blue: 0x2fa5f2, cyan: 0x7ddaff };
const materials = Object.fromEntries(Object.entries(palette).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, roughness: .48, metalness: .72, flatShading: true }),
]));
materials.blue.emissive.set(0x1764c1); materials.blue.emissiveIntensity = .35;
materials.cyan.emissive.set(0x2fa5f2); materials.cyan.emissiveIntensity = .45;
const up = new THREE.Vector3(0, 1, 0), delta = new THREE.Vector3();
const origin = new THREE.Vector3(), knee = new THREE.Vector3(), foot = new THREE.Vector3();
const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

function joint(parent, name, x = 0, y = 0, z = 0) {
  const group = new THREE.Group(); group.name = name; group.position.set(x, y, z); parent.add(group); return group;
}
function box(parent, name, color, position, size, anatomy = 'body', extra = {}) {
  const mesh = new THREE.Mesh(cube, materials[color]);
  mesh.name = name; mesh.position.set(...position); mesh.scale.set(...size);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, anatomicalPart: anatomy, critical: anatomy === 'core', cutHits: 2, ...extra };
  parent.add(mesh); return mesh;
}
function segment(mesh, from, to, width, depth = width) {
  delta.subVectors(to, from); mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.scale.set(width, delta.length(), depth); mesh.quaternion.setFromUnitVectors(up, delta.normalize());
}
function poseLeg(leg, forward = 0, lift = 0, bob = 0, bodyDrop = 0) {
  const data = leg.userData;
  leg.position.y = data.hipHeight + bob - bodyDrop;
  foot.set(data.side * .28, .12 - data.hipHeight - bob + bodyDrop + lift, data.front * .1 + forward);
  knee.copy(foot).multiplyScalar(.52); knee.z -= data.front * .22; knee.x += data.side * .07;
  data.knee.position.copy(knee); data.foot.position.copy(foot);
  segment(data.upper, origin, knee, data.front > 0 ? .25 : .33, .28);
  segment(data.lower, knee, foot, .19, .21);
}

/** A copper wolf carries a rotating, stepped drill in place of its head. */
export function createCopperDrillHound() {
  const root = new THREE.Group(); root.name = COPPER_DRILL_HOUND_TYPE;
  const body = joint(root, 'hound-body');
  const spine = box(body, 'hound-fixed-spine', 'shadow', [0, 1.07, -.05], [.61, .48, 1.92]);
  const shoulders = box(body, 'hound-copper-shoulders', 'copper', [0, 1.16, .86], [.96, .79, .35]);
  const haunches = box(body, 'hound-copper-haunches', 'copper', [0, 1.03, -.92], [.86, .67, .36]);
  for (const side of [-1, 1]) {
    box(body, 'hound-shoulder-edge', 'edge', [side * .48, 1.19, .86], [.15, .61, .4]);
    box(body, 'hound-haunch-edge', 'edge', [side * .42, 1.06, -.93], [.15, .53, .37]);
  }
  box(body, 'hound-fixed-wolf-torso', 'copper', [0, 1.09, -.05], [.85, .69, 1.57]);
  box(body, 'hound-armored-back', 'edge', [0, 1.44, -.08], [.76, .18, 1.47]);
  box(body, 'hound-tucked-belly', 'shadow', [0, .77, -.12], [.64, .23, 1.45]);
  for (const side of [-1, 1]) {
    box(body, 'hound-fixed-copper-flank', 'copper', [side * .43, 1.12, -.08], [.17, .59, 1.36]);
    box(body, 'hound-flank-patina-inset', 'patina', [side * .525, 1.18, -.19], [.035, .19, .58], 'body',
      { detailPriority: 5, surfaceDetail: true });
  }
  const saddleBridge = box(body, 'hound-saddle-bridge', 'shadow', [0, 1.61, -.17], [.48, .14, .91], 'arm', { rigParent: spine.uuid });
  const saddle = box(body, 'hound-copper-saddle', 'copper', [0, 1.73, -.15], [.69, .15, .71], 'arm',
    { structuralId: 'saddle', rigParent: saddleBridge.uuid });
  for (const side of [-1, 1]) box(body, 'hound-saddle-rim', 'edge', [side * .34, 1.79, -.15], [.09, .11, .72], 'arm',
    { structuralId: 'saddle', rigParent: saddle.uuid });
  box(body, 'hound-saddle-cantle', 'shadow', [0, 1.84, -.49], [.7, .23, .13], 'arm', { structuralId: 'saddle', rigParent: saddle.uuid });
  const neck = box(body, 'hound-blue-neck', 'blue', [0, 1.38, 1.19], [.37, .36, .36], 'head', { rigParent: shoulders.uuid });
  const head = joint(body, 'hound-drill-head-mount', 0, 1.43, 1.35);
  const collar = box(head, 'hound-drill-neck-collar', 'shadow', [0, 0, 0], [1.04, .96, .23], 'head', { rigParent: neck.uuid });
  const drill = joint(head, 'hound-spinning-drill-head', 0, 0, .14), rings = [];
  for (let index = 0; index < 6; index++) {
    const width = 1.0 - index * .15, z = .14 + index * .23;
    const ring = box(drill, 'hound-stepped-drill-head', index % 2 ? 'copper' : 'edge', [0, 0, z], [width, width, .27], 'arm',
      { weaponId: 'drill', rigParent: (rings.at(-1) || collar).uuid });
    rings.push(ring);
    for (const opposite of [0, Math.PI]) {
      const angle = index * .8 + opposite;
      const ridge = box(drill, 'hound-helical-head-cutter', 'edge', [Math.cos(angle) * width * .48, Math.sin(angle) * width * .48, z + .05], [.17, .17, .3], 'arm',
        { weaponId: 'drill', rigParent: ring.uuid });
      ridge.rotation.z = angle;
    }
  }
  const core = box(body, 'hound-blue-chest-core', 'cyan', [0, 1.28, 1.075], [.17, .17, .075], 'core',
    { detailPriority: 95, surfaceDetail: true, rigParent: shoulders.uuid });
  const tail = joint(body, 'hound-wolf-tail', 0, 1.17, -1.1);
  let previous = haunches;
  for (let index = 0; index < 4; index++) {
    const piece = box(tail, 'hound-tapered-tail-segment', index === 3 ? 'patina' : 'copper', [0, index * .08, -.18 - index * .28],
      [.27 - index * .045, .25 - index * .04, .35], 'arm', { rigParent: previous.uuid });
    previous = piece;
  }
  const legs = [], links = [];
  for (const front of [-1, 1]) for (const side of [-1, 1]) {
    const leg = joint(root, 'hound-wolf-leg', side * (front > 0 ? .47 : .42), 0, front * .77);
    const supportId = `hound-leg-${legs.length}`;
    const armor = front > 0 ? shoulders : haunches;
    const hip = box(leg, 'hound-blue-hip', 'blue', [0, 0, 0], [.26, .27, .29], 'arm', { balanceId: supportId, rigParent: armor.uuid });
    const upper = box(leg, 'hound-upper-leg', 'copper', [0, 0, 0], [1, 1, 1], 'arm', { balanceId: supportId, localVoxelGrid: true, rigParent: hip.uuid });
    const cap = box(leg, 'hound-blue-knee', 'blue', [0, 0, 0], [.25, .23, .26], 'arm', { balanceId: supportId, rigParent: upper.uuid });
    const lower = box(leg, 'hound-lower-leg', 'edge', [0, 0, 0], [1, 1, 1], 'arm', { balanceId: supportId, localVoxelGrid: true, rigParent: upper.uuid });
    const paw = joint(leg, 'hound-paw');
    const boot = box(paw, 'hound-terminal-paw', 'shadow', [0, 0, .06], [.39, .23, .52], 'leg',
      { balanceId: supportId, structuralId: supportId, rigParent: lower.uuid });
    for (const toe of [-1, 0, 1]) box(paw, 'hound-copper-claw', 'edge', [toe * .12, -.03, .33], [.075, .1, .14], 'arm',
      { balanceId: supportId, structuralId: supportId, rigParent: boot.uuid });
    leg.userData = { side, front, hipHeight: front > 0 ? 1.1 : .98, upper, knee: cap, lower, foot: paw, boot,
      supportId, gaitOffset: side === front ? 0 : .5 };
    poseLeg(leg); legs.push(leg);
    links.push({ anchor: hip, adjacent: [armor, upper] }, { anchor: cap, adjacent: [upper, lower] });
  }
  root.userData = { type: COPPER_DRILL_HOUND_TYPE, drillHound: true, body, head, core, eye: core, legs,
    limbs: [...legs, tail], drill, rings, tail, saddle, riderSeat: HOUND_RIDER_SEAT,
    action: { phase: 'chase', since: 0, last: null, value: 0, from: 0, spin: 0 } };
  for (const link of links) addGolemJoint(root, link.anchor, link.adjacent, { name: 'hound-blue-leg-magic' });
  addGolemJoint(root, neck, [shoulders, collar], { name: 'hound-blue-neck-magic' });
  addGolemJoint(root, saddleBridge, [spine, saddle], { name: 'hound-blue-saddle-suspension' });
  return root;
}

/** Local articulation only; the caller owns model transforms and independent rider actors. */
export function animateCopperDrillHound(root, time, speed = 0, phase = 'chase', motion = {}) {
  const data = root.userData, action = data.action, clock = Number.isFinite(time) ? time : 0;
  const actualSpeed = Number.isFinite(speed) ? Math.abs(speed) : 0, moving = actualSpeed > .03;
  const bodyDrop = Number.isFinite(motion.bodyDrop) ? Math.max(0, Math.min(.57, motion.bodyDrop)) : 0;
  const lostSupports = Math.max(Math.max(0, Math.min(4, motion.legsLost || 0)),
    data.legs.filter(leg => motion.structureState?.[leg.userData.supportId]?.remaining === 0).length);
  const distance = Number.isFinite(motion.distance) ? Math.max(0, motion.distance) : Math.max(0, clock) * actualSpeed;
  const dt = action.last === null ? 0 : Math.min(.05, Math.max(0, clock - action.last));
  if (phase !== action.phase) { action.from = action.value; action.phase = phase; action.since = clock; }
  const target = phase === 'windup' ? 1 : phase === 'strike' ? -1 : 0;
  action.value = THREE.MathUtils.lerp(action.from, target, smooth((clock - action.since) / (phase === 'strike' ? .14 : .28)));
  const cycle = distance / 1.3, bob = moving ? Math.abs(Math.sin(cycle * Math.PI * 2)) * .045 * (1 - lostSupports / 4) : 0;
  data.body.position.set(0, bob - bodyDrop, -action.value * .08);
  data.head.rotation.x = -.06 - action.value * .12;
  data.head.position.z = 1.35 - action.value * .15;
  data.tail.rotation.set(-.15, Math.sin(clock * 3.2) * .2, 0);
  for (const leg of data.legs) {
    const t = ((cycle + leg.userData.gaitOffset) % 1 + 1) % 1, swing = Math.max(0, (t - .62) / .38);
    const stepping = moving && lostSupports < 4 && motion.structureState?.[leg.userData.supportId]?.remaining !== 0;
    const forward = !stepping ? 0 : t < .62 ? 1.3 * (.31 - t) : 1.3 * .62 * (-.5 + smooth(swing));
    poseLeg(leg, forward, stepping ? Math.sin(Math.PI * swing) * .25 : 0, bob, bodyDrop);
  }
  if (!motion.weaponState?.drill || motion.weaponState.drill.remaining > 0) action.spin += dt * (phase === 'windup' ? 16 : phase === 'strike' ? 30 : 5);
  data.drill.rotation.z = action.spin;
  action.last = clock;
  animateGolemMagic(root, clock, motion.partState);
}

/** Seat either existing robot astride the hound without combining their cuttable bodies. */
export function poseHoundRider(rider, time = 0, partState) {
  if (!rider?.userData?.colosseumEnemy || rider.userData.legs?.length !== 2) throw new TypeError('A hound rider must be an existing copper robot.');
  for (const leg of rider.userData.legs) {
    const data = leg.userData;
    leg.position.set(data.side * .35, .98, 0); leg.rotation.set(0, 0, 0);
    knee.set(data.side * .3, -.23, .38); foot.set(data.side * .5, -.65, .18);
    data.knee.position.copy(knee); data.foot.position.copy(foot);
    segment(data.upper, origin, knee, .25); segment(data.lower, knee, foot, .22);
    data.foot.rotation.set(0, 0, 0);
  }
  animateGolemMagic(rider, time, partState);
}
