import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {saltCaveSection} from './salt-cave.js';
import {SALT_CAVE_SEEPS} from './salt-cave-seeps.js';

/** Seven crusted seeps share one terrain mesh and 63 GPU-animated bubbles.
 * No extra lights, simulation particles or render targets are required. */
export class SaltCaveSeepRenderer{
 constructor(){
  this.group=new THREE.Group();this.group.name='salt-cave-geothermal-seeps';this.time={value:0};this.disposed=false;
  const crust=new PlantMesh();
  for(const [index,seep]of SALT_CAVE_SEEPS.entries()){
   crust.grid(8,32,(u,v)=>{
    const angle=v*Math.PI*2,r=u*27*(1+.13*Math.sin(angle*5+index)+.055*Math.cos(angle*11)),x=seep.x+Math.cos(angle)*r,y=seep.y+Math.sin(angle)*r;
    const floor=saltCaveSection(x,y)?.floor??seep.z,lip=Math.exp(-(((u-.76)/.17)**2))*3.8;
    return new THREE.Vector3(x/25,(floor+.8+lip)/25,y/25);
   },(u,v)=>u<.28?0x24291c:u<.5?0x67643b:u<.83?(Math.sin(v*44)>0?0xd5b53d:0x9b8d42):0x806847);
  }
  const geometry=crust.geometry({normalizeHeight:false}),bubbleGeometry=new THREE.SphereGeometry(1,8,6);
  const groundMaterial=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.86,side:THREE.DoubleSide});groundMaterial.forceSinglePass=true;
  const ground=new THREE.Mesh(geometry,groundMaterial);ground.name='scorched-sulfur-seep-crust';this.group.add(ground);
  const bubbleMaterial=new THREE.MeshStandardMaterial({color:0xc3ba77,roughness:.34,metalness:.05,transparent:true,opacity:.38,depthWrite:false});
  bubbleMaterial.onBeforeCompile=shader=>{
   shader.uniforms.saltSeepTime=this.time;
   shader.vertexShader='uniform float saltSeepTime;varying float saltBubbleFade;\n'+shader.vertexShader.replace('#include <project_vertex>',`
    vec4 bubblePosition=instanceMatrix*vec4(transformed,1.);
    float seed=instanceMatrix[3].x*.173+instanceMatrix[3].z*.291;
    float cycle=fract(saltSeepTime*.28+seed);saltBubbleFade=sin(cycle*3.14159);
    bubblePosition.y+=cycle*2.9;bubblePosition.x+=sin(seed+cycle*5.)*.16*cycle;
    vec4 mvPosition=modelViewMatrix*bubblePosition;gl_Position=projectionMatrix*mvPosition;`);
   shader.fragmentShader='varying float saltBubbleFade;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=saltBubbleFade;');
  };bubbleMaterial.customProgramCacheKey=()=> 'salt-cave-hot-bubbles-v1';
  this.bubbles=new THREE.InstancedMesh(bubbleGeometry,bubbleMaterial,SALT_CAVE_SEEPS.length*9);this.bubbles.name='salt-cave-hot-mineral-bubbles';const pose=new THREE.Object3D();
  SALT_CAVE_SEEPS.forEach((seep,i)=>{for(let j=0;j<9;j++){
   const angle=j/9*Math.PI*2+i,x=seep.x+Math.cos(angle)*(5+j%3*4),y=seep.y+Math.sin(angle)*(5+j%3*4);
   pose.position.set(x/25,(saltCaveSection(x,y).floor+5)/25,y/25);pose.scale.setScalar(.04+(j%4)*.018);pose.updateMatrix();this.bubbles.setMatrixAt(i*9+j,pose.matrix);
  }});
  this.bubbles.instanceMatrix.needsUpdate=true;this.bubbles.computeBoundingSphere();this.bubbles.boundingSphere.radius+=3;this.group.add(this.bubbles);
  this.geometries=[geometry,bubbleGeometry];this.materials=[groundMaterial,bubbleMaterial];
 }
 update(time,reducedMotion=false){if(!this.disposed)this.time.value=reducedMotion?0:time;}
 dispose(){if(this.disposed)return;this.disposed=true;this.bubbles.dispose();this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.group.removeFromParent();this.group.clear();}
}
