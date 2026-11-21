import { getJuvenileSquidJetBeat } from './juvenile-squid-swim.js';

/** Normalized rear siphon anchors shared by render meshes and solid contact. */
export const SQUID_SIPHON_ANCHORS = Object.freeze([
  Object.freeze([-.34, -.15, -1.01]), Object.freeze([.34, -.15, -1.01]),
]);

/** Read only the simulation clock; redraws and pause cannot advance a jet or fin. */
export function getSquidPropulsionState(squid) {
  const time = squid?.designVersion === 2 ? squid.propulsionTime ?? 0 : squid?.motion?.time ?? 0;
  const moving = Boolean(squid && Math.hypot(squid.x - squid.px, squid.y - squid.py, squid.z - squid.pz) > 1e-5);
  const beat = getJuvenileSquidJetBeat(time, squid?.seed ?? 0);
  const burst = (squid?.motion?.escapeLeft ?? 0) > 0 || (time + (squid?.seed ?? 0) % 7) % 8 < 1.1;
  const pulse = squid?.designVersion === 2 ? squid.propulsionPulse ?? 0
    : moving ? burst ? .55 + .45 * beat : .12 + .48 * beat : 0;
  const breath = time <= 0 ? 0 : moving ? 1 - pulse
    : .5 + .5 * Math.sin(time * Math.PI * 2 * .35 + (squid?.seed ?? 0));
  return { time, moving, pulse, breath, underwater: Boolean(squid && squid.z + squid.headRadius < -3) };
}
