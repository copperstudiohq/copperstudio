import * as THREE from './vendor/three.module.js';
import {BLUE_OCEAN_START_X,WATER_LEVEL,EYE_HEIGHT} from './terrain.js';
import {GRAVEL_PATCHES} from './seabed-gravel.js';
import {JELLYFISH_SPIRES} from './jellyfish-spires-data.js';

const ASSETS=Object.freeze({
  gravel:new URL('./assets/textures/rounded-charcoal-gravel-v209.jpg',import.meta.url).href,
  basalt:new URL('./assets/textures/submarine-basalt-v209.jpg',import.meta.url).href,
});
const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;

/** Convert a bounded, decoded albedo image to linear color and conservative
 * relief. This is surface detail; the authored collision geometry is unchanged.
 * @param {{data:Uint8Array|Uint8ClampedArray,width:number,height:number}} image
 * @param {number} [strength] */
export function marineDetailPixels(image,strength=.6){
  const {width,height,data}=image??{};
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width>512||height>512||data?.length!==width*height*4)
    throw new RangeError('Marine texture pixels must be a complete RGBA image between 2 and 512 pixels per side.');
  if(!Number.isFinite(strength)||strength<0||strength>4)throw new RangeError('Marine relief strength must be between 0 and 4.');
  const color=new Uint8Array(data.length),normal=new Uint8Array(data.length),luma=new Float32Array(width*height);
  for(let p=0;p<luma.length;p++){
    const i=p*4,r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
    color.set([Math.round(linear(r)*255),Math.round(linear(g)*255),Math.round(linear(b)*255),255],i);
    luma[p]=r*.2126+g*.7152+b*.0722;
  }
  const sample=(x,y)=>luma[((y+height)%height)*width+(x+width)%width];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    // Central differences wrap with the repeating map. Low amplitude avoids
    // turning tiny photographic grain into jagged geometric-looking blocks.
    const dx=(sample(x-1,y)-sample(x+1,y))*strength,dy=(sample(x,y-1)-sample(x,y+1))*strength;
    const n=Math.hypot(dx,dy,1),i=(y*width+x)*4;
    normal.set([Math.round((dx/n*.5+.5)*255),Math.round((dy/n*.5+.5)*255),Math.round((1/n*.5+.5)*255),255],i);
  }
  return{color,normal,width,height};
}

function detailTexture(bytes,width,height,name){
  const texture=new THREE.DataTexture(bytes,width,height,THREE.RGBAFormat);
  texture.name=name;texture.colorSpace=THREE.NoColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  return texture;
}

async function loadPixels(url,size,signal){
  const response=await fetch(url,{signal});
  if(!response.ok)throw new Error(`Texture request returned HTTP ${response.status}.`);
  const bitmap=await createImageBitmap(await response.blob(),{resizeWidth:size,resizeHeight:size,resizeQuality:'high'});
  try{
    signal.throwIfAborted();
    const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(size,size):Object.assign(document.createElement('canvas'),{width:size,height:size});
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if(!context)throw new Error('The texture decoding canvas is unavailable.');
    context.drawImage(bitmap,0,0,size,size);return context.getImageData(0,0,size,size);
  }finally{bitmap.close();}
}

/** Lazy, once-per-scene detail. Existing maps remain valid on slow connections
 * or decode failure. Gravel fallbacks are borrowed; loaded maps and basalt
 * fallbacks are owned. Stable uniforms swap textures without resizing a GPU
 * allocation that may already have immutable storage.
 */
export class MarineTextureDetail{
  constructor({gravelMaps,onReady=()=>{},loadImage=loadPixels,warn=console.warn}={}){
    if(!gravelMaps?.color?.isDataTexture||!gravelMaps?.normal?.isDataTexture)throw new TypeError('Marine detail needs the shared gravel data textures.');
    this.gravelMaps=gravelMaps;this.onReady=onReady;this.loadImage=loadImage;this.warn=warn;this.disposed=false;
    this.basaltMaps={color:detailTexture(new Uint8Array([15,17,20,255,15,17,20,255,15,17,20,255,15,17,20,255]),2,2,'submarine-basalt-color'),
      normal:detailTexture(new Uint8Array([128,128,255,255,128,128,255,255,128,128,255,255,128,128,255,255]),2,2,'submarine-basalt-normal')};
    for(const maps of[this.gravelMaps,this.basaltMaps]){maps.colorUniform??={value:maps.color};maps.normalUniform??={value:maps.normal};}
    this.ownedTextures=[this.basaltMaps.color,this.basaltMaps.normal];this.jobs=new Map();this.states={gravel:'idle',basalt:'idle'};
  }

  /** Distances are render meters; player coordinates use simulation units. */
  update(player,range=80){
    if(this.disposed||![player?.x,player?.y,player?.z].every(Number.isFinite))return;
    const margin=Math.max(10,Math.min(200,Number.isFinite(range)?range:80))*25;
    if(player.z+EYE_HEIGHT<WATER_LEVEL+200&&(player.x>BLUE_OCEAN_START_X-margin||GRAVEL_PATCHES.some(([x,y,rx,ry])=>Math.hypot((player.x-x)/(rx+margin),(player.y-y)/(ry+margin))<1)))this.start('gravel');
    const b=JELLYFISH_SPIRES;
    if(player.x>b.minX-margin&&player.x<b.maxX+margin&&player.y>b.minY-margin&&player.y<b.maxY+margin)this.start('basalt');
  }

  start(kind){
    if(this.disposed||this.states[kind]!=='idle')return this.jobs.get(kind)?.promise;
    this.states[kind]='pending';const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(new Error('Marine texture loading timed out.')),15000);
    const promise=Promise.resolve().then(()=>this.loadImage(ASSETS[kind],512,controller.signal)).then(image=>{
      if(this.disposed||controller.signal.aborted)return;
      const pixels=marineDetailPixels(image,kind==='gravel'?.85:.55),maps=kind==='gravel'?this.gravelMaps:this.basaltMaps;
      for(const name of['color','normal']){
        const texture=detailTexture(pixels[name],pixels.width,pixels.height,`${kind}-photographic-${name}`);
        this.ownedTextures.push(texture);maps[`${name}Uniform`].value=texture;
      }
      this.states[kind]='ready';this.onReady(kind);
    }).catch(error=>{
      if(this.disposed)return;
      this.states[kind]='failed';this.warn(`Croba ${kind} detail could not load; keeping the existing surface.`,error);
    }).finally(()=>{clearTimeout(timeout);});
    this.jobs.set(kind,{controller,promise});return promise;
  }

  dispose(){
    if(this.disposed)return;this.disposed=true;
    for(const job of this.jobs.values())job.controller.abort();
    for(const texture of this.ownedTextures)texture.dispose();
  }
}

/** World-space projection avoids stretching a rock image up the spire's faces.
 * One material draw, shared tiny maps, no additional lighting or shadow pass.
 */
export function applyBasaltDetail(material,maps){
  maps.colorUniform??={value:maps.color};maps.normalUniform??={value:maps.normal};
  const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
  material.onBeforeCompile=shader=>{
    previous(shader);shader.uniforms.basaltColorMap=maps.colorUniform;shader.uniforms.basaltNormalMap=maps.normalUniform;
    shader.vertexShader=`varying vec3 vBasaltWorld;\n${shader.vertexShader}`.replace('#include <begin_vertex>',`#include <begin_vertex>
      vBasaltWorld=(modelMatrix*vec4(transformed,1.)).xyz;`);
    shader.fragmentShader=`uniform sampler2D basaltColorMap,basaltNormalMap;varying vec3 vBasaltWorld;\n${shader.fragmentShader}`.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 basaltN=abs(normalize(cross(dFdx(vBasaltWorld),dFdy(vBasaltWorld))));
      basaltN=pow(basaltN,vec3(4.));basaltN/=max(dot(basaltN,vec3(1.)),.0001);
      vec3 basaltDetail=texture2D(basaltColorMap,vBasaltWorld.yz*.32).rgb*basaltN.x
        +texture2D(basaltColorMap,vBasaltWorld.xz*.32).rgb*basaltN.y
        +texture2D(basaltColorMap,vBasaltWorld.xy*.32).rgb*basaltN.z;
      diffuseColor.rgb=mix(diffuseColor.rgb,basaltDetail,.92);`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        vec3 basaltX=texture2D(basaltNormalMap,vBasaltWorld.yz*.32).xyz*2.-1.;
        vec3 basaltY=texture2D(basaltNormalMap,vBasaltWorld.xz*.32).xyz*2.-1.;
        vec3 basaltZ=texture2D(basaltNormalMap,vBasaltWorld.xy*.32).xyz*2.-1.;
        vec3 basaltGradient=vec3(basaltY.x*basaltN.y+basaltZ.x*basaltN.z,
          basaltX.x*basaltN.x+basaltZ.y*basaltN.z,basaltX.y*basaltN.x+basaltY.y*basaltN.y);
        normal=normalize(normal+mat3(viewMatrix)*basaltGradient*.65);`);
  };
  material.customProgramCacheKey=()=>`${key}|submarine-basalt-v209`;
  // Discoverable properties make ownership explicit to renderer disposal audits.
  material.basaltColorMap=maps.color;material.basaltNormalMap=maps.normal;return material;
}
