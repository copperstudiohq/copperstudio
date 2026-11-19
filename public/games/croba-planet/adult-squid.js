import {coordinateSquidHunt} from './squid-hunt-calls.js';
import {observeSquidPlayer,squidSearchGoal} from './squid-intelligence.js';
import { headSideRatio, closestFlatHeadLocal } from './adult-head-shape.js';
import { adultSwimmingOrientation } from './adult-squid-swim.js';
import { chooseSquidPrey, advanceSquidFeeding, updateSquidPreyRespawns, unavailablePrey } from './squid-feeding.js';
import { getSquidClawAxis } from "./squid-claw-anatomy.js";
import { selector, sequence, condition, action, RUNNING } from "./behavior-tree.js";
import { BLUE_OCEAN_START_X, EYE_HEIGHT, WATER_LEVEL, WORLD_BOUNDS } from "./terrain.js";
import { getSeabedHeight } from "./seabed.js";
import { getSquidOrientation, squidLocalToWorld } from "./squid-frame.js";
import { findSquidSurfaceContact } from "./squid-surfaces.js";
import { getForestCollision } from "./forest-terrain.js";
import { ADULT_SQUID_MOUTH_LOCAL, ADULT_SQUID_HEAD_Y_SCALE, getAdultSquidHeadYScale, ADULT_SQUID_EYE_LAYOUT, ADULT_SQUID_EYE_SCALE } from "./adult-squid-anatomy.js";

/** Fallback dimensions for the archived design. Live adults carry their own
 * authored 30-meter anatomy, including arm length, thickness and eye scale. */
export const ADULT_SQUID_LENGTH_METERS = 50;
export const ADULT_SQUID_HEAD_RADIUS = 250;
export const ADULT_SQUID_ARM_LENGTH = 850;
export const ADULT_SQUID_PULL_SPEED = 350;
export const ADULT_SQUID_SWIM_SPEED = 200;
export const ADULT_SQUID_PATROL_SPEED = 75;
export const ADULT_SQUID_EATING_SECONDS = 2;
export const ADULT_SQUID_STRIKE_SECONDS = 1.1;
export const ADULT_SQUID_SHARED_BITE_SECONDS = 4.2;
export const ADULT_SQUID_OBSERVING_SECONDS = 3;
export const ADULT_SQUID_COOLDOWN_SECONDS = 8;
export const ADULT_SQUID_SURFACE_GRIP_SECONDS = 2;
export const ADULT_SQUID_STEP_LIFT_SECONDS = 0.3;
const STEP = 1 / 60;
const ARMS = 8, LINKS = 8, LINK = ADULT_SQUID_ARM_LENGTH / LINKS;
const ARM_SWIM_SPEED = 1000, ARM_CAPTURE_SPEED = 800;
const ARM_ANGLES = [45, 75, 105, 135, 225, 255, 285, 315].map((degrees) => degrees * Math.PI / 180);
const states = new WeakMap();

/** @typedef {{x:number,y:number,z:number}} Point3 */
/** @typedef {{squidId:string,phase:'grabbed'|'observing'|'to-mouth'|'striking'|'shared-bite'|'handoff'|'eating',armIndex:number,elapsed:number,progress:number,target:Point3,eyeIndex?:number}} SquidEncounter */
/** @typedef {{linkIndex:number,along:number,point:Point3,surfacePoint:Point3,normal:Point3,kind:'seabed'|'stone'|'forest',remaining:number}} SquidSurfaceGrip */
const finitePoint = (p) => p && [p.x, p.y, p.z].every(Number.isFinite);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const copy = (p) => ({ x: p.x, y: p.y, z: p.z });
const radiusAt = (link, squid) => (squid?.armRadius ?? 45) * 0.84 ** link;
const armLength = (squid) => squid?.armLength ?? ADULT_SQUID_ARM_LENGTH;
const linkLength = (squid) => armLength(squid) / LINKS;

function valid(squid) {
  return finitePoint(squid) && typeof squid.id === "string"
    && [squid.homeX, squid.homeY, squid.homeZ].every(Number.isFinite) && Array.isArray(squid.tentacles) && squid.tentacles.length === ARMS
    && squid.tentacles.every((arm) => Array.isArray(arm) && arm.length === LINKS + 1 && arm.every(finitePoint));
}
function stateFor(world) {
  let state = states.get(world);
  if (!state || state.adults !== world.adultSquids) {
    state = { adults: world.adultSquids, accumulator: 0, time: 0, cooldown: 0, capture: null, finished: false, awake: new WeakSet(), brains: new WeakMap() };
    states.set(world, state);
  }
  return state;
}

const PATROL = [[120, 0, 0], [0, 100, 20], [-120, 0, 0], [0, -100, -20]];

function brainFor(state, squid) {
  let brain = state.brains.get(squid);
  if (!brain) {
    brain = { patrol: 0, hunting: false, random: ((squid.seed ?? 1) ^ 0xad017) >>> 0, lastArm: -1,
      lifts: Array(ARMS).fill(null), searchLeft: 0, lastSeen: null, blocked: 0, rerouteLeft: 0 };
    state.brains.set(squid, brain); squid.activeArm = null; squid.noticedPlayer = false;
  }
  return brain;
}

const squidAction = (name, run) => action(name, (c) => {
  c.squid.behavior = name; c.brain.mode = name; run?.(c); return RUNNING;
});
export const ADULT_SQUID_BEHAVIOR_TREE = selector("ocean-hunter",
  sequence("captive-priority", condition("holding-prey", (c) => Boolean(c.state.capture)),
    squidAction("handle-captive", (c) => { c.brain.goal = null; })),
  sequence("sharing-partner", condition("partner-has-captive", (c) => Boolean(c.world.squidEncounter?.partnerId)&&c.world.squidEncounter.partnerId===c.squid.id),
    squidAction("receive-shared-prey", (c) => {
      const captor=c.world.adultSquids.find(s=>s.id===c.world.squidEncounter.squidId);
      const dx=c.squid.x-captor.x,dy=c.squid.y-captor.y,length=Math.hypot(dx,dy)||1;
      const gap=c.squid.headRadius+captor.headRadius+190;
      c.brain.goal={x:captor.x+dx/length*gap,y:captor.y+dy/length*gap,z:captor.z};
    })),
  sequence("blocked-route", condition("needs-reposition", (c) => c.noticed && (c.brain.blocked > .7 || c.brain.rerouteLeft > 0)
    && !c.squid.surfaceGrips?.some(Boolean)),
    squidAction("reposition", (c) => {
      if (c.brain.rerouteLeft <= 0) {
        c.brain.rerouteLeft = .8;
        c.brain.detour = repositionGoal(c.world,c.squid,c.brain.intercept ?? c.brain.lastSeen);
      }
      c.brain.goal = c.brain.detour;
    })),
  sequence("live-pursuit", condition("prey-noticed", (c) => c.noticed),
    squidAction("pursue", (c) => { c.brain.goal = c.brain.intercept ?? c.brain.lastSeen; })),
  sequence("answer-hunt-call", condition("called-by-adult", (c) => Boolean(c.brain.assist)),
    squidAction("assist-hunt", (c) => { c.brain.goal = c.brain.assist.goal; })),
  sequence("lost-target-search", condition("search-memory", (c) => c.brain.searchLeft > 0 && c.brain.lastSeen
    && blueOceanSwimmer(c.world.player)),
    squidAction("search-last-seen", (c) => { c.brain.goal = squidSearchGoal(c.squid,c.brain); })),
  sequence("wildlife-forage", condition("prey-chosen", (c) => Boolean(c.meal)),
    squidAction("hunt-wildlife", (c) => { c.brain.goal = { ...c.meal.target }; })),
  sequence("territory-return", condition("away-from-home", (c) => distance(c.squid,
    { x: c.squid.homeX, y: c.squid.homeY, z: c.squid.homeZ }) > 150),
    squidAction("return-to-territory", (c) => { c.brain.goal = { x: c.squid.homeX, y: c.squid.homeY, z: c.squid.homeZ }; })),
  squidAction("patrol", (c) => { c.brain.goal = null; }));

/** One seeded choice per engagement, never a frame-by-frame reroll. */
function chooseArm(squid, hunting, state) {
  const brain = brainFor(state, squid);
  if (state.capture) { squid.activeArm = state.capture.armIndex; return; }
  if (!hunting) { squid.activeArm = null; brain.hunting = false; return; }
  if (!brain.hunting) {
    brain.random = (Math.imul(brain.random, 1664525) + 1013904223) >>> 0;
    let selected = Math.floor(brain.random / 4294967296 * ARMS);
    if (selected === brain.lastArm) selected = (selected + 1 + (brain.random >>> 8) % 7) % ARMS;
    squid.activeArm = selected; brain.lastArm = selected; brain.hunting = true;
  }
}

/** The actual lower beak point, shared with the scaled renderer, in simulation axes. */
export function getAdultSquidMouth(squid) {
  const radius = Number.isFinite(squid?.headRadius) ? squid.headRadius : ADULT_SQUID_HEAD_RADIUS;
  return squidLocalToWorld(squid, ...ADULT_SQUID_MOUTH_LOCAL.map((coordinate, axis) =>
    coordinate * radius * (axis === 1 ? getAdultSquidHeadYScale(squid) : 1)));
}

/** The actual eye center and an outside holding point share the renderer layout. */
export function getAdultSquidEyeTarget(squid, index = 2) {
  const [x, y] = ADULT_SQUID_EYE_LAYOUT[index] ?? ADULT_SQUID_EYE_LAYOUT[2], radius = squid.headRadius;
  return squidLocalToWorld(squid, x * radius, y * radius * getAdultSquidHeadYScale(squid),
    (Math.sqrt(1 - x * x - y * y) + .09 * (squid.eyeScale ?? ADULT_SQUID_EYE_SCALE)) * radius);
}
export function getAdultSquidObservationPoint(squid, index = 2) {
  const [x, y] = ADULT_SQUID_EYE_LAYOUT[index] ?? ADULT_SQUID_EYE_LAYOUT[2], radius = squid.headRadius;
  const z = Math.sqrt(1 - x * x - y * y);
  const length = Math.hypot(x, y / getAdultSquidHeadYScale(squid), z);
  const normal = { x: x / length * .65, y: y / getAdultSquidHeadYScale(squid) / length * .65, z: z / length * .65 + .35 };
  const nl = Math.hypot(normal.x, normal.y, normal.z), offset = radius * .085 * (squid.eyeScale ?? ADULT_SQUID_EYE_SCALE) + 60;
  const point = squidLocalToWorld(squid, x * radius + normal.x / nl * offset,
    y * radius * getAdultSquidHeadYScale(squid) + normal.y / nl * offset,
    (z + .09 * (squid.eyeScale ?? ADULT_SQUID_EYE_SCALE)) * radius + normal.z / nl * offset);
  return outsideHead(point, squid, distance(point, squid));
}

function headLocalPoint(squid, point) {
  const q = getSquidOrientation(squid), x = point.x - squid.x, y = point.z - squid.z, z = point.y - squid.y;
  const tx = 2 * (-q.y * z + q.z * y), ty = 2 * (-q.z * x + q.x * z), tz = 2 * (-q.x * y + q.y * x);
  return { x: x + q.w * tx - q.y * tz + q.z * ty,
    y: y + q.w * ty - q.z * tx + q.x * tz, z: z + q.w * tz - q.x * ty + q.y * tx };
}

/** Closest point on the axisymmetric head. Outside points use a bounded
 * Newton solve of the ellipsoid's scalar normal-offset equation. */
function closestHeadLocal(point, radius, ratio = 1, height = ADULT_SQUID_HEAD_Y_SCALE) {
  if (ratio < 1) return closestFlatHeadLocal(point, radius, ratio, height);
  const x = point.x / radius, y = point.y / radius, z = point.z / radius;
  const heightSquared = height ** 2, radialSquared = x * x + z * z;
  const gauge = Math.sqrt(radialSquared + y * y / heightSquared);
  let sx, sy, sz;
  if (gauge <= 1) {
    const scale = gauge > 1e-12 ? 1 / gauge : 0;
    sx = gauge ? x * scale : 1; sy = y * scale; sz = z * scale;
  } else {
    let low = 0, high = height * Math.hypot(x, y, z);
    let lambda = Math.min(high, Math.max(0, Math.hypot(x, y, z) - 1));
    for (let iteration = 0; iteration < 12; iteration++) {
      const horizontal = 1 + lambda, vertical = heightSquared + lambda;
      const value = radialSquared / horizontal ** 2 + heightSquared * y * y / vertical ** 2 - 1;
      if (Math.abs(value) < 1e-13) break;
      if (value > 0) low = lambda; else high = lambda;
      const slope = -2 * radialSquared / horizontal ** 3 - 2 * heightSquared * y * y / vertical ** 3;
      const next = lambda - value / slope;
      lambda = next > low && next < high ? next : (low + high) / 2;
    }
    sx = x / (1 + lambda); sy = heightSquared * y / (heightSquared + lambda); sz = z / (1 + lambda);
  }
  const normalLength = Math.hypot(sx, sy / heightSquared, sz) || 1;
  return { x: sx * radius, y: sy * radius, z: sz * radius,
    nx: sx / normalLength, ny: sy / heightSquared / normalLength, nz: sz / normalLength,
    distance: Math.hypot(x - sx, y - sy, z - sz) * radius * (gauge < 1 ? -1 : 1) };
}

/** Sphere contact against the actual adult oval, with a true normal offset.
 * The nominal head radius remains unchanged; this never affects juveniles. */
export function getAdultSquidHeadContact(squid, point, radius = 0) {
  const local = headLocalPoint(squid, point), headRadius = squid.headRadius ?? ADULT_SQUID_HEAD_RADIUS;
  if (Math.hypot(local.x * headSideRatio(squid), local.y / getAdultSquidHeadYScale(squid), local.z) >= headRadius + radius) return null;
  const contact = closestHeadLocal(local, headRadius, headSideRatio(squid), getAdultSquidHeadYScale(squid));
  if (contact.distance >= radius - 1e-8) return null;
  return { distance: contact.distance, escape: squidLocalToWorld(squid,
    contact.x + contact.nx * radius, contact.y + contact.ny * radius, contact.z + contact.nz * radius) };
}

/** Surface swimmers can be noticed; only submerged eyes permit a physical grab. */
function blueOceanSwimmer(player) {
  return finitePoint(player) && player.swimming === true && player.x >= BLUE_OCEAN_START_X;
}
function eligible(player) {
  return blueOceanSwimmer(player) && player.z + EYE_HEIGHT < WATER_LEVEL;
}
function eye(player) { return { x: player.x, y: player.y, z: player.z + EYE_HEIGHT }; }

function clampAnimal(p, radius, body, forest, head = false) {
  const redesignedHead = head && p.designVersion === 2;
  const envelope = !body && (head || radius === ADULT_SQUID_HEAD_RADIUS)
    ? radius * (redesignedHead ? 1.7 : getAdultSquidHeadYScale(p)) : radius;
  p.x = Math.max(BLUE_OCEAN_START_X + envelope + 1, Math.min(WORLD_BOUNDS.maxX - envelope, p.x));
  p.y = Math.max(WORLD_BOUNDS.minY + envelope, Math.min(WORLD_BOUNDS.maxY - envelope, p.y));
  p.z = Math.max(getSeabedHeight(p.x, p.y) + envelope + 0.01,
    Math.min(WATER_LEVEL - envelope - 5, p.z));
  // The extra headland margin also clears the projecting beak and the exterior
  // capture arc. The actual head sphere remains ten metres in radius.
  const forestHit = getForestCollision(forest, p, head || radius === ADULT_SQUID_HEAD_RADIUS
    ? radius * (redesignedHead ? 1.7 : 1.4) : radius);
  if (forestHit) Object.assign(p, forestHit.escape);
  if (body) {
    const contact = getAdultSquidHeadContact(body, p, radius);
    if (contact) Object.assign(p, contact.escape);
  }
}

/** Eight adult-only side sockets. The root's 45-unit joint touches the head
 * sphere, while the two four-arm flanks leave the face centre unobstructed.
 * @param {object} squid @param {number} index @returns {Point3}
 */
export function getAdultSquidArmRoot(squid, index) {
  return getAdultSquidArmRestPoint(squid, index, 0);
}

/** Authored full-length rest pose in the complete body frame. The first two
 * links fan outward before the remaining six hang below the side sockets.
 * Prepared points are baked from this contract offline, never during loading.
 * @param {object} squid @param {number} index @param {number} [joint] @returns {Point3}
 */
export function getAdultSquidArmRestPoint(squid, index, joint = LINKS) {
  const radius = Number.isFinite(squid?.headRadius) ? squid.headRadius : ADULT_SQUID_HEAD_RADIUS;
  const LINK = linkLength(squid);
  const angle = ARM_ANGLES[index], skinRadial = Math.sqrt(1 - .25 ** 2) * radius;
  const skinY = -.25 * radius * getAdultSquidHeadYScale(squid);
  const normalRadial = skinRadial / radius ** 2, normalY = skinY / (radius * getAdultSquidHeadYScale(squid)) ** 2;
  const normalLength = Math.hypot(normalRadial, normalY);
  let radial = skinRadial + radiusAt(0, squid) * normalRadial / normalLength;
  let down = skinY + radiusAt(0, squid) * normalY / normalLength;
  for (let link = 0; link < joint; link++) {
    const outward = link === 0 ? .8 : link === 1 ? .45 : 0;
    radial += LINK * outward; down -= LINK * Math.sqrt(1 - outward ** 2);
  }
  if (headSideRatio(squid) < 1) {
    const ratio = headSideRatio(squid), rawX = -Math.sin(angle) * skinRadial;
    const x = Math.max(-radius, Math.min(radius, rawX / ratio)), z = Math.cos(angle) * skinRadial;
    const capped = Math.abs(rawX / ratio) >= radius;
    const nx = capped ? Math.sign(x) : x * ratio ** 2 / radius ** 2;
    const ny = capped ? 0 : normalY, nz = capped ? 0 : z / radius ** 2;
    const length = Math.hypot(nx, ny, nz), thickness = radiusAt(0, squid);
    const fan = radial - skinRadial - thickness * normalRadial / normalLength;
    return squidLocalToWorld(squid, x + thickness * nx / length - Math.sin(angle) * fan,
      down + thickness * (ny / length - normalY / normalLength), z + thickness * nz / length + Math.cos(angle) * fan);
  }
  return squidLocalToWorld(squid, -Math.sin(angle) * radial, down, Math.cos(angle) * radial);
}
function setDistance(a, b, length) {
  const d = distance(a, b) || 1, amount = length / d;
  b.x = a.x + (b.x - a.x) * amount; b.y = a.y + (b.y - a.y) * amount; b.z = a.z + (b.z - a.z) * amount;
}

/** A broad single-bow IK seed avoids repeated coils when targets approach a root. */
function goalChain(root, target, angle, squid) {
  const LINK = linkLength(squid), reach = armLength(squid);
  const length = distance(root, target);
  if (length >= reach - 1) return Array.from({ length: LINKS + 1 }, (_, index) => {
    const fraction = index * LINK / (length || 1);
    return { x: root.x + (target.x - root.x) * fraction,
      y: root.y + (target.y - root.y) * fraction, z: root.z + (target.z - root.z) * fraction };
  });
  const bow = Math.sqrt(Math.max(0, reach ** 2 - length ** 2)) * 0.75;
  const ox = Math.cos(angle), oy = Math.sin(angle);
  const control = { x: (root.x + target.x) / 2 + ox * bow,
    y: (root.y + target.y) / 2 + oy * bow, z: (root.z + target.z) / 2 - bow * 0.18 };
  const chain = Array.from({ length: LINKS + 1 }, (_, index) => {
    const t = index / LINKS, u = 1 - t;
    return { x: u * u * root.x + 2 * u * t * control.x + t * t * target.x,
      y: u * u * root.y + 2 * u * t * control.y + t * t * target.y,
      z: u * u * root.z + 2 * u * t * control.z + t * t * target.z };
  });
  for (let iteration = 0; iteration < 7; iteration++) {
    Object.assign(chain[LINKS], target);
    for (let index = LINKS - 1; index >= 0; index--) setDistance(chain[index + 1], chain[index], LINK);
    Object.assign(chain[0], root);
    for (let index = 1; index <= LINKS; index++) setDistance(chain[index - 1], chain[index], LINK);
  }
  return chain;
}

function moveToward(p, target, limit) {
  const length = distance(p, target), fraction = length ? Math.min(1, limit / length) : 0;
  p.x += (target.x - p.x) * fraction; p.y += (target.y - p.y) * fraction; p.z += (target.z - p.z) * fraction;
}

function advanceSurfaceGrips(squid, brain) {
  squid.surfaceGrips ??= Array(ARMS).fill(null);
  for (let index = 0; index < ARMS; index++) {
    const lift = brain.lifts[index];
    if (lift && (lift.remaining = Math.max(0, lift.remaining - STEP)) < 1e-9) brain.lifts[index] = null;
    const grip = squid.surfaceGrips[index];
    if (!grip) continue;
    grip.remaining = Math.max(0, grip.remaining - STEP);
    if (grip.remaining < 1e-9) {
      brain.lifts[index] = { remaining: ADULT_SQUID_STEP_LIFT_SECONDS + index * 0.02,
        point: copy(grip.point), normal: copy(grip.normal) };
      squid.surfaceGrips[index] = null;
    }
  }
}

function canHoldGrips(squid) {
  return (squid.surfaceGrips ?? []).every((grip, index) => !grip
    || distance(getAdultSquidArmRoot(squid, index), grip.point) <= (grip.linkIndex + grip.along) * linkLength(squid) + 0.001);
}

function bodyFits(point, squid) {
  const radius = (squid?.headRadius ?? ADULT_SQUID_HEAD_RADIUS)
    * (squid?.designVersion === 2 ? 1.7 : getAdultSquidHeadYScale(squid));
  return getSeabedHeight(point.x, point.y) + radius + 0.01 <= WATER_LEVEL - radius - 5;
}

/** Sample a few body-clear side/up routes, then keep the chosen route for a full stroke. */
function repositionGoal(world,squid,target) {
  if(!target)return {x:squid.homeX,y:squid.homeY,z:squid.homeZ};
  const dx=target.x-squid.x,dy=target.y-squid.y,length=Math.hypot(dx,dy)||1;
  const side=squid.seed%2?1:-1,reach=Math.max(220,squid.headRadius*2);
  for(const [lateral,lift] of [[side,0],[-side,0],[side,.7],[-side,.7],[0,1]]){
    const goal={x:squid.x+dx/length*100-dy/length*reach*lateral,
      y:squid.y+dy/length*100+dx/length*reach*lateral,z:squid.z+reach*lift};
    let clear=true;
    for(let i=1;i<=4;i++){
      const t=i/4,p={x:squid.x+(goal.x-squid.x)*t,y:squid.y+(goal.y-squid.y)*t,z:squid.z+(goal.z-squid.z)*t};
      if(!bodyFits(squid,p)||getForestCollision(world.forest,p,squid.headRadius*1.7)
        ||p.x<BLUE_OCEAN_START_X+squid.headRadius*1.7||p.x>WORLD_BOUNDS.maxX-squid.headRadius*1.7
        ||p.y<WORLD_BOUNDS.minY+squid.headRadius*1.7||p.y>WORLD_BOUNDS.maxY-squid.headRadius*1.7){clear=false;break;}
    }
    if(clear)return goal;
  }
  return {x:squid.homeX,y:squid.homeY,z:squid.homeZ};
}

function updateBody(world, squid, player, noticed, state) {
  if (squid.designVersion === 2) {
    squid.propulsionTime = state.time;
    squid.propulsionPulse = state.capture ? 0 : Math.sin(state.time * Math.PI * 2 * (noticed ? 1 : .3)) ** 2;
  }
  if (state.capture) {
    squid.px = squid.x; squid.py = squid.y; squid.pz = squid.z;
    return;
  }
  const brain = brainFor(state, squid);
  squid.px = squid.x; squid.py = squid.y; squid.pz = squid.z;
  const thrust = squid.designVersion === 2 ? noticed ? .85 + 1.05 * squid.propulsionPulse : .65 + .7 * squid.propulsionPulse : 1;
  let remaining = STEP * (noticed ? ADULT_SQUID_SWIM_SPEED : ADULT_SQUID_PATROL_SPEED) * thrust;
  if (noticed || brain.goal) {
    const target = { ...(brain.goal ?? eye(player)) };
    if (squid.designVersion === 2) for (const other of world.adultSquids ?? []) {
      if (other === squid || !finitePoint(other)) continue;
      const gap = distance(squid, other), comfort = squid.headRadius + other.headRadius + 100;
      const strength = Math.max(0, Math.min(1, (comfort - gap) / 100));
      if (!strength) continue;
      const direction = gap > 1e-8 ? { x: (squid.x - other.x) / gap, y: (squid.y - other.y) / gap,
        z: (squid.z - other.z) / gap } : { x: squid.id < other.id ? -1 : 1, y: 0, z: 0 };
      target.x += direction.x * 200 * strength; target.y += direction.y * 200 * strength;
      target.z += direction.z * 200 * strength;
    }
    const separation = distance(squid, target);
    moveToward(squid, target, Math.min(remaining, Math.max(0, separation - (noticed ? squid.headRadius + 25 : brain.mode === "search-last-seen" ? 30 : 0))));
    remaining = 0;
  }
  while (remaining > 1e-8) {
    const offset = PATROL[brain.patrol];
    const goal = { x: squid.homeX + offset[0], y: squid.homeY + offset[1], z: squid.homeZ + offset[2] };
    const length = distance(squid, goal);
    if (length < 1e-8) { brain.patrol = (brain.patrol + 1) % PATROL.length; continue; }
    const travel = Math.min(remaining, length);
    moveToward(squid, goal, travel); remaining -= travel;
    if (travel === length) { Object.assign(squid, goal); brain.patrol = (brain.patrol + 1) % PATROL.length; }
  }
  if (!bodyFits(squid, squid)) Object.assign(squid, { x: squid.px, y: squid.py, z: squid.pz });
  else clampAnimal(squid, squid.headRadius, null, world.forest, true);
  if (distance(squid, { x: squid.px, y: squid.py, z: squid.pz }) > STEP * ADULT_SQUID_SWIM_SPEED * (squid.designVersion === 2 ? 1.9 : 1) + 1e-7)
    Object.assign(squid, { x: squid.px, y: squid.py, z: squid.pz });
  // A planted arm holds its world contact for the complete two seconds. Clamp
  // body travel at its reach envelope rather than tearing that contact loose.
  if (!canHoldGrips(squid)) {
    const candidate = copy(squid), original = { x: squid.px, y: squid.py, z: squid.pz };
    let low = 0, high = 1;
    for (let probe = 0; probe < 14; probe++) {
      const fraction = (low + high) / 2;
      Object.assign(squid, { x: original.x + (candidate.x - original.x) * fraction,
        y: original.y + (candidate.y - original.y) * fraction, z: original.z + (candidate.z - original.z) * fraction });
      if (canHoldGrips(squid)) low = fraction; else high = fraction;
    }
    Object.assign(squid, { x: original.x + (candidate.x - original.x) * low,
      y: original.y + (candidate.y - original.y) * low, z: original.z + (candidate.z - original.z) * low });
  }
  if (squid.designVersion === 2 && !squid.surfaceGrips.some(Boolean)) {
    squid.orientation = adultSwimmingOrientation(squid, player, noticed, STEP);
  } else if (noticed && squid.designVersion !== 2 && !squid.surfaceGrips.some(Boolean)) {
    const yaw = Math.atan2(player.x - squid.x, player.y - squid.y);
    const current = getSquidOrientation(squid);
    let target = { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) };
    if (current.y * target.y + current.w * target.w < 0) target = { x: 0, y: -target.y, z: 0, w: -target.w };
    // The external rest tips are wider than the old underside ring. Turn the
    // head slowly enough for those limbs to follow at their bounded speed.
    const amount = STEP * 0.3;
    squid.orientation = getSquidOrientation({ orientation: { x: current.x * (1 - amount),
      y: current.y * (1 - amount) + target.y * amount, z: current.z * (1 - amount),
      w: current.w * (1 - amount) + target.w * amount } });
  }
}

/** Weighted interior-link pin: the contact remains on its original capsule axis. */
function constrainGrip(arm, grip) {
  const a = arm[grip.linkIndex], b = arm[grip.linkIndex + 1], t = grip.along, u = 1 - t;
  const weightA = grip.linkIndex === 0 ? 0 : u, denominator = weightA * u + t * t;
  if (denominator < 1e-12) return;
  const dx = grip.point.x - (a.x * u + b.x * t), dy = grip.point.y - (a.y * u + b.y * t),
    dz = grip.point.z - (a.z * u + b.z * t);
  for (const [point, weight] of [[a, weightA], [b, t]]) {
    point.x += dx * weight / denominator; point.y += dy * weight / denominator; point.z += dz * weight / denominator;
  }
}

function projectForestArm(arm, forest, squid) {
  if (!forest) return;
  for (let link = 0; link < LINKS; link++) {
    const a = arm[link], b = arm[link + 1], length = distance(a, b), steps = Math.max(1, Math.ceil(length / 8));
    for (let sample = 1; sample <= steps; sample++) {
      const t = sample / steps, u = 1 - t;
      const probe = { x: a.x * u + b.x * t, y: a.y * u + b.y * t, z: a.z * u + b.z * t };
      const radius = Math.hypot(radiusAt(link, squid) * (1 - 0.16 * t), length / (steps * 2));
      const hit = getForestCollision(forest, probe, radius);
      if (!hit) continue;
      const denominator = (link ? u * u : 0) + t * t;
      const wa = link ? u / denominator : 0, wb = t / denominator;
      const dx = hit.escape.x - probe.x, dy = hit.escape.y - probe.y, dz = hit.escape.z - probe.z;
      a.x += dx * wa; a.y += dy * wa; a.z += dz * wa;
      b.x += dx * wb; b.y += dy * wb; b.z += dz * wb;
    }
  }
}

/** Distance to a convex head along a tapered capsule is a convex one-dimensional
 * query outside the solid. A normalized-space bound rejects distant links;
 * the remaining minimum is bracketed by surface-normal derivatives. */
export function getAdultSquidHeadSegmentContact(squid, a, b, startRadius, endRadius) {
  const p = headLocalPoint(squid, a), q = headLocalPoint(squid, b), radius = squid.headRadius ?? ADULT_SQUID_HEAD_RADIUS;
  const dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z, heightSquared = getAdultSquidHeadYScale(squid) ** 2;
  const sideSquared = headSideRatio(squid) ** 2;
  const weightedLength = dx * dx * sideSquared + dy * dy / heightSquared + dz * dz;
  const boundT = Math.max(0, Math.min(1, -(p.x * dx * sideSquared + p.y * dy / heightSquared + p.z * dz) / (weightedLength || 1)));
  if (Math.hypot((p.x + dx * boundT) * headSideRatio(squid), (p.y + dy * boundT) / getAdultSquidHeadYScale(squid), p.z + dz * boundT)
    >= radius + Math.max(startRadius, endRadius)) return null;
  const at = (t) => {
    const surface = closestHeadLocal({ x: p.x + dx * t, y: p.y + dy * t, z: p.z + dz * t }, radius, headSideRatio(squid), getAdultSquidHeadYScale(squid));
    const thickness = startRadius + (endRadius - startRadius) * t;
    return { ...surface, t, thickness, gap: surface.distance - thickness,
      slope: surface.nx * dx + surface.ny * dy + surface.nz * dz + startRadius - endRadius };
  };
  let contact = at(0);
  if (contact.slope < 0) {
    const end = at(1);
    if (end.slope <= 0) contact = end;
    else {
      let low = 0, high = 1;
      for (let iteration = 0; iteration < 14; iteration++) {
        const middle = at((low + high) / 2);
        if (middle.slope < 0) low = middle.t; else high = middle.t;
      }
      contact = at((low + high) / 2);
    }
  }
  if (contact.gap >= -1e-8) return null;
  return { along: contact.t, point: { x: a.x + (b.x - a.x) * contact.t,
    y: a.y + (b.y - a.y) * contact.t, z: a.z + (b.z - a.z) * contact.t },
  escape: squidLocalToWorld(squid, contact.x + contact.nx * contact.thickness,
    contact.y + contact.ny * contact.thickness, contact.z + contact.nz * contact.thickness) };
}

const headSegmentContact = getAdultSquidHeadSegmentContact;

/** Keep complete tapered capsule axes outside the actual oval, including
 * the first segment between a fixed side socket and its first moving joint. */
function projectHeadArm(arm, squid) {
  for (let link = 0; link < LINKS; link++) {
    const a = arm[link], b = arm[link + 1], contact = headSegmentContact(squid, a, b, radiusAt(link, squid), radiusAt(link + 1, squid));
    if (!contact) continue;
    const t = contact.along, u = 1 - t, denominator = (link ? u * u : 0) + t * t;
    if (denominator < 1e-10) continue;
    const dx = (contact.escape.x - contact.point.x) / denominator;
    const dy = (contact.escape.y - contact.point.y) / denominator, dz = (contact.escape.z - contact.point.z) / denominator;
    if (link) { a.x += dx * u; a.y += dy * u; a.z += dz * u; }
    b.x += dx * t; b.y += dy * t; b.z += dz * t;
  }
}

function solveArm(arm, root, squid, grip, forest) {
  const iterations = grip ? 48 : 12, LINK = linkLength(squid);
  for (let iteration = 0; iteration < iterations; iteration++) {
    Object.assign(arm[0], root);
    for (let joint = 1; joint <= LINKS; joint++) {
      if (grip) {
        const a = arm[joint - 1], b = arm[joint], length = distance(a, b) || 1;
        const factor = (length - LINK) / length, weight = joint === 1 ? 1 : 0.5;
        const dx = (b.x - a.x) * factor, dy = (b.y - a.y) * factor, dz = (b.z - a.z) * factor;
        if (joint > 1) { a.x += dx * weight; a.y += dy * weight; a.z += dz * weight; }
        b.x -= dx * weight; b.y -= dy * weight; b.z -= dz * weight;
      } else setDistance(arm[joint - 1], arm[joint], LINK);
      const clawMargin = squid.designVersion === 2 && joint === LINKS ? (squid.clawLength ?? 24) * 1.55 : 0;
      clampAnimal(arm[joint], radiusAt(joint, squid) + clawMargin, squid, forest);
    }
    projectHeadArm(arm, squid);
    if (iteration === iterations - 1 || grip && iteration % 8 === 7) projectForestArm(arm, forest, squid);
    if (grip) constrainGrip(arm, grip);
  }
  Object.assign(arm[0], root, { px: root.x, py: root.y, pz: root.z });
}

/** Shared jet rhythm, trailing arms and delayed tip curls; no independent paddling.
 * Returns physical solver goals, so collision and rendering use the same motion. */
function swimmingArmPoint(squid, index, joint, time) {
  const point = getAdultSquidArmRestPoint(squid, index, joint);
  const weight = (joint / LINKS) ** 2 * Math.min(1, time);
  const alert = Boolean(squid.noticedPlayer || squid.assistingHunt || squid.huntingPrey);
  const phase = time * Math.PI * 2 * (alert ? 1 : .38);
  const pulse = (.5 + .5 * Math.sin(phase)) ** 2;
  const wave = Math.sin(phase - joint * .48 + index * .08);
  const dx = squid.x - squid.px, dy = squid.y - squid.py, dz = squid.z - squid.pz;
  const travel = Math.hypot(dx, dy, dz);
  const drag = (alert ? 180 + pulse * 120 : 26 + pulse * 12) * weight;
  if (travel > 1e-8) {
    point.x -= dx / travel * drag; point.y -= dy / travel * drag; point.z -= dz / travel * drag;
  }
  const root = getAdultSquidArmRoot(squid, index);
  const fold = pulse * (alert ? .24 : .06) * weight;
  point.x += (root.x - point.x) * fold + Math.cos(ARM_ANGLES[index]) * wave * (alert ? 45 : 12) * weight;
  point.y += (root.y - point.y) * fold + Math.sin(ARM_ANGLES[index]) * wave * (alert ? 45 : 12) * weight;
  point.z += wave * (alert ? 190 : 32) * weight;
  return point;
}

function updateArms(world, squid, player, attacking, state) {
  const brain = brainFor(state, squid);
  const swimming = !state.capture;
  squid.armTargets ??= [];
  for (let index = 0; index < ARMS; index++) {
    const arm = squid.tentacles[index], root = getAdultSquidArmRoot(squid, index), angle = ARM_ANGLES[index];
    let target, restGoal = false;
    const reaching = index === (state.capture?.armIndex ?? squid.activeArm) && (attacking || state.capture);
    const grip = squid.surfaceGrips[index], lift = brain.lifts[index];
    if (grip) target = copy(grip.point);
    else if (lift) target = { x: lift.point.x + lift.normal.x * 65,
      y: lift.point.y + lift.normal.y * 65, z: lift.point.z + lift.normal.z * 65 };
    else if (reaching) target = { x: player.x + Math.cos(angle) * 8,
      y: player.y + Math.sin(angle) * 8, z: player.z + EYE_HEIGHT * 0.5 + (index % 3 - 1) * 5 };
    else {
      target = swimming ? swimmingArmPoint(squid, index, LINKS, state.time) : getAdultSquidArmRestPoint(squid, index);
      restGoal = true;
    }
    if (!reaching && !grip && !lift) {
      const floor = { x: target.x, y: target.y, z: getSeabedHeight(target.x, target.y) + radiusAt(LINKS, squid) + 0.01 };
      if (distance(root, floor) < armLength(squid) - 0.01) { target = floor; restGoal = false; }
    }
    const beforeClamp = copy(target);
    clampAnimal(target, radiusAt(LINKS, squid), null, world.forest); squid.armTargets[index] = copy(target);
    let goal;
    if (grip) goal = arm;
    else if (restGoal && distance(beforeClamp, target) < 1e-8) {
      goal = Array.from({ length: LINKS + 1 }, (_, joint) => swimming
        ? swimmingArmPoint(squid, index, joint, state.time) : getAdultSquidArmRestPoint(squid, index, joint));
    } else goal = goalChain(root, target, angle, squid);
    for (let joint = 1; joint <= LINKS; joint++) {
      const p = arm[joint]; p.px = p.x; p.py = p.y; p.pz = p.z;
      const motionScale = squid.designVersion === 2 ? squid.headRadius / ADULT_SQUID_HEAD_RADIUS : 1;
      moveToward(p, goal[joint], STEP * motionScale * (state.capture?.armIndex === index ? ARM_CAPTURE_SPEED : ARM_SWIM_SPEED));
    }
    solveArm(arm, root, squid, grip, world.forest);
    if (!grip && !lift) {
      const contact = findSquidSurfaceContact(world, arm, { radius: radiusAt(0, squid), taper: 0.84, tolerance: 1 });
      if (contact) {
        const planted = { ...contact, point: copy(contact.correctedPoint ?? contact.point), remaining: ADULT_SQUID_SURFACE_GRIP_SECONDS };
        squid.surfaceGrips[index] = planted;
        solveArm(arm, root, squid, planted, world.forest);
      }
    }
    if (squid.designVersion === 2) {
      squid.clawClosure ??= Array(ARMS).fill(0);
      const closing = index === state.capture?.armIndex || reaching && distance(arm.at(-1), eye(player)) < 120;
      const current = squid.clawClosure[index], desired = closing ? 1 : 0;
      squid.clawClosure[index] = current + Math.max(-STEP * 2.5, Math.min(STEP * 2.5, desired - current));
    }
  }
}

/** Exact closest points between an arm capsule axis and the player's body axis. */
function armBodyContact(a, b, player) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const low = player.z + 5, height = EYE_HEIGHT - 10;
  const wx = a.x - player.x, wy = a.y - player.y, wz = a.z - low;
  const aa = dx * dx + dy * dy + dz * dz, bb = dz * height, cc = height * height;
  const dd = dx * wx + dy * wy + dz * wz, ee = height * wz;
  const denominator = aa * cc - bb * bb;
  let along = denominator > 1e-8 ? Math.max(0, Math.min(1, (bb * ee - cc * dd) / denominator)) : 0;
  let vertical = (bb * along + ee) / cc;
  if (vertical < 0) { vertical = 0; along = aa ? Math.max(0, Math.min(1, -dd / aa)) : 0; }
  else if (vertical > 1) { vertical = 1; along = aa ? Math.max(0, Math.min(1, (bb - dd) / aa)) : 0; }
  const point = { x: a.x + dx * along, y: a.y + dy * along, z: a.z + dz * along };
  return { point, distance: distance(point, { x: player.x, y: player.y, z: low + height * vertical }) };
}

function contactArm(squid, player) {
  if (!Number.isInteger(squid.activeArm) || squid.activeArm < 0 || squid.activeArm >= ARMS) return null;
  let closest = null;
  const armIndex = squid.activeArm, arm = squid.tentacles[armIndex];
  for (let link = 0; link < LINKS; link++) {
    const contact = armBodyContact(arm[link], arm[link + 1], player);
    if (contact.distance <= radiusAt(link, squid) + 5.05 && (!closest || contact.distance < closest.distance))
      closest = { armIndex, link, ...contact };
  }
  const claw = getSquidClawAxis(squid, armIndex);
  if (claw) {
    const hit = armBodyContact(claw.root, claw.end, player);
    if (hit.distance <= claw.radius + 5.05 && (!closest || hit.distance < closest.distance))
      closest = { armIndex, link: LINKS - 1, ...hit };
  }
  return closest;
}

/** The chosen arm captures on real contact, including swept contact this tick. */
function beginContactCapture(world, squid, state, attacking) {
  if (world.squidEncounter || !attacking || !eligible(world.player)) return;
  const contact = contactArm(squid, world.player);
  if (!contact) return;
  const eyeIndex = headLocalPoint(squid, contact.point).x < 0 ? 2 : 3;
  const path = pullPath(squid, world.player, contact, getAdultSquidObservationPoint(squid, eyeIndex));
  state.capture = { armIndex: contact.armIndex, eyeIndex, index: 1, path };
  world.squidEncounter = { squidId: squid.id, phase: "grabbed", armIndex: contact.armIndex,
    elapsed: 0, progress: 0, eyeIndex, target: getAdultSquidEyeTarget(squid, eyeIndex) };
  const partner=world.adultSquids?.filter(other=>other!==squid&&!unavailablePrey(other)
    &&(other.assistingHunt||other.noticedPlayer)&&distance(other,squid)<=3500)
    .sort((a,b)=>distance(a,squid)-distance(b,squid))[0];
  if(partner)world.squidEncounter.partnerId=partner.id;
  world.threat.message = "Tentacle grip";
}

function outsideHead(point, squid, radius) {
  const dx = point.x - squid.x, dy = point.y - squid.y, dz = point.z - squid.z;
  const length = Math.hypot(dx, dy, dz) || 1;
  const at = (distance) => ({ x: squid.x + dx / length * distance,
    y: squid.y + dy / length * distance, z: squid.z + dz / length * distance });
  const blocked = (eye) => headSegmentContact(squid,
    { ...eye, z: eye.z - EYE_HEIGHT + 5 }, { ...eye, z: eye.z - 5 }, 5, 5);
  const desired = at(radius);
  if (!blocked(desired)) return desired;
  let low = radius, high = radius + EYE_HEIGHT + 10;
  for (let iteration = 0; iteration < 14; iteration++) {
    const middle = (low + high) / 2;
    if (blocked(at(middle))) low = middle; else high = middle;
  }
  return at(high);
}
function pullPath(squid, player, contact, destination, direct = false) {
  const arm = squid.tentacles[contact.armIndex];
  const points = [eye(player)];
  if (!direct) {
    points.push(copy(contact.point));
    for (let joint = contact.link; joint >= 1; joint--) points.push(copy(arm[joint]));
  }
  const start = outsideHead(points.at(-1), squid, squid.headRadius + 65);
  points.push(start);
  const mouth = destination ?? getAdultSquidMouth(squid);
  const end = outsideHead(mouth, squid, distance(mouth, squid) + (destination ? 0 : 45));
  const a = { x: start.x - squid.x, y: start.y - squid.y, z: start.z - squid.z };
  const b = { x: end.x - squid.x, y: end.y - squid.y, z: end.z - squid.z };
  const al = Math.hypot(a.x, a.y, a.z), bl = Math.hypot(b.x, b.y, b.z);
  const dot = Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y + a.z * b.z) / (al * bl)));
  const angle = Math.acos(dot), sine = Math.sin(angle);
  const cross = Math.abs(a.z / al) < 0.9 ? { x: -a.y / al, y: a.x / al, z: 0 }
    : { x: 0, y: -a.z / al, z: a.y / al };
  const crossLength = Math.hypot(cross.x, cross.y, cross.z) || 1;
  for (let sample = 1; sample <= 12; sample++) {
    const t = sample / 12;
    let wa = 1 - t, wb = t;
    if (sine > 1e-5) { wa = Math.sin((1 - t) * angle) / sine; wb = Math.sin(t * angle) / sine; }
    const blend = dot < -0.9999 ? {
      x: a.x / al * Math.cos(Math.PI * t) + cross.x / crossLength * Math.sin(Math.PI * t),
      y: a.y / al * Math.cos(Math.PI * t) + cross.y / crossLength * Math.sin(Math.PI * t),
      z: a.z / al * Math.cos(Math.PI * t) + cross.z / crossLength * Math.sin(Math.PI * t),
    } : { x: a.x / al * wa + b.x / bl * wb,
      y: a.y / al * wa + b.y / bl * wb, z: a.z / al * wa + b.z / bl * wb };
    const length = Math.hypot(blend.x, blend.y, blend.z) || 1;
    const radius = al + (bl - al) * t;
    points.push({ x: squid.x + blend.x / length * radius,
      y: squid.y + blend.y / length * radius, z: squid.z + blend.z / length * radius });
  }
  return points;
}

function movePlayer(world, target, speed) {
  const player = world.player, current = eye(player), candidate = copy(current);
  moveToward(candidate, target, speed * STEP);
  candidate.x = Math.max(BLUE_OCEAN_START_X + 6, Math.min(WORLD_BOUNDS.maxX - 6, candidate.x));
  candidate.y = Math.max(WORLD_BOUNDS.minY + 6, Math.min(WORLD_BOUNDS.maxY - 6, candidate.y));
  candidate.z = Math.min(WATER_LEVEL - 3, candidate.z);
  if ([5, EYE_HEIGHT / 2, EYE_HEIGHT - 5].some((height) => getForestCollision(world,
    { x: candidate.x, y: candidate.y, z: candidate.z - EYE_HEIGHT + height }, 5)))
    Object.assign(candidate, current);
  const floor = getSeabedHeight(candidate.x, candidate.y) + EYE_HEIGHT + 1;
  if (candidate.z < floor) {
    candidate.x = current.x; candidate.y = current.y;
    candidate.z = Math.min(WATER_LEVEL - 3, current.z + Math.min(speed * STEP, Math.max(0, floor - current.z)));
  }
  player.x = candidate.x; player.y = candidate.y; player.z = candidate.z - EYE_HEIGHT;
  player.swimming = true; player.underwater = true; player.jumping = false;
}

function updateEncounter(world, squid, state) {
  const encounter = world.squidEncounter, capture = state.capture;
  if(capture.transferredAt===state.time)return false;
  const watching = encounter.phase === "grabbed" || encounter.phase === "observing";
  encounter.target = watching ? getAdultSquidEyeTarget(squid, capture.eyeIndex) : getAdultSquidMouth(squid);
  if((encounter.partnerId&&encounter.phase==='striking')||encounter.phase==='shared-bite'||encounter.phase==='eating'){
    encounter.cameraTarget=squidLocalToWorld(squid,0,-.32*squid.headRadius*getAdultSquidHeadYScale(squid),-.40*squid.headRadius);
  }else delete encounter.cameraTarget;
  encounter.elapsed += STEP;
  if (encounter.phase === "grabbed" || encounter.phase === "to-mouth") {
    while (capture.index < capture.path.length && distance(eye(world.player), capture.path[capture.index]) < 8) capture.index++;
    const target = capture.path[capture.index] ?? capture.path.at(-1);
    movePlayer(world, target, ADULT_SQUID_PULL_SPEED);
    encounter.progress = Math.min(1, capture.index / capture.path.length);
    if (capture.index >= capture.path.length || distance(eye(world.player), target) < 10 && capture.index === capture.path.length - 1) {
      encounter.phase = encounter.phase === "grabbed" ? "observing" : "striking";
      encounter.elapsed = 0; encounter.progress = 0;
    }
  } else if (encounter.phase === "observing") {
    encounter.progress = Math.min(1, encounter.elapsed / ADULT_SQUID_OBSERVING_SECONDS);
    movePlayer(world, getAdultSquidObservationPoint(squid, capture.eyeIndex), 120);
    if (encounter.progress >= 1) {
      capture.path = pullPath(squid, world.player, { armIndex: capture.armIndex }, undefined, true); capture.index = 1;
      encounter.phase = "to-mouth"; encounter.elapsed = 0; encounter.progress = 0; encounter.target = getAdultSquidMouth(squid);
    }
  } else if (encounter.phase === "striking") {
    encounter.progress = Math.min(1, encounter.elapsed / ADULT_SQUID_STRIKE_SECONDS);
    movePlayer(world, outsideHead(encounter.target, squid, distance(encounter.target, squid) + (encounter.partnerId?12:53)), encounter.partnerId?150:90);
    if (encounter.progress >= 1) {
      const partner=world.adultSquids.find(other=>other.id===encounter.partnerId&&!unavailablePrey(other));
      encounter.phase = partner ? "shared-bite" : "eating"; encounter.elapsed = 0; encounter.progress = 0;
    }
  } else if(encounter.phase==="shared-bite") {
    encounter.progress=Math.min(1,encounter.elapsed/ADULT_SQUID_SHARED_BITE_SECONDS);
    movePlayer(world,outsideHead(encounter.target,squid,distance(encounter.target,squid)+12),90);
    if(encounter.progress>=1){encounter.legsEaten=true;encounter.phase="handoff";encounter.elapsed=0;encounter.progress=0;}
  } else if(encounter.phase==="handoff") {
    const partner=world.adultSquids.find(other=>other.id===encounter.partnerId&&!unavailablePrey(other));
    if(!partner||encounter.elapsed>12){delete encounter.partnerId;encounter.phase="eating";encounter.elapsed=0;encounter.progress=0;return false;}
    encounter.target=getAdultSquidMouth(partner);
    const destination=outsideHead(encounter.target,partner,distance(encounter.target,partner)+65);
    const candidate=copy(eye(world.player));moveToward(candidate,destination,ADULT_SQUID_PULL_SPEED*STEP);
    const firstClear=outsideHead(candidate,squid,distance(candidate,squid));
    const safe=outsideHead(firstClear,partner,distance(firstClear,partner));
    movePlayer(world,safe,ADULT_SQUID_PULL_SPEED);
    encounter.progress=Math.min(.95,encounter.elapsed/6);
    if(distance(eye(world.player),destination)<18){
      encounter.firstSquidId=squid.id;encounter.squidId=partner.id;delete encounter.partnerId;
      encounter.sharedFinish=true;encounter.phase="striking";encounter.elapsed=0;encounter.progress=0;
      capture.armIndex=0;encounter.armIndex=0;capture.transferredAt=state.time;
    }
  } else {
    encounter.progress = Math.min(1, encounter.elapsed / ADULT_SQUID_EATING_SECONDS);
    const hold = outsideHead(encounter.target, squid, distance(encounter.target, squid) + 45 * (1 - encounter.progress) + 8);
    movePlayer(world, hold, 90);
    if (encounter.progress >= 1) { state.finished = true; return true; }
  }
  return false;
}

/** Clear an interrupted encounter on any ordinary rescue and prevent an instant re-grab. */
export function releaseAdultSquid(world) {
  if (!world || typeof world !== "object") return;
  const state = stateFor(world);
  state.capture = null; state.finished = false; state.cooldown = ADULT_SQUID_COOLDOWN_SECONDS;
  world.squidEncounter = null;
  for (const squid of world.adultSquids ?? []) {
    if (!squid || typeof squid !== "object") continue;
    squid.activeArm = null; squid.noticedPlayer = false;
    const brain = state.brains.get(squid);
    if (brain) { brain.hunting = false; brain.assist = null; squid.assistingHunt = false; brain.searchLeft = 0; brain.visible = false; brain.sightClock = 0; brain.sampleAge = 0; brain.goal = null; brain.lifts.fill(null); }
    if (squid.surfaceGrips) squid.surfaceGrips.fill(null);
  }
  if (world.threat?.kind === "adult-squid") world.threat = { active: false, distance: Infinity, message: "" };
}

/** Returns true once, only when a complete physical grab/pull/eating sequence finishes.
 * @param {object} world @param {number} dt @param {(world:object,squid:object,previousPose:object)=>void} [resolveContacts]
 */
export function updateAdultSquids(world, dt, resolveContacts) {
  if (!world || world.sandWormEncounter || world.treeStalkerEncounter || !Number.isFinite(dt) || dt <= 0 || !Array.isArray(world.adultSquids)) return false;
  const adults = world.adultSquids.filter(squid => valid(squid) && !unavailablePrey(squid)), state = stateFor(world);
  if (state.finished) return false;
  if (world.squidEncounter && !adults.some((squid) => squid.id === world.squidEncounter.squidId)) {
    releaseAdultSquid(world); return false;
  }
  if (!world.squidEncounter) state.capture = null;
  state.accumulator += Math.min(0.1, dt);
  while (state.accumulator + 1e-10 >= STEP) {
    state.accumulator = Math.max(0, state.accumulator - STEP); state.time += STEP;
    updateSquidPreyRespawns(world, STEP);
    state.cooldown = Math.max(0, state.cooldown - STEP);
    const canGrab = eligible(world.player);
    if (world.threat?.kind === "adult-squid") world.threat = { active: false, distance: Infinity, message: "" };
    const sightings=new Map();
    for(const squid of adults){
      const brain=state.brains.get(squid),called=brain?.assist?.until>state.time;
      if(called||finitePoint(world.player)&&distance(squid,eye(world.player))<=2500)
        sightings.set(squid,observeSquidPlayer(world,squid,brainFor(state,squid),STEP));
    }
    coordinateSquidHunt(world,adults,sightings,state.time,(squid,create=true)=>create?brainFor(state,squid):state.brains.get(squid));
    for (const squid of adults) {
      if (unavailablePrey(squid)) continue;
      const sleeping = !world.squidEncounter && !squid.feeding && !state.brains.get(squid)?.assist && (!finitePoint(world.player) || distance(squid, eye(world.player)) > 2500);
      if (sleeping) {
        state.awake.delete(squid);
        const brain = state.brains.get(squid);
        if (brain) {
          brain.searchLeft = 0; brain.goal = null; brain.hunting = false; squid.activeArm = null; squid.noticedPlayer = false; brain.lifts.fill(null);
          if (squid.surfaceGrips) squid.surfaceGrips.fill(null);
        }
        continue;
      }
      if (!state.awake.has(squid)) {
        for (const p of [squid, ...squid.tentacles.flat()]) { p.px = p.x; p.py = p.y; p.pz = p.z; }
        state.awake.add(squid);
      }
      const brain = brainFor(state,squid);
      const noticed = Boolean(sightings.get(squid)),assisting=Boolean(brain.assist&&!noticed),sharing=world.squidEncounter?.partnerId===squid.id;
      const meal = squid.designVersion === 2 ? chooseSquidPrey(world, squid, STEP, noticed || assisting || brain.searchLeft > 0 || Boolean(world.squidEncounter)) : null;
      const attacking = noticed && !meal?.held && !state.cooldown && !world.squidEncounter;
      if (world.squidEncounter && !canGrab) { releaseAdultSquid(world); continue; }
      const actorState = Object.create(state);
      actorState.capture = world.squidEncounter?.squidId === squid.id ? state.capture : null;
      if (!actorState.capture && meal?.held) actorState.capture = { armIndex: meal.armIndex };
      const target = meal ? { ...meal.target, z: meal.target.z - EYE_HEIGHT * .5 } : assisting ? {...brain.assist.point,z:brain.assist.point.z-EYE_HEIGHT} : world.player;
      brain.rerouteLeft = Math.max(0, brain.rerouteLeft - STEP);
      ADULT_SQUID_BEHAVIOR_TREE.tick({ world, squid, state: actorState, brain, noticed, meal });
      chooseArm(squid, attacking || Boolean(meal), actorState); squid.noticedPlayer = noticed;
      advanceSurfaceGrips(squid, brainFor(actorState, squid));
      const previousPose = typeof resolveContacts === "function" ? {
        x: squid.x, y: squid.y, z: squid.z, orientation: getSquidOrientation(squid),
        roots: squid.tentacles.map((arm) => copy(arm[0])) } : null;
      updateBody(world, squid, target, noticed || assisting || sharing || Boolean(meal), actorState); updateArms(world, squid, target, attacking || Boolean(meal), actorState);
      if (meal) advanceSquidFeeding(world, squid, STEP, getAdultSquidMouth(squid));
      const progress = distance(squid, { x: squid.px, y: squid.py, z: squid.pz });
      brain.blocked = noticed && !actorState.capture && progress < STEP * ADULT_SQUID_SWIM_SPEED * .2 ? brain.blocked + STEP : 0;
      if (noticed || world.squidEncounter) world.threat = { active: true, kind: "adult-squid",
        distance: distance(squid, eye(world.player)), message: world.squidEncounter ? "Tentacle grip" : "ADULT CROBONIC SQUID — APPROACHING YOU" };
      beginContactCapture(world, squid, actorState, attacking);
      if (!world.squidEncounter && typeof resolveContacts === "function") {
        resolveContacts(world, squid, previousPose);
        beginContactCapture(world, squid, actorState, attacking);
      }
      if (world.squidEncounter?.squidId === squid.id) {
        state.capture = actorState.capture;
        if (actorState.capture && updateEncounter(world, squid, actorState)) { state.finished = true; return true; }
      }
    }
  }
  return false;
}
