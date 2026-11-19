import * as THREE from "./vendor/three.module.js";

const TAU = Math.PI * 2;
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const wrap = (value, period) => (value % period + period) % period;

function grain(x, y, seed) {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263) ^ seed;
  value = Math.imul(value ^ value >>> 13, 1274126177);
  return ((value ^ value >>> 16) >>> 0) / 4294967295;
}

/** Neutral living-tissue maps keep each species' authored vertex palette intact.
 * Fronds have midribs and oblique veins; fleshy cups and pods have fine cellular
 * relief. Every edge is periodic, including tangent-space normals.
 * @param {'frond'|'cuticle'} profile @param {number} [resolution]
 */
export function buildPlantSurfacePixels(profile, resolution = 128) {
  if (!["frond", "cuticle"].includes(profile)) throw new TypeError(`Unknown plant surface: ${profile}`);
  if (!Number.isInteger(resolution) || resolution < 32 || resolution > 512 || (resolution & (resolution - 1)))
    throw new RangeError("Plant texture resolution must be a power of two from 32 to 512.");
  const color = new Uint8Array(resolution * resolution * 4), normal = new Uint8Array(color.length);
  const roughness = new Uint8Array(color.length), heights = new Float32Array(resolution * resolution);
  const period = resolution - 1, seed = profile === "frond" ? 0x73af : 0xdec2;
  for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
    const u = x / period, v = y / period, speckle = grain(x % period, y % period, seed);
    const broad = .5 + .5 * Math.sin(TAU * (u * 3 + v * 2) + Math.sin(TAU * (u - v * 2)) * 1.7);
    const small = .5 + .5 * Math.sin(TAU * (u * 19 - v * 13) + Math.sin(TAU * (u * 7 + v * 5)) * .8);
    const midrib = Math.exp(-(((u - .5) / .027) ** 2));
    const phase = v * 13 + Math.abs(u - .5) * 5 + Math.sin(TAU * v * 3) * .08;
    const vein = Math.exp(-((Math.sin(TAU * phase) / .16) ** 2));
    const cell = Math.max(0, Math.sin(TAU * (u * 31 + v * 11)) * Math.sin(TAU * (v * 29 - u * 7)));
    const pore = speckle < .065 ? (1 - speckle / .065) : 0;
    const pigment = profile === "frond" ? .78 + broad * .19 + vein * .045 - pore * .075
      : .76 + broad * .19 + cell * .055 - pore * .07;
    const rough = profile === "frond" ? .48 + small * .22 + speckle * .09 - vein * .065
      : .43 + broad * .19 + small * .15 - cell * .045;
    heights[y * resolution + x] = profile === "frond"
      ? .35 + midrib * .13 + vein * .027 + small * .012 - pore * .015
      : .35 + cell * .027 + small * .018 + broad * .018 - pore * .022;
    const index = (y * resolution + x) * 4;
    const value = Math.round(clamp(pigment) * 255), matte = Math.round(clamp(rough) * 255);
    color.set([value, value, value, 255], index); roughness.set([matte, matte, matte, 255], index);
  }
  const at = (x, y) => heights[wrap(y, period) * resolution + wrap(x, period)];
  for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
    const nx = -(at(x + 1, y) - at(x - 1, y)) * 8, ny = -(at(x, y + 1) - at(x, y - 1)) * 8;
    const length = Math.hypot(nx, ny, 1), index = (y * resolution + x) * 4;
    normal.set([Math.round((nx / length * .5 + .5) * 255),
      Math.round((ny / length * .5 + .5) * 255), Math.round((.5 / length + .5) * 255), 255], index);
  }
  return { color, normal, roughness };
}

/** One renderer owns these maps; all species of the same tissue share them. */
export function createPlantSurfaceMaps(profile, resolution = 128) {
  const pixels = buildPlantSurfacePixels(profile, resolution);
  const texture = (bytes, color = false) => {
    const map = new THREE.DataTexture(bytes, resolution, resolution, THREE.RGBAFormat);
    map.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.minFilter = THREE.LinearMipmapLinearFilter; map.magFilter = THREE.LinearFilter;
    map.generateMipmaps = true; map.anisotropy = 2; map.needsUpdate = true;
    map.userData.plantProfile = profile;
    return map;
  };
  const map = texture(pixels.color, true), normalMap = texture(pixels.normal), roughnessMap = texture(pixels.roughness);
  const textures = [map, normalMap, roughnessMap]; let disposed = false;
  return { map, normalMap, roughnessMap, textures, dispose() {
    if (disposed) return; disposed = true; textures.forEach((entry) => entry.dispose());
  } };
}
