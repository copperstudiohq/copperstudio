/** One complete, gentle jet/recovery cycle every 1.25 simulation seconds. */
export const JUVENILE_SQUID_JET_HZ = .8;

/** Shared juvenile body-thrust, siphon and arm beat. Squaring this half-rate
 * sine gives a smooth 0..1 pulse at 0.8 Hz, rather than doubling that rate.
 * @param {number} time Simulation seconds. @param {number} [seed] Phase radians.
 * @returns {number}
 */
export function getJuvenileSquidJetBeat(time, seed = 0) {
  if (!Number.isFinite(time) || !Number.isFinite(seed)) return 0;
  return Math.sin(time * Math.PI * JUVENILE_SQUID_JET_HZ + seed) ** 2;
}
