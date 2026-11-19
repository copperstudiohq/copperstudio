import * as THREE from './assets/three.module.js';
import { generateTriTerrain } from './tri-terrain.js';
import { createSurfaceTextures, disposeSurfaceTextures } from './surface-textures.js';
import { createColosseumTextures, disposeColosseumTextures } from './colosseum-textures.js';
import { createDrillMineTextures, disposeDrillMineTextures, DRILL_MINE_TEXTURE_WORLD_SCALE } from './drill-mine-textures.js';

const ownedTextures = new Set();
let groundMaps;
const WORLD_SCALE = Object.freeze({ copper: 2.8, 'colosseum-copper': 2.8, 'drill-mine-rock': DRILL_MINE_TEXTURE_WORLD_SCALE, bone: 1.2, flesh: 3.2, stone: 3.5 });
const FINISH = Object.freeze({
  copper: { roughness: 0.78, metalness: 0.62, bumpScale: 0.035 },
  'colosseum-copper': { roughness: 0.78, metalness: 0.65, bumpScale: 0.025, flatShading: true },
  'drill-mine-rock': { roughness: .94, metalness: .03, bumpScale: .085, flatShading: true },
  bone: { roughness: 0.94, metalness: 0, bumpScale: 0.025 },
  flesh: { roughness: 0.86, metalness: 0.025, bumpScale: 0.055 },
  stone: { roughness: 0.98, metalness: 0.03, bumpScale: 0.065 },
});

function texture(data, width, height, name, color = false) {
  const result = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  result.name = name;
  result.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  result.wrapS = result.wrapT = THREE.RepeatWrapping;
  result.magFilter = THREE.NearestFilter;
  result.minFilter = THREE.LinearMipmapLinearFilter;
  result.generateMipmaps = true;
  result.needsUpdate = true;
  ownedTextures.add(result);
  return result;
}

function terrainMaps() {
  if (groundMaps) return groundMaps;
  const data = generateTriTerrain();
  groundMaps = {
    map: texture(data.albedo, data.width, data.height, 'tri-living-flesh-color', true),
    bumpMap: texture(data.bump, data.width, data.height, 'tri-folds-veins-pores-relief'),
    roughnessMap: texture(data.roughness, data.width, data.height, 'tri-wet-and-dry-surface'),
    emissiveMap: texture(data.emissive, data.width, data.height, 'tri-faint-blue-vein-light', true),
  };
  return groundMaps;
}

/** A continuous arena-sized skin. Distant ground repeats at the same world density. */
export function createTriGroundMaterial({ repeatX = 1, repeatY = 1 } = {}) {
  if (![repeatX, repeatY].every(value => Number.isFinite(value) && value > 0)) throw new RangeError('Ground texture repeats must be positive finite numbers.');
  const maps = { ...terrainMaps() };
  if (repeatX !== 1 || repeatY !== 1) for (const name of Object.keys(maps)) {
    const repeated = maps[name].clone();
    repeated.repeat.set(repeatX, repeatY);
    repeated.needsUpdate = true;
    ownedTextures.add(repeated);
    maps[name] = repeated;
  }
  const material = new THREE.MeshStandardMaterial({
    ...maps, color: 0xffffff, metalness: 0.025, roughness: 0.91,
    bumpScale: 0.12, displacementMap: maps.bumpMap, displacementScale: 0.022,
    emissive: 0xffffff, emissiveIntensity: 0.16,
  });
  material.name = 'living-tri-ground';
  return material;
}

export function createWorldMaterial(kind, color) {
  if (!Object.hasOwn(FINISH, kind)) throw new RangeError(`Unknown world surface: ${String(kind)}`);
  const finish = FINISH[kind];
  const maps = kind === 'colosseum-copper' ? createColosseumTextures()
    : kind === 'drill-mine-rock' ? createDrillMineTextures() : createSurfaceTextures(kind);
  const material = new THREE.MeshStandardMaterial({ ...maps, ...finish, color });
  material.name = `weathered-${kind}`;
  return material;
}

/** Keep texel density constant on long rails, small blocks, and bone shafts. */
export function createSurfaceBoxGeometry(width, height, depth, kind, x = 0, y = 0, z = 0) {
  if (!Object.hasOwn(WORLD_SCALE, kind)) throw new RangeError(`Unknown world surface: ${String(kind)}`);
  const scale = WORLD_SCALE[kind];
  if (![width, height, depth].every(value => Number.isFinite(value) && value > 0)) throw new RangeError('Surface box dimensions must be positive and finite.');
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const points = geometry.attributes.position, normals = geometry.attributes.normal, uv = geometry.attributes.uv;
  for (let index = 0; index < points.count; index++) {
    const wx = x + points.getX(index) * width;
    const wy = y + points.getY(index) * height;
    const wz = z + points.getZ(index) * depth;
    if (Math.abs(normals.getY(index)) > 0.5) uv.setXY(index, wx / scale, wz / scale);
    else if (Math.abs(normals.getX(index)) > 0.5) uv.setXY(index, wz / scale, wy / scale);
    else uv.setXY(index, wx / scale, wy / scale);
  }
  uv.needsUpdate = true;
  return geometry;
}

export function disposeArenaTextures() {
  for (const item of ownedTextures) item.dispose();
  ownedTextures.clear();
  groundMaps = undefined;
  disposeSurfaceTextures();
  disposeColosseumTextures();
  disposeDrillMineTextures();
}
