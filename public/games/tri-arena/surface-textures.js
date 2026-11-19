import * as THREE from './assets/three.module.js';

const SIZE = 256;
const TAU = Math.PI * 2;
const KINDS = Object.freeze({ copper: 137, bone: 293, flesh: 419, stone: 661 });
const cache = new Map();
const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = value => value * value * (3 - 2 * value);
const threshold = (low, high, value) => smooth(clamp((value - low) / (high - low)));
const wrap = (value, period) => ((value % period) + period) % period;

function hash(x, y, seed) {
  let value = Math.imul(x + seed, 374761393) ^ Math.imul(y + seed * 3, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

/** Periodic value fields provide coherent grain instead of independent noisy pixels. */
function noise(u, v, columns, rows, seed) {
  const x = u * columns, y = v * rows;
  const ix = Math.floor(x), iy = Math.floor(y);
  const tx = smooth(x - ix), ty = smooth(y - iy);
  const sample = (dx, dy) => hash(wrap(ix + dx, columns), wrap(iy + dy, rows), seed);
  return mix(mix(sample(0, 0), sample(1, 0), tx), mix(sample(0, 1), sample(1, 1), tx), ty);
}

/** Distance between the nearest two periodic cells gives thin, irregular crack networks. */
function cellGap(u, v, cells, seed) {
  const x = u * cells, y = v * cells, ix = Math.floor(x), iy = Math.floor(y);
  let first = Infinity, second = Infinity;
  for (let row = -1; row <= 1; row += 1) for (let column = -1; column <= 1; column += 1) {
    const gx = ix + column, gy = iy + row;
    const hx = wrap(gx, cells), hy = wrap(gy, cells);
    const dx = gx + .18 + hash(hx, hy, seed) * .64 - x;
    const dy = gy + .18 + hash(hx, hy, seed + 17) * .64 - y;
    const distance = dx * dx + dy * dy;
    if (distance < first) { second = first; first = distance; }
    else if (distance < second) second = distance;
  }
  return Math.sqrt(second) - Math.sqrt(first);
}

function surface(kind, u, v, seed) {
  const broad = noise(u, v, 4, 4, seed);
  const medium = noise(u, v, 13, 13, seed + 3);
  const fine = noise(u, v, 79, 79, seed + 7);
  if (kind === 'copper') {
    const rolling = noise(u, v, 51, 4, seed + 11);
    const oxidation = threshold(.54, .8, broad * .75 + medium * .25);
    const wear = threshold(.58, .83, medium);
    const pit = threshold(.76, .95, fine);
    const scratch = Math.pow(Math.max(0, Math.sin(TAU * (u * 61 + broad * .4))), 18)
      * threshold(.5, .8, noise(u, v, 3, 19, seed + 31));
    return { light: .935 + rolling * .04 + fine * .012 + wear * .015 - oxidation * .115 - scratch * .045 - pit * .035,
      height: .49 + rolling * .065 + medium * .025 - pit * .09 - scratch * .06 - oxidation * .025,
      roughness: .48 + oxidation * .27 + fine * .09 - wear * .12 };
  }
  if (kind === 'bone') {
    const grain = noise(u, v, 57, 5, seed + 11);
    const stain = threshold(.52, .83, broad * .65 + medium * .35);
    const edge = cellGap(u + broad * .025, v + medium * .025, 6, seed + 23);
    const crack = (1 - threshold(.012, .048, edge)) * threshold(.35, .65, broad);
    return { light: .963 + grain * .017 + fine * .009 - stain * .047 - crack * .078,
      height: .5 + grain * .045 + fine * .017 - crack * .12,
      roughness: .74 + grain * .09 + stain * .07 + crack * .05,
      warmth: stain * .016 };
  }
  if (kind === 'flesh') {
    const lobe = Math.pow(1 - Math.abs(broad * 2 - 1), .7);
    const fiber = Math.sin(TAU * (v * 23 + medium * .65)) * .5 + .5;
    const vein = 1 - threshold(.012, .085, cellGap(u + broad * .045, v + medium * .045, 5, seed + 23));
    const pore = threshold(.75, .94, fine);
    return { light: .953 + lobe * .025 + fiber * .013 - vein * .088 - pore * .035,
      height: .45 + lobe * .135 + fiber * .025 - vein * .115 - pore * .05,
      roughness: .83 - lobe * .1 + vein * .08 + pore * .06 };
  }
  const strata = broad * .47 + medium * .28 + noise(u, v, 31, 31, seed + 11) * .17 + fine * .08;
  const crack = (1 - threshold(.009, .05, cellGap(u + broad * .045, v + medium * .045, 5, seed + 23)))
    * threshold(.25, .58, medium);
  return { light: .864 + strata * .14 + fine * .035 - crack * .085,
    height: .43 + strata * .2 + fine * .055 - crack * .135,
    roughness: .84 + fine * .12 - strata * .035 + crack * .04 };
}

function makeTexture(kind, channel, bytes) {
  const texture = new THREE.DataTexture(bytes, SIZE, SIZE, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.name = `arena-${kind}-${channel}`;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = channel === 'albedo' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Shared seamless pixel surfaces. Albedo stays near neutral white so the caller's
 * canonical material color remains the palette; relief and roughness match its grain.
 * Clone a returned texture before setting a per-object UV repeat or offset.
 * @param {'copper'|'bone'|'flesh'|'stone'} kind
 * @returns {{map:THREE.DataTexture,bumpMap:THREE.DataTexture,roughnessMap:THREE.DataTexture}}
 */
export function createSurfaceTextures(kind) {
  if (typeof kind !== 'string' || !Object.hasOwn(KINDS, kind)) throw new TypeError(`Unknown arena surface texture: ${String(kind)}. Expected copper, bone, flesh or stone.`);
  if (cache.has(kind)) return cache.get(kind);
  const albedo = new Uint8Array(SIZE * SIZE * 4);
  const height = new Uint8Array(albedo.length), roughness = new Uint8Array(albedo.length);
  const byte = value => Math.round(clamp(value) * 255);
  for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) {
    // The duplicate boundary row/column is intentional: all three maps share exact seams.
    const u = (x % (SIZE - 1)) / (SIZE - 1), v = (y % (SIZE - 1)) / (SIZE - 1);
    const sample = surface(kind, u, v, KINDS[kind]), index = (y * SIZE + x) * 4;
    albedo[index] = byte(sample.light);
    albedo[index + 1] = byte(sample.light * (1 - (sample.warmth ?? 0) * .35));
    albedo[index + 2] = byte(sample.light * (1 - (sample.warmth ?? 0)));
    albedo[index + 3] = height[index + 3] = roughness[index + 3] = 255;
    height[index] = height[index + 1] = height[index + 2] = byte(sample.height);
    roughness[index] = roughness[index + 1] = roughness[index + 2] = byte(sample.roughness);
  }
  const result = Object.freeze({ map: makeTexture(kind, 'albedo', albedo),
    bumpMap: makeTexture(kind, 'height', height), roughnessMap: makeTexture(kind, 'roughness', roughness) });
  cache.set(kind, result);
  return result;
}

/** Release shared GPU allocations on final teardown, after their users have stopped. */
export function disposeSurfaceTextures() {
  for (const textures of cache.values()) for (const texture of Object.values(textures)) texture.dispose();
  cache.clear();
}
