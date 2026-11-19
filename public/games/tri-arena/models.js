import * as THREE from './assets/three.module.js';
import { BOSS_TYPES, createBoss, animateBoss } from './boss-models.js';
import { TRI_CREATURE_TYPES, createTriCreature, animateTriCreature } from './tri-models.js';
import { COLOSSEUM_ENEMY_TYPES, createColosseumEnemy, animateColosseumEnemy } from './colosseum-enemies.js';
import { COPPER_TRON_TYPE, createCopperTron, animateCopperTron } from './copper-tron.js';
import { COPPER_SIEGE_TYPES, createCopperSiegeEnemy, animateCopperSiegeEnemy } from './copper-siege-enemies.js';
import { COPPER_DRILL_HOUND_TYPE, createCopperDrillHound, animateCopperDrillHound, poseHoundRider } from './copper-drill-hound.js';
import { GROUND_SUPPORT_PROFILES, registerGroundSupports } from './ground-support.js';
import { COPPER_FORTRESS_TYPE, COPPER_REPAIR_DRONE_TYPE, createCopperFortress, animateCopperFortress, createRepairDrone, animateRepairDrone, poseFortressCrew } from './copper-fortress.js';
import { OCTO_NOSE_TYPE, createOctoNose, animateOctoNose } from './octo-nose-model.js';
import { createCuttableMegaDrill, animateCuttableMegaDrill } from './mega-drill-model.js';
import { MINER_BOT_TYPE, createMinerBot, animateMinerBot } from './miner-bot.js';
import { COPPER_SPIDER_DRONE_TYPE, createCopperSpiderDrone, animateCopperSpiderDrone } from './copper-spider-drone.js';
import { COPPER_MINE_WALKER_TYPE, createCopperMineWalker, animateCopperMineWalker } from './copper-mine-walker.js';
import { createMechSpiderTankUltra, animateMechSpiderTankUltra } from './mech-spider-tank-ultra.js';

const cube = new THREE.BoxGeometry(1, 1, 1);
const up = new THREE.Vector3(0, 1, 0);
const segmentDirection = new THREE.Vector3();
const hip = new THREE.Vector3();
const knee = new THREE.Vector3();
const footTarget = new THREE.Vector3();
const bend = new THREE.Vector3();
const LEG_STRIDE = 1.05;
const palette = {
  pink: '#eb3d9e', lightPink: '#ff79bc', darkPink: '#9e2469',
  blue: '#2fa5f2', darkBlue: '#247bd1', cyan: '#58d4ff',
  brainBlue: '#218bdd', brainLight: '#51ceff', brainDark: '#185cb8',
  cream: '#fff0d9', orange: '#f47d35', pupil: '#15282d', glint: '#fff8ed',
  teal: '#178b91', darkTeal: '#165c68', armor: '#40c6cc', dark: '#153744',
  copper: '#bd7446', copperLight: '#e7ab6c', steel: '#728c98',
  bone: '#d6c3a1', boneShadow: '#9c8a74',
  gardenerTeal: '#4c9d96', gardenerGrey: '#a3aaa7', gardenerClaw: '#4a5660', gardenerCopper: '#c6a16b',
};
const materials = Object.fromEntries(Object.entries(palette).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, roughness: name === 'copper' ? .38 : .72, metalness: name === 'copper' ? .55 : .08 }),
]));
materials.energy = new THREE.MeshStandardMaterial({ color: '#fff4b0', emissive: '#ffb32d', emissiveIntensity: 2.1, roughness: .25 });
materials.visor = new THREE.MeshStandardMaterial({ color: '#b9fbff', emissive: '#26d9ef', emissiveIntensity: .65 });
for (const [name, color] of Object.entries({ humanSkin: '#d9a07a', humanSkinShade: '#b97858',
  humanHair: '#34251e', humanLeather: '#60402c', humanLeatherLight: '#8a5d3c',
  humanCloth: '#247e78', humanClothDark: '#225753', humanEyeWhite: '#f0e5d2', humanEye: '#263c36', humanMouth: '#8b4d42' })) {
  materials[name] = new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: 0, flatShading: true });
}

/** @param {THREE.Object3D} parent @param {string} name @param {string} color @param {number[]} position @param {number[]} size */
function block(parent, name, color, position, size) {
  const part = new THREE.Mesh(cube, materials[color]);
  part.name = name;
  part.position.set(...position);
  part.scale.set(...size);
  part.castShadow = true;
  part.receiveShadow = true;
  part.userData.severable = true;
  part.userData.anatomicalPart = /eye|iris|pupil|glint/i.test(name) ? 'eye'
    : /tentacle/i.test(name) ? 'tentacle'
      : /leg|knee|foot|boot|shin/i.test(name) ? 'leg'
        : /head|helmet|horn|visor/i.test(name) ? 'head'
          : /arm|hand|claw|elbow|shoulder|gauntlet/i.test(name) ? 'arm' : 'body';
  const feature = /eye-glint/.test(name) ? 'glint' : /eye-pupil/.test(name) ? 'pupil'
    : /eye-iris/.test(name) ? 'iris' : /eye-white/.test(name) ? 'sclera' : /eye-lid/.test(name) ? 'lid' : null;
  if (feature) Object.assign(part.userData, { surfaceDetail: true, feature,
    detailPriority: { lid: 5, sclera: 10, iris: 20, pupil: 30, glint: 40 }[feature] });
  else if (/vein|teal-panel|teal-patch|side-patch/.test(name)) {
    Object.assign(part.userData, { surfaceDetail: true, feature: /vein/.test(name) ? 'vein' : 'panel', detailPriority: 6 });
  }
  parent.add(part);
  return part;
}

function joint(parent, name, x, y, z) {
  const part = new THREE.Group();
  part.name = name;
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}

function poseSegment(mesh, start, end, width) {
  segmentDirection.subVectors(end, start);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.scale.set(width, segmentDirection.length(), width);
  mesh.quaternion.setFromUnitVectors(up, segmentDirection.normalize());
}

/** Solve the blue knee outward while keeping both leg segments at their real lengths. */
function poseLingLeg(leg, target) {
  const data = leg.userData;
  const reach = Math.max(.001, target.length());
  const upperLength = data.upperLength, lowerLength = data.lowerLength;
  const along = (upperLength ** 2 - lowerLength ** 2 + reach ** 2) / (2 * reach);
  const direction = segmentDirection.copy(target).divideScalar(reach);
  bend.set(data.side, 0, 0).addScaledVector(direction, -data.side * direction.x).normalize();
  knee.copy(direction).multiplyScalar(along).addScaledVector(bend, Math.sqrt(Math.max(.005, upperLength ** 2 - along ** 2)));
  data.knee.position.copy(knee);
  data.foot.position.copy(target);
  poseSegment(data.upper, hip, knee, .12);
  poseSegment(data.lower, knee, target, .095);
}

/** Layered square Tri eye, looking forward along local +Z. */
function eye(parent, x, y, z, scale = 1, shape = 'ling') {
  const socket = joint(parent, 'tri-eye', x, y, z);
  socket.scale.setScalar(scale);
  const designs = {
    ling: [[.55, .55, .13], [.43, .43, .16], [.21, .24, .035], [.085, .17, .02], [.045, .055, .01],
      [.07, .16, .185, .2], [-.05, .065]],
    brain: [[.96, .96, .22], [.79, .79, .23], [.43, .46, .06], [.17, .35, .035], [.09, .1, .02],
      [.13, .26, .3, .325], [-.095, .13]],
    gardener: [[.65, .71, .19], [.53, .59, .25], [.25, .3, .055], [.095, .2, .025], [.052, .065, .012],
      [.09, .24, .275, .294], [-.055, .085]],
    tentacle: [[.48, .48, .33], [.38, .38, .35], [.21, .23, .04], [.085, .17, .025], [.04, .045, .01],
      [.045, .23, .255, .272], [-.045, .07]],
  };
  const [lid, white, iris, pupil, glint, depths, highlight] = designs[shape];
  block(socket, 'eye-lid', 'darkPink', [0, 0, 0], lid);
  block(socket, 'eye-white', 'cream', [0, 0, depths[0]], white);
  block(socket, 'eye-iris', 'orange', [0, 0, depths[1]], iris);
  block(socket, 'eye-pupil', 'pupil', [0, 0, depths[2]], pupil);
  block(socket, 'eye-glint', 'glint', [...highlight, depths[3]], glint);
  socket.userData.eyeShape = shape;
  return socket;
}

/** A human swordsman in an open copper helmet, facing local +Z at ground Y=0. */
export function createPlayer() {
  const root = new THREE.Group();
  root.name = 'human-copper-swordsman';
  const body = joint(root, 'player-body', 0, 0, 0);
  block(body, 'teal-cloth-tunic', 'humanCloth', [0, 1.35, 0], [.7, .75, .4]);
  block(body, 'copper-breastplate', 'copper', [0, 1.4, .22], [.51, .49, .07]);
  const strap = block(body, 'leather-chest-strap', 'humanLeather', [0, 1.4, .27], [.075, .68, .045]);
  strap.rotation.z = -.52;
  block(body, 'waist', 'humanClothDark', [0, .93, 0], [.48, .2, .35]);
  block(body, 'leather-belt', 'humanLeather', [0, 1.04, .035], [.71, .11, .43]);
  block(body, 'belt-buckle', 'copperLight', [0, 1.04, .28], [.14, .1, .06]);
  block(body, 'human-neck', 'humanSkinShade', [0, 1.76, 0], [.24, .2, .24]);
  const head = joint(body, 'human-head', 0, 1.99, 0);
  block(head, 'human-face', 'humanSkin', [0, 0, 0], [.48, .48, .42]);
  block(head, 'human-hair-back', 'humanHair', [0, -.045, -.22], [.5, .44, .08]);
  block(head, 'open-copper-helmet-roof', 'copper', [0, .26, -.01], [.6, .16, .52]);
  block(head, 'open-copper-helmet-back', 'copper', [0, .08, -.25], [.57, .42, .12]);
  block(head, 'open-copper-helmet-brow', 'copperLight', [0, .18, .255], [.61, .09, .1]);
  block(head, 'helmet-ridge', 'copperLight', [0, .37, -.02], [.1, .07, .48]);
  const eyes = joint(head, 'human-eyes', 0, .035, .22);
  for (const side of [-1, 1]) {
    block(head, 'open-copper-helmet-side', 'copper', [side * .275, .1, -.03], [.1, .3, .4]);
    block(head, 'human-ear', 'humanSkinShade', [side * .265, -.05, .015], [.08, .15, .14]);
    block(head, 'human-eyebrow', 'humanHair', [side * .11, .095, .224], [.12, .035, .025]);
    block(eyes, 'human-eye-white', 'humanEyeWhite', [side * .11, 0, 0], [.12, .065, .025]);
    block(eyes, 'human-eye-pupil', 'humanEye', [side * .11, -.005, .019], [.045, .055, .016]);
  }
  block(head, 'human-nose', 'humanSkinShade', [0, -.025, .25], [.085, .13, .085]);
  block(head, 'human-mouth', 'humanMouth', [0, -.15, .218], [.14, .028, .024]);
  const legs = [-1, 1].map(side => {
    const leg = joint(body, side < 0 ? 'left-leg' : 'right-leg', side * .21, .88, 0);
    block(leg, 'trouser-thigh', 'humanClothDark', [0, -.1, 0], [.24, .31, .26]);
    block(leg, 'trouser-leg', 'humanClothDark', [0, -.39, 0], [.26, .52, .28]);
    block(leg, 'leather-knee-pad', 'humanLeather', [0, -.23, .16], [.27, .16, .09]);
    block(leg, 'leather-boot-cuff', 'humanLeatherLight', [0, -.6, .025], [.3, .15, .32]);
    block(leg, 'boot', 'humanLeather', [0, -.76, .075], [.31, .2, .46]);
    return leg;
  });
  const arms = [-1, 1].map(side => {
    const arm = joint(body, side < 0 ? 'left-arm' : 'right-arm', side * .49, 1.64, 0);
    block(arm, 'copper-shoulder-plate', 'copper', [0, -.03, 0], [.34, .28, .46]);
    block(arm, 'cloth-sleeve', 'humanCloth', [0, -.28, 0], [.22, .37, .26]);
    block(arm, 'human-elbow', 'humanSkinShade', [0, -.49, 0], [.24, .14, .26]);
    block(arm, 'leather-bracer', 'humanLeather', [0, -.64, .035], [.28, .24, .31]);
    block(arm, 'human-hand', 'humanSkin', [0, -.82, .04], [.22, .17, .23]);
    block(arm, 'human-fingers', 'humanSkinShade', [0, -.82, .18], [.23, .12, .08]);
    block(arm, 'human-thumb', 'humanSkin', [-.13, -.8, .12], [.07, .13, .14]);
    return arm;
  });
  const sword = joint(arms[1], 'amber-energy-sword', 0, -.81, .13);
  block(sword, 'sword-grip', 'dark', [0, .03, .03], [.13, .32, .13]);
  block(sword, 'copper-guard', 'copperLight', [0, .22, .03], [.44, .11, .16]);
  block(sword, 'blade-spine', 'copper', [0, .92, .03], [.16, 1.35, .12]);
  block(sword, 'energy-blade', 'energy', [.035, .96, .04], [.17, 1.4, .085]);
  block(sword, 'energy-tip', 'energy', [.035, 1.71, .04], [.10, .16, .075]);
  arms[1].rotation.x = -.55;
  root.userData = { type: 'player', human: true, body, head, eye: eyes, baseBodyY: 0, leftLeg: legs[0], rightLeg: legs[1],
    leftArm: arms[0], rightArm: arms[1], swordArm: arms[1], sword, limbs: [...legs, ...arms] };
  return root;
}

/** Camera-local human hand and sword. The grip dimensions match the combat renderer. */
export function createViewWeapon() {
  const root = new THREE.Group();
  root.name = 'first-person-copper-sword';
  const hand = joint(root, 'view-gauntlet', .44, -.38, -.64);
  hand.rotation.z = -.14;
  block(hand, 'view-arm-sleeve', 'humanCloth', [.04, -.22, .09], [.23, .39, .26]);
  block(hand, 'view-leather-bracer', 'humanLeather', [0, -.035, .02], [.26, .24, .31]);
  block(hand, 'view-wrist-band', 'copperLight', [0, -.15, .04], [.28, .08, .3]);
  block(hand, 'view-hand', 'humanSkin', [0, .1, 0], [.2, .14, .23]);
  block(hand, 'view-human-fingers', 'humanSkinShade', [0, .1, -.13], [.21, .12, .075]);
  block(hand, 'view-human-thumb', 'humanSkin', [-.11, .1, -.025], [.07, .13, .1]);
  const sword = joint(hand, 'view-energy-sword', 0, .12, -.02);
  block(sword, 'view-sword-grip', 'dark', [0, .02, 0], [.11, .29, .12]);
  block(sword, 'view-grip-copper-wrap', 'copper', [0, -.05, .005], [.14, .065, .14]);
  block(sword, 'view-sword-guard', 'copperLight', [0, .2, 0], [.37, .08, .17]);
  block(sword, 'view-blade-spine', 'copper', [-.035, .72, 0], [.11, 1.03, .09]);
  block(sword, 'view-energy-blade', 'energy', [.025, .75, -.006], [.145, 1.08, .075]);
  block(sword, 'view-energy-point', 'energy', [.025, 1.32, -.006], [.085, .14, .065]);
  root.traverse(part => {
    if (!part.isMesh) return;
    part.castShadow = false;
    part.receiveShadow = false;
    part.userData.severable = false;
    part.frustumCulled = false;
    part.renderOrder = 10;
  });
  root.userData = { type: 'view-weapon', hand, sword };
  return root;
}

/** Weathered voxel bone extends from Y=0 to Y=length, ready to plant in the ground. */
export function createBone(length = 1) {
  if (!Number.isFinite(length) || length <= 0) throw new TypeError('Bone length must be a positive finite number.');
  const root = new THREE.Group();
  root.name = 'tri-ground-bone';
  const width = Math.min(.22, length * .18);
  block(root, 'bone-shaft', 'bone', [0, length * .5, 0], [width, length * .8, width * .8]);
  block(root, 'bone-shaft-shadow', 'boneShadow', [-width * .51, length * .48, .01], [.018, length * .48, width * .52]);
  for (const end of [.09, .91]) for (const side of [-1, 1]) {
    block(root, 'bone-square-end', 'bone', [side * width * .48, length * end, 0], [width, length * .18, width * 1.1]);
  }
  root.traverse(part => { if (part.isMesh) part.userData.severable = false; });
  root.userData.type = 'bone';
  return root;
}

function createLing() {
  const root = new THREE.Group();
  root.name = 'tri-ling';
  const body = joint(root, 'ling-body', 0, .9, 0);
  const torso = block(body, 'pink-core', 'pink', [0, 0, 0], [.96, .67, .86]);
  block(body, 'left-lobe', 'lightPink', [-.31, -.15, .1], [.44, .4, .48]);
  block(body, 'right-lobe', 'darkPink', [.31, -.14, -.07], [.43, .39, .47]);
  block(body, 'pink-crown', 'lightPink', [-.17, .28, -.08], [.4, .22, .42]);
  const watchingEye = eye(body, 0, .04, .435);
  const limbs = [];
  for (const side of [-1, 1]) for (const front of [-1, 1]) {
    const leg = joint(root, 'blue-leg', side * .38, .73, front * .26);
    const upper = block(leg, 'upper-leg', 'blue', [side * .17, -.17, 0], [.15, .5, .16]);
    const kneeJoint = block(leg, 'cyan-knee', 'cyan', [side * .27, -.31, 0], [.16, .16, .16]);
    const lower = block(leg, 'lower-leg', 'darkBlue', [side * .37, -.57, .015], [.12, .49, .14]);
    const foot = block(leg, 'blue-foot', 'blue', [side * .24, -.64, .08], [.19, .11, .25]);
    upper.userData.rigParent = torso.uuid;
    lower.userData.rigParent = upper.uuid;
    kneeJoint.userData.rigParent = upper.uuid;
    foot.userData.rigParent = lower.uuid;
    leg.userData = { side, front, upper, lower, knee: kneeJoint, foot,
      restHipY: .73, footSpread: .24, upperLength: .43, lowerLength: .46, gaitOffset: side === front ? 0 : Math.PI };
    poseLingLeg(leg, footTarget.set(side * .24, -.64, .08));
    limbs.push(leg);
  }
  root.userData = { type: 'ling', body, eye: watchingEye, limbs, legs: limbs, baseBodyY: .9, explicitRigParents: true };
  registerGroundSupports(root, limbs);
  return root;
}

function createBrain() {
  const root = new THREE.Group();
  root.name = 'tri-brain';
  const body = joint(root, 'folded-brain', 0, 2.65, 0);
  block(body, 'brain-groove-core', 'darkPink', [0, 0, 0], [2.12, 1.25, 1.52]);
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) for (let layer = 0; layer < 2; layer++) {
    block(body, 'brain-fold', (row + layer) % 2 ? 'pink' : 'lightPink',
      [side * (.46 + (row === 1 ? .1 : 0)), .47 - layer * .63, -.55 + row * .55], [.88, .58, .49]);
  }
  block(body, 'central-fold', 'pink', [0, .55, 0], [.15, .4, 1.45]);
  block(body, 'brain-underside-cluster', 'darkPink', [0, -.6, 0], [1.03, .3, .88]);
  for (const side of [-1, 1]) {
    block(body, 'blue-brain-vein', 'brainBlue', [side * .62, .79, -.1], [.12, .055, 1.22]);
    block(body, 'vein-branch', 'brainLight', [side * .8, .77, -.35], [.45, .06, .11]);
    block(body, 'blue-side-vein', 'brainBlue', [side * 1.055, .08, -.15], [.065, .86, .12]);
  }
  const watchingEye = eye(body, 0, .02, .81, 1, 'brain');
  const limbs = [];
  for (const side of [-1, 1]) for (const front of [-1, 1]) {
    const tentacle = joint(body, 'blue-brain-tentacle', side * .28, -.84, front * .22);
    block(tentacle, 'tentacle-root', 'pink', [0, .12, 0], [.41, .3, .37]);
    block(tentacle, 'tentacle-blue-socket', 'brainBlue', [0, -.01, 0], [.22, .09, .22]);
    const links = [];
    for (let i = 0; i < 7; i++) {
      const segment = block(tentacle, 'tentacle-link', ['brainLight', 'brainBlue', 'brainDark'][i % 3],
        [side * i * .12, -.14 - i * .2, front * i * .09], [.21 - i * .012, .27, .21 - i * .012]);
      segment.rotation.z = side * .35;
      links.push(segment);
    }
    const tipEye = front > 0 ? eye(tentacle, side * .72, -1.44, front * .63, 1, 'tentacle') : null;
    tentacle.userData = { gaitOffset: side * 2 + front, side, front, links, tipEye,
      points: Array.from({ length: 8 }, () => new THREE.Vector3()) };
    limbs.push(tentacle);
  }
  root.userData = { type: 'brain', body, eye: watchingEye, limbs, baseBodyY: 2.65 };
  return root;
}

function createGardener() {
  const root = new THREE.Group();
  root.name = 'the-gardener';
  const body = joint(root, 'gardener-gliding-body', 0, 0, 0);
  block(body, 'gardener-torso', 'pink', [0, 1.24, 0], [.68, 2.15, .53]);
  block(body, 'lower-tip', 'darkPink', [0, .14, 0], [.5, .2, .4]);
  block(body, 'torso-teal-panel', 'gardenerTeal', [-.12, 1.49, .285], [.2, .65, .065]);
  block(body, 'side-patch', 'gardenerTeal', [.35, 1.06, .02], [.06, .4, .35]);
  block(body, 'neck-band', 'darkPink', [0, 2.28, .015], [.73, .12, .57]);
  const head = joint(body, 'gardener-long-head', 0, 2.28, 0);
  block(head, 'pink-head', 'pink', [0, .98, 0], [.77, 1.9, .62]);
  block(head, 'head-teal-panel', 'gardenerTeal', [-.31, .3, .326], [.13, .36, .065]);
  const watchingEye = eye(head, 0, .98, .37, 1, 'gardener');
  for (const [x, y, width, height, angle] of [[.44, .78, .2, .19, -.35], [.59, .92, .16, .25, -.15], [.61, 1.12, .13, .2, .25], [.53, 1.25, .1, .17, .65]]) {
    const horn = block(head, 'copper-side-horn', 'gardenerCopper', [x, y, .03], [width, height, .15]);
    horn.rotation.z = angle;
  }
  const limbs = [-1, 1].map(side => {
    const arm = joint(body, 'gardener-arm', side * .68, 2.5, 0);
    block(arm, 'hanging-arm', 'pink', [0, -.54, 0], [.45, 1.1, .44]);
    block(arm, 'elbow-band', 'gardenerGrey', [0, -1.1, 0], [.46, .18, .46]);
    block(arm, 'pink-forearm', 'pink', [0, -1.38, .02], [.5, .48, .48]);
    block(arm, 'hand-cap', 'gardenerGrey', [0, -1.7, .04], [.51, .2, .5]);
    block(arm, 'arm-teal-patch', 'gardenerTeal', [side * .235, -.5, .02], [.035, .35, .31]);
    for (const finger of [-1, 0, 1]) {
      block(arm, 'long-claw', 'gardenerGrey', [finger * .155, -1.91, .12], [.105, .26, .14]);
      block(arm, 'claw-tip', 'gardenerClaw', [finger * .155, -2.04, .145], [.11, .085, .18]);
    }
    arm.userData.side = side;
    return arm;
  });
  root.userData = { type: 'gardener', body, head, eye: watchingEye, limbs, leftArm: limbs[0], rightArm: limbs[1], baseBodyY: 0 };
  return root;
}

/** @param {string} type @returns {THREE.Group} */
export function createCreature(type) {
  if (type === 'mech-spider-tank-ultra') return createMechSpiderTankUltra();
  if (type === COPPER_MINE_WALKER_TYPE) return createCopperMineWalker();
  if (type === COPPER_SPIDER_DRONE_TYPE) return createCopperSpiderDrone();
  if (type === MINER_BOT_TYPE) return createMinerBot();
  if (type === 'copper-mega-drill') return createCuttableMegaDrill();
  if (type === 'war-player') {
    const player = createPlayer(); player.name = 'war-player';
    Object.assign(player.userData, { type: 'war-player', displayName: 'Player', warPlayer: true });
    return player;
  }
  if (type === OCTO_NOSE_TYPE) return createOctoNose();
  if (type === COPPER_FORTRESS_TYPE) return createCopperFortress();
  if (type === COPPER_REPAIR_DRONE_TYPE) return createRepairDrone();
  if (type === COPPER_DRILL_HOUND_TYPE) return createCopperDrillHound();
  if (COPPER_SIEGE_TYPES.includes(type)) return createCopperSiegeEnemy(type);
  if (type === COPPER_TRON_TYPE) return createCopperTron();
  if (type === 'ling') return createLing();
  if (type === 'brain') return createBrain();
  if (type === 'gardener') return createGardener();
  if (COLOSSEUM_ENEMY_TYPES.includes(type)) return createColosseumEnemy(type);
  if (TRI_CREATURE_TYPES.includes(type)) return createTriCreature(type);
  if (BOSS_TYPES.includes(type)) return createBoss(type);
  throw new TypeError(`Unknown Tri creature type: ${String(type)}`);
}

/** Animate only local model joints. The caller owns root position and heading. */
export function animateModel(group, time, speed = 0, phase = 'chase', motion = {}) {
  const data = group.userData;
  if (data.ultra) return animateMechSpiderTankUltra(group, time, speed, phase, motion);
  if (data.mineWalker) return animateCopperMineWalker(group, time, speed, phase, motion);
  if (data.spiderDrone) return animateCopperSpiderDrone(group, time, speed, phase, motion);
  if (data.minerBot) return animateMinerBot(group, time, motion.controlling ? 0 : speed, phase, motion);
  if (data.megaDrill) return animateCuttableMegaDrill(group, time, speed, phase, motion);
  if (data.octoNose) return animateOctoNose(group, time, speed, phase, motion);
  if (data.fortress) return animateCopperFortress(group, time, speed, phase, motion);
  if (data.repairDrone) return animateRepairDrone(group, time, speed, phase, motion);
  if (data.drillHound) return animateCopperDrillHound(group, time, speed, phase, motion);
  if (data.siegeEnemy) return animateCopperSiegeEnemy(group, time, speed, phase, motion);
  if (data.type === COPPER_TRON_TYPE) return animateCopperTron(group, time, speed, phase, motion);
  if (data.boss) return animateBoss(group, time, speed, phase, motion);
  if (data.triCreature) return animateTriCreature(group, time, speed, phase, motion);
  if (data.colosseumEnemy) {
    animateColosseumEnemy(group, time, motion.mounted || motion.controlling ? 0 : speed, phase, motion);
    if (motion.controlling) poseFortressCrew(group, time, motion.partState);
    else if (motion.mounted) poseHoundRider(group, time, motion.partState);
    return;
  }
  const actualSpeed = Number.isFinite(speed) ? Math.abs(speed) : 0;
  const movement = Math.min(1, actualSpeed / 3.5);
  const distance = Number.isFinite(motion?.distance) ? Math.max(0, motion.distance) : Math.max(0, time) * actualSpeed;
  const gait = distance / LEG_STRIDE * Math.PI * 2;
  if (data.type === 'player' || data.warPlayer) {
    const stride = Math.sin(distance / 1.5 * Math.PI * 2) * movement;
    data.body.position.y = Math.abs(stride) * .055;
    data.leftLeg.rotation.x = stride * .65;
    data.rightLeg.rotation.x = -stride * .65;
    data.leftArm.rotation.x = -stride * .4;
    // Sword-arm rotation is intentionally owned by the combat renderer.
  } else if (data.type === 'ling') {
    const maxDrop = GROUND_SUPPORT_PROFILES.ling.maxDrop;
    const bodyDrop = Number.isFinite(motion.bodyDrop) ? Math.max(0, Math.min(maxDrop, motion.bodyDrop)) : 0;
    const walking = actualSpeed > .03 && bodyDrop < maxDrop;
    const bob = walking ? Math.abs(Math.sin(gait * 2)) * (.035 + movement * .025) * (1 - bodyDrop / maxDrop) : 0;
    const stride = LEG_STRIDE * .62;
    data.body.position.y = data.baseBodyY + bob - bodyDrop;
    data.body.rotation.x = -.055 * movement;
    data.body.rotation.z = walking ? Math.sin(gait) * .045 * movement : 0;
    for (const limb of data.limbs) {
      const leg = limb.userData;
      const cycle = ((gait + leg.gaitOffset) / (Math.PI * 2) % 1 + 1) % 1;
      const swing = Math.max(0, (cycle - .62) / .38);
      // During stance the foot moves backward one metre per metre travelled,
      // so its world position stays planted as the creature advances.
      const forward = cycle < .62 ? stride * (.5 - cycle / .62)
        : stride * (-.5 + swing * swing * (3 - 2 * swing));
      const lift = walking ? Math.sin(swing * Math.PI) * (.2 + .13 * movement) : 0;
      limb.position.y = leg.restHipY + bob - bodyDrop;
      poseLingLeg(limb, footTarget.set(leg.side * leg.footSpread, .09 - leg.restHipY - bob + bodyDrop + lift, .08 + (walking ? forward : 0)));
      leg.foot.rotation.x = walking ? Math.sin(swing * Math.PI * 2) * .2 : 0;
    }
  } else if (data.type === 'brain') {
    data.body.position.y = data.baseBodyY + Math.sin(time * 2.2) * .12;
    data.body.rotation.x = -.04 * movement;
    data.limbs.forEach(limb => {
      const tentacle = limb.userData;
      for (let i = 0; i < tentacle.points.length; i++) {
        const last = tentacle.points.length - 1;
        const fraction = i / last, wave = time * (2.4 + movement) + tentacle.gaitOffset - i * .7;
        const curl = phase === 'windup' ? fraction * fraction * .29 : 0;
        tentacle.points[i].set(tentacle.side * Math.max(0, i - 1) * .12 + Math.sin(wave) * fraction * .15,
          -.04 - i * .2 + curl, tentacle.front * i * .09 + Math.cos(wave) * fraction * .14 - curl);
        if (phase === 'strike' && tentacle.front > 0) tentacle.points[i].z += fraction * .37;
      }
      tentacle.links.forEach((link, index) => poseSegment(link, tentacle.points[index], tentacle.points[index + 1], .21 - index * .012));
      if (tentacle.tipEye) tentacle.tipEye.position.copy(tentacle.points.at(-1));
    });
  } else if (data.type === 'gardener') {
    data.body.position.y = .055 + Math.sin(time * 2.6) * .035;
    data.body.rotation.x = -.045 * movement;
    data.body.rotation.z = Math.sin(time * 1.8) * .02;
    data.head.rotation.z = Math.sin(time * 1.9) * .025;
    data.head.rotation.x = phase === 'windup' ? .12 : Math.sin(time * 1.6) * .025;
    data.limbs.forEach(limb => {
      limb.rotation.x = phase === 'windup' ? -1.6 : phase === 'strike' ? -.75 : Math.sin(time * 2.3) * .08;
      limb.rotation.z = limb.userData.side * (.05 + Math.sin(time * 1.8) * .025);
    });
  }
}
