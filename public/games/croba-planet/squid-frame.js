/** Normalized orientation in render axes: render X=world X, Y=world Z, Z=world Y.
 * Old prepared descriptors remain valid and use their original heading yaw.
 * @param {{orientation?:{x:number,y:number,z:number,w:number},heading?:number}} squid
 */
export function getSquidOrientation(squid) {
  const q = squid.orientation;
  if (q && [q.x, q.y, q.z, q.w].every(Number.isFinite)) {
    const length = Math.hypot(q.x, q.y, q.z, q.w);
    if (length > 1e-10) return { x: q.x / length, y: q.y / length, z: q.z / length, w: q.w / length };
  }
  const half = (Math.PI / 2 - (Number.isFinite(squid.heading) ? squid.heading : 0)) / 2;
  return { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) };
}

/** Rotate head-local render coordinates in simulation units into world coordinates. */
export function squidLocalToWorld(squid, x, y, z) {
  const q = getSquidOrientation(squid);
  const tx = 2 * (q.y * z - q.z * y), ty = 2 * (q.z * x - q.x * z), tz = 2 * (q.x * y - q.y * x);
  const rx = x + q.w * tx + q.y * tz - q.z * ty;
  const ry = y + q.w * ty + q.z * tx - q.x * tz;
  const rz = z + q.w * tz + q.x * ty - q.y * tx;
  return { x: squid.x + rx, y: squid.y + rz, z: squid.z + ry };
}

/** The local ring ordering reproduces all eight anchors in the original prepared map. */
export function getSquidAnchor(squid, arm) {
  const angle = arm * Math.PI / 4;
  return squidLocalToWorld(squid, -Math.sin(angle) * 11, -9, Math.cos(angle) * 11);
}

function multiply(a, b) {
  return { x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z };
}

/** Align the head crown (+local Y) with a simulated swimming direction, bank
 * around that axis, and cap angular movement so anchors cannot snap around.
 */
export function steerSquidOrientation(squid, direction, roll, maxAngle) {
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (length < 1e-8) return getSquidOrientation(squid);
  const dx = direction.x / length, dy = direction.z / length, dz = direction.y / length;
  const base = dy < -0.999999 ? { x: 1, y: 0, z: 0, w: 0 }
    : getSquidOrientation({ orientation: { x: dz, y: 0, z: -dx, w: 1 + dy } });
  let target = multiply(base, { x: 0, y: Math.sin(roll / 2), z: 0, w: Math.cos(roll / 2) });
  const current = getSquidOrientation(squid);
  let dot = current.x * target.x + current.y * target.y + current.z * target.z + current.w * target.w;
  if (dot < 0) { target = { x: -target.x, y: -target.y, z: -target.z, w: -target.w }; dot = -dot; }
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
  const t = angle < 1e-8 ? 1 : Math.min(1, maxAngle / (2 * angle));
  const sine = Math.sin(angle);
  const a = sine > 1e-6 ? Math.sin((1 - t) * angle) / sine : 1 - t;
  const b = sine > 1e-6 ? Math.sin(t * angle) / sine : t;
  return getSquidOrientation({ orientation: { x: current.x * a + target.x * b,
    y: current.y * a + target.y * b, z: current.z * a + target.z * b, w: current.w * a + target.w * b } });
}
