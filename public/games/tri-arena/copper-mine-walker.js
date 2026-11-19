import * as THREE from './assets/three.module.js';
import { addGolemJoint, animateGolemMagic } from './golem-magic.js';
import { MINE_WALKER_LAYOUT as LAYOUT, MINE_WALKER_CREW_SEATS,
  MINE_WALKER_GUN_MOUNTS, MINE_WALKER_DRILL_MOUNTS, mineWalkerGunMuzzle,
  mineWalkerLegPose, mineWalkerLadderSectionPose } from './mine-walker-layout.js';

export const COPPER_MINE_WALKER_TYPE = 'copper-mine-walker';
const cube = new THREE.BoxGeometry(1, 1, 1), up = new THREE.Vector3(0, 1, 0), forward = new THREE.Vector3(0, 0, 1);
const materials = Object.fromEntries(Object.entries({ copper: 0xd18a52, edge: 0xf0bd83, slate: 0x536a73,
  dark: 0x14242d, red: 0xff2418, blue: 0x2fa5f2, steel: 0xa3c3c9 }).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: .48, metalness: .65 })]));
materials.edge.emissive.set(0x60401d); materials.edge.emissiveIntensity = .1;
materials.blue.emissive.set(0x168cf1); materials.blue.emissiveIntensity = .9;
materials.red.emissive.set(0xff160b); materials.red.emissiveIntensity = 2;

function joint(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group(); group.name = name; group.position.set(...position); parent.add(group); return group;
}
function block(parent, name, color, position, size, extra = {}) {
  const mesh = new THREE.Mesh(cube, materials[color]); mesh.name = name;
  mesh.position.set(...position); mesh.scale.set(...size); mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, cutHits: 6, anatomicalPart: 'body', ...extra };
  parent.add(mesh); return mesh;
}
function vector(point) { return new THREE.Vector3(point.x, point.y, point.z); }
function shaft(mesh, from, to, width) {
  const direction = to.clone().sub(from);
  mesh.position.copy(from).add(to).multiplyScalar(.5); mesh.scale.set(width, direction.length(), width);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
}
function poseLeg(leg, clock, phase, motion) {
  const data = leg.userData, shape = mineWalkerLegPose(data.index, { ...motion, phase, time: clock });
  leg.position.copy(vector(shape.hip));
  const knee = vector(shape.knee).sub(leg.position), ankle = vector(shape.ankle).sub(leg.position);
  data.knee.position.copy(knee); data.ankle.position.copy(ankle);
  shaft(data.upper, new THREE.Vector3(), knee, .85); shaft(data.lower, knee, ankle, .78);
  data.drillMount.quaternion.setFromUnitVectors(up, vector(shape.axis));
  if (motion.weaponState?.[`walker-drill-${data.index}`]?.remaining !== 0) data.drill.rotation.y = clock * 9 + data.index * .4;
}
function poseLadder(ladder, bodyDrop) {
  for (const section of ladder.userData.sections) {
    const pose = mineWalkerLadderSectionPose(section.index, bodyDrop);
    for (const kind of ['rails', 'rungs']) for (let index = 0; index < section[kind].length; index++) {
      const mesh = section[kind][index], box = pose[kind][index];
      mesh.position.set(box.x, box.y, box.z); mesh.scale.set(box.width, box.height, box.depth);
    }
  }
  const landing = LAYOUT.ladder.landing;
  ladder.userData.landing.position.set(landing.x, landing.y - bodyDrop, landing.z);
}

/** The normal physical model contains no pretend occupants; five miners are separate game actors. */
export function createCopperMineWalker() {
  const root = new THREE.Group(); root.name = COPPER_MINE_WALKER_TYPE;
  const body = joint(root, 'walker-hollow-top-room'), panels = [], eyes = [];
  const floor = block(body, 'walker-room-floor', 'dark', [0, 10.08, 0], [8.04, .24, 6.6],
    { structuralId: LAYOUT.floorId, bossMain: true });
  const roof = block(body, 'walker-room-roof', 'slate', [0, 14.45, 0], [8.04, .1, 6.6],
    { structuralId: LAYOUT.roofId, bossMain: true }); panels.push(roof);
  const roofPart = (name, color, position, size) => {
    const mesh = block(body, name, color, position, size, { structuralId: LAYOUT.roofId, bossMain: true });
    panels.push(mesh); return mesh;
  };
  roofPart('walker-spider-copper-upper-deck', 'copper', [0, 14.56, 0], [8.04, .12, 6.6]);
  roofPart('walker-spider-raised-top-plate', 'edge', [0, 14.65, -.2], [5.2, .1, 3.9]);
  roofPart('walker-room-dark-ceiling', 'dark', [0, 14.39, 0], [7.44, .12, 6]);
  for (const side of [-1, 1]) for (const z of [-1.9, -.6, .7, 2]) {
    roofPart('walker-spider-slate-deck-vent', 'slate', [side * 2.9, 14.66, z], [.95, .08, .32]);
  }
  const frontParts = [], wall = (name, color, position, size, front = false) => {
    const mesh = block(body, name, color, position, size, { structuralId: `walker-${name.split('-')[1]}-wall`, bossMain: true });
    if (front) frontParts.push(mesh); return mesh;
  };
  for (const side of [-1, 1]) {
    const name = side < 0 ? 'left' : 'right';
    wall(`wall-${name}-slate-hull`, 'slate', [side * 3.87, 12.3, 0], [.3, 4.2, 6.6]);
    wall(`wall-${name}-side-copper-plate`, 'copper', [side * 3.98, 12.3, 0], [.08, 2.9, 5.8]);
    wall(`wall-${name}-dark-inner-liner`, 'dark', [side * 3.65, 12.3, 0], [.14, 4.2, 6]);
  }
  wall('wall-front-slate-hull', 'slate', [0, 12.3, 3.15], [8.04, 4.2, .3], true);
  wall('wall-front-copper-armor', 'copper', [0, 10.75, 3.26], [7.6, 1.1, .08], true);
  wall('wall-front-dark-inner-liner', 'dark', [0, 12.3, 2.94], [7.44, 4.2, .12], true);
  for (const side of [-1, 1]) {
    wall('wall-rear-slate-hull', 'slate', [side * 2.61, 12.3, -3.15], [2.82, 4.2, .3]);
    wall('wall-rear-copper-armor', 'copper', [side * 2.61, 11.8, -3.26], [2.5, 2.6, .08]);
    wall('wall-rear-dark-inner-liner', 'dark', [side * 2.46, 12.3, -2.94], [2.52, 4.2, .12]);
  }
  block(body, 'walker-rear-entry-header', 'edge', [0, 14, -3.15], [2.4, 1.4, .3],
    { structuralId: 'walker-rear-upper', bossMain: true });
  for (let index = 0; index < 6; index++) {
    const x = (index - 2.5) * 1.12;
    const frame = block(body, 'walker-eye-dark-recess', 'dark', [x, 13.97, 3.35], [.77, .65, .13],
      { anatomicalPart: 'head', structuralId: 'walker-front-wall' });
    const eye = block(body, `walker-blue-eye-${index}`, 'blue', [x, 13.97, 3.46], [.48, .4, .16],
      { anatomicalPart: 'eye', critical: true, detailPriority: 50 });
    frontParts.push(frame, eye); eyes.push(eye);
  }
  panels.push(...frontParts);
  for (const panel of panels) panel.userData.previewCutaway = true;
  const core = block(body, 'walker-hidden-room-control-core', 'blue', [0, 13.7, -3.08], [.17, .18, .12],
    { anatomicalPart: 'core', critical: true, detailPriority: 60 });
  const interiorLights = [-1, 1].map(side => {
    const metadata = { structuralId: side < 0 ? 'walker-left-wall' : 'walker-right-wall' };
    block(body, 'walker-red-lamp-housing', 'dark', [side * 3.51, 13.6, 0], [.22, .5, 1.4], metadata);
    return block(body, 'walker-red-interior-lamp', 'red', [side * 3.36, 13.6, 0], [.12, .26, 1.2],
      { ...metadata, detailPriority: 30 });
  });
  const stations = MINE_WALKER_CREW_SEATS.map((seat, index) => {
    const console = joint(body, `walker-miner-control-station-${index}`, [seat.x, LAYOUT.floorY, seat.z]);
    console.rotation.y = seat.angle;
    block(console, 'walker-computer-pedestal', 'slate', [0, .44, .66], [.78, .88, .4]);
    block(console, 'walker-computer-keyboard-base', 'copper', [0, .94, .61], [1.12, .12, .72]);
    const keyboard = [];
    for (const z of [.43, .62]) for (const x of [-.36, -.12, .12, .36]) {
      keyboard.push(block(console, 'walker-computer-keyboard-key', 'edge', [x, 1.035, z], [.15, .07, .11]));
    }
    block(console, 'walker-computer-monitor-stand', 'copper', [0, 1.25, .93], [.18, .54, .18]);
    const monitor = joint(console, 'walker-computer-monitor', [0, 1.78, .94]); monitor.rotation.x = .14;
    const frame = block(monitor, 'walker-computer-monitor-frame', 'dark', [0, 0, 0], [1.16, .9, .2]);
    const screen = block(monitor, 'walker-computer-screen', 'blue', [0, 0, -.13], [.94, .68, .08],
      { surfaceDetail: true, detailPriority: 20 });
    const pixels = [];
    for (const [x, y, width] of [[-.2, .2, .42], [-.1, .02, .6], [-.25, -.17, .3]]) {
      pixels.push(block(monitor, 'walker-computer-display-pixel', 'slate', [x, y, -.19], [width, .08, .07],
        { surfaceDetail: true, detailPriority: 30 }));
    }
    console.userData.computer = { monitor, frame, screen, pixels, keyboard };
    return console;
  });
  const ladder = joint(root, 'walker-vertical-copper-ladder');
  const sections = LAYOUT.ladder.sections.map((section, index) => {
    const makeParts = kind => section[kind].map((box, partIndex) => block(ladder,
      `walker-ladder-${kind}-${index}-${partIndex}`, kind === 'rails' ? 'copper' : 'edge',
      [box.x, box.y, box.z], [box.width, box.height, box.depth], { structuralId: section.id }));
    return { index, rails: makeParts('rails'), rungs: makeParts('rungs') };
  });
  const landing = LAYOUT.ladder.landing;
  ladder.userData = { sections, landing: block(ladder, landing.id, 'copper', [landing.x, landing.y, landing.z],
    [landing.width, landing.height, landing.depth], { structuralId: landing.id }) };
  const legs = MINE_WALKER_DRILL_MOUNTS.map((shape, index) => {
    const leg = joint(root, `walker-radial-spider-leg-${index}`);
    const metadata = { anatomicalPart: 'arm', balanceId: `walker-leg-${index}` };
    const upper = block(leg, 'walker-spider-leg-upper-copper', 'copper', [0, 0, 0], [1, 1, 1], metadata);
    const lower = block(leg, 'walker-spider-leg-lower-bright', 'edge', [0, 0, 0], [1, 1, 1], metadata);
    const knee = joint(leg, 'walker-spider-articulated-knee');
    block(knee, 'walker-spider-copper-knee-cap', 'edge', [0, 0, 0], [1.1, .95, 1.1], metadata);
    const ankle = joint(leg, 'walker-spider-drill-wrist'), drillMount = joint(ankle, 'walker-spider-drill-axis');
    const drill = joint(drillMount, `walker-terminal-spider-drill-${index}`), stages = [];
    for (let stage = 0; stage < 4; stage++) {
      const width = [1.86, 1.41, .96, .51][stage];
      const plate = block(drill, `walker-drill-${index}-stepped-cutter-${stage}`, stage % 2 ? 'steel' : 'edge',
        [0, .345 + stage * .615, 0], [width, .69, width],
        { ...metadata, anatomicalPart: stage === 0 ? 'leg' : 'arm', weaponId: `walker-drill-${index}`, structuralId: `walker-leg-${index}` });
      plate.rotation.y = stage * .42; stages.push(plate);
    }
    const tip = block(drill, `walker-drill-${index}-tip`, 'steel', [0, 2.7, 0], [.3, .45, .3],
      { ...metadata, weaponId: `walker-drill-${index}`, structuralId: `walker-leg-${index}` });
    leg.userData = { index, shape, upper, lower, knee, ankle, drillMount, drill, tip, stages };
    poseLeg(leg, 0, 'chase', {}); return leg;
  });
  const liftVents = [];
  for (const x of [-2.8, 2.8]) for (const z of [-1.8, 1.8]) {
    block(body, 'walker-spider-dark-thruster-housing', 'dark', [x, 9.88, z], [1.12, .35, 1.12]);
    const vent = block(body, 'walker-chassis-blue-hover-vent', 'blue', [x, 9.64, z], [.84, .18, .84]);
    vent.userData.liftAnchor = joint(body, 'walker-underbody-lift-jet', [x, 9.88, z]);
    liftVents.push(vent);
  }
  const guns = MINE_WALKER_GUN_MOUNTS.map((mount, index) => {
    block(body, 'walker-gun-ceiling-hanger', 'slate', [mount.x, 9.68, mount.z], [.25, .85, .3], { anatomicalPart: 'arm' });
    const gun = joint(body, `walker-underside-machine-gun-${index}`, [mount.x, mount.y, mount.z]);
    const metadata = { anatomicalPart: 'arm', weaponId: `walker-machine-gun-${index}` };
    block(gun, 'walker-machine-gun-copper-case', 'copper', [0, 0, 0], [.56, .48, .7], metadata);
    const barrel = block(gun, 'walker-machine-gun-barrel', 'slate', [0, 0, .7], [.2, .22, .9], metadata);
    block(gun, 'walker-machine-gun-muzzle-collar', 'edge', [0, 0, 1.08], [.29, .29, .14], metadata);
    const muzzle = joint(gun, 'walker-machine-gun-muzzle', [0, 0, mount.muzzleLength]);
    gun.userData = { index, barrel, muzzle, mount }; return gun;
  });
  root.userData = { type: COPPER_MINE_WALKER_TYPE, mineWalker: true, boss: true, cutHits: 6, voxelBudget: 192000,
    body, floor, roof, eyes, eye: eyes[0], core, legs, drilllegs: legs, arms: [], guns, drills: legs.map(leg => leg.userData.drill),
    limbs: legs, liftVents, ladder, stations, interiorLights, crewSeats: MINE_WALKER_CREW_SEATS, previewCutawayParts: panels,
    structuralFatalExempt: true, baseBodyY: 0 };
  animateCopperMineWalker(root, 0);
  for (const leg of legs) {
    const data = leg.userData;
    addGolemJoint(root, leg, [floor, data.upper], { size: [.95, .6, .95] });
    addGolemJoint(root, data.knee, [data.upper, data.lower], { size: [.95, .65, .95], phase: data.index * .7 });
    addGolemJoint(root, data.ankle, [data.lower, data.stages[0]], { size: [.84, .6, .84] });
  }
  for (const vent of liftVents) addGolemJoint(root, vent.userData.liftAnchor, [floor, vent],
    { size: [.7, 1.2, .7], offset: [0, -.75, 0] });
  return root;
}

export function animateCopperMineWalker(root, time, speed = 0, phase = 'chase', motion = {}) {
  const clock = Number.isFinite(time) ? time : 0, data = root.userData;
  const drop = Number.isFinite(motion.bodyDrop) ? Math.max(0, Math.min(8.8, motion.bodyDrop)) : 0;
  const elevation = root.getWorldPosition(new THREE.Vector3()).y;
  data.body.position.y = -drop; data.ladder.position.y = -elevation; poseLadder(data.ladder, drop); root.updateWorldMatrix(true, false);
  for (const leg of data.drilllegs) poseLeg(leg, clock, phase, { ...motion, bodyDrop: drop });
  const position = root.getWorldPosition(new THREE.Vector3());
  const angle = new THREE.Euler().setFromQuaternion(root.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
  const gunOwner = { x: position.x, z: position.z, elevation: position.y, angle, bodyDrop: drop,
    targetX: motion.targetX, targetY: motion.targetY, targetZ: motion.targetZ };
  for (const gun of data.guns) {
    const { index, mount, barrel } = gun.userData;
    const aim = root.worldToLocal(vector(mineWalkerGunMuzzle(gunOwner, index)));
    aim.sub(new THREE.Vector3(mount.x, mount.y - drop, mount.z)); gun.quaternion.setFromUnitVectors(forward, aim.normalize());
    barrel.position.z = .7 - (motion.firingGuns?.[index] ? Math.sin(clock * 35) * .04 : 0);
  }
  animateGolemMagic(root, clock, motion.partState);
}
