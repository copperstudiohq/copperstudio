import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import {buildSulfurLizardAnatomy,SULFUR_LIZARD_FEET} from './sulfur-lizard-anatomy.js';
import {createCreatureSurfaceMaps,applyCreatureSurface} from './creature-materials.js';
import {getSulfuricGround} from './sulfuric-biome.js';
import {getSulfurLizardScale} from './sulfur-lizards.js';

function animate(material){
  const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material);
  material.onBeforeCompile=shader=>{
    previous(shader);
    shader.vertexShader=`attribute float lizardPart;attribute vec2 lizardMotion;attribute vec4 lizardFeet;attribute vec2 lizardRearFeet;
      void lizardPose(vec3 p,out vec3 q,out float tailSlope){
        q=p;tailSlope=0.;float phase=lizardMotion.x,moving=lizardMotion.y;
        if(lizardPart>.5&&lizardPart<6.5){
          int leg=int(lizardPart-.5);float diagonal=leg==0||leg==3||leg==4?0.:3.14159265;
          float stroke=sin(phase+diagonal),flex=smoothstep(.23,.66,abs(p.x));
          float footHeight=leg<4?lizardFeet[leg]:lizardRearFeet[leg-4];
          q.z+=stroke*.22*moving*flex;
          q.y+=(footHeight+max(0.,stroke)*.09*moving)*flex;
        }else if(lizardPart>7.5&&lizardPart<8.5){
          float t=clamp((-p.z-.65)/1.13,0.,1.),wave=phase*.45+t*3.,power=.14*(.3+.7*moving);
          q.x+=sin(wave)*t*t*power;
          tailSlope=-power/1.13*(2.*t*sin(wave)+3.*t*t*cos(wave));
        }else if(lizardPart>6.5&&lizardPart<7.5){
          float breath=1.+sin(phase*.35)*.035*smoothstep(.945,1.005,p.z);q.x*=breath;q.y=.43+(p.y-.43)*breath;
        }else if(lizardPart<.5){
          float belly=1.-smoothstep(.35,.8,abs(p.z));q.x*=1.+sin(phase*.35)*.012*belly;
          q.y+=sin(phase*.35)*.008*belly;
        }
      }\n${shader.vertexShader}`
      .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
        vec3 lizardPosition;float lizardSlope;lizardPose(position,lizardPosition,lizardSlope);
        objectNormal.z-=lizardSlope*objectNormal.x;objectNormal=normalize(objectNormal);`)
      .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=lizardPosition;');
  };
  material.customProgramCacheKey=()=>`${key()}|sulfur-lizard-gait-v2`;return material;
}

/** Shared detailed model, planted feet, muscular tail and breathing ring-mouth. */
export class SulfurLizardRenderer{
  constructor(world){
    this.group=new THREE.Group();this.group.name='sulfur-maw-lizards';this.disposed=false;
    this.geometry=buildSulfurLizardAnatomy();this.maps=createCreatureSurfaceMaps('frost-hide',128);
    const population=world.sulfurLizards??[],capacity=Math.max(1,population.length);
    for(const animal of population)if(typeof animal.id!=='string'||![animal.x,animal.y,animal.z].every(Number.isFinite))throw new TypeError('Sulfur Maw Lizards need an id and finite prepared pose.');
    this.motion=new THREE.InstancedBufferAttribute(new Float32Array(capacity*2),2).setUsage(THREE.DynamicDrawUsage);
    this.feet=new THREE.InstancedBufferAttribute(new Float32Array(capacity*4),4).setUsage(THREE.DynamicDrawUsage);
    this.rearFeet=new THREE.InstancedBufferAttribute(new Float32Array(capacity*2),2).setUsage(THREE.DynamicDrawUsage);
    this.materials={skin:animate(applyCreatureSurface(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.72}),this.maps,.18)),
      face:animate(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.38}))};
    this.meshes={};
    for(const [kind,geometry]of Object.entries(this.geometry)){
      geometry.setAttribute('lizardMotion',this.motion);geometry.setAttribute('lizardFeet',this.feet);geometry.setAttribute('lizardRearFeet',this.rearFeet);
      const mesh=new THREE.InstancedMesh(geometry,this.materials[kind],capacity);mesh.name=`sulfur-lizard-${kind}`;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;this.meshes[kind]=mesh;this.group.add(mesh);
    }
    this.transform=new THREE.Object3D();this.inverse=new THREE.Matrix4();this.point=new THREE.Vector3();
  }
  update(world,_time,reducedMotion=false,camera,quality={}){
    if(this.disposed)return;let count=0;
    for(const animal of world.sulfurLizards??[]){
      if(animal.squidRespawnIn>0||camera&&Math.hypot(animal.x/25-camera.x,animal.z/25-camera.y,animal.y/25-camera.z)>capRenderDistance(quality,quality.mobile?60:75))continue;
      if(count>=this.motion.count)break;
      this.transform.position.set(animal.x/25,animal.z/25,animal.y/25);
      const scale=getSulfurLizardScale(animal);
      this.transform.rotation.set(-(animal.pitch??0),Math.PI/2-animal.heading,animal.bank??0,'YXZ');this.transform.scale.setScalar(scale);this.transform.updateMatrix();
      const phase=reducedMotion||animal.squidHeldBy?0:animal.phase??0,blend=reducedMotion||animal.squidHeldBy?0:animal.moveBlend??0;
      this.motion.setXY(count,phase,blend);this.inverse.copy(this.transform.matrix).invert();
      for(let leg=0;leg<SULFUR_LIZARD_FEET.length;leg++){
        const foot=SULFUR_LIZARD_FEET[leg],flex=THREE.MathUtils.smoothstep(Math.abs(foot[0]),.23,.66),stroke=Math.sin(phase+(leg===0||leg===3||leg===4?0:Math.PI));
        this.point.fromArray(foot);this.point.z+=stroke*.22*blend*flex;this.point.applyMatrix4(this.transform.matrix);
        this.point.y=(getSulfuricGround(this.point.x*25,this.point.z*25)??animal.z)/25+.035*scale;
        this.point.applyMatrix4(this.inverse);
        const target=leg<4?this.feet:this.rearFeet,offset=leg<4?leg:leg-4;
        target.array[count*target.itemSize+offset]=animal.squidHeldBy?0:THREE.MathUtils.clamp((this.point.y-foot[1])/Math.max(.1,flex),-.35,.35);
      }
      for(const mesh of Object.values(this.meshes))mesh.setMatrixAt(count,this.transform.matrix);count++;
    }
    for(const mesh of Object.values(this.meshes)){mesh.count=count;mesh.visible=count>0;if(count){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.4;}}
    this.motion.needsUpdate=true;this.feet.needsUpdate=true;this.rearFeet.needsUpdate=true;
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;Object.values(this.meshes).forEach(m=>m.dispose());
    Object.values(this.geometry).forEach(g=>g.dispose());Object.values(this.materials).forEach(m=>m.dispose());this.maps.dispose();this.group.removeFromParent();this.group.clear();
  }
}
