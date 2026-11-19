/** Shared appearance codes also work on the non-instanced physical tubes. */
export function redFishAppearance(fish) { return fish.variant === 'gray' ? 1 : fish.variant === 'glow' ? 2 : 0; }

/** A thin wet film over saturated tissue. Patterning is local to each fish,
 * so markings stay attached while it swims; emission uses no scene lights. */
export function applyRedFishSkin(material, physicalTendrils = false) {
  const previous = material.onBeforeCompile.bind(material), key = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = shader => {
    previous(shader);
    shader.vertexShader = 'attribute float fishAppearance; varying float vFishAppearance; varying vec3 vFishSkin;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vFishAppearance=fishAppearance;
      vFishSkin=${physicalTendrils ? 'vec3(uv.x*.08,uv.y*.7,uv.y)' : 'position'};`);
    shader.fragmentShader = 'varying float vFishAppearance; varying vec3 vFishSkin;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float fishMarble=sin(vFishSkin.z*27.+sin(vFishSkin.y*21.)*1.8+sin(vFishSkin.x*39.)*.7);
      float fishPattern=smoothstep(.27,.66,fishMarble);
      if(vFishAppearance>.5&&vFishAppearance<1.5){
        vec3 grayTissue=vec3(.16,.19,.20)*(.82+.18*sin(vFishSkin.y*57.));
        diffuseColor.rgb=mix(diffuseColor.rgb,grayTissue,fishPattern*.91);
      }
      if(vFishAppearance>1.5)diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.065,.006,.16),.94);`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      if(vFishAppearance>1.5)totalEmissiveRadiance+=vec3(.19,.008,.46)*(.42+.58*fishPattern);`);
  };
  material.customProgramCacheKey = () => `${key()}|red-fish-wet-patterns-v1|${physicalTendrils ? 'tube' : 'body'}`;
  return material;
}
