import * as THREE from './assets/three.module.js';

const SIZE = 32;
// Neutral plate multipliers preserve each caller's copper tint. Oxidation is
// deliberately sparse; every channel shares the same square-edged features.
const PALETTE = [
  { color: [104, 107, 106], height: 64, roughness: 245 },
  { color: [143, 147, 142], height: 112, roughness: 226 },
  { color: [211, 209, 198], height: 145, roughness: 205 },
  { color: [231, 227, 213], height: 150, roughness: 194 },
  { color: [194, 195, 187], height: 139, roughness: 217 },
  { color: [249, 242, 221], height: 168, roughness: 169 },
  { color: [244, 235, 212], height: 154, roughness: 156 },
  { color: [76, 185, 188], height: 121, roughness: 238 },
];
let cached;

function hash(x, y) {
  const value = Math.imul(x + 17, 374761393) ^ Math.imul(y + 41, 668265263);
  return (value ^ (value >>> 13)) >>> 0;
}

function platePixel(x, y) {
  const localX = x % 16, localY = y % 16;
  if (localX === 0 || localY === 0 || localX === 15 || localY === 15) return PALETTE[0];
  if (localX === 1 || localY === 1) return PALETTE[5];
  if (localX === 14 || localY === 14) return PALETTE[1];
  const plateX = x >> 4, plateY = y >> 4;
  const block = hash(x >> 1, y >> 1);
  if (block % 29 === 0) return PALETTE[7];
  const wearX = 4 + ((plateX * 3 + plateY) % 3) * 2;
  const wearY = 4 + ((plateY * 2 + plateX) % 4) * 2;
  if (localY >= wearY && localY < wearY + 2 && localX >= wearX && localX < wearX + 4) return PALETTE[6];
  return PALETTE[block % 7 === 0 ? 4 : (plateX + plateY) % 2 ? 3 : 2];
}

function makeTexture(channel, bytes) {
  const texture = new THREE.DataTexture(bytes, SIZE, SIZE, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.name = `colosseum-copper-${channel}`;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = channel === 'albedo' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

/** Cached low-resolution plates. Clone a texture before changing its UV transform. */
export function createColosseumTextures() {
  if (cached) return cached;
  const albedo = new Uint8Array(SIZE * SIZE * 4), relief = new Uint8Array(albedo.length), roughness = new Uint8Array(albedo.length);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const pixel = platePixel(x, y), index = (y * SIZE + x) * 4;
    albedo.set(pixel.color, index);
    for (let channel = 0; channel < 3; channel++) { relief[index + channel] = pixel.height; roughness[index + channel] = pixel.roughness; }
    albedo[index + 3] = relief[index + 3] = roughness[index + 3] = 255;
  }
  cached = Object.freeze({ map: makeTexture('albedo', albedo), bumpMap: makeTexture('relief', relief), roughnessMap: makeTexture('roughness', roughness) });
  return cached;
}

export function disposeColosseumTextures() {
  if (!cached) return;
  for (const texture of Object.values(cached)) texture.dispose();
  cached = undefined;
}
