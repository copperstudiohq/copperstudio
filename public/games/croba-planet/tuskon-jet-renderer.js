import * as THREE from './vendor/three.module.js';
import {TUSKON_SIPHON_OUTLETS,TUSKON_SIPHON_AHEAD,getTuskonPropulsionState} from './tuskon-propulsion.js';
import {tuskonBodyWave} from './tuskon-tail-physics.js';

/** Two translucent water wakes share one small draw, without lights or particles. */
export class TuskonJetRenderer{
  constructor(world){
    this.group=new THREE.Group();this.group.name='tuskon-water-jets';this.disposed=false;
    this.geometry=new THREE.CylinderGeometry(2.2,1,1,10,6,true).translate(0,.5,0).rotateX(-Math.PI/2);
    const capacity=Math.max(1,(world.tuskjawSharks?.length??0)*2);
    this.phases=new THREE.InstancedBufferAttribute(new Float32Array(capacity),1).setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('jetPhase',this.phases);
    this.material=new THREE.MeshBasicMaterial({color:0xb4deee,transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide});
    this.material.forceSinglePass=true;
    this.material.onBeforeCompile=shader=>{
      shader.vertexShader=`attribute float jetPhase;varying vec2 tuskonJetUv;varying float tuskonJetPhase;\n${shader.vertexShader}`
        .replace('#include <begin_vertex>',`#include <begin_vertex>\ntuskonJetUv=uv;tuskonJetPhase=jetPhase;`);
      shader.fragmentShader=`varying vec2 tuskonJetUv;varying float tuskonJetPhase;\n${shader.fragmentShader}`
        .replace('#include <color_fragment>',`#include <color_fragment>
          float along=tuskonJetUv.y;
          float fade=smoothstep(0.,.04,along)*(1.-smoothstep(.12,1.,along));
          float flow=.72+.28*sin(along*31.-tuskonJetPhase*6.+sin(tuskonJetUv.x*31.4)*.8);
          diffuseColor.a*=fade*flow;`);
    };
    this.material.customProgramCacheKey=()=> 'tuskon-water-wake-v1';
    this.mesh=new THREE.InstancedMesh(this.geometry,this.material,capacity);this.mesh.name='tuskon-water-wakes';
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.mesh.count=0;this.group.add(this.mesh);
    this.local=new THREE.Object3D();this.matrix=new THREE.Matrix4();
    this.outlet=new THREE.Vector3();this.ahead=new THREE.Vector3();this.direction=new THREE.Vector3();this.axis=new THREE.Vector3(0,0,-1);
    this.state={};
  }
  update(world,roots,reducedMotion=false){
    if(this.disposed)return;let count=0;
    for(const animal of world.tuskjawSharks??[]){
      const root=roots.get(animal.id),state=getTuskonPropulsionState(animal,reducedMotion,this.state);
      if(!root?.visible||!state.active)continue;
      const motion=reducedMotion?0:1,phase=Number.isFinite(animal.phase)?animal.phase:0;
      for(let side=0;side<2&&count<this.phases.count;side++){
        this.outlet.fromArray(TUSKON_SIPHON_OUTLETS[side]);this.ahead.fromArray(TUSKON_SIPHON_AHEAD[side]);
        this.outlet.x+=tuskonBodyWave(this.outlet.z,phase)*motion;
        this.ahead.x+=tuskonBodyWave(this.ahead.z,phase)*motion;
        this.direction.copy(this.outlet).sub(this.ahead).normalize();
        this.local.position.copy(this.outlet);this.local.quaternion.setFromUnitVectors(this.axis,this.direction);
        this.local.scale.set(.20,.20,state.length);this.local.updateMatrix();
        this.matrix.multiplyMatrices(root.matrix,this.local.matrix);this.mesh.setMatrixAt(count,this.matrix);
        this.phases.setX(count,state.phase);count++;
      }
    }
    this.mesh.count=count;this.group.visible=count>0;
    if(count){this.mesh.instanceMatrix.needsUpdate=true;this.phases.needsUpdate=true;this.mesh.computeBoundingSphere();}
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;
    this.mesh.dispose();this.geometry.dispose();this.material.dispose();this.group.removeFromParent();this.group.clear();
  }
}
