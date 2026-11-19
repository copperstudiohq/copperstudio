import { ARENA_BOUNDS } from './arena-config.js';

/** Axolotl Major's companion is a support guest, never a wave or Practice enemy. */
export const OCTO_NOSE = Object.freeze({ id: 'octo-nose', name: 'Octo Nose', warOnly: true,
  description: 'A hooded companion from Axolotl Major who fights with his builder hammer and patches allies. 10,000 health. Each pixel takes ten hits.',
  attackHelp: 'He follows an allied Player first. Dodge his warned hammer swing or sever the hammer. He heals allies within seven metres at 3 health per second after eight seconds without damage.',
  hp: 10000, radius: .8, speed: 6, range: 2.8, windup: .8, recovery: 1.1, damage: 18, score: 0 });

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const healthLimit = actor => actor.repairMaxHp ?? actor.maxHp;

/** Source companion support, with the requested physical builder-hammer attack. */
export function updateOctoNose(game, octo, dt) {
  octo.bossClock += dt; octo.octoHelping = false; octo.repairTargetId = null;
  octo.phaseTime = Math.max(0, octo.phaseTime - dt);
  const allies = game.state.enemies.filter(actor => actor !== octo && actor.hp > 0 && game.areAllies(octo, actor));
  allies.sort((a, b) => {
    const injuredA = a.hp < healthLimit(a), injuredB = b.hp < healthLimit(b);
    return Number(Boolean(b.playerControlled)) - Number(Boolean(a.playerControlled))
      || Number(injuredB) - Number(injuredA) || distance(octo, a) - distance(octo, b) || a.id - b.id;
  });
  const ally = allies[0]; octo.repairTargetId = ally?.id ?? null;
  const handsGone = [0, 1].every(index => {
    const hand = octo.structureState?.[`octo-hand-${index}`];
    return hand?.total > 0 && hand.remaining === 0;
  });
  if (ally && !handsGone && !['windup', 'strike'].includes(octo.phase) && distance(octo, ally) < 7 && ally.hp < healthLimit(ally)
    && game.state.elapsed - (ally.warLastDamagedAt ?? 0) >= 8) {
    ally.hp = Math.min(healthLimit(ally), ally.hp + dt * 3);
    octo.octoHelping = true;
  }
  const foe = game.activeTarget;
  const point = foe ? game.targetPoint(octo, foe) : null;
  const reach = point ? distance(octo, point) : Infinity;
  const rightHand = octo.structureState?.['octo-hand-1'];
  const armed = rightHand?.remaining !== 0 && game.canEnemyDamage(octo, 'octo-hammer');
  if (!armed && octo.attackName === 'hammer') { octo.phase = 'chase'; octo.phaseTime = 0; octo.attackName = ''; }
  if (octo.phase === 'windup') {
    if (octo.phaseTime === 0) {
      octo.phase = 'strike'; octo.phaseTime = .2;
      if (foe && armed && reach <= OCTO_NOSE.range + .6
        && Math.cos(Math.atan2(point.x - octo.x, point.z - octo.z) - octo.angle) > .02) {
        game.hurtPlayer(OCTO_NOSE.damage * octo.damageScale, octo);
      }
    }
    return;
  }
  if (octo.phase === 'strike') {
    if (octo.phaseTime === 0) { octo.phase = 'recover'; octo.phaseTime = OCTO_NOSE.recovery; }
    return;
  }
  if (octo.phase === 'recover') {
    if (octo.phaseTime === 0) { octo.phase = 'chase'; octo.attackName = ''; }
    return;
  }
  if (foe && armed && reach <= OCTO_NOSE.range) {
    octo.angle = Math.atan2(point.x - octo.x, point.z - octo.z);
    octo.phase = 'windup'; octo.phaseTime = OCTO_NOSE.windup; octo.attackName = 'hammer'; octo.attackIndex++;
    octo.octoHelping = false; return;
  }
  const follow = ally ?? (armed ? point : null); if (!follow) return;
  const dx = follow.x - octo.x, dz = follow.z - octo.z, d = Math.hypot(dx, dz);
  octo.angle = Math.atan2(dx, dz);
  if (d > 2.6) {
    const bounds = game.arenaBounds ?? ARENA_BOUNDS;
    const speed = (d > 8 ? 9 : 6) * (octo.crippled ? .7 : 1) * octo.speedScale;
    const step = Math.min(d - 2.6, speed * dt);
    octo.x = clamp(octo.x + dx / d * step, -bounds.x + .8, bounds.x - .8);
    octo.z = clamp(octo.z + dz / d * step, -bounds.z + .8, bounds.z - .8);
  }
}
