/** Creature anatomy is shared across screens. The real device quality still
 * controls drawing-buffer resolution and visibility budgets in update calls;
 * constructors always receive the complete geometry, fur, joints and tails.
 * @template {{mobile?:boolean}} T
 * @param {T} [quality]
 * @returns {T & {mobile:false}}
 */
export function creatureModelQuality(quality = {}) {
  return Object.freeze({ ...quality, mobile: false });
}
