import { ULTRA_ISLAND } from './mech-ultra-cover.js';

const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = value => Math.max(0, Math.min(1, finite(value)));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const RIGHT_IDLE_YAW = Math.atan2(.18, 1), RIGHT_IDLE_SLOPE = .3 / Math.hypot(1, .18);

export const MECH_SPIDER_TANK_ULTRA_TYPE = 'mech-spider-tank-ultra';
export const ULTRA_FORTRESS_LENGTH = 6.6;
export const ULTRA_GUN_IDS = freeze(Array.from({ length: 12 }, (_, i) => `ultra-machine-gun-${i}`));
export const ULTRA_FABRICATOR_IDS = freeze(Array.from({ length: 5 }, (_, i) => `ultra-fabricator-${i}`));
export const ULTRA_REACTOR_IDS = freeze(Array.from({ length: 5 }, (_, i) => `ultra-reactor-${i}`));
export const ULTRA_ARM_LENGTHS = freeze({ right: 26.4, left: 19.8 });
export const ULTRA_MIN_SLAM_REACH = 15;
export const ULTRA_HINGE_FORWARD_CLEARANCE = .5;
export const ULTRA_SHOULDERS = freeze({ right: { x: 16.8, y: 18.6, z: 12 }, left: { x: -13.2, y: 12, z: 0 } });

const room = (id, frame, x, floorY, width, depth, height = 6.6, z = 0) => ({
  id, frame, x, z, width, depth, floorY, roofY: floorY + height, height,
  floorId: `${id}-floor`, roofId: `${id}-roof`, wallId: `${id}-wall`,
});
export const ULTRA_MAIN_ROOMS = freeze([
  room('ultra-leg-room', 'body', 0, 5.4, 14.4, 12),
  ...['engine-deck', 'workshop', 'gun-deck', 'bridge'].map((name, i) => ({
    ...room(`ultra-${name}`, 'body', 0, 12 + i * 6.6, 26.4, 18),
    ...(name === 'bridge' ? { name: 'Hidden control room', hiddenControl: true } : {}),
  })),
]);
export const ULTRA_ARM_ROOMS = freeze(['right', 'left'].flatMap(side => Array.from({ length: 3 }, (_, i) =>
  room(`ultra-${side}-arm-room-${i}`, `${side}Arm`, (i + .5) * 6.6, -i * .6, 6.6, side === 'right' && i === 0 ? 2.4 : 6.6))));
export const ULTRA_ROOMS = freeze([...ULTRA_MAIN_ROOMS, ...ULTRA_ARM_ROOMS]);

const surface = (id, frame, x, z, width, depth, topY, roomId) => ({ id, frame, x, z, width, depth, topY, roomId });
export const ULTRA_FLOORS = freeze(ULTRA_ROOMS.flatMap((r, index) => {
  if (r.frame !== 'body') {
    const armIndex = Math.round(r.x / 6.6 - .5), minX = r.x - 3.3 + (armIndex ? .6 : 0), maxX = r.x + 3.3 - (armIndex < 2 ? .6 : 0);
    return [surface(r.floorId, r.frame, (minX + maxX) / 2, r.z, maxX - minX, r.depth, r.floorY, r.id)];
  }
  if (index === 0) return [surface(r.floorId, r.frame, r.x, r.z, r.width, r.depth, r.floorY, r.id)];
  // A continuous open stairwell behind the main usable deck prevents ceiling clipping.
  const frontZ = index === 1 ? 3.2 : 2.9, frontDepth = index === 1 ? 11.6 : 12.2;
  return [surface(r.floorId, r.frame, 0, frontZ, 26.4, frontDepth, r.floorY, r.id),
    surface(r.floorId, r.frame, 0, -8.6, 26.4, .8, r.floorY, r.id),
    ...[-1, 1].map(side => surface(r.floorId, r.frame, side * 11.55, index === 1 ? -5.5 : -5.8, 3.3, index === 1 ? 5.8 : 5.2, r.floorY, r.id))];
}).concat([surface('ultra-leg-stair-landing', 'body', 6.6, -3.8, 1.2, 2.6, 12, 'ultra-engine-deck'),
  surface('ultra-workshop-front-porch', 'body', 14.1, 10, 7.8, 2.4, 18.6, 'ultra-workshop'),
  surface('ultra-right-hinge-landing', 'body', 16.8, 11, 2.4, 2, 18.6, 'ultra-workshop'),
  surface('ultra-right-boarding-walkway', 'rightArm', 21.9, 0, 4.2, 2.4, -1.2, 'ultra-right-arm-room-2')]));

function stairs(id, frame, from, to, width, fromRoom, toRoom, steps = 22) {
  const dx = to.x - from.x, dz = to.z - from.z;
  return { id, frame, from, to, width, steps, fromRoom, toRoom, length: Math.hypot(dx, dz),
    minX: Math.min(from.x, to.x) - (dx === 0 ? width / 2 : 0), maxX: Math.max(from.x, to.x) + (dx === 0 ? width / 2 : 0),
    minZ: Math.min(from.z, to.z) - (dz === 0 ? width / 2 : 0), maxZ: Math.max(from.z, to.z) + (dz === 0 ? width / 2 : 0) };
}
export const ULTRA_STAIRS = freeze([
  stairs('ultra-leg-room-stairs', 'body', { x: -6, y: 5.4, z: -3.8 }, { x: 6, y: 12, z: -3.8 }, 2.6, ULTRA_MAIN_ROOMS[0].id, ULTRA_MAIN_ROOMS[1].id),
  ...Array.from({ length: 3 }, (_, i) => {
    const sign = i % 2 ? -1 : 1;
    const z = i % 2 ? -4.3 : -6.9;
    return stairs(`ultra-head-stairs-${i}`, 'body', { x: -sign * 10, y: 12 + i * 6.6, z },
      { x: sign * 10, y: 18.6 + i * 6.6, z }, 2.4, ULTRA_MAIN_ROOMS[i + 1].id, ULTRA_MAIN_ROOMS[i + 2].id);
  }),
  ...['right', 'left'].flatMap(side => Array.from({ length: 2 }, (_, i) => stairs(`ultra-${side}-arm-stairs-${i}`, `${side}Arm`,
    { x: (i + 1) * 6.6 - .6, y: -i * .6, z: 0 }, { x: (i + 1) * 6.6 + .6, y: -(i + 1) * .6, z: 0 }, 2.4,
    `ultra-${side}-arm-room-${i}`, `ultra-${side}-arm-room-${i + 1}`, 3))),
  stairs('ultra-drill-boarding-stairs', 'rightArm', { x: 24, y: -1.2, z: 0 }, { x: 26.4, y: -2.4, z: 0 },
    2.4, 'ultra-right-arm-room-2', 'ultra-boarding-ground', 6),
]);

export const ULTRA_DOOR_OPENINGS = freeze([
  { id: 'ultra-right-shoulder-door', frame: 'body', axis: 'z', x: 11.4, z: 9, width: 2.4, minY: 18.6, maxY: 23.4,
    connects: ['ultra-workshop', 'ultra-right-arm-room-0'] },
  { id: 'ultra-left-shoulder-door', frame: 'body', axis: 'x', x: -13.2, z: 0, width: 3, minY: 12, maxY: 16.8,
    connects: ['ultra-engine-deck', 'ultra-left-arm-room-0'] },
  ...['right', 'left'].flatMap(side => [1, 2].map(i => ({ id: `ultra-${side}-arm-door-${i}`, frame: `${side}Arm`, axis: 'x',
    x: i * 6.6, z: 0, width: 2.8, minY: -i * .6, maxY: 4.8 - i * .6,
    connects: [`ultra-${side}-arm-room-${i - 1}`, `ultra-${side}-arm-room-${i}`] }))),
  { id: 'ultra-drill-boarding-door', frame: 'rightArm', axis: 'x', x: 19.8, z: 0, width: 2.8, minY: -1.2, maxY: 3.6,
    connects: ['ultra-right-arm-room-2', 'ultra-right-boarding-walkway'] },
]);

const box = (id, frame, x, y, z, width, height, depth, color = 'copper', extra = {}) =>
  ({ id, structuralId: id, frame, x, y, z, width, height, depth, color, ...extra });
const watchWindow = (roomIndex, face, across) => {
  const r = ULTRA_MAIN_ROOMS[roomIndex], axis = ['left', 'right'].includes(face) ? 'x' : 'z';
  const sign = ['front', 'right'].includes(face) ? 1 : -1;
  return box(`${r.id}-window-0`, 'body', axis === 'x' ? sign * (r.width / 2 - .3) : across,
    r.floorY + 2.15, axis === 'z' ? sign * (r.depth / 2 - .3) : across,
    axis === 'x' ? .6 : 1, 1, axis === 'z' ? .6 : 1, 'glass', {
      roomId: r.id, roomIndex, axis, face, paneWidth: 1, normal: { x: axis === 'x' ? sign : 0, z: axis === 'z' ? sign : 0 },
    });
};
/** Four irregularly placed one-metre watch ports; the hidden top room has none. */
export const ULTRA_WINDOWS = freeze([
  watchWindow(0, 'front', -3.025), watchWindow(1, 'right', -1.925),
  watchWindow(2, 'left', .9), watchWindow(3, 'rear', 11.275),
]);

/** Tile solid wall rectangles around the exact glass and door apertures. */
function roomFaceWalls(r, axis, sign) {
  const across = axis === 'x' ? 'z' : 'x', span = axis === 'x' ? r.depth : r.width;
  const plane = sign * ((axis === 'x' ? r.width : r.depth) / 2 - .3);
  const openings = [
    ...ULTRA_WINDOWS.filter(window => window.roomId === r.id && window.axis === axis && Math.sign(window[axis]) === sign)
      .map(window => ({ at: window[across], width: 1, minY: window.y - .5, maxY: window.y + .5 })),
    ...ULTRA_DOOR_OPENINGS.filter(door => door.frame === 'body' && door.axis === axis && Math.sign(door[axis]) === sign
      && door.connects.includes(r.id)).map(door => ({ at: door[across], width: door.width, minY: door.minY, maxY: door.maxY })),
  ];
  const levels = [...new Set([r.floorY, r.roofY, ...openings.flatMap(opening => [opening.minY, opening.maxY])])].sort((a, b) => a - b);
  const result = [];
  for (let index = 1; index < levels.length; index++) {
    const low = levels[index - 1], high = levels[index], y = (low + high) / 2;
    const gaps = openings.filter(opening => y > opening.minY && y < opening.maxY).sort((a, b) => a.at - b.at);
    let start = -span / 2;
    for (const gap of [...gaps, { at: span / 2, width: 0 }]) {
      const end = gap.at - gap.width / 2, width = end - start;
      if (width > 1e-6) result.push(box(r.wallId, r.frame, axis === 'x' ? plane : (start + end) / 2,
        y, axis === 'z' ? plane : (start + end) / 2, axis === 'x' ? .6 : width, high - low,
        axis === 'z' ? .6 : width, sign < 0 ? 'slate' : 'copper', { roomId: r.id }));
      start = Math.max(start, gap.at + gap.width / 2);
    }
  }
  return result;
}

const walls = [];
for (const r of ULTRA_ROOMS) {
  const t = .6, centerY = (r.floorY + r.roofY) / 2;
  if (r.frame === 'body') {
    for (const axis of ['x', 'z']) for (const sign of [-1, 1]) walls.push(...roomFaceWalls(r, axis, sign));
  } else {
    for (const z of [-r.depth / 2 + .3, r.depth / 2 - .3]) {
      // The proximal hangar's broad side entrances accommodate the rotating porch hinge.
      const hinge = r.id === 'ultra-right-arm-room-0';
      walls.push(box(r.wallId, r.frame, hinge ? 6 : r.x, centerY, z, hinge ? 1.2 : r.width, r.height, .6, 'slate'));
    }
    if (r.x > 3.3) {
      const x = r.x - 3.3;
      for (const z of [-2.3, 2.3]) walls.push(box(r.wallId, r.frame, x, centerY, z, .6, r.height, 1.4));
      walls.push(box(r.wallId, r.frame, x, r.roofY - .75, 0, .6, 1.5, 2.8, 'edge'));
    }
  }
}
walls.push(box('ultra-porch-rear-rail', 'body', 15.3, 19.05, 8.8, 5.4, .9, .35, 'edge'));
walls.push(box('ultra-porch-front-rail', 'body', 12.9, 19.05, 11.2, 5.4, .9, .35, 'edge'));
export const ULTRA_WALLS = freeze(walls);
export const ULTRA_GUN_MOUNTS = freeze(Array.from({ length: 12 }, (_, index) => {
  const side = index < 8 ? 0 : index < 10 ? -1 : 1, level = index < 8 ? Math.floor(index / 2) : index % 2 + 1;
  return { id: ULTRA_GUN_IDS[index], weaponId: ULTRA_GUN_IDS[index], frame: 'body', index,
    x: side ? side * 13.3 : (index % 2 ? 1 : -1) * 10.6, y: 14.8 + level * 6.6,
    z: side ? 3 : 9.5, angle: side * Math.PI / 2, muzzleLength: 2.4 };
}));
export const ULTRA_CREW_SEATS = freeze([
  ...ULTRA_WINDOWS.map(window => ({
    x: window.x - window.normal.x * 1.2, y: ULTRA_MAIN_ROOMS[window.roomIndex].floorY, z: window.z - window.normal.z * 1.2,
    angle: Math.atan2(window.normal.x, window.normal.z), scale: 1, roomId: window.roomId, frame: 'body',
    roomIndex: window.roomIndex, id: `ultra-crew-seat-${window.roomIndex}`, role: 'window-watcher', windowId: window.id,
  })),
  { x: -4, y: ULTRA_MAIN_ROOMS[4].floorY, z: 2.2, angle: 0, scale: 1, roomId: 'ultra-bridge', frame: 'body', roomIndex: 4,
    id: 'ultra-crew-seat-4', role: 'control-operator', hiddenControl: true },
]);
export const ULTRA_REACTORS = freeze(ULTRA_MAIN_ROOMS.map((r, i) => ({
  id: ULTRA_REACTOR_IDS[i], frame: 'body', roomId: r.id, x: 0, y: r.floorY + 2, z: -2.4,
  width: 2.4, height: 3.6, depth: 2.4, hp: 200000000,
})));
export const ULTRA_FABRICATORS = freeze(ULTRA_MAIN_ROOMS.map((r, i) => ({
  id: ULTRA_FABRICATOR_IDS[i], weaponId: ULTRA_FABRICATOR_IDS[i], frame: 'body', roomId: r.id,
  x: r.width / 2 - 3.6, y: r.floorY + .8, z: -1.8,
})));
export const ULTRA_LAYOUT = freeze({ type: MECH_SPIDER_TANK_ULTRA_TYPE, width: 26.4, height: 26.4, depth: 18,
  headBottomY: 12, headTopY: 38.4, voxelSize: .55, voxelBudget: 160000, wallThickness: .6,
  mainRooms: ULTRA_MAIN_ROOMS, armRooms: ULTRA_ARM_ROOMS, rooms: ULTRA_ROOMS, floors: ULTRA_FLOORS,
  stairs: ULTRA_STAIRS, walls: ULTRA_WALLS, windows: ULTRA_WINDOWS, doors: ULTRA_DOOR_OPENINGS,
  machineGuns: ULTRA_GUN_MOUNTS, crewSeats: ULTRA_CREW_SEATS, reactors: ULTRA_REACTORS, fabricators: ULTRA_FABRICATORS,
  shoulders: ULTRA_SHOULDERS, armLengths: ULTRA_ARM_LENGTHS });
export const MECH_ULTRA_LAYOUT = ULTRA_LAYOUT;

/** Local-to-owner frame: +X runs along either arm; axes form a right-handed basis. */
export function ultraArmPose(owner = {}, side = 'right') {
  if (!ULTRA_SHOULDERS[side]) throw new RangeError('Ultra arm side must be right or left.');
  const state = owner.ultra || owner, shoulder = ULTRA_SHOULDERS[side], baseLength = ULTRA_ARM_LENGTHS[side];
  let dx = side === 'right' ? 1 : -1, dy = side === 'right' ? .3 : .12, dz = .18, length = baseLength;
  if (side === 'right' && Number.isFinite(state.targetX) && Number.isFinite(state.targetZ)) {
    const target = ultraLocalPoint(owner, { x: state.targetX, y: finite(state.targetY, 2), z: state.targetZ }, 'body');
    const phase = state.phase || 'ready';
    const warning = clamp(1 - finite(state.phaseTime) / 2), recovery = smooth(state.retractProgress ?? state.progress);
    let progress = phase === 'down' ? 1 : phase === 'slam' ? clamp(state.slamProgress) ** 2 : phase === 'retract' ? 1 - recovery : 0;
    if (state.armDown === true) progress = 1;
    const aimed = { x: target.x - shoulder.x, y: target.y - shoulder.y, z: target.z - shoulder.z };
    // Load the heavy arm before the drop, then accelerate into the same locked
    // endpoint. These are physical frames shared by the mesh and its floors.
    const horizontal = Math.hypot(aimed.x, aimed.z) || 1;
    const aimBlend = phase === 'ready' ? 0 : phase === 'warning' ? smooth(warning) : phase === 'retract' ? 1 - recovery : 1;
    // Blending vectors can collapse an antipodal aim to zero. Interpolate the
    // shortest yaw instead, retaining a unit horizontal direction throughout.
    const targetYaw = Math.atan2(aimed.z, aimed.x), turn = targetYaw - RIGHT_IDLE_YAW;
    const yaw = RIGHT_IDLE_YAW + Math.atan2(Math.sin(turn), Math.cos(turn)) * aimBlend;
    dx = Math.cos(yaw); dz = Math.sin(yaw);
    const raisedDy = phase === 'warning' ? lerp(RIGHT_IDLE_SLOPE, .68, smooth(warning / .75))
      : phase === 'slam' ? .68 : RIGHT_IDLE_SLOPE;
    dy = lerp(raisedDy, aimed.y / horizontal, progress);
    const directionLength = Math.hypot(dx, dy, dz); dx /= directionLength; dy /= directionLength; dz /= directionLength;
    length = lerp(baseLength, Math.min(baseLength * 1.8, Math.hypot(aimed.x, aimed.y, aimed.z)), progress);
  } else if (side === 'left') {
    const phase = state.fabricationPhase;
    if (['dipping', 'building', 'dip', 'scoop', 'cooling'].includes(phase)) {
      const progress = phase === 'dipping' ? clamp(1 - finite(state.fabricationTime, 0) / 1.2) : 1;
      dx = lerp(-.974, -.147, progress); dy = lerp(-.117, -.662, progress); dz = lerp(.195, -.735, progress);
    } else if (phase === 'placing') {
      const progress = clamp(1 - finite(state.fabricationTime) / 1.5), startYaw = -1.768;
      const origin = ultraPoint(owner, shoulder), target = ultraLocalPoint(owner, {
        x: Math.max(-ULTRA_ISLAND.halfWidth + .8, Math.min(ULTRA_ISLAND.halfWidth - .8, origin.x)),
        y: origin.y, z: Math.max(-ULTRA_ISLAND.halfDepth + .8, Math.min(ULTRA_ISLAND.halfDepth - .8, origin.z)),
      });
      const aimX = target.x - shoulder.x, aimZ = target.z - shoulder.z, reach = Math.hypot(aimX, aimZ);
      const endYaw = reach > 1e-6 ? Math.atan2(aimZ, aimX) : Math.PI / 2;
      const yaw = startYaw + Math.atan2(Math.sin(endYaw - startYaw), Math.cos(endYaw - startYaw)) * progress;
      // The held anchor is (17.4, .6) in this fixed-length arm. Raise the
      // placement arc only as far as needed to reach the nearby island shore.
      const handRadius = Math.hypot(17.4, .6), baseReach = 17.4 * Math.sqrt(1 - .652 ** 2) + .6 * .652;
      const horizontalReach = Math.min(handRadius - .02, Math.max(baseReach, reach + .1));
      const endPitch = -Math.acos(horizontalReach / handRadius) - Math.atan2(.6, 17.4);
      dy = lerp(-.662, Math.sin(endPitch), progress);
      const horizontal = Math.sqrt(1 - dy * dy); dx = Math.cos(yaw) * horizontal; dz = Math.sin(yaw) * horizontal;
    } else { dy = -.12; dz = .2; }
  }
  const magnitude = Math.hypot(dx, dy, dz); dx /= magnitude; dy /= magnitude; dz /= magnitude;
  const horizontal = Math.hypot(dx, dz) || 1;
  const axisX = { x: dx, y: dy, z: dz }, axisZ = { x: -dz / horizontal, y: 0, z: dx / horizontal };
  const axisY = { x: -dy * dx / horizontal, y: horizontal, z: -dy * dz / horizontal };
  return { side, frame: `${side}Arm`, origin: { ...shoulder }, direction: axisX, axisX, axisY, axisZ,
    length, baseLength, scaleX: length / baseLength, yaw: Math.atan2(-dz, dx), pitch: Math.asin(dy) };
}
export function ultraFramePose(owner, frame = 'body') {
  if (frame === 'body') return { origin: { x: 0, y: 0, z: 0 }, axisX: { x: 1, y: 0, z: 0 }, axisY: { x: 0, y: 1, z: 0 }, axisZ: { x: 0, y: 0, z: 1 }, scaleX: 1 };
  return ultraArmPose(owner, frame === 'rightArm' ? 'right' : frame === 'leftArm' ? 'left' : frame);
}
export function ultraPoint(owner = {}, point, frame = point.frame || 'body') {
  const pose = ultraFramePose(owner, frame), x = finite(point.x) * pose.scaleX, y = finite(point.y), z = finite(point.z);
  const local = { x: pose.origin.x + pose.axisX.x * x + pose.axisY.x * y + pose.axisZ.x * z,
    y: pose.origin.y + pose.axisX.y * x + pose.axisY.y * y + pose.axisZ.y * z,
    z: pose.origin.z + pose.axisX.z * x + pose.axisY.z * y + pose.axisZ.z * z };
  const sine = Math.sin(finite(owner.angle)), cosine = Math.cos(finite(owner.angle));
  return { x: finite(owner.x) + cosine * local.x + sine * local.z, y: finite(owner.elevation) + local.y,
    z: finite(owner.z) - sine * local.x + cosine * local.z };
}
export function ultraLocalPoint(owner = {}, point, frame = 'body') {
  const sine = Math.sin(finite(owner.angle)), cosine = Math.cos(finite(owner.angle));
  const dx = finite(point.x) - finite(owner.x), dz = finite(point.z) - finite(owner.z);
  const local = { x: cosine * dx - sine * dz, y: finite(point.y) - finite(owner.elevation), z: sine * dx + cosine * dz };
  const pose = ultraFramePose(owner, frame), x = local.x - pose.origin.x, y = local.y - pose.origin.y, z = local.z - pose.origin.z;
  return { x: (x * pose.axisX.x + y * pose.axisX.y + z * pose.axisX.z) / pose.scaleX,
    y: x * pose.axisY.x + y * pose.axisY.y + z * pose.axisY.z, z: x * pose.axisZ.x + y * pose.axisZ.y + z * pose.axisZ.z };
}
export function ultraDrillTip(owner) { return ultraPoint(owner, { x: 26.4, y: 0, z: 0 }, 'rightArm'); }
export function ultraHandPoint(owner) { return ultraPoint(owner, { x: 17.4, y: .6, z: 0 }, 'leftArm'); }
/** Lock warning, impact and boarding stairs to one reachable ground pose. */
export function ultraSlamTarget(owner, target) {
  const shoulder = ultraPoint(owner, ULTRA_SHOULDERS.right), y = 2;
  const local = ultraLocalPoint(owner, { x: finite(target.x), y, z: finite(target.z) });
  local.z = Math.max(ULTRA_SHOULDERS.right.z + ULTRA_HINGE_FORWARD_CLEARANCE, local.z);
  const ahead = ultraPoint(owner, local);
  let dx = ahead.x - shoulder.x, dz = ahead.z - shoulder.z;
  // Too steep a slam leaves the final stair tread suspended above the ground.
  // The height-derived lower bound also covers small owner elevation offsets.
  const minimum = Math.max(ULTRA_MIN_SLAM_REACH, Math.abs(y - shoulder.y) * .88);
  const extension = Math.max(1, minimum / Math.hypot(dx, dz)); dx *= extension; dz *= extension;
  const radius = Math.sqrt(Math.max(0, (ULTRA_ARM_LENGTHS.right * 1.8) ** 2 - (y - shoulder.y) ** 2));
  const scale = Math.min(1, radius / (Math.hypot(dx, dz) || 1));
  return { x: shoulder.x + dx * scale, y, z: shoulder.z + dz * scale };
}
export function ultraGunMuzzle(owner, index) {
  const mount = ULTRA_GUN_MOUNTS[index];
  if (!mount) throw new RangeError('Ultra gun index must be from 0 to 11.');
  const origin = ultraPoint(owner, mount), state = owner.ultra || owner;
  let dx = Math.sin(finite(owner.angle) + mount.angle), dy = 0, dz = Math.cos(finite(owner.angle) + mount.angle);
  const targetX = finite(state.gunTargetX, state.targetX), targetY = finite(state.gunTargetY, finite(state.targetY, 1.3)), targetZ = finite(state.gunTargetZ, state.targetZ);
  if (Number.isFinite(targetX) && Number.isFinite(targetZ)) {
    dx = targetX - origin.x; dy = targetY - origin.y; dz = targetZ - origin.z;
  }
  const length = Math.hypot(dx, dy, dz) || 1;
  return { x: origin.x + dx / length * mount.muzzleLength, y: origin.y + dy / length * mount.muzzleLength, z: origin.z + dz / length * mount.muzzleLength };
}
