import { ARENA_BOUNDS } from './arena-config.js';
import { MEGA_DRILL_LAYOUT as LAYOUT, megaDrillPoint } from './mega-drill-layout.js';
import { EYE_HEIGHT } from './sword-config.js';
import { getMegaDrillSegmentPoses, megaDrillBounds, megaDrillRoomPoint } from './mega-drill-motion.js';
import { captureMegaDrillPassenger, carryMegaDrillPassenger } from './mega-drill-collision.js';
import { attachMegaDrillOccupant, spawnMegaDrillCrew, captureMegaDrillOccupants, carryMegaDrillOccupants } from './mega-drill-occupants.js';

export const COPPER_MEGA_DRILL = Object.freeze({ id: 'copper-mega-drill', name: 'Copper Mega Drill',
  description: 'A 33-metre copper machine with four worm-like moving room segments, 1,000,000 health, four reactors, two robot fabricators and a repair-drone bay.',
  attackHelp: 'Evade the warned front drill. Enter the rear ramp to reach its four reactor rooms; each destroyed reactor removes a quarter of its health.',
  hp: 1000000, radius: 4.5, speed: 3.4, range: 20, windup: 1.2, recovery: 2.4, damage: 40, score: 12000,
  unlockWave: 30, footprint: Object.freeze({ halfX: LAYOUT.width / 2, halfZ: LAYOUT.tipZ,
    hullMinZ: LAYOUT.rearZ, hullMaxZ: LAYOUT.hullFrontZ }), attacks: Object.freeze(['drill', 'fabricate']) });
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const pristine = (owner, id) => {
  const part = owner.structureState?.[id];
  return !part || part.total > 0 && part.remaining === part.total;
};

export function initializeMegaDrill(enemy, arenaBounds = ARENA_BOUNDS) {
  Object.assign(enemy, { angle: 0, hp: COPPER_MEGA_DRILL.hp, maxHp: COPPER_MEGA_DRILL.hp,
    repairMaxHp: COPPER_MEGA_DRILL.hp, reactorsDestroyed: [false, false, false, false],
    factoryCooldowns: [6, 8], fabricationTime: [0, 0], fabricating: [false, false], fabricated: 0,
    droneCooldown: 7, dronesSpawned: 0, drillSpinning: true, wormDistance: 0,
    megaCrewSpawned: [false, false], megaCrewIds: [null, null] });
  clampPosition(enemy, arenaBounds);
}

function clampPosition(enemy, arenaBounds = ARENA_BOUNDS) {
  const bounds = megaDrillBounds(enemy.angle, enemy.wormDistance);
  enemy.x = clamp(enemy.x, -arenaBounds.x - bounds.minX + .02, arenaBounds.x - bounds.maxX - .02);
  enemy.z = clamp(enemy.z, -arenaBounds.z - bounds.minZ + .02, arenaBounds.z - bounds.maxZ - .02);
}

/** Bounded steering never uses a wall correction to teleport faster than travel speed. */
function moveMegaDrill(game, enemy, dt) {
  if (['windup', 'strike'].includes(enemy.phase) || dt <= 0) return;
  const arenaBounds = game.arenaBounds ?? ARENA_BOUNDS;
  const target = game.state.player, dx = target.x - enemy.x, dz = target.z - enemy.z, distance = Math.hypot(dx, dz);
  const startX = enemy.x, startZ = enemy.z, startDistance = enemy.wormDistance;
  const passenger = game.state.enemies.find(actor => actor.playerControlled && actor.hp > 0) ?? target;
  const capture = captureMegaDrillPassenger(enemy, passenger), passengerX = passenger.x, passengerZ = passenger.z;
  const occupants = captureMegaDrillOccupants(game, enemy);
  const footprint = megaDrillBounds(enemy.angle, enemy.wormDistance);
  const clearance = Math.min(arenaBounds.x + enemy.x + footprint.minX, arenaBounds.x - enemy.x - footprint.maxX,
    arenaBounds.z + enemy.z + footprint.minZ, arenaBounds.z - enemy.z - footprint.maxZ);
  // A rider is transported, never chased inside the machine. Cruise until the
  // boundary requires a gradual turn back toward the arena centre.
  const desired = capture ? clearance < 3 ? Math.atan2(-enemy.x, -enemy.z) : enemy.angle : Math.atan2(dx, dz);
  const difference = Math.atan2(Math.sin(desired - enemy.angle), Math.cos(desired - enemy.angle));
  const turn = clamp(difference, -.45 * dt, .45 * dt), budget = COPPER_MEGA_DRILL.speed * dt;
  for (const fraction of [1, .5, .25, .125, .0625]) {
    const angle = enemy.angle + turn * fraction, step = capture || distance > 14.5 ? budget * fraction : 0;
    const goalX = startX + Math.sin(angle) * step, goalZ = startZ + Math.cos(angle) * step;
    let x = goalX, z = goalZ, travelled = step;
    // Bending changes the footprint slightly. Solve against the resulting
    // travelled distance, then reject any correction exceeding this frame's budget.
    for (let iteration = 0; iteration < 8; iteration++) {
      const bounds = megaDrillBounds(angle, startDistance + travelled);
      x = clamp(goalX, -arenaBounds.x - bounds.minX + .02, arenaBounds.x - bounds.maxX - .02);
      z = clamp(goalZ, -arenaBounds.z - bounds.minZ + .02, arenaBounds.z - bounds.maxZ - .02);
      if (game.constrainMegaDrillPose) {
        const constrained = game.constrainMegaDrillPose({ ...enemy, x, z, angle, wormDistance: startDistance + travelled });
        x = constrained.x; z = constrained.z;
      }
      travelled = Math.hypot(x - startX, z - startZ);
    }
    const bounds = megaDrillBounds(angle, startDistance + travelled);
    if (travelled > budget + 1e-8 || x + bounds.minX < -arenaBounds.x || x + bounds.maxX > arenaBounds.x
      || z + bounds.minZ < -arenaBounds.z || z + bounds.maxZ > arenaBounds.z) continue;
    if (game.isMegaDrillPoseAllowed && !game.isMegaDrillPoseAllowed({ ...enemy, x, z, angle, wormDistance: startDistance + travelled })) continue;
    enemy.x = x; enemy.z = z; enemy.angle = angle;
    enemy.wormDistance = Math.min(Number.MAX_SAFE_INTEGER, startDistance + travelled);
    carryMegaDrillPassenger(enemy, passenger, capture);
    carryMegaDrillOccupants(enemy, occupants);
    if (capture && game.previousPlayerPosition && (passenger.playerControlled || passenger === game.state.player)) {
      game.previousPlayerPosition.x += passenger.x - passengerX; game.previousPlayerPosition.z += passenger.z - passengerZ;
    }
    break;
  }
}

/** Functional factory pixels must all remain attached, including during windup. */
export function fabricateMegaDrillRobot(game, owner, roomIndex, robotTypes) {
  if (game.isPractice() || owner.hp <= 0 || ![0, 1].includes(roomIndex)
    || !pristine(owner, LAYOUT.fabricatorIds[roomIndex]) || game.availableActorSlots(owner) < 1) return 0;
  const pose = getMegaDrillSegmentPoses(owner.wormDistance)[roomIndex];
  const x = owner.fabricated % 2 ? .45 : -.45;
  const point = megaDrillRoomPoint(owner, pose, x, 0);
  const type = robotTypes[owner.fabricated % robotTypes.length];
  const robot = game.createEnemy(type, point.x, point.z, { team: owner.team, ownerId: owner.id });
  Object.assign(robot, { ownerId: owner.id, fabricatorRoom: roomIndex }); attachMegaDrillOccupant(owner, robot, roomIndex, x, 0);
  game.state.enemies.push(robot);
  owner.fabricated = Math.min(1e9, owner.fabricated + 1);
  if (game.state.survival) game.state.survival.totalSpawned = Math.min(Number.MAX_SAFE_INTEGER, game.state.survival.totalSpawned + 1);
  game.emit('fabricate', owner, { id: owner.id, enemyType: owner.type, count: 1, roomIndex }); return 1;
}

export function spawnMegaDrillDrone(game, owner) {
  if (game.isPractice() || owner.hp <= 0 || owner.dronesSpawned >= 2
    || !pristine(owner, LAYOUT.droneFactoryId) || game.availableActorSlots(owner) < 1) return false;
  const pose = getMegaDrillSegmentPoses(owner.wormDistance)[2];
  const point = megaDrillRoomPoint(owner, pose, (owner.dronesSpawned ? 1 : -1) * (LAYOUT.width / 2 + .9), 0);
  const drone = game.createEnemy('copper-repair-drone', point.x, point.z, { team: owner.team, ownerId: owner.id });
  drone.ownerId = owner.id; game.state.enemies.push(drone); owner.dronesSpawned++;
  if (game.state.survival) { game.state.survival.totalSpawned++; game.state.survival.repairDronesSpawned++; }
  return true;
}

/** Each of four physical reactors removes one quarter of the original health once. */
export function megaDrillReactorDamage(enemy) {
  let damage = 0;
  LAYOUT.reactorIds.forEach((id, index) => {
    const part = enemy.structureState?.[id];
    if (!enemy.reactorsDestroyed[index] && part?.total > 0 && part.remaining === 0) {
      enemy.reactorsDestroyed[index] = true; damage += COPPER_MEGA_DRILL.hp / 4;
    }
  });
  enemy.repairMaxHp = COPPER_MEGA_DRILL.hp * (1 - enemy.reactorsDestroyed.filter(Boolean).length / 4);
  return damage;
}

export function updateMegaDrill(game, enemy, dt, robotTypes) {
  clampPosition(enemy, game.arenaBounds); enemy.impulseX = enemy.impulseZ = 0; enemy.bossClock += dt;
  spawnMegaDrillCrew(game, enemy);
  enemy.phaseTime = Math.max(0, enemy.phaseTime - dt);
  const armed = game.canEnemyDamage(enemy, 'mega-drill'); enemy.drillSpinning = armed;
  if (!armed) { enemy.phase = 'chase'; enemy.phaseTime = 0; enemy.attackName = ''; }
  moveMegaDrill(game, enemy, dt);
  const tip = megaDrillPoint(enemy, { x: 0, y: LAYOUT.drillAxisY, z: LAYOUT.tipZ });
  enemy.targetX = tip.x; enemy.targetZ = tip.z; enemy.warningRadius = 2.7;
  const player = game.state.player;
  const distance = Math.hypot(player.x - tip.x, player.z - tip.z);
  if (armed && enemy.phase === 'windup' && enemy.phaseTime === 0) {
    enemy.phase = 'strike'; enemy.phaseTime = .35;
    const verticalGap = Math.max(0, tip.y - player.elevation - EYE_HEIGHT, player.elevation - tip.y);
    if (Math.hypot(distance, verticalGap) < 2.7) game.hurtPlayer(COPPER_MEGA_DRILL.damage * enemy.damageScale, enemy);
  } else if (enemy.phase === 'strike' && enemy.phaseTime === 0) {
    enemy.phase = 'recover'; enemy.phaseTime = COPPER_MEGA_DRILL.recovery;
  } else if (enemy.phase === 'recover' && enemy.phaseTime === 0) {
    enemy.phase = 'chase'; enemy.attackName = '';
  } else if (armed && enemy.phase === 'chase' && distance < 3.4) {
    enemy.phase = 'windup'; enemy.phaseTime = COPPER_MEGA_DRILL.windup; enemy.attackName = 'drill';
    game.emit('bossattack', enemy, { id: enemy.id, enemyType: enemy.type, attackName: 'drill', targetX: tip.x, targetZ: tip.z, radius: 2.7 });
  }
  for (let room = 0; room < 2; room++) {
    enemy.factoryCooldowns[room] = Math.max(0, enemy.factoryCooldowns[room] - dt);
    if (game.isPractice() || !pristine(enemy, LAYOUT.fabricatorIds[room])) {
      enemy.fabricating[room] = false; enemy.fabricationTime[room] = 0; continue;
    }
    if (enemy.fabricating[room]) {
      enemy.fabricationTime[room] = Math.max(0, enemy.fabricationTime[room] - dt);
      if (enemy.fabricationTime[room] === 0) {
        enemy.fabricating[room] = false; fabricateMegaDrillRobot(game, enemy, room, robotTypes);
      }
    } else if (enemy.factoryCooldowns[room] === 0 && game.availableActorSlots(enemy) > 0) {
      enemy.fabricating[room] = true; enemy.fabricationTime[room] = 1.5; enemy.factoryCooldowns[room] = 10;
    }
  }
  enemy.droneCooldown = Math.max(0, enemy.droneCooldown - dt);
  if (!game.isPractice() && enemy.droneCooldown === 0) { spawnMegaDrillDrone(game, enemy); enemy.droneCooldown = 8; }
}
