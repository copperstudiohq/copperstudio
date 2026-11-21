import {ADDITIONAL_TREE_STALKERS} from './wildlife-expansion-data.js';
import {EXTRA_TREE_STALKER_SITES} from './tree-stalker-sites.js';
import { selector, sequence, condition, action, RUNNING } from "./behavior-tree.js";
import { EYE_HEIGHT, WATER_LEVEL } from "./terrain.js";
import { getForestHeight, resolveForestMovement } from "./forest-terrain.js";
import { TREE_STALKER_HEIGHT, TREE_STALKER_EYE_LOCAL } from "./tree-stalker-anatomy.js";

const SCALE = 25, TAU = Math.PI * 2;
export const TREE_STALKER_NOTICE_METERS = 40;
export const TREE_STALKER_SPRINT_METERS = 10;
export const TREE_STALKER_CONTACT_METERS = 1.3;
export const TREE_STALKER_STALK_SPEED = 25;
export const TREE_STALKER_SPRINT_SPEED = 225;
const BODY_RADIUS = 10, DRY_GROUND = WATER_LEVEL + 12;
const SIGHT_INTERVAL = .15, MEMORY_SECONDS = 5, ATTACK_SECONDS = 1.8;
const obstacleCaches = new WeakMap();
const finitePoint = (p) => Boolean(p && [p.x, p.y, p.z].every(Number.isFinite));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** @typedef {{x:number,y:number,z:number}} StalkerPoint */
/** All distances/speeds use simulation units; movePhase uses radians.
 * @typedef {{id:string,x:number,y:number,z:number,heading:number,homeX:number,homeY:number,homeZ:number,
 * state:'camouflaged'|'stalking'|'sprinting'|'retreating',movePhase:number,speed:number,heightMeters:number,
 * memoryLeft:number,attackCooldown:number,sightCheckIn:number,lastVisible:boolean,lastSeen:StalkerPoint|null,
 * eyeTarget:StalkerPoint|null,steerSide:number}} TreeStalker
 */

/** Six authored forest residents, cloned with the rest of the prepared world. */
export const PREPARED_TREE_STALKERS = Object.freeze([Object.freeze({
  id: "forest-tree-stalker-0", x: 5900, y: 2600, z: 255.19400708764547,
  homeX: 5900, homeY: 2600, homeZ: 255.19400708764547,
  heading: -Math.PI / 2, state: "camouflaged", movePhase: 0, speed: 0, heightMeters: TREE_STALKER_HEIGHT,
  memoryLeft: 0, attackCooldown: 0, sightCheckIn: 0, lastVisible: false,
  lastSeen: null, eyeTarget: null, steerSide: 1,
}), ...ADDITIONAL_TREE_STALKERS.map(stalker=>Object.freeze(stalker)),...EXTRA_TREE_STALKER_SITES.map(site=>Object.freeze({
  ...site,homeX:site.x,homeY:site.y,homeZ:site.z,state:'camouflaged',movePhase:0,speed:0,heightMeters:TREE_STALKER_HEIGHT,
  memoryLeft:0,attackCooldown:0,sightCheckIn:0,lastVisible:false,lastSeen:null,eyeTarget:null,
}))]);

/** @returns {TreeStalker[]} */
export function createTreeStalkers() { return structuredClone(PREPARED_TREE_STALKERS); }

/** @param {object} world @returns {TreeStalker[]} */
export function resetTreeStalkers(world) {
  if (!world || typeof world !== "object") throw new TypeError("Tree stalkers need a world to reset.");
  world.treeStalkers = createTreeStalkers();
  return world.treeStalkers;
}

function obstaclesFor(forest) {
  if (!forest || typeof forest !== "object") return [];
  if (obstacleCaches.has(forest)) return obstacleCaches.get(forest);
  const obstacles = [];
  for (const tree of forest.trees ?? []) obstacles.push({
    ax: tree.x, ay: tree.y, bx: tree.x, by: tree.y,
    radius: tree.trunkRadius ?? tree.radius * .12, low: tree.z, high: tree.z + tree.height * .82,
  });
  for (const rock of forest.rocks ?? []) obstacles.push({
    ax: rock.x, ay: rock.y, bx: rock.x, by: rock.y,
    radius: rock.radius, low: rock.z, high: rock.z + rock.height,
  });
  for (const log of forest.logs ?? []) {
    const dx = Math.cos(log.heading) * log.length / 2, dy = Math.sin(log.heading) * log.length / 2;
    obstacles.push({ ax: log.x - dx, ay: log.y - dy, bx: log.x + dx, by: log.y + dy,
      radius: log.radius, low: log.z, high: log.z + log.radius * 2 });
  }
  obstacleCaches.set(forest, obstacles);
  return obstacles;
}

function projection(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  return clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
}

/** Closest 2D ray/capsule points retain the ray fraction for height occlusion. */
function rayDistance(from, to, obstacle) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const ox = obstacle.bx - obstacle.ax, oy = obstacle.by - obstacle.ay;
  const wx = obstacle.ax - from.x, wy = obstacle.ay - from.y;
  const denominator = dx * oy - dy * ox;
  if (Math.abs(denominator) > 1e-9) {
    const t = (wx * oy - wy * ox) / denominator;
    const u = (wx * dy - wy * dx) / denominator;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { distance: 0, t };
  }
  const candidates = [];
  for (const [x, y] of [[obstacle.ax, obstacle.ay], [obstacle.bx, obstacle.by]]) {
    const t = projection(x, y, from.x, from.y, to.x, to.y);
    candidates.push({ distance: Math.hypot(from.x + dx * t - x, from.y + dy * t - y), t });
  }
  for (const t of [0, 1]) {
    const x = from.x + dx * t, y = from.y + dy * t;
    const u = projection(x, y, obstacle.ax, obstacle.ay, obstacle.bx, obstacle.by);
    candidates.push({ distance: Math.hypot(x - obstacle.ax - ox * u, y - obstacle.ay - oy * u), t });
  }
  return candidates.reduce((best, candidate) => candidate.distance < best.distance ? candidate : best);
}

/** Sample broad hills and test actual solid trunks, rocks and log capsules.
 * Sight is refreshed at most once per 150ms of simulation, never wall time.
 */
function canSee(world, stalker, player) {
  const scale = stalker.heightMeters / TREE_STALKER_HEIGHT;
  const forward = TREE_STALKER_EYE_LOCAL[2] * SCALE * scale;
  const from = { x: stalker.x + Math.cos(stalker.heading) * forward,
    y: stalker.y + Math.sin(stalker.heading) * forward,
    z: stalker.z + TREE_STALKER_EYE_LOCAL[1] * SCALE * scale };
  const to = { x: player.x, y: player.y, z: player.z + EYE_HEIGHT };
  const samples = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 30));
  for (let sample = 1; sample < samples; sample++) {
    const t = sample / samples;
    const height = getForestHeight(world, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
    if (height !== null && from.z + (to.z - from.z) * t <= height + 2) return false;
  }
  const minX = Math.min(from.x, to.x), maxX = Math.max(from.x, to.x);
  const minY = Math.min(from.y, to.y), maxY = Math.max(from.y, to.y);
  for (const obstacle of obstaclesFor(world.forest)) {
    if (Math.max(obstacle.ax, obstacle.bx) + obstacle.radius < minX
      || Math.min(obstacle.ax, obstacle.bx) - obstacle.radius > maxX
      || Math.max(obstacle.ay, obstacle.by) + obstacle.radius < minY
      || Math.min(obstacle.ay, obstacle.by) - obstacle.radius > maxY) continue;
    const hit = rayDistance(from, to, obstacle);
    const height = from.z + (to.z - from.z) * hit.t;
    if (hit.distance <= obstacle.radius + .25 && height >= obstacle.low && height <= obstacle.high) return false;
  }
  return true;
}

function dryFootprint(world, x, y) {
  for (const [dx, dy] of [[0, 0], [BODY_RADIUS, 0], [-BODY_RADIUS, 0], [0, BODY_RADIUS], [0, -BODY_RADIUS]]) {
    const height = getForestHeight(world, x + dx, y + dy);
    if (height === null || height < DRY_GROUND) return false;
  }
  return true;
}

/** Sweep the whole step in pieces no longer than half the body radius. */
function supportedMove(world, stalker, target) {
  const dx = target.x - stalker.x, dy = target.y - stalker.y;
  const samples = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (BODY_RADIUS / 2)));
  let previous = { x: stalker.x, y: stalker.y, z: stalker.z };
  for (let sample = 1; sample <= samples; sample++) {
    const x = stalker.x + dx * sample / samples, y = stalker.y + dy * sample / samples;
    const z = getForestHeight(world, x, y), length = Math.hypot(x - previous.x, y - previous.y);
    if (z === null || !dryFootprint(world, x, y) || Math.abs(z - previous.z) > length * .65 + 2) return null;
    const moved = resolveForestMovement(world, previous, { x, y, z }, stalker.heightMeters * SCALE, BODY_RADIUS);
    const traveled = Math.hypot(moved.x - previous.x, moved.y - previous.y);
    const ground = getForestHeight(world, moved.x, moved.y);
    if (traveled > BODY_RADIUS / 2 + .001 || ground === null || !dryFootprint(world, moved.x, moved.y)
      || Math.abs(ground - previous.z) > traveled * .65 + 2) return null;
    previous = { x: moved.x, y: moved.y, z: ground };
  }
  return previous;
}

/** Short supported steering choices slide around physical props without snapping. */
function moveToward(world, stalker, goal, desiredSpeed, dt, stoppingDistance) {
  const dx = goal.x - stalker.x, dy = goal.y - stalker.y, length = Math.hypot(dx, dy);
  const step = Math.min(desiredSpeed * dt, Math.max(0, length - stoppingDistance));
  if (step <= 1e-6) { stalker.speed = 0; return; }
  const heading = Math.atan2(dy, dx), side = stalker.steerSide === -1 ? -1 : 1;
  let best = null;
  for (const offset of [0, side * .4, -side * .4, side * .8, -side * .8, side * 1.2, -side * 1.2, side * 1.65, -side * 1.65]) {
    const x = stalker.x + Math.cos(heading + offset) * step;
    const y = stalker.y + Math.sin(heading + offset) * step;
    const moved = supportedMove(world, stalker, { x, y });
    if (!moved) continue;
    const traveled = Math.hypot(moved.x - stalker.x, moved.y - stalker.y);
    if (traveled < step * .2 || traveled > step + .001) continue;
    const score = Math.hypot(goal.x - moved.x, goal.y - moved.y) + Math.abs(offset) * 6 + (step - traveled) * 12;
    if (!best || score < best.score) best = { ...moved, traveled, score, offset };
    // A full unobstructed straight step already minimizes distance and both
    // penalties; alternate directions cannot improve its score.
    if (offset === 0 && traveled >= step - 1e-6 && Math.hypot(moved.x - x, moved.y - y) < 1e-6) break;
  }
  if (!best) { stalker.speed = 0; return; }
  stalker.heading = Math.atan2(best.y - stalker.y, best.x - stalker.x);
  stalker.x = best.x; stalker.y = best.y; stalker.z = best.z;
  stalker.speed = best.traveled / dt;
  const stride = stalker.state === "sprinting" ? 3.4 : 1.6;
  stalker.movePhase = (stalker.movePhase + best.traveled / (stride * SCALE) * TAU) % TAU;
  if (Math.abs(best.offset) > .1) stalker.steerSide = Math.sign(best.offset);
}

const stalkerBrains = new WeakMap();
function stalkerBrain(stalker) {
  let brain = stalkerBrains.get(stalker);
  if (!brain) { brain = { time: 0, blocked: 0, side: stalker.steerSide || 1 }; stalkerBrains.set(stalker, brain); }
  return brain;
}
const stalkerAction = (name, run) => action(name, (context) => {
  if (name !== "return-and-camouflage" || context.stalker.state !== "camouflaged") context.stalker.behavior = name;
  run(context); return RUNNING;
});
export const TREE_STALKER_BEHAVIOR_TREE = selector("forest-hunter",
  sequence("close-range-charge", condition("charge-trigger", (c) => c.pursuing && c.eligible
    && (c.range <= TREE_STALKER_SPRINT_METERS * SCALE || c.stalker.state === "sprinting"
      && (c.visible || c.stalker.memoryLeft > MEMORY_SECONDS - 1.5))),
  stalkerAction("charge", (c) => { c.stalker.state = "sprinting";
    moveToward(c.world, c.stalker, c.stalker.lastSeen, TREE_STALKER_SPRINT_SPEED, c.delta, TREE_STALKER_CONTACT_METERS * SCALE * .65); })),
  sequence("lost-sight-search", condition("remembered-target", (c) => c.pursuing && !c.visible),
  stalkerAction("search-last-seen", (c) => {
    c.stalker.state = "stalking";
    const known = c.stalker.lastSeen;
    const goal = distance(c.stalker, known) > 30 ? known : {
      x: known.x + Math.cos(c.brain.time * .9) * 45, y: known.y + Math.sin(c.brain.time * .9) * 45, z: known.z };
    moveToward(c.world, c.stalker, goal, TREE_STALKER_STALK_SPEED, c.delta, 8);
  })),
  sequence("blocked-flank", condition("route-blocked", (c) => c.pursuing && c.brain.blocked > .6),
  stalkerAction("flank-obstacle", (c) => {
    c.stalker.state = "stalking";
    const dx = c.stalker.lastSeen.x - c.stalker.x, dy = c.stalker.lastSeen.y - c.stalker.y, length = Math.hypot(dx, dy) || 1;
    const goal = { x: c.stalker.lastSeen.x - dy / length * 90 * c.brain.side,
      y: c.stalker.lastSeen.y + dx / length * 90 * c.brain.side, z: c.stalker.lastSeen.z };
    moveToward(c.world, c.stalker, goal, TREE_STALKER_STALK_SPEED, c.delta, 8);
    if (c.brain.blocked > 1.6) { c.brain.side *= -1; c.brain.blocked = .7; }
  })),
  sequence("quiet-approach", condition("visible-prey", (c) => c.pursuing),
  stalkerAction("stalk", (c) => { c.stalker.state = "stalking";
    moveToward(c.world, c.stalker, c.stalker.lastSeen, TREE_STALKER_STALK_SPEED, c.delta, TREE_STALKER_CONTACT_METERS * SCALE * .65); })),
  stalkerAction("return-and-camouflage", (c) => {
    c.stalker.eyeTarget = null;
    const home = { x: c.stalker.homeX, y: c.stalker.homeY, z: c.stalker.homeZ };
    if (distance(c.stalker, home) <= 12) { c.stalker.state = "camouflaged"; c.stalker.speed = 0; }
    else { c.stalker.state = "retreating"; moveToward(c.world, c.stalker, home, TREE_STALKER_STALK_SPEED, c.delta, 5); }
  }));

/** Mutates only stalkers. The World starts captures from returned contacts and applies threat
 * priority, preserving the existing rescue and encounter rules.
 * @param {object} world @param {number} dt
 * @returns {{active:boolean,distance:number,message:string,kind:'tree-stalker',contacts:{id:string}[]}}
 */
export function updateTreeStalkers(world, dt) {
  const result = { active: false, distance: Infinity, message: "", kind: /** @type {const} */ ("tree-stalker"), contacts: [] };
  if (!world || !Array.isArray(world.treeStalkers) || !Number.isFinite(dt) || dt <= 0) return result;
  const delta = Math.min(.05, dt), player = world.player;
  const eligible = finitePoint(player) && player.health > 0 && !player.swimming && !player.underwater
    && !world.squidEncounter && !world.centipedeEncounter && !world.treeStalkerEncounter
    && getForestHeight(world, player.x, player.y) !== null;
  for (const stalker of world.treeStalkers) {
    if (stalker.squidHeldBy || stalker.squidRespawnIn > 0) continue;
    if (!finitePoint(stalker) || ![stalker.homeX, stalker.homeY, stalker.homeZ, stalker.heightMeters].every(Number.isFinite)) continue;
    if (world.treeStalkerEncounter?.stalkerId === stalker.id) { stalker.speed = 0; continue; }
    stalker.attackCooldown = Math.max(0, stalker.attackCooldown - delta);
    stalker.memoryLeft = Math.max(0, stalker.memoryLeft - delta);
    stalker.sightCheckIn = Math.max(0, stalker.sightCheckIn - delta);
    const range = finitePoint(player) ? distance(stalker, player) : Infinity;
    if (eligible && range <= TREE_STALKER_NOTICE_METERS * SCALE) {
      if (stalker.sightCheckIn <= 0) {
        stalker.lastVisible = canSee(world, stalker, player); stalker.sightCheckIn = SIGHT_INTERVAL;
      }
      if (stalker.lastVisible) {
        stalker.memoryLeft = MEMORY_SECONDS;
        stalker.lastSeen = { x: player.x, y: player.y, z: player.z };
        stalker.eyeTarget = { x: player.x, y: player.y, z: player.z + EYE_HEIGHT };
      }
    } else { stalker.lastVisible = false; stalker.sightCheckIn = 0; }
    const pursuing = stalker.memoryLeft > 0 && finitePoint(stalker.lastSeen);
    const brain = stalkerBrain(stalker); brain.time += delta;
    TREE_STALKER_BEHAVIOR_TREE.tick({ world, stalker, delta, brain, range, pursuing, eligible,
      visible: eligible && stalker.lastVisible });
    brain.blocked = pursuing && stalker.speed < TREE_STALKER_STALK_SPEED * .2 ? brain.blocked + delta : 0;
    const currentRange = finitePoint(player) ? distance(stalker, player) : Infinity;
    if (eligible && pursuing) {
      result.active = true; result.distance = Math.min(result.distance, currentRange);
      if (stalker.state === "sprinting") result.message = "TREE STALKER SPRINTING — KEEP MOVING";
      else if (!result.message) result.message = "TREE STALKER APPROACHING";
      if (currentRange <= TREE_STALKER_CONTACT_METERS * SCALE && stalker.attackCooldown <= 0 && canSee(world, stalker, player)) {
        result.contacts.push({ id: stalker.id }); stalker.attackCooldown = ATTACK_SECONDS;
      }
    }
  }
  return result;
}
