import { MINE_WALKER_LAYOUT as LAYOUT, MINE_WALKER_CREW_SEATS } from './mine-walker-layout.js';
import { mineWalkerPoint, insideMineWalkerRoom, captureMineWalkerPassenger, carryMineWalkerPassenger } from './mine-walker-collision.js';

const ownerFor = (game, actor) => game.state.enemies.find(owner => owner.id === actor.mineWalkerId && owner.hp > 0);
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export function pendingMineWalkerCrew(game, team) {
  if (game.isPractice()) return 0;
  return game.state.enemies.filter(owner => owner.type === LAYOUT.type && owner.hp > 0
    && owner.structureState?.[LAYOUT.floorId]?.remaining !== 0 && (team === undefined || owner.team === team))
    .reduce((count, owner) => count + (owner.walkerCrewSpawned ?? []).filter(spawned => !spawned).length, 0);
}

export function attachMineWalkerOccupant(owner, actor, seatIndex) {
  const seat = MINE_WALKER_CREW_SEATS[seatIndex];
  if (!seat) throw new RangeError('A Mine Walker crew seat must be an index from 0 to 4.');
  const point = mineWalkerPoint(owner, seat);
  Object.assign(actor, { x: point.x, z: point.z, elevation: point.y, groundHeight: point.y,
    groundActorId: owner.id, ownerId: owner.id, mineWalkerId: owner.id, walkerCrewSeat: seatIndex,
    crewOf: owner.id, pinnedCrew: true, controlling: true, modelScale: seat.scale, jumpVelocity: 0,
    angle: (owner.angle || 0) + seat.angle });
  if (owner.team !== undefined) actor.team = owner.team;
  return actor;
}

/** Fill each real Miner seat once; a killed crew member never respawns. */
export function spawnMineWalkerCrew(game, owner) {
  if (game.isPractice() || owner.hp <= 0 || owner.structureState?.[LAYOUT.floorId]?.remaining === 0) return 0;
  owner.walkerCrewSpawned ??= Array(MINE_WALKER_CREW_SEATS.length).fill(false);
  owner.walkerCrewIds ??= Array(MINE_WALKER_CREW_SEATS.length).fill(null);
  let count = 0;
  for (const [index, seat] of MINE_WALKER_CREW_SEATS.entries()) {
    if (owner.walkerCrewSpawned[index] || game.availableActorSlots(owner, { forWalkerCrew: true }) < 1) continue;
    const point = mineWalkerPoint(owner, seat);
    const actor = game.createEnemy('miner-bot', point.x, point.z, { team: owner.team, ownerId: owner.id });
    attachMineWalkerOccupant(owner, actor, index); game.state.enemies.push(actor);
    owner.walkerCrewSpawned[index] = true; owner.walkerCrewIds[index] = actor.id; count++;
    if (game.state.survival) {
      const stats = game.state.survival;
      stats.totalSpawned = Math.min(Number.MAX_SAFE_INTEGER, (stats.totalSpawned || 0) + 1);
      stats.mineWalkerCrewSpawned = Math.min(Number.MAX_SAFE_INTEGER, (stats.mineWalkerCrewSpawned || 0) + 1);
    }
  }
  return count;
}

export function releaseMineWalkerOccupant(actor) {
  actor.formerMineWalkerId = actor.mineWalkerId;
  Object.assign(actor, { mineWalkerId: null, walkerCrewSeat: null, crewOf: null, groundActorId: null,
    groundHeight: 0, pinnedCrew: false, controlling: false, dismountVelocity: 0 });
}
export function releaseMineWalkerOccupants(game, owner) {
  for (const actor of game.state.enemies) if (actor.mineWalkerId === owner.id && actor.hp > 0) releaseMineWalkerOccupant(actor);
}

function hasIntruder(game, owner, crew) {
  const candidates = game.state.gameMode === 'war' ? game.state.enemies.filter(actor => actor.team !== crew.team) : [game.state.player];
  return candidates.some(actor => actor.hp > 0 && insideMineWalkerRoom(owner, actor));
}

export function syncMineWalkerOccupant(game, actor) {
  if (actor.mineWalkerId == null || actor.hp <= 0) return false;
  const owner = ownerFor(game, actor), seat = MINE_WALKER_CREW_SEATS[actor.walkerCrewSeat];
  if (!owner || !seat || owner.structureState?.[LAYOUT.floorId]?.remaining === 0) { releaseMineWalkerOccupant(actor); return false; }
  const point = mineWalkerPoint(owner, seat);
  Object.assign(actor, { x: point.x, z: point.z, elevation: point.y, groundHeight: point.y, groundActorId: owner.id, impulseX: 0, impulseZ: 0 });
  if (!hasIntruder(game, owner, actor) && actor.attackName === 'sword' && ['windup', 'strike', 'recover'].includes(actor.phase)) {
    actor.phase = 'chase'; actor.phaseTime = 0; actor.attackName = '';
  }
  actor.controlling = !['windup', 'strike'].includes(actor.phase);
  if (actor.controlling) actor.angle = (owner.angle || 0) + seat.angle;
  return true;
}

/** Inside defenders use the existing real Miner pickaxe timing and weapon snapshot. */
export function updateMineWalkerOccupant(game, actor, dt) {
  if (actor.mineWalkerId == null) return false;
  if (!syncMineWalkerOccupant(game, actor)) return true;
  const owner = ownerFor(game, actor), target = game.state.player, stats = game.enemyStats(actor.type);
  const hostile = game.state.gameMode !== 'war' || target.team !== actor.team;
  const visible = hostile && target.hp > 0 && insideMineWalkerRoom(owner, target);
  const armed = game.canEnemyDamage(actor, 'sword');
  actor.phaseTime = Math.max(0, actor.phaseTime - dt);
  if ((!visible || !armed) && actor.attackName === 'sword' && ['windup', 'strike'].includes(actor.phase)) {
    actor.phase = 'chase'; actor.phaseTime = 0; actor.attackName = '';
  }
  if (actor.phase === 'windup') {
    if (actor.phaseTime === 0) {
      actor.phase = 'strike'; actor.phaseTime = .18;
      if (visible && armed && distance(actor, target) <= stats.range + .6
        && Math.cos(Math.atan2(target.x - actor.x, target.z - actor.z) - actor.angle) > .02) game.hurtPlayer(stats.damage * (actor.damageScale || 1), actor);
    }
  } else if (actor.phase === 'strike') {
    if (actor.phaseTime === 0) { actor.phase = 'recover'; actor.phaseTime = stats.recovery; }
  } else if (actor.phase === 'recover') {
    if (actor.phaseTime === 0) actor.phase = 'chase';
  } else if (visible && armed && distance(actor, target) <= stats.range) {
    actor.angle = Math.atan2(target.x - actor.x, target.z - actor.z);
    actor.phase = 'windup'; actor.phaseTime = stats.windup; actor.attackName = 'sword';
  }
  actor.controlling = !['windup', 'strike'].includes(actor.phase);
  return true;
}

export function captureMineWalkerOccupants(game, owner) {
  return game.state.enemies.filter(actor => actor.mineWalkerId === owner.id && actor.hp > 0).flatMap(actor => {
    const capture = captureMineWalkerPassenger(owner, actor);
    return capture ? [{ actor, capture, heading: owner.angle || 0 }] : [];
  });
}
export function carryMineWalkerOccupants(owner, occupants) {
  for (const { actor, capture, heading } of occupants) {
    carryMineWalkerPassenger(owner, actor, capture); actor.angle += (owner.angle || 0) - heading;
  }
}
