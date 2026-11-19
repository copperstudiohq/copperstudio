import * as THREE from './vendor/three.module.js';
import { CRAB_LEG_REST } from './crab-anatomy.js';
import { CRAB_SIZE, getCrabScale } from './crab-size.js';
import { getSeabedHeight } from './seabed.js';
import { getForestHeight, getForestCollision } from './forest-terrain.js';
import { getIceSpikeCollision } from './ice-spikes.js';
import { getIceDepth, getIceSection, pointInPolygon, WATER_LEVEL, WORLD_BOUNDS, EYE_HEIGHT } from './terrain.js';

/** Simulation axes are X/Y horizontal, Z up; leg metadata uses render axes.
 * Timers, RNG and planted feet belong to these weak states, not saved source.
 * Speeds are gameplay tuning informed by measured underwater crabs, rather
 * than extrapolations from the much faster warm-water ghost crab sprint.
 */
export const CRAB_MOVEMENT = Object.freeze({ forageMin: .04, forageMax: .08,
  dartMin: .20, dartMax: .24, alertRadius: 4, dartRadius: 1.8,
  dutyFactor: .72, footPad: .003, strideMin: .055, strideMax: .08 });
const SCALE = 25, TAU = Math.PI * 2, states = new WeakMap();
const habitats = new WeakMap(), spikeCells = new WeakMap(), CELL = 100;
const legMetrics = new WeakMap();
const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion();
const finite = (p) => p && [p.x, p.y, p.z].every(Number.isFinite);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const wrap = (n) => Math.atan2(Math.sin(n), Math.cos(n));
const add = (a, b, s = 1) => ({ x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const length = (a) => Math.hypot(a.x, a.y, a.z);
const unit = (a, fallback = { x: 0, y: 0, z: 1 }) => { const d = length(a); return d > 1e-9 ? add({ x: 0, y: 0, z: 0 }, a, 1 / d) : { ...fallback }; };
const distance = (a, b) => length(sub(a, b));

function iceVolumes(world) {
  let cache = habitats.get(world);
  if (!cache || cache.platforms !== world.platforms || cache.submerged !== world.submergedIce) {
    cache = { platforms: world.platforms, submerged: world.submergedIce,
      volumes: [...(world.platforms ?? []), ...(world.submergedIce ?? [])] };
    habitats.set(world, cache);
  }
  return cache.volumes;
}

function localSpikes(world, x, y, radius) {
  const spikes = world.iceSpikes; if (!spikes?.length) return [];
  let cells = spikeCells.get(spikes);
  if (!cells) {
    cells = new Map(); spikeCells.set(spikes, cells);
    for (const spike of spikes) for (let cx = Math.floor((spike.x - spike.radius) / CELL); cx <= Math.floor((spike.x + spike.radius) / CELL); cx++)
      for (let cy = Math.floor((spike.y - spike.radius) / CELL); cy <= Math.floor((spike.y + spike.radius) / CELL); cy++) {
        const key = `${cx}:${cy}`, entries = cells.get(key) ?? [];
        if (!cells.has(key)) cells.set(key, entries); entries.push(spike);
      }
  }
  const nearby = new Set();
  for (let cx = Math.floor((x - radius) / CELL); cx <= Math.floor((x + radius) / CELL); cx++)
    for (let cy = Math.floor((y - radius) / CELL); cy <= Math.floor((y + radius) / CELL); cy++)
      for (const spike of cells.get(`${cx}:${cy}`) ?? []) nearby.add(spike);
  return [...nearby];
}

/** Legacy heading: render yaw=-heading, hence forward=(sin h,-cos h) and
 * sideways/right=(cos h,sin h) in simulation coordinates.
 */
function orientation(normal, heading) {
  const f = { x: Math.sin(heading), y: -Math.cos(heading), z: 0 };
  const forward = unit(add(f, normal, -dot(f, normal)), f), right = unit(cross(normal, forward));
  matrix.set(right.x, normal.x, -forward.x, 0, right.z, normal.z, -forward.z, 0,
    right.y, normal.y, -forward.y, 0, 0, 0, 0, 1);
  return quaternion.setFromRotationMatrix(matrix).normalize().toArray();
}

function rotate(q, p) {
  const x = p[0], y = p[1], z = p[2];
  const tx = 2 * (q[1] * z - q[2] * y), ty = 2 * (q[2] * x - q[0] * z), tz = 2 * (q[0] * y - q[1] * x);
  return { x: x + q[3] * tx + q[1] * tz - q[2] * ty,
    y: y + q[3] * ty + q[2] * tx - q[0] * tz, z: z + q[3] * tz + q[0] * ty - q[1] * tx };
}

function localWorld(crab, pose, point) {
  const p = rotate(pose.orientation, point), scale = getCrabScale(crab) * SCALE;
  return { x: crab.x + p.x * scale, y: crab.y + p.z * scale,
    z: crab.z + pose.bodyOffsetMeters * SCALE + p.y * scale };
}

/** The descriptor stays exactly on center seabed. A small rigid stance offset
 * makes room for joint flex, without inflating or breathing the carapace.
 */
function groundPose(world, crab, x, y, heading, strict = true) {
  const scale = getCrabScale(crab), z = getSeabedHeight(x, y), d = .12 * SCALE * scale;
  const gx = (getSeabedHeight(x + d, y) - getSeabedHeight(x - d, y)) / (2 * d);
  const gy = (getSeabedHeight(x, y + d) - getSeabedHeight(x, y - d)) / (2 * d);
  const surfaceNormal = unit({ x: -gx, y: -gy, z: 1 });
  let normal = surfaceNormal;
  if (normal.z < .94) { const h = Math.hypot(normal.x, normal.y); normal = { x: normal.x / h * .341, y: normal.y / h * .341, z: .94 }; normal = unit(normal); }
  const pose = { orientation: orientation(normal, heading), bodyOffsetMeters: 0, normal, surfaceNormal };
  const temp = { ...crab, x, y, z };
  let low = Infinity;
  for (const leg of CRAB_LEG_REST) {
    const p = localWorld(temp, pose, leg.foot), delta = (getSeabedHeight(p.x, p.y) - p.z) / SCALE;
    low = Math.min(low, delta);
  }
  pose.bodyOffsetMeters = clamp(low + CRAB_MOVEMENT.footPad * scale, -.06 * scale, -.004 * scale);
  if (!strict) return { ...pose, z };
  // A steep but reachable contour is walkable. Test the real solid envelope
  // instead of rejecting every slope above twenty degrees or uneven toe span.
  // The collision cylinder includes low chelipeds and empty space. Ground
  // support instead follows the narrower underbelly and broad carapace bands;
  // treating the whole cylinder bottom as a solid disk falsely wedges residents.
  const hipHeight = CRAB_LEG_REST[0].hip[1];
  for (const [height, width] of [[hipHeight * .92, CRAB_SIZE.bodyRadius * .65],
    [hipHeight * .967, CRAB_SIZE.bodyRadius * .85],
    [CRAB_SIZE.shellBase + CRAB_SIZE.shellHeight * .5, CRAB_SIZE.shellWidth * .5]]) {
    for (let i = 0; i < 8; i++) {
      const p = localWorld(temp, pose, [Math.cos(i * TAU / 8) * width, height, Math.sin(i * TAU / 8) * width]);
      if (p.z < getSeabedHeight(p.x, p.y) + .1 * scale) return null;
    }
  }
  const radius = CRAB_SIZE.bodyRadius * SCALE * scale + 1;
  const bottom = z + (CRAB_SIZE.bodyBottom * scale + pose.bodyOffsetMeters) * SCALE;
  const top = z + (CRAB_SIZE.totalHeight * scale + pose.bodyOffsetMeters) * SCALE;
  if (top >= WATER_LEVEL - 3 || x < WORLD_BOUNDS.minX + radius || x > WORLD_BOUNDS.maxX - radius
    || y < WORLD_BOUNDS.minY + radius || y > WORLD_BOUNDS.maxY - radius
    || (getForestHeight(world.forest, x, y) ?? -Infinity) > z + .1) return null;
  for (const ice of iceVolumes(world)) {
    const iceTop = ice.z ?? 0;
    if (Math.abs(x - ice.x) > ice.rx + radius || Math.abs(y - ice.y) > ice.ry + radius
      || bottom > iceTop || top < iceTop - getIceDepth(ice)) continue;
    const polygon = getIceSection(ice, Math.min(top, iceTop) - iceTop);
    if ([[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius]].some(([dx, dy]) => pointInPolygon(polygon, x + dx, y + dy))) return null;
  }
  if (getIceSpikeCollision(localSpikes(world, x, y, radius), x, y, bottom, top - bottom, radius)
    || getForestCollision(world.forest, { x, y, z: (bottom + top) / 2 }, radius)) return null;
  return { ...pose, z };
}

function random(state) { state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0; return state.rng / 4294967296; }
function between(state, a, b) { return a + random(state) * (b - a); }
const pad = (crab) => CRAB_MOVEMENT.footPad * SCALE * getCrabScale(crab);

function legLengths(leg, crab) {
  const scale = getCrabScale(crab) * SCALE;
  let lengths = legMetrics.get(leg);
  if (!lengths) {
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    lengths = [d(leg.hip, leg.knee), d(leg.knee, leg.ankle), d(leg.ankle, leg.foot)]; legMetrics.set(leg, lengths);
  }
  return lengths.map((value) => value * scale);
}

function reachable(crab, state, leg, point, margin = 0) {
  const hip = localWorld(crab, state, leg.hip), lengths = legLengths(leg, crab);
  return distance(hip, point) <= lengths[0] + lengths[1] + lengths[2] - margin;
}

function plant(crab, state, leg, desired) {
  const goal = { ...desired, z: getSeabedHeight(desired.x, desired.y) + pad(crab) };
  const reserve = .03 * SCALE * getCrabScale(crab);
  if (reachable(crab, state, leg, goal, reserve)) return goal;
  // A toe can move inward around a small fissure without stretching any bone.
  for (const fraction of [.85, .7, .55, .4, .2, 0]) {
    const p = { x: crab.x + (goal.x - crab.x) * fraction, y: crab.y + (goal.y - crab.y) * fraction, z: 0 };
    p.z = getSeabedHeight(p.x, p.y) + pad(crab);
    if (reachable(crab, state, leg, p, reserve)) return p;
  }
  return null;
}

function initialize(crab) {
  const heading = Number.isFinite(crab.heading) ? crab.heading : 0;
  const pose = groundPose({}, crab, crab.x, crab.y, heading, false);
  const state = { ...pose, rng: (crab.seed ?? 1) >>> 0, homeX: crab.x, homeY: crab.y,
    heading, desiredHeading: heading, mode: 'forage', left: 0, cooldown: 0, speed: CRAB_MOVEMENT.forageMin, targetSpeed: 0,
    sidewaysSign: 1, walkPhase: 0, moving: false, actualSpeed: 0, velocity: { x: 0, y: 0 }, feet: [], unavailable: false,
    lastX: crab.x, lastY: crab.y, lastZ: crab.z, stride: CRAB_MOVEMENT.strideMin, avoidFor: 0, avoidHeading: heading };
  state.left = between(state, 5, 10); state.targetSpeed = between(state, CRAB_MOVEMENT.forageMin, CRAB_MOVEMENT.forageMax);
  state.supported = true;
  state.feet = CRAB_LEG_REST.map((leg) => {
    const rest = localWorld(crab, state, leg.foot), point = plant(crab, state, leg, rest);
    if (!point) state.supported = false;
    return { point: point ?? rest, swing: false };
  });
  states.set(crab, state); return state;
}

function stateFor(crab) { return states.get(crab) ?? initialize(crab); }

function chooseForage(crab, state) {
  const home = Math.hypot(crab.x - state.homeX, crab.y - state.homeY);
  let heading = state.heading + between(state, -.4, .4), sign = random(state) < .5 ? -1 : 1;
  if (home > 20) {
    const goal = Math.atan2(state.homeY - crab.y, state.homeX - crab.x);
    const direct = Math.abs(wrap(goal - state.heading)), reverse = Math.abs(wrap(goal + Math.PI - state.heading));
    sign = direct <= reverse ? 1 : -1; heading = sign > 0 ? goal : goal + Math.PI;
  }
  state.mode = 'forage'; state.left = between(state, 5, 10); state.sidewaysSign = sign;
  state.desiredHeading = heading; state.targetSpeed = between(state, CRAB_MOVEMENT.forageMin, CRAB_MOVEMENT.forageMax);
}

function updateFeet(crab, state, travelled, turned, dt) {
  const scale = getCrabScale(crab), effort = travelled + Math.abs(turned) * CRAB_SIZE.legSpan * .36 * SCALE * scale;
  const moving = effort > 1e-6;
  state.stride = CRAB_MOVEMENT.strideMin + (CRAB_MOVEMENT.strideMax - CRAB_MOVEMENT.strideMin) * clamp(state.speed / CRAB_MOVEMENT.dartMax, 0, 1);
  if (moving) state.walkPhase += effort / (state.stride * SCALE * scale) * TAU;
  else if (state.moving) state.walkPhase = 0;
  const vx = state.velocity.x, vy = state.velocity.y, speed = Math.hypot(vx, vy);
  const travel = speed > 1e-6 ? { x: vx / speed, y: vy / speed } : { x: Math.cos(state.heading) * state.sidewaysSign, y: Math.sin(state.heading) * state.sidewaysSign };
  for (let index = 0; index < 8; index++) {
    const leg = CRAB_LEG_REST[index], foot = state.feet[index];
    const phase = ((state.walkPhase / TAU + ((leg.index + (leg.side > 0 ? 1 : 0)) % 2) * .5) % 1 + 1) % 1;
    if (moving && phase >= CRAB_MOVEMENT.dutyFactor) {
      if (!foot.swing) {
        foot.swing = true; foot.start = { ...foot.point };
        const rest = localWorld(crab, state, leg.foot), lead = state.stride * SCALE * scale * .35;
        foot.target = plant(crab, state, leg, { x: rest.x + travel.x * lead, y: rest.y + travel.y * lead, z: rest.z });
        if (!foot.target) { foot.swing = false; continue; }
      }
      const t = (phase - CRAB_MOVEMENT.dutyFactor) / (1 - CRAB_MOVEMENT.dutyFactor), smooth = t * t * (3 - 2 * t);
      foot.point = add(foot.start, sub(foot.target, foot.start), smooth);
      foot.point.z += Math.sin(Math.PI * t) * (.015 + .01 * clamp(state.speed / CRAB_MOVEMENT.dartMax, 0, 1)) * SCALE * scale;
      foot.point.z = Math.max(foot.point.z, getSeabedHeight(foot.point.x, foot.point.y) + pad(crab));
    } else if (foot.swing) {
      if (moving) { foot.point = { ...foot.target }; foot.swing = false; }
      else {
        const floor = getSeabedHeight(foot.point.x, foot.point.y) + pad(crab);
        foot.point.z += (floor - foot.point.z) * Math.min(1, dt * 14);
        if (Math.abs(foot.point.z - floor) < .01) { foot.point.z = floor; foot.swing = false; }
      }
    }
  }
  state.moving = moving;
}

/** Toe contacts must remain reachable throughout a body step, including the
 * currently planted toes. A valid ground point alone cannot justify stretching
 * a rigid leg across a fissure. New touchdown targets reserve real flex room.
 */
function feetFit(crab, state, pose) {
  for (const [index, leg] of CRAB_LEG_REST.entries()) {
    if (!reachable(crab, pose, leg, state.feet[index].point, .005 * getCrabScale(crab))) return false;
    if (!plant(crab, pose, leg, localWorld(crab, pose, leg.foot))) return false;
  }
  return true;
}

function tryStep(world, crab, state, heading, dx, dy, dt) {
  const n = state.surfaceNormal ?? state.normal, slope = -(n.x * dx + n.y * dy) / Math.max(.01, n.z);
  const budget = state.speed * SCALE * dt;
  let horizontal = budget / Math.hypot(1, slope);
  for (let refine = 0; refine < 4; refine++) {
    const x = crab.x + dx * horizontal, y = crab.y + dy * horizontal;
    const pose = groundPose(world, crab, x, y, heading);
    if (!pose) return null;
    const travelled = Math.hypot(x - crab.x, y - crab.y, pose.z - crab.z);
    if (travelled > budget * 1.00001) { horizontal *= budget / travelled; continue; }
    const candidate = { ...crab, x, y, z: pose.z, heading };
    if (!feetFit(candidate, state, pose)) return null;
    return { x, y, heading, pose, travelled, dx, dy };
  }
  return null;
}

/** Authoritative crab simulation. Call once in updateWorld; menu pause withholds
 * ticks. Rendering reads this state and never invents a second roaming offset.
 * @param {object} world @param {number} dt
 */
export function updateCrabMovement(world, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const delta = Math.min(dt, .05);
  for (const crab of world.crabs ?? []) {
    if (!finite(crab)) continue;
    let state = stateFor(crab);
    if (crab.squidHeldBy || crab.squidRespawnIn > 0) { state.unavailable = true; state.speed = 0; state.moving = false; continue; }
    if (state.unavailable || Math.hypot(crab.x - state.lastX, crab.y - state.lastY, crab.z - state.lastZ) > 5) state = initialize(crab);
    state.left -= delta; state.cooldown = Math.max(0, state.cooldown - delta); state.avoidFor = Math.max(0, state.avoidFor - delta);
    const player = world.player, headZ = crab.z + (CRAB_SIZE.bodyHeight * .8 * getCrabScale(crab) + state.bodyOffsetMeters) * SCALE;
    const near = finite(player) ? Math.hypot(player.x - crab.x, player.y - crab.y,
      player.z + EYE_HEIGHT - headZ) / SCALE : Infinity;
    if (near < CRAB_MOVEMENT.dartRadius && state.cooldown === 0) {
      const away = Math.atan2(crab.y - player.y, crab.x - player.x);
      state.sidewaysSign = Math.abs(wrap(away - state.heading)) <= Math.abs(wrap(away + Math.PI - state.heading)) ? 1 : -1;
      state.desiredHeading = state.sidewaysSign > 0 ? away : away + Math.PI;
      state.mode = 'dart'; state.left = between(state, .75, 1.15); state.cooldown = between(state, 8, 13);
      state.targetSpeed = between(state, CRAB_MOVEMENT.dartMin, CRAB_MOVEMENT.dartMax);
    } else if (state.mode !== 'dart' && near < CRAB_MOVEMENT.alertRadius) {
      state.mode = 'forage'; state.targetSpeed = CRAB_MOVEMENT.forageMin;
      state.desiredHeading = Math.atan2(player.x - crab.x, -(player.y - crab.y));
    } else if (state.left <= 0) {
      chooseForage(crab, state);
    }
    if (state.avoidFor > 0) state.desiredHeading = state.avoidHeading;
    const oldHeading = state.heading, turnRate = state.mode === 'dart' ? .9 : .4;
    const turn = clamp(wrap(state.desiredHeading - oldHeading), -delta * turnRate, delta * turnRate);
    state.heading += turn;
    const accel = state.mode === 'dart' ? .75 : .12;
    state.speed += clamp(state.targetSpeed - state.speed, -delta * .5, delta * accel);
    if (state.speed < 1e-8 && Math.abs(turn) < 1e-8) {
      state.velocity = { x: 0, y: 0 }; state.actualSpeed = 0;
      if (state.moving || state.feet.some((foot) => foot.swing)) updateFeet(crab, state, 0, 0, delta);
      continue;
    }
    const dx = Math.cos(state.heading) * state.sidewaysSign, dy = Math.sin(state.heading) * state.sidewaysSign;
    let step = tryStep(world, crab, state, state.heading, dx, dy, delta);
    if (!step) {
      // A crab can shuffle diagonally or reverse sideways while its body turns
      // gradually. Keep the real center moving along a supported contour; never
      // replace an obstructed path with a renderer-owned walking illusion.
      for (const fraction of [1, .5]) {
        for (const yaw of [state.heading, oldHeading]) {
          const routes = [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI];
          if (fraction < 1) routes.unshift(0);
          for (const angle of routes) {
            const c = Math.cos(angle), s = Math.sin(angle), sx = dx * c - dy * s, sy = dx * s + dy * c;
            step = tryStep(world, crab, state, yaw, sx, sy, delta * fraction);
            if (step) {
              const goal = Math.atan2(sy, sx), reverse = goal + Math.PI;
              state.sidewaysSign = Math.abs(wrap(goal - yaw)) <= Math.abs(wrap(reverse - yaw)) ? 1 : -1;
              state.avoidHeading = state.sidewaysSign > 0 ? goal : reverse; state.avoidFor = 1.5;
              break;
            }
          }
          if (step) break;
        }
        if (step) break;
      }
    }
    let travelled = 0;
    if (step) {
      travelled = step.travelled; state.velocity = { x: (step.x - crab.x) / delta, y: (step.y - crab.y) / delta };
      crab.x = step.x; crab.y = step.y; crab.z = step.pose.z; crab.heading = step.heading; state.heading = step.heading;
      state.orientation = step.pose.orientation; state.normal = step.pose.normal; state.surfaceNormal = step.pose.surfaceNormal;
      state.bodyOffsetMeters = step.pose.bodyOffsetMeters;
    } else {
      state.heading = oldHeading; state.velocity = { x: 0, y: 0 };
    }
    state.actualSpeed = travelled / (SCALE * delta);
    updateFeet(crab, state, travelled, step ? wrap(step.heading - oldHeading) : 0, delta);
    state.lastX = crab.x; state.lastY = crab.y; state.lastZ = crab.z;
  }
}

/** Read-only, render-clock-independent pose. bodyOffsetMeters is WORLD metres;
 * orientation is the normalized render quaternion. The shell never changes size.
 */
export function getCrabMotionPose(crab, target = {}) {
  const state = stateFor(crab), unavailable = crab.squidHeldBy || crab.squidRespawnIn > 0;
  target.state = unavailable ? 'held' : state.mode; target.speedMetersPerSecond = unavailable ? 0 : state.actualSpeed;
  target.moving = !unavailable && state.moving; target.walkPhase = state.walkPhase; target.sidewaysSign = state.sidewaysSign;
  target.bodyOffsetMeters = unavailable ? 0 : state.bodyOffsetMeters; target.bodyBob = 0;
  target.orientation ??= [0, 0, 0, 1];
  const q = unavailable ? orientation({ x: 0, y: 0, z: 1 }, crab.heading ?? 0) : state.orientation;
  for (let i = 0; i < 4; i++) target.orientation[i] = q[i];
  return target;
}

/** Three rigid articulated links with a planted world toe. The distal angle is
 * adjusted only when needed for reach; no breathing scale or rubber leg lengths.
 * @param {object} crab @param {number} index @param {number[][]} [target]
 * @returns {number[][]} Four SIM [x,y,z] points: hip, knee, ankle, toe.
 */
export function getCrabLegWorldPath(crab, index, target = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]) {
  const leg = CRAB_LEG_REST[index];
  if (!leg) throw new RangeError('Crab walking leg index must be between 0 and 7.');
  const state = stateFor(crab), held = crab.squidHeldBy || crab.squidRespawnIn > 0;
  const pose = held ? { orientation: orientation({ x: 0, y: 0, z: 1 }, crab.heading ?? 0), bodyOffsetMeters: 0 } : state;
  const hip = localWorld(crab, pose, leg.hip), foot = held ? localWorld(crab, pose, leg.foot) : state.feet[index].point;
  const [l1, l2, l3] = legLengths(leg, crab), ankleRest = rotate(pose.orientation,
    [leg.ankle[0] - leg.foot[0], leg.ankle[1] - leg.foot[1], leg.ankle[2] - leg.foot[2]]);
  let ankle = add(foot, unit({ x: ankleRest.x, y: ankleRest.z, z: ankleRest.y }), l3);
  const toHip = unit(sub(hip, foot)), d = Math.max(1e-8, distance(hip, foot));
  const desired = clamp(distance(hip, ankle), Math.abs(l1 - l2) + 1e-6, l1 + l2 - 1e-6);
  if (Math.abs(distance(hip, ankle) - desired) > 1e-6 && d < l1 + l2 + l3) {
    const along = clamp((d * d + l3 * l3 - desired * desired) / (2 * d), -l3, l3);
    const bend = unit(add(sub(ankle, foot), toHip, -dot(sub(ankle, foot), toHip)), { x: 0, y: 0, z: 1 });
    ankle = add(add(foot, toHip, along), bend, Math.sqrt(Math.max(0, l3 * l3 - along * along)));
  }
  const axis = unit(sub(ankle, hip)), span = Math.max(1e-8, distance(hip, ankle));
  const along = clamp((l1 * l1 - l2 * l2 + span * span) / (2 * span), -l1, l1);
  const up = unit(add({ x: 0, y: 0, z: 1 }, axis, -axis.z), { x: Math.cos(state.heading) * leg.side, y: Math.sin(state.heading) * leg.side, z: 0 });
  const knee = add(add(hip, axis, along), up, Math.sqrt(Math.max(0, l1 * l1 - along * along)));
  for (const [i, p] of [hip, knee, ankle, foot].entries()) { target[i][0] = p.x; target[i][1] = p.y; target[i][2] = p.z; }
  return target;
}
