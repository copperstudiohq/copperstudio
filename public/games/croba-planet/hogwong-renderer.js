import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import { PlantMesh } from './plant-mesh.js';
import { createCreatureSurfaceMaps,applyCreatureSurface } from './creature-materials.js';
import { HOGWONG_FEET,hogwongTailPoint } from './tundra-hogwongs.js';
import { addHogwongFur,applyHogwongFur } from './hogwong-fur.js';
const v=(x,y,z)=>new THREE.Vector3(x,y,z),UP=v(0,1,0);
export const HOGWONG_COLORS=Object.freeze({hide:0x626b70,belly:0x899093,fur:0xe7eeed,
  beak:0x737e85,beakTip:0x414b53,spine:0x59656d,tail:0x424a53});
export const HOGWONG_BODY_DROP=.28;
export const HOGWONG_BEAK_HINGE=Object.freeze({x:0,y:1.255-HOGWONG_BODY_DROP,z:1.17});
export function hogwongBeakAngle(hog,reducedMotion=false){
  if(reducedMotion)return .025;
  if(hog.state==='biting')return .035+.40*Math.sin(Math.PI*Math.max(0,Math.min(1,hog.biteProgress??0)));
  if(hog.state==='grazing')return .04+.26*((1+Math.sin(hog.phase*2.4))*.5)**2;
  return hog.state==='shying' ? .16 : hog.state==='watching' ? .10 : .025;
}

function torsoSection(u){
  const envelope=Math.max(0,Math.sin(u*Math.PI))**.42;
  const shoulder=Math.exp(-(((u-.72)/.23)**2));
  const hip=Math.exp(-(((u-.23)/.21)**2));
  return {width:(.58+.035*hip-.05*u)*envelope,height:(.36+.075*shoulder)*envelope,y:.98+.08*shoulder-.025*hip};
}

// Broad, low keratin jaws retain the beak, with a rounded crocodilian nose
// instead of the old hooked bird tip. The lower lip follows this same curve.
const upperWidth=u=>.28-.035*u-.045*u**4;
const upperLip=u=>1.26-.035*u;
const upperHeight=u=>.165-.075*u;

/** A low crocodilian body under white fur, four squid eyes and a gray beak. */
export function hogwongAnatomy(quality={}){
  const body=new PlantMesh(),face=new PlantMesh(),leg=new PlantMesh(),mouth=new PlantMesh();
  const egg=(m,p,r,color,segments=16)=>m.ellipsoid(v(...p),v(...r),color,{segments,rings:10});
  const coat=new THREE.Color(),back=new THREE.Color(HOGWONG_COLORS.hide),belly=new THREE.Color(HOGWONG_COLORS.belly);
  // One continuous torso replaces the visibly separate rounded body sections.
  body.grid(28,24,(u,t)=>{
    const section=torsoSection(u),angle=t*Math.PI*2;
    return v(Math.sin(angle)*section.width,section.y+Math.cos(angle)*section.height,-1+1.92*u);
  },(u,t)=>coat.copy(back).lerp(belly,(1-Math.cos(t*Math.PI*2))*.36).getHex(),0,true);
  egg(body,[0,1.20,.70],[.39,.27,.40],HOGWONG_COLORS.hide,18);
  body.grid(10,16,(u,t)=>{
    const p=v(Math.sin(u*Math.PI)*Math.cos(t*Math.PI*2)*.35,1.35+Math.cos(u*Math.PI)*.27,1.02+Math.sin(u*Math.PI)*Math.sin(t*Math.PI*2)*.37);
    if(p.z>1.14&&p.y<1.28)p.y=1.28; // A clear opening behind the beak.
    return p;
  },HOGWONG_COLORS.hide);
  const bodyCoatEnd=body.positions.length/3;
  for(const side of [-1,1])for(const [height,z]of [[1.50,1.09],[1.29,1.11]]){
    // Four rounded yellow lenses, black outlines, horizontal squid pupils,
    // and two soft lid folds above each eye.
    egg(face,[side*.305,height,z],[.050,.093,.103],0x102332,14);
    egg(face,[side*.345,height,z+.008],[.030,.073,.084],(u,t)=>Math.sin(t*Math.PI*48+u*19)>.3?0xf0cd5d:0xd7ad3b,18);
    egg(face,[side*.371,height,z+.011],[.008,.016,.052],0x09151e,12);
    egg(face,[side*.378,height+.025,z+.038],[.006,.011,.011],0xf7f1ce,8);
    for(const fold of [0,.024])body.tube([v(side*.31,height+.068+fold,z-.09),v(side*.33,height+.101+fold,z),v(side*.33,height+.068+fold,z+.09)],
      [.014,.019,.014],HOGWONG_COLORS.hide,7);
  }
  // Upper beak and its recessed palate form the upper half of the mouth.
  face.grid(16,16,(u,t)=>v(Math.cos(t*Math.PI)*upperWidth(u),
    upperLip(u)+Math.sin(t*Math.PI)*upperHeight(u),1.16+.52*u),(u,t)=>{
      const tint=new THREE.Color(HOGWONG_COLORS.beak).lerp(new THREE.Color(HOGWONG_COLORS.beakTip),u*.48);
      return tint.multiplyScalar(.94+.06*Math.sin(u*28+t*4)**2).getHex();
    });
  face.grid(4,16,(u,t)=>v(Math.cos(t*Math.PI)*upperWidth(1)*u,
    upperLip(1)+Math.sin(t*Math.PI)*upperHeight(1)*u,1.68),HOGWONG_COLORS.beakTip,0,true);
  face.grid(16,2,(u,t)=>v((t*2-1)*upperWidth(u),upperLip(u)-.003,1.16+.52*u),0x252e35);
  for(const side of[-1,1]){
    egg(face,[side*.135,1.335,1.57],[.037,.013,.047],0x202b32,10);
    for(let tooth=0;tooth<5;tooth++){
      const u=.15+tooth*.15,x=side*(upperWidth(u)-.008),y=upperLip(u),z=1.16+.52*u;
      face.tube([v(x,y,z),v(x,y-.024,z+.012),v(x*.99,y-.039,z+.025)],[.021,.014,0],HOGWONG_COLORS.beakTip,6);
    }
  }
  // The lower half is local to the rear mouth hinge and follows the upper lip
  // curve when closed. Its rounded front fits under the upper nose.
  const lowerWidth=u=>upperWidth((.01+.45*u)/.52)*.93;
  const lowerLip=u=>upperLip((.01+.45*u)/.52)-HOGWONG_BEAK_HINGE.y-HOGWONG_BODY_DROP-.014;
  mouth.grid(16,16,(u,t)=>v(Math.cos(t*Math.PI)*lowerWidth(u),
    lowerLip(u)-Math.sin(t*Math.PI)*(.095-.025*u),.45*u),HOGWONG_COLORS.beak,0,true);
  mouth.grid(4,16,(u,t)=>v(Math.cos(t*Math.PI)*lowerWidth(1)*u,
    lowerLip(1)-Math.sin(t*Math.PI)*.07*u,.45),HOGWONG_COLORS.beakTip);
  mouth.grid(16,2,(u,t)=>v((t*2-1)*lowerWidth(u),lowerLip(u)+.003,.45*u),0x303940,0,true);
  for(const side of [-1,0,1])for(let i=0;i<7;i++){
    const z=-.72+i*.21,section=torsoSection((z+1)/1.92),x=side*.30;
    const y=section.y+section.height*Math.sqrt(Math.max(.05,1-(x/section.width)**2))-.012;
    const base=v(x,y,z),height=side===0?.34+.12*Math.sin(i*.5):.23;
    egg(body,base.toArray(),[.10,.035,.10],HOGWONG_COLORS.hide,10);
    body.tube([base,base.clone().add(v(side*.04,height*.55,-.08)),base.clone().add(v(side*.08,height,-.18))],
      [side===0?.09:.065,.045,0],u=>u>.85?0x939da3:u>.35?0x6d7980:HOGWONG_COLORS.spine,8);
  }
  // Tapered forearms and ankles blend into broad, weight-bearing paws.
  egg(leg,[0,-.055,-.005],[.225,.17,.225],HOGWONG_COLORS.hide,12);
  leg.tube([v(0,0,0),v(0,-.18,-.035),v(0,-.40,.015),v(0,-.61,.05),v(0,-.72,.07)],
    [.225,.20,.16,.125,.135],HOGWONG_COLORS.hide,12);
  const legCoatEnd=leg.positions.length/3;
  egg(leg,[0,-.74,.08],[.23,.12,.28],HOGWONG_COLORS.hide,16);
  for(const x of [-.12,0,.12]){
    egg(leg,[x,-.75,.23],[.075,.066,.11],HOGWONG_COLORS.hide,10);
    leg.tube([v(x,-.76,.285),v(x,-.77,.33),v(x,-.805,.36)],[.031,.023,0],0x414b53,7);
  }
  const furStart=body.positions.length/3,profileBefore={},profileAfter={};
  const torsoFur=addHogwongFur(body,quality.mobile?320:840,(u,t,root,normal,flow)=>{
    const at=.025+u*.95,angle=t*Math.PI*2,section=torsoSection(at),z=-1+at*1.92;
    root.set(Math.sin(angle)*section.width,section.y+Math.cos(angle)*section.height,z);
    // Leave the bony dorsal sockets clear rather than growing hair through
    // their bases. The coat remains dense on shoulders, flanks and belly.
    if(Math.cos(angle)>.3)for(const x of[-.30,0,.30])for(let row=0;row<7;row++)
      if(Math.abs(root.x-x)<.13&&Math.abs(z-(-.72+row*.21))<.13)return false;
    Object.assign(profileBefore,torsoSection(at-.001));Object.assign(profileAfter,torsoSection(at+.001));
    const nx=Math.sin(angle)/section.width,ny=Math.cos(angle)/section.height;
    normal.set(nx,ny,-(nx*Math.sin(angle)*(profileAfter.width-profileBefore.width)/.00384
      +ny*((profileAfter.y-profileBefore.y)+Math.cos(angle)*(profileAfter.height-profileBefore.height))/.00384));
    flow.set(0,-.25,-1);
  },()=>HOGWONG_COLORS.fur);
  const neckFur=addHogwongFur(body,quality.mobile?60:160,(u,t,root,normal,flow)=>{
    const a=u*Math.PI,b=t*Math.PI*2;
    root.set(Math.sin(a)*Math.cos(b)*.39,1.20+Math.cos(a)*.27,.70+Math.sin(a)*Math.sin(b)*.40);
    if(root.z<.92){const section=torsoSection(Math.max(.01,Math.min(.99,(root.z+1)/1.92)));
      if((root.x/section.width)**2+((root.y-section.y)/section.height)**2<1.04)return false;}
    normal.set(root.x/.39**2,(root.y-1.20)/.27**2,(root.z-.70)/.40**2);flow.set(0,-.4,-1);
  },()=>HOGWONG_COLORS.fur,{length:.095,width:.014});
  const headFur=addHogwongFur(body,quality.mobile?50:140,(u,t,root,normal,flow)=>{
    const a=u*Math.PI,b=t*Math.PI*2;
    root.set(Math.sin(a)*Math.cos(b)*.35,1.35+Math.cos(a)*.27,1.02+Math.sin(a)*Math.sin(b)*.37);
    if(root.z>1.14&&root.y<1.45||root.z<.79)return false;
    for(const side of[-1,1])for(const y of[1.50,1.29])
      if(Math.hypot(root.x-side*.305,root.y-y,root.z-1.10)<.16)return false;
    normal.set(root.x/.35**2,(root.y-1.35)/.27**2,(root.z-1.02)/.37**2);flow.set(0,-.25,-1);
  },()=>HOGWONG_COLORS.fur,{length:.048,width:.009});
  const legFur=addHogwongFur(leg,quality.mobile?16:48,(u,t,root,normal,flow)=>{
    const a=t*Math.PI*2,at=.025+u*.56,y=-at;
    const yRows=[0,-.18,-.40,-.61],zRows=[0,-.035,.015,.05],radii=[.225,.20,.16,.125];
    let row=0;while(row<2&&y<yRows[row+1])row++;
    const blend=(y-yRows[row])/(yRows[row+1]-yRows[row]),radius=THREE.MathUtils.lerp(radii[row],radii[row+1],blend),z=THREE.MathUtils.lerp(zRows[row],zRows[row+1],blend);
    root.set(Math.cos(a)*radius,y,z+Math.sin(a)*radius);normal.set(Math.cos(a),0,Math.sin(a));flow.set(0,-1,.1);
  },()=>HOGWONG_COLORS.fur,{length:.055,width:.007});
  const geometry={body:body.geometry({normalizeHeight:false}),face:face.geometry({normalizeHeight:false}),mouth:mouth.geometry({normalizeHeight:false}),legs:leg.geometry({normalizeHeight:false})};
  for(const [name,end,fur]of[['body',bodyCoatEnd,{tufts:torsoFur.tufts+neckFur.tufts+headFur.tufts,
    vertexStart:furStart,vertexCount:body.positions.length/3-furStart,regions:{torso:torsoFur,neck:neckFur,head:headFur}}],['legs',legCoatEnd,legFur]]){
    fur.strands=fur.tufts*3;
    const mask=new Float32Array(geometry[name].attributes.position.count);mask.fill(1,0,end);mask.fill(1,fur.vertexStart);
    // The fur parts around the exposed gray cheek, rather than coating the jaw.
    if(name==='body')for(let i=0;i<end;i++)if(geometry[name].attributes.position.getZ(i)>.99&&geometry[name].attributes.position.getY(i)<1.32)mask[i]=0;
    geometry[name].setAttribute('hogwongFurMask',new THREE.BufferAttribute(mask,1));geometry[name].userData.fur=fur;
  }
  // Lower the complete coat/head together and shorten the supported legs.
  // Keeping the beak local to its lowered hinge preserves the bite animation.
  geometry.body.translate(0,-HOGWONG_BODY_DROP,0);geometry.face.translate(0,-HOGWONG_BODY_DROP,0);
  geometry.legs.scale(1,.70,1);
  return geometry;
}

/** Smooth dark gray links with subtle growth rings, tapered in one batch. */
function hogwongTailGeometry(capacity){
  const mesh=new PlantMesh(),gray=new THREE.Color(HOGWONG_COLORS.tail);
  mesh.grid(8,12,(u,t)=>v(Math.cos(t*Math.PI*2),u-.5,Math.sin(t*Math.PI*2)*.68),
    u=>gray.clone().multiplyScalar(u>=.625&&u<.875?.81:1).getHex(),0,true);
  const geometry=mesh.geometry({normalizeHeight:false});
  geometry.setAttribute('hogwongTailTaper',new THREE.InstancedBufferAttribute(new Float32Array(capacity*8),1).setUsage(THREE.DynamicDrawUsage));
  return geometry;
}
const tailRadius=joint=>.13*(1-joint/8)**1.1+.006;

/** Five shared batches render all Hogwongs; the tail and legs are articulated. */
export class HogwongRenderer {
  constructor(world,quality={}){
    for(const h of world.hogwongs??[])if(typeof h.id!=='string'||![h.x,h.y,h.z,h.heading,h.phase].every(Number.isFinite))throw new TypeError('Hogwongs need a named, finite pose and animation phase.');
    this.group=new THREE.Group();this.group.name='tundra-hogwongs';this.disposed=false;
    this.maps=createCreatureSurfaceMaps('hogwong-hide',quality.mobile?64:128);
    this.beakMaps=createCreatureSurfaceMaps('horn',quality.mobile?64:128);this.geometry=hogwongAnatomy(quality);
    const count=world.hogwongs?.length??0;this.geometry.tail=hogwongTailGeometry(count);
    this.materials={body:applyHogwongFur(applyCreatureSurface(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94}),this.maps,.28)),
      face:applyCreatureSurface(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.65}),this.beakMaps,.10),tail:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.8})};
    this.materials.tail.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float hogwongTailTaper;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.xz*=mix(1.,hogwongTailTaper,position.y+.5);');
    };
    this.materials.tail.customProgramCacheKey=()=> 'hogwong-gray-tail-taper-v1';
    this.meshes={};
    for(const kind of ['body','face','mouth','legs','tail']){
      const mesh=new THREE.InstancedMesh(this.geometry[kind],this.materials[kind==='legs'?'body':kind==='mouth'?'face':kind],count*(kind==='legs'?6:kind==='tail'?8:1));
      mesh.name=`hogwong-${kind}`;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(mesh);this.meshes[kind]=mesh;
    }
    this.base=new THREE.Object3D();this.pose=new THREE.Object3D();this.local=new THREE.Object3D();this.matrix=new THREE.Matrix4();this.a=new THREE.Vector3();this.b=new THREE.Vector3();this.axis=new THREE.Vector3();
  }
  update(world,_time,reducedMotion=false,camera,quality={}){
    if(this.disposed)return;let count=0;
    for(const h of world.hogwongs??[]){
      if(h.squidRespawnIn>0||camera&&Math.hypot(h.x/25-camera.x,h.z/25-camera.y,h.y/25-camera.z)>capRenderDistance(quality,quality.mobile?45:70))continue;
      this.base.position.set(h.x/25,h.z/25,h.y/25);this.base.rotation.set(0,Math.PI/2-h.heading,0);this.base.updateMatrix();
      this.pose.position.copy(this.base.position);
      const stride=h.stridePhase??h.phase*3,walkBlend=h.walkBlend??Math.min(1,h.speed/15);
      if(!reducedMotion)this.pose.position.y+=Math.sin(h.phase*.9)*.006+Math.sin(stride*2)*walkBlend*.012;
      const biteDip=!reducedMotion&&h.state==='biting'?Math.sin(Math.PI*Math.max(0,Math.min(1,h.biteProgress??0)))*.14:0;
      this.pose.rotation.set((h.pitch??0)+biteDip,Math.PI/2-h.heading,h.roll??0,'YXZ');this.pose.updateMatrix();
      this.meshes.body.setMatrixAt(count,this.pose.matrix);this.meshes.face.setMatrixAt(count,this.pose.matrix);
      this.local.position.set(0,HOGWONG_BEAK_HINGE.y,HOGWONG_BEAK_HINGE.z);this.local.rotation.set(hogwongBeakAngle(h,reducedMotion),0,0);this.local.scale.set(1,1,1);this.local.updateMatrix();
      this.matrix.multiplyMatrices(this.pose.matrix,this.local.matrix);this.meshes.mouth.setMatrixAt(count,this.matrix);
      for(let foot=0;foot<6;foot++){
        const [x,z]=HOGWONG_FEET[foot],walking=walkBlend;
        const cycle=stride+(foot%2?Math.PI:0)+(Math.floor(foot/2)%2?Math.PI:0);
        const gait=reducedMotion?0:Math.sin(cycle)*walking*.10;
        const lift=reducedMotion?0:Math.max(0,Math.sin(cycle))*walking*.065;
        const reach=reducedMotion?0:Math.cos(cycle)*walking*.075;
        const floor=h.squidHeldBy?h.z:h.feet?.[foot]??h.z;
        this.local.position.set(x,.60+(floor-h.z)/25+lift,z+reach);this.local.rotation.set(gait,0,Math.sign(x)*.28);this.local.scale.set(1,1,1);this.local.updateMatrix();
        this.matrix.multiplyMatrices(this.base.matrix,this.local.matrix);this.meshes.legs.setMatrixAt(count*6+foot,this.matrix);
      }
      for(let joint=0;joint<8;joint++){
        const a=hogwongTailPoint(h,joint,reducedMotion),b=hogwongTailPoint(h,joint+1,reducedMotion);
        this.a.set(a.x,a.y-HOGWONG_BODY_DROP,a.z);this.b.set(b.x,b.y-HOGWONG_BODY_DROP,b.z);this.axis.subVectors(this.b,this.a);const span=this.axis.length();
        this.local.position.copy(this.a).add(this.b).multiplyScalar(.5);this.local.quaternion.setFromUnitVectors(UP,this.axis.divideScalar(span));
        const radius=tailRadius(joint);this.local.scale.set(radius,span,radius);this.local.updateMatrix();
        this.geometry.tail.attributes.hogwongTailTaper.setX(count*8+joint,tailRadius(joint+1)/radius);
        this.matrix.multiplyMatrices(this.pose.matrix,this.local.matrix);this.meshes.tail.setMatrixAt(count*8+joint,this.matrix);
      }
      count++;
    }
    this.group.visible=count>0;
    this.geometry.tail.attributes.hogwongTailTaper.needsUpdate=true;
    for(const [kind,mesh]of Object.entries(this.meshes)){mesh.count=count*(kind==='legs'?6:kind==='tail'?8:1);mesh.instanceMatrix.needsUpdate=true;if(count)mesh.computeBoundingSphere();}
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.group.removeFromParent();Object.values(this.meshes).forEach(m=>m.dispose());Object.values(this.geometry).forEach(g=>g.dispose());Object.values(this.materials).forEach(m=>m.dispose());this.maps.dispose();this.beakMaps.dispose();this.group.clear();}
}
