import {juvenileEscapeGoal} from './squid-intelligence.js';
import { BLUE_OCEAN_START_X, EYE_HEIGHT, WATER_LEVEL, WORLD_BOUNDS,
  getIceDepth, getIceScale, getPlatformVertices, pointInPolygon } from "./terrain.js";
import { getSeabedHeight } from "./seabed.js";
import { getSquidOrientation, getSquidAnchor, squidLocalToWorld, steerSquidOrientation } from "./squid-frame.js";
import { getForestCollision } from "./forest-terrain.js";

export const SQUID_LENGTH_METERS = 3;
export const SQUID_HEAD_RADIUS = 15;
export const SQUID_TENTACLE_COUNT = 8;
export const SQUID_SEGMENTS = 8;
export const SQUID_TENTACLE_LENGTH = 51;
const LINK = SQUID_TENTACLE_LENGTH / SQUID_SEGMENTS;
const ARM_RADIUS = 2.7;
const armRadius = (joint) => ARM_RADIUS * 0.84 ** joint;
const STEP = 1 / 120;
const TAU = Math.PI * 2;
const states = new WeakMap();
const environments = new WeakMap();

/** @typedef {{x:number,y:number,z:number,px:number,py:number,pz:number,sx?:number,sy?:number,sz?:number,tx?:number,ty?:number,tz?:number}} SquidPoint */
/** @typedef {{x:number,y:number,z:number,w:number}} SquidOrientation */
/** @typedef {{initialized?:boolean,speedScale?:number,time?:number,waypoint?:number,target?:{x:number,y:number,z:number}|null,vx?:number,vy?:number,vz?:number,lastTargetTime?:number}} SquidMotion */
/** @typedef {{id:string,x:number,y:number,z:number,px:number,py:number,pz:number,homeX:number,homeY:number,homeZ:number,heading:number,seed:number,headRadius:number,lengthMeters:number,tentacles:SquidPoint[][],orientation?:SquidOrientation,motion?:SquidMotion}} Squid */

function random(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
function node(x, y, z) { return { x, y, z, px: x, py: y, pz: z }; }

function environment(world) {
  const old = environments.get(world);
  if (old?.platforms === world.platforms && old?.chunks === world.submergedIce && old?.spikes === world.iceSpikes && old?.forest === world.forest) return old;
  const result = { platforms: world.platforms, chunks: world.submergedIce, spikes: world.iceSpikes, forest: world.forest,
    ice: [...(world.platforms ?? []), ...(world.submergedIce ?? [])].map((floe) => ({
      floe, vertices: getPlatformVertices(floe), top: floe.z ?? 0,
      bottom: (floe.z ?? 0) - getIceDepth(floe),
    })), allSpikes: world.iceSpikes ?? [], local: new WeakMap() };
  environments.set(world, result); return result;
}

/** Cache broad-phase candidates around each animal; polygons never allocate in the solver. */
function nearby(env, squid) {
  let local = env.local.get(squid);
  if (local && Math.hypot(squid.x - local.x, squid.y - local.y, squid.z - local.z) < 25) return local;
  const reach = 110;
  // The cached neighbourhood permits 25 units of movement before refresh.
  // Keep the original open-water sweep fast path everywhere beyond that full
  // head-and-arms envelope, while retaining every near-coast capsule probe.
  const forest = getForestCollision(env.forest, squid, reach + 25) ? env.forest : null;
  local = { x: squid.x, y: squid.y, z: squid.z, forest,
    ice: env.ice.filter(({ floe, top, bottom }) => Math.abs(floe.x - squid.x) < floe.rx + reach
      && Math.abs(floe.y - squid.y) < floe.ry + reach && bottom < squid.z + reach && top > squid.z - reach),
    spikes: env.allSpikes.filter((spike) => Math.abs(spike.x - squid.x) < spike.radius + reach
      && Math.abs(spike.y - squid.y) < spike.radius + reach
      && spike.z > squid.z - reach && spike.z - spike.length < squid.z + reach) };
  env.local.set(squid, local); return local;
}

function projectIce(p, radius, volume) {
  const { floe, top, bottom, vertices } = volume;
  if (p.z - radius > top || p.z + radius < bottom) return;
  const level = Math.max(bottom, Math.min(top, p.z + radius));
  const scale = getIceScale(floe, level - top);
  if (!scale || Math.abs(p.x - floe.x) > floe.rx * scale + radius
    || Math.abs(p.y - floe.y) > floe.ry * scale + radius) return;
  const qx = floe.x + (p.x - floe.x) / scale, qy = floe.y + (p.y - floe.y) / scale;
  const inside = pointInPolygon(vertices, qx, qy);
  let best = Infinity, ex = 0, ey = 0, nx = 1, ny = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length];
    const dx = b.x - a.x, dy = b.y - a.y, square = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((qx - a.x) * dx + (qy - a.y) * dy) / square));
    const x = a.x + dx * t, y = a.y + dy * t, distance = Math.hypot(qx - x, qy - y) * scale;
    if (distance >= best) continue;
    best = distance; ex = floe.x + (x - floe.x) * scale; ey = floe.y + (y - floe.y) * scale;
    const length = Math.sqrt(square); nx = dy / length; ny = -dx / length;
  }
  if (!inside && best >= radius) return;
  if (inside && p.z < bottom) { p.z = bottom - radius - 0.01; return; }
  if (inside && p.z > top) { p.z = top + radius + 0.01; return; }
  const vx = inside ? ex - p.x : p.x - ex, vy = inside ? ey - p.y : p.y - ey;
  const length = Math.hypot(vx, vy);
  if (length > 1e-8) { nx = vx / length; ny = vy / length; }
  p.x = ex + nx * (radius + 0.01); p.y = ey + ny * (radius + 0.01);
}

function projectSphere(p, radius, local, player) {
  for (const volume of local.ice) projectIce(p, radius, volume);
  for (const spike of local.spikes) {
    const tip = spike.z - spike.length;
    if (p.z - radius > spike.z || p.z + radius < tip) continue;
    const coneRadius = spike.radius * Math.max(0, Math.min(1, (p.z + radius - tip) / spike.length));
    const dx = p.x - spike.x, dy = p.y - spike.y, distance = Math.hypot(dx, dy);
    if (distance >= coneRadius + radius) continue;
    if (p.z < tip && distance < radius) p.z = tip - radius - 0.01;
    else { p.x = spike.x + (distance ? dx / distance : 1) * (coneRadius + radius + 0.01);
      p.y = spike.y + (distance ? dy / distance : 0) * (coneRadius + radius + 0.01); }
  }
  p.x = Math.max(WORLD_BOUNDS.minX + radius, Math.min(BLUE_OCEAN_START_X - radius - 1, p.x));
  p.y = Math.max(WORLD_BOUNDS.minY + radius, Math.min(WORLD_BOUNDS.maxY - radius, p.y));
  p.z = Math.max(getSeabedHeight(p.x, p.y) + radius + 0.01,
    Math.min(WATER_LEVEL - radius - 3, p.z));
  const forestHit = getForestCollision(local.forest, p, radius === SQUID_HEAD_RADIUS ? radius + 5 : radius);
  if (forestHit) Object.assign(p, forestHit.escape);
  if (!player || !Number.isFinite(player.x) || !Number.isFinite(player.z)) return false;
  const nearestZ = Math.max(player.z + 5, Math.min(player.z + EYE_HEIGHT - 5, p.z));
  let dx = p.x - player.x, dy = p.y - player.y, dz = p.z - nearestZ;
  const length = Math.hypot(dx, dy, dz), separation = radius + 5;
  if (length >= separation) return false;
  if (length < 1e-8) { dx = 1; dy = 0; dz = 0; }
  const unit = length < 1e-8 ? 1 : length;
  p.x = player.x + dx / unit * (separation + 0.01);
  p.y = player.y + dy / unit * (separation + 0.01);
  p.z = nearestZ + dz / unit * (separation + 0.01);
  projectSphere(p, radius, local, null);
  return true;
}

/** Sweep moving spheres through nearby solids; fixed substeps plus bounded
 * samples also cover the thin, tapered tips during fast jetting and banking. */
function projectSweptSphere(p, radius, local, player) {
  const x = p.sx ?? p.px ?? p.x, y = p.sy ?? p.py ?? p.y, z = p.sz ?? p.pz ?? p.z;
  const dx = p.x - x, dy = p.y - y, dz = p.z - z;
  const length = Math.hypot(dx, dy, dz);
  if ((!local.ice.length && !local.spikes.length && !local.forest) || length < radius * 0.8)
    return projectSphere(p, radius, local, player);
  const samples = Math.min(16, Math.ceil(length / Math.max(0.4, radius * 0.8)));
  const probe = local.sweepProbe ??= { x: 0, y: 0, z: 0 };
  for (let sample = 1; sample <= samples; sample++) {
    const t = sample / samples;
    const px = x + dx * t, py = y + dy * t, pz = z + dz * t;
    probe.x = px; probe.y = py; probe.z = pz;
    const playerHit = projectSphere(probe, radius, local, player);
    if (Math.hypot(probe.x - px, probe.y - py, probe.z - pz) > 0.00001) {
      p.x = probe.x; p.y = probe.y; p.z = probe.z;
      return playerHit;
    }
  }
  return false;
}

function projectOwnHead(p, radius, squid) {
  const dx = p.x - squid.x, dy = p.y - squid.y, dz = p.z - squid.z;
  const length = Math.hypot(dx, dy, dz), clearance = SQUID_HEAD_RADIUS + radius + 0.05;
  if (length >= clearance) return false;
  const scale = clearance / (length || 1);
  p.x = squid.x + (length ? dx * scale : clearance);
  p.y = squid.y + dy * scale; p.z = squid.z + dz * scale;
  return true;
}

function contact(p, radius, local, player, body) {
  const x = p.x, y = p.y, z = p.z;
  const touchedPlayer = projectSweptSphere(p, radius, local, player);
  if (body && projectOwnHead(p, radius, body)) projectSphere(p, radius, local, null);
  const retained = touchedPlayer ? 0.25 : 0.9;
  p.px += (p.x - x) * retained; p.py += (p.y - y) * retained; p.pz += (p.z - z) * retained;
}

function anchors(squid) {
  squid.tentacles.forEach((arm, index) => {
    const position = getSquidAnchor(squid, index), root = arm[0];
    root.x = position.x; root.y = position.y; root.z = position.z;
    root.px = root.x; root.py = root.y; root.pz = root.z;
  });
}

function constraint(a, b, length, fixedA = false) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const distance = Math.hypot(dx, dy, dz) || 1;
  const amount = (distance - length) / distance * (fixedA ? 1 : 0.5);
  if (!fixedA) { a.x += dx * amount; a.y += dy * amount; a.z += dz * amount; }
  b.x -= dx * amount; b.y -= dy * amount; b.z -= dz * amount;
}

/** Overlapping inflated probes conservatively cover each whole capsule, so
 * colliders respond at the segment midpoint as well as at its end joints. */
function capsuleContacts(a, b, fixedA, local, player, probe, limbRadius, body) {
  const length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  const radius = Math.hypot(limbRadius, length / 8);
  for (let sample = 1; sample <= 3; sample++) {
    const t = sample / 4, u = 1 - t;
    probe.x = a.x * u + b.x * t; probe.y = a.y * u + b.y * t; probe.z = a.z * u + b.z * t;
    const x = probe.x, y = probe.y, z = probe.z;
    probe.sx = (a.sx ?? a.px) * u + (b.sx ?? b.px) * t;
    probe.sy = (a.sy ?? a.py) * u + (b.sy ?? b.py) * t;
    probe.sz = (a.sz ?? a.pz) * u + (b.sz ?? b.pz) * t;
    projectSweptSphere(probe, radius, local, player);
    if (!fixedA && projectOwnHead(probe, radius, body)) projectSphere(probe, radius, local, null);
    const denominator = (fixedA ? 0 : u * u) + t * t;
    const wa = fixedA ? 0 : u / denominator, wb = t / denominator;
    const dx = probe.x - x, dy = probe.y - y, dz = probe.z - z;
    if (!fixedA) { a.x += dx * wa; a.y += dy * wa; a.z += dz * wa;
      a.px += dx * wa * 0.7; a.py += dy * wa * 0.7; a.pz += dz * wa * 0.7; }
    b.x += dx * wb; b.y += dy * wb; b.z += dz * wb;
    b.px += dx * wb * 0.7; b.py += dy * wb * 0.7; b.pz += dz * wb * 0.7;
  }
}

function integrate(p, dt, ax, ay, az) {
  const damping = Math.exp(-2.8 * dt);
  const vx = Math.max(-2, Math.min(2, (p.x - p.px) * damping));
  const vy = Math.max(-2, Math.min(2, (p.y - p.py) * damping));
  const vz = Math.max(-2, Math.min(2, (p.z - p.pz) * damping));
  p.px = p.x; p.py = p.y; p.pz = p.z;
  p.x += vx + ax * dt * dt; p.y += vy + ay * dt * dt; p.z += vz + az * dt * dt;
}

const PATROL_POINTS = [
  [160, 20, -35], [110, 150, 45], [-100, 145, -30],
  [-165, -25, 40], [-60, -150, -45], [125, -125, 25],
];

/** Motion state is initialized only on wake; the prepared map stays unchanged. */
function motionState(squid) {
  const previous = squid.motion ?? {};
  if (!previous.initialized) squid.motion = { ...previous, initialized: true,
    speedScale: previous.speedScale ?? 1, time: 0, waypoint: 0, target: null,
    vx: 0, vy: 0, vz: 0 };
  squid.orientation ??= getSquidOrientation(squid);
  return squid.motion;
}

function patrolTarget(squid, motion) {
  const offset = PATROL_POINTS[motion.waypoint % PATROL_POINTS.length];
  const angle = (squid.seed % 31) * 0.13;
  const x = Math.max(WORLD_BOUNDS.minX + 90, Math.min(BLUE_OCEAN_START_X - 90,
    squid.homeX + offset[0] * Math.cos(angle) - offset[1] * Math.sin(angle)));
  const y = Math.max(WORLD_BOUNDS.minY + 90, Math.min(WORLD_BOUNDS.maxY - 90,
    squid.homeY + offset[0] * Math.sin(angle) + offset[1] * Math.cos(angle)));
  return { x, y, z: Math.max(getSeabedHeight(x, y) + 85,
    Math.min(WATER_LEVEL - 65, squid.homeZ + offset[2])) };
}

function swimmingAcceleration(squid, motion, local, escape) {
  motion.time += STEP;
  if (!motion.target || Math.hypot(squid.x - motion.target.x, squid.y - motion.target.y,
    squid.z - motion.target.z) < 35 || motion.time - (motion.lastTargetTime ?? 0) > 4) {
    if (motion.target) motion.waypoint++;
    motion.target = patrolTarget(squid, motion); motion.lastTargetTime = motion.time;
  }
  const goal=escape??motion.target;
  let dx = goal.x - squid.x, dy = goal.y - squid.y, dz = goal.z - squid.z;
  const distance = Math.hypot(dx, dy, dz) || 1;
  dx /= distance; dy /= distance; dz /= distance;
  // Probe both the leading head and the rotated trailing-arm envelope before steering.
  let avoidX = 0, avoidY = 0, avoidZ = 0;
  const candidate = { x: squid.x + dx * 40, y: squid.y + dy * 40, z: squid.z + dz * 40,
    orientation: steerSquidOrientation(squid, { x: dx, y: dy, z: dz }, 0, 0.35) };
  for (const behind of [0, 25, 55]) {
    const sample = squidLocalToWorld(candidate, 0, -behind, 0);
    const originalX = sample.x, originalY = sample.y, originalZ = sample.z;
    projectSphere(sample, behind ? 13 : 19, local, null);
    avoidX += sample.x - originalX; avoidY += sample.y - originalY; avoidZ += sample.z - originalZ;
  }
  dx += avoidX * 0.12; dy += avoidY * 0.12; dz += avoidZ * 0.12;
  const corrected = Math.hypot(dx, dy, dz) || 1;
  const burst = Boolean(escape) || (motion.time + squid.seed % 7) % 8 < 1.1;
  const speed = (burst ? 150 : 105 + Math.sin(motion.time * 0.8 + squid.seed) * 12) * motion.speedScale;
  const desired = { x: dx / corrected * speed, y: dy / corrected * speed, z: dz / corrected * speed };
  const vx = (squid.x - squid.px) / STEP, vy = (squid.y - squid.py) / STEP, vz = (squid.z - squid.pz) / STEP;
  const acceleration = { x: (desired.x - vx) * 8 + vx * 2.8,
    y: (desired.y - vy) * 8 + vy * 2.8, z: (desired.z - vz) * 8 + vz * 2.8 };
  const magnitude = Math.hypot(acceleration.x, acceleration.y, acceleration.z);
  if (magnitude > 320) { acceleration.x *= 320 / magnitude; acceleration.y *= 320 / magnitude; acceleration.z *= 320 / magnitude; }
  return acceleration;
}

function substep(squid, local, player, time, probe, world) {
  const motion = motionState(squid);
  const phase = time * 0.3 + squid.seed;
  const beforeX = squid.x, beforeY = squid.y, beforeZ = squid.z;
  squid.sx = squid.x; squid.sy = squid.y; squid.sz = squid.z;
  for (const arm of squid.tentacles) { arm[0].sx = arm[0].x; arm[0].sy = arm[0].y; arm[0].sz = arm[0].z; }
  const acceleration = motion.speedScale > 0 ? swimmingAcceleration(squid, motion, local, juvenileEscapeGoal(world,squid,motion,STEP)) : {
    x: (squid.homeX + Math.sin(phase) * 12 - squid.x) * 0.6,
    y: (squid.homeY + Math.cos(phase * 0.8) * 9 - squid.y) * 0.6,
    z: (squid.homeZ + Math.sin(phase * 0.7) * 5 - squid.z) * 0.6 };
  integrate(squid, STEP, acceleration.x, acceleration.y, acceleration.z);
  contact(squid, SQUID_HEAD_RADIUS, local, player);
  const deltaX = squid.x - beforeX, deltaY = squid.y - beforeY, deltaZ = squid.z - beforeZ;
  motion.vx = deltaX / STEP; motion.vy = deltaY / STEP; motion.vz = deltaZ / STEP;
  if (motion.speedScale > 0 && Math.hypot(motion.vx, motion.vy, motion.vz) > 5) {
    squid.orientation = steerSquidOrientation(squid, { x: motion.vx, y: motion.vy, z: motion.vz },
      Math.sin(motion.time * 1.1 + squid.seed) * 0.45, STEP * 2);
    if (Math.hypot(motion.vx, motion.vy) > 2) squid.heading = Math.atan2(motion.vy, motion.vx);
  }
  anchors(squid);
  for (let arm = 0; arm < SQUID_TENTACLE_COUNT; arm++) {
    for (let joint = 1; joint <= SQUID_SEGMENTS; joint++) {
      const p = squid.tentacles[arm][joint];
      p.sx = p.x; p.sy = p.y; p.sz = p.z;
      const carry = motion.speedScale > 0 ? 0.82 : 0;
      p.x += deltaX * carry; p.y += deltaY * carry; p.z += deltaZ * carry;
      p.px += deltaX * carry; p.py += deltaY * carry; p.pz += deltaZ * carry;
      const angle = arm * TAU / SQUID_TENTACLE_COUNT;
      const target = squidLocalToWorld(squid, -Math.sin(angle) * 11, -9 - joint * LINK, Math.cos(angle) * 11);
      const targetVX = (target.x - (p.tx ?? target.x) - deltaX * carry) / STEP;
      const targetVY = (target.y - (p.ty ?? target.y) - deltaY * carry) / STEP;
      const targetVZ = (target.z - (p.tz ?? target.z) - deltaZ * carry) / STEP;
      const spring = 40, drag = 7;
      integrate(p, STEP,
        (target.x - p.x) * spring + (targetVX - (p.x - p.px) / STEP) * drag,
        (target.y - p.y) * spring + (targetVY - (p.y - p.py) / STEP) * drag,
        (target.z - p.z) * spring + (targetVZ - (p.z - p.pz) / STEP) * drag - 1.1);
      p.tx = target.x; p.ty = target.y; p.tz = target.z;
    }
  }
  for (let iteration = 0; iteration < 8; iteration++) {
    for (const arm of squid.tentacles) {
      for (let joint = SQUID_SEGMENTS; joint >= 1; joint--) constraint(arm[joint - 1], arm[joint], LINK, joint === 1);
      for (let joint = 1; joint <= SQUID_SEGMENTS; joint++) {
        constraint(arm[joint - 1], arm[joint], LINK, joint === 1);
        if (joint > 1 && Math.hypot(arm[joint].x - arm[joint - 2].x,
          arm[joint].y - arm[joint - 2].y, arm[joint].z - arm[joint - 2].z) < LINK * 1.65)
          constraint(arm[joint - 2], arm[joint], LINK * 1.65, joint === 2);
        if (iteration % 2 === 1) contact(arm[joint], armRadius(joint), local, player, squid);
      }
    }
  }
  for (const arm of squid.tentacles) {
    for (let joint = 1; joint <= SQUID_SEGMENTS; joint++)
      capsuleContacts(arm[joint - 1], arm[joint], joint === 1, local, player, probe, armRadius(joint - 1), squid);
  }
  // Player contact never changes the player or suit: only the passive animal reacts.
  contact(squid, SQUID_HEAD_RADIUS, local, null);
  anchors(squid);
}

/** Four deterministic, round-headed Arctic squids with a nominal 3m silhouette.
 * @param {object} world @param {number} [seed] @returns {Squid[]}
 */
export function createSquids(world, seed = world.seed ?? 1) {
  if (!Number.isFinite(seed)) throw new TypeError("Squid seed must be finite.");
  const rng = random(seed ^ 0x5a1d);
  const homes = [[240, 50, -120], [-440, 100, -130], [-1350, 600, -145], [650, -1050, -130]];
  const env = environment(world);
  return homes.map(([homeX, homeY, homeZ], index) => {
    let squid;
    for (let attempt = 0; attempt < 160; attempt++) {
      const x = homeX + (attempt ? (rng() - 0.5) * 200 : 0);
      const y = homeY + (attempt ? (rng() - 0.5) * 200 : 0);
      const z = Math.max(getSeabedHeight(x, y) + 75, homeZ - (attempt % 4) * 15);
      squid = { id: `arctic-squid-${index}`, ...node(x, y, z), homeX: x, homeY: y, homeZ: z,
        heading: rng() * TAU, seed: Math.floor(rng() * 10000), headRadius: SQUID_HEAD_RADIUS,
        lengthMeters: SQUID_LENGTH_METERS, tentacles: [] };
      for (let arm = 0; arm < SQUID_TENTACLE_COUNT; arm++) {
        const angle = arm * TAU / SQUID_TENTACLE_COUNT + squid.heading;
        squid.tentacles.push(Array.from({ length: SQUID_SEGMENTS + 1 }, (_, joint) =>
          node(x + Math.cos(angle) * 11, y + Math.sin(angle) * 11, z - 9 - joint * LINK)));
      }
      const local = nearby(env, squid);
      const clear = (p, radius) => {
        const probe = { x: p.x, y: p.y, z: p.z };
        projectSphere(probe, radius, local, null);
        return Math.hypot(probe.x - p.x, probe.y - p.y, probe.z - p.z) < 0.001;
      };
      const clearArm = (arm) => arm.every((p, joint) => clear(p, armRadius(joint)))
        && arm.slice(1).every((b, link) => [0.25, 0.5, 0.75].every((t) => {
          const a = arm[link];
          return clear({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t,
            z: a.z + (b.z - a.z) * t }, Math.hypot(armRadius(link), LINK / 8));
        }));
      if (clear(squid, SQUID_HEAD_RADIUS) && squid.tentacles.every(clearArm)) break;
      if (attempt === 159) throw new Error(`Could not place ${squid.id} clear of Arctic ice and ground.`);
    }
    return squid;
  });
}

/** Fixed-step Verlet/PBD simulation. Far animals sleep without storing a long
 * catch-up interval; replacing world.squids resets the nonserialized clock.
 * @param {object} world @param {number} dt
 */
export function updateSquids(world, dt) {
  if (!Number.isFinite(dt) || dt <= 0 || !world.squids?.length) return;
  let state = states.get(world);
  if (!state || state.squids !== world.squids) {
    state = { squids: world.squids, accumulator: 0, time: 0, awake: new WeakSet(), probe: { x: 0, y: 0, z: 0 } };
    states.set(world, state);
  }
  state.accumulator += Math.min(0.1, dt);
  const env = environment(world);
  while (state.accumulator + 1e-10 >= STEP) {
    state.accumulator = Math.max(0, state.accumulator - STEP); state.time += STEP;
    for (const squid of world.squids) {
      if (squid.squidHeldBy || squid.squidRespawnIn > 0) continue;
      const distant = world.player && Math.hypot(squid.x - world.player.x,
        squid.y - world.player.y, squid.z - world.player.z) > 1000;
      if (distant) { state.awake.delete(squid); continue; }
      if (!state.awake.has(squid)) {
        for (const p of [squid, ...squid.tentacles.flat()]) {
          p.px = p.sx = p.x; p.py = p.sy = p.y; p.pz = p.sz = p.z;
        }
        state.awake.add(squid);
      }
      substep(squid, nearby(env, squid), world.player, state.time, state.probe, world);
    }
  }
}
