// Squid-only surface equations from before the v140 texture pass. Keeping
// these separate preserves that appearance without reverting other wildlife.
export const CLASSIC_SQUID_PROFILES = Object.freeze(['scarred-armor', 'horn', 'collector-horn']);
const TAU = Math.PI * 2;
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const smooth = (low, high, value) => {
  const t = clamp((value - low) / (high - low));
  return t * t * (3 - 2 * t);
};
const wrap = (value, period) => (value % period + period) % period;

function hash(x, y, seed) {
  let value = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function noise(u, v, cells, seed) {
  const x = u * cells, y = v * cells;
  const ix = Math.floor(x), iy = Math.floor(y);
  const sx = smooth(0, 1, x - ix), sy = smooth(0, 1, y - iy);
  const at = (dx, dy) => hash(wrap(ix + dx, cells), wrap(iy + dy, cells), seed);
  const a = at(0, 0) * (1 - sx) + at(1, 0) * sx;
  const b = at(0, 1) * (1 - sx) + at(1, 1) * sx;
  return a * (1 - sy) + b * sy;
}

function cells(u, v, count, seed) {
  const x = u * count, y = v * count;
  const ix = Math.floor(x), iy = Math.floor(y);
  let nearest = Infinity;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const cx = ix + dx, cy = iy + dy;
    const px = cx + 0.15 + hash(wrap(cx, count), wrap(cy, count), seed) * 0.7;
    const py = cy + 0.15 + hash(wrap(cx, count), wrap(cy, count), seed + 47) * 0.7;
    nearest = Math.min(nearest, Math.hypot(x - px, y - py));
  }
  return {pit: 1 - smooth(0.04, 0.15, nearest), grain: 1 - smooth(0.12, 0.43, nearest)};
}

/** Sample the original squid skin, beak/belly or hard jaw surface.
 * @param {string} profile @param {number} u @param {number} v
 * @returns {{pigment:number, height:number, roughness:number}}
 */
export function sampleClassicSquidSurface(profile, u, v) {
  const broad = noise(u, v, 4, 1763);
  const middle = noise(u, v, 11, 3319);
  const fine = noise(u, v, 43, 9473);
  if (profile === 'collector-horn') {
    const ridge = Math.pow((Math.sin(TAU * (u * 19 + middle * .25)) + 1) / 2, 5);
    const growth = Math.sin(TAU * (v * 37 + broad * .18));
    return {pigment: clamp(.45 + middle * .25 + ridge * .13 + v * .14),
      height: .4 + ridge * .14 + growth * .006 + fine * .015,
      roughness: .27 + middle * .23 + (1 - ridge) * .12};
  }
  if (profile === 'horn') {
    const ridges = (Math.sin(TAU * (u * 29 + noise(u, v, 5, 771) * .28)) + 1) / 2;
    return {pigment: .69 + middle * .24 + ridges * .055,
      height: .43 + ridges * .11 + fine * .02,
      roughness: .26 + middle * .17 + fine * .07};
  }
  if (profile === 'scarred-armor') {
    const biological = cells(u, v, 20, 2357);
    const groove = 1 - smooth(.018, .075, Math.abs(Math.sin(TAU * (u * 3 - v * 2 + broad * .18))));
    const scar = groove * smooth(.24, .58, middle);
    return {pigment: clamp(.68 + broad * .25 + middle * .10 - scar * .28 - biological.pit * .12),
      height: .45 + biological.grain * .12 + fine * .065 - scar * .16 - biological.pit * .10,
      roughness: .72 + middle * .19 + biological.pit * .07};
  }
  throw new TypeError(`The classic squid surface does not support profile: ${profile}`);
}
