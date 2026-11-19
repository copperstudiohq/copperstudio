import * as THREE from './vendor/three.module.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const hash=(x,y)=>{let n=Math.imul(x+31,374761393)^Math.imul(y+17,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};

/** Milky fluid inclusions, subtle cubic cleavage traces and etched patches.
 * Three small maps supply surface detail without transparency render passes. */
export function buildSaltCrystalTexturePixels(size=128){
 if(!Number.isInteger(size)||size<32||size>256)throw new RangeError('Salt crystal maps need an integer resolution from 32 to 256.');
 const color=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4),height=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,grain=hash(x,y);
  const clouds=.5+.22*Math.sin(u*18+Math.sin(v*11)*1.8)+.16*Math.cos(v*25+Math.sin(u*13))+.09*Math.sin((u+v)*49);
  const inclusion=clamp((clouds-.45)*1.7,0,1),etch=grain>.985?1:0;
  const xTrace=Math.abs(Math.sin(u*Math.PI*8)),yTrace=Math.abs(Math.sin(v*Math.PI*6));
  const cleavage=(xTrace<.055&&v>.13&&v<.79)||(yTrace<.045&&u>.2&&u<.86)?1:0;
  const value=clamp(Math.round(241+inclusion*12+(grain-.5)*5-cleavage*8-etch*13),215,255),i=(y*size+x)*4;
  color.set([value,Math.max(0,value-2),Math.max(0,value-6),255],i);
  const frost=Math.round(78+inclusion*54+cleavage*16+etch*17);roughness.set([frost,frost,frost,255],i);
  height[y*size+x]=.5+clouds*.012-cleavage*.018-etch*.009+(grain-.5)*.002;
 }
 const at=(x,y)=>height[((y+size)%size)*size+(x+size)%size];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const dx=(at(x-1,y)-at(x+1,y))*2,dy=(at(x,y-1)-at(x,y+1))*2,length=Math.hypot(dx,dy,1),i=(y*size+x)*4;
  normal.set([Math.round((dx/length*.5+.5)*255),Math.round((dy/length*.5+.5)*255),Math.round((1/length*.5+.5)*255),255],i);
 }
 return {color,normal,roughness};
}

export function createSaltCrystalSurface(size=128){
 const pixels=buildSaltCrystalTexturePixels(size),textures=[];
 for(const kind of['color','normal','roughness']){
  const texture=new THREE.DataTexture(pixels[kind],size,size,THREE.RGBAFormat);texture.name=`halite-${kind}`;
  if(kind==='color')texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=2;texture.needsUpdate=true;textures.push(texture);
 }
 const material=new THREE.MeshPhysicalMaterial({color:0xffffff,map:textures[0],normalMap:textures[1],roughnessMap:textures[2],normalScale:new THREE.Vector2(.16,.16),roughness:.7,metalness:0,ior:1.5443,clearcoat:.36,clearcoatRoughness:.24,envMapIntensity:.8});
 material.name='halite-milky-cleavage-surface';return {material,textures};
}
