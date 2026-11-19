/** Authored anatomy dimensions before seeded variation and the 15% growth. */
export const CRAB_STOCKY_SHAPE = Object.freeze({
  width: 1.25, height: .9, length: 1.16, legThickness: 1.35,
});
export const CRAB_GROWTH = 1.15;
export const CRAB_SIZE = Object.freeze({
  legSpan: .6875, bodyHeight: .675, shellWidth: .31, shellBase: .549,
  shellHeight: 1.03, totalHeight: 1.579, bodyRadius: .22, bodyBottom: .34,
});

/** Preserve seeded variation while retiring the old giant-crab scale range. */
export function getCrabScale(crab) {
  const scale = Number.isFinite(crab?.scale) && crab.scale > 0 ? crab.scale : 1;
  return Math.max(.92, Math.min(1.04, scale)) * CRAB_GROWTH;
}

/** Shared simulation cylinder for the solid carapace and carried shell.
 * Walking legs remain passable, matching the other articulated wildlife.
 */
export function getCrabCollider(crab) {
  const scale = getCrabScale(crab);
  return { radius: CRAB_SIZE.bodyRadius * 25 * scale,
    bottom: crab.z + CRAB_SIZE.bodyBottom * 25 * scale, top: crab.z + CRAB_SIZE.totalHeight * 25 * scale };
}
