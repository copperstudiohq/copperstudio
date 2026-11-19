import * as THREE from './vendor/three.module.js';
import {TUSKON_TAIL_ROOT_Z as ROOT,TUSKON_TAIL_LENGTH as LENGTH,TUSKON_TAIL_SEGMENTS as SEGMENTS,tuskonTailCenterY,tuskonBodyWave} from './tuskon-tail-physics.js';

export function createTuskonTailPose(){
  return {centers:{value:Array.from({length:SEGMENTS+1},()=>new THREE.Vector4())},
    sides:{value:Array.from({length:SEGMENTS+1},()=>new THREE.Vector3(1,0,0))},
    ups:{value:Array.from({length:SEGMENTS+1},()=>new THREE.Vector3(0,1,0))},
    scratch:{inverse:new THREE.Matrix4(),point:new THREE.Vector3(),tangent:new THREE.Vector3(),previous:new THREE.Vector3(),rotation:new THREE.Quaternion()}};
}

/** Convert the authoritative chain to the model frame, then transport its
 * cross-sections without roll flips. No vertex buffers change during play. */
export function updateTuskonTailPose(animal,root,pose,motion=true){
  const nodes=animal.tailNodes,physical=!animal.squidHeldBy&&Array.isArray(nodes)&&nodes.length===SEGMENTS+1
    &&nodes.every(p=>p&&[p.x,p.y,p.z].every(Number.isFinite)&&Math.hypot(p.x-animal.x,p.y-animal.y,p.z-animal.z)<400);
  const {inverse,point,tangent,previous,rotation}=pose.scratch;
  root.updateMatrix();inverse.copy(root.matrix).invert();
  for(let i=0;i<=SEGMENTS;i++){
    const z=ROOT-LENGTH*i/SEGMENTS,y=tuskonTailCenterY(z),center=pose.centers.value[i];
    if(physical){point.set(nodes[i].x/25,nodes[i].z/25,nodes[i].y/25).applyMatrix4(inverse);center.set(point.x,point.y,point.z,y);}
    else center.set(motion?tuskonBodyWave(z,animal.phase??0):0,y,z,y);
    pose.sides.value[i].set(1,0,0);pose.ups.value[i].set(0,1,0);
  }
  if(!physical)return;
  previous.set(0,0,-1);
  for(let i=1;i<=SEGMENTS;i++){
    const a=pose.centers.value[i-1],b=pose.centers.value[Math.min(SEGMENTS,i+1)];
    tangent.set(b.x-a.x,b.y-a.y,b.z-a.z);
    if(tangent.lengthSq()<1e-10)tangent.copy(previous);else tangent.normalize();
    rotation.setFromUnitVectors(previous,tangent);
    const side=pose.sides.value[i].copy(pose.sides.value[i-1]).applyQuaternion(rotation);
    side.addScaledVector(tangent,-side.dot(tangent)).normalize();
    pose.ups.value[i].crossVectors(side,tangent).normalize();previous.copy(tangent);
  }
}

/** CPU twin used to verify shared torso/armor/tail seams and bind-pose replay. */
export function deformTuskonTailPoint(point,pose,phase=0,motion=1,target={}){
  const baseX=point.x+tuskonBodyWave(point.z,phase)*motion;
  target.x=baseX;target.y=point.y;target.z=point.z;
  if(point.z>=ROOT)return target;
  const t=THREE.MathUtils.clamp((ROOT-point.z)/LENGTH,0,1)*SEGMENTS,index=Math.min(SEGMENTS-1,Math.floor(t)),f=t-index;
  const a=pose.centers.value[index],b=pose.centers.value[index+1],side=new THREE.Vector3().lerpVectors(pose.sides.value[index],pose.sides.value[index+1],f).normalize();
  const up=new THREE.Vector3().lerpVectors(pose.ups.value[index],pose.ups.value[index+1],f),forward=new THREE.Vector3().crossVectors(side,up).normalize();
  up.crossVectors(forward,side).normalize();
  const restY=a.w+(b.w-a.w)*f,y=point.y-restY;
  const weight=THREE.MathUtils.smoothstep(ROOT-point.z,0,.6);
  target.x=THREE.MathUtils.lerp(baseX,a.x+(b.x-a.x)*f+side.x*point.x+up.x*y,weight);
  target.y=THREE.MathUtils.lerp(point.y,a.y+(b.y-a.y)*f+side.y*point.x+up.y*y,weight);
  target.z=THREE.MathUtils.lerp(point.z,a.z+(b.z-a.z)*f+side.z*point.x+up.z*y,weight);return target;
}

/** Coordinate fin strokes with the body wave while skinning overlapping armor and
 * tail vertices to the same physical chain. Seven model draws remain seven. */
export function applyTuskonSwimming(material,phase,motion,pose,fin=false){
  const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material);
  material.onBeforeCompile=shader=>{
    previous(shader);Object.assign(shader.uniforms,{sharkPhase:phase,sharkMotion:motion,
      sharkTailCenters:pose.centers,sharkTailSides:pose.sides,sharkTailUps:pose.ups});
    shader.vertexShader=`uniform float sharkPhase,sharkMotion;
      uniform vec4 sharkTailCenters[9];uniform vec3 sharkTailSides[9],sharkTailUps[9];
      void sharkWave(vec3 p,out vec3 delta,out vec3 derivative){
        float t=clamp((2.-p.z)/14.,0.,1.),dt=p.z> -12.&&p.z<2.?-1./14.:0.,wave=sharkPhase-t*3.;
        delta=vec3(.9*t*t*sin(wave),0.,0.)*sharkMotion;
        derivative=vec3(.9*dt*(2.*t*sin(wave)-3.*t*t*cos(wave)),0.,0.)*sharkMotion;
        ${fin?`// Pinned shoulders, broad mirrored strokes and a delayed tip ripple.
          // Both fin skins and their cartilage ridges use this same deformation.
          float reach=max(0.,abs(p.x)-1.15),flex=reach*reach/(1.+reach);
          float beat=sharkPhase-.38*reach-.18*p.z,gain=.34*sharkMotion;
          float rise=sin(beat),slope=cos(beat);
          delta.y+=gain*flex*rise;
          derivative.y=sign(p.x)*gain*(reach*(reach+2.)/((1.+reach)*(1.+reach))*rise-.38*flex*slope);
          derivative.z=-.18*gain*flex*slope;`:''}
      }
      void sharkTail(vec3 p,out vec3 posed,out mat3 frame,out float weight){
        float t=clamp((-4.7-p.z)/7.3,0.,1.)*8.;int i=min(7,int(floor(t)));float f=t-float(i);
        vec4 center=mix(sharkTailCenters[i],sharkTailCenters[i+1],f);
        vec3 side=normalize(mix(sharkTailSides[i],sharkTailSides[i+1],f));
        vec3 up=normalize(mix(sharkTailUps[i],sharkTailUps[i+1],f)),forward=normalize(cross(side,up));
        up=normalize(cross(forward,side));frame=mat3(side,up,forward);
        posed=center.xyz+side*p.x+up*(p.y-center.w);weight=smoothstep(0.,.6,-4.7-p.z);
      }\n${shader.vertexShader}`
      .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
        vec3 sharkDelta,sharkDerivative;sharkWave(position,sharkDelta,sharkDerivative);
        vec3 originalSharkNormal=objectNormal;
        objectNormal.x-=sharkDerivative.y*objectNormal.y;
        objectNormal.z-=sharkDerivative.x*objectNormal.x+sharkDerivative.z*objectNormal.y;objectNormal=normalize(objectNormal);
        vec3 sharkTailPosition;mat3 sharkTailFrame;float sharkTailWeight=0.;
        if(position.z< -4.7){sharkTail(position,sharkTailPosition,sharkTailFrame,sharkTailWeight);
          objectNormal=normalize(mix(objectNormal,sharkTailFrame*originalSharkNormal,sharkTailWeight));}`)
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        transformed+=sharkDelta;
        if(position.z< -4.7)transformed=mix(transformed,sharkTailPosition,sharkTailWeight);`);
  };
  material.customProgramCacheKey=()=>`${key()}|tuskon-physical-tail-v3:${fin?1:0}`;return material;
}
