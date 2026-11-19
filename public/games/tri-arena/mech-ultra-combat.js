import { ULTRA_GUN_IDS, ULTRA_FABRICATOR_IDS, ULTRA_MAIN_ROOMS, ULTRA_CREW_SEATS, ULTRA_GUN_MOUNTS,
  ultraPoint, ultraLocalPoint, ultraGunMuzzle, ultraSlamTarget, ultraHandPoint } from './mech-ultra-layout.js';
import { captureUltraPassenger, carryUltraPassenger, ultraHullBlocks, ultraFloor } from './mech-ultra-collision.js';
import { advanceUltraPatrol, stopUltraPatrol, settleUltraPatrol, ultraPatrolRouteError, ULTRA_PATROL } from './mech-ultra-motion.js';
import { ULTRA_ISLAND } from './mech-ultra-cover.js';
import { updateUltraRoofLaunchers } from './mech-ultra-roof-combat.js';
export { ULTRA_GUN_IDS, ULTRA_FABRICATOR_IDS } from './mech-ultra-layout.js';

export const MECH_SPIDER_TANK_ULTRA = Object.freeze({ id: 'mech-spider-tank-ultra', name: 'Mech Spider Tank Ultra',
  exclusiveArena: 'drill-mine', unlockWave: 50, hp: 999999999, radius: 15, speed: ULTRA_PATROL.speed,
  range: 100, windup: 2, recovery: 5, impactRadius: 4, damage: 55, score: 50000,
  attacks: Object.freeze(['drill-slam', 'machine-guns', 'fabricate']),
  description: 'The final Mine encounter: an enormous walking factory assembled from the wreckage beneath the island.',
  attackHelp: 'Leave the locked drill warning. The arm stays down for exactly five seconds: board it and cut your way into the factory.' });
export const ULTRA_ORIGIN = Object.freeze({ x: 0, z: -18 });
export const ULTRA_ARM_DOWN_SECONDS = 5;
export const ULTRA_MINION_CAP = 12;
export const ULTRA_ROBOT_TYPES = Object.freeze(['miner-bot', 'copper-robot', 'knight', 'copper-drill-worm',
  'copper-head-catapult', 'copper-drill-hound', 'copper-repair-drone']);
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const SLAM_SECONDS = .35, RETRACT_SECONDS = 1.5;

export function initializeMechUltra(enemy) {
  Object.assign(enemy, { x: ULTRA_ORIGIN.x, z: ULTRA_ORIGIN.z, angle: 0, elevation: 0,
    warningRadius: MECH_SPIDER_TANK_ULTRA.impactRadius, weaponState: null, structureState: null,
    ultra: { phase: 'ready', navigation: 'outbound', phaseTime: ULTRA_PATROL.roamSeconds, targetX: 0, targetZ: 0, slamProgress: 0,
      walkDistance: 0, moving: false, walkSpeed: 0, walkVelocityX: 0, walkVelocityZ: 0, walkLocalVelocityX: 0, walkLocalVelocityZ: 0,
      walkGroundElevation: 0, walkPauseRemaining: ULTRA_PATROL.anticipationSeconds, walkPauseTotal: ULTRA_PATROL.anticipationSeconds,
      armDown: false, armDownElapsed: 0, strikeHit: false, gunClock: 0, gunIndex: 0,
      fabricationPhase: 'idle', fabricationTime: 0, fabricationProgress: 0, fabricationCooldown: 4,
      fabricatedType: null, fabricated: 0, internalCooldowns: [7, 9, 11, 13, 15], reactorsDestroyed: [] } });
}

function setPhase(enemy, phase, time) {
  const state = enemy.ultra;
  state.phase = phase; state.phaseTime = time;
  enemy.phase = phase === 'warning' ? 'windup' : phase === 'slam' ? 'strike' : phase === 'ready' ? 'chase' : 'recover';
  enemy.phaseTime = time; enemy.attackName = phase === 'ready' ? '' : 'drill-slam';
}

function robotCount(game, owner) {
  return game.state.enemies.filter(actor => actor.hp > 0 && actor.ownerId === owner.id && !actor.boss).length;
}

export function spawnUltraCrew(game, owner) {
  if (owner.ultra.crewSpawned) return 0;
  owner.ultra.crewSpawned = true;
  let count = 0;
  for (let index = 0; index < ULTRA_CREW_SEATS.length && robotCount(game, owner) < ULTRA_MINION_CAP && game.availableActorSlots(owner) > 0; index++) {
    const seat = ULTRA_CREW_SEATS[index], point = ultraPoint(owner, seat);
    const crew = game.createEnemy('miner-bot', point.x, point.z, { ownerId: owner.id });
    Object.assign(crew, { ownerId: owner.id, ultraRoom: seat.roomIndex, ultraCrew: true, ultraStationId: seat.id,
      elevation: point.y, angle: finite(owner.angle) + finite(seat.angle) });
    game.state.enemies.push(crew); count++;
    if (game.state.survival) game.state.survival.totalSpawned++;
  }
  return count;
}

/** Interior NPCs use the same room dimensions and deck heights as the player. */
export function constrainUltraOccupant(game, actor, previous = actor) {
  const ownerId = actor.groundActorId ?? actor.ultraSupportOwnerId ?? actor.ownerId;
  const owner = game.state.enemies.find(enemy => enemy.id === ownerId && enemy.hp > 0 && enemy.ultra);
  if (!owner) {
    delete actor.ultraRoom; delete actor.ultraCrew; delete actor.ultraSupportOwnerId; delete actor.ultraFalling;
    actor.groundActorId = null; actor.groundHeight = 0; actor.dismountVelocity ??= 0; return;
  }
  const room = ULTRA_MAIN_ROOMS[actor.ultraRoom];
  if (room && !actor.ultraFalling) {
    const point = ultraLocalPoint(owner, { x: actor.x, y: actor.elevation, z: actor.z });
    const margin = Math.min(actor.radius + .25, room.width / 4);
    point.x = clamp(point.x, -room.width / 2 + margin, room.width / 2 - margin);
    point.z = clamp(point.z, -room.depth / 2 + margin, room.depth / 2 - margin);
    const world = ultraPoint(owner, point); actor.x = world.x; actor.z = world.z;
  }
  const beforeY = finite(previous.elevation, actor.elevation), roomY = room ? finite(owner.elevation) + room.floorY : actor.elevation;
  const probeY = actor.ultraFalling ? Math.max(beforeY, actor.elevation) : roomY;
  const floor = ultraFloor(owner, { ...actor, elevation: probeY }, actor.x, actor.z);
  const standing = !actor.ultraFalling && floor > 0 && Math.abs(floor - roomY) <= .42;
  const landed = actor.ultraFalling && floor > 0 && actor.elevation <= floor && beforeY >= floor - .42;
  if (standing || landed) {
    actor.elevation = floor; actor.groundHeight = floor; actor.groundActorId = owner.id; actor.ultraSupportOwnerId = owner.id;
    delete actor.ultraFalling; delete actor.dismountVelocity;
    const point = ultraLocalPoint(owner, { x: actor.x, y: floor, z: actor.z });
    const index = ULTRA_MAIN_ROOMS.findIndex(candidate => Math.abs(point.y - candidate.floorY) <= .42
      && Math.abs(point.x - candidate.x) < candidate.width / 2 && Math.abs(point.z - candidate.z) < candidate.depth / 2);
    if (index >= 0) actor.ultraRoom = index; else delete actor.ultraRoom;
    return;
  }
  delete actor.ultraRoom; actor.groundActorId = null; actor.groundHeight = 0;
  if (actor.type === 'copper-repair-drone' || actor.elevation <= 0) {
    delete actor.ultraSupportOwnerId; delete actor.ultraFalling; return;
  }
  actor.ultraSupportOwnerId = owner.id; actor.ultraFalling = true; actor.dismountVelocity ??= 0;
}

export function releaseUltraOccupants(game, owner) {
  for (const actor of game.state.enemies) if (actor.ownerId === owner.id && actor.ultraRoom != null
    || actor.ultraSupportOwnerId === owner.id || actor.groundActorId === owner.id) {
    delete actor.ultraRoom; delete actor.ultraCrew; delete actor.ultraSupportOwnerId; delete actor.ultraFalling;
    actor.groundActorId = null; actor.groundHeight = 0;
    actor.dismountVelocity = 0; actor.impulseX = 0; actor.impulseZ = 0;
  }
  if (game.state.player.groundActorId === owner.id) {
    game.state.player.groundActorId = null; game.state.player.groundHeight = 0; game.state.player.jumpVelocity = 0;
  }
}

/** Fabricators share a hard budget, including a robot currently held in the hand. */
export function fabricateUltraRobot(game, owner, { internal = false, index = 0, type } = {}) {
  if (internal && (!Number.isSafeInteger(index) || index < 0 || index >= ULTRA_MAIN_ROOMS.length)) {
    throw new RangeError('Ultra internal fabricator index must be from 0 to 4.');
  }
  if (type !== undefined && !ULTRA_ROBOT_TYPES.includes(type)) {
    throw new RangeError(`Ultra cannot fabricate boss or unknown robot: ${String(type)}`);
  }
  if (owner.hp <= 0 || robotCount(game, owner) >= ULTRA_MINION_CAP
    || game.availableActorSlots(owner) <= 0) return null;
  const weapon = internal ? ULTRA_FABRICATOR_IDS[index] : 'ultra-hand-fabricator';
  if (!game.canEnemyDamage(owner, weapon)) return null;
  const state = owner.ultra, robotType = type ?? ULTRA_ROBOT_TYPES[state.fabricated % ULTRA_ROBOT_TYPES.length];
  if (!ULTRA_ROBOT_TYPES.includes(robotType)) throw new RangeError(`Ultra cannot fabricate boss or unknown robot: ${String(robotType)}`);
  const room = ULTRA_MAIN_ROOMS[index];
  const point = internal ? ultraPoint(owner, { x: (index % 2 ? -1 : 1) * 4, y: room.floorY, z: 2 })
    : ultraHandPoint(owner);
  // A distant War placement must walk into reach before releasing its held
  // robot. Spawn at the physical hand, then let ordinary gravity finish it.
  if (!internal && (Math.abs(point.x) > ULTRA_ISLAND.halfWidth - .8 || Math.abs(point.z) > ULTRA_ISLAND.halfDepth - .8)) return null;
  const { x, z } = point;
  const robot = game.createEnemy(robotType, x, z, { ownerId: owner.id });
  Object.assign(robot, { ownerId: owner.id, ultraFabricator: internal ? index : 'hand', elevation: point.y });
  if (internal) robot.ultraRoom = index;
  else if (robotType !== 'copper-repair-drone') {
    robot.ultraDeploying = true;
    if (robotType !== 'copper-drill-hound') robot.dismountVelocity = 0;
  }
  game.state.enemies.push(robot); state.fabricated++;
  if (game.state.survival) game.state.survival.totalSpawned++;
  game.emit('fabricate', owner, { id: owner.id, enemyType: owner.type, count: 1, robotType, internal, index });
  return robot;
}

function updateFabrication(game, enemy, dt) {
  const state = enemy.ultra;
  if (!game.canEnemyDamage(enemy, 'ultra-hand-fabricator')) {
    state.fabricationPhase = 'idle'; state.fabricatedType = null; state.fabricationProgress = 0;
  } else if (state.fabricationPhase === 'idle') {
    state.fabricationCooldown = Math.max(0, state.fabricationCooldown - dt);
    if (state.fabricationCooldown === 0 && robotCount(game, enemy) < ULTRA_MINION_CAP && game.availableActorSlots(enemy) > 0) {
      state.fabricationPhase = 'dipping'; state.fabricationTime = 1.2; state.fabricationProgress = 0;
      state.fabricatedType = ULTRA_ROBOT_TYPES[state.fabricated % ULTRA_ROBOT_TYPES.length];
    }
  } else {
    state.fabricationTime = Math.max(0, state.fabricationTime - dt);
    if (state.fabricationPhase === 'dipping') {
      if (state.fabricationTime < 1e-8) { state.fabricationPhase = 'building'; state.fabricationTime = 3; }
    } else if (state.fabricationPhase === 'building') {
      state.fabricationProgress = 1 - state.fabricationTime / 3;
      if (state.fabricationTime < 1e-8) { state.fabricationPhase = 'placing'; state.fabricationTime = 1.5; }
    } else if (state.fabricationTime < 1e-8) {
      if (fabricateUltraRobot(game, enemy, { type: state.fabricatedType })) {
        state.fabricationPhase = 'idle'; state.fabricatedType = null; state.fabricationProgress = 0; state.fabricationCooldown = 7;
      }
    }
  }
  for (let index = 0; index < state.internalCooldowns.length; index++) {
    if (!game.canEnemyDamage(enemy, ULTRA_FABRICATOR_IDS[index])) continue;
    state.internalCooldowns[index] = Math.max(0, state.internalCooldowns[index] - dt);
    if (state.internalCooldowns[index] < 1e-8) {
      const reserved = state.fabricationPhase === 'idle' ? 0 : 1;
      if (robotCount(game, enemy) < ULTRA_MINION_CAP - reserved && game.availableActorSlots(enemy) > reserved
        && fabricateUltraRobot(game, enemy, { internal: true, index })) {
        state.internalCooldowns[index] = 14 + index;
      }
    }
  }
}

function updateGuns(game, enemy, dt) {
  const state = enemy.ultra, player = game.state.player;
  state.gunTargetX = player.x; state.gunTargetY = finite(player.elevation) + 1.2; state.gunTargetZ = player.z;
  state.gunClock = Math.max(0, state.gunClock - dt);
  if (state.gunClock > 0) return;
  const active = ULTRA_GUN_IDS.filter(id => game.canEnemyDamage(enemy, id));
  if (!active.length) return;
  const target = { x: state.gunTargetX, y: state.gunTargetY, z: state.gunTargetZ };
  let index = -1, weaponId;
  for (let attempt = 0; attempt < active.length; attempt++) {
    const candidate = active[state.gunIndex++ % active.length], candidateIndex = ULTRA_GUN_IDS.indexOf(candidate);
    // Check from the real mount: a barrel aimed inward can put its muzzle
    // behind a window, which must never bypass the occupied room's shelter.
    if (ultraHullBlocks(enemy, ultraPoint(enemy, ULTRA_GUN_MOUNTS[candidateIndex]), target)) continue;
    index = candidateIndex; weaponId = candidate; break;
  }
  if (index < 0) { state.gunClock = .25; return; }
  const { x, y, z } = ultraGunMuzzle(enemy, index);
  const distance = Math.max(1, Math.hypot(player.x - x, player.z - z));
  game.fireProjectiles(enemy, 1, { kind: 'copper', weaponId, x, y, z,
    angle: Math.atan2(player.x - x, player.z - z), vy: (finite(player.elevation) + 1.2 - y) / (distance / 12),
    speed: 12, damage: 7, life: 9, arming: .35 });
  state.gunClock = .7;
}

function insideMainRoom(owner, actor) {
  const point = ultraLocalPoint(owner, { x: actor.x, y: finite(actor.elevation), z: actor.z });
  return ULTRA_MAIN_ROOMS.some(room => point.y >= room.floorY - .42 && point.y < room.roofY - .25
    && Math.abs(point.x - room.x) < room.width / 2 && Math.abs(point.z - room.z) < room.depth / 2);
}

function finishUltraUpdate(game, enemy, passengers, dt) {
  for (const { actor, token } of passengers) carryUltraPassenger(enemy, actor, token);
  updateGuns(game, enemy, dt);
  updateUltraRoofLaunchers(game, enemy, dt);
}

function advanceUltraNavigation(game, enemy, player, dt) {
  const state = enemy.ultra;
  if (state.navigation === 'settle') {
    if (!settleUltraPatrol(enemy, dt)) return;
    const target = ultraSlamTarget(enemy, { x: player.x, z: player.z });
    state.targetX = target.x; state.targetZ = target.z; state.targetY = target.y; state.strikeHit = false;
    enemy.targetX = target.x; enemy.targetZ = target.z;
    setPhase(enemy, 'warning', MECH_SPIDER_TANK_ULTRA.windup);
    game.emit('bossattack', enemy, { id: enemy.id, enemyType: enemy.type, attackName: 'drill-slam', targetX: target.x, targetZ: target.z });
    return;
  }
  const route = state.navigation === 'approach' ? 'attack' : 'outer';
  advanceUltraPatrol(enemy, dt, { route });
  if (state.navigation === 'approach') {
    if (ultraPatrolRouteError(enemy, 'attack') < .6) state.navigation = 'settle';
  } else if (state.navigation === 'patrol') {
    state.phaseTime = Math.max(0, state.phaseTime - dt);
    if (state.phaseTime < 1e-8) { state.navigation = 'approach'; stopUltraPatrol(enemy); }
  } else if (ultraPatrolRouteError(enemy) < .8) {
    state.navigation = 'patrol'; state.phaseTime = ULTRA_PATROL.roamSeconds;
  }
  enemy.phaseTime = state.phaseTime;
}

/** The locked position never follows the player; every impact grants a full five-second boarding window. */
export function updateMechUltra(game, enemy, dt) {
  const state = enemy.ultra, player = game.state.player;
  const actors = game.state.enemies.filter(actor => actor !== enemy && actor.hp > 0);
  // War aims through a copy of its real target. Carry that actor once, rather
  // than also moving the proxy and applying its offset again after the AI step.
  const passengers = [...(player.id != null && actors.some(actor => actor.id === player.id) ? [] : [player]), ...actors]
    .map(actor => ({ actor, token: captureUltraPassenger(enemy, actor) })).filter(entry => entry.token);
  enemy.bossClock += dt;
  enemy.impulseX = 0; enemy.impulseZ = 0;
  updateFabrication(game, enemy, dt);
  // An internal factory can create an occupant before its first NPC update has
  // assigned groundActorId. It still boards the same physical moving floor.
  const previousActors = new Set(actors);
  for (const actor of game.state.enemies) if (actor !== enemy && actor.hp > 0 && !previousActors.has(actor)) {
    const token = captureUltraPassenger(enemy, actor);
    if (token) passengers.push({ actor, token });
  }
  if ((state.phase === 'ready' && insideMainRoom(enemy, player))
    || (!game.canEnemyDamage(enemy, 'ultra-drill') && !['down', 'retract'].includes(state.phase))) {
    // Boarding is rewarded with an interior fight. Existing warnings, strikes
    // and five-second recovery windows retain their already locked timing.
    state.armDown = false; state.slamProgress = 0; setPhase(enemy, 'ready', ULTRA_PATROL.roamSeconds);
    state.navigation = ultraPatrolRouteError(enemy) < .8 ? 'patrol' : 'outbound';
    advanceUltraPatrol(enemy, dt);
    finishUltraUpdate(game, enemy, passengers, dt);
    return;
  }
  let remaining = Math.max(0, dt);
  // Consume boundary overshoot so the down interval is exactly five simulation seconds.
  for (let transitions = 0; transitions < 5 && remaining > 1e-10; transitions++) {
    if (state.phase === 'ready') {
      advanceUltraNavigation(game, enemy, player, remaining); remaining = 0; break;
    }
    const consumed = Math.min(state.phaseTime, remaining);
    stopUltraPatrol(enemy);
    state.phaseTime = Math.max(0, state.phaseTime - consumed); remaining -= consumed;
    if (state.phase === 'slam') state.slamProgress = clamp(1 - state.phaseTime / SLAM_SECONDS, 0, 1);
    if (state.phase === 'down') state.armDownElapsed = clamp(ULTRA_ARM_DOWN_SECONDS - state.phaseTime, 0, ULTRA_ARM_DOWN_SECONDS);
    if (state.phase === 'retract') {
      state.slamProgress = clamp(state.phaseTime / RETRACT_SECONDS, 0, 1);
      state.retractProgress = 1 - state.slamProgress;
    }
    enemy.phaseTime = state.phaseTime;
    if (state.phaseTime > 1e-9) break;
    if (state.phase === 'warning') {
      if (!game.canEnemyDamage(enemy, 'ultra-drill')) { setPhase(enemy, 'ready', ULTRA_PATROL.roamSeconds); continue; }
      state.slamProgress = 0; setPhase(enemy, 'slam', SLAM_SECONDS);
    } else if (state.phase === 'slam') {
      state.slamProgress = 1; state.armDown = true; state.armDownElapsed = 0;
      if (game.canEnemyDamage(enemy, 'ultra-drill') && Math.hypot(player.x - state.targetX, player.z - state.targetZ) < MECH_SPIDER_TANK_ULTRA.impactRadius
        && finite(player.elevation) < 3) {
        state.strikeHit = game.hurtPlayer(MECH_SPIDER_TANK_ULTRA.damage * finite(enemy.damageScale, 1),
          { x: state.targetX, z: state.targetZ });
      }
      setPhase(enemy, 'down', ULTRA_ARM_DOWN_SECONDS);
      game.emit('ultraslam', enemy, { id: enemy.id, targetX: state.targetX, targetZ: state.targetZ, hit: state.strikeHit });
    } else if (state.phase === 'down') {
      state.armDown = false; state.armDownElapsed = ULTRA_ARM_DOWN_SECONDS; state.retractProgress = 0; setPhase(enemy, 'retract', RETRACT_SECONDS);
    } else {
      state.slamProgress = 0; state.navigation = 'outbound'; setPhase(enemy, 'ready', ULTRA_PATROL.roamSeconds);
    }
  }
  finishUltraUpdate(game, enemy, passengers, dt);
}

