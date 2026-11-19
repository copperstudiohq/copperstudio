import * as THREE from './assets/three.module.js';
import { GROUND_SUPPORT_PROFILES, registerGroundSupports } from './ground-support.js';

// Original Rain and Copper proportions and materials, expressed as severable boxes.
export const TRI_CREATURE_TYPES = Object.freeze(['blob', 'trider', 'spreader']);
const cube = new THREE.BoxGeometry(1, 1, 1);
const colors = {
  pink: '#ed6e9f', darkPink: '#b84381', lightPink: '#ffadd1',
  lid: '#9e2469', white: '#fff0d9', iris: '#f47d35', pupil: '#15282d', glint: '#fff8ed',
  blobWhite: '#fffefa', blobIris: '#ca5a50', blobPupil: '#17251f',
  legLight: '#84dcff', legDark: '#256eb1',
};
const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, roughness: /White|iris|glint|white/i.test(name) ? .3 : .44, metalness: name === 'pink' ? .06 : 0, flatShading: true }),
]));
const up = new THREE.Vector3(0, 1, 0);
const direction = new THREE.Vector3();
const STRIDE = 1.65;
const STANCE = 1 / 1.32;

function block(parent, name, color, position, size, anatomy = 'body') {
  const mesh = new THREE.Mesh(cube, materials[color]);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...size);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, anatomicalPart: anatomy };
  parent.add(mesh);
  return mesh;
}

function joint(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  parent.add(group);
  return group;
}

function eyeLayer(parent, prefix, feature, color, position, size, priority) {
  const mesh = block(parent, `${prefix}-eye-${feature}`, color, position, size, 'eye');
  Object.assign(mesh.userData, { critical: true, surfaceDetail: true, feature, detailPriority: priority });
  if (feature === 'glint') mesh.castShadow = false;
  return mesh;
}

/** The original single Tri eye, with its enormous Trider lid and vertical pupil. */
function triEye(parent, type, position, scale) {
  const socket = joint(parent, `${type}-eye`, position);
  socket.scale.set(...scale);
  eyeLayer(socket, type, 'lid', 'lid', [0, 0, 0], [.65, .71, .19], 5);
  const inner = joint(socket, `${type}-eye-inner`, [0, 0, .09]);
  eyeLayer(inner, type, 'sclera', 'white', [0, 0, 0], [.53, .59, .25], 10);
  eyeLayer(inner, type, 'iris', 'iris', [0, 0, .15], [.25, .3, .055], 20);
  eyeLayer(inner, type, 'pupil', 'pupil', [0, 0, .185], [.095, .2, .025], 30);
  eyeLayer(inner, type, 'glint', 'glint', [-.055, .085, .204], [.052, .065, .012], 40);
  return socket;
}

function createBlob() {
  const root = new THREE.Group();
  root.name = 'tri-blob';
  const body = joint(root, 'blob-body', [0, .08, 0]);
  const torso = block(body, 'blob-pink-body', 'pink', [0, .43, 0], [1.04, 1, .94]);
  for (let index = 0; index < 3; index++) {
    const angle = index / 3 * Math.PI * 2;
    block(body, `blob-bottom-lobe-${index}`, index === 1 ? 'darkPink' : 'pink',
      [Math.sin(angle) * .34, .16, Math.cos(angle) * .32], [.48, .34, .5]);
  }
  block(body, 'blob-pale-crest', 'lightPink', [-.23, .72, -.05], [.32, .4, .28]);
  // creatures.js uses 2-unit boxes inside a .215-scaled eye group.
  const eye = joint(body, 'blob-eye', [0, .55, .401]);
  eye.scale.setScalar(.215);
  eyeLayer(eye, 'blob', 'sclera', 'blobWhite', [0, 0, 0], [2, 2, 1.32], 10);
  eyeLayer(eye, 'blob', 'iris', 'blobIris', [0, 0, .6], [1.04, 1.08, .24], 20);
  eyeLayer(eye, 'blob', 'pupil', 'blobPupil', [0, 0, .704], [.51, .64, .11], 30);
  eyeLayer(eye, 'blob', 'glint', 'blobWhite', [-.12, .2, .76], [.24, .24, .09], 40);
  root.userData = { type: 'blob', triCreature: true, body, torso, eye, limbs: [], baseBodyY: .08 };
  return root;
}

function poseSegment(mesh, start, end, width) {
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  direction.copy(end).sub(start);
  mesh.scale.set(width, direction.length() + .035, width);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
}

function poseTriderLeg(leg, forward, lift, time, attack, bodyDrop = 0) {
  const { angle, points, links } = leg.userData;
  const x = Math.cos(angle), z = Math.sin(angle);
  const footX = x * 2.5;
  const footZ = z * 2.5 + .55 + forward;
  for (let index = 0; index <= 8; index++) {
    const t = index / 8;
    const bow = Math.sin(t * Math.PI);
    // Flexible, bowed eight-link chains rather than mechanical knee joints.
    points[index].set(x * .6 + (footX - x * .6) * t + x * bow * .42,
      (3.3 - bodyDrop) * (1 - t) + (.1 + lift) * t + bow * .08,
      z * .6 + (footZ - z * .6) * t + z * bow * .42);
    if (attack && z > .3) points[index].z += Math.sin(t * Math.PI) * attack;
    if (index > 0 && index < 8) {
      points[index].x += Math.sin(time * 2 + angle - t * 4) * bow * .035;
    }
  }
  links.forEach((link, index) => poseSegment(link, points[index], points[index + 1], .32 - index * .02));
  leg.userData.foot.position.copy(points[8]);
}

function createTrider() {
  const root = new THREE.Group();
  root.name = 'tri-trider';
  const body = joint(root, 'trider-body', [0, 3.4, 0]);
  const torso = block(body, 'trider-pink-body', 'pink', [0, 0, 0], [1.7, 2, 1.6]);
  const eye = triEye(body, 'trider', [0, 0, .85], [3.2, 3.35, 1.65]);
  const legs = Array.from({ length: 8 }, (_, index) => {
    const leg = joint(root, `trider-tentacle-${index}`);
    const links = Array.from({ length: 8 }, (_, link) => block(leg,
      `trider-${index}-${link === 7 ? 'foot' : 'link'}-${link}`,
      link % 2 ? 'legLight' : 'legDark', [0, 0, 0], [1, 1, 1], link === 7 ? 'leg' : 'arm'));
    const foot = joint(leg, `trider-foot-contact-${index}`);
    leg.userData = { angle: index * Math.PI / 4, gaitOffset: index % 2 * .5,
      points: Array.from({ length: 9 }, () => new THREE.Vector3()), links, foot, terminal: links[7] };
    poseTriderLeg(leg, 0, 0, 0, 0);
    return leg;
  });
  root.userData = { type: 'trider', triCreature: true, body, torso, eye, limbs: legs, legs, baseBodyY: 3.4 };
  registerGroundSupports(root, legs);
  return root;
}

function createSpreader() {
  const root = new THREE.Group();
  root.name = 'tri-spreader';
  const body = joint(root, 'spreader-body', [0, 1.1, 0]);
  const torso = block(body, 'spreader-pink-body', 'pink', [0, 0, 0], [2.8, 1.45, 2.5]);
  block(body, 'spreader-crown', 'pink', [0, .86, 0], [2.05, .5, 1.95]);
  block(body, 'spreader-base', 'pink', [0, -.6, 0], [3.05, .55, 2.6]);
  for (const side of [-1, 1]) block(body, `spreader-side-lobe-${side}`, 'pink', [side * 1.15, -.6, .15], [.9, .7, 1.55]);
  const eye = triEye(body, 'spreader', [0, .25, 1.28], [1.65, 1.65, 1.65]);
  root.userData = { type: 'spreader', triCreature: true, body, torso, eye, limbs: [], baseBodyY: 1.1 };
  return root;
}

/** @param {'blob'|'trider'|'spreader'} type @returns {THREE.Group} */
export function createTriCreature(type) {
  if (type === 'blob') return createBlob();
  if (type === 'trider') return createTrider();
  if (type === 'spreader') return createSpreader();
  throw new TypeError(`Unknown original Tri creature: ${String(type)}`);
}

/** Animate local joints only. No animation changes visibility or voxel occupancy. */
export function animateTriCreature(group, time, speed = 0, phase = 'chase', motion = {}) {
  const data = group.userData;
  const clock = Number.isFinite(time) ? time : 0;
  const actualSpeed = Number.isFinite(speed) ? Math.abs(speed) : 0;
  const walking = actualSpeed > .03;
  const movement = Math.min(1, actualSpeed / 3.5);
  const distance = Number.isFinite(motion?.distance) ? Math.max(0, motion.distance) : Math.max(0, clock) * actualSpeed;
  const gait = distance / STRIDE;
  if (data.type === 'trider') {
    const maxDrop = GROUND_SUPPORT_PROFILES.trider.maxDrop;
    const bodyDrop = Number.isFinite(motion.bodyDrop) ? Math.max(0, Math.min(maxDrop, motion.bodyDrop)) : 0;
    const stepping = walking && bodyDrop < maxDrop;
    data.body.position.y = 3.4 + (stepping ? Math.sin(gait * Math.PI * 4) * .045 * (1 - bodyDrop / maxDrop) : 0) - bodyDrop;
    data.body.rotation.z = stepping ? Math.sin(gait * Math.PI * 2) * .025 : 0;
    data.body.rotation.x = phase === 'windup' ? -.09 : -.025 * movement;
    const attack = phase === 'windup' ? -.35 : phase === 'strike' ? .65 : 0;
    for (const leg of data.legs) {
      const cycle = ((gait + leg.userData.gaitOffset) % 1 + 1) % 1;
      const swing = Math.max(0, (cycle - STANCE) / (1 - STANCE));
      const stride = STRIDE * STANCE;
      const forward = cycle < STANCE ? stride * (.5 - cycle / STANCE)
        : stride * (-.5 + swing * swing * (3 - 2 * swing));
      const lift = stepping ? Math.sin(swing * Math.PI) * (.55 + movement * .25) : 0;
      poseTriderLeg(leg, stepping ? forward : 0, lift, clock, attack, bodyDrop);
    }
  } else if (data.type === 'blob') {
    const bounce = walking ? Math.abs(Math.sin(distance / .85 * Math.PI)) : 0;
    const squeeze = phase === 'windup' ? .2 : Math.sin(clock * 3.2) * .025 + bounce * .09;
    data.body.scale.set(1 + squeeze * .45, 1 - squeeze, 1 + squeeze * .35);
    data.body.position.y = data.baseBodyY + bounce * .19;
    data.body.rotation.z = Math.sin(clock * 3.2) * .045 * movement;
    data.body.rotation.x = phase === 'strike' ? -.14 : -.06 * movement;
  } else if (data.type === 'spreader') {
    const squeeze = phase === 'windup' ? .17 : phase === 'strike' ? -.08 : Math.sin(clock * 2) * .025;
    data.body.scale.set(1 + squeeze * .45, 1 - squeeze, 1 + squeeze * .4);
    // Keep the wide lower lobes above the ground while the body squashes.
    data.body.position.y = data.baseBodyY - squeeze * .85;
    data.body.rotation.x = phase === 'strike' ? -.065 : -.02 * movement;
    data.body.rotation.z = Math.sin(clock * 1.5) * .015;
  }
}
