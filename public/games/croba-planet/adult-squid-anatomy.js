/** Adult-only head-local anchors, normalized to the physical head radius.
 * Local X is side, Y is up and Z is forward; juveniles keep their own layout.
 */
export const ADULT_SQUID_EYE_SCALE = .85;
export const ADULT_SQUID_HEAD_Y_SCALE = 1.12;
export const getAdultSquidHeadYScale = squid => squid?.headYScale ?? ADULT_SQUID_HEAD_Y_SCALE;
export const ADULT_SQUID_MOUTH_LOCAL = Object.freeze([0, -.32, 1.04]);
/** Armored cheek mandible, with a curved black terminal hook. */
export const ADULT_SQUID_MANDIBLE_PATH = Object.freeze([
  Object.freeze([0, 0, 0]), Object.freeze([0, -.12, .28]),
  Object.freeze([0, -.42, .45]), Object.freeze([0, -.80, .36]),
]);
export const CROBONIC_MANDIBLE_PATH = Object.freeze([
  Object.freeze([0, 0, 0]), Object.freeze([0, -.12, .16]),
  Object.freeze([0, -.28, .28]), Object.freeze([0, -.58, .30]),
]);
export function getAdultSquidMandiblePose(side, strike = 0, squid, opening = 0) {
  if (squid?.designVersion === 2) return {
    x: side * (.60 + .10 * opening - .06 * strike), y: -.16, z: .92 + .13 * strike,
    pitch: -.3 * strike, yaw: side * .12, roll: side * (-1.1 + .5 * opening),
  };
  return { x: side * (.55 - .12 * strike), y: -.27, z: .88 + .07 * strike,
    pitch: -strike, yaw: side * (.38 - strike) };
}

/** Apply the renderer's XYZ Euler pose to a mandible axis point. Collision
 * follows the same side hinge and inward curve as the visible armored jaws. */
export function getAdultSquidMandiblePoint(side, point, squid) {
  const pose = getAdultSquidMandiblePose(side, 0, squid), roll = pose.roll ?? 0;
  const x = point[0] * Math.cos(roll) - point[1] * Math.sin(roll);
  const y = point[0] * Math.sin(roll) + point[1] * Math.cos(roll);
  const rx = x * Math.cos(pose.yaw) + point[2] * Math.sin(pose.yaw);
  const z = -x * Math.sin(pose.yaw) + point[2] * Math.cos(pose.yaw);
  return [pose.x + rx, pose.y + y * Math.cos(pose.pitch) - z * Math.sin(pose.pitch),
    pose.z + y * Math.sin(pose.pitch) + z * Math.cos(pose.pitch)];
}
export const ADULT_SQUID_EYE_LAYOUT = Object.freeze([
  Object.freeze([-.50, .35]), Object.freeze([.50, .35]),
  Object.freeze([-.50, .06]), Object.freeze([.50, .06]),
]);
