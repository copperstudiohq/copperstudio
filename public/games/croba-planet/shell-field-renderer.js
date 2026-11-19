import * as THREE from './vendor/three.module.js';
import {shellFieldBlend} from './shell-field.js';

/** Retain existing relief/maps and blend only the private biome materials to
 * warm pale stone. Zero masks leave the original albedo exactly untouched. */
export function applyShellFieldSurface(material,texture=null,normalTexture=null,armorPatches=false){
  const previous=material.onBeforeCompile.bind(material),cacheKey=material.customProgramCacheKey.bind(material);
  const previousKey=cacheKey();
  material.onBeforeCompile=shader=>{
    previous(shader);
    shader.uniforms.shellFieldColor={value:new THREE.Color(0xe0bda5)};
    shader.uniforms.shellFieldMap={value:texture};shader.uniforms.shellFieldHasMap={value:texture?1:0};
    shader.uniforms.shellFieldNormalMap={value:normalTexture};shader.uniforms.shellFieldHasNormal={value:normalTexture?1:0};
    shader.vertexShader=`attribute float shellFieldBlend;${armorPatches?'attribute float shellFieldArmor;':''}varying float vShellFieldBlend;varying float vShellFieldArmor;varying vec3 vShellFieldWorld;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        vShellFieldBlend=shellFieldBlend;vShellFieldArmor=${armorPatches?'shellFieldArmor':'0.'};vec4 shellPosition=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          shellPosition=instanceMatrix*shellPosition;
        #endif
        vShellFieldWorld=(modelMatrix*shellPosition).xyz;`);
    shader.fragmentShader=`uniform vec3 shellFieldColor;uniform sampler2D shellFieldMap,shellFieldNormalMap;uniform float shellFieldHasMap,shellFieldHasNormal;varying float vShellFieldBlend;varying float vShellFieldArmor;varying vec3 vShellFieldWorld;
      vec2 shellAtlasUv(vec2 uv,float tile){return vec2((tile+(fract(uv.x)*127.+.5)/128.)*.5,(fract(uv.y)*127.+.5)/128.);}
      \n${shader.fragmentShader}`
      .replace('#include <color_fragment>',`#include <color_fragment>
        if(vShellFieldBlend>0.){
          float shellGrain=clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)),0.,1.);
          vec3 paleStone=shellFieldColor;
          if(shellFieldHasMap>.5){
            paleStone=texture2D(shellFieldMap,shellAtlasUv(vShellFieldWorld.xz*.22+vShellFieldWorld.y*vec2(.07,.13),0.)).rgb;
            if(vShellFieldArmor>0.){
              vec3 armor=texture2D(shellFieldMap,shellAtlasUv(vShellFieldWorld.xz*.13+vShellFieldWorld.y*.03,1.)).rgb;
              paleStone=mix(paleStone,armor,clamp(vShellFieldArmor,0.,1.));
            }
          }
          diffuseColor.rgb=mix(diffuseColor.rgb,paleStone*(.86+shellGrain*.25),vShellFieldBlend);
        }`)
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,mix(.87,.8,clamp(vShellFieldArmor,0.,1.)),vShellFieldBlend);')
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        #ifdef USE_NORMALMAP_TANGENTSPACE
          if(vShellFieldBlend>0.&&shellFieldHasNormal>.5){
            vec3 shellNormal=texture2D(shellFieldNormalMap,shellAtlasUv(vShellFieldWorld.xz*.22+vShellFieldWorld.y*vec2(.07,.13),0.)).xyz*2.-1.;
            if(vShellFieldArmor>0.){
              vec3 armorNormal=texture2D(shellFieldNormalMap,shellAtlasUv(vShellFieldWorld.xz*.13+vShellFieldWorld.y*.03,1.)).xyz*2.-1.;
              shellNormal=normalize(mix(shellNormal,armorNormal,clamp(vShellFieldArmor,0.,1.)));
            }
            shellNormal.xy*=mix(.55,.85,clamp(vShellFieldArmor,0.,1.));normal=normalize(mix(normal,tbn*shellNormal,vShellFieldBlend));
          }
        #endif`);
  };
  material.customProgramCacheKey=()=>`${previousKey}|shell-field-stone-armor-v3:${armorPatches?1:0}`;
  // The normal Scene disposal traversal discovers this shared owned texture.
  if(texture)material.shellFieldMap=texture;
  if(normalTexture)material.shellFieldNormalMap=normalTexture;
  return material;
}

/** World-space border vertices; fade pale stone out above the waterline. */
export function addShellFieldBorderMask(geometry){
  const positions=geometry.attributes.position,mask=new Uint8Array(positions.count);
  for(let index=0;index<positions.count;index++){
    const height=positions.getY(index)*25;
    const underwater=Math.max(0,Math.min(1,(-15-height)/100));
    mask[index]=Math.round(255*underwater*shellFieldBlend(positions.getX(index)*25,positions.getZ(index)*25));
  }
  geometry.setAttribute('shellFieldBlend',new THREE.BufferAttribute(mask,1,true));
  return geometry;
}
