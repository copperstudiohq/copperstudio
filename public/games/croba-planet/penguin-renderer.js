import {capRenderDistance} from './render-distance.js';
import {PenguinJoints,PENGUIN_JOINT_COLORS,PENGUIN_BABY_COAT} from './penguin-joints.js';
import {MAX_CROBON_OFFSPRING,penguinGrowthScale} from './penguin-lifecycle.js';
import {PREPARED_HAULER_BIRDS} from './hauler-birds.js';
import {PenguinTailRenderer,PENGUIN_TAIL_COLORS} from './penguin-tail-renderer.js';
import {highestIceAt,getIceSurfaceHeight} from './ice-surface.js';
import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {createCreatureSurfaceMaps,applyCreatureSurface} from './creature-materials.js';
const v=(x,y,z)=>new THREE.Vector3(x,y,z);
export const PENGUIN_EYES=Object.freeze([[-.228,1.045,.055],[.228,1.045,.055],[-.244,.90,.055],[.244,.90,.055]].map(Object.freeze));
export {PENGUIN_TAIL_COLORS};
export const PENGUIN_RENDER_CAPACITY=32+PREPARED_HAULER_BIRDS.length+MAX_CROBON_OFFSPRING;

/** Two crossed, bent, pointed ribbons per tuft produce a real fuzzy silhouette.
 * They are merged into the existing coat batches once, never rebuilt in update. */
function addCoatFur(mesh,count,surface,colorAt){
 const start=mesh.positions.length/3,root=v(0,0,0),normal=v(0,0,0),side=v(0,0,0),cross=v(0,0,0),point=v(0,0,0),color=new THREE.Color();
 let tufts=0;
 for(let tuft=0;tuft<count;tuft++){
  const u=(tuft+.5)/count,t=(tuft*.61803398875)%1;
  if(surface(u,t,root,normal)===false)continue;
  tufts++;normal.normalize();side.set(normal.z,0,-normal.x);
  if(side.lengthSq()<1e-6)side.set(1,0,0);side.normalize();cross.crossVectors(normal,side).normalize();
  const length=.028+.025*(.5+.5*Math.sin(tuft*2.17)),width=.008+.004*(.5+.5*Math.sin(tuft*1.31));
  color.set(colorAt(u,t));
  for(const direction of [side,cross]){
   const base=mesh.positions.length/3;
   for(let vertex=0;vertex<5;vertex++){
    const along=vertex<2?0:vertex<4?.56:1,across=vertex===4?0:(vertex%2?1:-1)*(1-along*.72);
    point.copy(root).addScaledVector(normal,length*along).addScaledVector(direction,width*across).addScaledVector(cross,-.012*along*along);
    mesh.positions.push(point.x,point.y,point.z);mesh.colors.push(color.r,color.g,color.b);mesh.uvs.push(vertex%2,along);mesh.glow.push(0);
   }
   mesh.indices.push(base,base+2,base+1,base+1,base+2,base+3,base+2,base+4,base+3);
  }
 }
 return {tufts,vertexStart:start,vertexCount:mesh.positions.length/3-start};
}

export function penguinAnatomy(quality={}){
 const body=new PlantMesh(),eyes=new PlantMesh(),flipper=new PlantMesh(),foot=new PlantMesh(),armor=new PlantMesh();
 const armorCoat=[];
 const egg=(m,p,r,color,segments=14)=>m.ellipsoid(v(...p),v(...r),color,{segments,rings:segments>=20?16:10});
 // A single uninterrupted mantle runs from the belly to the crown.
 const profile=new THREE.CatmullRomCurve3([v(0,.11,0),v(.195,.25,.175),v(.28,.53,.24),v(.252,.79,.22),v(.23,1.035,.23),v(.165,1.17,.16),v(0,1.23,0)]);
 const tint=new THREE.Color(),back=new THREE.Color(PENGUIN_JOINT_COLORS.mantle),chest=new THREE.Color(0x90aeb3);
 const mantlePoint=(at,angle,clearance=0)=>{
  const ring=profile.getPoint(at),sin=Math.sin(angle),cos=Math.cos(angle),point=v(sin*Math.max(0,ring.x),ring.y,cos*Math.max(0,ring.z)+Math.max(0,ring.y-.65)*.035);
  if(clearance){
   const slope=profile.getTangent(at),along=v(sin*slope.x,slope.y,cos*slope.z+(ring.y>.65?slope.y*.035:0)),around=v(cos*ring.x,0,-sin*ring.z);
   point.addScaledVector(around.cross(along).normalize(),clearance);
  }
  return point;
 };
 const mantleAtHeight=y=>{
  let low=0,high=1;
  for(let step=0;step<18;step++){const mid=(low+high)/2;if(profile.getPoint(mid).y<y)low=mid;else high=mid;}
  return (low+high)/2;
 };
 body.grid(44,36,(u,t)=>mantlePoint(u,t*Math.PI*2),(u,t)=>tint.copy(back).lerp(chest,Math.max(0,Math.cos(t*Math.PI*2))*.36).getHex(),0,true);
 // The shell follows the same mantle, including its inward roll above the legs.
 // A narrow lowest edge and small open seams keep five distinct fitted plates.
 for(let plate=0;plate<5;plate++){
  const coatStart=armor.positions.length/3;
  const platePoint=(u,t,clearance=.01)=>{
   const across=t*2-1,y=.25+plate*.118+u*.11+.016*across*across,angle=across*(.7+.2*Math.min(1,(y-.25)/.13));
   return mantlePoint(mantleAtHeight(y),angle,clearance+.003*Math.sin(u*Math.PI));
  };
  armor.grid(10,24,(u,t)=>platePoint(u,t),(u,t)=>u<.12?0x788f94:plate%2?0xa0b8b5:0xb7c9c2,0,true);
  armor.tube([platePoint(.06,.2,.016),platePoint(.06,.5,.016),platePoint(.06,.8,.016)],[.003,.004,.003],0x768c90,6);
  armorCoat.push([coatStart,armor.positions.length/3]);
 }
 for(const side of [-1,1])body.tube([v(side*.105,.18,0),v(side*.105,.065,.02)],[.038,.033],PENGUIN_JOINT_COLORS.leg,8);
 // Two interlocking horn halves form a true squid-like hooked beak.
 armor.tube([v(0,.954,.205),v(0,.946,.29),v(0,.91,.365),v(0,.856,.395)],[.077,.064,.033,0],0x263341,12);
 armor.tube([v(0,.86,.215),v(0,.842,.30),v(0,.86,.367)],[.057,.043,0],0x455865,12);
 armor.tube([v(0,.963,.22),v(0,.954,.30),v(0,.913,.366)],[.009,.009,0],0x879da5,7);
 armor.tube([v(0,1.19,-.02),v(0,1.32,-.065),v(0,1.43,-.16)],[.062,.035,0],0xb3cdd0,12);
 for(let plate=0;plate<5;plate++){
  const coatStart=armor.positions.length/3;egg(armor,[0,.34+plate*.12,-.20],[.10,.085,.065],plate%2?0x597d89:0x385769,12);armorCoat.push([coatStart,armor.positions.length/3]);
 }
 for(const [x,y,z]of PENGUIN_EYES){
  const lid=x!==0?[v(x,y+.024,z-.06),v(x+Math.sign(x)*.006,y+.052,z-.035),v(x+Math.sign(x)*.008,y+.062,z),v(x+Math.sign(x)*.006,y+.052,z+.035),v(x,y+.024,z+.06)]:[v(-.06,y+.024,z),v(-.035,y+.052,z+.006),v(0,y+.062,z+.008),v(.035,y+.052,z+.006),v(.06,y+.024,z)];
  const fold=new THREE.CatmullRomCurve3(lid).getPoints(12);body.tube(fold,fold.map((_,i)=>.008+.004*Math.sin(i/12*Math.PI)),PENGUIN_JOINT_COLORS.eye,7);
  if(x!==0){
   const side=Math.sign(x);
   egg(eyes,[x,y,z],[.022,.066,.061],0x101d29,14);
   egg(eyes,[x+side*.017,y,z],[.013,.049,.045],0x80dfe0,16);
   egg(eyes,[x+side*.030,y,z],[.006,.034,.014],0x08131b,12);
   egg(eyes,[x+side*.036,y+.02,z+.012],[.004,.009,.008],0xf3fcf3,8);
  }else{
   egg(eyes,[x,y,z],[.061,.066,.022],0x101d29,14);
   egg(eyes,[x,y,z+.017],[.045,.049,.013],0x80dfe0,16);
   egg(eyes,[x,y,z+.030],[.014,.034,.006],0x08131b,12);
   egg(eyes,[x-.012,y+.02,z+.036],[.008,.009,.004],0xf3fcf3,8);
  }
 }
 flipper.grid(18,16,(u,t)=>{
  const angle=t*Math.PI*2,width=(.065+.12*Math.sin(u*Math.PI))*(1-u*.72),edge=1+.10*Math.sin(u*Math.PI*6);
  return v(Math.sin(angle)*.045*(1-u*.6),-.44*u,Math.cos(angle)*width*edge);
 },(u,t)=>Math.sin(t*Math.PI*2)>.2?PENGUIN_JOINT_COLORS.flipper:0x243e59,0,true);
 for(const side of [-1,1])flipper.tube([v(0,-.10,side*.09),v(0,-.22,side*.16),v(0,-.36,side*.10)],[.008,.012,0],0x9ac9ce,6);
 flipper.tube([v(0,-.02,.08),v(0,-.22,.1),v(0,-.4,.02)],[.018,.013,0],0x8eb6c5,7);
 egg(foot,[0,.045,.06],[.09,.038,.15],PENGUIN_JOINT_COLORS.foot,14);
 for(const x of [-.055,0,.055]){
  foot.tube([v(x,.05,.08),v(x,.035,.19),v(x,.03,.23)],[.032,.025,.014],0x7ca4ad,7);
  foot.tube([v(x,.031,.21),v(x,.023,.25),v(x,.012,.275)],[.017,.012,0],0xd2e8d9,7);
 }
 const coatColor=(u,t)=>tint.copy(back).lerp(chest,Math.max(0,Math.cos(t*Math.PI*2))*.36).multiplyScalar(.91+.09*Math.sin(u*71)**2).getHex();
 const tangent=v(0,0,0),around=v(0,0,0);
 const bodyFur=addCoatFur(body,quality.mobile?256:640,(u,t,root,normal)=>{
  const at=.035+u*.93,ring=profile.getPoint(at),slope=profile.getTangent(at),angle=t*Math.PI*2;
  root.set(Math.sin(angle)*ring.x,ring.y,Math.cos(angle)*ring.z+Math.max(0,ring.y-.65)*.035);
  tangent.set(Math.sin(angle)*slope.x,slope.y,Math.cos(angle)*slope.z+(ring.y>.65?slope.y*.035:0));around.set(Math.cos(angle)*ring.x,0,-Math.sin(angle)*ring.z);normal.crossVectors(around,tangent);
  return !PENGUIN_EYES.some(([x,y,z])=>Math.hypot(root.x-x,root.y-y,root.z-z)<.085);
 },coatColor);
 const flipperFur=addCoatFur(flipper,quality.mobile?40:90,(u,t,root,normal)=>{
  const at=.025+u*.94,angle=t*Math.PI*2,width=(.065+.12*Math.sin(at*Math.PI))*(1-at*.72),edge=1+.10*Math.sin(at*Math.PI*6);
  root.set(Math.sin(angle)*.045*(1-at*.6),-.44*at,Math.cos(angle)*width*edge);normal.set(Math.sin(angle),0,Math.cos(angle)*.65);
 },(u,t)=>Math.sin(t*Math.PI*2)>.2?PENGUIN_JOINT_COLORS.flipper:0x355b70);
 return Object.fromEntries(Object.entries({body,eyes,flipper,foot,armor}).map(([name,mesh])=>{
  const geometry=mesh.geometry({normalizeHeight:false});
  if(name!=='eyes'){
   const mask=new Float32Array(geometry.attributes.position.count);if(name==='body'||name==='flipper')mask.fill(1);
   if(name==='armor')for(const [start,end]of armorCoat)mask.fill(1,start,end);
   geometry.setAttribute('penguinCoat',new THREE.BufferAttribute(mask,1));
  }
  if(name==='body'||name==='flipper')geometry.userData.fur=name==='body'?bodyFur:flipperFur;
  return [name,geometry];
 }));
}

/** Seven bounded instanced batches; no individual lights or per-frame geometry. */
export class PenguinRenderer{
 constructor(world,quality={}){
  for(const bird of world.penguins??[])if(typeof bird.id!=='string'||![bird.x,bird.y,bird.z,bird.heading,bird.stride,bird.speed].every(Number.isFinite))throw new TypeError('Penguins need a named, finite position and animation pose.');
  this.group=new THREE.Group();this.group.name='three-eyed-alien-penguins';this.geometry=penguinAnatomy(quality);this.capacity=PENGUIN_RENDER_CAPACITY;
  this.maps=createCreatureSurfaceMaps('penguin-plumage',quality.mobile?64:128);
  for(const map of this.maps.textures)map.repeat.set(2,2);
  this.hornMaps=createCreatureSurfaceMaps('horn',quality.mobile?64:128);
  this.eyeMaps=createCreatureSurfaceMaps('collector-iris',64);
  this.materials={
   body:applyCreatureSurface(new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.82,clearcoat:.16,clearcoatRoughness:.4,side:THREE.DoubleSide}),this.maps,.32),
   eyes:applyCreatureSurface(new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.23,clearcoat:.6,clearcoatRoughness:.14}),this.eyeMaps,.08),
   armor:applyCreatureSurface(new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.68,clearcoat:.18,clearcoatRoughness:.3,side:THREE.DoubleSide}),this.hornMaps,.14)};

  for(const material of [this.materials.body,this.materials.armor]){
   const baby=new THREE.Color(PENGUIN_BABY_COAT),babyPigment=`vec3(${baby.r.toFixed(8)},${baby.g.toFixed(8)},${baby.b.toFixed(8)})`;
   material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float penguinWet; attribute float penguinGrowth; attribute float penguinCoat; varying float vPenguinWet; varying float vPenguinGrowth; varying float vPenguinCoat;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPenguinWet=penguinWet; vPenguinGrowth=penguinGrowth; vPenguinCoat=penguinCoat;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vPenguinWet; varying float vPenguinGrowth; varying float vPenguinCoat;')
     .replace('#include <color_fragment>',`#include <color_fragment>\nfloat babyCoat=(1.-clamp(vPenguinGrowth,0.,1.))*vPenguinCoat;\nvec3 babyPigment=${babyPigment}*vec3(1.-vPenguinWet*.18,1.-vPenguinWet*.14,1.-vPenguinWet*.08);\ndiffuseColor.rgb=mix(diffuseColor.rgb,babyPigment,babyCoat);`)
     .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.94,babyCoat);\nroughnessFactor=mix(roughnessFactor,max(.12,roughnessFactor*.55),clamp(vPenguinWet,0.,1.));');
   };
   material.customProgramCacheKey=()=> 'penguin-fur-growth-wet-coat-v2';
  }
  this.meshes={};const count=this.capacity;
  for(const name of Object.keys(this.geometry)){
   const mesh=new THREE.InstancedMesh(this.geometry[name],this.materials[name==='eyes'?'eyes':name==='armor'||name==='foot'?'armor':'body'],count*(name==='flipper'?4:name==='foot'?2:1));
   if(name!=='eyes')for(const attribute of ['penguinWet','penguinGrowth'])this.geometry[name].setAttribute(attribute,new THREE.InstancedBufferAttribute(new Float32Array(mesh.instanceMatrix.count),1).setUsage(THREE.DynamicDrawUsage));
   if(count)mesh.setColorAt(0,new THREE.Color(0xffffff));
   mesh.name='alien-penguin-'+name;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(mesh);this.meshes[name]=mesh;
  }
  this.joints=new PenguinJoints(count,quality);this.group.add(this.joints.mesh);this.tail=new PenguinTailRenderer(count,quality);this.group.add(this.tail.mesh);
  this.jointA=new THREE.Vector3();this.jointB=new THREE.Vector3();this.jointBend=new THREE.Vector3();
  this.wetTint=new THREE.Color();this.footBase=new THREE.Object3D();this.base=new THREE.Object3D();this.local=new THREE.Object3D();this.matrix=new THREE.Matrix4();this.disposed=false;
 }
 wetPose(mesh,index,wet,growth){
  mesh.geometry.attributes.penguinWet?.setX(index,wet);
  mesh.geometry.attributes.penguinGrowth?.setX(index,growth);
  this.wetTint.setRGB(1-wet*.18,1-wet*.14,1-wet*.08);mesh.setColorAt(index,this.wetTint);
 }
 update(world,time,reducedMotion=false,camera,quality={}){
  if(this.disposed)return;let count=0;this.joints.begin();this.tail.begin();
  for(const bird of world.penguins??[]){
   if(count===this.capacity)break;
   if(bird.lifecycleInactive||bird.squidRespawnIn>0||camera&&Math.hypot(bird.x/25-camera.x,bird.z/25-camera.y,bird.y/25-camera.z)>capRenderDistance(quality,quality.mobile?45:70))continue;
   const swimming=['diving','swimming','surfacing','landing'].includes(bird.state),scale=penguinGrowthScale(bird),growth=bird.offspringId?(scale-.38)/.62:1;
   const crouch=swimming?0:THREE.MathUtils.clamp(bird.nestCrouch??0,0,1),peck=reducedMotion||bird.state!=='defending'&&!bird.defendingNestId?0:Math.sin(Math.PI*THREE.MathUtils.clamp(bird.peckTime??0,0,1));
   const gait=reducedMotion||swimming?0:Math.sin(bird.stride)*Math.min(1,bird.speed/12)*(1-crouch),flap=reducedMotion||!swimming?0:Math.sin(bird.phase*9)*.35;
   // Keep the feet fixed while the mantle settles and the leg sleeves fold.
   this.base.position.set(bird.x/25+Math.cos(bird.heading)*peck*.06*scale,bird.z/25+(Math.abs(gait)*.009-crouch*.015)*scale,bird.y/25+Math.sin(bird.heading)*peck*.06*scale);
   this.base.rotation.set((bird.pitch??0)+crouch*.12+peck*.24,Math.PI/2-bird.heading,gait*.035,'YXZ');this.base.scale.set(scale,scale*(1-crouch*.18),scale);this.base.updateMatrix();
   const wet=bird.wetness??0;
   this.joints.setWetness(wet);this.joints.setGrowth(growth);
   this.wetPose(this.meshes.body,count,wet,growth);this.wetPose(this.meshes.armor,count,wet,growth);
   this.footBase.position.set(bird.x/25,bird.z/25,bird.y/25);this.footBase.rotation.set(0,Math.PI/2-bird.heading,0);this.footBase.scale.setScalar(scale);this.footBase.updateMatrix();
   this.meshes.body.setMatrixAt(count,this.base.matrix);this.meshes.eyes.setMatrixAt(count,this.base.matrix);this.meshes.armor.setMatrixAt(count,this.base.matrix);
   this.tail.bird(bird,wet);
   for(const [index,side]of [-1,1].entries()){
    for(let pair=0;pair<2;pair++){
     const stroke=pair?-flap*.8:flap;
     // The left limb presents its outer face outward. Rotate the shared shape
     // before its shoulder swing; negative instance scales invert lit surfaces.
     // Swimming has enough outward clearance for the entire recovery stroke.
     const spread=.18+Math.abs(gait)*.12+(swimming?.38:0)+stroke+peck*.12;
     this.local.position.set(side*(pair?.22:.255),pair?.45:.74,pair?-.04:-.01);this.local.rotation.set(gait*.07,side<0?Math.PI:0,side*spread,'ZXY');this.local.scale.setScalar(pair?.78:1);this.local.updateMatrix();
     this.matrix.multiplyMatrices(this.base.matrix,this.local.matrix);this.meshes.flipper.setMatrixAt(count*4+pair*2+index,this.matrix);this.wetPose(this.meshes.flipper,count*4+pair*2+index,wet,growth);
     this.jointA.set(side*(pair?.205:.23),pair?.45:.74,pair?-.04:-.01).applyMatrix4(this.base.matrix);
     this.jointB.set(0,-.065,0).applyMatrix4(this.matrix);this.jointBend.set(side*.012*scale,0,.006*scale).applyQuaternion(this.base.quaternion);
     this.joints.bend(this.jointA,this.jointB,(pair?.053:.065)*scale,this.jointBend,PENGUIN_JOINT_COLORS.mantle,PENGUIN_JOINT_COLORS.flipper);
    }
    this.local.scale.set(1,1,1);
    let footHeight=0;
    if(!swimming){
     if(Number.isFinite(bird.feetSurfaceZ))footHeight=(bird.feetSurfaceZ-bird.z)/(25*scale);
     else{
      const x=bird.x+(Math.sin(bird.heading)*side*.105+Math.cos(bird.heading)*gait*side*.055)*25*scale,y=bird.y+(-Math.cos(bird.heading)*side*.105+Math.sin(bird.heading)*gait*side*.055)*25*scale;
      const ice=highestIceAt(world.platforms??[],x,y);if(ice)footHeight=(getIceSurfaceHeight(ice,x,y)-bird.z)/(25*scale);
     }
    }
    this.local.position.set(side*.105,footHeight+Math.max(0,gait*side)*.045,gait*side*.055);this.local.rotation.set(0,0,0);this.local.updateMatrix();
    this.matrix.multiplyMatrices(swimming?this.base.matrix:this.footBase.matrix,this.local.matrix);this.meshes.foot.setMatrixAt(count*2+index,this.matrix);this.wetPose(this.meshes.foot,count*2+index,wet,growth);
    this.jointA.set(side*.105,.18,0).applyMatrix4(this.base.matrix);this.jointB.set(0,.075,.025).applyMatrix4(this.matrix);this.jointBend.set(0,0,.016*scale).applyQuaternion(this.base.quaternion);
    this.joints.bend(this.jointA,this.jointB,.046*scale,this.jointBend,PENGUIN_JOINT_COLORS.leg,PENGUIN_JOINT_COLORS.foot);
   }
   for(const [x,y,z]of PENGUIN_EYES){
    const side=Math.sign(x);this.jointA.set(x-side*.025,y,z).applyMatrix4(this.base.matrix);this.jointB.set(x+side*.016,y,z).applyMatrix4(this.base.matrix);
    this.joints.sleeve(this.jointA,this.jointB,.068*scale);
   }
   count++;
  }
  for(const [name,mesh]of Object.entries(this.meshes)){mesh.count=count*(name==='flipper'?4:name==='foot'?2:1);mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;for(const attribute of ['penguinWet','penguinGrowth'])if(mesh.geometry.attributes[attribute])mesh.geometry.attributes[attribute].needsUpdate=true;if(mesh.count)mesh.computeBoundingSphere();}
  this.joints.finish();this.tail.finish();this.group.visible=count>0;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.joints.dispose();this.tail.dispose();Object.values(this.meshes).forEach(m=>m.dispose());Object.values(this.geometry).forEach(g=>g.dispose());Object.values(this.materials).forEach(m=>m.dispose());this.maps.dispose();this.hornMaps.dispose();this.eyeMaps.dispose();this.group.removeFromParent();this.group.clear();}
}
