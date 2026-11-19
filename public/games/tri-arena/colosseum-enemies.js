import * as THREE from './assets/three.module.js';
import { addGolemJoint, animateGolemMagic } from './golem-magic.js';
import { GROUND_SUPPORT_PROFILES, registerGroundSupports } from './ground-support.js';

export const COLOSSEUM_ENEMY_TYPES = Object.freeze(['copper-robot', 'knight']);
const cube = new THREE.BoxGeometry(1, 1, 1);
const colors = { copper: '#bc7446', edge: '#e6a46b', shadow: '#78462f', patina: '#397b74',
  dark: '#172b2d', steel: '#c8dfdb', teal: '#70f5dc', amber: '#ffd794' };
const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, metalness: name === 'dark' ? .15 : .75, roughness: .4, flatShading: true }),
]));
materials.teal.emissive.set('#24bfa8'); materials.teal.emissiveIntensity = .55;
materials.amber.emissive.set('#a15a20'); materials.amber.emissiveIntensity = .2;
const up = new THREE.Vector3(0, 1, 0), direction = new THREE.Vector3();
const origin = new THREE.Vector3();
const target = new THREE.Vector3(), knee = new THREE.Vector3(), bend = new THREE.Vector3();
const armTarget = new THREE.Vector3(), armKnee = new THREE.Vector3(), armBend = new THREE.Vector3();
const wristTarget = new THREE.Vector3(), bladeTarget = new THREE.Vector3();
const STRIDE = 1.25, STANCE = .62;
const SWORD_POSES = Object.freeze({
  ready: { wrist: [.65, 1.24, .5], blade: [-.04, .92, .39] },
  windup: { wrist: [.82, 1.65, .45], blade: [.15, .98, .12] },
  strike: { wrist: [.24, 1.34, .62], blade: [-.88, .12, .46] },
});
const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

function box(parent, name, color, position, size, anatomy = 'body', priority = 0) {
  const mesh = new THREE.Mesh(cube, materials[color]);
  mesh.name = name; mesh.position.set(...position); mesh.scale.set(...size);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, anatomicalPart: anatomy,
    critical: anatomy === 'eye' || anatomy === 'core', surfaceDetail: priority > 0, detailPriority: priority };
  parent.add(mesh);
  return mesh;
}
function joint(parent, name, x = 0, y = 0, z = 0) {
  const group = new THREE.Group(); group.name = name; group.position.set(x, y, z); parent.add(group); return group;
}
function segment(mesh, from, to, width) {
  direction.copy(to).sub(from);
  mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.scale.set(width, direction.length(), width);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
}
function poseLeg(leg, forward = 0, lift = 0, bob = 0, shift = 0, yaw = 0, bodyDrop = 0) {
  const data = leg.userData;
  leg.position.set(data.side * .225 * Math.cos(yaw) + shift, .98 + bob - bodyDrop, -data.side * .225 * Math.sin(yaw));
  // Hips transfer weight while the supporting boot remains planted in world space.
  target.set(data.side * .225 - leg.position.x, .16 + lift - leg.position.y, .04 + forward - leg.position.z);
  const distance = target.length(), along = distance / 2;
  direction.copy(target).divideScalar(distance);
  bend.set(0, 0, 1).addScaledVector(direction, -direction.z).normalize();
  knee.copy(direction).multiplyScalar(along).addScaledVector(bend, Math.sqrt(Math.max(.001, .51 ** 2 - along ** 2)));
  data.knee.position.copy(knee); data.foot.position.copy(target);
  segment(data.upper, origin, knee, .25);
  segment(data.lower, knee, target, .22);
}
function sword(wrist, type) {
  const group = joint(wrist, `${type}-sword`);
  const grip = box(group, `${type}-sword-grip`, 'shadow', [0, 0, 0], [.14, .4, .16], 'arm');
  const pommel = box(group, `${type}-sword-pommel`, 'edge', [0, -.24, 0], [.21, .12, .21], 'arm');
  const guard = box(group, `${type}-sword-guard`, 'copper', [0, .24, 0], [.48, .1, .18], 'arm');
  const blade = box(group, `${type}-sword-blade`, 'steel', [0, .82, 0], [.12, 1.08, .13], 'arm');
  for (const part of [grip, pommel, guard, blade]) part.userData.weaponId = 'sword';
  group.userData = { grip, pommel, guard, blade };
  return group;
}

function createArm(body, type, side, knight) {
  const arm = joint(body, `${type}-arm`, side * .58, 1.73, 0);
  const shoulder = box(arm, `${type}-shoulder`, knight ? 'edge' : 'copper', [side * .03, -.02, 0], [knight ? .44 : .35, .3, .4], 'arm');
  const upper = box(arm, `${type}-upper-arm`, 'copper', [0, 0, 0], [1, 1, 1], 'arm');
  const elbow = joint(arm, `${type}-elbow`);
  box(elbow, `${type}-elbow-joint`, 'dark', [0, 0, 0], [.24, .23, .25], 'arm');
  const forearm = box(arm, `${type}-forearm`, 'copper', [0, 0, 0], [1, 1, 1], 'arm');
  const wrist = joint(arm, `${type}-wrist`);
  const hand = joint(wrist, `${type}-hand`);
  const palm = box(hand, `${type}-gauntlet-palm`, 'edge', [0, 0, -.13], [.29, .26, .14], 'arm');
  box(hand, `${type}-gauntlet-cuff`, 'copper', [0, 0, -.25], [.3, .28, .16], 'arm');
  const fingers = [-.08, 0, .08].map((y, index) => box(hand, `${type}-gripping-finger-${index}`, 'edge', [0, y, .11], [.25, .065, .1], 'arm'));
  const thumb = box(hand, `${type}-gripping-thumb`, 'edge', [side * .11, .045, -.005], [.09, .16, .16], 'arm');
  arm.userData = { side, shoulder, upper, elbow, forearm, wrist, hand, palm, fingers, thumb };
  return arm;
}

/** Keep both arm bones attached while aiming the fist independently of the elbow. */
function poseArm(arm, wristPosition, bladeDirection) {
  const data = arm.userData;
  armTarget.copy(wristPosition).sub(arm.position);
  const distance = Math.max(.001, Math.min(.86, armTarget.length()));
  direction.copy(armTarget).normalize();
  armTarget.copy(direction).multiplyScalar(distance);
  const along = (.43 ** 2 - .44 ** 2 + distance ** 2) / (2 * distance);
  armBend.set(data.side * .4, -1, -.2);
  armBend.addScaledVector(direction, -armBend.dot(direction)).normalize();
  armKnee.copy(direction).multiplyScalar(along).addScaledVector(armBend, Math.sqrt(Math.max(.001, .43 ** 2 - along ** 2)));
  data.elbow.position.copy(armKnee);
  segment(data.upper, origin, armKnee, .26);
  segment(data.forearm, armKnee, armTarget, .28);
  data.wrist.position.copy(armTarget);
  data.wrist.quaternion.setFromUnitVectors(up, direction.copy(bladeDirection).normalize());
}

function poseSwordArm(data, from, to = from, amount = 0, sway = 0) {
  wristTarget.fromArray(from.wrist).lerp(armTarget.fromArray(to.wrist), amount);
  wristTarget.y += sway * .025;
  bladeTarget.fromArray(from.blade).lerp(armTarget.fromArray(to.blade), amount);
  poseArm(data.rightArm, wristTarget, bladeTarget);
}

function poseShieldArm(data, guard = 0, recoil = 0, sway = 0) {
  wristTarget.set(-.63, .98, .28).lerp(armTarget.set(-.14, 1.47, .58), guard);
  wristTarget.x -= recoil * .025;
  wristTarget.y -= recoil * .025;
  wristTarget.z -= recoil * .1 + sway * .05 * (1 - guard);
  bladeTarget.set(0, 1, 0);
  poseArm(data.leftArm, wristTarget, bladeTarget);
  data.leftArm.userData.wrist.rotation.set(-.1 * guard + recoil * .16, recoil * .08, 0);
}

/** Exactly one copper robot and one copper-armored knight, with no enemy variants. */
export function createColosseumEnemy(type) {
  if (!COLOSSEUM_ENEMY_TYPES.includes(type)) throw new TypeError(`Unknown Colosseum enemy: ${String(type)}`);
  const knight = type === 'knight', root = new THREE.Group(); root.name = type;
  const body = joint(root, `${type}-body`);
  box(body, `${type}-pelvis`, 'shadow', [0, 1, 0], [.58, .25, .4]);
  box(body, `${type}-waist-band`, 'edge', [0, 1.1, .02], [.66, .12, .43]);
  box(body, `${type}-breastplate`, 'copper', [0, 1.49, 0], [.78, .69, .49]);
  box(body, `${type}-upper-chest-rim`, 'edge', [0, 1.79, .04], [.81, .12, .51]);
  box(body, `${type}-neck-joint`, 'dark', [0, 1.91, 0], [.25, .18, .24]);
  if (!knight) box(body, 'copper-robot-core-casing', 'dark', [0, 1.5, .265], [.25, .28, .07], 'body', 5);
  const core = box(body, `${type}-chest-core`, knight ? 'amber' : 'teal', [0, 1.5, .3], [.09, .11, .06], 'core', 95);
  for (const side of [-1, 1]) {
    box(body, `${type}-chest-edge`, 'edge', [side * .35, 1.48, .26], [.09, .54, .065], 'body', 5);
    box(body, `${type}-belt-rivet`, 'patina', [side * .21, 1.1, .25], [.08, .08, .05], 'body', 5);
  }
  const head = joint(body, `${type}-head`);
  let eye;
  if (knight) {
    box(head, 'knight-recessed-head-interior', 'dark', [0, 2.09, -.02], [.62, .6, .46], 'head');
    box(head, 'knight-helmet-back', 'copper', [0, 2.1, -.3], [.74, .68, .18], 'head');
    box(head, 'knight-helmet-roof', 'edge', [0, 2.43, .01], [.8, .14, .75], 'head');
    box(head, 'knight-helmet-brow', 'copper', [0, 2.34, .35], [.78, .12, .18], 'head');
    for (const side of [-1, 1]) {
      box(head, 'knight-helmet-side', 'copper', [side * .36, 2.11, -.01], [.14, .62, .67], 'head');
      box(head, 'knight-helmet-cheek', 'copper', [side * .235, 1.96, .35], [.27, .42, .18], 'head');
      box(head, 'knight-helmet-cheek-edge', 'edge', [side * .235, 1.77, .36], [.28, .07, .2], 'head');
    }
    box(head, 'knight-helmet-crest', 'shadow', [0, 2.54, -.05], [.13, .13, .58], 'head');
    // This critical dark bar is recessed behind actual air between brow and cheeks.
    eye = box(head, 'knight-recessed-eye-slit', 'dark', [0, 2.225, .245], [.61, .1, .045], 'eye', 50);
  } else {
    box(head, 'copper-robot-angular-head', 'copper', [0, 2.12, 0], [.69, .57, .53], 'head');
    box(head, 'copper-robot-brow', 'edge', [0, 2.36, .1], [.77, .12, .49], 'head');
    box(head, 'copper-robot-recessed-face', 'dark', [0, 2.13, .28], [.56, .23, .08], 'head', 5);
    const eyes = joint(head, 'copper-robot-eyes');
    for (const side of [-1, 1]) box(eyes, 'copper-robot-teal-eye', 'teal', [side * .145, 2.15, .335], [.15, .1, .055], 'eye', 50);
    eye = eyes;
    box(head, 'copper-robot-jaw', 'shadow', [0, 1.95, .13], [.5, .13, .39], 'head');
    for (const side of [-1, 1]) box(head, 'copper-robot-temple-plate', 'patina', [side * .37, 2.11, -.02], [.12, .32, .32], 'head');
  }
  const arms = [-1, 1].map(side => createArm(body, type, side, knight));
  const weapon = sword(arms[1].userData.wrist, type);
  let shield = null;
  if (knight) {
    shield = joint(arms[0].userData.wrist, 'knight-shield', 0, -.02, .25);
    const handle = box(shield, 'knight-shield-handle', 'shadow', [0, .02, -.25], [.14, .28, .16], 'arm');
    shield.userData.handle = handle;
    const shieldArmor = [
      box(shield, 'knight-shield-rim', 'edge', [0, 0, 0], [.7, .92, .16], 'arm'),
      box(shield, 'knight-shield-face', 'copper', [0, .035, .11], [.57, .75, .11], 'arm'),
      box(shield, 'knight-shield-lower-tip', 'edge', [0, -.51, 0], [.44, .19, .16], 'arm'),
      box(shield, 'knight-shield-boss', 'patina', [0, .035, .21], [.2, .2, .13], 'arm'),
    ];
    for (const plate of shieldArmor) { plate.userData.cutHits = 2; plate.userData.structuralId = 'shield'; }
  }
  const legs = [-1, 1].map(side => {
    const leg = joint(root, `${type}-leg`, side * .225, .98, 0);
    const upper = box(leg, `${type}-upper-leg`, 'copper', [0, 0, 0], [1, 1, 1]);
    const lower = box(leg, `${type}-lower-leg`, 'copper', [0, 0, 0], [1, 1, 1]);
    const knee = joint(leg, `${type}-knee`);
    box(knee, `${type}-knee-cap`, 'edge', [0, 0, .035], [.3, .23, .3]);
    const foot = joint(leg, `${type}-foot`);
    // Only the terminal boot counts as a lost leg; the articulated plates remain cuttable body.
    const boot = box(foot, `${type}-boot`, 'shadow', [0, 0, .06], [.34, .26, .49], 'leg');
    box(foot, `${type}-toe-plate`, 'edge', [0, .08, .19], [.35, .1, .25]);
    leg.userData = { side, upper, lower, knee, foot, boot, gaitOffset: side < 0 ? 0 : .5,
      gait: { walking: false, forward: 0, lift: 0, roll: 0, stoppedAt: 0, stoppedLift: 0, stoppedRoll: 0 } };
    poseLeg(leg);
    return leg;
  });
  root.userData = { type, colosseumEnemy: true, body, head, eye, core, limbs: [...legs, ...arms], legs,
    leftLeg: legs[0], rightLeg: legs[1], leftArm: arms[0], rightArm: arms[1], sword: weapon, shield, baseBodyY: 0,
    hipParts: [root.getObjectByName(`${type}-pelvis`), root.getObjectByName(`${type}-waist-band`)],
    swordPose: { phase: 'chase', started: 0, lastClock: null, movement: 0, guard: shield ? 1 : 0, recoil: 0,
      wrist: new THREE.Vector3().fromArray(SWORD_POSES.ready.wrist), blade: new THREE.Vector3().fromArray(SWORD_POSES.ready.blade),
      renderedWrist: new THREE.Vector3().fromArray(SWORD_POSES.ready.wrist),
      fromWrist: new THREE.Vector3().fromArray(SWORD_POSES.ready.wrist), fromBlade: new THREE.Vector3().fromArray(SWORD_POSES.ready.blade),
      pitch: 0, yaw: 0, fromPitch: 0, fromYaw: 0 } };
  poseSwordArm(root.userData, SWORD_POSES.ready);
  poseShieldArm(root.userData, shield ? 1 : 0);
  const neck = root.getObjectByName(`${type}-neck-joint`);
  addGolemJoint(root, neck, [root.getObjectByName(`${type}-upper-chest-rim`),
    root.getObjectByName(knight ? 'knight-helmet-back' : 'copper-robot-angular-head')]);
  arms.forEach((arm, index) => {
    const data = arm.userData;
    addGolemJoint(root, data.elbow.getObjectByName(`${type}-elbow-joint`), [data.upper, data.forearm], { phase: (index + 1) * 1.9 });
    addGolemJoint(root, arm, [data.shoulder, data.upper], { name: `${type}-shoulder-magic-${index}`,
      size: [.28, .13, .29], offset: [0, -.16, 0], phase: index * 2.1 });
    addGolemJoint(root, data.wrist, [data.forearm, data.palm], { name: `${type}-wrist-magic-${index}`,
      size: [.23, .13, .23], offset: [0, -.11, -.04], phase: index * 2.3 });
  });
  legs.forEach((leg, index) => {
    const data = leg.userData;
    addGolemJoint(root, leg, [root.userData.hipParts[0], data.upper], { name: `${type}-hip-magic-${index}`,
      size: [.28, .18, .26], offset: [0, -.04, 0], phase: index * 1.7 });
    addGolemJoint(root, data.knee, [data.upper, data.lower], { name: `${type}-knee-magic-${index}`,
      size: [.25, .16, .25], phase: index * 2.7 });
    addGolemJoint(root, data.foot, [data.lower, data.boot], { name: `${type}-ankle-magic-${index}`,
      size: [.22, .12, .24], offset: [0, .17, -.04], phase: index * 2.9 });
  });
  registerGroundSupports(root, legs);
  return root;
}

/** Caller owns root position/heading; only surviving joint transforms are animated. */
export function animateColosseumEnemy(group, time, speed = 0, phase = 'chase', motion = {}) {
  const data = group.userData, clock = Number.isFinite(time) ? time : 0;
  const maxDrop = GROUND_SUPPORT_PROFILES[data.type].maxDrop;
  const bodyDrop = !motion.mounted && Number.isFinite(motion.bodyDrop) ? Math.max(0, Math.min(maxDrop, motion.bodyDrop)) : 0;
  const actualSpeed = Number.isFinite(speed) ? Math.abs(speed) : 0, walking = actualSpeed > .03 && bodyDrop < maxDrop;
  const distance = Number.isFinite(motion?.distance) ? Math.max(0, motion.distance) : Math.max(0, clock) * actualSpeed;
  const cycle = distance / STRIDE, movement = Math.min(1, actualSpeed / 3.5);
  const action = data.swordPose;
  const dt = action.lastClock === null ? 0 : Math.max(0, clock - action.lastClock);
  action.movement = action.lastClock === null ? movement : action.movement + (movement - action.movement) * (1 - Math.exp(-14 * dt));
  if (action.movement < .001) action.movement = 0;
  if (phase !== action.phase) {
    // Start from the actual displayed pose, including an interrupted windup or slash.
    action.fromWrist.copy(action.renderedWrist); action.fromBlade.copy(action.blade);
    action.fromPitch = action.pitch; action.fromYaw = action.yaw;
    action.phase = phase; action.started = clock;
  }
  const age = Math.max(0, clock - action.started);
  const duration = phase === 'windup' ? .22 : phase === 'strike' ? .12 : phase === 'recover' ? .28 : .18;
  const progress = smooth(age / duration);
  const pose = phase === 'windup' ? SWORD_POSES.windup : phase === 'strike' ? SWORD_POSES.strike : SWORD_POSES.ready;
  action.wrist.copy(action.fromWrist).lerp(wristTarget.fromArray(pose.wrist), progress);
  action.blade.copy(action.fromBlade).lerp(bladeTarget.fromArray(pose.blade), progress).normalize();
  action.pitch = THREE.MathUtils.lerp(action.fromPitch, phase === 'windup' ? -.055 : phase === 'strike' ? .025 : 0, progress);
  action.yaw = THREE.MathUtils.lerp(action.fromYaw, phase === 'windup' ? .09 : phase === 'strike' ? -.09 : 0, progress);
  // A shield golem keeps its shield raised while walking, attacking or disarmed.
  action.guard = data.shield ? 1 : 0;
  const impact = Number.isFinite(motion?.shieldImpact) ? Math.max(0, Math.min(1, motion.shieldImpact)) : 0;
  if (dt > 0) action.recoil = Math.max(impact, action.recoil * Math.exp(-18 * dt));
  if (action.recoil < .0001) action.recoil = 0;
  const sway = Math.sin(cycle * Math.PI * 2) * action.movement;
  const bob = Math.abs(sway) * .035 * (1 - bodyDrop / maxDrop), shift = sway * .04, hipYaw = sway * .04;
  data.body.position.set(shift, bob - bodyDrop, 0);
  data.body.rotation.set(action.pitch - .025 * action.movement - .025 * action.recoil,
    action.yaw - sway * .04, sway * .025);
  data.head.rotation.y = -data.body.rotation.y * .65;
  for (const hipPart of data.hipParts) hipPart.rotation.y = hipYaw - data.body.rotation.y;
  for (const leg of data.legs) {
    const t = ((cycle + leg.userData.gaitOffset) % 1 + 1) % 1;
    const swing = Math.max(0, (t - STANCE) / (1 - STANCE));
    const forward = t < STANCE ? STRIDE * (STANCE / 2 - t)
      : STRIDE * STANCE * (-.5 + swing * swing * (3 - 2 * swing));
    const gait = leg.userData.gait;
    if (walking) {
      gait.forward = forward;
      gait.lift = Math.sin(smooth(swing) * Math.PI) * (.2 + .08 * movement);
      gait.roll = Math.sin(swing * Math.PI * 2) * .12;
    } else {
      if (gait.walking) { gait.stoppedAt = clock; gait.stoppedLift = gait.lift; gait.stoppedRoll = gait.roll; }
      const settling = 1 - smooth((clock - gait.stoppedAt) / .12);
      gait.lift = gait.stoppedLift * settling;
      gait.roll = gait.stoppedRoll * settling;
    }
    gait.walking = walking;
    poseLeg(leg, gait.forward, gait.lift, bob, shift, hipYaw, bodyDrop);
    leg.userData.foot.rotation.x = gait.roll;
  }
  action.renderedWrist.copy(action.wrist);
  if (phase === 'chase') action.renderedWrist.y += sway * .025 * progress;
  poseArm(data.rightArm, action.renderedWrist, action.blade);
  poseShieldArm(data, action.guard, action.recoil, sway);
  animateGolemMagic(group, clock, motion.partState);
  action.lastClock = clock;
}
