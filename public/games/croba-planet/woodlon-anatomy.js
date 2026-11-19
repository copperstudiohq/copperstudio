import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';

/** Render metres, Y up, face +Z. All anchors belong to the unchanged body frame. */
export const WOODLON_HEIGHT=1.10;
export const WOODLON_EYE_LOCAL=Object.freeze([0,.714,.236]);
export const WOODLON_PUPIL_LOCAL=Object.freeze([0,.714,.272]);
export const WOODLON_MOUTH_LOCAL=Object.freeze([0,.503,.255]);
export const WOODLON_ARM_ANCHORS=Object.freeze([
 Object.freeze([-.257,.68,.015]),Object.freeze([.257,.68,.015]),
 Object.freeze([-.285,.48,.015]),Object.freeze([.285,.48,.015]),
]);
export const WOODLON_LEG_ANCHORS=Object.freeze([
 Object.freeze([-.14,.16,0]),Object.freeze([.14,.16,0]),
]);
export const WOODLON_COLORS=Object.freeze({
 bark:0x706373,belly:0xc2c9d0,antler:0x514751,ice:0xb9e6ed,
 outline:0x182027,iris:0xd4d6b2,pupil:0x070d10,mouth:0x352f3b,
});
const v=(x,y,z)=>new THREE.Vector3(x,y,z);
const geometry=mesh=>mesh.geometry({normalizeHeight:false});

/**
 * Shared full-detail prototypes for one peaceful Woodlon. No textures, lights,
 * animation state or world positions are owned by these immutable geometries.
 *
 * `body` includes antlers, their attached icicles, the dark eye rim and mouth
 * socket. Place `eye` and `pupil` at their exported anchors. `arms` and `legs`
 * are shoulder/hip-local: four arms and two legs use their exported anchors.
 * The feet touch Y=0 at rest. `proboscis` runs from local Z=0 to Z=1; place its
 * root at MOUTH_LOCAL and scale Z from 0 (retracted) to the feeding reach.
 *
 * @returns {{body:THREE.BufferGeometry,arms:THREE.BufferGeometry,
 * legs:THREE.BufferGeometry,eye:THREE.BufferGeometry,
 * pupil:THREE.BufferGeometry,proboscis:THREE.BufferGeometry}}
 */
export function createWoodlonAnatomy(){
 const body=new PlantMesh(),arm=new PlantMesh(),leg=new PlantMesh();
 const iris=new PlantMesh(),pupil=new PlantMesh(),tube=new PlantMesh();
 const bark=new THREE.Color(WOODLON_COLORS.bark),frost=new THREE.Color(WOODLON_COLORS.belly),tint=new THREE.Color();
 const egg=(mesh,point,radius,color,segments=10,rings=6)=>mesh.ellipsoid(v(...point),v(...radius),color,{segments,rings});

 // A single closed pear-shaped mantle keeps the plump chest and head joined.
 // Slight growth relief follows the curved body instead of separate box pieces.
 const mantle=(u,t)=>{
  const latitude=u*Math.PI,angle=t*Math.PI*2,vertical=Math.cos(latitude);
  const envelope=Math.sin(latitude),fullness=1-.13*vertical;
  const relief=1+.011*Math.sin(angle*9+vertical*4)*Math.sin(latitude)**2;
  return v(Math.cos(angle)*.292*envelope*fullness*relief,
   .53+.38*vertical,Math.sin(angle)*.235*envelope*fullness*relief);
 };
 body.grid(14,20,mantle,(u,t)=>{
  const p=mantle(u,t),front=Math.max(0,Math.sin(t*Math.PI*2));
  const belly=Math.exp(-(((p.y-.42)/.25)**4))*front**3;
  return tint.copy(bark).lerp(frost,belly*.83)
   .multiplyScalar(.94+.06*Math.sin(t*31+p.y*22)**2).getHex();
 });
 // A soft recessed oval rim, without brows or a second facial eye.
 egg(body,[0,.714,.212],[.145,.171,.046],WOODLON_COLORS.outline,14,8);
 egg(body,[0,.503,.235],[.031,.023,.028],WOODLON_COLORS.mouth,10,6);

 // Two small antlers retain the stalker's branching silhouette. Every icicle
 // begins inside its own branch, with an actual downward tapered ice tip.
 let icicles=0;
 for(const side of[-1,1]){
  const root=v(side*.12,.865,-.015),fork=v(side*.205,.98,-.04);
  const outer=v(side*.30,1.06,-.035),inner=v(side*.19,1.10,-.025);
  body.tube([root,fork,outer],[.026,.019,0],WOODLON_COLORS.antler,7);
  body.tube([fork,inner],[.015,0],WOODLON_COLORS.antler,6);
  for(const[along,length]of[[.38,.11],[.76,.075]]){
   const attachment=fork.clone().lerp(outer,along).add(v(0,-.008,0));
   body.tube([attachment,attachment.clone().add(v(side*.002,-length*.4,.002)),
    attachment.clone().add(v(side*.004,-length,.003))],[.013,.008,0],
    (u)=>u>.7?0xe2f4f5:WOODLON_COLORS.ice,6);
   icicles++;
  }
 }

 // Four short rounded arms share one origin-at-shoulder prototype.
 egg(arm,[0,-.025,0],[.065,.075,.065],WOODLON_COLORS.bark,8,5);
 arm.tube([v(0,0,0),v(.012,-.075,.012),v(.025,-.14,.036),v(.01,-.205,.065)],
  [.055,.052,.047,.042],WOODLON_COLORS.bark,7);
 egg(arm,[.01,-.205,.065],[.062,.050,.046],WOODLON_COLORS.bark,10,5);
 for(const digit of[-1,0,1])arm.tube([
  v(.01+digit*.029,-.212,.077),v(.01+digit*.034,-.247,.097),v(.008+digit*.032,-.276,.104),
 ],[.019,.014,0],WOODLON_COLORS.bark,5);

 // The broad padded feet overlap their ankles and remain visibly connected.
 egg(leg,[0,-.027,0],[.071,.077,.067],WOODLON_COLORS.bark,8,5);
 leg.tube([v(0,0,0),v(0,-.065,.005),v(0,-.105,.025)],
  [.067,.063,.055],WOODLON_COLORS.bark,7);
 egg(leg,[0,-.12,.05],[.085,.040,.115],WOODLON_COLORS.bark,12,6);
 for(const digit of[-1,0,1])leg.tube([
  v(digit*.041,-.126,.122),v(digit*.044,-.132,.164),
 ],[.024,0],0x514953,5);

 // Separate origin-centred lenses keep gaze motion independent of locomotion.
 egg(iris,[0,0,0],[.119,.145,.035],(u,t)=>{
  const stria=.5+.5*Math.sin(t*Math.PI*62+Math.cos(u*Math.PI)*5);
  return tint.setHex(WOODLON_COLORS.iris).multiplyScalar(.88+.12*stria).getHex();
 },16,10);
 egg(pupil,[0,0,0],[.021,.106,.010],WOODLON_COLORS.pupil,12,8);

 // A soft closed tapered feeding tube. Compressing Z retracts it into the
 // existing mouth socket; its slight bend remains visible when extended.
 tube.grid(6,8,(u,t)=>{
  const radius=.013*(1-u*.62),a=t*Math.PI*2;
  return v(Math.cos(a)*radius+Math.sin(u*Math.PI)*.025,
   Math.sin(a)*radius-Math.sin(u*Math.PI)*.018,u);
 },u=>u>.88?0xbbb69d:0x746572);
 // End caps close the model while keeping its tip soft and unobtrusive.
 for(const end of[0,1])tube.grid(1,8,(u,t)=>{
  const radius=(end?.013*.38:.013)*u,a=t*Math.PI*2;
  return v(Math.cos(a)*radius,Math.sin(a)*radius,end);
 },end?0xbbb69d:0x746572,0,end===1);

 const parts={body:geometry(body),arms:geometry(arm),legs:geometry(leg),
  eye:geometry(iris),pupil:geometry(pupil),proboscis:geometry(tube)};
 for(const[name,part]of Object.entries(parts)){
  part.name=`woodlon-${name}`;
  part.userData={species:'Woodlon',part:name,staticPrototype:true};
 }
 parts.body.userData={...parts.body.userData,heightMetres:WOODLON_HEIGHT,
  armCount:4,legCount:2,eyeCount:1,attachedIcicles:icicles,antlerCount:2};
 parts.proboscis.userData.root=[0,0,0];parts.proboscis.userData.tip=[0,0,1];
 return parts;
}
