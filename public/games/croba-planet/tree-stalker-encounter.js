import { EYE_HEIGHT, WORLD_BOUNDS } from "./terrain.js";
import { getForestCollision, resolveForestMovement } from "./forest-terrain.js";
import { TREE_STALKER_CONTACT_METERS } from "./tree-stalker.js";
import { TREE_STALKER_HEIGHT, TREE_STALKER_MOUTH_LOCAL } from "./tree-stalker-anatomy.js";

export const TREE_STALKER_LIFT_SECONDS = 1.6;
export const TREE_STALKER_FEEDING_SECONDS = 2.4;
export const TREE_STALKER_BLACKOUT_SECONDS = .35;
export const TREE_STALKER_RESCUE_COOLDOWN = 5;
export const TREE_STALKER_CAMERA_MARGIN = 8;
const SCALE = 25;
const CAMERA_RADIUS = 2, CAMERA_SPEED = 96;
const TOTAL_SECONDS = TREE_STALKER_LIFT_SECONDS + TREE_STALKER_FEEDING_SECONDS + TREE_STALKER_BLACKOUT_SECONDS;
const finitePoint = (point) => Boolean(point && [point.x, point.y, point.z].every(Number.isFinite));
const copy = (point) => ({ x: point.x, y: point.y, z: point.z });
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };

/** @typedef {{x:number,y:number,z:number}} StalkerEncounterPoint */
/** @typedef {{x:number,y:number,z:number,heading:number,heightMeters:number}} CaptorPose */
/** target is the mouth/look point; cameraPosition is the cinematic eye only.
 * Physical player feet are never moved by this sequence.
 * @typedef {{stalkerId:string,phase:'grabbed'|'feeding',elapsed:number,progress:number,age:number,
 * target:StalkerEncounterPoint,cameraPosition:StalkerEncounterPoint,holdCamera:StalkerEncounterPoint,tubeTarget:StalkerEncounterPoint,
 * tubeProgress:number,startCamera:StalkerEncounterPoint,startHealth:number,captorPose:CaptorPose,
 * complete:boolean}} TreeStalkerEncounter
 */

/** Canonical model mouth in metres, with heading 0 facing +SIM x. */
export function getTreeStalkerMouth(stalker) {
  if (!finitePoint(stalker)) return null;
  const scale = Number.isFinite(stalker.heightMeters) && stalker.heightMeters > 0 ? stalker.heightMeters / TREE_STALKER_HEIGHT : 1;
  const heading = Number.isFinite(stalker.heading) ? stalker.heading : 0;
  const forward = TREE_STALKER_MOUTH_LOCAL[2] * SCALE * scale;
  const point = { x: stalker.x + Math.cos(heading) * forward,
    y: stalker.y + Math.sin(heading) * forward,
    z: stalker.z + TREE_STALKER_MOUTH_LOCAL[1] * SCALE * scale };
  return finitePoint(point) ? point : null;
}

function holdPoint(world, stalker, mouth) {
  const desired = { x: clamp(mouth.x + Math.cos(stalker.heading) * 1.5 * SCALE,
    WORLD_BOUNDS.minX + TREE_STALKER_CAMERA_MARGIN, WORLD_BOUNDS.maxX - TREE_STALKER_CAMERA_MARGIN),
  y: clamp(mouth.y + Math.sin(stalker.heading) * 1.5 * SCALE,
    WORLD_BOUNDS.minY + TREE_STALKER_CAMERA_MARGIN, WORLD_BOUNDS.maxY - TREE_STALKER_CAMERA_MARGIN), z: mouth.z };
  return sweepCamera(world, mouth, desired);
}

function helmetPoint(camera, mouth) {
  const dx = mouth.x - camera.x, dy = mouth.y - camera.y, dz = mouth.z - camera.z;
  const scale = .08 * SCALE / (Math.hypot(dx, dy, dz) || 1);
  return { x: camera.x + dx * scale, y: camera.y + dy * scale, z: camera.z + dz * scale };
}

function clearCamera(world, point) {
  if (point.x < WORLD_BOUNDS.minX || point.x > WORLD_BOUNDS.maxX
    || point.y < WORLD_BOUNDS.minY || point.y > WORLD_BOUNDS.maxY
    || getForestCollision(world, point, CAMERA_RADIUS)) return false;
  const foot = { x: point.x, y: point.y, z: point.z - CAMERA_RADIUS };
  const resolved = resolveForestMovement(world, foot, foot, CAMERA_RADIUS * 2, CAMERA_RADIUS);
  return Math.hypot(resolved.x - point.x, resolved.y - point.y) < 1e-6;
}

/** Stop before the first obstruction; never slide the view through a trunk. */
function sweepCamera(world, from, to) {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const pointAt = (t) => ({ x: from.x + dx * t, y: from.y + dy * t, z: from.z + dz * t });
  const samples = Math.max(1, Math.ceil(Math.hypot(dx, dy, dz) / (CAMERA_RADIUS / 2)));
  for (let sample = 1; sample <= samples; sample++) {
    const fraction = sample / samples;
    if (clearCamera(world, pointAt(fraction))) continue;
    let safe = (sample - 1) / samples, blocked = fraction;
    for (let iteration = 0; iteration < 14; iteration++) {
      const middle = (safe + blocked) / 2;
      if (clearCamera(world, pointAt(middle))) safe = middle; else blocked = middle;
    }
    return pointAt(safe);
  }
  return copy(to);
}

function advanceCamera(world, previous, desired, dt) {
  const dx = desired.x - previous.x, dy = desired.y - previous.y, dz = desired.z - previous.z;
  const distance = Math.hypot(dx, dy, dz), budget = CAMERA_SPEED * dt;
  const fraction = Math.min(1, budget / (distance || 1));
  const limited = { x: previous.x + dx * fraction, y: previous.y + dy * fraction, z: previous.z + dz * fraction };
  let safe = sweepCamera(world, previous, limited);
  const used = Math.hypot(safe.x - previous.x, safe.y - previous.y, safe.z - previous.z);
  // A low obstruction may block the pull while still allowing the lift.
  if (safe.z < limited.z && used < budget) safe = sweepCamera(world, safe,
    { x: safe.x, y: safe.y, z: Math.min(limited.z, safe.z + budget - used) });
  return safe;
}

/** Start only a real dry-land catch, without interrupting another predator. */
export function beginTreeStalkerEncounter(world, stalker) {
  const player = world?.player;
  if (!world || !finitePoint(player) || !Number.isFinite(player.health) || player.health <= 0
    || player.swimming || player.underwater || !finitePoint(stalker) || typeof stalker.id !== "string"
    || !Array.isArray(world.treeStalkers) || !world.treeStalkers.includes(stalker)
    || world.sandWormEncounter || world.treeStalkerEncounter || world.centipedeEncounter || world.squidEncounter
    || Math.hypot(player.x - stalker.x, player.y - stalker.y, player.z - stalker.z) > TREE_STALKER_CONTACT_METERS * SCALE + .001) return false;
  // Face the caught helmet once, then keep the entire captor pose fixed.
  if (Math.hypot(player.x - stalker.x, player.y - stalker.y) > 1e-6)
    stalker.heading = Math.atan2(player.y - stalker.y, player.x - stalker.x);
  else if (!Number.isFinite(stalker.heading)) stalker.heading = 0;
  const target = getTreeStalkerMouth(stalker);
  if (!target) return false;
  const start = { x: player.x, y: player.y, z: player.z + EYE_HEIGHT };
  if (!clearCamera(world, start) || !clearCamera(world, target)) return false;
  const held = holdPoint(world, stalker, target);
  const captorPose = { ...copy(stalker), heading: stalker.heading,
    heightMeters: Number.isFinite(stalker.heightMeters) && stalker.heightMeters > 0 ? stalker.heightMeters : TREE_STALKER_HEIGHT };
  stalker.speed = 0;
  world.treeStalkerEncounter = { stalkerId: stalker.id, phase: "grabbed", elapsed: 0, progress: 0, age: 0,
    target, cameraPosition: copy(start), holdCamera: held, tubeTarget: helmetPoint(start, target), tubeProgress: 0,
    startCamera: start, startHealth: player.health, captorPose, complete: false };
  return true;
}

/** Cancel safely; an interrupted drain cannot produce a later unrelated death. */
export function releaseTreeStalkerEncounter(world) {
  if (!world || typeof world !== "object") return;
  const encounter = world.treeStalkerEncounter;
  const stalker = Array.isArray(world.treeStalkers)
    ? world.treeStalkers.find((entry) => entry?.id === encounter?.stalkerId) : undefined;
  if (stalker) {
    stalker.attackCooldown = Math.max(Number.isFinite(stalker.attackCooldown) ? stalker.attackCooldown : 0, TREE_STALKER_RESCUE_COOLDOWN);
    stalker.speed = 0;
  }
  if (encounter && !encounter.complete && world.player && Number.isFinite(encounter.startHealth))
    world.player.health = Math.max(Number.isFinite(world.player.health) ? world.player.health : 0, encounter.startHealth);
  world.treeStalkerEncounter = null;
}

/** Advance the non-graphic lift, helmet probe and blackout. Returns true once,
 * after a short fully dark hold; pause/reduced-motion rendering need no clock.
 */
export function updateTreeStalkerEncounter(world, dt) {
  const encounter = world?.treeStalkerEncounter;
  if (!encounter || !Number.isFinite(dt) || dt <= 0 || encounter.complete) return false;
  const stalker = Array.isArray(world.treeStalkers)
    ? world.treeStalkers.find((entry) => entry?.id === encounter.stalkerId) : undefined;
  const pose = encounter.captorPose;
  if (!stalker || !finitePoint(world.player) || !Number.isFinite(world.player.health) || !finitePoint(pose)
    || !Number.isFinite(pose.heading) || !Number.isFinite(pose.heightMeters) || pose.heightMeters <= 0
    || !finitePoint(encounter.startCamera) || !Number.isFinite(encounter.startHealth) || encounter.startHealth <= 0
    || !Number.isFinite(encounter.age) || encounter.age < 0 || encounter.age > TOTAL_SECONDS + 1e-9) {
    releaseTreeStalkerEncounter(world); return false;
  }
  Object.assign(stalker, pose, { speed: 0 });
  const mouth = getTreeStalkerMouth(stalker);
  if (!mouth) { releaseTreeStalkerEncounter(world); return false; }
  const held = finitePoint(encounter.holdCamera) ? encounter.holdCamera : holdPoint(world, stalker, mouth);
  encounter.holdCamera = held;
  encounter.age = Math.min(TOTAL_SECONDS, encounter.age + Math.min(dt, .05));
  encounter.target = mouth;
  let desired;
  if (encounter.age < TREE_STALKER_LIFT_SECONDS - 1e-9) {
    encounter.phase = "grabbed"; encounter.elapsed = encounter.age;
    encounter.progress = clamp(encounter.age / TREE_STALKER_LIFT_SECONDS);
    const amount = smooth(encounter.progress);
    desired = { x: encounter.startCamera.x + (held.x - encounter.startCamera.x) * amount,
      y: encounter.startCamera.y + (held.y - encounter.startCamera.y) * amount,
      z: encounter.startCamera.z + (held.z - encounter.startCamera.z) * amount };
    encounter.tubeProgress = 0;
  } else {
    encounter.phase = "feeding"; encounter.elapsed = Math.max(0, encounter.age - TREE_STALKER_LIFT_SECONDS);
    encounter.progress = encounter.elapsed + 1e-9 >= TREE_STALKER_FEEDING_SECONDS
      ? 1 : clamp(encounter.elapsed / TREE_STALKER_FEEDING_SECONDS);
    desired = held;
    encounter.tubeProgress = smooth((encounter.progress - .05) / .6);
    world.player.health = Math.max(0, encounter.startHealth * (1 - encounter.progress));
  }
  encounter.cameraPosition = advanceCamera(world, encounter.cameraPosition, desired, Math.min(dt, .05));
  encounter.tubeTarget = helmetPoint(encounter.cameraPosition, mouth);
  if (encounter.age + 1e-9 >= TOTAL_SECONDS) {
    encounter.age = TOTAL_SECONDS; encounter.progress = 1; encounter.tubeProgress = 1;
    encounter.complete = true; world.player.health = 0; return true;
  }
  return false;
}
