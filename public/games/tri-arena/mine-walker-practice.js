import { MINE_WALKER_LAYOUT } from './mine-walker-layout.js';
import { mineWalkerPoint, detachMineWalkerClimb } from './mine-walker-collision.js';

/** Position a fresh fighter facing the live Walker's ladder without attaching or changing its combat state. */
export function positionMineWalkerLadderPractice(game) {
  const state = game?.state, player = state?.player;
  if (!player || typeof player !== 'object' || Array.isArray(player) || !Array.isArray(state.enemies)) return null;
  const owner = state.enemies.find(actor => actor?.type === MINE_WALKER_LAYOUT.type && Number.isFinite(actor.hp) && actor.hp > 0
    && [actor.x, actor.z, actor.angle ?? 0].every(Number.isFinite));
  if (!owner) return null;
  const point = mineWalkerPoint(owner, { x: 0, z: MINE_WALKER_LAYOUT.ladder.climbZ - .65 });
  detachMineWalkerClimb(player);
  Object.assign(player, { x: point.x, z: point.z, angle: owner.angle ?? 0,
    elevation: 0, jumpVelocity: 0, dashTime: 0, groundHeight: 0, groundActorId: null, blocking: false });
  for (const key of ['vx', 'vz', 'impulseX', 'impulseZ']) if (Object.hasOwn(player, key)) player[key] = 0;
  const direction = { x: Math.sin(player.angle), z: Math.cos(player.angle) };
  game.lastDirection = { ...direction }; game.dashDirection = { ...direction };
  game.previousPlayerPosition = { x: player.x, z: player.z };
  return owner;
}
