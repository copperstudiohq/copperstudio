import * as THREE from './vendor/three.module.js';

export const FIRST_PERSON_UNDERWATER_SPOT_GAIN = .035;
export const firstPersonSpotlightGain = { value: 1 };
// The suit lamp is currently the scene's only spotlight. Keep this explicit
// slot synchronized if another spotlight is introduced or reordered later.
export const firstPersonSuitSpotlightIndex = { value: 0 };
const applied = new WeakSet();
const SPOT_INFO = 'getSpotLightInfo( spotLight, geometryPosition, directLight );';
const LIGHT_CHUNK = '#include <lights_fragment_begin>';

/** Scene supplies its existing underwater state; material colors and all
 * above-water lighting remain unchanged. No new light or render pass is used.
 */
export function setFirstPersonSubmerged(underwater) {
  firstPersonSpotlightGain.value = underwater ? FIRST_PERSON_UNDERWATER_SPOT_GAIN : 1;
}

/** Limit only the suit spotlight's contribution to camera-local supplies.
 * Ambient, sun, point lights, emissive color and world materials are untouched.
 * Uniform objects are shared, including models created after a slot switch.
 * @param {THREE.MeshStandardMaterial} material
 */
export function applyFirstPersonLighting(material) {
  if (!material?.isMeshStandardMaterial || !material.userData?.firstPerson || applied.has(material)) return;
  const previous = material.onBeforeCompile.bind(material), previousKey = material.customProgramCacheKey();
  const lighting = THREE.ShaderChunk.lights_fragment_begin;
  if (!lighting.includes(SPOT_INFO)) throw new Error('First-person lighting needs the supported Three spotlight shader.');
  const adjustment = `${SPOT_INFO}\nif ( UNROLLED_LOOP_INDEX == firstPersonSuitSpotlightIndex ) directLight.color *= firstPersonSpotlightGain;`;
  const adjustedLighting = lighting.replace(SPOT_INFO, adjustment);
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    shader.uniforms.firstPersonSpotlightGain = firstPersonSpotlightGain;
    shader.uniforms.firstPersonSuitSpotlightIndex = firstPersonSuitSpotlightIndex;
    const fragment = shader.fragmentShader.includes(LIGHT_CHUNK)
      ? shader.fragmentShader.replace(LIGHT_CHUNK, adjustedLighting)
      : shader.fragmentShader.replace(SPOT_INFO, adjustment);
    shader.fragmentShader = `uniform float firstPersonSpotlightGain;\nuniform int firstPersonSuitSpotlightIndex;\n${fragment}`;
  };
  material.customProgramCacheKey = () => `${previousKey}|croba-first-person-suit-spot-v1`;
  material.needsUpdate = true; applied.add(material);
}
