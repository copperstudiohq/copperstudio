import { SQUID_SIPHON_ANCHORS } from "./squid-propulsion-anatomy.js";
import { getSquidClawAxis } from "./squid-claw-anatomy.js";
import { EYE_HEIGHT, WATER_LEVEL } from "./terrain.js";
import {isSulfuricWorldPosition} from './sulfuric-biome.js';
import { getSeabedHeight } from "./seabed.js";
import { getForestCollision } from "./forest-terrain.js";
import { getAdultSquidHeadSegmentContact } from "./adult-squid.js";
import { getSquidOrientation, squidLocalToWorld } from "./squid-frame.js";
import { ADULT_SQUID_EYE_SCALE, ADULT_SQUID_EYE_LAYOUT, ADULT_SQUID_HEAD_Y_SCALE, getAdultSquidHeadYScale,
  ADULT_SQUID_MANDIBLE_PATH, CROBONIC_MANDIBLE_PATH, getAdultSquidMandiblePoint } from "./adult-squid-anatomy.js";

/** @typedef {{x:number,y:number,z:number}} Point3 */
const CONTACT_MARGIN = .01; // 0.4 mm at simulation scale; prevents contact jitter.
const finite = (point) => point && [point.x, point.y, point.z].every(Number.isFinite);
const clamp = (value) => Math.max(0, Math.min(1, value));
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const at = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const separation = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** Closest points on finite segments, including zero-length and parallel axes. */
export function closestSquidSegments(a, b, c, d) {
  const u = sub(b, a), v = sub(d, c), w = sub(a, c);
  const aa = dot(u, u), bb = dot(u, v), cc = dot(v, v), dd = dot(u, w), ee = dot(v, w);
  let s = 0, t = 0;
  if (aa < 1e-12 && cc < 1e-12) return { a: { ...a }, b: { ...c }, s, t };
  if (aa < 1e-12) t = clamp(ee / cc);
  else if (cc < 1e-12) s = clamp(-dd / aa);
  else {
    const denominator = aa * cc - bb * bb;
    s = denominator > 1e-12 ? clamp((bb * ee - cc * dd) / denominator) : 0;
    t = (bb * s + ee) / cc;
    if (t < 0) { t = 0; s = clamp(-dd / aa); }
    else if (t > 1) { t = 1; s = clamp((bb - dd) / aa); }
  }
  return { a: at(a, b, s), b: at(c, d, t), s, t };
}

function axis(player, radius) {
  return [{ x: player.x, y: player.y, z: player.z + radius },
    { x: player.x, y: player.y, z: player.z + EYE_HEIGHT - radius }];
}

function capsule(a, b, radius) {
  return { a, b, radius, minX: Math.min(a.x, b.x) - radius, maxX: Math.max(a.x, b.x) + radius,
    minY: Math.min(a.y, b.y) - radius, maxY: Math.max(a.y, b.y) + radius,
    minZ: Math.min(a.z, b.z) - radius, maxZ: Math.max(a.z, b.z) + radius };
}

function capsuleContact(player, shape, radius, tolerance = 0) {
  const padding = radius + CONTACT_MARGIN + tolerance;
  if (player.x < shape.minX - padding || player.x > shape.maxX + padding
    || player.y < shape.minY - padding || player.y > shape.maxY + padding
    || player.z + EYE_HEIGHT < shape.minZ - padding || player.z > shape.maxZ + padding) return null;
  const pair = closestSquidSegments(...axis(player, radius), shape.a, shape.b);
  const offset = sub(pair.a, pair.b), distance = Math.hypot(offset.x, offset.y, offset.z);
  const depth = shape.radius + radius + CONTACT_MARGIN - distance;
  if (depth <= -tolerance + 1e-7) return null;
  if (distance < 1e-9) {
    offset.x = shape.b.y - shape.a.y; offset.y = shape.a.x - shape.b.x; offset.z = 0;
    if (Math.hypot(offset.x, offset.y) < 1e-9) { offset.x = 1; offset.y = 0; }
  }
  const length = Math.hypot(offset.x, offset.y, offset.z);
  return { nx: offset.x / length, ny: offset.y / length, nz: offset.z / length,
    depth, radius: shape.radius, axis: sub(shape.b, shape.a) };
}

/** Build pose-local bounds once per sweep, rather than for every contact pass.
 * Nodes remain borrowed for this synchronous query; no pose cache can go stale.
 */
function prepareAnimal(squid, adult) {
  const shapes = [], radius = squid.headRadius;
  let head = null;
  if (adult) {
    head = { ...squid, headRadius: radius * (squid.designVersion === 2 ? 1.06 : 1.04) };
    for (const [x, y] of ADULT_SQUID_EYE_LAYOUT) {
      const center = squidLocalToWorld(squid, x * radius, y * radius * getAdultSquidHeadYScale(squid),
        (Math.sqrt(1 - x * x - y * y) + .09 * (squid.eyeScale ?? ADULT_SQUID_EYE_SCALE)) * radius);
      shapes.push(capsule(center, center, radius * .19 * (squid.eyeScale ?? ADULT_SQUID_EYE_SCALE)));
    }
    shapes.push(capsule(
      squidLocalToWorld(squid, 0, -.10 * radius * getAdultSquidHeadYScale(squid), 1.03 * radius),
      squidLocalToWorld(squid, 0, -.52 * radius * getAdultSquidHeadYScale(squid), 1.03 * radius), radius * .22));
    for (const side of [-1, 1]) {
      const nodes = (squid.designVersion === 2 ? CROBONIC_MANDIBLE_PATH : ADULT_SQUID_MANDIBLE_PATH).map(point => {
        const [x, y, z] = getAdultSquidMandiblePoint(side, point, squid);
        return squidLocalToWorld(squid, x * radius, y * radius * getAdultSquidHeadYScale(squid), z * radius);
      });
      for (let link = 0; link < nodes.length - 1; link++) shapes.push(capsule(nodes[link], nodes[link + 1], radius * (squid.designVersion === 2 ? .25 : .18)));
    }
  } else shapes.push(capsule(squid, squid, radius));
  for (const arm of squid.tentacles ?? []) for (let joint = 0; joint + 1 < arm.length; joint++) {
    if (finite(arm[joint]) && finite(arm[joint + 1]))
      shapes.push(capsule(arm[joint], arm[joint + 1], (adult ? squid.armRadius ?? 45 : 2.7) * .84 ** joint));
  }
  for (const [x, y, z] of SQUID_SIPHON_ANCHORS) shapes.push(capsule(
    squidLocalToWorld(squid, x * radius, y * radius, (z + .13) * radius),
    squidLocalToWorld(squid, x * radius, y * radius, (z - .13) * radius), .20 * radius));
  if (adult) for (let index = 0; index < 8; index++) {
    const claw = getSquidClawAxis(squid, index);
    if (claw) shapes.push(capsule(claw.root, claw.end, claw.radius));
  }
  return { head, shapes };
}

function headContact(player, head, radius) {
  if (!head) return null;
  const hit = getAdultSquidHeadSegmentContact(head, ...axis(player, radius), radius + CONTACT_MARGIN, radius + CONTACT_MARGIN);
  if (!hit) return null;
  const offset = sub(hit.escape, hit.point), depth = Math.hypot(offset.x, offset.y, offset.z);
  if (depth < 1e-8) return null;
  return { nx: offset.x / depth, ny: offset.y / depth, nz: offset.z / depth,
    depth, radius: head.headRadius, axis: { x: 0, y: 0, z: 1 } };
}

function push(player, contact) {
  player.x += contact.nx * contact.depth; player.y += contact.ny * contact.depth;
  player.z += contact.nz * contact.depth;
}

function projectAnimal(player, animal, radius) {
  let moved = false;
  const head = headContact(player, animal.head, radius);
  if (head) { push(player, head); moved = true; }
  for (const shape of animal.shapes) {
    const contact = capsuleContact(player, shape, radius);
    if (contact) { push(player, contact); moved = true; }
  }
  return moved;
}

/** Near opposing solids, a small step in their shared tangent escapes a seam.
 * Its direction follows the actual limb normal, so the solver cannot repeatedly
 * choose the side that pushes the player back into the same head/arm junction.
 */
function slideContactSeam(player, animals, radius) {
  let primary = null;
  for (const animal of animals) {
    primary = headContact(player, animal.head, radius);
    if (primary) break;
    for (const shape of animal.shapes) {
      primary = capsuleContact(player, shape, radius);
      if (primary) break;
    }
    if (primary) break;
  }
  if (!primary) return;
  let opposing = null, alignment = -.05;
  for (const animal of animals) for (const shape of animal.shapes) {
    const contact = capsuleContact(player, shape, radius, Math.max(2, primary.depth * 2));
    if (!contact) continue;
    const cosine = primary.nx * contact.nx + primary.ny * contact.ny + primary.nz * contact.nz;
    if (cosine < alignment) { alignment = cosine; opposing = contact; }
  }
  if (!opposing) { push(player, primary); return; }
  let tx = opposing.nx - primary.nx * alignment, ty = opposing.ny - primary.ny * alignment;
  let tz = opposing.nz - primary.nz * alignment, length = Math.hypot(tx, ty, tz);
  if (length < 1e-8) {
    const axis = opposing.axis;
    tx = primary.ny * axis.z - primary.nz * axis.y;
    ty = primary.nz * axis.x - primary.nx * axis.z;
    tz = primary.nx * axis.y - primary.ny * axis.x;
    length = Math.hypot(tx, ty, tz);
    if (length < 1e-8) { tx = -primary.ny; ty = primary.nx; tz = 0; length = Math.hypot(tx, ty); }
    if (length < 1e-8) { tx = 1; ty = 0; tz = 0; length = 1; }
  }
  push(player, primary);
  const step = Math.min(12, Math.max(2, Math.sqrt(2 * Math.min(primary.radius, opposing.radius) * primary.depth)));
  player.x += tx / length * step; player.y += ty / length * step; player.z += tz / length * step;
}

function insideWorld(world, point, radius) {
  // Geometry-only tools can query contacts without carrying a whole level.
  if (!Array.isArray(world.platforms) || !Array.isArray(world.submergedIce)) return true;
  if (!isSulfuricWorldPosition(point,radius)||point.z < getSeabedHeight(point.x, point.y) - .001) return false;
  if (world.player?.swimming && point.z > WATER_LEVEL - EYE_HEIGHT + 9 + .001) return false;
  for (const height of [radius, EYE_HEIGHT / 2, EYE_HEIGHT - radius]) {
    const contact = getForestCollision(world, { x: point.x, y: point.y, z: point.z + height }, radius);
    if (contact && contact.penetration > .001) return false;
  }
  return true;
}

function hasContact(player, animals, radius) {
  for (const animal of animals) {
    if (headContact(player, animal.head, radius)) return true;
    for (const shape of animal.shapes) if (capsuleContact(player, shape, radius)) return true;
  }
  return false;
}

/** A tightly folded limb can leave a non-convex pocket with several competing
 * normals. Search a small local neighborhood only when ordinary sliding has
 * not fully settled; choose a clear point that preserves requested movement.
 */
function settleContactPocket(player, animals, radius, stride, world) {
  if (!hasContact(player, animals, radius) && insideWorld(world, player, radius)) return;
  const origin = { ...player };
  for (const distance of [2, 4, 8, 16, 32, 64, 128, 192]) {
    let best = null, bestScore = -Infinity;
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      const length = Math.hypot(x, y, z);
      if (!length) continue;
      const candidate = { x: origin.x + x / length * distance,
        y: origin.y + y / length * distance, z: origin.z + z / length * distance };
      if (!insideWorld(world, candidate, radius) || hasContact(candidate, animals, radius)) continue;
      const score = (x * stride.x + y * stride.y + z * stride.z) / length;
      if (score > bestScore) { best = candidate; bestScore = score; }
    }
    if (best) { Object.assign(player, best); return; }
  }
}

/** Sweep an upright player capsule along the requested path. Small steps retain
 * sliding while preventing a quick swim from skipping across a thin tentacle.
 * The encounter animation owns its own collision-safe path after a grab.
 * @param {object} world @param {Point3} from @param {Point3} to @param {number} [radius]
 * @returns {Point3}
 */
export function resolveSquidMovement(world, from, to, radius = 5) {
  if (!finite(from) || !finite(to) || !Number.isFinite(radius) || radius <= 0)
    throw new TypeError("Squid collision needs finite movement endpoints and a positive player radius.");
  if (world.squidEncounter || world.treeStalkerEncounter || world.centipedeEncounter) return { x: to.x, y: to.y, z: to.z };
  const center = at(from, to, .5), pathRadius = separation(from, to) / 2;
  const animals = [];
  for (const [population, adult] of [[world.adultSquids ?? [], true], [world.squids ?? [], false]])
    for (const squid of population) {
      if (squid.squidHeldBy || squid.squidRespawnIn > 0 || !finite(squid) || !Number.isFinite(squid.headRadius) || squid.headRadius <= 0) continue;
      const reach = squid.headRadius * (adult ? 1.2 : 1) + (adult ? 900 : 100) + EYE_HEIGHT;
      if (separation(center, squid) <= reach + pathRadius) animals.push(prepareAnimal(squid, adult));
    }
  if (!animals.length) return { x: to.x, y: to.y, z: to.z };
  const steps = Math.min(256, Math.max(1, Math.ceil(separation(from, to) / (radius * .75))));
  const stride = { x: (to.x - from.x) / steps, y: (to.y - from.y) / steps, z: (to.z - from.z) / steps };
  const result = { x: from.x, y: from.y, z: from.z };
  let collided = false;
  for (let step = 0; step < steps; step++) {
    result.x += stride.x; result.y += stride.y; result.z += stride.z;
    for (let pass = 0; pass < 24; pass++) {
      let moved = false;
      for (const animal of animals) moved = projectAnimal(result, animal, radius) || moved;
      collided ||= moved;
      if (!moved) break;
      if (pass < 23 && pass >= 3 && pass % 4 === 3) slideContactSeam(result, animals, radius);
    }
    if (collided) settleContactPocket(result, animals, radius, stride, world);
  }
  return collided ? result : { x: to.x, y: to.y, z: to.z };
}

/** Resolve animal motion at each physics step, without changing player controls. */
export function resolveSquidBodies(world, movingSquid, previousPose) {
  if (!finite(world?.player)) return;
  if (!world.squidEncounter && movingSquid?.tentacles && resolveMovingSquid(world, movingSquid, previousPose)) return;
  Object.assign(world.player, resolveSquidMovement(world, world.player, world.player));
}

function previousArmPoint(squid, pose, arm, joint) {
  const point = squid.tentacles[arm][joint];
  if (joint === 0 && finite(pose?.roots?.[arm])) return pose.roots[arm];
  return [point.px, point.py, point.pz].every(Number.isFinite)
    ? { x: point.px, y: point.py, z: point.pz } : point;
}

/** Increase temporal resolution only for moving links whose swept bounds reach
 * the player. Slow/distant arms keep one contact pass, preserving the CPU budget.
 */
function movingContactSteps(player, squid, pose, radius) {
  let steps = 1;
  for (let arm = 0; arm < squid.tentacles.length; arm++) for (let joint = 0; joint + 1 < squid.tentacles[arm].length; joint++) {
    const a = squid.tentacles[arm][joint], b = squid.tentacles[arm][joint + 1];
    const oldA = previousArmPoint(squid, pose, arm, joint), oldB = previousArmPoint(squid, pose, arm, joint + 1);
    const width = 45 * .84 ** joint + radius;
    if (player.x < Math.min(a.x, b.x, oldA.x, oldB.x) - width || player.x > Math.max(a.x, b.x, oldA.x, oldB.x) + width
      || player.y < Math.min(a.y, b.y, oldA.y, oldB.y) - width || player.y > Math.max(a.y, b.y, oldA.y, oldB.y) + width
      || player.z > Math.max(a.z, b.z, oldA.z, oldB.z) + width
      || player.z + EYE_HEIGHT < Math.min(a.z, b.z, oldA.z, oldB.z) - width) continue;
    const motion = Math.max(separation(a, oldA), separation(b, oldB));
    steps = Math.max(steps, Math.ceil(motion / Math.max(2, width * .5)));
  }
  return Math.min(24, steps);
}

/** Sample an actual moving pose, never a render-only offset. The full player
 * capsule is pushed along the swept arm so fast tips cannot cross it between
 * two fixed steps. Real physics nodes and capture state remain untouched.
 */
function resolveMovingSquid(world, squid, pose) {
  const reach = squid.headRadius * 1.2 + 900 + EYE_HEIGHT + (finite(pose) ? separation(squid, pose) : 0);
  if (separation(world.player, squid) > reach) return false;
  const steps = movingContactSteps(world.player, squid, pose, 5);
  if (steps <= 1) return false;
  const proxy = { ...squid, orientation: {}, tentacles: squid.tentacles.map((arm) => arm.map((point) => ({ ...point }))) };
  const view = { adultSquids: world.adultSquids.map((animal) => animal === squid ? proxy : animal), squids: world.squids ?? [],
    squidEncounter: world.squidEncounter, treeStalkerEncounter: world.treeStalkerEncounter,
    centipedeEncounter: world.centipedeEncounter };
  const current = getSquidOrientation(squid), previous = pose?.orientation ?? current;
  const sign = previous.x * current.x + previous.y * current.y + previous.z * current.z + previous.w * current.w < 0 ? -1 : 1;
  const origin = finite(pose) ? pose : squid;
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    Object.assign(proxy, at(origin, squid, t));
    for (const axis of ["x", "y", "z", "w"]) proxy.orientation[axis] = previous[axis] * (1 - t) + current[axis] * sign * t;
    for (let arm = 0; arm < squid.tentacles.length; arm++) for (let joint = 0; joint < squid.tentacles[arm].length; joint++) {
      const end = squid.tentacles[arm][joint], start = previousArmPoint(squid, pose, arm, joint);
      Object.assign(proxy.tentacles[arm][joint], step === steps ? end : at(start, end, t));
    }
    Object.assign(world.player, resolveSquidMovement(view, world.player, world.player));
  }
  return true;
}
