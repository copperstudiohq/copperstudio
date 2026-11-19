const finished=new WeakSet();

/** Soften the final part of the real drawing range into the existing fog color.
 * Call after applyWaterMedium; its world-position varying is reused, so this
 * adds no extra vertex varying, texture, pass or global backdrop fog. */
export function applyRenderDistanceFade(material,range){
 if(!material?.isMeshStandardMaterial||material.fog===false||finished.has(material))return;
 finished.add(material);
 const previous=material.onBeforeCompile.bind(material),cache=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=(shader,renderer)=>{
  previous(shader,renderer);
  shader.uniforms.crobaRenderDistance=range;
  shader.fragmentShader=`uniform float crobaRenderDistance;\n${shader.fragmentShader}`
   .replace('#include <fog_fragment>',`#include <fog_fragment>
    #ifdef USE_FOG
    float crobaDistanceBlend=smoothstep(crobaRenderDistance*.78,crobaRenderDistance,mediumDistance);
    gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,crobaDistanceBlend);
    #endif`);
 };
 material.customProgramCacheKey=()=>`${cache()}|croba-render-distance-fade-v1`;material.needsUpdate=true;
}
