import * as THREE from './assets/three.module.js';
import { createShieldRobotHead } from './copper-siege-enemies.js';
import { animateGolemMagic } from './golem-magic.js';
import { FORTRESS_LAYOUT, FORTRESS_CANNON_MOUNTS, FORTRESS_CREW_SEATS } from './fortress-layout.js';
export { FORTRESS_LAYOUT, FORTRESS_CANNON_MOUNTS, FORTRESS_CREW_SEATS, FORTRESS_HOVER_HEIGHT, FORTRESS_HATCH_HEIGHT } from './fortress-layout.js';

export const COPPER_FORTRESS_TYPE = 'copper-fortress';
export const COPPER_REPAIR_DRONE_TYPE = 'copper-repair-drone';
const cube = new THREE.BoxGeometry(1, 1, 1);
const palette = { copper: 0xbc7446, edge: 0xe6a46b, shadow: 0x78462f, patina: 0x397b74, dark: 0x172b2d, blue: 0x2fa5f2, cyan: 0x7ddaff };
const materials = Object.fromEntries(Object.entries(palette).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, roughness: .48, metalness: .72, flatShading: true }),
]));
materials.blue.emissive.set(0x1764c1); materials.blue.emissiveIntensity = .5;
materials.cyan.emissive.set(0x2fa5f2); materials.cyan.emissiveIntensity = .6;
const electricityMaterial = new THREE.LineBasicMaterial({ color: 0x50bdff, transparent: true, opacity: .88, toneMapped: false, depthWrite: false });
const up = new THREE.Vector3(0, 1, 0), delta = new THREE.Vector3(), zero = new THREE.Vector3();
const knee = new THREE.Vector3(), foot = new THREE.Vector3(), wrist = new THREE.Vector3();
const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const alive = (motion, id) => !motion.weaponState?.[id] || motion.weaponState[id].remaining > 0;

function joint(parent, name, x = 0, y = 0, z = 0) {
  const group = new THREE.Group(); group.name = name; group.position.set(x, y, z); parent.add(group); return group;
}
function box(parent, name, color, position, size, extra = {}) {
  const mesh = new THREE.Mesh(cube, materials[color]);
  mesh.name = name; mesh.position.set(...position); mesh.scale.set(...size);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, anatomicalPart: 'body', critical: false, cutHits: 4, ...extra };
  parent.add(mesh); return mesh;
}
function segment(mesh, from, to, width, depth = width) {
  delta.subVectors(to, from); mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.scale.set(width, delta.length(), depth); mesh.quaternion.setFromUnitVectors(up, delta.normalize());
}

function electricBolts(root) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9 * 4 * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  const lines = new THREE.LineSegments(geometry, electricityMaterial);
  lines.name = 'fortress-blue-hover-electricity'; lines.frustumCulled = false;
  root.add(lines);
  let disposed = false;
  root.userData.disposeVisuals = () => { if (!disposed) { disposed = true; geometry.dispose(); } };
  return lines;
}

/** A hollow armored room, not a solid collision-sized cube. All physical armor takes four hits. */
export function createCopperFortress() {
  const root = new THREE.Group(); root.name = COPPER_FORTRESS_TYPE;
  const body = joint(root, 'fortress-hollow-hull'), cutawayParts = [], panels = [];
  const floor = box(body, 'fortress-interior-floor', 'shadow', [0, FORTRESS_LAYOUT.floorY, 0], [FORTRESS_LAYOUT.width, .18, FORTRESS_LAYOUT.depth],
    { structuralId: 'fortress-floor', bossMain: true });
  const roof = box(body, 'fortress-removable-roof', 'copper', [0, FORTRESS_LAYOUT.wallTop - .08, 0], [FORTRESS_LAYOUT.width, .16, FORTRESS_LAYOUT.depth],
    { structuralId: 'fortress-roof', bossMain: true, fortressCutaway: true });
  cutawayParts.push(roof);
  for (const panel of FORTRESS_LAYOUT.panelAabbs) {
    const plate = box(body, `fortress-wall-${panel.id}`, 'copper', [panel.x, panel.y, panel.z], [panel.width, panel.height, panel.depth],
      { structuralId: panel.id, bossMain: true, fortressCutaway: panel.cutaway });
    panels.push(plate); if (panel.cutaway) cutawayParts.push(plate);
  }
  for (const side of [-1, 1]) {
    box(body, 'fortress-lower-copper-rim', 'edge', [side * 3.9, 1.48, 0], [.24, .27, FORTRESS_LAYOUT.depth], { structuralId: 'fortress-floor', bossMain: true });
    box(body, 'fortress-roof-copper-rim', 'edge', [side * 3.9, 5.9, 0], [.24, .24, FORTRESS_LAYOUT.depth],
      { structuralId: 'fortress-roof', bossMain: true, fortressCutaway: true });
    cutawayParts.push(body.children.at(-1));
    box(body, 'fortress-front-copper-rim', 'edge', [0, 1.48, side * 3.18], [FORTRESS_LAYOUT.width, .27, .24], { structuralId: 'fortress-floor', bossMain: true });
    box(body, 'fortress-roof-front-rim', 'edge', [0, 5.9, side * 3.18], [FORTRESS_LAYOUT.width, .24, .24],
      { structuralId: 'fortress-roof', bossMain: true, fortressCutaway: true });
    cutawayParts.push(body.children.at(-1));
  }
  const flaps = [], cannons = [];
  for (let index = 0; index < 4; index++) {
    const gate = FORTRESS_LAYOUT.gates[index], mount = FORTRESS_CANNON_MOUNTS[index];
    const base = joint(body, `fortress-flap-frame-${index}`, gate.x, 4.225, gate.z); base.rotation.y = gate.angle;
    const flap = joint(base, `fortress-opening-flap-${index}`);
    box(flap, 'fortress-flap-copper-plate', 'copper', [0, -.875, 0], [1.9, 1.75, FORTRESS_LAYOUT.wallThickness], { structuralId: gate.id });
    const gunMount = joint(body, `fortress-cannon-mount-${index}`, mount.x, mount.y, mount.z); gunMount.rotation.y = mount.angle;
    box(gunMount, 'fortress-cannon-bracket', 'shadow', [0, -.1, -.2], [1.14, .25, .95], { anatomicalPart: 'arm' });
    const gun = joint(gunMount, `fortress-extending-cannon-${index}`), weaponId = `fortress-cannon-${index}`;
    box(gun, 'fortress-cannon-breech', 'copper', [0, 0, -.25], [.83, .83, .7], { anatomicalPart: 'arm', weaponId });
    box(gun, 'fortress-cannon-barrel', 'edge', [0, 0, .46], [.43, .43, 1.24], { anatomicalPart: 'arm', weaponId });
    box(gun, 'fortress-cannon-muzzle', 'shadow', [0, 0, 1.12], [.66, .66, .16], { anatomicalPart: 'arm', weaponId });
    box(gun, 'fortress-cannon-blue-bore', 'blue', [0, 0, 1.215], [.27, .27, .035],
      { anatomicalPart: 'arm', weaponId, detailPriority: 15, surfaceDetail: true });
    flaps.push(flap); cannons.push(gun);
  }
  const hatch = joint(body, 'fortress-rear-entry-hatch', 0, 4.2, -3.06);
  box(hatch, 'fortress-rear-hatch-plate', 'shadow', [0, -1.305, 0], [2.2, 2.61, FORTRESS_LAYOUT.wallThickness], { structuralId: 'fortress-hatch', fortressCutaway: true });
  box(hatch, 'fortress-hatch-blue-handle', 'blue', [.7, -1.3, -.12], [.14, .48, .1], { structuralId: 'fortress-hatch' });
  cutawayParts.push(hatch.children[0]);
  hatch.rotation.x = Math.PI / 2;
  const ramp = FORTRESS_LAYOUT.ramp;
  for (let step = 0; step < 14; step++) box(body, 'fortress-rear-entry-step', step % 2 ? 'copper' : 'edge',
    [0, ramp.topY * (step + .5) / 14, ramp.minZ + (ramp.maxZ - ramp.minZ) * (step + .5) / 14], [ramp.width, .13, .24],
    { structuralId: ramp.id });

  const stations = [];
  for (const [index, seat] of FORTRESS_CREW_SEATS.entries()) {
    const station = joint(body, `fortress-crew-station-${index}`, seat.x, 0, seat.z); station.rotation.y = seat.angle;
    box(station, 'fortress-crew-chair-seat', 'shadow', [0, 2.2, 0], [.7, .14, .65]);
    box(station, 'fortress-crew-chair-back', 'copper', [0, 2.65, -.32], [.7, .85, .13]);
    for (const side of [-1, 1]) box(station, 'fortress-chair-support', 'patina', [side * .25, 1.9, 0], [.12, .5, .4]);
    box(station, 'fortress-control-console', 'shadow', [0, 2.18, .85], [.95, .9, .4]);
    const screen = box(station, 'fortress-blue-control-screen', 'blue', [0, 2.62, .69], [.75, .34, .07],
      { detailPriority: 10, surfaceDetail: true }); screen.rotation.x = -.3;
    for (const side of [-1, 1]) box(station, 'fortress-control-button', 'cyan', [side * .2, 2.39, .62], [.13, .1, .08],
      { detailPriority: 15, surfaceDetail: true });
    stations.push(station);
  }
  const reactor = joint(body, 'fortress-floating-blue-reactor', 0, 3.1, 0);
  const reactorCube = box(reactor, 'fortress-blue-reactor-cube', 'blue', [0, 0, 0], [.9, .9, .9],
    { structuralId: FORTRESS_LAYOUT.reactorId, detailPriority: 20 });
  for (const side of [-1, 1]) {
    box(reactor, 'fortress-reactor-cyan-edge', 'cyan', [side * .41, 0, .46], [.08, .88, .04],
      { structuralId: FORTRESS_LAYOUT.reactorId, detailPriority: 25 });
    box(reactor, 'fortress-reactor-cyan-edge', 'cyan', [0, side * .41, .46], [.88, .08, .04],
      { structuralId: FORTRESS_LAYOUT.reactorId, detailPriority: 25 });
  }
  const reactorLink = box(body, 'fortress-physical-reactor-magic-link', 'blue', [0, 2.12, 0], [.12, 1.1, .12],
    { anatomicalPart: 'arm', renderHidden: true });

  const catapultBase = joint(body, 'fortress-roof-head-catapult', 0, 5.98, -.25);
  for (const side of [-1, 1]) box(catapultBase, 'fortress-catapult-tower', 'copper', [side * .58, .44, 0], [.28, 1.05, .43], { anatomicalPart: 'arm' });
  box(catapultBase, 'fortress-catapult-blue-axle', 'blue', [0, .88, 0], [1.58, .23, .25], { anatomicalPart: 'arm' });
  const launcher = joint(catapultBase, 'fortress-catapult-throwing-arm', 0, .88, 0);
  box(launcher, 'fortress-catapult-beam', 'edge', [0, .15, 0], [.27, 1.96, .28], { anatomicalPart: 'arm' });
  box(launcher, 'fortress-catapult-counterweight', 'shadow', [0, -.79, 0], [.8, .46, .61], { anatomicalPart: 'arm' });
  const cup = joint(launcher, 'fortress-catapult-head-cup', 0, 1.1, 0), weaponId = 'fortress-catapult';
  box(cup, 'fortress-catapult-cup', 'shadow', [0, 0, 0], [.96, .18, .96], { anatomicalPart: 'arm', weaponId });
  for (const side of [-1, 1]) box(cup, 'fortress-catapult-cup-rim', 'copper', [side * .49, .13, 0], [.14, .35, 1], { anatomicalPart: 'arm', weaponId });
  const ammo = createShieldRobotHead({ weaponId, cutHits: 4 }); ammo.position.set(0, .55, .03); cup.add(ammo);
  launcher.rotation.x = -.9; ammo.rotation.x = .9;
  cutawayParts.push(...catapultBase.children.filter(part => part.isMesh));
  catapultBase.traverse(part => { if (part.isMesh) { part.userData.fortressCutaway = true; if (!cutawayParts.includes(part)) cutawayParts.push(part); } });
  root.userData = { type: COPPER_FORTRESS_TYPE, boss: true, voxelBudget: 96000, fortress: true, body, floor, roof, panels, flaps, cannons,
    hatch, reactor, reactorCube, reactorLink, stations, crewSeats: FORTRESS_CREW_SEATS,
    launcher, cup, ammo, catapultBase, cutawayParts, action: { phase: 'chase', last: null, since: 0, value: 0, from: 0 } };
  root.userData.electricity = electricBolts(root);
  animateCopperFortress(root, 0);
  return root;
}

/** Source parts remain sliceable while doors hinge and the four barrels extend independently. */
export function animateCopperFortress(root, time, speed = 0, phase = 'chase', motion = {}) {
  const d = root.userData, a = d.action, clock = Number.isFinite(time) ? time : 0;
  if (phase !== a.phase) { a.from = a.value; a.phase = phase; a.since = clock; }
  const target = phase === 'windup' ? 1 : phase === 'strike' ? -1 : 0;
  a.value = THREE.MathUtils.lerp(a.from, target, smooth((clock - a.since) / (phase === 'strike' ? .16 : .32)));
  for (let index = 0; index < 4; index++) {
    const open = smooth(motion.cannonOpen?.[index] ?? (phase === 'windup' || phase === 'strike' ? 1 : 0));
    d.flaps[index].rotation.x = -Math.PI / 2 * open;
    const recoil = clamp(motion.cannonFire?.[index] ?? (phase === 'strike' ? 1 : 0));
    if (alive(motion, `fortress-cannon-${index}`)) d.cannons[index].position.z = open * FORTRESS_LAYOUT.cannonExtension - recoil * .19;
  }
  d.hatch.rotation.x = Math.PI / 2 * smooth(motion.hatchOpen ?? 1);
  if (alive(motion, 'fortress-catapult')) d.launcher.rotation.x = -.9 - a.value * (a.value > 0 ? .3 : 2.05);
  d.ammo.rotation.x = -d.launcher.rotation.x;
  d.reactor.position.y = 3.1 + Math.sin(clock * 1.8) * .055;
  const base = 1.59, top = d.reactor.position.y - .45;
  d.reactorLink.position.y = (base + top) / 2; d.reactorLink.scale.y = top - base + .04;
  const attribute = d.electricity.geometry.attributes.position;
  const anchors = [[-3.3, -2.65], [3.3, -2.65], [-3.3, 2.65], [3.3, 2.65], [-3.5, 0], [3.5, 0], [0, -2.8], [0, 2.8], [0, 0]];
  let vertex = 0;
  for (let bolt = 0; bolt < anchors.length; bolt++) {
    const [x, z] = anchors[bolt], reactorBeam = bolt === 8;
    for (let segment = 0; segment < 4; segment++) for (const endpoint of [segment, segment + 1]) {
      const t = endpoint / 4, jitter = endpoint === 0 || endpoint === 4 ? 0 : .1;
      attribute.setXYZ(vertex++, x + Math.sin(clock * 27 + endpoint * 3 + bolt) * jitter,
        reactorBeam ? base + (top - base) * t : .05 + 1.29 * t,
        z + Math.cos(clock * 31 + endpoint * 2 + bolt) * jitter);
    }
  }
  attribute.needsUpdate = true;
  a.last = clock;
}

export function createRepairDrone() {
  const root = new THREE.Group(); root.name = COPPER_REPAIR_DRONE_TYPE;
  const body = joint(root, 'repair-drone-body');
  const parts = [];
  const plate = (name, color, at, size, extra = {}) => { const part = box(body, name, color, at, size, { cutHits: 1, ...extra }); parts.push(part); return part; };
  plate('repair-drone-copper-body', 'copper', [0, .25, 0], [.63, .45, .62]);
  plate('repair-drone-roof', 'edge', [0, .5, 0], [.72, .12, .7]);
  const eye = plate('repair-drone-blue-eye', 'blue', [0, .3, .35], [.22, .18, .08],
    { anatomicalPart: 'core', critical: true, detailPriority: 25, surfaceDetail: true });
  const thrusters = [];
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    plate('repair-drone-copper-outrigger', 'shadow', [x * .36, .22, z * .36], [.55, .13, .17]).rotation.y = x === z ? -Math.PI / 4 : Math.PI / 4;
    plate('repair-drone-thruster-casing', 'copper', [x * .62, .2, z * .62], [.29, .36, .29]);
    const thruster = plate('repair-drone-blue-thrust', 'cyan', [x * .62, -.04, z * .62], [.19, .19, .19]); thrusters.push(thruster);
  }
  const tool = plate('repair-drone-welding-tool', 'edge', [0, .02, .53], [.18, .17, .5], { anatomicalPart: 'arm', weaponId: 'repair-tool' });
  plate('repair-drone-blue-welder-tip', 'cyan', [0, .02, .82], [.13, .12, .1], { anatomicalPart: 'arm', weaponId: 'repair-tool' });
  root.userData = { type: COPPER_REPAIR_DRONE_TYPE, repairDrone: true, body, eye, core: eye, thrusters, tool, parts, limbs: [] };
  return root;
}

export function animateRepairDrone(root, time, speed = 0, phase = 'chase', motion = {}) {
  const clock = Number.isFinite(time) ? time : 0, d = root.userData;
  d.body.position.y = Math.sin(clock * 3) * .045;
  d.body.rotation.set(motion.repairing ? -.12 : -.04, 0, Math.sin(clock * 2.5) * .025);
  for (let index = 0; index < d.thrusters.length; index++) d.thrusters[index].scale.y = .19 + Math.sin(clock * 19 + index) * .035;
}

/** Existing crew stays independently vulnerable; only its seated source joints are repositioned. */
export function poseFortressCrew(robot, time = 0, partState) {
  const d = robot?.userData;
  if (!d?.colosseumEnemy || d.legs?.length !== 2) throw new TypeError('Fortress crew must use an existing copper robot rig.');
  for (const leg of d.legs) {
    const data = leg.userData;
    leg.position.set(data.side * .225, .98, 0); leg.rotation.set(0, 0, 0);
    knee.set(0, -.32, .37); foot.set(0, -.78, .46);
    data.knee.position.copy(knee); data.foot.position.copy(foot);
    segment(data.upper, zero, knee, .25); segment(data.lower, knee, foot, .22); data.foot.rotation.set(0, 0, 0);
  }
  for (const arm of [d.leftArm, d.rightArm]) {
    const a = arm.userData, side = a.side;
    wrist.set(side * .6 - arm.position.x, 1.35 - arm.position.y, .52 - arm.position.z);
    knee.copy(wrist).multiplyScalar(.5); knee.x += side * .12; knee.y -= .12;
    a.elbow.position.copy(knee); a.wrist.position.copy(wrist);
    segment(a.upper, zero, knee, .26); segment(a.forearm, knee, wrist, .28);
    a.wrist.quaternion.setFromUnitVectors(up, delta.set(0, side > 0 ? -.55 : 1, side > 0 ? -.84 : 0).normalize());
  }
  animateGolemMagic(robot, time, partState);
}
