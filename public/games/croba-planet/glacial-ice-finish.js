import {WATER_LEVEL} from './terrain.js';

const finished=new WeakSet();
const GLACIAL_FIELD=`
varying vec3 vGlacialWorld;
uniform float glacialSnowMode,glacialWaterLevel;
float glacialHash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float glacialNoise(vec2 p){
 vec2 cell=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(glacialHash(cell),glacialHash(cell+vec2(1.,0.)),f.x),
  mix(glacialHash(cell+vec2(0.,1.)),glacialHash(cell+vec2(1.)),f.x),f.y);
}`;

/** An opaque, static ice/snow finish composed with the material's existing
 * maps and hooks. Snow keeps its original albedo; dense ice and frost have
 * different light responses, with a narrow smoother wet edge at the waterline.
 * Call for each actual ice/snow material, including clones: Three.js copies
 * userData but does not copy shader hooks. No geometry or texture is allocated.
 * @param {import('./vendor/three.module.js').MeshStandardMaterial} material
 * @param {{snow?:boolean}} [options]
 */
export function applyGlacialIceFinish(material,{snow=false}={}){
 if(!material?.isMeshStandardMaterial||finished.has(material))return material;
 finished.add(material);
 const previous=material.onBeforeCompile.bind(material),previousKey=material.customProgramCacheKey();
 material.onBeforeCompile=shader=>{
  previous(shader);
  shader.uniforms.glacialSnowMode={value:snow?1:0};
  shader.uniforms.glacialWaterLevel={value:Number.isFinite(material.userData?.waterLevel)?material.userData.waterLevel:WATER_LEVEL/25};
  shader.vertexShader=`varying vec3 vGlacialWorld;\n${shader.vertexShader}`.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
   vec4 glacialWorldPoint=vec4(transformed,1.);
   #ifdef USE_INSTANCING
    glacialWorldPoint=instanceMatrix*glacialWorldPoint;
   #endif
   vGlacialWorld=(modelMatrix*glacialWorldPoint).xyz;`);
  shader.fragmentShader=`${GLACIAL_FIELD}\n${shader.fragmentShader}`.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   // Geometric normals keep the projected field and frost stable when the
   // existing fine normal map changes. Retain its mapped normal for lighting.
   vec3 glacialNormal=inverseTransformDirection(normal,viewMatrix);
   vec3 glacialSurfaceNormal=inverseTransformDirection(nonPerturbedNormal,viewMatrix);
   vec3 glacialAxis=abs(glacialSurfaceNormal);
   vec2 glacialFace=glacialAxis.y>.65?vGlacialWorld.xz:
    (glacialAxis.x>glacialAxis.z?vGlacialWorld.zy:vGlacialWorld.xy);
   float glacialMacro=glacialNoise(vGlacialWorld.xz*.047+vGlacialWorld.y*.013);
   float glacialWarp=glacialNoise(glacialFace*.058+vec2(31.7,9.2));
   vec2 glacialDomain=glacialFace*.16+vec2(glacialMacro*1.7,glacialWarp*1.4);
   float glacialPrimary=glacialNoise(glacialDomain);
   float glacialBranch=glacialNoise(glacialDomain*1.81+vec2(13.7,glacialMacro*3.1));
   // Warped level sets and short secondary branches avoid repeating straight
   // decorative stripes. Compression layers stay a faint internal variation.
   float glacialPrimaryWidth=max(fwidth(glacialPrimary),.0001);
   float glacialBranchWidth=max(fwidth(glacialBranch),.0001);
   float glacialCrackAA=glacialPrimaryWidth*.5,glacialForkAA=glacialBranchWidth*.5;
   float glacialCrack=(1.-smoothstep(.012-glacialCrackAA,.042+glacialCrackAA,abs(glacialPrimary-.51)))
    *min(1.,.030/glacialPrimaryWidth);
   float glacialFork=(1.-smoothstep(.009-glacialForkAA,.028+glacialForkAA,abs(glacialBranch-.57)))
    *min(1.,.019/glacialBranchWidth)*smoothstep(.40,.64,glacialPrimary);
   float glacialFracture=max(glacialCrack,glacialFork*.7);
   // Differentiate an unfiltered height, then fade its relief separately.
   // Differentiating the coverage above would take derivatives of derivatives.
   float glacialRawCrack=1.-smoothstep(.012,.042,abs(glacialPrimary-.51));
   float glacialRawFork=(1.-smoothstep(.009,.028,abs(glacialBranch-.57)))*smoothstep(.40,.64,glacialPrimary);
   float glacialRawFracture=max(glacialRawCrack,glacialRawFork*.7);
   float glacialCompression=.5+.5*sin(vGlacialWorld.y*.72+vGlacialWorld.x*.018+glacialMacro*6.2);
   float glacialUp=clamp(glacialSurfaceNormal.y,0.,1.);
   float glacialWet=1.-smoothstep(.12,1.15,abs(vGlacialWorld.y-glacialWaterLevel));
   float glacialSubmerged=1.-smoothstep(glacialWaterLevel-1.4,glacialWaterLevel+.25,vGlacialWorld.y);
   float glacialFrost=smoothstep(.18,.82,glacialUp)*(.70+.30*glacialWarp);
   float glacialBubble=clamp(.30+glacialFrost*.65+glacialMacro*.12+glacialCompression*.035-glacialSubmerged*.20,0.,1.);
   float glacialSnowDrape=clamp(.68+glacialUp*.24-(glacialMacro-.5)*.28,0.,1.);
   glacialBubble=mix(glacialBubble,glacialSnowDrape,glacialSnowMode);
   vec3 glacialDense=vec3(.20,.43,.56),glacialPale=vec3(.84,.91,.94);
   vec3 glacialIce=mix(glacialDense,glacialPale,glacialBubble);
   glacialIce=mix(glacialIce,vec3(.13,.33,.45),glacialFracture*(1.-glacialFrost*.6)*.16);
   float glacialGrain=clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)),.18,1.);
   glacialIce*=.86+.14*glacialGrain;
   diffuseColor.rgb=mix(diffuseColor.rgb,glacialIce,.24*(1.-glacialSnowMode));
   diffuseColor.rgb*=1.-glacialWet*.035*(1.-glacialSnowMode);
   // Shallow optical relief catches light along fracture lips without moving
   // physical vertices. Derivatives avoid additional noise or texture samples.
   float glacialRelief=(-glacialRawFracture*.018+glacialWarp*.004)*(1.-glacialFrost*.55)*(1.-glacialSnowMode);
   vec3 glacialDx=dFdx(vGlacialWorld),glacialDy=dFdy(vGlacialWorld);
   vec3 glacialRx=cross(glacialDy,glacialNormal),glacialRy=cross(glacialNormal,glacialDx);
   float glacialDet=dot(glacialDx,glacialRx);
   vec3 glacialGradient=sign(glacialDet)*(dFdx(glacialRelief)*glacialRx+dFdy(glacialRelief)*glacialRy)/max(abs(glacialDet),.000001);
   glacialGradient*=1.-smoothstep(.025,.12,max(glacialPrimaryWidth,glacialBranchWidth));
   glacialGradient=clamp(glacialGradient,vec3(-.25),vec3(.25));
   normal=normalize(mat3(viewMatrix)*(glacialNormal-glacialGradient));
   float glacialRoughness=mix(.23,.84,glacialFrost);
   glacialRoughness=mix(glacialRoughness,.88,glacialSnowMode);
   glacialRoughness=mix(glacialRoughness,.16,glacialWet*(1.-glacialSnowMode));
   roughnessFactor=clamp(mix(roughnessFactor,glacialRoughness,mix(.60,.12,glacialSnowMode)),.14,.98);
   metalnessFactor=0.;`);
 };
 material.customProgramCacheKey=()=>`${previousKey}|croba-glacial-ice-finish-v2:${snow?'snow':'ice'}`;
 material.needsUpdate=true;
 return material;
}
