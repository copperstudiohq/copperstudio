import * as THREE from './vendor/three.module.js';

const clamp=value=>Math.max(0,Math.min(1,value));
const fade=value=>value*value*value*(value*(value*6-15)+10);
const smooth=(low,high,value)=>{const t=clamp((value-low)/(high-low));return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;

function hash(x,y,seed){
 let n=Math.imul(x+103,374761393)^Math.imul(y-59,668265263)^seed;
 n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;
}

/** Quintic lattice interpolation keeps each octave smooth across cell edges. */
function noise(x,y,seed){
 const ix=Math.floor(x),iy=Math.floor(y),u=fade(x-ix),v=fade(y-iy);
 return mix(mix(hash(ix,iy,seed),hash(ix+1,iy,seed),u),
  mix(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),u),v);
}

function layers(x,y){
 return noise(x*2.4+3.8,y*2.4-5.2,4127)*.47
  +noise(x*4.8-8.3,y*4.8+2.7,1979)*.29
  +noise(x*9.6+4.1,y*9.6+7.6,6311)*.16
  +noise(x*19.2-3.2,y*19.2-4.9,3259)*.08;
}

/** A soft, irregular smoke sprite. RGB is unpremultiplied linear cool-gray
 * illumination; alpha is density. Outer-border alpha is exactly zero, so
 * filtered billboard edges blend away without revealing a square tile.
 * This is a fresh deterministic byte array with no DOM, canvas or RNG state. */
export function createBackgroundSmokePixels(size=128){
 if(!Number.isInteger(size)||size<16||size>256)
  throw new RangeError('Background smoke texture size must be an integer from 16 to 256 pixels.');
 const pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/(size-1)*2-1,v=y/(size-1)*2-1;
  const warpX=(noise(u*2.7+6.1,v*2.7-4.8,1777)-.5)*.22;
  const warpY=(noise(u*2.7-9.2,v*2.7+3.4,2999)-.5)*.22;
  const wx=u+warpX,wy=v+warpY,r=Math.hypot(wx,wy),angle=Math.atan2(wy,wx);
  const low=noise(wx*3.2+1.8,wy*3.2-2.4,8191);
  const radius=.80+.065*Math.cos(angle*3+.4)+.04*Math.sin(angle*5-.7)+(low-.5)*.16;
  const interior=layers(wx+(low-.5)*.18,wy+(low-.5)*.13);
  const core=1-smooth(radius-.26,radius+.16,r);
  const mottle=.29+.71*smooth(.17,.79,interior);
  const strands=noise(wx*8.4+(low-.5)*2,wy*8.4+5.3,4513);
  const fringe=smooth(radius-.12,radius+.035,r)*(1-smooth(radius+.035,radius+.24,r));
  const wisps=fringe*smooth(.42,.73,strands)*.21;
  const border=1-smooth(.86,1,Math.max(Math.abs(u),Math.abs(v)));
  const density=clamp((core*mottle*.91+wisps)*border);
  const rim=fringe*Math.max(0,(-wx*.65+wy*.76)/(r||1));
  const shade=clamp(.42+interior*.32+low*.10+rim*.065);
  const offset=(y*size+x)*4;
  pixels[offset]=Math.round(clamp(shade*.965)*255);
  pixels[offset+1]=Math.round(clamp(shade*.985)*255);
  pixels[offset+2]=Math.round(clamp(shade*1.015)*255);
  pixels[offset+3]=Math.round(density*255);
 }
 return pixels;
}

/** The caller owns this texture. Data channels stay linear for shader tinting. */
export function createBackgroundSmokeTexture(size=128){
 const texture=new THREE.DataTexture(createBackgroundSmokePixels(size),size,size,THREE.RGBAFormat,THREE.UnsignedByteType);
 texture.name='soft-wispy-background-smoke';texture.colorSpace=THREE.NoColorSpace;
 texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
 texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 return texture;
}
