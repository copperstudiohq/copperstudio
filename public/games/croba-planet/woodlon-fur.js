import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {addHogwongFur} from './hogwong-fur.js';

/** Paint only the soft mantle and limbs. Dark facial sockets, nails, antlers
 * and their ice keep their original colors throughout the newborn coat. */
export function attachWoodlonCoat(geometry,kind,capacity){
 const colors=geometry.getAttribute('color'),positions=geometry.getAttribute('position');
 const mask=new Float32Array(positions.count);
 if(kind==='body'||kind==='arms'||kind==='legs')for(let i=0;i<mask.length;i++){
  const r=colors.getX(i),b=colors.getZ(i),y=positions.getY(i),x=positions.getX(i);
  mask[i]=r>.115&&b-r<.18&&(kind!=='body'||y<.925&&!(y>.86&&Math.abs(x)>.12))?1:0;
 }
 geometry.setAttribute('woodlonSoftMask',new THREE.BufferAttribute(mask,1));
 geometry.setAttribute('woodlonCoat',new THREE.InstancedBufferAttribute(new Float32Array(capacity),1).setUsage(THREE.DynamicDrawUsage));
}

/** Per-instance color blending preserves the adult's authored vertex colors
 * and shared bark maps, without another body/limb material or draw. */
export function applyWoodlonCoat(material){
 const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=shader=>{
  previous(shader);
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nattribute float woodlonCoat; attribute float woodlonSoftMask; varying float vWoodlonWhite;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvWoodlonWhite=woodlonCoat*woodlonSoftMask;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
   '#include <common>\nvarying float vWoodlonWhite;')
   .replace('#include <color_fragment>',`#include <color_fragment>
    float woodlonShade=.91+.09*clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)),0.,1.);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.91,.94,.97)*woodlonShade,clamp(vWoodlonWhite,0.,1.));`);
 };
 material.customProgramCacheKey=()=>`${key()}|woodlon-newborn-coat-1`;
 return material;
}

/** One static downy mantle: short curved fibers, no hair objects or textures. */
export function createWoodlonFur(){
 const mesh=new PlantMesh();
 const metadata=addHogwongFur(mesh,112,(u,t,root,normal,flow)=>{
  const latitude=(.06+.88*u)*Math.PI,angle=t*Math.PI*2,vertical=Math.cos(latitude),envelope=Math.sin(latitude),fullness=1-.13*vertical;
  root.set(Math.cos(angle)*.292*envelope*fullness,.53+.38*vertical,Math.sin(angle)*.235*envelope*fullness);
  if(root.y>.88||root.z>.155&&Math.abs(root.x)<.17&&root.y>.52||root.z>.2&&Math.abs(root.x)<.055&&root.y>.46&&root.y<.54)return false;
  normal.set(root.x/(.292*.292),(root.y-.53)/(.38*.38),root.z/(.235*.235));
  flow.set(-root.x*.3,-.8,-.15);
 },()=>0xf5f8f7,{length:.075,width:.017});
 const geometry=mesh.geometry({normalizeHeight:false}),positions=geometry.getAttribute('position'),roots=new Float32Array(positions.count*3);
 for(let start=0;start<positions.count;start+=4)for(let offset=0;offset<4;offset++){
  roots[(start+offset)*3]=positions.getX(start);roots[(start+offset)*3+1]=positions.getY(start);roots[(start+offset)*3+2]=positions.getZ(start);
 }
 geometry.setAttribute('woodlonFurRoot',new THREE.BufferAttribute(roots,3));
 geometry.userData={species:'Woodlon',part:'newborn-down',staticPrototype:true,...metadata};
 return geometry;
}

/** Shrink individual strands toward their attached roots as the coat matures. */
export function applyWoodlonFur(material){
 const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=shader=>{
  previous(shader);
  shader.vertexShader=shader.vertexShader.replace('#include <common>',
   '#include <common>\nattribute vec3 woodlonFurRoot; attribute float woodlonFluff;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=mix(woodlonFurRoot,transformed,clamp(woodlonFluff,0.,1.));');
 };
 material.customProgramCacheKey=()=>`${key()}|woodlon-down-1`;
 return material;
}
