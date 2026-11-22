const TAU = Math.PI * 2;
const NORMAL_PERIOD = 4.4;
const GIANT_PERIOD = 6.4;
const states = new WeakMap();
const smoothstep = value => value * value * (3 - 2 * value);

/** @typedef {{period:number,cycle:number,contraction:number,widthScale:number,
 * heightScale:number,armTime:number,armPhase:number,armAmplitude:number}} LanternMotion
 */

/** One simulation-clock squeeze, elastic refill and relaxed coast. The timing
 * is an artistic adaptation of medusan swimming, with slower giant pulses.
 * Bell and arm extents stay within the established collision envelope.
 * Cached storage is reused by rendering and every authoritative stinger point.
 * @param {{motionTime?:number,phase?:number,giant?:boolean}} fish
 * @param {boolean} [reducedMotion] Fixed relaxed pose with seeded static arms.
 * @returns {LanternMotion}
 */
export function getLanternMotion(fish, reducedMotion = false) {
  if (!fish || typeof fish !== 'object') throw new TypeError('Lantern motion needs an animal descriptor.');
  const time = reducedMotion || !Number.isFinite(fish.motionTime) ? 0 : fish.motionTime;
  const phase = Number.isFinite(fish.phase) ? fish.phase : 0;
  const giant = Boolean(fish.giant);
  let cached = states.get(fish);
  if (!cached) {
    cached = { time: NaN, phase: NaN, giant: false, reducedMotion: false,
      value: { period: NORMAL_PERIOD, cycle: 0, contraction: 0, widthScale: 1.06,
        heightScale: .67, armTime: 0, armPhase: 0, armAmplitude: 1 } };
    states.set(fish, cached);
  }
  if (cached.time === time && cached.phase === phase && cached.giant === giant
    && cached.reducedMotion === reducedMotion) return cached.value;
  const motion = cached.value;
  if (cached.phase !== phase || cached.giant !== giant)
    motion.period = (giant ? GIANT_PERIOD : NORMAL_PERIOD) * (1 + .08 * Math.sin(phase));
  const cycle = reducedMotion ? 0 : ((time / motion.period + phase / TAU) % 1 + 1) % 1;
  // Approximately one fifth of the cycle contracts, followed by a slower
  // refill. The relaxed half-cycle keeps drifting without another squeeze.
  const contraction = reducedMotion ? 0 : cycle < .2 ? smoothstep(cycle / .2)
    : cycle < .5 ? 1 - smoothstep((cycle - .2) / .3) : 0;
  motion.cycle = cycle;
  motion.contraction = contraction;
  motion.widthScale = 1.06 - .12 * contraction;
  motion.heightScale = .67 + .10 * contraction;
  motion.armTime = time * NORMAL_PERIOD / motion.period;
  motion.armPhase = phase;
  motion.armAmplitude = 1 - .3 * contraction;
  cached.time = time; cached.phase = phase; cached.giant = giant; cached.reducedMotion = reducedMotion;
  return motion;
}
