import * as THREE from './vendor/three.module.js';
import {getIceDepth} from './terrain.js';
import {createGlacierShellSections} from './glacier-shell-profile.js';
import {islandIceStyle} from './island-ice-style.js';
import {carveBasinIceGeometry} from './basin-cave-renderer.js';

/** Sculpted calving faces stay within the existing physical ice taper. The
 * exact top/base outlines, prepared walking surfaces and cave cuts remain shared. */
export function createFloatingGlacierGeometry(floe,vertices){
 if(!floe||!Number.isFinite(floe.x)||!Number.isFinite(floe.y)||!Array.isArray(vertices)||vertices.length<3||vertices.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw new TypeError('Glacier faces need a finite ice volume and at least three outline points.');
 const depth=getIceDepth(floe),seed=floe.seed??0,positions=[],colors=[];
 const style=islandIceStyle(floe.iceStyle);
 const pale=new THREE.Color(style?.pale??0xe4f0f3),dense=new THREE.Color(style?.deep??0x4b9fb9),tint=new THREE.Color();
 const sections=createGlacierShellSections(floe,vertices);
 const area=vertices.reduce((sum,a,i)=>{const b=vertices[(i+1)%vertices.length];return sum+a.x*b.y-b.x*a.y;},0);
 const triangle=(a,b,c)=>{
  for(const p of area>=0?[a,b,c]:[a,c,b]){
   positions.push(...p);
   const fraction=Math.max(0,Math.min(1,-p[1]*25/depth));
   const bubbles=Math.sin((p[0]+floe.x/25)*.31+(p[2]+floe.y/25)*.17+seed*.07)*.035;
   tint.copy(pale).lerp(dense,THREE.MathUtils.clamp(fraction*.82+bubbles,0,1));colors.push(tint.r,tint.g,tint.b);
  }
 };
 for(let layer=0;layer<sections.length-1;layer++)for(let edge=0;edge<sections[layer].length;edge++){
  const next=(edge+1)%sections[layer].length;
  triangle(sections[layer][edge],sections[layer][next],sections[layer+1][edge]);
  triangle(sections[layer][next],sections[layer+1][next],sections[layer+1][edge]);
 }
 const base=sections.at(-1);
 for(let i=0;i<base.length;i++)triangle([0,-depth/25,0],base[i],base[(i+1)%base.length]);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const result=carveBasinIceGeometry(geometry,floe);result.userData.glacialSculpture=true;return result;
}
