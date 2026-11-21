import { getJuvenileSquidJetBeat } from './juvenile-squid-swim.js';

const TAU = Math.PI * 2;
const states = new WeakMap();
const ADULT_ANGLES = [45, 75, 105, 135, 225, 255, 285, 315].map(degrees => degrees * Math.PI / 180);
const JUVENILE_ANGLES = Array.from({ length: 8 }, (_, index) => index * TAU / 8);

/** @typedef {{strength:number,dx:number,dy:number,dz:number,recovery:number,radial:Float64Array}} AscentStroke */

function stateFor(squid) {
  let state = states.get(squid);
  if (!state) {
    state = { strength: 0, dx: 0, dy: 0, dz: 1, recovery: 0, radial: new Float64Array(24) };
    states.set(squid, state);
  }
  return state;
}

/** Prepare one shared jet stroke, using world velocity (Z is vertical). The
 * eight socket directions follow the actual body frame, then fan across the
 * plane perpendicular to travel. Cached storage is reused every substep.
 * @param {object} squid @param {number} vx @param {number} vy @param {number} vz
 * @param {number} time @param {boolean} alert @param {boolean} [adult]
 * @returns {AscentStroke}
 */
export function prepareSquidAscentStroke(squid, vx, vy, vz, time, alert, adult = false) {
  const state = stateFor(squid);
  const speed = Math.hypot(vx, vy, vz);
  const rise = Number.isFinite(speed) && speed > 1e-8 ? Math.max(0, Math.min(1, (vz / speed - .1) / .7)) : 0;
  state.strength = rise * rise * (3 - 2 * rise) * Math.min(1, speed / 12);
  if (!(state.strength > 0) || !Number.isFinite(time)) { state.strength = 0; return state; }
  state.dx = vx / speed; state.dy = vy / speed; state.dz = vz / speed;
  // Both phases match their existing sin² jet pulse: closed on the power
  // stroke, opening during recovery. An unnoticed animal has a smaller fan.
  const phase = adult ? time * TAU * 2 * (alert ? 1 : .3) : time * TAU * 2.6 + (squid.seed ?? 0) * 2;
  state.recovery = (.5 + .5 * Math.cos(phase)) * (alert ? 1 : .4);
  return prepareRadialFrame(squid, state, adult, false);
}

/** Pulse juvenile arms into the wake in every swimming direction, using the
 * same gentle beat as body thrust and visible rear jets. Idle contacts cannot
 * produce full strokes. The existing curve solver consumes this cached frame.
 * @param {object} squid @param {number} vx @param {number} vy @param {number} vz
 * @param {number} time @param {boolean} alert @returns {AscentStroke}
 */
export function prepareJuvenileSquidStroke(squid, vx, vy, vz, time, alert) {
  const state = stateFor(squid), speed = Math.hypot(vx, vy, vz);
  state.strength = Number.isFinite(speed) ? Math.min(1, speed / 12) : 0;
  if (!(state.strength > 0) || !Number.isFinite(time)) { state.strength = 0; return state; }
  state.dx = vx / speed; state.dy = vy / speed; state.dz = vz / speed;
  state.recovery = (1 - getJuvenileSquidJetBeat(time, squid.seed ?? 0)) * (alert ? 1 : .75);
  return prepareRadialFrame(squid, state, false, true);
}

function prepareRadialFrame(squid, state, adult, allDirections) {
  const q = squid.orientation;
  const half = (Math.PI / 2 - (Number.isFinite(squid.heading) ? squid.heading : 0)) / 2;
  let qx = q?.x ?? NaN, qy = q?.y ?? NaN, qz = q?.z ?? NaN, qw = q?.w ?? NaN;
  const norm = Math.hypot(qx, qy, qz, qw);
  if (norm > 1e-8 && Number.isFinite(norm)) { qx /= norm; qy /= norm; qz /= norm; qw /= norm; }
  else { qx = qz = 0; qy = Math.sin(half); qw = Math.cos(half); }
  const angles = adult ? ADULT_ANGLES : JUVENILE_ANGLES;
  for (let arm = 0; arm < 8; arm++) {
    const x = -Math.sin(angles[arm]), z = Math.cos(angles[arm]);
    const tx = 2 * qy * z, ty = 2 * (qz * x - qx * z), tz = -2 * qy * x;
    let rx = x + qw * tx + qy * tz - qz * ty;
    let ry = z + qw * tz + qx * ty - qy * tx;
    let rz = qw * ty + qz * tx - qx * tz;
    const along = rx * state.dx + ry * state.dy + rz * state.dz;
    rx -= along * state.dx; ry -= along * state.dy; rz -= along * state.dz;
    let radialLength = Math.hypot(rx, ry, rz);
    if (radialLength < 1e-6) {
      if (allDirections) {
        // A socket can point along travel during a turn. Its body-local ring
        // tangent is orthogonal, so it supplies a finite projected basis even
        // for perfectly horizontal swimming (where world dz is zero).
        const tangentX = z, tangentZ = -x;
        const ttx = 2 * qy * tangentZ, tty = 2 * (qz * tangentX - qx * tangentZ), ttz = -2 * qy * tangentX;
        rx = tangentX + qw * ttx + qy * ttz - qz * tty;
        ry = tangentZ + qw * ttz + qx * tty - qy * ttx;
        rz = qw * tty + qz * ttx - qx * ttz;
        const tangentAlong = rx * state.dx + ry * state.dy + rz * state.dz;
        rx -= tangentAlong * state.dx; ry -= tangentAlong * state.dy; rz -= tangentAlong * state.dz;
      } else {
        // Preserve the archived ascent-only frame, including adult behavior.
        rx = x; ry = z; rz = -(x * state.dx + z * state.dy) / state.dz;
      }
      radialLength = Math.hypot(rx, ry, rz);
    }
    const offset = arm * 3;
    state.radial[offset] = rx / radialLength;
    state.radial[offset + 1] = ry / radialLength;
    state.radial[offset + 2] = rz / radialLength;
  }
  return state;
}

/** Blend a free physical goal into a continuous, length-preserving curved
 * arm: the shoulder clears the mantle, the recovering tip opens, and the
 * power stroke gathers below the direction of ascent. No renderer offsets,
 * forces on the body, or changes to anchored/grasping arms are introduced.
 * @param {{x:number,y:number,z:number}} point Existing solver target, mutated.
 * @param {{x:number,y:number,z:number}} root Socket fixed by the body solver.
 * @param {number} arm @param {number} joint @param {number} segments
 * @param {number} length @param {AscentStroke|null} state
 */
export function applySquidAscentStroke(point, root, arm, joint, segments, length, state) {
  if (!state?.strength || joint === 0) return point;
  const fraction = Math.max(0, Math.min(1, joint / segments));
  const shoulder = Math.min(fraction, .25), shoulderSlope = (.04 - .95) / .25;
  const shoulderAngle = .95 + shoulderSlope * shoulder;
  let radial = (Math.cos(.95) - Math.cos(shoulderAngle)) / shoulderSlope;
  let trailing = (Math.sin(shoulderAngle) - Math.sin(.95)) / shoulderSlope;
  const distal = Math.max(0, fraction - .25), slope = (.01 + .55 * state.recovery) / .75;
  const tipAngle = .04 + slope * distal;
  radial += (Math.cos(.04) - Math.cos(tipAngle)) / slope;
  trailing += (Math.sin(tipAngle) - Math.sin(.04)) / slope;
  const offset = arm * 3, blend = state.strength;
  point.x += (root.x + length * (state.radial[offset] * radial - state.dx * trailing) - point.x) * blend;
  point.y += (root.y + length * (state.radial[offset + 1] * radial - state.dy * trailing) - point.y) * blend;
  point.z += (root.z + length * (state.radial[offset + 2] * radial - state.dz * trailing) - point.z) * blend;
  return point;
}
