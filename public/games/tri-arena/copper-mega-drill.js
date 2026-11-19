import * as THREE from './assets/three.module.js';
import { createColosseumEnemy, animateColosseumEnemy } from './colosseum-enemies.js';
import { getMegaDrillSegmentPoses, MEGA_DRILL_JOINT_LAP } from './mega-drill-motion.js';

const roomDefinitions = [
  { id: 'fabricator-1', name: 'Robot Fabricator I', role: 'fabricator', center: [0, 3.6, -13.5] },
  { id: 'fabricator-2', name: 'Robot Fabricator II', role: 'fabricator', center: [0, 3.6, -7.5] },
  { id: 'drone-bay', name: 'Repair Drone Foundry', role: 'drone', center: [0, 3.6, -1.5] },
  { id: 'control', name: 'Forward Control Room', role: 'control', center: [0, 3.6, 4.5] },
];
export const MEGA_DRILL_SPEC = Object.freeze({ name: 'Copper Mega Drill', health: 1000000, cutHits: 5, unlockWave: 30,
  length: 33, fortressLength: 6.6, fortressCount: 5, width: 8.04, hullLength: 24, drillLength: 9,
  rearZ: -16.5, hullFrontZ: 7.5, tipZ: 16.5, floorY: 1.75, roofY: 6.7, drillAxisY: 4.15,
  corridorWidth: 2.4, roomLength: 6, reactorCount: 4,
  rooms: Object.freeze(roomDefinitions.map(room => Object.freeze({ ...room, center: Object.freeze(room.center) }))) });

const cube = new THREE.BoxGeometry(1, 1, 1);
const palette = { copper: 0xbc7446, edge: 0xe6a46b, shadow: 0x78462f, patina: 0x397b74,
  dark: 0x172b2d, blue: 0x2fa5f2, cyan: 0x7ddaff, floor: 0x3e4542, cream: 0xeacb97 };
const materials = Object.fromEntries(Object.entries(palette).map(([name, color]) => [name,
  new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .72, flatShading: true })]));
materials.blue.emissive.set(0x1764c1); materials.blue.emissiveIntensity = .8;
materials.cyan.emissive.set(0x2fa5f2); materials.cyan.emissiveIntensity = .75;
materials.glass = new THREE.MeshStandardMaterial({ color: 0x47abc6, emissive: 0x103b49, emissiveIntensity: .18, roughness: .12,
  metalness: .05, transparent: true, opacity: .16, depthWrite: false });
const electricalMaterial = new THREE.LineBasicMaterial({ color: 0x62caff, transparent: true, opacity: .86, depthWrite: false, toneMapped: false });
const transform = new THREE.Object3D();

function joint(parent, name, x = 0, y = 0, z = 0) {
  const group = new THREE.Group(); group.name = name; group.position.set(x, y, z); parent.add(group); return group;
}
function box(parent, name, color, position, size, extra = {}) {
  const mesh = new THREE.Mesh(cube, materials[color]); mesh.name = name;
  mesh.position.set(...position); mesh.scale.set(...size); mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { severable: true, cutHits: 5, ...extra }; parent.add(mesh); return mesh;
}
function batch() {
  const entries = new Map();
  return {
    add(color, position, size, rotation = [0, 0, 0]) {
      if (!entries.has(color)) entries.set(color, []);
      entries.get(color).push({ position, size, rotation });
    },
    finish(parent, label, metadata = {}) {
      for (const [color, blocks] of entries) {
        const mesh = new THREE.InstancedMesh(cube, materials[color], blocks.length);
        mesh.name = `${label}-${color}`; mesh.castShadow = mesh.receiveShadow = true;
        mesh.userData = { severable: true, cutHits: 5, blockCount: blocks.length, ...metadata };
        blocks.forEach((block, index) => {
          transform.position.set(...block.position); transform.scale.set(...block.size); transform.rotation.set(...block.rotation);
          transform.updateMatrix(); mesh.setMatrixAt(index, transform.matrix);
        });
        mesh.computeBoundingBox(); mesh.computeBoundingSphere(); parent.add(mesh);
      }
    },
  };
}

function robot(parent, name, x, z, unfinished = false) {
  const root = joint(parent, name, x, 1.92, z), b = batch();
  root.userData = { role: unfinished ? 'unfinished-robot' : 'control-crew' };
  for (const side of [-1, 1]) {
    b.add('dark', [side * .2, .48, 0], [.22, .68, .26]);
    b.add('edge', [side * .2, .12, .08], [.3, .22, .45]);
    if (!unfinished || side < 0) {
      b.add('copper', [side * .51, 1.21, 0], [.25, .77, .32]);
      b.add('shadow', [side * .51, .81, .05], [.28, .22, .32]);
    }
  }
  b.add(unfinished ? 'dark' : 'copper', [0, 1.15, 0], [.78, .75, .47]);
  b.add('edge', [0, 1.56, 0], [.85, .14, .55]); b.add('shadow', [0, .74, 0], [.58, .2, .44]);
  b.add('blue', [0, 1.2, .25], [.2, .27, .04]);
  b.add('copper', [0, 1.94, 0], [.61, .56, .54]); b.add('dark', [0, 1.97, .285], [.47, .14, .04]);
  for (const side of [-1, 1]) b.add('cyan', [side * .12, 1.98, .312], [.1, .07, .025]);
  if (unfinished) {
    for (const y of [.93, 1.14, 1.35]) b.add('edge', [0, y, .28], [.44, .055, .08]);
    b.add('blue', [.47, 1.25, 0], [.17, .17, .18]);
  }
  b.finish(root, name); return root;
}

function fabricator(parent, x, z, index) {
  const mount = joint(parent, `fabricator-arm-${index}`, x, 5.5, z);
  box(mount, 'fabricator-rail-carriage', 'shadow', [0, .1, 0], [.75, .32, .8]);
  const shoulder = joint(mount, 'fabricator-shoulder');
  box(shoulder, 'fabricator-upper-arm', 'copper', [0, -.53, 0], [.3, 1.12, .35]);
  box(shoulder, 'fabricator-elbow', 'edge', [0, -1.06, 0], [.5, .4, .5]);
  const elbow = joint(shoulder, 'fabricator-forearm', 0, -1.07, 0);
  box(elbow, 'fabricator-forearm-beam', 'shadow', [0, -.49, 0], [.23, .98, .25]);
  box(elbow, 'fabricator-electrical-wrist', 'blue', [0, -1.02, 0], [.32, .2, .32]);
  for (const side of [-1, 1]) {
    box(elbow, 'fabricator-gripping-finger', 'edge', [side * .23, -1.22, 0], [.12, .4, .2]);
    box(elbow, 'fabricator-inward-claw', 'copper', [side * .15, -1.43, 0], [.27, .1, .2]);
  }
  mount.userData = { shoulder, elbow, offset: index * 1.9 }; return mount;
}

function reactor(parent, room, index) {
  if (room.id === 'control') parent = joint(parent, 'control-reactor-alcove', 0, 0, -1.5);
  const x = index % 2 ? 2.65 : -2.65;
  const b = batch();
  b.add('shadow', [x, 1.94, 0], [1.58, .38, 1.55]); b.add('edge', [x, 2.18, 0], [1.35, .12, 1.35]);
  b.add('blue', [x, 2.28, 0], [.65, .1, .65]); b.add('shadow', [x, 5.85, 0], [1.25, .27, 1.3]);
  b.finish(parent, `reactor-cradle-${index}`);
  const root = joint(parent, `floating-reactor-${index}`, x, 3.6, 0);
  const core = box(root, `blue-reactor-cube-${index}`, 'blue', [0, 0, 0], [1.05, 1.05, 1.05], { reactorCube: true });
  const corners = batch();
  for (const side of [-1, 1]) for (const front of [-1, 1]) {
    corners.add('cyan', [side * .49, 0, front * .54], [.08, .98, .04]);
    corners.add('edge', [side * .61, -.61, front * .61], [.18, .18, .18]);
    corners.add('edge', [side * .61, .61, front * .61], [.18, .18, .18]);
  }
  corners.finish(root, 'reactor-floating-cage');
  root.userData = { reactor: true, cube: core, baseY: 3.6, offset: index * 1.7, roomId: room.id };
  return root;
}

function drone(parent, x, z, index) {
  const dock = batch(); dock.add('shadow', [x, 1.95, z], [1.18, .36, 1.18]);
  dock.add('patina', [x, 2.18, z], [1.0, .12, 1.0]); dock.add('cyan', [x, 2.27, z], [.5, .08, .5]);
  dock.finish(parent, 'drone-charging-dock');
  const root = joint(parent, `repair-drone-${index}`, x, 3.02, z), b = batch();
  b.add('copper', [0, 0, 0], [.78, .45, .68]); b.add('edge', [0, .27, 0], [.83, .14, .75]);
  b.add('dark', [0, .01, .36], [.61, .18, .04]); b.add('blue', [0, .02, .4], [.22, .14, .06]);
  for (const side of [-1, 1]) {
    b.add('patina', [side * .5, 0, 0], [.22, .25, .48]); b.add('cyan', [side * .5, -.17, 0], [.13, .08, .28]);
  }
  b.finish(root, 'copper-repair-drone'); root.userData = { baseY: 3.02, offset: index * 1.4 }; return root;
}

function buildRoom(body, definition, index, reactors, arms, drones) {
  const room = joint(body, definition.id, 0, 0, definition.center[2]);
  room.userData = { ...definition, bounds: { minX: -3.78, maxX: 3.78, minZ: -3, maxZ: 3, floorY: 1.75, ceilingY: 6.35 },
    manufacturingArms: [], crew: [], unfinishedRobots: [], drones: [] };
  const core = reactor(room, definition, index); reactors.push(core); room.userData.reactor = core;
  const b = batch();
  if (definition.role === 'fabricator') {
    const x = index % 2 ? -2.4 : 2.4;
    b.add('shadow', [x, 1.91, 0], [1.9, .32, 2.9]); b.add('patina', [x, 2.12, 0], [1.65, .1, 2.5]);
    b.add('edge', [x, 5.85, 0], [1.5, .22, 4.4]);
    for (const z of [-1.4, 1.4]) {
      const arm = fabricator(room, x, z, index * 2 + (z > 0 ? 1 : 0));
      arms.push(arm); room.userData.manufacturingArms.push(arm);
    }
    room.userData.unfinishedRobots.push(robot(room, `unfinished-robot-${index}`, x, 0, true));
    // Spare copper heads and torsos travel down the production conveyor.
    for (const z of [-2.25, 2.15]) {
      b.add('dark', [x, 2.2, z], [1.3, .2, .63]); b.add('copper', [x, 2.56, z], [.62, .55, .54]);
      b.add('blue', [x, 2.6, z + .28], [.24, .08, .03]);
    }
  } else if (definition.role === 'drone') {
    for (const [x, z] of [[2.45, -1.75], [2.45, 1.65], [-2.65, 1.8]]) {
      const craft = drone(room, x, z, drones.length); drones.push(craft); room.userData.drones.push(craft);
    }
    const arm = fabricator(room, 2.45, 0, 4); arms.push(arm); room.userData.manufacturingArms.push(arm);
    b.add('shadow', [2.45, 2.0, 0], [1.2, .4, 1.3]);
  } else {
    for (const x of [-2.05, 1.9]) {
      b.add('shadow', [x, 2.4, 1.52], [1.45, 1.3, .72]); b.add('edge', [x, 3.1, 1.5], [1.5, .16, .8]);
      b.add('dark', [x, 3.56, 1.62], [1.18, .67, .15]); b.add('blue', [x, 3.57, 1.52], [.94, .43, .04]);
      for (const offset of [-.42, -.14, .14, .42]) b.add('cyan', [x + offset, 3.2, 1.2], [.1, .06, .16]);
      const crew = createColosseumEnemy('copper-robot');
      crew.name = 'copper-control-crew'; crew.position.set(x, 1.82, .26);
      Object.assign(crew.userData, { role: 'control-crew', previewCrew: true });
      room.add(crew); room.userData.crew.push(crew);
    }
    b.add('patina', [-2.3, 2.1, -1.5], [1.45, .7, .9]); b.add('blue', [-2.3, 2.48, -1.5], [1.2, .06, .65]);
    // Navigation table stays beyond the shared doorway corridor.
  }
  for (const side of [-1, 1]) {
    b.add('dark', [side * 3.55, 6.05, 0], [.28, .25, 5.5]);
    for (const z of [-2, 0, 2]) b.add('cyan', [side * 3.54, 5.88, z], [.12, .08, .8]);
  }
  b.finish(room, 'room-equipment'); return room;
}

/** Keep every static block in one room's frame, without expanding preview batches. */
function articulateHull(body, rooms, ramp, drill, cutawayParts) {
  const segments = roomDefinitions.map((room, index) => {
    const segment = joint(body, `articulated-room-${index}`, 0, 0, room.center[2]);
    segment.userData = { segmentIndex: index, roomId: room.id, restZ: room.center[2] };
    return segment;
  });
  const moving = new Set([...rooms, ramp, drill, ...segments]), batches = [];
  function collect(parent) {
    for (const child of parent.children) {
      if (moving.has(child)) continue;
      if (child.isInstancedMesh) batches.push(child);
      else collect(child);
    }
  }
  collect(body); body.updateWorldMatrix(true, true);
  const inverse = segments.map(segment => segment.matrixWorld.clone().invert());
  const instance = new THREE.Matrix4(), world = new THREE.Matrix4(), local = new THREE.Matrix4();
  const center = new THREE.Vector3(), wrappers = segments.map(() => new Map()), newCutaway = new Set();
  const hiddenNames = new Set(cutawayParts.map(part => part.name));
  for (const source of batches) {
    const path = [];
    for (let parent = source.parent; parent && parent !== body; parent = parent.parent) path.unshift(parent.name);
    const roles = { 'near-side-removable-armor': 'near-wall', 'far-side-armor': 'far-wall',
      'removable-armored-roof': 'roof', 'removable-front-cabin-panels': 'front-wall' };
    const ancestryRole = path.map(name => roles[name]).find(Boolean);
    const parts = segments.map(() => []);
    for (let index = 0; index < source.count; index++) {
      source.getMatrixAt(index, instance); world.multiplyMatrices(source.matrixWorld, instance);
      center.setFromMatrixPosition(world); body.worldToLocal(center);
      const segmentIndex = roomDefinitions.reduce((nearest, room, candidate) =>
        Math.abs(center.z - room.center[2]) < Math.abs(center.z - roomDefinitions[nearest].center[2]) ? candidate : nearest, 0);
      local.multiplyMatrices(inverse[segmentIndex], world);
      parts[segmentIndex].push(local.clone());
    }
    parts.forEach((matrices, index) => {
      if (!matrices.length) return;
      let parent = segments[index], key = '';
      for (const name of path) {
        key += `/${name}`;
        let wrapper = wrappers[index].get(key);
        if (!wrapper) { wrapper = joint(parent, name); wrappers[index].set(key, wrapper); }
        if (hiddenNames.has(name)) newCutaway.add(wrapper);
        parent = wrapper;
      }
      const copy = new THREE.InstancedMesh(source.geometry, source.material, matrices.length);
      copy.name = source.name; copy.castShadow = source.castShadow; copy.receiveShadow = source.receiveShadow;
      let hullRole = ancestryRole;
      if (source.name.startsWith('armored-grated-floor-')) hullRole = 'floor';
      else if (source.name.startsWith('rear-entry-')) hullRole = 'rear-wall';
      else if (source.name.startsWith('connected-room-doorway-')) {
        source.getMatrixAt(0, instance); world.multiplyMatrices(source.matrixWorld, instance);
        center.setFromMatrixPosition(world); body.worldToLocal(center);
        const partition = [-10.5, -4.5, 1.5].findIndex(z => Math.abs(center.z - z) < .5);
        hullRole = `partition-${partition}`;
      }
      copy.userData = { ...source.userData, hullRole: hullRole || 'frame', segmentIndex: index, blockCount: matrices.length };
      matrices.forEach((matrix, at) => copy.setMatrixAt(at, matrix));
      copy.computeBoundingBox(); copy.computeBoundingSphere(); parent.add(copy);
    });
    source.removeFromParent(); source.dispose();
  }
  rooms.forEach((room, index) => segments[index].attach(room));
  segments[0].attach(ramp); ramp.userData.hullRole = 'ramp';
  ramp.traverse(part => { if (part.isMesh) Object.assign(part.userData, { hullRole: 'ramp', segmentIndex: 0 }); });
  segments[3].attach(drill);
  for (const child of [...body.children]) if (!moving.has(child) && !child.children.length) child.removeFromParent();
  cutawayParts.splice(0, cutawayParts.length, ...newCutaway);
  return segments;
}

/** Nested copper laps keep their own voxel rows when the neighboring rooms bend. */
function sealRoomJoints(segments) {
  for (const [index, segment] of segments.entries()) {
    const ends = [];
    if (index > 0) ends.push({ min: -3 - MEGA_DRILL_JOINT_LAP, max: -2.35, inner: true });
    if (index < 3) ends.push({ min: 2.35, max: 3 + MEGA_DRILL_JOINT_LAP, inner: false });
    for (const side of [-1, 1]) {
      const wall = segment.getObjectByName(side < 0 ? 'near-side-removable-armor' : 'far-side-armor'), sleeve = batch();
      for (const end of ends) {
        const minX = end.inner ? 3.55 : 3.825, maxX = end.inner ? 3.825 : 4.02;
        // Reserve the upper three voxel rows for the roof, across both radial bands.
        sleeve.add('copper', [side * (minX + maxX) / 2, 4.09, (end.min + end.max) / 2],
          [maxX - minX, 4.68, end.max - end.min]);
      }
      sleeve.finish(wall, 'articulated-wall-lap', { hullRole: side < 0 ? 'near-wall' : 'far-wall', segmentIndex: index, jointSeal: true });
    }
    const roof = segment.getObjectByName('removable-armored-roof'), cap = batch();
    for (const end of ends) {
      const low = end.inner ? 6.43 : 6.615, high = end.inner ? 6.615 : 6.7;
      cap.add('copper', [0, (low + high) / 2, (end.min + end.max) / 2], [8.04, high - low, end.max - end.min]);
    }
    cap.finish(roof, 'articulated-roof-lap', { hullRole: 'roof', segmentIndex: index, jointSeal: true });
  }
}

/** Five Fortress lengths, including the drill; every room is genuinely hollow. */
export function createCopperMegaDrill() {
  const root = new THREE.Group(); root.name = 'copper-mega-drill';
  const body = joint(root, 'electrically-hovering-hull'), cutawayParts = [], reactors = [], arms = [], drones = [], hoverNodes = [];
  const floor = batch();
  for (const [z, length] of [[-12, 3], [-7.5, 6], [-1.5, 6], [4.5, 6]]) floor.add('shadow', [0, 1.45, z], [8.04, .6, length]);
  for (const side of [-1, 1]) floor.add('shadow', [side * 2.61, 1.45, -15], [2.82, .6, 3]);
  for (let z = -16.1; z < 7.4; z += .8) for (let x = -3.6; x < 3.9; x += .8) {
    if (z < -13.5 && Math.abs(x) < 1.2) continue;
    floor.add((Math.round((x + z) * 10) % 3) ? 'floor' : 'shadow', [x, 1.78, z], [.75, .06, .75]);
  }
  for (const side of [-1, 1]) for (const [min, max] of [[-13.4, -10.5], [-10.5, -4.5], [-4.5, 1.5], [1.5, 7.4]]) {
    floor.add('edge', [side * 1.03, 1.82, (min + max) / 2], [.1, .035, max - min]);
  }
  floor.finish(body, 'armored-grated-floor');
  const ramp = joint(body, 'mega-drill-entry-ramp'), steps = batch();
  for (let step = 0; step < 15; step++) {
    const top = 1.82 * (step + 1) / 15;
    steps.add(step % 2 ? 'shadow' : 'copper', [0, top / 2, -16.4 + step * .2], [2.4, top, .2]);
  }
  steps.finish(ramp, 'rear-entry-stairs');
  const frame = batch(), roof = joint(body, 'removable-armored-roof'); cutawayParts.push(roof);
  const roofBlocks = batch();
  for (let room = 0; room < 4; room++) {
    const z = roomDefinitions[room].center[2];
    const minZ = z - 3 + (room > 0 ? .65 : 0), maxZ = z + 3 - (room < 3 ? .65 : 0);
    roofBlocks.add('copper', [0, 6.565, (minZ + maxZ) / 2], [8.04, .27, maxZ - minZ]);
    for (const x of [-2.2, 2.2]) {
      roofBlocks.add('shadow', [x, 6.78, z], [2.2, .18, 3.5]);
      for (let k = -3; k <= 3; k++) roofBlocks.add('patina', [x, 6.89, z + k * .4], [1.9, .07, .15]);
    }
    for (const side of [-1, 1]) {
      frame.add('edge', [side * 3.82, 1.45, z], [.4, .34, 6]);
      const point = { x: side * 3.25, y: .85, z }; hoverNodes.push(point);
      frame.add('shadow', [point.x, .93, z], [1.3, .5, 1.6]);
      frame.add('blue', [point.x, .61, z], [1.02, .15, 1.24]);
      for (const dz of [-.4, 0, .4]) frame.add('cyan', [point.x, .51, z + dz], [.74, .07, .13]);
    }
  }
  roofBlocks.finish(roof, 'roof-armor');
  for (const z of [-16.26, -10.5, -4.5, 1.5, 7.26]) {
    const internal = z > -16 && z < 7;
    for (const side of [-1, 1]) frame.add('edge', [side * (internal ? 3.9225 : 3.84), 4.1, z], [internal ? .195 : .36, 4.75, .28]);
    frame.add('shadow', [0, internal ? 6.6575 : 6.38, z], [7.65, internal ? .085 : .24, .26]);
  }
  for (const side of [-1, 1]) {
    const wall = joint(body, side < 0 ? 'near-side-removable-armor' : 'far-side-armor'), b = batch();
    if (side < 0) cutawayParts.push(wall);
    for (let room = 0; room < 4; room++) for (let course = 0; course < 3; course++) for (let slot = 0; slot < 3; slot++) {
      const roomZ = roomDefinitions[room].center[2];
      const minZ = roomZ - 3 + slot * 2 + (slot === 0 && room > 0 ? .65 : 0) - (slot > 0 ? .01 : 0);
      const maxZ = roomZ - 1 + slot * 2 - (slot === 2 && room < 3 ? .65 : 0) + (slot < 2 ? .01 : 0);
      const minY = 1.75 + course * 1.65 - (course > 0 ? .01 : 0);
      const maxY = Math.min(6.43, 1.75 + (course + 1) * 1.65 + (course < 2 ? .01 : 0));
      const z = (minZ + maxZ) / 2, y = (minY + maxY) / 2;
      const window = room === 3 && course === 1;
      b.add(window ? 'glass' : (room + course + slot) % 5 ? 'copper' : 'patina', [side * 3.85, y, z], [.34, maxY - minY, maxZ - minZ]);
      const rivetZ = Math.min(.75, (maxZ - minZ) / 2 - .2);
      for (const dy of [-.59, .59]) for (const dz of [-rivetZ, rivetZ]) b.add('edge', [side * 4, y + dy, z + dz], [.04, .1, .1]);
      if (!window) for (const dy of [-.22, .08, .38]) b.add('shadow', [side * 4, y + dy, z], [.025, .06, .75]);
    }
    for (let room = 0; room < 3; room++) {
      const z = roomDefinitions[room].center[2];
      b.add('shadow', [side * 3.97, 3.22, z], [.08, 2.1, 1.18]);
      b.add('edge', [side * 4, 3.3, z - .35], [.04, .35, .12]);
      b.add('cyan', [side * 4, 4.04, z], [.04, .09, .68]);
    }
    b.finish(wall, 'sectioned-side-armor');
  }
  const ends = batch();
  for (const x of [-2.61, 2.61]) ends.add('copper', [x, 4.225, -16.26], [2.82, 4.95, .48]);
  ends.add('shadow', [0, 6.025, -16.26], [2.4, 1.35, .48]);
  const cabin = joint(body, 'removable-front-cabin-panels'), front = batch(); cutawayParts.push(cabin);
  front.add('copper', [0, 2.51, 7.26], [8.04, 1.52, .48]);
  front.add('copper', [0, 5.895, 7.26], [8.04, 1.61, .48]);
  front.add('copper', [0, 4.18, 7.26], [2.93, 1.87, .48]);
  for (const side of [-1, 1]) {
    front.add('glass', [side * 2.68, 4.18, 7.3], [2.45, 1.85, .3]);
    front.add('edge', [side * 3.9575, 4.18, 7.26], [.125, 1.87, .48]);
  }
  front.finish(cabin, 'control-cabin-front'); ends.finish(body, 'rear-entry');
  for (const z of [-10.5, -4.5, 1.5]) {
    const b = batch();
    for (const side of [-1, 1]) {
      b.add('patina', [side * 2.49, 3.99, z], [2.5, 4.48, .2]);
      b.add('edge', [side * 1.29, 3.33, z], [.18, 3.16, .32]);
      b.add('cyan', [side * 1.22, 3.33, z], [.04, 2.9, .14]);
    }
    b.add('shadow', [0, 5.57, z], [2.4, 1.52, .23]); b.finish(body, 'connected-room-doorway');
  }
  frame.finish(body, 'continuous-armored-frame');
  const rooms = roomDefinitions.map((definition, index) => buildRoom(body, definition, index, reactors, arms, drones));
  const drillGroup = joint(body, 'rotating-massive-stepped-drill', 0, 4.15, 7.5), drill = batch();
  for (let step = 0; step < 15; step++) {
    const size = 5.1 * (1 - step / 16), z = .3 + step * .6, twist = step * .28;
    const core = box(drillGroup, `twisted-drill-core-stage-${step}`, step % 2 ? 'copper' : 'shadow', [0, 0, z], [size, size, .6], { drillStage: step });
    core.rotation.z = twist;
    for (let tooth = 0; tooth < 4; tooth++) {
      const angle = twist + tooth * Math.PI / 2, radius = size * .5 + .01;
      drill.add('edge', [Math.cos(angle) * radius, Math.sin(angle) * radius, z + .04], [.5, .28, .44], [0, 0, angle]);
    }
    if (step < 13) for (const side of [-1, 1]) {
      const offset = side * size * .32;
      drill.add('patina', [Math.cos(twist) * offset, Math.sin(twist) * offset, z + .305], [.14, size * .65, .02], [0, 0, twist]);
    }
  }
  drill.add('edge', [0, 0, 8.85], [.35, .35, .3]); drill.finish(drillGroup, 'helical-drill-cutters');
  const segments = articulateHull(body, rooms, ramp, drillGroup, cutawayParts);
  sealRoomJoints(segments);
  hoverNodes.forEach((node, index) => { node.segmentIndex = Math.floor(index / 2); });
  const arcsGeometry = new THREE.BufferGeometry();
  arcsGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(hoverNodes.length * 6 * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  const arcs = new THREE.LineSegments(arcsGeometry, electricalMaterial); arcs.name = 'blue-electrical-hover-arcs'; arcs.frustumCulled = false; root.add(arcs);
  let disposed = false;
  root.userData = { previewOnly: true, type: 'copper-mega-drill', health: 1000000, maxHp: 1000000, cutHits: 5,
    spec: MEGA_DRILL_SPEC, body, segments, rooms, reactors, drillGroup, cutawayParts, manufacturingArms: arms, drones,
    hoverNodes, arcs, cutawayEnabled: false, disposeVisuals() {
      if (disposed) return; disposed = true; arcsGeometry.dispose();
      root.traverse(object => { if (object.isInstancedMesh) object.dispose(); });
    } };
  animateCopperMegaDrill(root, 0); return root;
}

export function setMegaDrillCutaway(root, enabled) {
  if (!root?.userData?.cutawayParts) throw new TypeError('Expected a Copper Mega Drill model.');
  root.userData.cutawayEnabled = Boolean(enabled);
  for (const part of root.userData.cutawayParts) part.visible = !enabled;
}

/** Local animation preserves any caller-owned world position and heading. */
export function animateCopperMegaDrill(root, time, motion = {}) {
  if (!root?.userData?.drillGroup) throw new TypeError('Expected a Copper Mega Drill model.');
  const t = Number.isFinite(time) ? time : 0, d = root.userData;
  for (const crew of d.rooms[3].userData.crew) animateColosseumEnemy(crew, t, 0, 'chase');
  const distance = Number.isFinite(motion.wormDistance) ? motion.wormDistance : t * 3.4;
  if (d.segmentDistance !== distance) {
    const poses = getMegaDrillSegmentPoses(distance);
    d.segments.forEach((segment, index) => {
      const pose = poses[index]; segment.position.set(pose.x, 0, pose.z); segment.rotation.y = pose.angle;
    });
    d.segmentDistance = distance;
  }
  d.body.position.y = Math.sin(t * .8) * .045; d.drillGroup.rotation.z = t * .65;
  for (const core of d.reactors) {
    core.position.y = core.userData.baseY + Math.sin(t * 1.5 + core.userData.offset) * .16;
    core.rotation.y = t * .24 + core.userData.offset; core.rotation.z = Math.sin(t + core.userData.offset) * .055;
  }
  for (const arm of d.manufacturingArms) {
    arm.userData.shoulder.rotation.x = Math.sin(t * .8 + arm.userData.offset) * .16;
    arm.userData.elbow.rotation.z = Math.sin(t * 1.1 + arm.userData.offset) * .2;
  }
  for (const craft of d.drones) { craft.position.y = craft.userData.baseY + Math.sin(t * 1.7 + craft.userData.offset) * .12; craft.rotation.y = Math.sin(t * .7 + craft.userData.offset) * .12; }
  const positions = d.arcs.geometry.attributes.position.array;
  let at = 0;
  d.hoverNodes.forEach((node, index) => {
    const room = d.segments[node.segmentIndex], angle = room.rotation.y;
    const localZ = node.z - room.userData.restZ;
    const nodeX = room.position.x + Math.cos(angle) * node.x + Math.sin(angle) * localZ;
    const nodeZ = room.position.z - Math.sin(angle) * node.x + Math.cos(angle) * localZ;
    for (let segment = 0; segment < 6; segment++) for (const endpoint of [segment, segment + 1]) {
      const fraction = endpoint / 6, jitter = Math.sin(t * 17 + endpoint * 2.3 + index) * Math.sin(fraction * Math.PI) * .15;
      positions[at++] = nodeX + jitter; positions[at++] = .08 + fraction * (.43 + d.body.position.y);
      positions[at++] = nodeZ + Math.cos(t * 13 + endpoint + index) * Math.sin(fraction * Math.PI) * .12;
    }
  });
  d.arcs.geometry.attributes.position.needsUpdate = true;
  d.arcs.geometry.computeBoundingBox();
}
