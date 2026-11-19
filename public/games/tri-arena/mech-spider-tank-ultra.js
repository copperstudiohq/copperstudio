import * as THREE from './assets/three.module.js';
import { createUltraRoofLaunchers, animateUltraRoofLaunchers } from './mech-ultra-roof-model.js';
import { MECH_SPIDER_TANK_ULTRA_TYPE, ULTRA_LAYOUT as LAYOUT, ULTRA_ROOMS, ULTRA_FLOORS,
  ULTRA_WALLS, ULTRA_WINDOWS, ULTRA_STAIRS, ULTRA_CREW_SEATS, ULTRA_GUN_MOUNTS,
  ULTRA_REACTORS, ULTRA_FABRICATORS, ultraArmPose, ultraGunMuzzle } from './mech-ultra-layout.js';

export { MECH_SPIDER_TANK_ULTRA_TYPE };
const cube = new THREE.BoxGeometry(1, 1, 1), up = new THREE.Vector3(0, 1, 0), forward = new THREE.Vector3(0, 0, 1);
const materials = Object.fromEntries(Object.entries({ copper: 0xb77646, edge: 0xe8b273, slate: 0x455460,
  dark: 0x142129, steel: 0xacc3ca, scorch: 0x3a2c28, red: 0xff2b13, reactor: 0xff7020,
  screen: 0x4bd5df, controlDark: 0x08100f, controlScreen: 0x456d62, dimRed: 0x4d1714, glass: 0x88b9bd }).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, roughness: .64, metalness: .66, flatShading: true })]));
for (const color of ['red', 'reactor', 'screen']) {
  materials[color].emissive.copy(materials[color].color); materials[color].emissiveIntensity = color === 'red' ? 2.8 : 1.2;
}
materials.controlScreen.emissive.copy(materials.controlScreen.color); materials.controlScreen.emissiveIntensity = .18;
materials.dimRed.emissive.copy(materials.dimRed.color); materials.dimRed.emissiveIntensity = .12;
Object.assign(materials.glass, { transparent: true, opacity: .17, depthWrite: false, roughness: .08, metalness: .05 });

function group(parent, name, position = [0, 0, 0]) {
  const value = new THREE.Group(); value.name = name; value.position.set(...position); parent.add(value); return value;
}
function block(parent, name, color, position, size, metadata = {}) {
  const mesh = new THREE.Mesh(cube, materials[color]); mesh.name = name; mesh.position.set(...position); mesh.scale.set(...size);
  mesh.castShadow = color !== 'glass'; mesh.receiveShadow = color !== 'glass';
  mesh.userData = { severable: true, cutHits: 6, anatomicalPart: 'body', structuralId: `ultra-${name}`, ...metadata };
  parent.add(mesh); return mesh;
}
function link(parent, name, from, to, width, color, metadata = {}) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), delta = b.clone().sub(a);
  const mesh = block(parent, name, color, a.clone().add(b).multiplyScalar(.5).toArray(), [width, delta.length(), width], metadata);
  mesh.quaternion.setFromUnitVectors(up, delta.normalize()); return mesh;
}
const metadata = box => ({ structuralId: box.structuralId || box.id, bossMain: box.frame === 'body' });

function createMachineGun(parent, mount) {
  const gun = group(parent, mount.id, [mount.x, mount.y, mount.z]); gun.rotation.y = mount.angle;
  const data = { weaponId: mount.id, structuralId: mount.id, anatomicalPart: 'weapon', detailPriority: 30 };
  block(gun, `${mount.id}-armored-mount`, 'copper', [0, 0, 0], [1.5, 1.35, 1.6], data);
  block(gun, `${mount.id}-ammo-box`, 'dark', [-.9, -.2, -.1], [.6, 1, 1.6], data);
  const barrel = block(gun, `${mount.id}-barrel`, 'slate', [0, 0, 1.3], [.65, .65, 2.1], data);
  block(gun, `${mount.id}-muzzle`, 'steel', [0, 0, 2.3], [.9, .9, .6], data);
  const muzzle = group(gun, `${mount.id}-muzzle-point`, [0, 0, mount.muzzleLength]);
  gun.userData = { mount, index: mount.index, barrel, muzzle }; return gun;
}
function createStation(parent, seat, index) {
  const station = group(parent, `ultra-miner-station-${index}`, [seat.x, seat.y, seat.z]); station.rotation.y = seat.angle;
  const data = { structuralId: `${seat.roomId}-station-${index}` };
  if (seat.role === 'window-watcher') {
    // Low, offset controls leave the real miner's face and eye line clear.
    block(station, 'station-watch-port-controls', 'slate', [-.8, .65, -.15], [.65, 1.1, .75], data);
    block(station, 'station-watch-port-handgrip', 'copper', [-.8, 1.25, .1], [.7, .18, .25], data);
    station.userData = { seatIndex: index, role: seat.role, screens: [] }; return station;
  }
  const screens = [];
  for (const [screenIndex, x] of [-2.1, 0, 2.1].entries()) {
    block(station, `station-control-computer-${screenIndex}-case`, 'controlDark', [x, .7, 1.2], [1.9, 1.4, 1.25], data);
    block(station, `station-control-computer-${screenIndex}-monitor`, 'dark', [x, 1.9, 1.5], [1.9, 1.05, .5], data);
    screens.push(block(station, `station-control-computer-${screenIndex}-screen`, 'controlScreen', [x, 1.9, 1.23], [1.6, .75, .1],
      { ...data, detailPriority: 15, lightIntensity: 1.5, lightDistance: 2, lightColor: 0x456d62, hiddenControl: true }));
    block(station, `station-control-computer-${screenIndex}-keyboard`, 'slate', [x, 1.25, .65], [1.6, .15, .7], data);
  }
  station.userData = { screen: screens[1], screens, seatIndex: index, role: seat.role }; return station;
}

function addControlReactorCasing(parent, id) {
  const data = { structuralId: `${id}-sealed-casing`, anatomicalPart: 'armor' };
  for (const side of [-1, 1]) {
    block(parent, `${id}-casing-x-${side}`, 'controlDark', [side * 1.8, 0, 0], [.6, 4.2, 4.2], data);
    block(parent, `${id}-casing-z-${side}`, 'controlDark', [0, 0, side * 1.8], [4.2, 4.2, .6], data);
  }
  block(parent, `${id}-sealed-top`, 'controlDark', [0, 2.1, 0], [4.2, .6, 4.2], data);
}

/** Fixed salvage placements keep the wreck recognisable across previews and saves. */
function addSalvage(frames, legs) {
  const pieces = [];
  const scrap = (parent, id, source, damage, color, position, size, rotation = [0, 0, 0]) => {
    const mesh = block(parent, id, color, position, size, { structuralId: id, anatomicalPart: 'salvage',
      salvage: true, salvageId: id, salvageSource: source, damageState: damage });
    mesh.rotation.set(...rotation); pieces.push(mesh); return mesh;
  };
  const body = frames.body;
  // Each side carries different borrowed plates; the shoulder openings stay clear.
  const patches = [
    [-1, 14.5, -5.5, 5.4, 3.3, .13], [1, 15.2, 5.7, 4.2, 4.6, -.09],
    [-1, 22.7, 5.8, 5.8, 3.2, -.16], [1, 23.6, -5.7, 3.7, 5.1, .12],
    [-1, 29.3, -5.3, 4.7, 3.7, .11], [1, 28.1, 5.3, 6.1, 2.6, -.17],
    [-1, 35.3, 4.9, 3.7, 4.1, -.1], [1, 34.6, -4.8, 5.3, 3.5, .15],
  ];
  for (const [index, [side, y, z, width, height, tilt]] of patches.entries()) {
    const id = `ultra-salvage-hull-patch-${index}`, x = side * 13.55;
    scrap(body, id, index % 2 ? 'fortress-slate-plate' : 'mine-walker-copper-plate', 'chipped', index % 2 ? 'slate' : 'copper',
      [x, y, z], [.8, height, width], [tilt, 0, side * .06]);
    scrap(body, `${id}-scorch`, 'burned-armor-skin', 'scorched', 'scorch', [x + side * .48, y - .35, z + .4], [.18, height * .46, width * .52], [tilt, 0, 0]);
    for (const edge of [-1, 1]) scrap(body, `${id}-rivet-${edge}`, 'copper-rivet-bracket', 'bent', 'edge',
      [x + side * .55, y + edge * height * .33, z - width * .26], [.4, .5, .65]);
  }
  for (const [index, [x, z, sx, sz, yaw]] of [
    [-8.4, -4.6, 11.4, 7.1, -.23], [4.4, -3.5, 9.6, 10.1, .28], [8.8, 5.3, 8.1, 6.4, -.34],
    [-3.2, 5.9, 8.7, 6.8, .2],
  ].entries()) {
    scrap(body, `ultra-salvage-roof-slab-${index}`, index % 2 ? 'spider-drone-shell' : 'fortress-copper-roof', 'bent', index % 2 ? 'slate' : 'copper',
      [x, 39.15 + index % 2 * .8, z], [sx, 1.2, sz], [.13 * (index - 1), yaw, .12 * (1 - index)]);
  }
  // An incomplete drone casing is bolted diagonally to the roof, without occupants or its own voxel body.
  scrap(body, 'ultra-salvage-roof-drone-shell', 'spider-drone-shell', 'crushed', 'slate', [-9.3, 40.1, 1.6], [4.8, 1.7, 4.2], [.11, -.38, -.13]);
  scrap(body, 'ultra-salvage-roof-drone-copper-lid', 'spider-drone-shell', 'chipped', 'copper', [-9.2, 41.1, 1.7], [3.9, .6, 3.7], [.11, -.38, -.13]);
  for (const [i, side] of [-1, 1].entries()) {
    const wire = link(body, `ultra-salvage-roof-loose-wire-${i}`, [-10 + i, 40.6, 1.3], [-14.5, 35.1 - i, side * 5], .4, 'dark',
      { structuralId: `ultra-salvage-roof-loose-wire-${i}`, anatomicalPart: 'salvage', salvage: true,
        salvageId: `ultra-salvage-roof-loose-wire-${i}`, salvageSource: 'exposed-power-cable', damageState: 'bent' });
    pieces.push(wire);
  }
  for (const [sideIndex, frame] of ['rightArm', 'leftArm'].entries()) {
    for (let i = 0; i < 3; i++) {
      const x = 2.4 + i * 6.6, side = (i + sideIndex) % 2 ? -1 : 1, y = 3 - i * .6;
      scrap(frames[frame], `ultra-salvage-${frame}-patch-${i}`, i === 1 ? 'spider-drone-shell' : 'fortress-copper-plate', 'bent',
        i % 2 ? 'slate' : 'copper', [x, y, side * 3.65], [4.6, 3.4, .8], [.09 * side, -.12 * side, .06]);
      scrap(frames[frame], `ultra-salvage-${frame}-bracket-${i}`, 'mine-walker-bracket', 'bent', 'edge',
        [x + .9, y + 1, side * 4.1], [1.2, 2.2, .45], [0, 0, side * .29]);
      scrap(frames[frame], `ultra-salvage-${frame}-roof-${i}`, 'drone-armor-shard', 'chipped', 'slate',
        [x, 7.15 - i * .6, side * 1.5], [3.8, .7, 2.6], [.08, side * .16, .08 * side]);
    }
  }
  for (const index of [0, 3, 5, 6]) {
    scrap(legs[index].userData.kneeJoint, `ultra-salvage-knee-brace-${index}`, 'fortress-copper-bracket', 'bent', index % 2 ? 'slate' : 'copper',
      [1.4, .5, 0], [1.3, 3.7, 4.1], [.16, .12 * index, -.24]);
  }
  // Salvaged fronts occupy the outer corners, where they cannot hide the occupied window centers.
  const walker = group(body, 'ultra-salvaged-mine-walker-cockpit', [-12.2, 28.1, 9.7]); walker.rotation.z = -.19;
  for (const [id, color, position, size] of [
    ['top', 'slate', [0, 3.5, .7], [7.6, 1.7, 2.4]],
    ['left', 'slate', [-3.3, .3, .8], [1.5, 6.7, 2.5]],
    ['broken-sill', 'copper', [-1, -2.5, 1.1], [5.5, 1.6, 2.6]],
    ['inner-recess', 'dark', [-.7, .5, .4], [4.5, 3.7, .6]],
    ['crushed-cockpit-plate', 'scorch', [-.5, .6, .85], [3.9, 2.9, .6]],
    ['loose-corner-brace', 'edge', [3, 2.4, 1.3], [1.2, 3.1, 1.1]],
  ]) {
    scrap(walker, `ultra-salvage-walker-cockpit-${id}`, 'copper-mine-walker', id === 'top' ? 'scorched' : 'crushed', color, position, size);
  }
  const spider = group(body, 'ultra-salvaged-spider-drone-corner', [11.4, 38.5, 8.9]); spider.rotation.set(-.16, -.28, .21);
  scrap(spider, 'ultra-salvage-spider-wide-hull', 'copper-spider-drone', 'crushed', 'slate', [0, .5, 0], [6.6, 2.8, 5.6]);
  scrap(spider, 'ultra-salvage-spider-copper-lid', 'copper-spider-drone', 'bent', 'copper', [.5, 2.4, -.2], [6.1, 1.1, 5.4], [0, .12, .1]);
  scrap(spider, 'ultra-salvage-spider-eye-recess', 'copper-spider-drone', 'scorched', 'dark', [-.8, .6, 3], [2.6, 2.2, .9]);
  scrap(spider, 'ultra-salvage-spider-dead-eye', 'copper-spider-drone', 'chipped', 'red', [-.8, .6, 3.6], [1.5, 1.1, .6]);
  for (const [i, side] of [-1, 1].entries()) {
    scrap(spider, `ultra-salvage-spider-leg-stump-${i}`, 'copper-spider-drone', 'bent', 'edge', [side * 4.1, -.2, .2], [3.7, 1.2, 1.4], [.14, side * .4, side * .5]);
  }
  const hound = group(body, 'ultra-salvaged-drill-hound-jaw', [12.7, 28.8, 9.5]); hound.rotation.set(.1, -.18, .17);
  scrap(hound, 'ultra-salvage-hound-armored-skull', 'copper-drill-hound', 'crushed', 'slate', [0, 1.1, .7], [5.2, 3.7, 3.5]);
  scrap(hound, 'ultra-salvage-hound-long-muzzle', 'copper-drill-hound', 'chipped', 'copper', [-.4, -.2, 2.6], [4.7, 2.2, 3.9]);
  scrap(hound, 'ultra-salvage-hound-jaw-gap', 'copper-drill-hound', 'scorched', 'dark', [-.4, -1, 3.7], [4.8, 1.1, 2.1]);
  for (const [i, x] of [-1.8, -.3, 1.2].entries()) scrap(hound, `ultra-salvage-hound-jaw-tooth-${i}`, 'copper-drill-hound', 'chipped', 'steel',
    [x, -1.6, 4.4], [.8, 1.8 - i * .35, .9], [0, 0, .08 * i]);
  scrap(hound, 'ultra-salvage-hound-one-dead-eye', 'copper-drill-hound', 'scorched', 'red', [-1.4, 1.5, 2.8], [1, .7, .6]);
  for (const [i, [x, y, width, tilt]] of [
    [-8.7, 13.1, 8.2, -.13], [6.8, 19.7, 6.8, .09], [-7.9, 26.1, 7.3, -.17], [5.6, 32.7, 8.8, .12],
    [-11.7, 36.5, 4.7, -.23], [10.9, 29.6, 4.8, .26],
  ].entries()) {
    const plate = scrap(body, `ultra-salvage-front-band-${i}`, i % 2 ? 'fortress-slate-plate' : 'mine-walker-copper-plate', 'bent',
      i % 2 ? 'slate' : 'copper', [x, y, 9.8], [width, 1.7, 1.3], [0, .05 * i, tilt]);
    for (const side of [-1, 1]) scrap(plate, `ultra-salvage-front-band-${i}-bolt-${side}`, 'copper-rivet-bracket', 'chipped', 'edge',
      [side * .35, .1, .65], [.1, .4, .65]);
  }
  for (const [i, [a, b]] of [
    [[-14.2, 12.8, 10], [-11.9, 22.4, 10.4]], [[2.5, 20.2, 9.9], [4.6, 27.5, 10.1]],
    [[10.5, 30.2, 10], [13.7, 36.5, 10.6]], [[-4.7, 30.8, 9.8], [-2.8, 38, 10.4]],
  ].entries()) {
    const brace = link(body, `ultra-salvage-front-diagonal-${i}`, a, b, .85, i % 2 ? 'slate' : 'edge', {
      structuralId: `ultra-salvage-front-diagonal-${i}`, anatomicalPart: 'salvage', salvage: true,
      salvageId: `ultra-salvage-front-diagonal-${i}`, salvageSource: 'mine-walker-bracket', damageState: 'bent' });
    pieces.push(brace);
  }
  for (const [i, [from, to]] of [
    [[-12.5, 38.3, 10.2], [-15.6, 30.2, 10.9]], [[-15.6, 30.2, 10.9], [-14.3, 23.6, 10.4]],
    [[14, 37.6, 9.9], [16.1, 29.5, 11.1]], [[16.1, 29.5, 11.1], [14.3, 24.1, 10.1]],
  ].entries()) {
    const cable = link(body, `ultra-salvage-front-loose-cable-${i}`, from, to, .65, 'dark', {
      structuralId: `ultra-salvage-front-loose-cable-${i}`, anatomicalPart: 'salvage', salvage: true,
      salvageId: `ultra-salvage-front-loose-cable-${i}`, salvageSource: 'exposed-power-cable', damageState: 'bent' });
    pieces.push(cable);
  }
  return pieces;
}

/** Source geometry remains hollow; the ten miners are independent engine actors. */
export function createMechSpiderTankUltra() {
  const root = new THREE.Group(); root.name = MECH_SPIDER_TANK_ULTRA_TYPE;
  const body = group(root, 'ultra-five-connected-main-rooms');
  const drillArm = group(root, 'ultra-right-three-room-drill-arm'), fabricatorArm = group(root, 'ultra-left-three-room-fabricator-arm');
  const frames = { body, rightArm: drillArm, leftArm: fabricatorArm }, panels = [], interiorLights = [], eyes = [], roomGroups = [];
  const rooms = ULTRA_ROOMS.map(room => {
    const value = group(frames[room.frame], room.id); value.userData = { roomId: room.id, layout: room }; roomGroups.push(value); return value;
  });
  const roomById = Object.fromEntries(rooms.map(value => [value.name, value]));
  for (const floor of ULTRA_FLOORS) {
    block(frames[floor.frame], floor.id, floor.roomId === 'ultra-bridge' ? 'controlDark' : 'dark',
      [floor.x, floor.topY - .3, floor.z], [floor.width, .6, floor.depth], metadata(floor));
    if (floor.frame !== 'body') for (const z of [-floor.depth / 2 + .6, floor.depth / 2 - .6]) block(frames[floor.frame], `${floor.id}-copper-floor-strip`, 'edge',
      [floor.x, floor.topY + .05, z], [floor.width, .12, .35], metadata(floor));
  }
  for (const room of ULTRA_ROOMS) {
    const roof = block(frames[room.frame], room.roofId, room.hiddenControl ? 'controlDark' : room.frame === 'body' ? 'dark' : 'slate',
      [room.x, room.roofY + .25, room.z], [room.width, .5, room.depth], { structuralId: room.roofId, bossMain: room.frame === 'body' });
    // Internal ceilings share the stairwell openings of the deck immediately above.
    if (room.frame === 'body' && room.id !== 'ultra-bridge') roof.userData.severable = false;
    roof.visible = room.frame !== 'body' || room.id === 'ultra-bridge';
    roof.userData.previewCutaway = true; panels.push(roof);
    const lampData = { structuralId: `${room.id}-lamp`, detailPriority: 25,
      ...(room.hiddenControl ? { lightIntensity: 8, lightDistance: 4, lightColor: 0x651b17, hiddenControl: true } : {}) };
    const red = block(roomById[room.id], `${room.id}-red-interior-light`, room.hiddenControl ? 'dimRed' : 'red',
      [room.x, room.hiddenControl ? room.floorY + 2.5 : room.roofY - .65, room.hiddenControl ? 2 : room.depth / 2 - 1],
      [room.hiddenControl ? .65 : Math.min(3.6, room.width / 2), .5, .6], lampData);
    interiorLights.push(red);
  }
  // Only the highest roof is closed; the upper floor plates form each lower room's ceiling.
  for (const wall of ULTRA_WALLS) {
    const color = wall.roomId === 'ultra-bridge' ? 'controlDark' : wall.frame === 'body' && wall.z > 5 ? 'dark' : wall.color;
    const mesh = block(frames[wall.frame], `${wall.id}-armor`, color, [wall.x, wall.y, wall.z],
      [wall.width, wall.height, wall.depth], metadata(wall));
    if (wall.frame === 'body' && wall.z > 7) { mesh.userData.previewCutaway = true; panels.push(mesh); }
  }
  for (const window of ULTRA_WINDOWS) {
    const pane = block(body, window.id, 'glass', [window.x, window.y, window.z], [window.width, window.height, window.depth],
      { ...metadata(window), voxelTransparent: true, detailPriority: 20, realGlass: true });
    pane.userData.previewCutaway = true; panels.push(pane);
    // The small clear center is bounded by worn armor, with no opaque mullions.
    const along = window.axis === 'x' ? 'z' : 'x';
    for (const side of [-1, 1]) {
      const at = { x: window.x, y: window.y, z: window.z }; at[along] += side * .6;
      const frame = block(body, `${window.id}-side-frame-${side}`, 'edge', [at.x, at.y, at.z],
        window.axis === 'x' ? [.75, 1.3, .2] : [.2, 1.3, .75], { structuralId: `${window.id}-frame` });
      frame.userData.previewCutaway = true; panels.push(frame);
    }
  }
  const stairs = ULTRA_STAIRS.map(stair => {
    const value = group(frames[stair.frame], stair.id), dx = stair.to.x - stair.from.x, dz = stair.to.z - stair.from.z;
    for (let i = 0; i < stair.steps; i++) {
      const t = (i + .5) / stair.steps, top = stair.from.y + (stair.to.y - stair.from.y) * (i + 1) / stair.steps;
      block(value, `${stair.id}-step-${i}`, i % 3 ? 'slate' : 'edge',
        [stair.from.x + dx * t, top - .18, stair.from.z + dz * t],
        [Math.abs(dx) / stair.steps + .05 || stair.width, .36, dz ? Math.abs(dz) / stair.steps + .05 : stair.width],
        { structuralId: stair.id, bossMain: stair.frame === 'body' });
    }
    for (const side of [-1, 1]) link(value, `${stair.id}-handrail`,
      [stair.from.x, stair.from.y + 1.1, stair.from.z + side * stair.width / 2],
      [stair.to.x, stair.to.y + 1.1, stair.to.z + side * stair.width / 2], .18, 'copper', { structuralId: stair.id });
    value.userData.layout = stair; return value;
  });
  // Thin red eye bars are ordinary armor lights: destroying one never kills a billion-HP machine.
  for (let i = 0; i < 8; i++) {
    block(body, `ultra-eye-${i}-recess`, 'dark', [(i - 3.5) * 2.5, 37, 9.1], [2.1, 1.4, .6], { structuralId: 'ultra-bridge-wall' });
    eyes.push(block(body, `ultra-red-eye-${i}`, 'red', [(i - 3.5) * 2.5, 37, 9.5], [1.5, .7, .6],
      { anatomicalPart: 'light', structuralId: 'ultra-bridge-wall', detailPriority: 35 }));
  }
  const reactors = ULTRA_REACTORS.map(reactor => {
    const value = group(body, reactor.id, [reactor.x, reactor.y, reactor.z]);
    const data = { structuralId: reactor.id, anatomicalPart: 'reactor', critical: true, reactorId: reactor.id, detailPriority: 45 };
    block(value, `${reactor.id}-exposed-core`, 'reactor', [0, 0, 0], [2.4, 3.6, 2.4], data);
    for (const y of [-1.6, 1.6]) block(value, `${reactor.id}-copper-endcap`, 'edge', [0, y, 0], [3, .6, 3], { structuralId: reactor.id });
    if (reactor.roomId === 'ultra-bridge') addControlReactorCasing(value, reactor.id);
    value.userData.layout = reactor; return value;
  });
  const fabricators = ULTRA_FABRICATORS.map(layout => {
    const value = group(body, layout.id, [layout.x, layout.y, layout.z]), data = { structuralId: layout.id, weaponId: layout.id, anatomicalPart: 'weapon' };
    block(value, `${layout.id}-base`, 'slate', [0, 0, 0], [3.6, 1.6, 3.6], data);
    for (const side of [-1, 1]) block(value, `${layout.id}-gantry`, 'copper', [side * 1.5, 1.8, 0], [.6, 3, 3.6], data);
    block(value, `${layout.id}-red-print-head`, layout.roomId === 'ultra-bridge' ? 'dimRed' : 'red', [0, 3, 0], [2.4, .6, 1.2], data);
    value.userData.layout = layout; return value;
  });
  const stations = ULTRA_CREW_SEATS.map((seat, index) => createStation(body, seat, index));
  interiorLights.push(...stations.flatMap(station => station.userData.screens));
  const guns = ULTRA_GUN_MOUNTS.map(mount => createMachineGun(body, mount));
  const legs = Array.from({ length: 8 }, (_, index) => {
    const angle = Math.PI / 8 + index * Math.PI / 4, sine = Math.sin(angle), cosine = Math.cos(angle);
    const leg = group(root, `ultra-damaged-mine-walker-leg-${index}`), data = { structuralId: `ultra-leg-${index}`, balanceId: `ultra-leg-${index}`, anatomicalPart: 'leg' };
    const hip = [sine * 9.6, 9.6, cosine * 7.2], knee = [sine * 20.4, 12.6, cosine * 18], ankle = [sine * 28.5, 2.1, cosine * 26.4];
    const upper = link(leg, `ultra-leg-${index}-upper`, hip, knee, 2.4, 'copper', data);
    const lower = link(leg, `ultra-leg-${index}-lower`, knee, ankle, 2.1, 'edge', data);
    const kneeJoint = group(leg, `ultra-leg-${index}-knee-joint`, knee);
    block(kneeJoint, `ultra-leg-${index}-knee`, 'slate', [0, 0, 0], [3.4, 3, 3.4], data);
    // Missing corner armor and exposed scorched pistons give slight damage without removing a leg.
    const piston = link(leg, `ultra-leg-${index}-exposed-piston`, [knee[0] + .75, knee[1] - .9, knee[2]], [ankle[0] + .75, ankle[1] + 1, ankle[2]], .6, 'scorch', data);
    block(kneeJoint, `ultra-leg-${index}-damaged-patch`, 'scorch', [0, 1.5, 0], [2.2, .6, 1.8], data);
    const foot = group(leg, `ultra-leg-${index}-drill-foot`, ankle);
    for (let stage = 0; stage < 3; stage++) {
      const cutter = block(foot, `ultra-leg-${index}-foot-cutter-${stage}`, stage % 2 ? 'steel' : 'copper', [0, -stage * .8, 0], [4.2 - stage * 1.1, .9, 4.2 - stage * 1.1], data);
      cutter.rotation.y = stage * .35;
    }
    leg.userData = { index, upper, lower, kneeJoint, piston, foot, hip, knee, ankle }; return leg;
  });
  // A hollow tunnel-boring crown preserves an actual boarding passage through its center.
  const drill = group(drillArm, 'ultra-huge-hollow-end-drill'), drillData = { weaponId: 'ultra-drill', structuralId: 'ultra-drill', anatomicalPart: 'weapon', detailPriority: 30 };
  for (let stage = 0; stage < 5; stage++) {
    const x = 20.4 + stage * 1.325, width = 7.8 - stage * 1.02, half = width / 2;
    for (const side of [-1, 1]) {
      block(drill, `ultra-drill-stage-${stage}-side-${side}`, stage % 2 ? 'steel' : 'edge', [x, 0, side * half], [1.4, width, .9], drillData);
      if (side > 0) block(drill, `ultra-drill-stage-${stage}-top`, stage % 2 ? 'edge' : 'steel', [x, half, 0], [1.4, .9, width], drillData);
      else for (const edge of [-1, 1]) {
        const strip = (width - 2.8) / 2;
        block(drill, `ultra-drill-stage-${stage}-boarding-gap-${edge}`, stage % 2 ? 'edge' : 'steel',
          [x, -half, edge * (1.4 + strip / 2)], [1.4, .9, strip], drillData);
      }
    }
  }
  // Copper service wires remain outside the hollow rooms and connect their shoulder to the tool.
  for (const side of [-1, 1]) {
    link(drillArm, 'ultra-right-heavy-copper-wire', [.2, 5.8, side * 2.9], [19.2, 4.6, side * 2.9], .45, 'copper', { structuralId: 'ultra-right-wire' });
    link(drillArm, 'ultra-right-black-hydraulic-wire', [.2, 5.2, side * 3.3], [19.2, 4.1, side * 3.3], .5, 'dark', { structuralId: 'ultra-right-wire' });
  }
  // The Spider Drone hand uses coarse original modules, never a nested voxel creature.
  const hand = group(fabricatorArm, 'ultra-spider-drone-hand', [17.4, 1.5, 0]);
  const handData = { structuralId: 'ultra-hand-fabricator', weaponId: 'ultra-hand-fabricator', anatomicalPart: 'weapon', detailPriority: 30 };
  block(hand, 'ultra-hand-slate-spider-chassis', 'slate', [0, .9, 0], [3, 2.4, 5.8], handData);
  block(hand, 'ultra-hand-tough-copper-lava-armor', 'copper', [0, 2.25, 0], [3, .9, 6.6], handData);
  for (const side of [-1, 1]) for (let finger = 0; finger < 4; finger++) {
    const x = -1.2 + finger * .8;
    link(hand, `ultra-hand-spider-finger-${side}-${finger}`, [x, .7, side * 2.5], [x + .8, -1, side * 4.2], .7, 'copper', handData);
    link(hand, `ultra-hand-spider-claw-${side}-${finger}`, [x + .8, -1, side * 4.2], [x + 1.2, -2.1, side * 2.8], .6, 'edge', handData);
  }
  const heldEnemyAnchor = group(hand, 'ultra-held-fabricated-enemy-anchor', [0, -.9, 0]);
  const salvageParts = addSalvage(frames, legs);
  const roofLaunchers = createUltraRoofLaunchers(body);
  for (const part of salvageParts) part.userData.previewCutaway = true;
  panels.push(...salvageParts);
  root.userData = { type: MECH_SPIDER_TANK_ULTRA_TYPE, ultra: true, boss: true, cutHits: 6,
    voxelSize: LAYOUT.voxelSize, voxelBudget: LAYOUT.voxelBudget, structuralFatalExempt: true,
    body, head: body, drillArm, fabricatorArm, rightArm: drillArm, leftArm: fabricatorArm,
    arms: [drillArm, fabricatorArm], legs, limbs: [...legs, drillArm, fabricatorArm], rooms, roomGroups,
    stairs, eyes, eye: eyes[0], reactors, core: reactors[0], guns, fabricators, roofLaunchers, drill, hand, drills: [drill],
    heldEnemyAnchor, interiorLights, stations, salvageParts, crewSeats: ULTRA_CREW_SEATS, previewCutawayParts: panels, baseBodyY: 0 };
  animateMechSpiderTankUltra(root, 0); return root;
}

function poseArm(arm, pose) {
  const x = new THREE.Vector3(pose.axisX.x, pose.axisX.y, pose.axisX.z), y = new THREE.Vector3(pose.axisY.x, pose.axisY.y, pose.axisY.z), z = new THREE.Vector3(pose.axisZ.x, pose.axisZ.y, pose.axisZ.z);
  arm.position.set(pose.origin.x, pose.origin.y, pose.origin.z);
  arm.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); arm.scale.x = pose.scaleX;
}

const WALK_STRIDE = 6, WALK_STANCE = .65, WALK_LIFT = 1.9;
const legDirection = new THREE.Vector3(), legKnee = new THREE.Vector3(), legAnkle = new THREE.Vector3();
const pistonFrom = new THREE.Vector3(), pistonTo = new THREE.Vector3(), segmentDirection = new THREE.Vector3();
const gaitPosition = new THREE.Vector3();

function poseLegSegment(mesh, from, to, width) {
  segmentDirection.subVectors(to, from);
  mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.scale.set(width, segmentDirection.length(), width);
  mesh.quaternion.setFromUnitVectors(up, segmentDirection.normalize());
}

function poseWalkingLeg(leg, ankle, lift = 0) {
  const d = leg.userData;
  legKnee.fromArray(d.knee);
  legKnee.x += (ankle.x - d.ankle[0]) * .45;
  legKnee.z += (ankle.z - d.ankle[2]) * .45;
  legKnee.y += lift * .35;
  d.kneeJoint.position.copy(legKnee); d.foot.position.copy(ankle);
  pistonFrom.fromArray(d.hip); poseLegSegment(d.upper, pistonFrom, legKnee, 2.4);
  poseLegSegment(d.lower, legKnee, ankle, 2.1);
  pistonFrom.copy(legKnee); pistonFrom.x += .75; pistonFrom.y -= .9;
  pistonTo.copy(ankle); pistonTo.x += .75; pistonTo.y += 1;
  poseLegSegment(d.piston, pistonFrom, pistonTo, .6);
}

/** Travel advances alternating feet; stance anchors stay planted in world space. */
function poseWalkingLegs(root, state, clock) {
  if (!Number.isFinite(state.walkDistance)) return;
  const distance = Math.max(0, state.walkDistance), data = root.userData;
  root.updateWorldMatrix(true, true);
  root.getWorldPosition(gaitPosition);
  if (!data.walkGait || distance < data.walkGait.distance
    || state.moving !== true && gaitPosition.distanceToSquared(data.walkGait.position) > .25) {
    data.walkGait = { distance, time: clock, position: gaitPosition.clone() };
    for (const leg of data.legs) {
      poseWalkingLeg(leg, legAnkle.fromArray(leg.userData.ankle));
      const foot = leg.userData.foot.getWorldPosition(new THREE.Vector3());
      if (Number.isFinite(state.walkGroundElevation)) foot.y = state.walkGroundElevation + leg.userData.ankle[1];
      leg.userData.walk = { foot, groundY: foot.y, from: foot.clone(), to: foot.clone(), swing: false, resume: false };
    }
  }
  const gait = data.walkGait, elapsed = Math.max(0, Math.min(.1, clock - gait.time));
  const moving = state.moving === true;
  legDirection.set(Number.isFinite(state.walkLocalVelocityX) ? state.walkLocalVelocityX : 0, 0,
    Number.isFinite(state.walkLocalVelocityZ) ? state.walkLocalVelocityZ : 1);
  if (legDirection.lengthSq() < 1e-8) legDirection.set(0, 0, 1);
  legDirection.normalize();
  for (const leg of data.legs) {
    const d = leg.userData, walk = d.walk, cycle = (distance / WALK_STRIDE + d.index % 2 * .5) % 1;
    const swing = cycle >= WALK_STANCE, progress = Math.max(0, (cycle - WALK_STANCE) / (1 - WALK_STANCE));
    if (moving) {
      if (swing && (!walk.swing || walk.resume)) {
        walk.from.copy(walk.foot);
        // Account for the root's remaining swing travel so touchdown is ahead of its hip.
        const lead = WALK_STRIDE * (WALK_STANCE / 2 + (1 - WALK_STANCE) * (1 - progress));
        walk.to.fromArray(d.ankle).addScaledVector(legDirection, lead); root.localToWorld(walk.to);
        walk.to.y = walk.groundY; walk.startProgress = progress;
      }
      if (swing) {
        const t = (progress - walk.startProgress) / Math.max(1e-6, 1 - walk.startProgress), eased = t * t * (3 - 2 * t);
        walk.foot.lerpVectors(walk.from, walk.to, eased);
        walk.foot.y += Math.sin(Math.PI * t) * WALK_LIFT;
      } else if (walk.swing) walk.foot.copy(walk.to);
      walk.swing = swing; walk.resume = false;
    } else {
      // Halting lowers an airborne foot vertically, without inventing another step.
      walk.foot.y = Math.max(walk.groundY, walk.foot.y - elapsed * 8);
      walk.resume = true;
    }
    legAnkle.copy(walk.foot); root.worldToLocal(legAnkle);
    poseWalkingLeg(leg, legAnkle, Math.max(0, walk.foot.y - walk.groundY));
  }
  gait.distance = distance; gait.time = clock; gait.position.copy(gaitPosition);
}

export function animateMechSpiderTankUltra(root, time, speed = 0, phase = 'ready', motion = {}) {
  const data = root.userData, clock = Number.isFinite(time) ? time : 0, state = motion.ultra || motion;
  const position = root.getWorldPosition(new THREE.Vector3());
  const angle = new THREE.Euler().setFromQuaternion(root.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
  const owner = { x: position.x, z: position.z, elevation: position.y, angle, ultra: state };
  poseWalkingLegs(root, state, clock);
  animateUltraRoofLaunchers(data.roofLaunchers, state);
  poseArm(data.drillArm, ultraArmPose(owner, 'right')); poseArm(data.fabricatorArm, ultraArmPose(owner, 'left'));
  // A mechanical clutch holds the boarding aperture upright throughout the down window.
  data.drill.rotation.x = state.phase === 'down' || state.armDown ? 0 : clock * 2.4;
  root.updateWorldMatrix(true, false);
  for (const gun of data.guns) {
    const point = ultraGunMuzzle(owner, gun.userData.index), aim = root.worldToLocal(new THREE.Vector3(point.x, point.y, point.z));
    aim.sub(gun.position); gun.quaternion.setFromUnitVectors(forward, aim.normalize());
    gun.userData.barrel.position.z = 1.3 - (state.firingGuns?.[gun.userData.index] ? Math.abs(Math.sin(clock * 28)) * .2 : 0);
  }
  for (const light of data.interiorLights) light.userData.pulse = .85 + Math.sin(clock * 4) * .15;
}
