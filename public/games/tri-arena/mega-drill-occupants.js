import { MEGA_DRILL_LAYOUT as LAYOUT } from './mega-drill-layout.js';
import { getMegaDrillSegmentPoses, megaDrillRoomLocal, megaDrillRoomPoint } from './mega-drill-motion.js';
import { captureMegaDrillPassenger, carryMegaDrillPassenger, megaDrillFloor, separateMegaDrillPlayer } from './mega-drill-collision.js';

export const MEGA_DRILL_CREW_SEATS = Object.freeze([-2.05, 1.9].map(x => Object.freeze({ x, z: .26, room: 3 })));
const ownerFor = (game, actor) => game.state.enemies.find(owner => owner.id === actor.megaDrillId && owner.hp > 0);
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function pendingMegaDrillCrew(game, team) {
  if (game.isPractice()) return 0;
  return game.state.enemies.filter(owner => owner.type === LAYOUT.type && owner.hp > 0 && (team === undefined || owner.team === team))
    .reduce((count, owner) => count + (owner.megaCrewSpawned ?? []).filter(spawned => !spawned).length, 0);
}

export function attachMegaDrillOccupant(owner, actor, roomIndex, x = 0, z = 0, seat = null) {
  const pose = getMegaDrillSegmentPoses(owner.wormDistance)[roomIndex];
  Object.assign(actor, megaDrillRoomPoint(owner, pose, x, z), { ownerId: owner.id, megaDrillId: owner.id,
    megaRoomIndex: roomIndex, megaCrewSeat: seat, groundActorId: owner.id, groundHeight: LAYOUT.deckHeight + owner.elevation,
    elevation: LAYOUT.deckHeight + owner.elevation, jumpVelocity: 0, pinnedCrew: seat !== null,
    controlling: seat !== null, modelScale: 1 });
  if (owner.team !== undefined) actor.team = owner.team;
  if (seat !== null) actor.crewOf = owner.id;
  return actor;
}

export function spawnMegaDrillCrew(game, owner) {
  if (game.isPractice() || owner.hp <= 0) return 0;
  let count = 0;
  for (let index = 0; index < MEGA_DRILL_CREW_SEATS.length; index++) {
    if (owner.megaCrewSpawned[index] || game.availableActorSlots(owner, { forMegaCrew: true }) < 1) continue;
    const seat = MEGA_DRILL_CREW_SEATS[index], pose = getMegaDrillSegmentPoses(owner.wormDistance)[seat.room];
    const point = megaDrillRoomPoint(owner, pose, seat.x, seat.z);
    const actor = game.createEnemy('copper-robot', point.x, point.z, { team: owner.team, ownerId: owner.id });
    attachMegaDrillOccupant(owner, actor, seat.room, seat.x, seat.z, index); game.state.enemies.push(actor);
    owner.megaCrewSpawned[index] = true; owner.megaCrewIds[index] = actor.id; count++;
    if (game.state.survival) { game.state.survival.totalSpawned++; game.state.survival.megaCrewSpawned++; }
  }
  return count;
}

export function captureMegaDrillOccupants(game, owner) {
  const poses = getMegaDrillSegmentPoses(owner.wormDistance);
  return game.state.enemies.filter(actor => actor.megaDrillId === owner.id && actor.hp > 0).flatMap(actor => {
    const capture = captureMegaDrillPassenger(owner, actor);
    return capture ? [{ actor, capture, heading: owner.angle + poses[capture.index].angle }] : [];
  });
}
export function carryMegaDrillOccupants(owner, occupants) {
  const poses = getMegaDrillSegmentPoses(owner.wormDistance);
  for (const { actor, capture, heading } of occupants) {
    const x = actor.x, z = actor.z;
    carryMegaDrillPassenger(owner, actor, capture);
    if (actor.megaPrevious) { actor.megaPrevious.x += actor.x - x; actor.megaPrevious.z += actor.z - z; }
    actor.angle += owner.angle + poses[capture.index].angle - heading;
    actor.megaRoomIndex = capture.index;
  }
}

export function releaseMegaDrillOccupant(actor) {
  actor.formerMegaDrillId = actor.megaDrillId;
  Object.assign(actor, { megaDrillId: null, megaRoomIndex: null, megaCrewSeat: null, crewOf: null,
    groundActorId: null, groundHeight: 0, pinnedCrew: false, controlling: false, dismountVelocity: 0 });
}
export function releaseMegaDrillOccupants(game, owner) {
  for (const actor of game.state.enemies) if (actor.megaDrillId === owner.id && actor.hp > 0) releaseMegaDrillOccupant(actor);
}

/** Shared hull walls/floor are applied after movement and crowd separation. */
export function syncMegaDrillOccupant(game, actor) {
  if (actor.megaDrillId == null || actor.hp <= 0) return false;
  const owner = ownerFor(game, actor);
  if (!owner) { releaseMegaDrillOccupant(actor); return false; }
  const poses = getMegaDrillSegmentPoses(owner.wormDistance);
  if (actor.megaCrewSeat !== null) {
    const seat = MEGA_DRILL_CREW_SEATS[actor.megaCrewSeat];
    Object.assign(actor, megaDrillRoomPoint(owner, poses[3], seat.x, seat.z));
    actor.elevation = owner.elevation + LAYOUT.deckHeight; actor.groundHeight = actor.elevation; actor.groundActorId = owner.id;
    actor.impulseX = actor.impulseZ = 0;
    const targets = game.state.gameMode === 'war'
      ? game.state.enemies.filter(other => other.team !== actor.team) : [game.state.player];
    const intruder = targets.some(other => other.hp > 0 && boardPosition(owner, other)
      && (other.groundActorId === owner.id || other.elevation >= owner.elevation + LAYOUT.deckHeight - .25));
    if (!intruder && actor.attackName === 'sword' && ['windup', 'strike', 'recover'].includes(actor.phase)) {
      actor.phase = 'chase'; actor.phaseTime = 0; actor.attackName = '';
    }
    actor.controlling = !['windup', 'strike'].includes(actor.phase);
    if (actor.controlling) actor.angle = owner.angle + poses[3].angle;
    return true;
  }
  separateMegaDrillPlayer(owner, actor, actor.megaPrevious ?? actor);
  const height = megaDrillFloor(owner, actor, actor.x, actor.z);
  if (height > 0) {
    actor.elevation = height; actor.groundHeight = height; actor.groundActorId = owner.id;
    const capture = captureMegaDrillPassenger(owner, actor); if (capture) actor.megaRoomIndex = capture.index;
  } else releaseMegaDrillOccupant(actor);
  return true;
}

function boardPosition(owner, actor) {
  return getMegaDrillSegmentPoses(owner.wormDistance).map(pose => ({ pose, local: megaDrillRoomLocal(owner, pose, actor.x, actor.z) }))
    .find(({ local }) => Math.abs(local.x) < LAYOUT.width / 2 && Math.abs(local.z) <= 3.05);
}

/** Canonical robot sword states plus corridor routing, without teleporting an exit. */
export function updateMegaDrillOccupant(game, actor, dt) {
  if (actor.megaDrillId == null) return false;
  const owner = ownerFor(game, actor);
  if (!owner) { releaseMegaDrillOccupant(actor); return false; }
  syncMegaDrillOccupant(game, actor);
  if (actor.megaDrillId == null) return true;
  const target = game.state.player, stats = game.enemyStats(actor.type), here = boardPosition(owner, actor), there = boardPosition(owner, target);
  const intruder = there && (target.groundActorId === owner.id || target.elevation >= owner.elevation + LAYOUT.deckHeight - .25)
    && (game.state.gameMode !== 'war' || target.team !== actor.team);
  const visible = intruder && (here.pose.index === there.pose.index
    || Math.abs(here.local.x) < 1 && Math.abs(there.local.x) < 1 && Math.abs(here.pose.index - there.pose.index) === 1);
  actor.megaPrevious = { x: actor.x, z: actor.z };
  actor.phaseTime = Math.max(0, actor.phaseTime - dt);
  actor.controlling = actor.megaCrewSeat !== null && !['windup', 'strike'].includes(actor.phase);
  const armed = game.canEnemyDamage(actor, 'sword');
  if ((!intruder || !armed) && actor.attackName === 'sword' && ['windup', 'strike'].includes(actor.phase)) {
    actor.phase = 'chase'; actor.phaseTime = 0; actor.attackName = '';
  }
  if (actor.phase === 'windup') {
    if (actor.phaseTime === 0) {
      actor.phase = 'strike'; actor.phaseTime = .18;
      if (visible && armed && distance(actor, target) <= stats.range + .6
        && Math.cos(Math.atan2(target.x - actor.x, target.z - actor.z) - actor.angle) > .02) game.hurtPlayer(stats.damage * actor.damageScale, actor);
    }
  } else if (actor.phase === 'strike') {
    if (actor.phaseTime === 0) { actor.phase = 'recover'; actor.phaseTime = stats.recovery; }
  } else if (actor.phase === 'recover') {
    if (actor.phaseTime === 0) actor.phase = 'chase';
  } else if (visible && armed && distance(actor, target) <= stats.range) {
    actor.angle = Math.atan2(target.x - actor.x, target.z - actor.z); actor.phase = 'windup'; actor.phaseTime = stats.windup;
    actor.attackName = 'sword'; actor.controlling = false;
  } else if (actor.megaCrewSeat === null) {
    let goal;
    if (intruder && here.pose.index === there.pose.index) goal = target;
    else {
      const direction = intruder ? Math.sign(there.pose.index - here.pose.index) : -1;
      const z = Math.abs(here.local.x) > .15 ? clamp(here.local.z, -2.2, 2.2) : direction * (here.pose.index === 0 && direction < 0 ? 3.6 : 3.3);
      goal = megaDrillRoomPoint(owner, here.pose, 0, z);
    }
    const dx = goal.x - actor.x, dz = goal.z - actor.z, d = Math.hypot(dx, dz);
    if (d > .02) {
      const speed = stats.speed * actor.speedScale * (actor.crippled ? .7 : 1) * game.groundMobility(actor), step = Math.min(d, speed * dt);
      actor.x += dx / d * step; actor.z += dz / d * step; actor.angle = Math.atan2(dx, dz);
    }
  }
  syncMegaDrillOccupant(game, actor);
  return true;
}
