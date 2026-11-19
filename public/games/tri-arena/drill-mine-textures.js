import * as THREE from './assets/three.module.js';

export const DRILL_MINE_TEXTURE_WORLD_SCALE = 6.4;
export const DRILL_MINE_TEXTURE_SIZE = 32;
const SIZE = DRILL_MINE_TEXTURE_SIZE;
const PALETTE = [[112, 124, 132], [122, 133, 140], [132, 143, 150], [143, 153, 160]];
let cached;

function hash(x, y) { return Math.imul(x + 71, 73856093) ^ Math.imul(y + 113, 19349663); }
function makeTexture(data, name, color = false) {
  const texture = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  texture.name = `drill-mine-pixel-${name}`;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.generateMipmaps = true; texture.needsUpdate = true;
  return texture;
}

/** Broad connected mineral patches retain square .2m pixels without dark borders. */
export function createDrillMineTextures() {
  if (cached) return cached;
  const albedo = new Uint8Array(SIZE * SIZE * 4), bump = albedo.slice(), roughness = albedo.slice();
  const patches = [];
  for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) {
    const seed = hash(column, row) >>> 0;
    patches.push({ x: column * 8 + 2 + (seed >>> 4) % 5,
      y: row * 8 + 2 + (seed >>> 12) % 5, shade: (seed >>> 9) % PALETTE.length });
  }
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const px = Math.floor(x / 2) * 2 + 1, py = Math.floor(y / 2) * 2 + 1;
    let nearest = Infinity, shade = 0;
    for (const patch of patches) {
      const xDistance = Math.abs(px - patch.x), yDistance = Math.abs(py - patch.y);
      const dx = Math.min(xDistance, SIZE - xDistance), dy = Math.min(yDistance, SIZE - yDistance);
      const distance = dx * dx + dy * dy;
      if (distance < nearest) { nearest = distance; shade = patch.shade; }
    }
    const rgb = PALETTE[shade], relief = 124 + shade * 3;
    const offset = (y * SIZE + x) * 4;
    for (let channel = 0; channel < 3; channel++) {
      albedo[offset + channel] = rgb[channel]; bump[offset + channel] = relief;
      roughness[offset + channel] = 220 + shade * 3;
    }
    albedo[offset + 3] = bump[offset + 3] = roughness[offset + 3] = 255;
  }
  cached = Object.freeze({ map: makeTexture(albedo, 'shale', true), bumpMap: makeTexture(bump, 'relief'),
    roughnessMap: makeTexture(roughness, 'roughness') });
  return cached;
}

export function disposeDrillMineTextures() {
  if (!cached) return;
  for (const texture of Object.values(cached)) texture.dispose();
  cached = undefined;
}
