import * as THREE from './assets/three.module.js';

export const OCTO_NOSE_TYPE = 'octo-nose';
const cube = new THREE.BoxGeometry(1, 1, 1);
// Latest Axolotl Major octo-model.js palette, reproduced locally without a source-game dependency.
const colors = { robe: 0x55536c, cloth: 0x92909d, shadow: 0x11131d, leather: 0x453a32, metal: 0xb78a51,
  stitch: 0xb7a58e, lamp: 0xffd39a };
const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, roughness: name === 'metal' ? .36 : name === 'leather' ? .83 : name === 'robe' ? .96 : name === 'shadow' ? .95 : 1,
    metalness: name === 'metal' ? .75 : 0, flatShading: true }),
]));
materials.lamp.emissive.set(0xffaf49); materials.lamp.emissiveIntensity = 2;
const zAxis = new THREE.Vector3(0, 0, 1), xAxis = new THREE.Vector3(1, 0, 0);
const swing = new THREE.Quaternion(), inverseArm = new THREE.Quaternion(), targetTool = new THREE.Quaternion();
const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

function joint(parent, name, x = 0, y = 0, z = 0) {
  const group = new THREE.Group(); group.name = name; group.position.set(x, y, z); parent.add(group); return group;
}
function block(parent, name, color, position, size, anatomy = 'body', extra = {}) {
  const mesh = new THREE.Mesh(cube, materials[color]);
  mesh.name = name; mesh.position.set(...position); mesh.scale.set(...size);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, anatomicalPart: anatomy, cutHits: 10, ...extra };
  parent.add(mesh); return mesh;
}

/** Box courses approximate the original round cloth without changing its proportions. */
function roundCourse(parent, name, radius, y, height, anatomy = 'body', color = 'robe', zScale = 1, fold = 0) {
  for (let slice = 0; slice < 7; slice++) {
    const z = ((slice + .5) / 7 * 2 - 1) * radius;
    let halfWidth = Math.sqrt(Math.max(.001, radius * radius - z * z));
    if (fold) halfWidth *= 1 + fold * Math.sin(Math.atan2(z, halfWidth) * 14);
    block(parent, name, color, [0, y, z * zScale], [halfWidth * 2, height, (radius * 2 / 7 + .012) * zScale], anatomy);
  }
}
function oval(parent, name, color, center, radii, anatomy, rows = 9, extra = {}) {
  const [cx, cy, cz] = center, [rx, ry, rz] = radii;
  for (let row = 0; row < rows; row++) {
    const ny = (row + .5) / rows * 2 - 1, radius = Math.sqrt(1 - ny * ny);
    for (let slice = 0; slice < 5; slice++) {
      const nz = ((slice + .5) / 5 * 2 - 1) * radius;
      const width = 2 * rx * Math.sqrt(Math.max(.001, 1 - ny * ny - nz * nz));
      block(parent, name, color, [cx, cy + ny * ry, cz + nz * rz], [width, ry * 2 / rows + .006, radius * rz * 2 / 5 + .008], anatomy, extra);
    }
  }
}

/** Faithful voxel adaptation of the robed, scarf-covered companion from Axolotl Major. */
export function createOctoNose() {
  const root = new THREE.Group(); root.name = OCTO_NOSE_TYPE;
  const body = joint(root, 'octo-companion-body'), robe = joint(body, 'octo-tapered-folded-robe');
  for (let course = 0; course < 12; course++) {
    const t = (course + .5) / 12, y = .325 + t * 1.75;
    const cinched = y > 1.36 && y < 1.62;
    roundCourse(robe, 'octo-indigo-robe-course', cinched ? .47 : .72 - t * .28, y, .15, 'body', 'robe', cinched ? .74 : 1, .07 - t * .045);
  }
  oval(body, 'octo-cloth-shoulders', 'robe', [0, 1.98, 0], [.49, .58, .3], 'body');
  const cape = joint(body, 'octo-shoulder-cape');
  for (let row = 0; row < 5; row++) {
    const t = (row + .5) / 5;
    roundCourse(cape, 'octo-cape-fold', .67 - .4 * t, 1.805 + .55 * t, .116, 'body', 'robe', 1, .07 - t * .045);
  }
  for (let stitch = 0; stitch < 40; stitch++) {
    const angle = stitch / 40 * Math.PI * 2;
    block(robe, 'octo-stitched-hem', 'stitch', [Math.cos(angle) * .71, .34, Math.sin(angle) * .71], [.035, .025, .035], 'body',
      { detailPriority: 6, surfaceDetail: true });
  }
  const belt = joint(body, 'octo-leather-waist-belt');
  roundCourse(belt, 'octo-leather-belt-course', .5, 1.47, .16, 'body', 'leather', .76);
  block(belt, 'octo-brass-buckle', 'metal', [0, 1.48, .39], [.23, .19, .08], 'body', { detailPriority: 12, surfaceDetail: true });
  block(belt, 'octo-buckle-leather-center', 'leather', [0, 1.48, .41], [.13, .1, .09], 'body', { detailPriority: 16, surfaceDetail: true });
  const pouches = [];
  for (const side of [-1, 1]) {
    const pouch = joint(body, 'octo-twin-leather-pouch', side * .43, 1.25, .28);
    block(pouch, 'octo-pouch-body', 'leather', [0, 0, 0], [.3, .38, .2]);
    block(pouch, 'octo-pouch-flap', 'leather', [0, .18, .01], [.32, .09, .23]);
    block(pouch, 'octo-pouch-brass-stud', 'metal', [0, .11, .127], [.07, .07, .04], 'body', { detailPriority: 12, surfaceDetail: true });
    pouches.push(pouch);
  }
  const backpack = block(body, 'octo-leather-backpack', 'leather', [0, 1.72, -.39], [.63, .77, .25]);
  for (const side of [-1, 1]) block(body, 'octo-backpack-brass-strap', 'metal', [side * .23, 1.72, -.53], [.07, .75, .035], 'body',
    { detailPriority: 10, surfaceDetail: true });
  const bedroll = joint(body, 'octo-scarf-cloth-bedroll', 0, 2.19, -.4); bedroll.rotation.z = Math.PI / 2;
  for (let row = 0; row < 4; row++) roundCourse(bedroll, 'octo-bedroll-course', .16, -.425 + (row + .5) * .85 / 4, .22, 'body', 'cloth');
  const head = joint(body, 'octo-round-hood');
  oval(head, 'octo-indigo-hood-course', 'robe', [0, 2.57, 0], [.53, .62, .48], 'head');
  oval(head, 'octo-featureless-shadow-face', 'shadow', [0, 2.58, .405], [.37, .44, .115], 'head', 7, { detailPriority: 5 });
  for (let step = 0; step < 24; step++) {
    const angle = step / 24 * Math.PI * 2;
    const rim = block(head, 'octo-deep-hood-rim', 'robe', [Math.cos(angle) * .4042, 2.58 + Math.sin(angle) * .5031, .42], [.13, .13, .13], 'head',
      { detailPriority: 8, surfaceDetail: true }); rim.rotation.z = angle;
  }
  const scarf = joint(head, 'octo-layered-wrapped-scarf');
  for (let wrap = 0; wrap < 4; wrap++) {
    const radius = .33 + wrap * .012, band = joint(scarf, 'octo-scarf-wrap', 0, 2.3 + wrap * .045, .16);
    for (let part = 0; part < 16; part++) {
      const angle = part / 16 * Math.PI * 2;
      block(band, 'octo-scarf-wrap-stitch', 'cloth', [Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 1.14], [.145, .146, .15], 'head',
        { detailPriority: 10, surfaceDetail: true });
    }
  }
  oval(scarf, 'octo-face-covering-scarf', 'cloth', [0, 2.41, .49], [.37, .21, .075], 'head', 5,
    { detailPriority: 15, surfaceDetail: true });
  const scarfTail = block(scarf, 'octo-hanging-scarf-tail', 'cloth', [.27, 2.02, .38], [.2, .67, .045], 'head', { detailPriority: 10, surfaceDetail: true });
  scarfTail.rotation.z = -.15;
  // A concealed critical region makes the covered head vulnerable without inventing visible eyes or a reactor.
  const core = block(head, 'octo-concealed-head-vital', 'shadow', [0, 2.69, -.03], [.15, .15, .15], 'core',
    { critical: true, renderHidden: true, detailPriority: 95 });
  const arms = [-1, 1].map((side, index) => {
    const arm = joint(body, `octo-sleeve-${index}`, side * .5, 2.02, 0); arm.rotation.z = side * .13;
    for (let course = 0; course < 4; course++) {
      const t = (course + .5) / 4;
      roundCourse(arm, 'octo-indigo-sleeve-course', .25 - t * .06, -.685 + t * .75, .195, 'arm', 'robe', 1, .05);
    }
    const forearm = joint(arm, 'octo-articulated-forearm', 0, -.65, 0);
    roundCourse(forearm, 'octo-leather-wrist-cuff', .18, -.03, .2, 'arm', 'leather');
    const hand = joint(forearm, 'octo-articulated-hand', 0, -.2, .02);
    const handMeta = { structuralId: `octo-hand-${index}`, detailPriority: 7, surfaceDetail: true };
    oval(hand, 'octo-dark-palm', 'shadow', [0, 0, 0], [.13, .18, .11], 'arm', 5, handMeta);
    for (let finger = 0; finger < 4; finger++) oval(hand, 'octo-dark-finger', 'shadow', [(finger - 1.5) * .047, -.15, .035], [.026, .09, .035], 'arm', 3, handMeta);
    oval(hand, 'octo-dark-thumb', 'shadow', [-side * .12, -.02, .06], [.045, .1, .04], 'arm', 3, handMeta);
    arm.userData = { side, forearm, hand }; return arm;
  });
  const legs = [-1, 1].map(side => {
    const leg = joint(body, 'octo-booted-leg', side * .22, .95, 0);
    roundCourse(leg, 'octo-dark-trouser-leg', .14, -.25, .75, 'arm', 'shadow');
    const boot = block(leg, 'octo-leather-boot', 'leather', [0, -.73, .08], [.31, .36, .48], 'leg');
    block(leg, 'octo-dark-boot-sole', 'shadow', [0, -.9, .08], [.33, .07, .5], 'arm');
    block(leg, 'octo-brass-boot-strap', 'metal', [0, -.61, .07], [.32, .05, .3], 'arm', { detailPriority: 10, surfaceDetail: true });
    leg.userData = { side, boot }; return leg;
  });
  const tool = joint(arms[1].userData.forearm, 'octo-builder-hammer', 0, -.3, .16);
  block(tool, 'octo-hammer-handle', 'leather', [0, 0, 0], [.055, .55, .055], 'arm', { weaponId: 'octo-hammer' });
  block(tool, 'octo-hammer-head', 'metal', [0, .25, 0], [.3, .12, .13], 'arm', { weaponId: 'octo-hammer' });
  const lantern = joint(body, 'octo-warm-brass-lantern', -.66, 1.13, .15);
  for (const y of [-.18, .18]) block(lantern, 'octo-lantern-cap', 'metal', [0, y, 0], [.24, .06, .24]);
  for (const x of [-.1, .1]) for (const z of [-.1, .1]) block(lantern, 'octo-lantern-frame', 'metal', [x, 0, z], [.025, .34, .025], 'body',
    { detailPriority: 8, surfaceDetail: true });
  oval(lantern, 'octo-lantern-flame', 'lamp', [0, 0, 0], [.07, .13, .07], 'body', 5,
    { structuralId: 'octo-lantern-flame', detailPriority: 12 });
  const lanternLight = new THREE.PointLight(0xffd09b, 1.2, 4, 2); lantern.add(lanternLight);
  root.userData = { type: OCTO_NOSE_TYPE, displayName: 'Octo Nose', octoNose: true, body, robe, head, scarf, core,
    cape, belt, pouches, backpack, bedroll, scarfTail, legs, lantern, lanternLight,
    arms, leftArm: arms[0], rightArm: arms[1], limbs: [...arms, ...legs], tool,
    hammerPose: { key: 'idle', since: 0, arm: 0, forearm: 0, tool: 0, fromArm: 0, fromForearm: 0, fromTool: 0 } };
  return root;
}

/** Original idle, walking and helping rhythms; the caller owns position, heading and the simulation clock. */
export function animateOctoNose(root, time, speed = 0, phase = 'chase', motion = {}) {
  const d = root.userData, clock = Number.isFinite(time) ? time : 0;
  const moving = Number.isFinite(speed) && Math.abs(speed) > .03;
  d.body.position.y = moving ? Math.abs(Math.sin(clock * 7)) * .035 : Math.sin(clock * 1.6) * .012;
  d.legs.forEach((leg, index) => { leg.rotation.x = moving ? Math.sin(clock * 7 + index * Math.PI) * .36 : 0; });
  d.scarfTail.rotation.x = Math.sin(clock * 2) * .025;
  d.lantern.rotation.z = moving ? Math.sin(clock * 7) * .07 : 0;
  d.lanternLight.visible = motion.structureState?.['octo-lantern-flame']?.remaining !== 0;
  const rightHand = motion.structureState?.['octo-hand-1'], hammer = motion.weaponState?.['octo-hammer'];
  const toolAlive = !hammer || hammer.remaining > 0, held = toolAlive && (!rightHand || rightHand.remaining > 0);
  const fighting = held && motion.attackName === 'hammer' && ['windup', 'strike', 'recover'].includes(phase);
  const key = fighting ? phase : motion.octoHelping && held ? 'help' : 'idle', pose = d.hammerPose;
  if (pose.key !== key) {
    pose.fromArm = pose.arm; pose.fromForearm = pose.forearm; pose.fromTool = pose.tool; pose.since = clock; pose.key = key;
  }
  const amount = smooth((clock - pose.since) / (key === 'strike' ? .12 : key === 'windup' ? .28 : .22));
  const armTarget = key === 'windup' ? -2.55 : key === 'strike' ? -1.1 : key === 'help' ? -.7 + Math.sin(clock * 9) * .4 : moving ? Math.sin(clock * 7 + 1) * .2 : 0;
  const toolTarget = key === 'windup' ? -.25 : key === 'strike' ? 1.3 : 0;
  pose.arm = THREE.MathUtils.lerp(pose.fromArm, armTarget, amount);
  pose.forearm = THREE.MathUtils.lerp(pose.fromForearm, key === 'help' ? -.35 : 0, amount);
  pose.tool = THREE.MathUtils.lerp(pose.fromTool, toolTarget, amount);
  d.rightArm.rotation.x = pose.arm;
  d.rightArm.userData.forearm.rotation.x = pose.forearm;
  d.leftArm.rotation.x = held && fighting ? pose.arm * .08 : moving ? Math.sin(clock * 7 - 1) * .2 : 0;
  d.leftArm.userData.forearm.rotation.x = key === 'help' ? -.35 : 0;
  d.tool.visible = toolAlive;
  if (fighting) {
    inverseArm.copy(d.rightArm.quaternion).multiply(d.rightArm.userData.forearm.quaternion).invert();
    targetTool.copy(inverseArm).multiply(swing.setFromAxisAngle(xAxis, pose.tool));
    d.tool.quaternion.copy(targetTool);
  } else d.tool.quaternion.identity();
}
