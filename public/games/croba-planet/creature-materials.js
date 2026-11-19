import * as THREE from "./vendor/three.module.js";
import {CLASSIC_SQUID_PROFILES, sampleClassicSquidSurface} from './classic-squid-surfaces.js';

const TAU = Math.PI * 2;
const PROFILES = new Set(["armor", "skin", "fish-skin", "iris", "horn", "collector-iris", "collector-horn", "scarred-skin", "scarred-armor", "void-armor", "hogwong-hide", "frost-hide", "throat", "suit-fabric", "penguin-plumage", "tube-coral"]);
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

function noise(u, v, cells, seed, rows = cells) {
  const x = u * cells, y = v * rows;
  const ix = Math.floor(x), iy = Math.floor(y);
  const sx = smooth(0, 1, x - ix), sy = smooth(0, 1, y - iy);
  const at = (dx, dy) => hash(wrap(ix + dx, cells), wrap(iy + dy, rows), seed);
  const a = at(0, 0) * (1 - sx) + at(1, 0) * sx;
  const b = at(0, 1) * (1 - sx) + at(1, 1) * sx;
  return a * (1 - sy) + b * sy;
}

/** Periodic biological cells supply pits and narrow joins without a square grid. */
function cells(u, v, count, seed) {
  const x = u * count, y = v * count;
  const ix = Math.floor(x), iy = Math.floor(y);
  let nearest = Infinity, second = Infinity, radius = .12;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const cx = ix + dx, cy = iy + dy;
    const a = hash(wrap(cx, count), wrap(cy, count), seed);
    const b = hash(wrap(cx, count), wrap(cy, count), seed + 47);
    const px = cx + 0.15 + a * 0.7;
    const py = cy + 0.15 + b * 0.7;
    const distance = Math.hypot(x - px, y - py);
    if (distance < nearest) { second = nearest; nearest = distance; radius = .085 + b * .085; }
    else if (distance < second) second = distance;
  }
  return { pit: 1 - smooth(radius * .25, radius, nearest),
    grain: 1 - smooth(0.12, 0.43, nearest), seam: 1 - smooth(0.018, 0.095, second - nearest) };
}

function sample(profile, u, v) {
  const broad = noise(u, v, 4, 1763);
  const middle = noise(u, v, 11, 3319);
  const fine = noise(u, v, 43, 9473);
  const tissueU = u + (broad - .5) * .055, tissueV = v + (middle - .5) * .035;
  if (profile === "tube-coral") {
    const pores = cells(tissueU, tissueV, 26, 6151);
    const fibers = noise(tissueU, tissueV, 21, 4417, 4);
    const growth = noise(tissueU, tissueV, 5, 7867, 19);
    return { pigment: clamp(.76 + broad * .14 + fine * .045 + fibers * .035 - pores.pit * .29 - pores.seam * .025),
      height: .45 + fibers * .038 + growth * .013 + fine * .008 - pores.pit * .072,
      roughness: clamp(.56 + middle * .20 + pores.pit * .14 + growth * .07 - fibers * .06) };
  }
  if (profile === "fish-skin") {
    // Fine overlapping skin cells beneath a thin, streaked mucus film. Relief
    // stays shallow so the glossy tissue reads as skin rather than rock.
    const scales = cells(tissueU, tissueV, 28, 6299);
    const mucus = noise(tissueU, tissueV, 5, 7741, 15);
    return { pigment: clamp(.81 + broad * .16 + fine * .035 - scales.seam * .035 - scales.pit * .025),
      height: .5 + fine * .008 + scales.grain * .018 - scales.seam * .008 + mucus * .004,
      roughness: clamp(.53 + middle * .18 + scales.seam * .055 - mucus * .075) };
  }
  if(profile === "penguin-plumage"){
    const feathers=cells(tissueU,tissueV,18,2693);
    const fibers=noise(tissueU,tissueV,48,7201,9),barbs=noise(tissueU,tissueV,9,1021,41);
    return {pigment:clamp(.76+broad*.17+fine*.045-feathers.seam*.07+fibers*.025),
      height:.49+fibers*.026+barbs*.009-feathers.seam*.023+fine*.006,
      roughness:clamp(.66+middle*.19+feathers.seam*.07-fibers*.055)};
  }
  if(profile === "suit-fabric"){
    const weave=Math.sin(u*TAU*32)*Math.sin(v*TAU*32);
    const scuff=Math.max(0,Math.sin((u+v*.15)*TAU*19+middle*2))**16;
    return {pigment:clamp(.79+broad*.13+fine*.04-scuff*.07),height:.5+weave*.018+fine*.012,
      roughness:.74+middle*.12+scuff*.08};
  }
  if(profile === "throat"){
    const fold=(.5+.5*Math.sin(u*TAU*11+Math.sin(v*TAU*3)*.8+middle*1.5))**5;
    const wrinkle=(.5+.5*Math.sin(v*TAU*19+u*TAU*2+middle*2))**9;
    return {pigment:clamp(.70+broad*.18+fine*.06-fold*.17-wrinkle*.08),
      height:.5+fold*.12+wrinkle*.045+fine*.012,
      roughness:clamp(.32+middle*.26+fold*.12)};
  }
  if (profile === "iris" || profile === "collector-iris") {
    // Sphere +Z lies at u=.25; the second focus also makes the rear hemisphere
    // natural rather than stretching a single flat eye decal around the sphere.
    const du = Math.min(Math.abs(u - 0.25), Math.abs(u - 0.75));
    const x = du / 0.24, y = (v - 0.5) / 0.5;
    const radius = Math.hypot(x, y), angle = Math.atan2(Math.abs(y), x);
    const fibers = (Math.sin(angle * 57 + radius * 21 + middle * 3) + 1) / 2;
    const rim = smooth(0.72, 1.02, radius);
    if (profile === "collector-iris") {
      const spokes = Math.pow((Math.sin(angle * 113 + radius * 32 + middle * 4) + 1) / 2, 3);
      const rings = Math.sin(radius * 95 + fine * 2) * .04;
      return { pigment: clamp(.44 + fibers * .33 + spokes * .22 + rings - rim * .35),
        height: .5 + spokes * .10 + rings * .2, roughness: .16 + rim * .24 + fine * .09 };
    }
    return { pigment: clamp(0.65 + fibers * 0.31 - rim * 0.23),
      height: 0.5 + fibers * 0.055 + fine * 0.01,
      roughness: 0.19 + fine * 0.13 + rim * 0.08 };
  }
  if (profile === "collector-horn") {
    const ridge = noise(tissueU,tissueV,25,9199,5);
    const growth = noise(tissueU,tissueV,5,2843,31);
    return { pigment: clamp(.58 + middle * .25 + ridge * .13 - growth * .045),
      height: .4 + ridge * .12 + growth * .016 + fine * .015,
      roughness: .27 + middle * .23 + (1 - ridge) * .12 };
  }
  if (profile === "horn") {
    const ridges = noise(tissueU,tissueV,31,771,5),growth=noise(tissueU,tissueV,5,2237,27);
    return { pigment: clamp(.68 + middle * .24 + ridges * .07 + fine * .035 - growth * .035),
      height: .43 + ridges * .085 + growth * .018 + fine * .017,
      roughness: clamp(.28 + middle * .19 + growth * .085 - ridges * .035) };
  }
  const biological = cells(tissueU, tissueV, profile === "armor" ? 15 : 20, 2357);
  if(profile === "frost-hide"){
    const foldField=noise(tissueU,tissueV,5,8693,11),folds=(1-smooth(.018,.09,Math.abs(foldField-.51)))*smooth(.35,.7,broad);
    return {pigment:clamp(.70+broad*.22+fine*.045-biological.pit*.10-folds*.09),
      height:.43+biological.grain*.043+fine*.015-biological.pit*.052-folds*.033,
      roughness:clamp(.28+middle*.25+biological.pit*.15+folds*.09)};
  }
  if(profile === "hogwong-hide"){
    const fibers=noise(tissueU,tissueV,49,6823,8);
    const crease=(1-smooth(.015,.075,Math.abs(noise(tissueU,tissueV,4,4297)-.53)))*smooth(.28,.71,middle);
    return {pigment:clamp(.70+broad*.23+fibers*.035+fine*.04-crease*.12-biological.pit*.065),
      height:.44+fibers*.026+fine*.012-crease*.038-biological.pit*.025,
      roughness:clamp(.64+middle*.21+crease*.10-fibers*.085)};
  }
  if (profile === "void-armor") {
    const furrow=1-smooth(.018,.075,Math.abs(noise(tissueU,tissueV,6,3761)-.49));
    const scrape=furrow*smooth(.36,.7,middle),striae=noise(tissueU,tissueV,37,5711,6);
    return {pigment:clamp(.74+broad*.22+fine*.05-biological.pit*.17-scrape*.16),
      height:.43+biological.grain*.068+striae*.03+fine*.016-biological.pit*.08-scrape*.058,
      roughness:clamp(.25+middle*.22+biological.pit*.15+scrape*.18-striae*.035)};
  }
  if (profile === "scarred-armor") {
    const path = noise(tissueU,tissueV,7,5503),groove=1-smooth(.014,.058,Math.abs(path-.51));
    const scar = groove * smooth(.30,.68,middle),lip=smooth(.018,.035,Math.abs(path-.51))*(1-smooth(.035,.08,Math.abs(path-.51)));
    return { pigment: clamp(.69 + broad * .26 + middle * .11 - scar * .27 - biological.pit * .13 - biological.seam * .025 + lip * .025),
      height: .45 + biological.grain * .10 + fine * .042 - scar * .135 - biological.pit * .085 + lip * .025,
      roughness: clamp(.71 + middle * .19 + biological.pit * .08 + scar * .045 - lip * .035) };
  }
  if (profile === "scarred-skin") {
    const path=noise(tissueU,tissueV,5,7433),cut=1-smooth(.012,.046,Math.abs(path-.52));
    const scar = cut * smooth(.35, .69, middle);
    const wrinkles = noise(tissueU,tissueV,29,8537,7);
    return { pigment: clamp(.44 + broad * .32 + middle * .18 + scar * .20
        - biological.pit * .12 - biological.grain * .16 * (.45 + middle), .36, 1),
      height: .46 + wrinkles * .051 - biological.pit * .08 + scar * .115 + fine * .021,
      roughness: clamp(.20 + middle * .34 + biological.grain * .22 - scar * .10) };
  }
  if (profile === "skin") {
    const chromatophores = smooth(0.5, 0.77, middle) * (0.4 + broad * 0.6);
    return { pigment: clamp(0.59 + broad * 0.43 - chromatophores * 0.22 - biological.pit * 0.045, 0.55, 0.96),
      height: 0.48 + middle * 0.022 + fine * 0.015 - biological.pit * 0.047,
      roughness: .28 + middle * .23 + biological.pit * .13 + biological.grain * .035 };
  }
  return { pigment: clamp(.79 + broad * .18 + fine * .035 - biological.seam * .115 - biological.pit * .12),
    height: .40 + biological.grain * .09 + fine * .024 - biological.seam * .045 - biological.pit * .065,
    roughness: clamp(.32 + middle * .19 + biological.seam * .13 + biological.pit * .08 - biological.grain * .025) };
}

/** Neutral maps preserve each creature's established material colour. Their
 * independently sampled pigment, relief and wet roughness avoid painted-on shine.
 * @param {'armor'|'skin'|'fish-skin'|'iris'|'horn'|'collector-iris'|'collector-horn'|'scarred-skin'|'scarred-armor'|'void-armor'|'hogwong-hide'|'frost-hide'|'throat'|'suit-fabric'|'penguin-plumage'|'tube-coral'} profile @param {number} [resolution]
 * @param {'current'|'classic-squid'} [style]
 * @returns {{color:Uint8Array,normal:Uint8Array,roughness:Uint8Array}}
 */
export function buildCreatureSurfacePixels(profile, resolution = 128, style = 'current') {
  if (!PROFILES.has(profile)) throw new TypeError(`Unknown creature surface profile: ${profile}`);
  if (!Number.isInteger(resolution) || resolution < 32 || resolution > 256 || (resolution & (resolution - 1)))
    throw new RangeError("Creature texture resolution must be a power of two from 32 to 256.");
  if (style !== 'current' && style !== 'classic-squid') throw new TypeError(`Unknown creature surface style: ${style}`);
  if (style === 'classic-squid' && !CLASSIC_SQUID_PROFILES.includes(profile))
    throw new TypeError(`The classic squid surface does not support profile: ${profile}`);
  const sampler = style === 'classic-squid' ? sampleClassicSquidSurface : sample;
  const color = new Uint8Array(resolution * resolution * 4);
  const normal = new Uint8Array(color.length), roughness = new Uint8Array(color.length);
  const height = new Float32Array(resolution * resolution);
  for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
    const value = sampler(profile, x / (resolution - 1), y / (resolution - 1));
    const index = (y * resolution + x) * 4;
    const pigment = Math.round(clamp(value.pigment) * 255), rough = Math.round(clamp(value.roughness) * 255);
    color.set([pigment, pigment, pigment, 255], index);
    roughness.set([rough, rough, rough, 255], index);
    height[y * resolution + x] = value.height;
  }
  const at = (x, y) => height[wrap(y, resolution - 1) * resolution + wrap(x, resolution - 1)];
  for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
    const nx = -(at(x + 1, y) - at(x - 1, y)) * 8;
    const ny = -(at(x, y + 1) - at(x, y - 1)) * 8;
    const length = Math.hypot(nx, ny, 1), index = (y * resolution + x) * 4;
    normal.set([Math.round((nx / length * 0.5 + 0.5) * 255),
      Math.round((ny / length * 0.5 + 0.5) * 255), Math.round((0.5 / length + 0.5) * 255), 255], index);
  }
  return { color, normal, roughness };
}

/** Own one small map set, shared across all animals in a renderer. No global
 * cache or borrowed texture is retained; Scene can also discover these ordinary
 * material maps through its existing disposal traversal.
 * @param {'armor'|'skin'|'fish-skin'|'iris'|'horn'|'collector-iris'|'collector-horn'|'scarred-skin'|'scarred-armor'|'void-armor'|'hogwong-hide'|'frost-hide'|'throat'|'suit-fabric'|'penguin-plumage'|'tube-coral'} profile @param {number} [resolution]
 * @param {'current'|'classic-squid'} [style]
 */
export function createCreatureSurfaceMaps(profile, resolution = 128, style = 'current') {
  const pixels = buildCreatureSurfacePixels(profile, resolution, style);
  const texture = (bytes, color = false) => {
    const result = new THREE.DataTexture(bytes, resolution, resolution, THREE.RGBAFormat);
    result.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    result.wrapS = result.wrapT = THREE.RepeatWrapping;
    result.minFilter = THREE.LinearMipmapLinearFilter;
    result.magFilter = THREE.LinearFilter;
    result.generateMipmaps = true;
    result.anisotropy = 2;
    result.needsUpdate = true;
    result.userData.creatureProfile = profile;
    result.userData.surfaceStyle = style;
    return result;
  };
  const map = texture(pixels.color, true);
  const normalMap = texture(pixels.normal);
  const roughnessMap = texture(pixels.roughness);
  const textures = [map, normalMap, roughnessMap];
  let disposed = false;
  return { map, normalMap, roughnessMap, textures, dispose() {
    if (disposed) return;
    disposed = true;
    textures.forEach((entry) => entry.dispose());
  } };
}

/** Attach owned maps without changing colour, anatomy or transparency. */
export function applyCreatureSurface(material, maps, normalStrength = 0.35) {
  material.map = maps.map;
  material.normalMap = maps.normalMap;
  material.roughnessMap = maps.roughnessMap;
  material.normalScale.set(normalStrength, normalStrength);
  material.flatShading = false;
  material.needsUpdate = true;
  return material;
}
