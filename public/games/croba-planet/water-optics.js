/** Shared artistic ocean optics, informed by light absorption and suspended
 * material in real seawater. Distances use render metres. This is a bounded
 * game approximation, not a calibrated oceanographic radiative-transfer model. */
export const WATER_OPTICS=Object.freeze({
 absorption:Object.freeze([.10,.055,.035]),
 scatter:Object.freeze([.012,.035,.048]),
 sulfurAbsorption:Object.freeze([.075,.085,.11]),
 sulfurScatter:Object.freeze([.045,.040,.015]),
 surfaceAbsorption:Object.freeze([.22,.09,.055]),
 arcticSurfaceOpacity:.88,oceanSurfaceOpacity:.97,shoreSurfaceOpacity:.78,underSurfaceOpacity:.56,
 caveSurfaceOpacity:.96,sunlightDepth:24,causticDepth:18,
});

/** Denser coastal and vegetated water; blue ocean stays bluer but has limited
 * visibility too. Shell Field remains bright nearby while distant detail fades.
 * @param {string} biome @param {number} [depth] @param {number} [shellBlend]
 * @param {boolean} [sulfuric] @returns {number}
 */
export function getWaterFogDensity(biome,depth=0,shellBlend=0,sulfuric=false){
 const d=Number.isFinite(depth)?Math.max(0,depth):0;
 const blend=Number.isFinite(shellBlend)?Math.max(0,Math.min(1,shellBlend)):0;
 if(sulfuric||biome==='salt-cave')return .08;
 const base=(biome==='blue-ocean'||biome==='shell-field'||biome==='jellyfish-spires') ? .041+.009*(1-Math.exp(-d/45))
  : biome==='blue-kelp-forest' ? .070 : biome==='orange-grass-field' ? .072 : biome==='cliff-biome' ? .064 : .062;
 return base+(.052-base)*blend;
}

/** Shader literals keep the surface and material medium on the same palette. */
export const waterOpticsVec3=values=>`vec3(${values.map(value=>value.toFixed(3)).join(',')})`;
