import { DRILL_MINE_PIT } from './drill-mine-layout.js';

export const COPPER_SPIDER_DRONE = Object.freeze({ id: 'copper-spider-drone', name: 'Copper Spider Drone',
  exclusiveArena: 'drill-mine', unlockWave: 4, hp: 2800, radius: 3.6, speed: 3.2,
  range: 5.6, windup: 1.1, recovery: 1.5, damage: 29, score: 4200,
  attacks: Object.freeze(['sweep', 'dive']),
  description: 'A hovering, one-eyed copper spider with eight independently severable drill legs. Deploys up to two repair drones at a time.',
  attackHelp: 'Sidestep the warned drill sweep or dive. Cutting away a drill disables that leg’s attacks.' });
export const SPIDER_DRILL_IDS = Object.freeze(Array.from({ length: 8 }, (_, index) => `spider-drill-${index}`));
export const SPIDER_DRILL_ANGLES = Object.freeze(Array.from({ length: 8 }, (_, index) => Math.PI / 8 + index * Math.PI / 4));
export const SPIDER_DRILL_TIP_RADIUS = 4.43, SPIDER_DRILL_TIP_Y = .527;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

export function initializeSpiderDrone(enemy) {
  Object.assign(enemy, { elevation: 1, activeDrill: 0, sweepProgress: 0, diveProgress: 0,
    strikeHit: false, attackContact: null });
}

export function spiderDrillPoint(enemy, index = enemy.activeDrill) {
  const sweep = index === enemy.activeDrill && enemy.attackName === 'sweep' && enemy.phase === 'strike' ? (enemy.sweepProgress - .5) * 1.1 : 0;
  const angle = enemy.angle + SPIDER_DRILL_ANGLES[index] + sweep;
  return { x: enemy.x + Math.sin(angle) * SPIDER_DRILL_TIP_RADIUS, z: enemy.z + Math.cos(angle) * SPIDER_DRILL_TIP_RADIUS,
    y: finite(enemy.elevation) + SPIDER_DRILL_TIP_Y };
}

function constrain(enemy) {
  const clearance = 4.8;
  enemy.x = clamp(enemy.x, -DRILL_MINE_PIT.halfWidth + clearance, DRILL_MINE_PIT.halfWidth - clearance);
  enemy.z = clamp(enemy.z, -DRILL_MINE_PIT.halfDepth + clearance, DRILL_MINE_PIT.halfDepth - clearance);
}

/** Hovering keeps lost legs off the floor; each physical drill gates its own contact. */
export function updateSpiderDrone(game, enemy, dt) {
  const stats = COPPER_SPIDER_DRONE, player = game.state.player;
  enemy.bossClock += dt; enemy.phaseTime = Math.max(0, enemy.phaseTime - dt);
  const active = SPIDER_DRILL_IDS.map((id, index) => game.canEnemyDamage(enemy, id) ? index : -1).filter(index => index >= 0);
  const baseline = 1 + Math.sin(enemy.bossClock * 1.6) * .12;
  if (!active.length) {
    enemy.phase = 'recover'; enemy.phaseTime = .5; enemy.attackName = ''; enemy.elevation = baseline; return;
  }
  if (enemy.phase === 'windup') {
    enemy.elevation = enemy.attackName === 'dive' ? 1 + (1 - enemy.phaseTime / stats.windup) * 1.2 : baseline;
    if (enemy.phaseTime === 0) {
      if (!game.canEnemyDamage(enemy, SPIDER_DRILL_IDS[enemy.activeDrill])) {
        enemy.phase = 'recover'; enemy.phaseTime = stats.recovery; return;
      }
      enemy.phase = 'strike'; enemy.phaseTime = .6; enemy.strikeHit = false;
      enemy.strikeStartX = enemy.x; enemy.strikeStartZ = enemy.z;
      const angle = enemy.angle + SPIDER_DRILL_ANGLES[enemy.activeDrill];
      const dx = enemy.targetX - Math.sin(angle) * SPIDER_DRILL_TIP_RADIUS - enemy.x;
      const dz = enemy.targetZ - Math.cos(angle) * SPIDER_DRILL_TIP_RADIUS - enemy.z;
      const distance = Math.max(.001, Math.hypot(dx, dz)), scale = Math.min(1, 4 / distance);
      enemy.diveX = enemy.x + dx * scale; enemy.diveZ = enemy.z + dz * scale;
    }
    return;
  }
  if (enemy.phase === 'strike') {
    const progress = 1 - enemy.phaseTime / .6;
    enemy.sweepProgress = progress; enemy.diveProgress = progress;
    if (enemy.attackName === 'dive') {
      enemy.x = enemy.strikeStartX + (enemy.diveX - enemy.strikeStartX) * progress;
      enemy.z = enemy.strikeStartZ + (enemy.diveZ - enemy.strikeStartZ) * progress;
      enemy.elevation = 2.2 - 1.5 * Math.sin(progress * Math.PI / 2); constrain(enemy);
    } else enemy.elevation = baseline;
    const point = spiderDrillPoint(enemy), height = 1.3 + finite(player.elevation);
    if (!enemy.strikeHit && game.canEnemyDamage(enemy, SPIDER_DRILL_IDS[enemy.activeDrill])
      && Math.hypot(player.x - point.x, player.z - point.z) < 1.45 && Math.abs(height - point.y) < 1.6) {
      enemy.attackContact = point;
      enemy.strikeHit = game.hurtPlayer(stats.damage * finite(enemy.damageScale, 1), enemy);
    }
    if (enemy.phaseTime === 0) { enemy.phase = 'recover'; enemy.phaseTime = stats.recovery; }
    return;
  }
  enemy.elevation = baseline;
  if (enemy.phase === 'recover') { if (enemy.phaseTime === 0) enemy.phase = 'chase'; return; }
  enemy.activeDrill = active[enemy.attackIndex % active.length];
  const dx = player.x - enemy.x, dz = player.z - enemy.z, distance = Math.max(.001, Math.hypot(dx, dz));
  const targetAngle = Math.atan2(dx, dz) - SPIDER_DRILL_ANGLES[enemy.activeDrill];
  enemy.angle += clamp(wrap(targetAngle - enemy.angle), -1.5 * dt, 1.5 * dt);
  if (distance > stats.range) {
    const travel = Math.min(distance - stats.range, stats.speed * finite(enemy.speedScale, 1) * (enemy.crippled ? .7 : 1) * dt);
    enemy.x += dx / distance * travel; enemy.z += dz / distance * travel; constrain(enemy); return;
  }
  if (Math.abs(wrap(targetAngle - enemy.angle)) > .2) return;
  enemy.attackName = stats.attacks[enemy.attackIndex++ % stats.attacks.length];
  enemy.targetX = player.x; enemy.targetZ = player.z;
  enemy.sweepProgress = 0; enemy.diveProgress = 0; enemy.attackContact = null;
  enemy.phase = 'windup'; enemy.phaseTime = stats.windup;
  game.emit('bossattack', enemy, { id: enemy.id, enemyType: enemy.type, attackName: enemy.attackName });
}
