const JUMP_SPEED = 7.5;
const GRAVITY = 18;
const MAX_STEP = .05;

function normalize(player) {
  if (!player || typeof player !== 'object') throw new TypeError('Player jump requires a player object.');
  player.elevation = Number.isFinite(player.elevation) ? Math.max(0, player.elevation) : 0;
  player.jumpVelocity = Number.isFinite(player.jumpVelocity) ? player.jumpVelocity : 0;
}

/** Launch once from the ground; movement, stamina and pause rules belong to the caller. */
export function startPlayerJump(player) {
  normalize(player);
  if (player.elevation > 0 || player.jumpVelocity > 0) return false;
  player.jumpVelocity = JUMP_SPEED;
  return true;
}

/** Advance a bounded ballistic step and settle exactly on the floor. */
export function updatePlayerJump(player, dt) {
  normalize(player);
  const step = Number.isFinite(dt) ? Math.min(MAX_STEP, Math.max(0, dt)) : 0;
  if (step === 0) return;
  if (player.elevation === 0 && player.jumpVelocity <= 0) {
    player.jumpVelocity = 0;
    return;
  }
  player.elevation += player.jumpVelocity * step - .5 * GRAVITY * step * step;
  player.jumpVelocity -= GRAVITY * step;
  if (player.elevation <= 0) {
    player.elevation = 0;
    player.jumpVelocity = 0;
  }
}
