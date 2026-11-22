import * as THREE from './vendor/three.module.js';
import {BLUE_OCEAN_START_X} from './terrain.js';
import {shellFieldBlend} from './shell-field.js';

/** Authored sediment pockets; these change the finish, never the geography. */
export const GRAVEL_PATCHES=Object.freeze([
  [-4300,-3200,620,430],[-2450,-4450,480,360],[-700,-2400,440,520],
  [-420,570,330,270],[-2700,1900,520,380],[-4900,3400,480,400],
  [160,-700,280,340],[-1100,-750,350,250],
].map(Object.freeze));
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

/** Pale Shell Field remains separate; deep ocean becomes charcoal sediment.
 * @param {number} x @param {number} y @returns {number} */
export function seabedGravelBlend(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return 0;
  let blend=smooth((x-BLUE_OCEAN_START_X)/520)*(1-shellFieldBlend(x,y));
  for(const [cx,cy,rx,ry]of GRAVEL_PATCHES){
    const radius=Math.hypot((x-cx)/rx,(y-cy)/ry);
    blend=Math.max(blend,smooth((1-radius)/.32)*.9);
  }
  return blend;
}

const hash=(x,y)=>{let v=(Math.imul(x,374761393)+Math.imul(y,668265263))|0;v=Math.imul(v^(v>>>13),1274126177);return((v^(v>>>16))>>>0)/4294967296;};
const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;

/** Two small repeating maps supply linear albedo and matching relief normals.
 * Shared by both floor batches; no extra geometry, lights or per-frame work. */
export function createGravelMaps(size=256){
  if(!Number.isInteger(size)||size<32||size>512)throw new RangeError('Gravel map size must be an integer from 32 to 512.');
  const data=new Uint8Array(size*size*8),heights=new Float32Array(size*size);
  const cells=16;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const px=x/size*cells,py=y/size*cells,cx=Math.floor(px),cy=Math.floor(py);let relief=0,grain=.25;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const sx=cx+i,sy=cy+j,wx=(sx+cells)%cells,wy=(sy+cells)%cells;
      const seed=hash(wx,wy),dx=px-sx-.06-hash(wx+31,wy)*.88,dy=py-sy-.06-hash(wx,wy+29)*.88;
      const angle=seed*6.283,c=Math.cos(angle),s=Math.sin(angle);
      const u=(dx*c+dy*s)/(.25+hash(wx+9,wy)*.42),v=(-dx*s+dy*c)/(.19+hash(wx,wy+7)*.35);
      const r=u*u+v*v,cap=r<1?Math.sqrt(1-r)*(.5+seed*.5):0;
      if(cap>relief){relief=cap;grain=.24+seed*.15;}
    }
    const n=hash(x,y),k=y*size+x;heights[k]=relief;
    const contact=smooth(relief*6);
    // Relief supplies the rounded grain, rather than painting bright oval
    // spots onto the ground. Nearby loose stones carry the actual silhouette.
    const value=.23+(grain-.30)*.24+(n-.5)*.016-(1-contact)*.008;
    data.set([linear(value*.94)*255,linear(value)*255,linear(value*1.025)*255,255],k*4);
  }
  const height=(x,y)=>heights[((y+size)%size)*size+(x+size)%size];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const dx=(height(x-1,y)-height(x+1,y))*1.55,dy=(height(x,y-1)-height(x,y+1))*1.55,length=Math.hypot(dx,dy,1);
    data.set([(dx/length*.5+.5)*255,(dy/length*.5+.5)*255,(1/length*.5+.5)*255,255],(size*size+y*size+x)*4);
  }
  const bytes=size*size*4;
  const maps={color:new THREE.DataTexture(data.slice(0,bytes),size,size,THREE.RGBAFormat),
    normal:new THREE.DataTexture(data.slice(bytes),size,size,THREE.RGBAFormat)};
  for(const [name,texture]of Object.entries(maps)){
    texture.name=`charcoal-gravel-${name}`;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.generateMipmaps=true;texture.needsUpdate=true;
  }
  return maps;
}

/** Add one normalized finish mask to an existing floor/rock geometry. */
export function addGravelMask(geometry){
  const p=geometry.attributes.position,mask=new Uint8Array(p.count);
  for(let i=0;i<p.count;i++)mask[i]=Math.round(255*seabedGravelBlend(p.getX(i)*25,p.getZ(i)*25));
  geometry.setAttribute('gravelBlend',new THREE.BufferAttribute(mask,1,true));return geometry;
}

/** Compose with existing terrain and Shell Field hooks; a zero mask is inert. */
export function applyGravelSurface(material,maps){
  maps.colorUniform??={value:maps.color};maps.normalUniform??={value:maps.normal};
  const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
  material.onBeforeCompile=shader=>{
    previous(shader);shader.uniforms.gravelColorMap=maps.colorUniform;shader.uniforms.gravelNormalMap=maps.normalUniform;
    shader.vertexShader=`attribute float gravelBlend;varying float vGravelBlend;varying vec3 vGravelWorld;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        vGravelBlend=gravelBlend;vec4 gravelPosition=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          gravelPosition=instanceMatrix*gravelPosition;
        #endif
        vGravelWorld=(modelMatrix*gravelPosition).xyz;`);
    shader.fragmentShader=`uniform sampler2D gravelColorMap,gravelNormalMap;varying float vGravelBlend;varying vec3 vGravelWorld;
      \n${shader.fragmentShader}`
      .replace('#include <color_fragment>',`#include <color_fragment>
        if(vGravelBlend>0.){
          vec2 gravelTile=vGravelWorld.xz*1.15+vGravelWorld.y*.06;
          vec3 gravel=texture2D(gravelColorMap,gravelTile).rgb;
          vec3 basalt=vec3(.050,.057,.066)*(1.+sin(vGravelWorld.y*5.+vGravelWorld.x*.8)*.12);
          float faceSlope=length(cross(dFdx(vGravelWorld),dFdy(vGravelWorld)).xz)/max(length(cross(dFdx(vGravelWorld),dFdy(vGravelWorld))),.0001);
          diffuseColor.rgb=mix(diffuseColor.rgb,mix(gravel,basalt,smoothstep(.45,.95,faceSlope)*.9),vGravelBlend);
        }`)
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.94,vGravelBlend);')
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        #ifdef USE_NORMALMAP_TANGENTSPACE
          if(vGravelBlend>0.){
            vec3 gravelNormal=texture2D(gravelNormalMap,vGravelWorld.xz*1.15+vGravelWorld.y*.06).xyz*2.-1.;
            normal=normalize(mix(normal,tbn*gravelNormal,vGravelBlend));
          }
        #endif`);
  };
  material.customProgramCacheKey=()=>`${key}|charcoal-gravel-v2`;
  material.gravelColorMap=maps.color;material.gravelNormalMap=maps.normal;return material;
}
