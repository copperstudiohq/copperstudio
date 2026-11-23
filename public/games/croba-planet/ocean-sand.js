import * as THREE from './vendor/three.module.js';
import {WATER_LEVEL} from './terrain.js';
import {shellFieldBlend} from './shell-field.js';
import {seabedGravelBlend} from './seabed-gravel.js';

const LEVEL=WATER_LEVEL/25;

/** Only submerged non-gravel sediment; the armor shelf and geography stay intact. */
export function addNaturalSandMask(geometry){
  if(!geometry?.isBufferGeometry||geometry.attributes.position?.itemSize!==3)
    throw new TypeError('Sand relief needs an existing XYZ BufferGeometry.');
  const p=geometry.attributes.position,mask=new Uint8Array(p.count);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i)*25,y=p.getZ(i)*25;
    mask[i]=p.getY(i)<LEVEL-.12?Math.round(255*(1-seabedGravelBlend(x,y))*(1-shellFieldBlend(x,y))):0;
  }
  geometry.setAttribute('naturalSandBlend',new THREE.BufferAttribute(mask,1,true));return geometry;
}

/** Centimetre-scale ripple normals over the original sand textures, using the existing
 * floor draw. World-space detail avoids UV stretch and distant shimmer. */
export function applyNaturalSandSurface(material){
  if(!material?.isMeshStandardMaterial||material.userData.naturalSandRelief)return material;
  const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
  material.onBeforeCompile=shader=>{
    previous(shader);
    shader.vertexShader=`attribute float naturalSandBlend;varying float vNaturalSandBlend;varying vec3 vNaturalSandWorld;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        vNaturalSandBlend=naturalSandBlend;vNaturalSandWorld=(modelMatrix*vec4(transformed,1.)).xyz;`);
    shader.fragmentShader=`varying float vNaturalSandBlend;varying vec3 vNaturalSandWorld;\n${shader.fragmentShader}`
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec3 sandFace=normalize(cross(dFdx(vNaturalSandWorld),dFdy(vNaturalSandWorld)));
        float naturalSandMask=vNaturalSandBlend*smoothstep(.60,.93,abs(sandFace.y));
        vec2 sandPoint=vNaturalSandWorld.xz;
`)
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.88,naturalSandMask);')
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        float sandBend=sandPoint.x*.23-sandPoint.y*.31;
        float ripple=sandPoint.x*11.+sandPoint.y*2.1+sin(sandPoint.y*.6)*.9+sin(sandBend)*1.2;
        vec2 rippleSlope=-sin(ripple)*.006*vec2(11.+cos(sandBend)*.276,2.1+cos(sandPoint.y*.6)*.54-cos(sandBend)*.372);
        float rippleAA=1.-smoothstep(.5,2.,fwidth(ripple));
        vec3 sandGradient=vec3(rippleSlope.x*rippleAA,0.,rippleSlope.y*rippleAA);
        normal=normalize(normal-mat3(viewMatrix)*sandGradient*naturalSandMask);`);
  };
  material.customProgramCacheKey=()=>`${key}|natural-marine-sand-v213`;
  material.userData.naturalSandRelief=true;
  return material;
}
