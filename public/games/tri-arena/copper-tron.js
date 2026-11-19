import * as THREE from './assets/three.module.js';
import { addGolemJoint, animateGolemMagic } from './golem-magic.js';

export const COPPER_TRON_TYPE = 'copper-tron-1000';
export const COPPER_TRON_SUPPORT_HEIGHT = 5.2;
const cube = new THREE.BoxGeometry(1, 1, 1);
const up = new THREE.Vector3(0, 1, 0), direction = new THREE.Vector3();
const gunAnchor = new THREE.Vector3(), gunTarget = new THREE.Vector3();
const bodyTransform = new THREE.Matrix4(), weaponTransform = new THREE.Matrix4();
const posedBounds = new THREE.Box3(), unitScale = new THREE.Vector3(1, 1, 1);
const balanceRotation = new THREE.Quaternion(), torsoRotation = new THREE.Quaternion(), balanceEuler = new THREE.Euler();
const materials = Object.fromEntries(Object.entries({
  copper: '#b96e43', edge: '#e5a468', shadow: '#77442e', patina: '#397e77',
  dark: '#182d34', steel: '#a7bab6', eye: '#398dff', magic: '#48caff', core: '#72e6ff',
}).map(([name, color]) => [name, new THREE.MeshStandardMaterial({ color,
  metalness: ['eye', 'magic', 'core'].includes(name) ? .1 : .78, roughness: .42, flatShading: true })]));

function block(parent, name, material, position, size, options = {}) {
  const mesh = new THREE.Mesh(cube, materials[material]);
  mesh.name = name; mesh.position.set(...position); mesh.scale.set(...size);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, anatomicalPart: 'body', ...options };
  parent.add(mesh); return mesh;
}
function joint(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group(); group.name = name; group.position.set(...position); parent.add(group); return group;
}
function segment(mesh, a, b, width, depth = width, insetStart = 0, insetEnd = 0) {
  direction.copy(b).sub(a); mesh.position.copy(a).add(b).multiplyScalar(.5);
  const length = direction.length(); direction.normalize();
  mesh.position.addScaledVector(direction, (insetStart - insetEnd) / 2);
  mesh.scale.set(width, Math.max(.1, length - insetStart - insetEnd), depth);
  mesh.quaternion.setFromUnitVectors(up, direction);
}
function weaponAlive(motion, id) {
  const record = motion?.weaponState?.[id] ?? motion?.weaponsRemaining?.[id];
  return typeof record === 'number' ? record > 0 : record ? record.remaining > 0 : true;
}
function fabricatorPristine(motion, id) {
  const record = motion?.weaponState?.[id];
  if (record && typeof record === 'object') return record.total > 0 && record.remaining === record.total;
  return weaponAlive(motion, id);
}
function localBounds(parent, include) {
  parent.updateWorldMatrix(true, true);
  const inverse = parent.matrixWorld.clone().invert(), matrix = new THREE.Matrix4(), bounds = new THREE.Box3();
  parent.traverse(mesh => {
    if (!mesh.isMesh || !include(mesh)) return;
    mesh.geometry.computeBoundingBox();
    matrix.multiplyMatrices(inverse, mesh.matrixWorld);
    bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(matrix));
  });
  return bounds;
}

/** A two-segment copper golem on exactly three double-hit armored support legs. */
export function createCopperTron() {
  const root = new THREE.Group(); root.name = COPPER_TRON_TYPE;
  const body = joint(root, 'copper-tron-body', [0, COPPER_TRON_SUPPORT_HEIGHT, 0]);
  const front = joint(body, 'copper-tron-front-segment');
  const rear = joint(body, 'copper-tron-abdomen-segment');
  const main = { bossMain: true, anatomicalPart: 'body' };
  function shell(parent, name, material, position, size, options = main) {
    return block(parent, name, material, [position[0] * .8, 1.2 + (position[1] - 1.2) * .8, position[2] * .8], size.map(value => value * .8), options);
  }
  const frontShell = shell(front, 'copper-tron-main-front', 'copper', [0, 1.16, 1.08], [2.16, 1.2, 1.68]);
  shell(front, 'copper-tron-front-crown', 'edge', [0, 1.84, .9], [1.92, .2, 1.44]);
  shell(front, 'copper-tron-front-bottom-rim', 'shadow', [0, .64, .96], [2.28, .16, 1.8]);
  const rearShell = shell(rear, 'copper-tron-main-abdomen', 'copper', [0, 1.28, -1.08], [2.64, 1.44, 2.4]);
  shell(rear, 'copper-tron-abdomen-crown', 'edge', [0, 2.04, -1.2], [2.16, .2, 1.92]);
  for (const side of [-1, 1]) {
    shell(rear, 'copper-tron-abdomen-side-plate', 'shadow', [side * 1.32, 1.28, -1.08], [.2, 1.08, 2.16]);
    shell(rear, 'copper-tron-patina-inlay', 'patina', [side * 1.44, 1.34, -1.08], [.12, .6, 1.2]);
    shell(front, 'copper-tron-front-cheek', 'edge', [side * 1.02, 1.16, 1.08], [.24, .96, 1.2]);
  }
  for (let rib = 0; rib < 4; rib++) shell(rear, 'copper-tron-abdomen-ridge', 'edge', [0, 2.19, -1.92 + rib * .48], [1.68, .14, .16]);
  const core = shell(front, 'copper-tron-main-core', 'core', [0, 1.16, .36], [.36, .36, .36],
    { ...main, anatomicalPart: 'core', critical: true, detailPriority: 95 });
  const eyes = [];
  for (const x of [-.42, .42]) for (const worldY of [6.18, 6.66]) {
    // Half-grid X/Y centers and a single Z layer: exactly2×2×1 cells at0.12m.
    const eye = block(front, `copper-tron-blue-eye-${eyes.length}`, 'eye', [x, worldY - COPPER_TRON_SUPPORT_HEIGHT, 1.56], [.239, .239, .11],
      { anatomicalPart: 'head', critical: false, eyeIndex: eyes.length, detailPriority: 50 });
    eyes.push(eye);
  }
  const magicJoints = [];
  const bodyLink = shell(body, 'copper-tron-segment-magic-joint', 'magic', [0, 1.16, .18], [.84, .48, .36], {});
  magicJoints.push({ anchor: bodyLink, adjacent: [frontShell, rearShell] });
  const legs = [Math.PI, Math.PI / 3, -Math.PI / 3].map((angle, index) => {
    const group = joint(root, `copper-tron-tripod-leg-${index}`);
    const armor = { cutHits: 2, balanceId: `leg-${index}` };
    const upper = block(group, `copper-tron-leg-${index}-upper-armor`, 'copper', [0, 0, 0], [1, 1, 1], { ...armor, localVoxelGrid: true });
    const lower = block(group, `copper-tron-leg-${index}-lower-armor`, 'shadow', [0, 0, 0], [1, 1, 1], { ...armor, localVoxelGrid: true });
    const hip = block(group, `copper-tron-leg-${index}-hip-magic`, 'magic', [0, 0, 0], [.48, .48, .48], armor);
    const knee = block(group, `copper-tron-leg-${index}-knee-magic`, 'magic', [0, 0, 0], [.72, .72, .72], armor);
    const foot = joint(group, `copper-tron-leg-${index}-branch-foot`);
    const sole = block(foot, `copper-tron-leg-${index}-ground-support`, 'copper', [0, .16, 0], [.72, .32, .84],
      { cutHits: 2, anatomicalPart: 'leg', structuralId: `leg-${index}`, balanceId: `leg-${index}` });
    for (const side of [-1, 1]) block(foot, `copper-tron-leg-${index}-foot-prong`, 'edge', [side * .43, .13, .12], [.24, .26, 1.08], armor);
    block(foot, `copper-tron-leg-${index}-toe`, 'patina', [0, .19, .48], [.48, .18, .24], armor);
    // Explicit anatomy prevents nearby cannons becoming accidental load-bearing parents.
    hip.userData.rigParent = (index === 0 ? rearShell : frontShell).uuid;
    upper.userData.rigParent = hip.uuid;
    knee.userData.rigParent = upper.uuid;
    lower.userData.rigParent = knee.uuid;
    for (const part of foot.children) part.userData.rigParent = part === sole ? lower.uuid : sole.uuid;
    group.userData = { angle, index, upper, lower, hip, knee, foot, sole,
      a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), ankle: new THREE.Vector3() };
    magicJoints.push({ anchor: hip, adjacent: [upper, rearShell] }, { anchor: knee, adjacent: [upper, lower] });
    return group;
  });
  const fabricators = [-1, 1].map((side, index) => {
    const group = joint(body, `copper-tron-fabricator-${index}`);
    const distal = { weaponId: `fabricator-${index}`, anatomicalPart: 'arm' };
    block(group, `copper-tron-fabricator-${index}-body-mount`, 'copper', [side * .52, .4, -1.08], [.36, .72, .42], distal);
    const upper = block(group, `copper-tron-fabricator-${index}-upper`, 'shadow', [0, 0, 0], [1, 1, 1], distal);
    const lower = block(group, `copper-tron-fabricator-${index}-forearm`, 'copper', [0, 0, 0], [1, 1, 1], distal);
    const elbow = block(group, `copper-tron-fabricator-${index}-magic-elbow`, 'magic', [0, 0, 0], [.3, .3, .3], distal);
    const claw = joint(group, `copper-tron-fabricator-${index}-claw`);
    block(claw, `copper-tron-fabricator-${index}-print-nozzle`, 'dark', [0, -.08, .08], [.36, .36, .42], distal);
    block(claw, `copper-tron-fabricator-${index}-nozzle-tip`, 'patina', [0, -.3, .15], [.18, .14, .18], distal);
    for (const finger of [-1, 1]) block(claw, `copper-tron-fabricator-${index}-claw-finger`, 'edge', [finger * .27, -.18, .16], [.14, .48, .18], distal);
    group.userData = { side, index, upper, lower, elbow, claw,
      a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() };
    magicJoints.push({ anchor: elbow, adjacent: [upper, lower] });
    return group;
  });
  const gun = joint(body, 'copper-tron-underslung-machine-gun');
  const gunParts = { weaponId: 'machine-gun', anatomicalPart: 'arm' };
  block(gun, 'copper-tron-gun-receiver', 'copper', [0, 0, .1], [.84, .6, .96], gunParts);
  block(gun, 'copper-tron-gun-breech', 'shadow', [0, .35, -.1], [.6, .24, .6], gunParts);
  block(gun, 'copper-tron-gun-barrel', 'dark', [0, 0, .98], [.3, .3, 1.2], gunParts);
  block(gun, 'copper-tron-gun-muzzle', 'edge', [0, 0, 1.65], [.48, .48, .18], gunParts);
  block(gun, 'copper-tron-gun-ammo-box', 'patina', [.53, -.02, -.08], [.36, .48, .6], gunParts);
  const gunHanger = block(body, 'copper-tron-gun-hanger', 'shadow', [0, 0, 0], [1, 1, 1], { anatomicalPart: 'arm' });
  const missileCannons = [-.6, 0, .6].map((x, index) => {
    const cannon = joint(rear, `copper-tron-rear-missile-cannon-${index}`, [x, 1.36, -1.92]);
    const weapon = { weaponId: `missile-cannon-${index}`, anatomicalPart: 'arm' };
    block(cannon, `copper-tron-missile-${index}-receiver`, 'copper', [0, 0, 0], [.42, .42, .48], weapon);
    block(cannon, `copper-tron-missile-${index}-barrel`, 'shadow', [0, 0, -.6], [.24, .24, 1.05], weapon);
    block(cannon, `copper-tron-missile-${index}-muzzle`, 'edge', [0, 0, -1.2], [.38, .38, .15], weapon);
    cannon.userData.index = index;
    return cannon;
  });
  root.userData = { type: COPPER_TRON_TYPE, boss: true, body, segments: [front, rear], mainFront: frontShell,
    core, eye: eyes[0], eyes, legs, limbs: legs, fabricators, gun, gunHanger, missileCannons,
    baseBodyY: COPPER_TRON_SUPPORT_HEIGHT, magicJoints,
    mainLocalBounds: localBounds(body, mesh => mesh.userData.bossMain === true),
    gunLocalBounds: localBounds(gun, mesh => mesh.userData.severable === true) };
  animateCopperTron(root, 0);
  magicJoints.forEach(({ anchor, adjacent }, index) => addGolemJoint(root, anchor, adjacent, { phase: index * .73, name: 'copper-tron-blue-magic-link' }));
  return root;
}

/** Root translation/yaw belongs to the caller; supportHeight and bodyDrop are local meters. */
export function animateCopperTron(model, time, speed = 0, phase = 'idle', motion = {}) {
  const data = model.userData, clock = Number.isFinite(time) ? time : 0;
  const actualSpeed = Number.isFinite(speed) ? Math.abs(speed) : 0;
  const support = Number.isFinite(motion.supportHeight) ? motion.supportHeight : COPPER_TRON_SUPPORT_HEIGHT;
  const drop = Number.isFinite(motion.bodyDrop) ? Math.max(0, motion.bodyDrop) : 0;
  let bodyY = Math.max(1.4, support - drop);
  let tiltX = Number.isFinite(motion.balanceTiltX) ? motion.balanceTiltX : 0;
  let tiltZ = Number.isFinite(motion.balanceTiltZ) ? motion.balanceTiltZ : 0;
  const tilt = Math.hypot(tiltX, tiltZ);
  if (tilt > .1) { tiltX *= .1 / tilt; tiltZ *= .1 / tilt; }
  balanceRotation.setFromEuler(balanceEuler.set(tiltX, 0, tiltZ));
  torsoRotation.setFromAxisAngle(up, Number.isFinite(motion.torsoYaw) ? motion.torsoYaw : 0);
  data.body.quaternion.copy(balanceRotation).multiply(torsoRotation);
  bodyTransform.makeRotationFromQuaternion(balanceRotation);
  // Reserve the same clearance for every aim angle, so looking cannot lift the hips.
  const bounds = data.mainLocalBounds;
  const radius = Math.hypot(Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)), Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z)));
  const minimum = bounds.min.y * bodyTransform.elements[5] - radius * Math.hypot(bodyTransform.elements[1], bodyTransform.elements[9]);
  bodyY += Math.max(0, COPPER_TRON_SUPPORT_HEIGHT + .56 - drop - (bodyY + minimum));
  data.body.position.set(0, bodyY, 0);
  bodyTransform.makeRotationFromQuaternion(data.body.quaternion);
  const distance = Number.isFinite(motion.distance) ? motion.distance : Math.max(0, clock) * actualSpeed;
  const jumping = phase === 'jump' ? Number.isFinite(motion.jumpProgress) ? Math.sin(Math.PI * Math.max(0, Math.min(1, motion.jumpProgress))) : .8 : 0;
  data.legs.forEach(leg => {
    const d = leg.userData, x = d.index === 0 ? 0 : Math.sin(d.angle), z = Math.cos(d.angle);
    const cycle = ((distance / 2.2 + d.index / 3) % 1 + 1) % 1;
    const swing = Math.max(0, (cycle - .72) / .28);
    const forward = actualSpeed > .03 ? cycle < .72 ? 2.2 * (.36 - cycle) : 1.584 * (-.5 + swing * swing * (3 - 2 * swing)) : 0;
    const lift = actualSpeed > .03 ? Math.sin(swing * Math.PI) * .45 : 0;
    const footRadius = (d.index === 0 ? 5 : 4.05) - jumping * .8;
    if (d.index === 0) d.a.set(0, 2.6, -1.8);
    else d.a.set(x * 1.5, 2.6, z * 1.5 - .35);
    d.a.applyQuaternion(balanceRotation).add(data.body.position);
    const kneeRadius = d.index === 0 ? 4.5 : 3.5;
    d.b.set(x * kneeRadius, 1.5, z * kneeRadius - .35);
    d.b.applyQuaternion(balanceRotation).add(data.body.position);
    d.c.set(x * footRadius, .05 + lift + jumping * 1.2, z * footRadius + forward - .35);
    d.ankle.copy(d.c); d.ankle.y += .22;
    d.hip.position.copy(d.a); d.knee.position.copy(d.b);
    segment(d.upper, d.a, d.b, .6, .72, .24, .24); segment(d.lower, d.b, d.ankle, .36, .48, .24, 0);
    d.hip.quaternion.copy(d.upper.quaternion); d.knee.quaternion.copy(d.upper.quaternion);
    d.foot.position.copy(d.c); d.foot.rotation.y = d.angle;
  });
  const extension = Math.min(1.9, Math.max(.25, bodyY - .7));
  data.fabricators.forEach(arm => {
    const d = arm.userData;
    const active = fabricatorPristine(motion, `fabricator-${d.index}`);
    const working = phase === 'fabricate' && active ? Math.sin(clock * 3.6 + d.index * Math.PI) : 0;
    d.a.set(d.side * .52, .1, -1.08);
    d.b.set(d.side * (.66 + working * .08), .1 - extension * .52, -.8 + working * .1);
    d.c.set(d.side * (.62 + working * .15), .1 - extension + working * .08, -.25);
    segment(d.upper, d.a, d.b, .24, .3, 0, .13); segment(d.lower, d.b, d.c, .28, .32, .13, 0);
    d.elbow.position.copy(d.b); d.claw.position.copy(d.c);
    d.claw.rotation.z = active ? d.side * (.15 + working * .15) : d.side * .35;
  });
  const gunY = Math.max(.65 - bodyY, -1.96);
  data.gun.position.set(0, gunY, 1.32);
  const alive = weaponAlive(motion, 'machine-gun') && motion.gunAvailable !== false;
  data.gun.rotation.x = phase === 'shoot' && alive ? Math.sin(clock * 24) * .025 : 0;
  data.gun.position.z -= phase === 'shoot' && alive ? Math.abs(Math.sin(clock * 24)) * .08 : 0;
  bodyTransform.setPosition(data.body.position);
  weaponTransform.compose(data.gun.position, data.gun.quaternion, unitScale).premultiply(bodyTransform);
  posedBounds.copy(data.gunLocalBounds).applyMatrix4(weaponTransform);
  if (posedBounds.min.y < .08) data.gun.position.y += (.08 - posedBounds.min.y) / bodyTransform.elements[5];
  gunAnchor.set(0, .7, 1.08); gunTarget.set(0, data.gun.position.y + .25, 1.32);
  segment(data.gunHanger, gunAnchor, gunTarget, .25, .32);
  data.missileCannons.forEach((cannon, index) => {
    const firing = (phase === 'missile' || motion.attackName === 'missiles') && weaponAlive(motion, `missile-cannon-${index}`);
    cannon.position.z = -1.92 + (firing ? Math.max(0, Math.sin(clock * 11 - index * .7)) * .08 : 0);
  });
  animateGolemMagic(model, clock, motion.partState);
}
