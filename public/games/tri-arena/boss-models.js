import * as THREE from './assets/three.module.js';
import { GROUND_SUPPORT_PROFILES, registerGroundSupports } from './ground-support.js';

export const BOSS_TYPES = Object.freeze(['copper-giant', 'lake-terror', 'frost-triram', 'sky-eye', 'trilom-leader', 'trilom-wraith']);

const cube = new THREE.BoxGeometry(1, 1, 1);
const up = new THREE.Vector3(0, 1, 0);
const colors = {
  pink: '#eb3d9e', lightPink: '#ff79bc', darkPink: '#9e2469',
  blue: '#205f9c', darkBlue: '#174b80', cyan: '#67d9ff', terrorBlue: '#38b6e8', ice: '#67d7f4',
  cream: '#fff0d9', orange: '#f47d35', pupil: '#15282d',
  copper: '#d78148', copperLight: '#ee9c62', copperDark: '#9e5b33', mint: '#becfbc', crownCopper: '#d98b4c',
  metal: '#627aa0', dark: '#173c40', gold: '#e8b94f', amber: '#fff1ad',
  cloth: '#24152f', folds: '#3c2548', face: '#090711', purple: '#e2a0ff',
  frostCream: '#fff0d4', frostOrange: '#e58042', frostPupil: '#182136',
};
const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, roughness: /copper|gold/i.test(name) ? .25 : .78, metalness: /copper|gold|mint/i.test(name) ? .8 : .05, flatShading: true }),
]));
materials.power = new THREE.MeshStandardMaterial({ color: '#9dfff0', emissive: '#24f6ed', emissiveIntensity: 1.8 });
materials.amber.emissive.set('#ffad3b'); materials.amber.emissiveIntensity = 1.4;
materials.purple.emissive.set('#bb32ff'); materials.purple.emissiveIntensity = 2;
materials.ice.emissive.set('#164e75'); materials.ice.emissiveIntensity = .25;
for (const [name, source] of Object.entries({ ghost: 'cloth', ghostFold: 'folds', ghostFace: 'face', ghostGold: 'gold', ghostCopper: 'crownCopper', ghostEye: 'purple' })) {
  const material = materials[source].clone();
  material.color.lerp(new THREE.Color('#ad72e4'), .4);
  material.emissive.set('#7131ac'); material.emissiveIntensity = name === 'ghostEye' ? 2 : .65;
  material.transparent = true; material.opacity = name === 'ghostEye' ? .95 : .46; material.depthWrite = false;
  materials[name] = material;
}

/** All anatomy is made from independent box meshes for spatial voxel slicing. */
function block(parent, name, material, position, size, anatomicalPart = 'body') {
  const mesh = new THREE.Mesh(cube, materials[material]);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...size);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const detailPriority = anatomicalPart === 'core' ? 95 : /glint/.test(name) ? 90 : /pupil/.test(name) ? 80
    : /iris|purple-eye|yellow-eye/.test(name) ? 70 : /sclera/.test(name) ? 60 : anatomicalPart === 'eye' ? 50
      : /vein|seam|streak|band|cap|edge|fur-tuft|fingertip|faceplate|face-guard/.test(name) ? 5 : 0;
  mesh.userData = { severable: true, anatomicalPart, critical: anatomicalPart === 'eye' || anatomicalPart === 'core',
    surfaceDetail: detailPriority > 0, detailPriority };
  parent.add(mesh);
  return mesh;
}

function joint(parent, name, x = 0, y = 0, z = 0) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

function eye(parent, x, y, z, scale = 1, profile = 'frost') {
  const group = joint(parent, 'boss-tri-eye', x, y, z);
  group.scale.setScalar(scale);
  const layers = profile === 'sky' ? [
    ['eye-sclera', 'cream', [0, 0, 2], [6.2, 5.9, .7]],
    ['eye-orange-iris', 'orange', [0, 0, 2.45], [3.5, 4, .35]],
    ['eye-pupil', 'pupil', [0, 0, 2.7], [1.1, 3, .22]],
    ['eye-glint', 'cream', [-.8, 1, 2.85], [.6, .7, .12]],
  ] : profile === 'terror' ? [
    ['eye-sclera', 'cream', [0, .2, .91], [1.5, 1.5, .32]],
    ['eye-orange-iris', 'orange', [0, .2, 1.1], [.8, .95, .11]],
    ['eye-pupil', 'pupil', [0, .2, 1.18], [.23, .72, .07]],
    ['eye-glint', 'cream', [-.2, .48, 1.23], [.16, .18, .04]],
  ] : [
    ['eye-lid', 'darkPink', [0, .15, .79], [1.05, 1.17, .16]],
    ['eye-sclera', 'frostCream', [0, .15, .9], [.84, .95, .12]],
    ['eye-orange-iris', 'frostOrange', [0, .12, .98], [.51, .7, .06]],
    ['eye-pupil', 'frostPupil', [0, .12, 1.02], [.15, .6, .04]],
    ['eye-glint', 'frostCream', [-.12, .34, 1.05], [.12, .14, .03]],
  ];
  for (const [name, material, position, size] of layers) block(group, name, material, position, size, 'eye');
  return group;
}

function segment(parent, name, material, a, b, width, anatomy) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const delta = end.clone().sub(start);
  const mesh = block(parent, name, material, start.clone().add(end).multiplyScalar(.5).toArray(), [width, delta.length() + .05, width], anatomy);
  mesh.quaternion.setFromUnitVectors(up, delta.normalize());
  return mesh;
}

function finish(root, type, body, data = {}) {
  root.name = type;
  root.userData = { type, boss: true, body, limbs: [], baseBodyY: body.position.y, ...data };
  if (data.legs?.length) registerGroundSupports(root, data.legs);
  return root;
}

function copperGiant() {
  const root = new THREE.Group(), body = joint(root, 'giant-body');
  block(body, 'copper-chest', 'copper', [0, 2.85, 0], [2.5, 2.05, 1.4]);
  block(body, 'chest-lower-plate', 'copperLight', [0, 2.17, .74], [2.25, .37, .15]);
  block(body, 'waist-mint-band', 'mint', [0, 1.77, 0], [2.15, .15, 1.3]);
  block(body, 'hip-block', 'copperDark', [0, 1.5, 0], [1.9, .45, 1.05]);
  block(body, 'chest-pale-mint-cap', 'mint', [0, 3.85, 0], [2.43, .12, 1.36]);
  for (let index = 0; index < 6; index++) {
    const height = .07 + index % 3 * .045;
    block(body, 'chest-mint-edge-streak', 'mint', [(index / 5 - .5) * 2.15, 3.79 - height / 2, .72], [.19, height, .04]);
  }
  for (const side of [-1, 1]) block(body, 'lower-chest-copper-tile', 'copperLight', [side * .43, 2.18, .79], [.51, .44, .09]);
  const core = block(body, 'charged-power-core', 'power', [0, 2.73, -.76], [.5, .6, .12], 'core');
  const head = joint(body, 'giant-head', 0, 3.72, .48);
  block(head, 'head-slab', 'copper', [0, 0, .35], [.84, 1.16, .74], 'head');
  block(head, 'wide-brow', 'copperLight', [0, .73, 0], [2.2, .6, 1.02], 'head');
  block(head, 'hanging-faceplate', 'copperLight', [0, 0, .76], [.75, 1.06, .055], 'head');
  const watchingEye = block(head, 'giant-yellow-eye', 'amber', [0, .04, .81], [.18, .72, .055], 'eye');
  block(head, 'brow-pale-mint-cap', 'mint', [0, 1.02, 0], [2.13, .09, .99], 'head');
  for (const side of [-1, 1]) {
    const horn = joint(head, 'giant-head-horn', side * .85, 1.05, .02);
    block(horn, 'head-horn-copper-shaft', 'copperLight', [0, .3, 0], [.17, .78, .24], 'head');
    block(horn, 'head-horn-pixel-tip', 'copper', [0, .78, 0], [.13, .23, .19], 'head');
    block(horn, 'head-horn-tip-cap', 'copper', [0, .94, 0], [.075, .12, .12], 'head');
  }
  const legs = [-1, 1].map(side => {
    const leg = joint(body, 'giant-leg', side * .67, 1.45, 0);
    block(leg, 'upper-leg', 'copper', [0, -.34, 0], [.78, .65, .88], 'leg');
    block(leg, 'upper-leg-pale-mint-cap', 'mint', [0, -.025, 0], [.75, .07, .85], 'leg');
    const knee = joint(leg, 'giant-knee-pivot', 0, -.72, 0);
    block(knee, 'knee-joint', 'dark', [0, 0, 0], [.62, .2, .7], 'leg');
    block(knee, 'lower-leg-piston', 'copperDark', [0, -.21, 0], [.57, .4, .63], 'leg');
    const ankle = joint(knee, 'giant-ankle-pivot', 0, -.31, 0);
    const foot = block(ankle, 'plated-foot', 'copperLight', [0, 0, .19], [.9, .52, 1.2], 'leg');
    block(ankle, 'mint-toe-band', 'mint', [0, -.01, .82], [.91, .1, .08], 'leg');
    const toe = joint(ankle, 'giant-toe-pivot', 0, -.16, .65);
    for (let i = 0; i < 4; i++) block(toe, 'square-toe', 'copperLight', [(i - 1.5) * .22, -.04, .18], [.17, .14, .15], 'leg');
    leg.userData.offset = side < 0 ? 0 : Math.PI;
    Object.assign(leg.userData, { knee, ankle, toe, foot, side, upperLength: .72, lowerLength: .52 });
    return leg;
  });
  const arms = [-1, 1].map(side => {
    const arm = joint(body, 'giant-arm', side * 1.73, 3.6, 0);
    block(arm, 'broad-shoulder', 'copper', [0, -.1, 0], [1.05, .85, 1.2], 'arm');
    block(arm, 'raised-shoulder-tower', 'copper', [side * .2, .85, -.03], [.7, 2.1, .94], 'arm');
    block(arm, 'mint-shoulder-cap', 'mint', [side * .2, 1.4, -.03], [.75, .99, .99], 'arm');
    block(arm, 'mint-tower-panel-seam', 'dark', [side * .2, 1.59, .49], [.72, .035, .03], 'arm');
    for (const x of [-.14, .12]) block(arm, 'mint-tower-weather-mark', 'dark', [side * .2 + x, 1.28, .49], [.045, .23, .03], 'arm');
    block(arm, 'elbow', 'dark', [0, -.68, 0], [.54, .3, .7], 'arm');
    block(arm, 'forearm-plate', 'copperLight', [0, -1.02, .1], [.8, .55, .87], 'arm');
    block(arm, 'forearm-pale-mint-cap', 'mint', [0, -.77, .1], [.78, .08, .84], 'arm');
    block(arm, 'enormous-gauntlet', 'copper', [0, -1.55, .2], [1.23, .82, 1.04], 'arm');
    block(arm, 'mint-gauntlet-band', 'mint', [0, -1.47, .75], [1.24, .1, .06], 'arm');
    for (let i = 0; i < 3; i++) {
      block(arm, 'copper-block-finger', 'copper', [(i - 1) * .34, -2.16, .29], [.25, .43, .4], 'arm');
      block(arm, 'mint-fingertip', 'mint', [(i - 1) * .34, -2.36, .29], [.26, .07, .41], 'arm');
    }
    block(arm, 'copper-thumb', 'copperLight', [-side * .71, -1.5, .29], [.22, .52, .43], 'arm');
    arm.userData.side = side;
    return arm;
  });
  return finish(root, 'copper-giant', body, { head, eye: watchingEye, core, legs, arms, limbs: [...legs, ...arms] });
}

function lakeTerror() {
  const root = new THREE.Group(), body = joint(root, 'terror-coiling-body');
  const segments = Array.from({ length: 24 }, (_, index) => {
    const width = index ? 1.435 - index * .0364 : 1.89;
    const part = joint(body, `terror-segment-${index}`, 0, .84 + width * .14, 2.65 - index * .31);
    block(part, index ? 'terror-body-segment' : 'terror-crushing-head', index % 2 ? 'pink' : 'lightPink', [0, 0, 0], [width, width * .78, index ? .43 : 1.19], index ? 'body' : 'head');
    block(part, 'terror-blue-plate', 'terrorBlue', [0, width * .4, -.14], [width * .85, .098, .224]);
    block(part, 'terror-dark-spine', 'darkPink', [0, width * .5, -.28], [.196, .42, .21]);
    part.userData.baseY = part.position.y;
    part.userData.baseZ = part.position.z;
    return part;
  });
  const head = segments[0], watchingEye = eye(head, 0, 0, 0, .7, 'terror');
  for (const side of [-1, 1]) {
    block(head, 'blue-crushing-jaw', 'terrorBlue', [side * .735, -.385, .714], [.245, .385, .84], 'head');
    block(head, 'terror-cream-fang', 'cream', [side * .623, -.406, 1.085], [.175, .42, .175], 'head');
  }
  return finish(root, 'lake-terror', body, { head, eye: watchingEye, core: watchingEye, segments, limbs: segments.slice(1) });
}

function frostTriram() {
  const root = new THREE.Group(), body = joint(root, 'triram-body');
  block(body, 'infected-pink-fur', 'pink', [0, 1.99, -.12], [2.12, 1.59, 2.65]);
  block(body, 'dark-side-armor', 'darkPink', [0, 2.1, -.18], [1.82, .69, 2.7]);
  for (let i = 0; i < 48; i++) {
    const surface = i % 4, along = ((i * 37) % 101) / 100, height = ((i * 61) % 103) / 102;
    const tuft = block(body, 'blocky-pink-fur-tuft', 'lightPink',
      [surface < 2 ? (surface ? -1 : 1) * 1.07 : (along - .5) * 2.12,
        surface === 2 ? 2.78 : 1.36 + height * 1.32,
        surface < 2 ? (along - .5) * 2.51 - .12 : surface === 3 ? -1.44 : (along - .5) * 2.51 - .12],
      [.157, .264, .188]);
    tuft.rotation.set(0, i * .61, .1);
  }
  for (let i = 0; i < 5; i++) {
    const crystal = block(body, 'dorsal-frost-crystal', 'ice', [0, 2.9 + (i % 2) * .126, -1.05 + i * .5], [.314, .6, .377]);
    crystal.rotation.z = Math.PI / 4;
  }
  const head = joint(body, 'triram-infected-head', 0, 2.16, 1.48);
  block(head, 'triram-pink-face', 'pink', [0, 0, 0], [1.57, 1.31, .91], 'head');
  const eyes = [-1, 1].map(side => eye(head, side * .408, 0, 0, .628, 'frost'));
  const hornPoints = [[.9,.85,-.35],[1.35,1.55,-.45],[1.85,2.25,-.7],[2.2,2.95,-1.15],
    [2.2,3.35,-1.8],[1.95,3.15,-2.35],[1.55,2.65,-2.5],[1.4,2.25,-2.15]].map(point => point.map(value => value * .628));
  for (const side of [-1, 1]) for (let i = 0; i < hornPoints.length - 1; i++) {
    segment(head, i < 6 ? 'massive-curled-horn' : 'curled-horn-tip', i < 2 ? 'ice' : 'metal',
      [hornPoints[i][0] * side, hornPoints[i][1], hornPoints[i][2]],
      [hornPoints[i + 1][0] * side, hornPoints[i + 1][1], hornPoints[i + 1][2]], (.62 - i * .065) * .628, 'head');
  }
  const legs = [];
  for (let row = 0; row < 3; row++) for (const side of [-1, 1]) {
    const leg = joint(body, 'triram-leg', side * .91, 1.47, -.96 + row * .91);
    block(leg, 'pink-upper-leg', 'pink', [side * .1, -.45, 0], [.44, .93, .45], 'leg');
    const knee = joint(leg, 'triram-knee-pivot', 0, -.86, 0);
    block(knee, 'ice-leg-plate', 'ice', [side * .12, -.13, 0], [.3, .35, .34], 'leg');
    const ankle = joint(knee, 'triram-hoof-pivot', 0, -.42, 0);
    const foot = block(ankle, 'square-metal-hoof', 'metal', [side * .15, 0, .08], [.46, .24, .58], 'leg');
    leg.userData.offset = (row + (side > 0 ? 1 : 0)) * Math.PI;
    Object.assign(leg.userData, { knee, ankle, foot, side, row, upperLength: .86, lowerLength: .48 });
    legs.push(leg);
  }
  return finish(root, 'frost-triram', body, { head, eye: eyes[0], eyes, limbs: legs, legs });
}

function skyEye() {
  const root = new THREE.Group(), body = joint(root, 'sky-eye-floating-body', 0, 4.05, 0);
  block(body, 'colossal-pink-eye-body', 'pink', [0, 0, 0], [3.276, 3.003, 1.729]);
  const watchingEye = eye(body, 0, 0, 0, .455, 'sky');
  const limbs = Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    const limb = joint(body, `sky-tentacle-${index}`, Math.cos(angle) * 1.12, -.59 + Math.sin(angle) * .35, -.65);
    limb.userData.offset = angle;
    limb.userData.links = [];
    for (let link = 0; link < 10; link++) {
      const x = Math.cos(angle) * (link * .08 + link * link * .018);
      const y = -link * .31;
      const z = Math.sin(angle) * link * .14 - link * .27;
      const width = .42 - link * .025;
      const part = block(limb, `sky-tentacle-link-${link}`, 'blue', [x, y, z], [width, .39, width], 'tentacle');
      part.rotation.z = Math.cos(angle) * .2;
      part.userData.restPosition = part.position.clone();
      limb.userData.links.push(part);
      if (link % 2 === 0) block(part, 'bright-cyan-tentacle-vein', 'cyan', [.1, 0, .52], [.23, 1, .1], 'tentacle');
    }
    return limb;
  });
  return finish(root, 'sky-eye', body, { eye: watchingEye, core: watchingEye, limbs });
}

function trilom(wraith) {
  const type = wraith ? 'trilom-wraith' : 'trilom-leader';
  const root = new THREE.Group(), body = joint(root, 'floating-trilom-robes', 0, wraith ? .22 : .12, 0);
  const cloth = wraith ? 'ghost' : 'cloth', folds = wraith ? 'ghostFold' : 'folds';
  const hem = block(body, 'wide-cloak-hem', cloth, [0, .45, 0], [1.425, .9, 1.035]);
  block(body, 'dark-robe-body', cloth, [0, 1.485, 0], [1.095, 1.65, .87]);
  const robeFolds = [-.465, 0, .465].map(x =>
    block(body, 'vertical-robe-fold', folds, [x, 1.035, .4875], [.18, 1.53, .12]));
  const core = block(body, 'purple-soul-core', wraith ? 'ghostEye' : 'purple', [0, 1.75, 0], [.2, .27, .07], 'core');
  const head = joint(body, 'crowned-trilom-head', 0, 2.7, 0);
  block(head, 'trilom-dark-hood', cloth, [0, 0, 0], [1.155, 1.125, 1.035], 'head');
  block(head, 'hidden-five-eyed-face', wraith ? 'ghostFace' : 'face', [0, -.03, .531], [.84, .795, .0375], 'head');
  block(head, 'gold-forehead-band', wraith ? 'ghostGold' : 'gold', [0, .45, .585], [1.2, .195, .15], 'head');
  for (const side of [-1, 1]) block(head, 'gold-face-guard', wraith ? 'ghostGold' : 'gold', [side * .495, .03, .585], [.15, .825, .15], 'head');
  const eyes = Array.from({ length: 5 }, (_, i) => {
    const x = i === 4 ? 0 : (i % 2 ? 1 : -1) * .195;
    const y = i === 4 ? .27 : .03 - Math.floor(i / 2) * .24;
    return block(head, `trilom-purple-eye-${i}`, wraith ? 'ghostEye' : 'purple', [x, y, .573], [.1425, .0975, .06], 'eye');
  });
  for (let i = 0; i < 5; i++) block(head, 'copper-crown-prong', wraith ? 'ghostCopper' : 'crownCopper', [(i - 2) * .24, .72 + (i % 2) * .09, 0], [.195, .555, .975], 'head');
  const arms = [-1, 1].map(side => {
    const arm = joint(body, 'trilom-robed-arm', side * .78, 1.95, 0);
    block(arm, 'flowing-cloak-sleeve', cloth, [0, -.435, .03], [.51, 1.005, .585], 'arm');
    block(arm, 'gold-cuff', wraith ? 'ghostGold' : 'gold', [0, -.915, .06], [.51, .15, .6], 'arm');
    arm.userData.side = side;
    return arm;
  });
  if (wraith) root.scale.setScalar(1.16);
  return finish(root, type, body, { head, eye: eyes[4], eyes, core, arms, limbs: arms, hem, robeFolds });
}

/** @param {string} type @returns {THREE.Group} */
export function createBoss(type) {
  switch (type) {
    case 'copper-giant': return copperGiant();
    case 'lake-terror': return lakeTerror();
    case 'frost-triram': return frostTriram();
    case 'sky-eye': return skyEye();
    case 'trilom-leader': return trilom(false);
    case 'trilom-wraith': return trilom(true);
    default: throw new TypeError(`Unknown Rain and Copper boss type: ${String(type)}`);
  }
}

const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const tangent = new THREE.Vector3();

/** A planted stance travels backwards with the body; the return step clears the floor. */
function footfall(phase, stride, movement, liftHeight) {
  const cycle = ((phase / TAU) % 1 + 1) % 1, stance = .62;
  const reach = stride * stance * .5;
  if (cycle < stance) return { z: (reach - cycle * stride) * movement, lift: 0,
    toe: Math.max(0, cycle / stance - .82) * 1.3 * movement };
  const swing = (cycle - stance) / (1 - stance);
  const eased = swing * swing * (3 - 2 * swing);
  const lift = Math.sin(swing * Math.PI);
  return { z: (-reach + eased * reach * 2) * movement, lift: lift * liftHeight * movement,
    toe: -lift * .13 * movement };
}

/** Two-bone IK keeps a foot level while its hip and knee visibly bend. */
function poseLeg(leg, z, ankleHeight, footPitch = 0) {
  if (leg.visible === false || leg.userData.severed) return;
  const { knee, ankle, upperLength: a, lowerLength: b } = leg.userData;
  const y = ankleHeight - leg.position.y - leg.parent.position.y;
  const reach = clamp(Math.hypot(y, z), Math.abs(a - b) + .005, a + b - .005);
  const kneeAngle = Math.PI - Math.acos(clamp((a * a + b * b - reach * reach) / (2 * a * b), -1, 1));
  const hipAngle = Math.atan2(-z, -y) - Math.acos(clamp((a * a + reach * reach - b * b) / (2 * a * reach), -1, 1));
  leg.rotation.x = hipAngle;
  knee.rotation.x = kneeAngle;
  ankle.position.y = -b;
  ankle.rotation.x = -(hipAngle + kneeAngle) + footPitch;
  if (leg.userData.toe) leg.userData.toe.rotation.x = footPitch * .7;
}

/**
 * Pose local living joints only. Speed is metres/second and distance is total metres
 * travelled; supplying distance makes the walking phase independent of wall-clock time.
 * @param {THREE.Group} model
 * @param {number} time
 * @param {number} speed
 * @param {string} phase
 * @param {{distance?:number,legsLost?:number,severedParts?:string[],attackName?:string}} motion
 */
export function animateBoss(model, time, speed = 0, phase = 'chase', motion = {}) {
  time = clamp(finite(time), -1e9, 1e9);
  speed = clamp(Math.abs(finite(speed)), 0, 50);
  const data = model.userData, movement = clamp(speed / 1.2, 0, 1);
  const distance = finite(motion.distance, time * speed);
  const strideLength = data.type === 'copper-giant' ? 1.8 : data.type === 'frost-triram' ? 1.6 : 3.6;
  const gait = (distance % strideLength) / strideLength * TAU;
  const cutLimbs = Array.isArray(motion.severedParts) ? motion.severedParts.filter(name => /leg|foot|hoof|tentacle/i.test(name)).length : 0;
  const damage = clamp(finite(motion.legsLost, cutLimbs) / Math.max(1, data.legs?.length ?? data.limbs.length), 0, 1);
  const body = data.body;
  const bodyDrop = clamp(finite(motion.bodyDrop), 0, GROUND_SUPPORT_PROFILES[data.type]?.maxDrop ?? 0);
  if (data.type === 'copper-giant') {
    body.position.y = data.baseBodyY + (-.15 + Math.abs(Math.sin(gait * 2)) * (.04 + damage * .05)) * movement - bodyDrop;
    body.rotation.x = phase === 'windup' ? -.025 : Math.cos(gait * 2) * .018 * movement;
    body.rotation.z = Math.sin(gait) * .015 * movement + damage * .025;
    data.legs.forEach(leg => {
      const step = footfall(gait + leg.userData.offset, strideLength, movement * (1 - damage * .22), .34 + damage * .12);
      const heelLift = Math.max(0, Math.sin(step.toe)) * 1.05;
      const missing = motion.structureState?.[`support-leg-${leg.userData.supportIndex}`]?.remaining === 0;
      const tuck = missing ? bodyDrop * 1.15 : 0;
      poseLeg(leg, step.z + tuck, .42 - movement * .12 + step.lift + heelLift, step.toe);
    });
    data.arms.forEach((arm, index) => {
      if (arm.visible === false) return;
      arm.rotation.x = phase === 'windup' ? -1.15 : phase === 'strike' ? -.65
        : Math.sin(gait + index * Math.PI) * .3 * movement;
      arm.rotation.z = arm.userData.side * .05;
    });
  } else if (data.type === 'lake-terror') {
    const dive = motion.attackName === 'burrow' ? (phase === 'windup' ? .45 : phase === 'strike' ? .7 : 0) : 0;
    body.position.y = data.baseBodyY;
    body.rotation.z = Math.sin(gait) * .035 * movement;
    data.segments.forEach((part, index) => {
      if (part.visible === false) return;
      const wave = (movement > 0 ? gait : time * .55) - index * .36;
      const amplitude = .12 + movement * .88;
      part.position.x = Math.sin(wave) * (.04 + index * .035) * amplitude;
      part.position.y = part.userData.baseY + Math.sin(wave * .8) * (.025 + movement * .15) - dive * (1 - index / 32);
      part.position.z = part.userData.baseZ + Math.cos(wave) * .055 * movement;
      part.rotation.y = Math.cos(wave) * (.025 + movement * .24);
      part.rotation.x = Math.cos(wave * .8) * .08 * movement + dive * .22;
    });
  } else if (data.type === 'frost-triram') {
    const bracing = phase === 'windup', charging = phase === 'strike' && speed > 5;
    body.position.y = data.baseBodyY + (-.1 + Math.abs(Math.sin(gait * 2)) * (.05 + damage * .04)) * movement - (bracing ? .1 : 0) - bodyDrop;
    body.rotation.x = bracing ? .035 : charging ? .055 : Math.cos(gait * 2) * .012 * movement;
    body.rotation.z = Math.sin(gait) * .012 * movement + damage * .03;
    data.legs.forEach(leg => {
      const step = footfall(gait + leg.userData.offset, strideLength, movement * (1 - damage * .25), charging ? .37 : .27);
      const brace = bracing ? (leg.userData.row - 1) * .1 : 0;
      const missing = motion.structureState?.[`support-leg-${leg.userData.supportIndex}`]?.remaining === 0;
      const tuck = missing ? bodyDrop / .9 * .95 : 0;
      poseLeg(leg, step.z + brace + tuck, .19 + (charging ? .04 : 0) + step.lift, step.toe * .5);
    });
    data.head.rotation.x = bracing ? .26 : charging ? .42 : .015 * Math.sin(gait) * movement;
  } else if (data.type === 'sky-eye') {
    body.position.y = data.baseBodyY + Math.sin(time * 1.8) * .13;
    body.rotation.x = -.035 * movement;
    body.rotation.z = Math.sin(time * .8) * .025;
    data.limbs.forEach(limb => {
      if (limb.visible === false) return;
      limb.rotation.z = Math.sin(time * 1.7 + limb.userData.offset) * .08;
      limb.rotation.x = (phase === 'windup' ? -.24 : 0) + Math.cos(time * 1.5 + limb.userData.offset) * .06;
      const links = limb.userData.links;
      links.forEach((link, index) => {
        const rest = link.userData.restPosition, bend = index / (links.length - 1);
        const wave = time * 1.8 + limb.userData.offset - index * .38 + gait * .18;
        link.position.set(rest.x + Math.sin(wave) * bend * (.1 + movement * .2),
          rest.y + Math.sin(wave * .8) * bend * .13,
          rest.z + Math.cos(wave) * bend * (.12 + movement * .18) + (phase === 'windup' ? bend * bend * .36 : 0));
      });
      links.forEach((link, index) => {
        const next = links[Math.min(index + 1, links.length - 1)];
        const previous = links[Math.max(index - 1, 0)];
        tangent.copy(index === links.length - 1 ? previous.position : link.position)
          .sub(index === links.length - 1 ? link.position : next.position).normalize();
        link.quaternion.setFromUnitVectors(up, tangent);
      });
    });
  } else {
    const spectral = data.type === 'trilom-wraith';
    body.position.y = data.baseBodyY + .05 + Math.sin(time * (spectral ? 1.55 : 2)) * (spectral ? .13 : .08);
    body.rotation.x = -.035 * movement;
    body.rotation.z = Math.sin(time * 1.1) * (spectral ? .035 : .018);
    data.head.rotation.z = Math.sin(time * 1.6) * .025;
    data.hem.rotation.x = Math.sin(time * 1.7) * .045 + movement * .06;
    data.robeFolds.forEach((fold, index) => { fold.rotation.x = Math.sin(time * 1.7 - index * .4) * .025 + movement * .035; });
    data.arms.forEach(arm => {
      if (arm.visible === false) return;
      arm.rotation.x = phase === 'windup' ? -1.2 : -.35 + Math.sin(time * 2.5 + arm.userData.side) * .17;
      arm.rotation.z = arm.userData.side * .12;
    });
  }
}
