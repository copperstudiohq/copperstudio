import * as THREE from './vendor/three.module.js';

/** One shared bare-ice finish for every island outside the Icy Basin. */
export const ISLAND_ICE_STYLES=Object.freeze({
 'wind-shelf':Object.freeze({pale:0xdcebf1,deep:0x4c9fb6,cap:0xf2f6f7,exposed:0xb5d5e1,roughness:.8}),
});
export function islandIceStyle(id){return ISLAND_ICE_STYLES[id]??null;}
/** Vertex grain follows height and wind across existing surface triangles. */
export function colorIslandSurface(geometry,floe){
 const style=islandIceStyle(floe.iceStyle);if(!style)return;
 const p=geometry.attributes.position,colors=[],tint=new THREE.Color(),low=new THREE.Color(style.exposed),high=new THREE.Color(style.cap);
 // Custom authored surfaces can lower parts of the original ring profile.
 // Normalize frost against the real mesh peaks rather than unused metadata.
 let crest=1;for(let i=0;i<p.count;i++)crest=Math.max(crest,p.getY(i)*25-(floe.z??0));
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i),height=p.getY(i)*25-(floe.z??0);
  const grain=.5+.5*Math.sin(x*.74+z*.31+Math.sin(z*.23+(floe.seed??0))*.5);
  const frost=THREE.MathUtils.clamp(.22+height/crest*.52+grain*.22,0,1);
  tint.copy(low).lerp(high,frost);colors.push(tint.r,tint.g,tint.b);
 }
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
}
export function createIslandSurfaceMaterial(library,id){
 const style=islandIceStyle(id);if(!style)throw new TypeError('Unknown bare-island ice style: '+id);
 const base=library?.snow;
 const material=base?.clone()??new THREE.MeshStandardMaterial({color:0xffffff});
 material.name='bare-island-'+id;material.vertexColors=true;material.color.setHex(0xffffff);material.roughness=style.roughness;
 return material;
}
