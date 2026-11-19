import { DRILL_MINE_PIT } from './drill-mine-layout.js';
import { MINE_WALKER_GUN_MOUNTS as GUN_MOUNTS,
  MINE_WALKER_DRILL_MOUNTS as DRILL_MOUNTS, MINE_WALKER_FOOTPRINT_RADIUS, mineWalkerDrillTip,
  mineWalkerGunMuzzle as mineWalkerGunPoint,
  mineWalkerHoverHeight, initializeMineWalkerFeet, advanceMineWalkerFeet } from './mine-walker-layout.js';
export { mineWalkerDrillOffset, mineWalkerGunMuzzle as mineWalkerGunPoint } from './mine-walker-layout.js';
import { insideMineWalkerRoom, captureMineWalkerPassenger, carryMineWalkerPassenger } from './mine-walker-collision.js';
import { spawnMineWalkerCrew, captureMineWalkerOccupants, carryMineWalkerOccupants } from './mine-walker-occupants.js';

export const COPPER_MINE_WALKER = Object.freeze({ id: 'copper-mine-walker', name: 'Copper Mine Walker',
  exclusiveArena: 'drill-mine', unlockWave: 6, hp: 20000, radius: 3.8, speed: 1.8,
  range: 24, windup: 1.2, recovery: 2, damage: 24, score: 8500,
  attacks: Object.freeze(['machine-guns', 'drill']),
  description: 'A towering copper spider machine with eight articulated drill legs, 20,000 health, six-hit armor, six eyes, six machine guns and five live miner crew.',
  attackHelp: 'Leave its marked firing line. Cut individual weapons, or climb the rear ladder to confront the crew and eyes.' });
export const WALKER_GUN_IDS = Object.freeze(Array.from({ length: 6 }, (_, index) => `walker-machine-gun-${index}`));
export const WALKER_DRILL_IDS = Object.freeze(DRILL_MOUNTS.map(mount => mount.id));
export const WALKER_MAX_DROP = 8.8;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
// War AI uses a target proxy; the controlled fighter remains the physical passenger.
const passengerFor = game => game.isWarPlayerActive?.() ? game.warPlayer : game.state.player;

export function initializeMineWalker(enemy) {
  Object.assign(enemy, { angle: 0, walkerCrewSpawned: Array(5).fill(false), walkerCrewIds: Array(5).fill(null),
    walkerFeet: [], firingGuns: Array(6).fill(false), activeDrill: 0, drillProgress: 0,
    burstTime: 0, shotClock: 0, attackContact: null, elevation: mineWalkerHoverHeight(0),
    bodyDrop: 0, bodyDropTarget: 0, dropVelocity: 0, supportsLost: 0 });
  enemy.x = clamp(enemy.x, -DRILL_MINE_PIT.halfWidth + MINE_WALKER_FOOTPRINT_RADIUS, DRILL_MINE_PIT.halfWidth - MINE_WALKER_FOOTPRINT_RADIUS);
  enemy.z = clamp(enemy.z, -DRILL_MINE_PIT.halfDepth + MINE_WALKER_FOOTPRINT_RADIUS, DRILL_MINE_PIT.halfDepth - MINE_WALKER_FOOTPRINT_RADIUS);
  initializeMineWalkerFeet(enemy);
}

export function mineWalkerDrillPoint(enemy, index = enemy.activeDrill) {
  return mineWalkerDrillTip(enemy, index);
}

function updateWalkerHeight(game, enemy, dt) {
  const player = passengerFor(game), capture = captureMineWalkerPassenger(enemy, player);
  const occupants = captureMineWalkerOccupants(game, enemy);
  const lost = Array.from({ length: 8 }, (_, index) => enemy.structureState?.[`walker-leg-${index}`]?.remaining === 0).filter(Boolean).length;
  enemy.supportsLost = Math.max(enemy.supportsLost, lost, finite(enemy.legsLost));
  enemy.bodyDropTarget = Math.max(enemy.bodyDropTarget, WALKER_MAX_DROP * (enemy.supportsLost / 8) ** 2);
  if (enemy.bodyDrop < enemy.bodyDropTarget) {
    enemy.bodyDrop = Math.min(enemy.bodyDropTarget, enemy.bodyDrop + enemy.dropVelocity * dt + 6 * dt ** 2);
    enemy.dropVelocity = enemy.bodyDrop === enemy.bodyDropTarget ? 0 : Math.min(6, enemy.dropVelocity + 12 * dt);
  }
  enemy.elevation = mineWalkerHoverHeight(enemy.bossClock);
  // One carry applies the combined hover and support-loss height change.
  carryMineWalkerPassenger(enemy, player, capture); carryMineWalkerOccupants(enemy, occupants);
}

function moveWalker(game, enemy, dt, desired, speed) {
  const actor = passengerFor(game), passenger = captureMineWalkerPassenger(enemy, actor);
  const occupants = captureMineWalkerOccupants(game, enemy), before = { x: actor.x, z: actor.z };
  const turn = clamp(wrap(desired - enemy.angle), -.25 * dt, .25 * dt);
  // Reserve the complete swept drill-leg footprint at every heading.
  const margin = MINE_WALKER_FOOTPRINT_RADIUS;
  enemy.angle += turn;
  enemy.x = clamp(enemy.x + Math.sin(enemy.angle) * speed * dt, -DRILL_MINE_PIT.halfWidth + margin, DRILL_MINE_PIT.halfWidth - margin);
  enemy.z = clamp(enemy.z + Math.cos(enemy.angle) * speed * dt, -DRILL_MINE_PIT.halfDepth + margin, DRILL_MINE_PIT.halfDepth - margin);
  carryMineWalkerPassenger(enemy, actor, passenger); carryMineWalkerOccupants(enemy, occupants);
  if (passenger && game.previousPlayerPosition) {
    game.previousPlayerPosition.x += actor.x - before.x; game.previousPlayerPosition.z += actor.z - before.z;
  }
}

function fireBurst(game, enemy) {
  enemy.firingGuns.fill(false);
  for (let index = 0; index < WALKER_GUN_IDS.length; index++) {
    if (!game.canEnemyDamage(enemy, WALKER_GUN_IDS[index])) continue;
    const point = mineWalkerGunPoint(enemy, index);
    const dx = enemy.targetX - point.x, dz = enemy.targetZ - point.z, distance = Math.max(1, Math.hypot(dx, dz));
    game.fireProjectiles(enemy, 1, { ...point, kind: 'copper', weaponId: WALKER_GUN_IDS[index], angle: Math.atan2(dx, dz),
      speed: 7, vy: clamp((enemy.targetY - point.y) * 7 / distance, -10, 10), arming: .2, life: 5, damage: 14 });
    enemy.firingGuns[index] = true;
  }
}

/** Existing enemy combat with a real, boardable platform and independently cut weapons. */
export function updateMineWalker(game, enemy, dt) {
  enemy.bossClock += dt;
  updateWalkerHeight(game, enemy, dt);
  spawnMineWalkerCrew(game, enemy);
  enemy.phaseTime = Math.max(0, enemy.phaseTime - dt); enemy.firingGuns.fill(false);
  const player = game.state.player, guns = WALKER_GUN_IDS.some(id => game.canEnemyDamage(enemy, id));
  const drills = WALKER_DRILL_IDS.map((id, index) => game.canEnemyDamage(enemy, id) ? index : -1).filter(index => index >= 0);
  const aboard = insideMineWalkerRoom(enemy, player);
  if (aboard || (!guns && !drills.length)) {
    enemy.phase = 'chase'; enemy.attackName = ''; enemy.phaseTime = 0;
    advanceMineWalkerFeet(enemy, dt, { moving: false }); return;
  }
  if (enemy.phase === 'windup') {
    if (enemy.phaseTime === 0) {
      enemy.phase = 'strike'; enemy.phaseTime = enemy.attackName === 'drill' ? .7 : 1.2;
      enemy.burstTime = enemy.phaseTime; enemy.shotClock = 0; enemy.strikeHit = false;
    }
    advanceMineWalkerFeet(enemy, dt, { moving: false }); return;
  }
  if (enemy.phase === 'strike') {
    if (enemy.attackName === 'machine-guns') {
      enemy.shotClock -= dt;
      if (enemy.shotClock <= 0) { fireBurst(game, enemy); enemy.shotClock += .3; }
    } else {
      enemy.drillProgress = 1 - enemy.phaseTime / .7;
      const point = mineWalkerDrillPoint(enemy);
      if (!enemy.strikeHit && game.canEnemyDamage(enemy, WALKER_DRILL_IDS[enemy.activeDrill])
        && Math.hypot(player.x - point.x, player.z - point.z) < 1.8 && Math.abs(1.3 + finite(player.elevation) - point.y) < 1.5) {
        enemy.attackContact = point; enemy.strikeHit = game.hurtPlayer(COPPER_MINE_WALKER.damage * finite(enemy.damageScale, 1), enemy);
      }
    }
    if (enemy.phaseTime === 0) { enemy.phase = 'recover'; enemy.phaseTime = COPPER_MINE_WALKER.recovery; }
    advanceMineWalkerFeet(enemy, dt, { moving: false }); return;
  }
  if (enemy.phase === 'recover') {
    if (enemy.phaseTime === 0) enemy.phase = 'chase';
    advanceMineWalkerFeet(enemy, dt, { moving: false }); return;
  }
  const dx = player.x - enemy.x, dz = player.z - enemy.z, distance = Math.hypot(dx, dz);
  const nearestDrill = drills.map(index => ({ index, point: mineWalkerDrillPoint(enemy, index) }))
    .sort((a, b) => Math.hypot(a.point.x - player.x, a.point.z - player.z) - Math.hypot(b.point.x - player.x, b.point.z - player.z))[0];
  const closeDrill = nearestDrill && Math.hypot(nearestDrill.point.x - player.x, nearestDrill.point.z - player.z) < 3;
  const standoff = Math.hypot(DRILL_MOUNTS[0].tip.x, DRILL_MOUNTS[0].tip.z) + 1.5;
  if (!closeDrill && (distance > standoff || !guns)) {
    const liveFeet = enemy.walkerFeet.filter((_, index) => enemy.structureState?.[`walker-leg-${index}`]?.remaining !== 0).length;
    let speed = COPPER_MINE_WALKER.speed * finite(enemy.speedScale, 1) * liveFeet / 8;
    let desired = Math.atan2(dx, dz);
    if (!guns && distance < standoff - 3) desired += Math.PI;
    else if (!guns && distance <= standoff && nearestDrill) {
      // With no guns, align a remaining radial drill instead of chasing into the hollow center.
      desired -= DRILL_MOUNTS[nearestDrill.index].angle; speed = 0;
    }
    moveWalker(game, enemy, dt, desired, speed);
    advanceMineWalkerFeet(enemy, dt); return;
  }
  enemy.attackName = closeDrill ? 'drill' : 'machine-guns'; enemy.activeDrill = nearestDrill?.index ?? 0;
  enemy.drillProgress = 0; enemy.attackContact = null;
  enemy.targetX = player.x; enemy.targetZ = player.z; enemy.targetY = 1.3 + finite(player.elevation);
  enemy.phase = 'windup'; enemy.phaseTime = COPPER_MINE_WALKER.windup; enemy.attackIndex++;
  game.emit('bossattack', enemy, { id: enemy.id, enemyType: enemy.type, attackName: enemy.attackName });
  advanceMineWalkerFeet(enemy, dt, { moving: false });
}
