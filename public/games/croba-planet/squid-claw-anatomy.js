/** Physical claw axis shared by the adult renderer, blocking capsules and grab detection. */
export function getSquidClawAxis(squid, armIndex) {
  if (squid?.designVersion !== 2) return null;
  const arm = squid.tentacles?.[armIndex], tip = arm?.at(-1), before = arm?.at(-2);
  if (!tip || !before) return null;
  const dx = tip.x - before.x, dy = tip.y - before.y, dz = tip.z - before.z;
  const length = Math.hypot(dx, dy, dz);
  if (!Number.isFinite(length) || length < 1e-8) return null;
  const reach = squid.clawLength ?? 24;
  return { root: tip, end: { x: tip.x + dx / length * reach, y: tip.y + dy / length * reach,
    z: tip.z + dz / length * reach }, radius: reach * .55 };
}
