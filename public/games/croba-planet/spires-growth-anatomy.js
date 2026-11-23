import * as THREE from './vendor/three.module.js';
import { PlantMesh } from './plant-mesh.js';
import { applyMossSurface } from './moss-surface.js';
import { applyMossFuzz } from './moss-fuzz.js';
export { createCrobonMossGeometry as createCrobonMossCushionGeometry } from './crobon-moss-anatomy.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

/** A submerged cluster of smooth, cupped blue/plum fronds and curved stems. */
export function createSpiresMarinePlantGeometry() {
  const mesh = new PlantMesh();
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.3999632297, length = .5 + (i % 3) * .15;
    const root = V(Math.cos(angle) * .055, .015, Math.sin(angle) * .055);
    const tip = V(Math.cos(angle) * (.25 + i % 2 * .09), length, Math.sin(angle) * .31);
    const mid = root.clone().lerp(tip, .45).add(V(-Math.sin(angle) * .09, .035, Math.cos(angle) * .09));
    mesh.tube([root, mid, tip], [.017,.012,.0018], 0x293c69, 5);
    mesh.leaf(root.clone().lerp(tip, .1), tip, .085 + i % 3 * .016,
      (u, v) => new THREE.Color(i % 3 ? 0x203d68 : 0x462252)
        .lerp(new THREE.Color(i % 3 ? 0x486d96 : 0x78488e), u * .5 + Math.abs(v - .5) * .12).getHex(),
      { segments: 8, columns: 4, curve: .065, cup: .24, twist: .22, glow: .06 });
  }
  const geometry = mesh.geometry({ normalizeHeight: false });
  geometry.userData = { anatomy: 'smooth curved submerged blue and plum foliage', fronds: 7 };
  return geometry;
}

/** Emission lives on the moss surface; it adds no light, halo or transparency. */
export function createSpiresGrowthMaterial(kind, time) {
  const moss = kind !== 'plant';
  const material = new THREE.MeshStandardMaterial({ name: `spires-${kind}`, color: 0xffffff,
    vertexColors: true, roughness: .94, metalness: 0, side: THREE.DoubleSide,
    emissive: moss ? 0x7a329f : 0x19273c, emissiveIntensity: moss ? .54 : .08 });
  material.forceSinglePass = true;
  material.onBeforeCompile = shader => {
    shader.uniforms.spiresGrowthTime = time;
    shader.vertexShader = 'uniform float spiresGrowthTime; attribute float plantGlow; varying float vSpiresGlow;\n'
      + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vSpiresGlow = plantGlow;
      float phase = spiresGrowthTime * .65 + instanceMatrix[3].x * .31 + instanceMatrix[3].z * .19;
      float bend = ${moss ? 'clamp(position.y - .12, 0., .15)' : 'position.y * position.y'};
      transformed.x += sin(phase) * bend * ${moss ? '.05' : '.045'};
      transformed.z += cos(phase * .83) * bend * ${moss ? '.04' : '.035'};`);
    shader.fragmentShader = 'varying float vSpiresGlow;\n' + shader.fragmentShader
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance *= ${moss
        ? '.035 + pow(clamp(vSpiresGlow, 0., 1.), 1.5) * .65'
        : '.55 + vSpiresGlow * .45'};`);
  };
  material.customProgramCacheKey = () => `spires-${kind}-growth-v2`;
  if(moss){applyMossSurface(material,{strength:1,emissionDetail:.35});applyMossFuzz(material);}
  return material;
}
