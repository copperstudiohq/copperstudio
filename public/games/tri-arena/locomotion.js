/** Per-actor animation clock and distance, driven by movement in world metres. */
export function createLocomotion(x = 0, z = 0, offset = 0) {
  return { x, z, time: offset, distance: 0, speed: 0, posed: false };
}

/** Pause freezes the gait; teleports resynchronise position without inventing strides. */
export function advanceLocomotion(motion, position, delta, { active = true, previewSpeed = 0 } = {}) {
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(0.05, delta)) : 0;
  const x = Number.isFinite(position.x) ? position.x : motion.x;
  const z = Number.isFinite(position.z) ? position.z : motion.z;
  const travelled = Math.hypot(x - motion.x, z - motion.z);
  motion.x = x;
  motion.z = z;
  if (!active || dt === 0) return motion;
  motion.time += dt;
  const preview = Number.isFinite(previewSpeed) ? Math.max(0, previewSpeed) : 0;
  // Even the fastest charging boss moves less than this during a normal frame.
  const distance = preview > 0 ? preview * dt : travelled <= 32 * dt + 0.15 ? travelled : 0;
  const speed = distance / dt;
  motion.speed = speed < 0.01 ? 0 : motion.speed + (speed - motion.speed) * (1 - Math.exp(-18 * dt));
  motion.distance += distance;
  return motion;
}
