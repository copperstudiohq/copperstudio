import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import { PlantMesh } from './plant-mesh.js';
import { createCreatureSurfaceMaps,applyCreatureSurface } from './creature-materials.js';
import { HOGWONG_FEET,hogwongTailPoint } from './tundra-hogwongs.js';
import { addHogwongFur,applyHogwongFur } from './hogwong-fur.js';
import {getWildlifeRenderPopulation} from './wildlife-lifecycle.js';
const v=(x,y,z)=>new THREE.Vector3(x,y,z),UP=v(0,1,0);
const TORSO_BACK=-.86,TORSO_LENGTH=1.78,BEAK_LENGTH=.46;
const skullProfile=new THREE.CatmullRomCurve3([
  v(0,1.28,.62),v(.25,1.36,.75),v(.32,1.38,.94),v(.29,1.36,1.12),v(.17,1.29,1.27),v(0,1.27,1.35)
]);
function skullPoint(u,t,target=v(0,0,0)){
  const section=skullProfile.getPoint(u),a=t*Math.PI*2,r=Math.max(0,section.x);
  return target.set(Math.sin(a)*r,section.y+Math.cos(a)*r*.75-HOGWONG_HEAD_DROP,section.z);
}
export const HOGWONG_COLORS=Object.freeze({hide:0x626b70,belly:0x899093,fur:0xe7eeed,
  beak:0x737e85,beakTip:0x414b53,spine:0x303841,tail:0x424a53});
export const HOGWONG_BODY_DROP=.28;
export const HOGWONG_HEAD_DROP=.14;
export const HOGWONG_TAIL_RENDER_LINKS=16;
export const HOGWONG_BEAK_HINGE=Object.freeze({x:0,y:1.255-HOGWONG_BODY_DROP-HOGWONG_HEAD_DROP,z:1.17});
export const HOGWONG_EYES=Object.freeze([-1,1].flatMap(side=>[
  [side*.274,1.46-HOGWONG_HEAD_DROP,1.09],[side*.298,1.32-HOGWONG_HEAD_DROP,1.08]
]).map(Object.freeze));
export function hogwongBeakAngle(hog,reducedMotion=false){
  if(reducedMotion)return .025;
  if(hog.state==='biting')return .035+.40*Math.sin(Math.PI*Math.max(0,Math.min(1,hog.biteProgress??0)));
  if(hog.state==='grazing')return .04+.26*((1+Math.sin(hog.phase*2.4))*.5)**2;
  return hog.state==='shying' ? .16 : hog.state==='watching' ? .10 : .025;
}

function torsoSection(u){
  const envelope=Math.max(0,Math.sin(u*Math.PI))**.35;
  const shoulder=Math.exp(-(((u-.72)/.23)**2));
  const hip=Math.exp(-(((u-.23)/.21)**2));
  return {width:(.56+.035*hip+.060*shoulder-.030*u)*envelope,
    height:(.38+.10*shoulder+.015*hip)*envelope,y:.98+.08*shoulder-.025*hip};
}

/** Small fixed coat clumps also seat every long lock on the actual hide. */
function coatPoint(u,angle,target=v(0,0,0)){
  const section=torsoSection(u),sin=Math.sin(angle),cos=Math.cos(angle),z=TORSO_BACK+TORSO_LENGTH*u;
  const clump=(Math.sin(angle*15+u*29)*Math.sin(angle*9-u*37)*.009+Math.sin(angle*23-u*47)*.005)*Math.sin(Math.PI*u);
  return target.set(sin*(section.width+clump),section.y+cos*(section.height+clump),z);
}

/** Static gray/white coat clumps and soft root shade. This postprocess is
 * Hogwong-only; the shared strand builder remains unchanged for other fauna. */
function addCoatPigment(geometry,kind,fur){
  const p=geometry.attributes.position,pigment=new Float32Array(p.count*3);
  const roots=[.33,.36,.38],patchColors=[.27,.27,.25],tips=[.64,.66,.65];
  const write=(index,x,y,z,tip)=>{
    const noise=.5+(Math.sin(x*6.7+y*4.1+z*8.3)+.6*Math.sin(x*11.3-y*7.9+z*3.7)+.3*Math.sin(x*3.5+y*14.1-z*5.9))/3.8;
    const rawPatch=THREE.MathUtils.smoothstep(noise,.30,.70),patch=kind==='body'&&z>.75&&y>1.25?Math.max(.70,rawPatch):rawPatch;
    const height=kind==='body'?y-HOGWONG_BODY_DROP:y*.7+.6;
    const shade=.80+.20*THREE.MathUtils.smoothstep(height,.30,1.05),blend=Math.pow(tip,.7);
    for(let c=0;c<3;c++){
      const root=roots[c]+patchColors[c]*patch;
      const end=tips[c]+.10*patch;
      pigment[index*3+c]=(root+(end-root)*blend)*shade;
    }
  };
  for(let i=0;i<p.count;i++)write(i,p.getX(i),p.getY(i),p.getZ(i),0);
  for(let i=fur.vertexStart;i<p.count;i+=4)for(let vertex=0;vertex<4;vertex++)
    write(i+vertex,p.getX(i),p.getY(i),p.getZ(i),vertex===0?0:vertex===3?1:.42);
  geometry.setAttribute('hogwongCoatColor',new THREE.BufferAttribute(pigment,3));
}

// A broad crocodilian base rolls into one downward-hooked keratin tip.
// The moving lower jaw follows the same lip behind the exposed upper hook.
const hook=u=>THREE.MathUtils.smoothstep(u,.72,1);
const upperWidth=u=>(.235-.080*u)*(1-.94*hook(u));
const upperLip=u=>1.26-HOGWONG_HEAD_DROP-.025*u-.17*hook(u);
const upperHeight=u=>.14-.060*u+.025*hook(u);
// Radius, height and forward offset form one closed fleshy limb. Rounded
// upper thighs roll into bent elbows and ankles instead of open tube rims.
const legProfile=new THREE.CatmullRomCurve3([
  v(0,.13,-.04),v(.16,.07,-.04),v(.24,-.07,-.05),v(.205,-.25,-.07),
  v(.18,-.39,.015),v(.14,-.48,.055),v(.135,-.55,.055),v(.10,-.60,.055),v(0,-.64,.055)
]);

/** A low crocodilian body under white fur, four squid eyes and a gray beak. */
export function hogwongAnatomy(quality={}){
  const body=new PlantMesh(),face=new PlantMesh(),leg=new PlantMesh(),mouth=new PlantMesh();
  const egg=(m,p,r,color,segments=16)=>m.ellipsoid(v(...p),v(...r),color,{segments,rings:10});
  const coat=new THREE.Color(),back=new THREE.Color(HOGWONG_COLORS.hide),belly=new THREE.Color(HOGWONG_COLORS.belly);
  // One continuous torso replaces the visibly separate rounded body sections.
  body.grid(36,32,(u,t)=>coatPoint(u,t*Math.PI*2),
    (u,t)=>coat.copy(back).lerp(belly,(1-Math.cos(t*Math.PI*2))*.36).getHex(),0,true);
  egg(body,[0,1.20,.70],[.39,.27,.40],HOGWONG_COLORS.hide,18);
  body.grid(16,24,(u,t)=>skullPoint(u,t),HOGWONG_COLORS.hide,0,true);
  const bodyCoatEnd=body.positions.length/3;
  for(const[x,height,z]of HOGWONG_EYES){
    const side=Math.sign(x);
    egg(face,[x,height,z],[.024,.059,.060],0x172129,14);
    egg(face,[x+side*.014,height,z+.003],[.013,.046,.047],(u,t)=>Math.sin(t*Math.PI*48+u*19)>.3?0xe5ba4e:0xbe8b2d,18);
    egg(face,[x+side*.028,height,z+.005],[.004,.017,.020],0x0a151b,12);
    egg(face,[x+side*.033,height+.016,z+.014],[.003,.007,.006],0xf7f1ce,8);
  }
  // Upper beak and its recessed palate form the upper half of the mouth.
  face.grid(16,16,(u,t)=>v(Math.cos(t*Math.PI)*upperWidth(u),
    upperLip(u)+Math.sin(t*Math.PI)*upperHeight(u),1.16+BEAK_LENGTH*u),(u,t)=>{
      const tint=new THREE.Color(HOGWONG_COLORS.beak).lerp(new THREE.Color(HOGWONG_COLORS.beakTip),u*.48);
      return tint.multiplyScalar(.94+.06*Math.sin(u*28+t*4)**2).getHex();
    });
  face.grid(4,16,(u,t)=>v(Math.cos(t*Math.PI)*upperWidth(1)*u,
    upperLip(1)+Math.sin(t*Math.PI)*upperHeight(1)*u,1.16+BEAK_LENGTH),HOGWONG_COLORS.beakTip,0,true);
  face.grid(16,2,(u,t)=>v((t*2-1)*upperWidth(u),upperLip(u)-.003,1.16+BEAK_LENGTH*u),0x252e35);
  for(const side of[-1,1]){
    const u=.57,nostrilY=upperLip(u)+Math.sqrt(1-.58**2)*upperHeight(u)+.004;
    egg(face,[side*upperWidth(u)*.58,nostrilY,1.16+BEAK_LENGTH*u],[.024,.008,.027],0x202b32,10);
    const ridge=[.08,.28,.50,.68].map(at=>v(side*upperWidth(at)*.94,upperLip(at)+.029,1.16+BEAK_LENGTH*at));
    face.tube(ridge,[.006,.008,.007,.003],0x4f5a62,6);
    for(let tooth=0;tooth<5;tooth++){
      const u=.15+tooth*.15,x=side*(upperWidth(u)-.008),y=upperLip(u),z=1.16+BEAK_LENGTH*u;
      face.tube([v(x,y,z),v(x,y-.012,z+.007),v(x*.99,y-.020,z+.014)],[.015,.010,0],HOGWONG_COLORS.beakTip,6);
    }
  }
  // The lower half is local to the rear mouth hinge and follows the upper lip
  // curve when closed. Its rounded front fits under the upper nose.
  const lowerWidth=u=>upperWidth((.01+.40*u)/BEAK_LENGTH)*.93;
  const lowerLip=u=>upperLip((.01+.40*u)/BEAK_LENGTH)-HOGWONG_BEAK_HINGE.y-HOGWONG_BODY_DROP-.014;
  mouth.grid(16,16,(u,t)=>v(Math.cos(t*Math.PI)*lowerWidth(u),
    lowerLip(u)-Math.sin(t*Math.PI)*(.085-.025*u),.40*u),HOGWONG_COLORS.beak,0,true);
  mouth.grid(4,16,(u,t)=>v(Math.cos(t*Math.PI)*lowerWidth(1)*u,
    lowerLip(1)-Math.sin(t*Math.PI)*.06*u,.40),HOGWONG_COLORS.beakTip);
  mouth.grid(16,2,(u,t)=>v((t*2-1)*lowerWidth(u),lowerLip(u)+.003,.40*u),0x303940,0,true);
  const spineSockets=[];
  for(const side of [-1,0,1])for(let i=0,count=side===0?7:5;i<count;i++){
    const at=i/(count-1),z=-.75+at*1.30+Math.sin(i*1.7+side)*.020,section=torsoSection((z-TORSO_BACK)/TORSO_LENGTH),x=side*.28;
    const y=section.y+section.height*Math.sqrt(Math.max(.05,1-(x/section.width)**2))-.030;
    const base=v(x,y,z),height=side===0?.12+.32*at:.07+.13*at;
    const spine=new THREE.CatmullRomCurve3([base,base.clone().add(v(side*.02,height*.48,-.045)),
      base.clone().add(v(side*.05,height*.84,-.15)),base.clone().add(v(side*.08,height,-.34))]).getPoints(4);
    const radius=side===0?.060+.020*at:.038+.009*at;
    spineSockets.push({x,z,radius});
    body.tube(spine,[radius,radius*.76,radius*.46,radius*.19,0],
      u=>u>.85?0x19222b:u>.35?0x343d46:HOGWONG_COLORS.spine,8);
  }
  leg.grid(18,12,(u,t)=>{
    const section=legProfile.getPoint(u),radius=Math.max(0,section.x),angle=t*Math.PI*2;
    return v(Math.cos(angle)*radius,section.y,section.z+Math.sin(angle)*radius*.94);
  },HOGWONG_COLORS.hide);
  const legCoatEnd=leg.positions.length/3;
  // A taller domed pad intersects the ankle; lifting its center preserves the
  // original bottom exactly, including the existing grounded foot transform.
  egg(leg,[0,-.54,.035],[.145,.09,.13],0x4c565c,12);
  egg(leg,[0,-.69,.055],[.21,.17,.16],0x4c565c,16);
  for(const x of [-.12,-.04,.04,.12]){
    egg(leg,[x,-.71,.16],[.055,.10,.075],0x4c565c,10);
    leg.tube([v(x,-.76,.210),v(x,-.77,.25),v(x,-.805,.29)],[.027,.019,0],0x252e34,7);
  }
  const furStart=body.positions.length/3,profileBefore={},profileAfter={};
  const torsoFur=addHogwongFur(body,quality.mobile?288:760,(u,t,root,normal,flow)=>{
    const at=.025+u*.95,angle=t*Math.PI*2,section=torsoSection(at),z=TORSO_BACK+at*TORSO_LENGTH;
    coatPoint(at,angle,root);
    // Leave the bony dorsal sockets clear rather than growing hair through
    // their bases. The coat remains dense on shoulders, flanks and belly.
    if(Math.cos(angle)>.3)for(const socket of spineSockets)
      if(Math.hypot(root.x-socket.x,z-socket.z)<socket.radius+.015)return false;
    Object.assign(profileBefore,torsoSection(at-.001));Object.assign(profileAfter,torsoSection(at+.001));
    const nx=Math.sin(angle)/section.width,ny=Math.cos(angle)/section.height;
    normal.set(nx,ny,-(nx*Math.sin(angle)*(profileAfter.width-profileBefore.width)
      +ny*((profileAfter.y-profileBefore.y)+Math.cos(angle)*(profileAfter.height-profileBefore.height)))/(TORSO_LENGTH*.002));
    flow.set(Math.sin(u*47+t*29)*.20,-.70-.20*Math.sin(u*19+t*13),-.65+.22*Math.cos(u*31-t*17));
  },()=>HOGWONG_COLORS.fur,{length:.145,width:.020});
  const shoulderFur=addHogwongFur(body,quality.mobile?24:80,(u,t,root,normal,flow)=>{
    const at=.62+u*.30,angle=(t<.5?1:-1)*(.85+(t*2%1)),section=torsoSection(at);
    coatPoint(at,angle,root);
    normal.set(Math.sin(angle)/section.width,Math.cos(angle)/section.height,-.1);
    flow.set(Math.sin(u*29+t*13)*.16,-1,-.25+.18*Math.cos(u*31+t*11));
  },()=>HOGWONG_COLORS.fur,{length:.20,width:.026});
  const neckFur=addHogwongFur(body,quality.mobile?60:160,(u,t,root,normal,flow)=>{
    const a=u*Math.PI,b=t*Math.PI*2;
    root.set(Math.sin(a)*Math.cos(b)*.39,1.20+Math.cos(a)*.27,.70+Math.sin(a)*Math.sin(b)*.40);
      if(root.z>1.19&&root.y<1.42)return false;
      if(root.z<.92){const section=torsoSection(Math.max(.01,Math.min(.99,(root.z-TORSO_BACK)/TORSO_LENGTH)));
      if((root.x/section.width)**2+((root.y-section.y)/section.height)**2<1.04)return false;}
    normal.set(root.x/.39**2,(root.y-1.20)/.27**2,(root.z-.70)/.40**2);flow.set(Math.sin(u*17+t*19)*.10,-.4,-1);
  },()=>HOGWONG_COLORS.fur,{length:.095,width:.014});
  const headFur=addHogwongFur(body,quality.mobile?50:140,(u,t,root,normal,flow)=>{
    const at=.12+u*.78,a=t*Math.PI*2,section=skullProfile.getPoint(at),tangent=skullProfile.getTangent(at);
    skullPoint(at,t,root);
    if(root.z>1.19&&root.y+HOGWONG_HEAD_DROP<1.42||root.z<.72)return false;
    for(const[x,y,z]of HOGWONG_EYES)if(Math.hypot(root.x-x,root.y-y,root.z-z)<.11)return false;
    const around=v(Math.cos(a)*section.x,-Math.sin(a)*section.x*.75,0);
    normal.crossVectors(v(Math.sin(a)*tangent.x,tangent.y+Math.cos(a)*tangent.x*.75,tangent.z),around);
    flow.set(Math.sin(u*19+t*23)*.12,-.35,-1);
  },()=>HOGWONG_COLORS.fur,{length:.060,width:.012});
  const legFur=addHogwongFur(leg,quality.mobile?16:48,(u,t,root,normal,flow)=>{
    const a=t*Math.PI*2,at=.06+u*.73,section=legProfile.getPoint(at),tangent=legProfile.getTangent(at);
    const around=v(-Math.sin(a)*section.x,0,Math.cos(a)*section.x*.94);
    root.set(Math.cos(a)*section.x,section.y,section.z+Math.sin(a)*section.x*.94);
    if(root.y<-.40)return false;
    normal.copy(around).cross(v(Math.cos(a)*tangent.x,tangent.y,tangent.z+Math.sin(a)*tangent.x*.94));
    flow.set(Math.cos(u*31+t*19)*.10,-1,.05+.10*Math.sin(u*13+t*17));
  },()=>HOGWONG_COLORS.fur,{length:.10,width:.014});
  const geometry={body:body.geometry({normalizeHeight:false}),face:face.geometry({normalizeHeight:false}),mouth:mouth.geometry({normalizeHeight:false}),legs:leg.geometry({normalizeHeight:false})};
  for(const [name,end,fur]of[['body',bodyCoatEnd,{tufts:torsoFur.tufts+shoulderFur.tufts+neckFur.tufts+headFur.tufts,
    vertexStart:furStart,vertexCount:body.positions.length/3-furStart,regions:{torso:torsoFur,shoulders:shoulderFur,neck:neckFur,head:headFur}}],['legs',legCoatEnd,legFur]]){
    fur.strands=fur.tufts*3;
    const mask=new Float32Array(geometry[name].attributes.position.count);mask.fill(1,0,end);mask.fill(1,fur.vertexStart);
    // The fur parts around the exposed gray cheek, rather than coating the jaw.
    if(name==='body')for(let i=0;i<end;i++){
      const p=geometry[name].attributes.position,face=THREE.MathUtils.smoothstep(p.getZ(i),1.14,1.27)
        *(1-THREE.MathUtils.smoothstep(p.getY(i)+HOGWONG_HEAD_DROP,1.31,1.44));
      mask[i]*=1-face;
    }
    geometry[name].setAttribute('hogwongFurMask',new THREE.BufferAttribute(mask,1));geometry[name].userData.fur=fur;
    addCoatPigment(geometry[name],name,fur);
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
  geometry.setAttribute('hogwongTailTaper',new THREE.InstancedBufferAttribute(new Float32Array(capacity*HOGWONG_TAIL_RENDER_LINKS),1).setUsage(THREE.DynamicDrawUsage));
  return geometry;
}
const tailRadius=joint=>.085*(1-joint/8)**1.9+.004;
function curledTailPoint(point,joint,target){
  const w=joint/8,baseY=(point.y-HOGWONG_BODY_DROP+.62*w)*.35+.77*.65;
  const turn=Math.max(0,(w-.5)*2)*Math.PI*1.05;
  return target.set(point.x*.35,baseY-.10*(1-Math.cos(turn)),
    w<=.5?-.86-2.44*w:-2.08-.26*Math.sin(turn));
}

/** Five shared batches render all Hogwongs; the tail and legs are articulated. */
export class HogwongRenderer {
  constructor(world,quality={}){
    const population=getWildlifeRenderPopulation(world,'hogwong');
    for(const h of population)if(typeof h.id!=='string'||![h.x,h.y,h.z,h.heading,h.phase].every(Number.isFinite))throw new TypeError('Hogwongs need a named, finite pose and animation phase.');
    this.group=new THREE.Group();this.group.name='tundra-hogwongs';this.disposed=false;
    this.maps=createCreatureSurfaceMaps('hogwong-hide',quality.mobile?64:128);
    this.beakMaps=createCreatureSurfaceMaps('horn',quality.mobile?64:128);this.geometry=hogwongAnatomy(quality);
    const count=population.length;this.geometry.tail=hogwongTailGeometry(count);
    this.materials={body:applyHogwongFur(applyCreatureSurface(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94}),this.maps,.12)),
      face:applyCreatureSurface(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.65}),this.beakMaps,.10),tail:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.8})};
    this.materials.tail.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float hogwongTailTaper;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.xz*=mix(1.,hogwongTailTaper,position.y+.5);');
    };
    this.materials.tail.customProgramCacheKey=()=> 'hogwong-gray-tail-taper-v1';
    this.meshes={};
    for(const kind of ['body','face','mouth','legs','tail']){
      const mesh=new THREE.InstancedMesh(this.geometry[kind],this.materials[kind==='legs'?'body':kind==='mouth'?'face':kind],count*(kind==='legs'?6:kind==='tail'?HOGWONG_TAIL_RENDER_LINKS:1));
      mesh.name=`hogwong-${kind}`;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(mesh);this.meshes[kind]=mesh;
    }
    this.base=new THREE.Object3D();this.pose=new THREE.Object3D();this.local=new THREE.Object3D();this.matrix=new THREE.Matrix4();this.a=new THREE.Vector3();this.b=new THREE.Vector3();this.axis=new THREE.Vector3();
  }
  update(world,_time,reducedMotion=false,camera,quality={}){
    if(this.disposed)return;let count=0;
    for(const h of getWildlifeRenderPopulation(world,'hogwong')){
      if(h.lifecycleInactive||h.squidRespawnIn>0||camera&&Math.hypot(h.x/25-camera.x,h.z/25-camera.y,h.y/25-camera.z)>capRenderDistance(quality,quality.mobile?45:70))continue;
      const scale=Number.isFinite(h.lifecycleScale)?Math.max(.1,Math.min(1,h.lifecycleScale)):1;
      this.base.position.set(h.x/25,h.z/25,h.y/25);this.base.rotation.set(0,Math.PI/2-h.heading,0);this.base.scale.setScalar(scale);this.base.updateMatrix();
      this.pose.position.copy(this.base.position);
      const stride=h.stridePhase??h.phase*3,walkBlend=h.walkBlend??Math.min(1,h.speed/15);
      if(!reducedMotion)this.pose.position.y+=Math.sin(h.phase*.9)*.006+Math.sin(stride*2)*walkBlend*.012;
      const biteDip=!reducedMotion&&h.state==='biting'?Math.sin(Math.PI*Math.max(0,Math.min(1,h.biteProgress??0)))*.14:0;
      this.pose.rotation.set((h.pitch??0)+biteDip,Math.PI/2-h.heading,h.roll??0,'YXZ');this.pose.scale.setScalar(scale);this.pose.updateMatrix();
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
        this.local.position.set(x,.60+(floor-h.z)/(25*scale)+lift,z+reach);this.local.rotation.set(gait,0,Math.sign(x)*.28);this.local.scale.set(1,1,1);this.local.updateMatrix();
        this.matrix.multiplyMatrices(this.base.matrix,this.local.matrix);this.meshes.legs.setMatrixAt(count*6+foot,this.matrix);
      }
      for(let link=0;link<HOGWONG_TAIL_RENDER_LINKS;link++){
        // Sample the existing eight-joint motion with render-only subdivisions.
        const joint=link*8/HOGWONG_TAIL_RENDER_LINKS,next=(link+1)*8/HOGWONG_TAIL_RENDER_LINKS;
        hogwongTailPoint(h,joint,reducedMotion,this.a);hogwongTailPoint(h,next,reducedMotion,this.b);
        curledTailPoint(this.a,joint,this.a);curledTailPoint(this.b,next,this.b);this.axis.subVectors(this.b,this.a);const span=this.axis.length();
        this.local.position.copy(this.a).add(this.b).multiplyScalar(.5);this.local.quaternion.setFromUnitVectors(UP,this.axis.divideScalar(span));
        const radius=tailRadius(joint);this.local.scale.set(radius,span,radius);this.local.updateMatrix();
        this.geometry.tail.attributes.hogwongTailTaper.setX(count*HOGWONG_TAIL_RENDER_LINKS+link,tailRadius(next)/radius);
        this.matrix.multiplyMatrices(this.pose.matrix,this.local.matrix);this.meshes.tail.setMatrixAt(count*HOGWONG_TAIL_RENDER_LINKS+link,this.matrix);
      }
      count++;
    }
    this.group.visible=count>0;
    this.geometry.tail.attributes.hogwongTailTaper.needsUpdate=true;
    for(const [kind,mesh]of Object.entries(this.meshes)){mesh.count=count*(kind==='legs'?6:kind==='tail'?HOGWONG_TAIL_RENDER_LINKS:1);mesh.instanceMatrix.needsUpdate=true;if(count)mesh.computeBoundingSphere();}
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.group.removeFromParent();Object.values(this.meshes).forEach(m=>m.dispose());Object.values(this.geometry).forEach(g=>g.dispose());Object.values(this.materials).forEach(m=>m.dispose());this.maps.dispose();this.beakMaps.dispose();this.group.clear();}
}
