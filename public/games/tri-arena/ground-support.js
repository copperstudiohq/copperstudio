/** Grounded anatomy only; floating creatures and the two custom tripods stay separate. */
export const GROUND_SUPPORT_PROFILES = Object.freeze(Object.fromEntries(Object.entries({
  ling: { count: 4, maxDrop: .45 },
  trider: { count: 8, maxDrop: 2.18 },
  'copper-robot': { count: 2, maxDrop: .72 },
  'miner-bot': { count: 2, maxDrop: .72 },
  knight: { count: 2, maxDrop: .72 },
  'copper-head-catapult': { count: 4, maxDrop: .44 },
  'copper-giant': { count: 2, maxDrop: 1 },
  'frost-triram': { count: 6, maxDrop: .9 },
  'copper-drill-worm': { count: 12, maxDrop: .22 },
}).map(([type, profile]) => [type, Object.freeze(profile)])));

export function supportId(index) {
  if (!Number.isSafeInteger(index) || index < 0 || index >= 64) throw new RangeError('Ground support index must be an integer from 0 to 63.');
  return `support-leg-${index}`;
}

/**
 * Tag complete physical limbs for balance, and only their terminal feet for support.
 * Upper stubs must not keep a severed foot counted as grounded.
 * @param {object} root A completed creature root with userData.type.
 * @param {Array<object|{limb:object,terminal:object}>} supports Limb groups or explicit endpoints.
 * @returns {Array<{id:string,limb:object,terminal:object}>}
 */
export function registerGroundSupports(root, supports) {
  const type = root?.userData?.type;
  if (!Object.hasOwn(GROUND_SUPPORT_PROFILES, type)) throw new TypeError(`Unknown grounded creature: ${String(type)}`);
  const profile = GROUND_SUPPORT_PROFILES[type];
  if (!Array.isArray(supports) || supports.length !== profile.count) {
    throw new RangeError(`${type} requires ${profile.count} ground supports.`);
  }
  const registered = supports.map((entry, index) => {
    const limb = entry?.limb ?? entry;
    const terminal = entry?.terminal ?? limb?.userData?.boot ?? limb?.userData?.terminal ?? limb?.userData?.foot ?? limb;
    if (typeof limb?.traverse !== 'function' || typeof terminal?.traverse !== 'function') {
      throw new TypeError(`${type} support ${index} requires a physical limb and terminal foot.`);
    }
    const id = supportId(index);
    let limbCells = 0, terminalCells = 0;
    limb.traverse(part => {
      if (!part.isMesh || !part.userData?.severable) return;
      part.userData.balanceId = id; limbCells++;
    });
    terminal.traverse(part => {
      if (!part.isMesh || !part.userData?.severable) return;
      part.userData.structuralId = id; terminalCells++;
    });
    if (!limbCells || !terminalCells) throw new TypeError(`${type} support ${index} contains no cuttable support geometry.`);
    limb.userData.supportIndex = index;
    return { id, limb, terminal };
  });
  root.userData.groundSupports = registered;
  root.userData.groundSupportProfile = profile;
  return registered;
}
