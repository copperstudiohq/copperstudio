import * as THREE from './vendor/three.module.js';
import {sampleClassicSquidSurface} from './classic-squid-surfaces.js';

const clamp=n=>Math.max(0,Math.min(1,n)),wrap=(n,p)=>(n%p+p)%p;
const smooth=n=>n*n*(3-2*n),mix=(a,b,t)=>a+(b-a)*t;
function hash(x,y,seed){let n=(Math.imul(x,374761393)+Math.imul(y,668265263))^seed;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}
function noise(u,v,cells,seed){
  const x=u*cells,y=v*cells,ix=Math.floor(x),iy=Math.floor(y),sx=smooth(x-ix),sy=smooth(y-iy);
  const at=(dx,dy)=>hash(wrap(ix+dx,cells),wrap(iy+dy,cells),seed);
  return mix(mix(at(0,0),at(1,0),sx),mix(at(0,1),at(1,1),sx),sy);
}

/** Pale weathered stone: warm chalk, soft gray mineral bands, worn fine pits.
 * Periodic fields keep every edge seamless; no vents or emissive patterns. */
export function buildShellFieldTexturePixels(size=128){
  if(!Number.isInteger(size)||size<32||size>256)throw new RangeError('Shell Field texture size must be an integer from 32 to 256.');
  const pixels=new Uint8Array(size*size*4),fineFrequency=Math.min(53,Math.floor((size-1)/2.5));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/(size-1),v=y/(size-1),broad=noise(u,v,4,4733),middle=noise(u,v,13,9967),fine=noise(u,v,fineFrequency,7253);
    const layers=Math.sin(Math.PI*2*(v*4+(broad-.5)*.65));
    const vein=clamp((.047-Math.abs(noise(u,v,7,1831)-.51))/.047)*clamp((middle-.25)*2);
    const pit=clamp((.28-fine)*7)*clamp((.62-middle)*3);
    const light=(broad-.5)*25+(middle-.5)*12+(fine-.5)*10+layers*3.5-pit*10;
    const gray=vein*.24;
    const index=(y*size+x)*4;
    pixels[index]=Math.round(clamp(mix(228+light,159+light,gray)/255)*255);
    pixels[index+1]=Math.round(clamp(mix(200+light,153+light,gray)/255)*255);
    pixels[index+2]=Math.round(clamp(mix(181+light,148+light,gray)/255)*255);
    pixels[index+3]=255;
  }
  return pixels;
}

/** Irregular, seamless plate boundaries with the live squid's scarred grain. */
function armorPixels(){
  const size=128,period=size-1,color=new Uint8Array(size*size*4),normal=new Uint8Array(color.length),heights=new Float32Array(size*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/period,v=y/period,cx=Math.floor(u*4),cy=Math.floor(v*4);
    let first=Infinity,second=Infinity;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const ix=cx+dx,iy=cy+dy;
      const px=ix+.2+hash(wrap(ix,4),wrap(iy,4),4211)*.6;
      const py=iy+.2+hash(wrap(ix,4),wrap(iy,4),6257)*.6;
      const distance=Math.hypot(u*4-px,v*4-py);
      if(distance<first){second=first;first=distance;}else second=Math.min(second,distance);
    }
    const plate=smooth(clamp((second-first)/.075));
    const surface=sampleClassicSquidSurface('scarred-armor',u,v),index=(y*size+x)*4;
    const pigment=surface.pigment*(.48+.52*plate);
    color.set([Math.round(214*pigment),Math.round(168*pigment),Math.round(133*pigment),255],index);
    heights[y*size+x]=plate*.035+surface.height*.025;
  }
  const at=(x,y)=>heights[wrap(y,period)*size+wrap(x,period)];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=(at(x-1,y)-at(x+1,y))*period*.5,ny=(at(x,y-1)-at(x,y+1))*period*.5,length=Math.hypot(nx,ny,1),index=(y*size+x)*4;
    normal.set([Math.round((nx/length*.5+.5)*255),Math.round((ny/length*.5+.5)*255),Math.round((.5/length+.5)*255),255],index);
  }
  return {color,normal};
}
let armorTile;
function surfaceAtlas(stone,kind){
  armorTile??=armorPixels();
  const size=128,atlas=new Uint8Array(size*size*8),armor=armorTile[kind];
  for(let row=0;row<size;row++){
    atlas.set(stone.subarray(row*size*4,(row+1)*size*4),row*size*8);
    atlas.set(armor.subarray(row*size*4,(row+1)*size*4),row*size*8+size*4);
  }
  return atlas;
}

/** Stone and armor share one small atlas; no additional texture sampler. */
export function createShellFieldTexture(){
  const texture=new THREE.DataTexture(surfaceAtlas(buildShellFieldTexturePixels(),'color'),256,128,THREE.RGBAFormat);
  texture.name='shell-field-stone-and-squid-armor';texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.generateMipmaps=true;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=2;texture.needsUpdate=true;
  return texture;
}

/** Fine eroded stone relief replaces the sand ripples only inside the shelf. */
export function createShellFieldNormalTexture(){
  const size=128,period=size-1,heights=new Float32Array(size*size),pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/period,v=y/period,fine=noise(u,v,43,7253),middle=noise(u,v,13,9967);
    heights[y*size+x]=(middle-.5)*.025+(fine-.5)*.006-clamp((.28-fine)*7)*.004;
  }
  const at=(x,y)=>heights[wrap(y,period)*size+wrap(x,period)];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=(at(x-1,y)-at(x+1,y))*period*.5,ny=(at(x,y-1)-at(x,y+1))*period*.5,l=Math.hypot(nx,ny,1),i=(y*size+x)*4;
    pixels.set([Math.round((nx/l*.5+.5)*255),Math.round((ny/l*.5+.5)*255),Math.round((.5/l+.5)*255),255],i);
  }
  const texture=new THREE.DataTexture(surfaceAtlas(pixels,'normal'),size*2,size,THREE.RGBAFormat);
  texture.name='shell-field-stone-and-armor-relief';texture.colorSpace=THREE.NoColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.generateMipmaps=true;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=2;texture.needsUpdate=true;
  return texture;
}
