import * as THREE from './vendor/three.module.js';
import {marineDetailPixels,createMarineDetailTexture,loadMarinePixels} from './marine-texture-detail.js';

const ASSET=new URL('./assets/textures/velvet-moss-v214.jpg',import.meta.url).href;
const applied=new WeakSet();

/** A single shared image/relief pair per Scene. Ready uniforms swap new texture
 * objects instead of resizing uploaded GPU allocations. Old moss stays usable
 * when the optional surface image is slow, offline, or fails to decode. */
export class MossTextureDetail{
  constructor({resolution=512,onReady=()=>{},loadImage=loadMarinePixels,warn=console.warn}={}){
    this.resolution=resolution===256?256:512;this.onReady=onReady;this.loadImage=loadImage;this.warn=warn;
    this.state='idle';this.disposed=false;
    this.surface={value:createMarineDetailTexture(new Uint8Array([40,40,40,255]),1,1,'moss-surface-fallback')};
    this.normal={value:createMarineDetailTexture(new Uint8Array([128,128,255,255]),1,1,'moss-normal-fallback')};
    this.ready={value:0};this.ownedTextures=[this.surface.value,this.normal.value];
  }
  start(){
    if(this.disposed||this.state!=='idle')return this.promise;
    this.state='pending';this.controller=new AbortController();
    const timeout=setTimeout(()=>this.controller.abort(new Error('Moss texture loading timed out.')),15000);
    let onAbort;
    const aborted=new Promise((_,reject)=>{
      onAbort=()=>reject(this.controller.signal.reason??new Error('Moss texture loading was cancelled.'));
      this.controller.signal.addEventListener('abort',onAbort,{once:true});
    });
    const loading=Promise.resolve().then(()=>this.loadImage(ASSET,this.resolution,this.controller.signal));
    this.promise=Promise.race([loading,aborted]).then(image=>{
      if(this.disposed||this.controller.signal.aborted)return;
      const pixels=marineDetailPixels(image,1.8);
      const surface=createMarineDetailTexture(pixels.color,pixels.width,pixels.height,'velvet-moss-surface');
      const normal=createMarineDetailTexture(pixels.normal,pixels.width,pixels.height,'velvet-moss-normal');
      surface.anisotropy=normal.anisotropy=2;
      this.ownedTextures.push(surface,normal);this.surface.value=surface;this.normal.value=normal;
      this.ready.value=1;this.state='ready';this.onReady();
    }).catch(error=>{
      if(!this.disposed){this.state='failed';this.warn('[Croba] Moss surface detail unavailable; keeping the existing moss.',error);}
    }).finally(()=>{clearTimeout(timeout);this.controller.signal.removeEventListener('abort',onAbort);});
    return this.promise;
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;this.controller?.abort();
    for(const texture of this.ownedTextures)texture.dispose();
  }
}

const color=hex=>new THREE.Color(hex).toArray();
const palettes=Object.freeze({
  purple:{base:color(0x17101c),tip:color(0x65486f)},
  green:{base:color(0x25351b),tip:color(0x8da46a)},
});

/** Fine fuzzy albedo and relief cover the complete moss surface, including the
 * cushion between visible fronds. Existing sand/stone maps are never touched.
 * The neutral photograph-like asset is recolored to each moss's own palette. */
export function applyMossTexture(material,detail,palette='purple'){
  if(!material?.isMeshStandardMaterial||applied.has(material))return material;
  if(!detail?.surface||!detail?.normal||!detail?.ready||!palettes[palette])throw new TypeError('Moss texture needs shared surface maps and a known palette.');
  const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
  const low=palettes[palette].base.map(x=>x.toFixed(5)).join(','),high=palettes[palette].tip.map(x=>x.toFixed(5)).join(',');
  material.onBeforeCompile=(shader,renderer)=>{
    previous(shader,renderer);
    Object.assign(shader.uniforms,{mossTextureMap:detail.surface,mossTextureNormalMap:detail.normal,mossTextureReady:detail.ready});
    shader.vertexShader=`varying vec3 vMossTextureLocal,vMossTextureWorld;\n${shader.vertexShader}`
      .replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
        vMossTextureLocal=position;
        vec4 mossTexturePosition=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          mossTexturePosition=instanceMatrix*mossTexturePosition;
        #endif
        vMossTextureWorld=(modelMatrix*mossTexturePosition).xyz;`);
    shader.fragmentShader=`uniform sampler2D mossTextureMap,mossTextureNormalMap;uniform float mossTextureReady;
      varying vec3 vMossTextureLocal,vMossTextureWorld;\n${shader.fragmentShader}`
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec2 mossTextureUV=(vMossTextureLocal.xz+vMossTextureLocal.y*vec2(.23,.19))*4.;
        vec3 mossFiberColor=texture2D(mossTextureMap,mossTextureUV).rgb;
        float mossFiberLuma=clamp(pow(dot(mossFiberColor,vec3(.2126,.7152,.0722)),.70)*1.65,0.,1.);
        diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(${low}),vec3(${high}),mossFiberLuma),mossTextureReady);`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        vec3 mossTextureBump=texture2D(mossTextureNormalMap,mossTextureUV).xyz*2.-1.;
        vec3 mossTextureDx=dFdx(vMossTextureWorld),mossTextureDy=dFdy(vMossTextureWorld);
        vec2 mossUvDx=dFdx(mossTextureUV),mossUvDy=dFdy(mossTextureUV);
        vec3 mossTextureT=mossTextureDx*mossUvDy.y-mossTextureDy*mossUvDx.y;
        vec3 mossTextureB=-mossTextureDx*mossUvDy.x+mossTextureDy*mossUvDx.x;
        float mossUvSign=sign(mossUvDx.x*mossUvDy.y-mossUvDx.y*mossUvDy.x);
        mossTextureT*=mossUvSign;mossTextureB*=mossUvSign;
        mossTextureT*=inversesqrt(max(dot(mossTextureT,mossTextureT),.000000000001));
        mossTextureB*=inversesqrt(max(dot(mossTextureB,mossTextureB),.000000000001));
        vec3 mossTextureGradient=mat3(viewMatrix)*(mossTextureT*mossTextureBump.x+mossTextureB*mossTextureBump.y);
        normal=normalize(normal+mossTextureGradient*mossTextureReady*.70);
        roughnessFactor=mix(roughnessFactor,.91-mossFiberLuma*.08,mossTextureReady);
        totalEmissiveRadiance*=mix(1.,.20+mossFiberLuma*.80,mossTextureReady);`);
  };
  material.customProgramCacheKey=()=>`${key}|full-moss-texture-v214-${palette}`;
  material.mossTextureMap=detail.surface.value;material.mossTextureNormalMap=detail.normal.value;
  material.userData.mossTexture=palette;material.needsUpdate=true;applied.add(material);return material;
}
