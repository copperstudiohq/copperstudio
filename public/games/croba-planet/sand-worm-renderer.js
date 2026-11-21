import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import {buildSandWormAnatomy,SAND_WORM_PLATE_HINGE_RADIUS,SAND_WORM_MOUTH_Z} from './sand-worm-anatomy.js';
import {SAND_WORM_SEGMENTS,SAND_WORM_SPACING_METERS,SAND_WORM_LENGTH_METERS,SAND_WORM_WIDTH_METERS,SAND_WORM_RENDER_CAPACITY,sampleJuvenileSandWorm} from './sand-worm.js';
import {getWildlifeRenderPopulation} from './wildlife-lifecycle.js';
import {getSulfuricGround} from './sulfuric-biome.js';
import {createCreatureSurfaceMaps,applyCreatureSurface} from './creature-materials.js';
import {createBackgroundSmokeTexture} from './background-smoke-texture.js';

const X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);

/** Clip each armored section against its local soil plane, keeping buried
 * geometry hidden even during emergence; no global clipping or terrain holes. */
function soilClip(material){
  const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material);
  material.onBeforeCompile=shader=>{
    previous(shader);
    shader.vertexShader=`attribute vec3 wormSoil;varying float wormBurial;\n${shader.vertexShader}`
      .replace('#include <project_vertex>',`vec4 wormWorld=instanceMatrix*vec4(transformed,1.);
        vec2 soilOffset=wormWorld.xz-instanceMatrix[3].xz;
        wormBurial=wormWorld.y-wormSoil.x-dot(soilOffset,wormSoil.yz);
        #include <project_vertex>`);
    shader.fragmentShader=`varying float wormBurial;\n${shader.fragmentShader}`
      .replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(wormBurial<0.)discard;');
  };
  material.customProgramCacheKey=()=>`${key()}|sand-worm-local-soil-v1`;return material;
}

/** One shared articulated model on every device: 47 armor rings, a hollow head,
 * four hinged mouth shields, low moving sand mounds and bounded dust puffs. */
export class SandWormRenderer{
  constructor(world){
    this.group=new THREE.Group();this.group.name='sulfur-sand-worm';this.disposed=false;
    this.geometry=buildSandWormAnatomy();this.maps=createCreatureSurfaceMaps('scarred-armor',256);
    this.armor=soilClip(applyCreatureSurface(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.71}),this.maps,.42));
    const segmentBox=this.geometry.segment.boundingBox,headBox=this.geometry.head.boundingBox;
    this.segmentRadius=new THREE.Vector2(Math.max(Math.abs(segmentBox.min.x),segmentBox.max.x),Math.max(Math.abs(segmentBox.min.y),segmentBox.max.y));
    this.headScale=SAND_WORM_WIDTH_METERS/(headBox.max.x-headBox.min.x);
    const population=SAND_WORM_RENDER_CAPACITY;this.meshes={};this.youngPoses=new WeakMap();
    for(const [name,geometry]of Object.entries(this.geometry)){
      const capacity=population*(name==='segment'?SAND_WORM_SEGMENTS-1:name==='plate'?4:1);
      const mesh=new THREE.InstancedMesh(geometry,this.armor,capacity);mesh.count=0;mesh.name=`sand-worm-${name}`;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute('wormSoil',new THREE.InstancedBufferAttribute(new Float32Array(capacity*3),3).setUsage(THREE.DynamicDrawUsage));
      this.meshes[name]=mesh;this.group.add(mesh);
    }
    this.moundGeometry=new THREE.SphereGeometry(3.8,16,8).scale(1,.20,1);
    this.moundMaterial=new THREE.MeshStandardMaterial({color:0xbca24c,roughness:.96});
    this.mounds=new THREE.InstancedMesh(this.moundGeometry,this.moundMaterial,population*4);this.mounds.count=0;this.group.add(this.mounds);
    this.dustTexture=createBackgroundSmokeTexture(64);this.dustGeometry=new THREE.PlaneGeometry(1,1);
    this.dustMotion={value:1};this.time={value:0};
    this.dustGeometry.setAttribute('wormDust',new THREE.InstancedBufferAttribute(new Float32Array(population*16*3),3).setUsage(THREE.DynamicDrawUsage));
    this.dustMaterial=new THREE.MeshBasicMaterial({color:0xcab96f,map:this.dustTexture,transparent:true,opacity:.46,depthWrite:false,side:THREE.DoubleSide});this.dustMaterial.forceSinglePass=true;
    this.dustMaterial.onBeforeCompile=shader=>{
      shader.uniforms.wormTime=this.time;shader.uniforms.wormDustMotion=this.dustMotion;
      shader.vertexShader=`uniform float wormTime,wormDustMotion;attribute vec3 wormDust;varying float dustFade;\n${shader.vertexShader}`
        .replace('#include <project_vertex>',`float lift=fract(wormTime*.55*wormDustMotion+wormDust.x);
          vec4 puff=instanceMatrix*vec4(0.,0.,0.,1.);
          puff.x+=sin(wormDust.x*57.)*lift*6.*wormDust.z;puff.z+=cos(wormDust.x*57.)*lift*6.*wormDust.z;puff.y+=lift*5.*wormDust.z;
          vec4 mvPosition=modelViewMatrix*puff;mvPosition.xy+=position.xy*(2.5+lift*7.)*wormDust.z;
          dustFade=sin(lift*3.14159)*wormDust.y;
          gl_Position=projectionMatrix*mvPosition;`);
      shader.fragmentShader=`varying float dustFade;\n${shader.fragmentShader}`.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=dustFade;');
    };
    this.dustMaterial.customProgramCacheKey=()=> 'sand-worm-dust-v1';
    this.dust=new THREE.InstancedMesh(this.dustGeometry,this.dustMaterial,population*16);this.dust.count=0;this.group.add(this.dust);
    this.transform=new THREE.Object3D();this.direction=new THREE.Vector3();this.headRotation=new THREE.Quaternion();
    this.petalRotation=new THREE.Quaternion();this.openRotation=new THREE.Quaternion();this.pivot=new THREE.Vector3();
  }
  /** Fill the same actual-ground plane for the head, body rings and each hinge. */
  place(mesh,index){
    this.transform.updateMatrix();mesh.setMatrixAt(index,this.transform.matrix);
    const {x,z}=this.transform.position,px=x*25,py=z*25,ground=getSulfuricGround(px,py)??0;
    const dx=((getSulfuricGround(px+25,py)??ground)-(getSulfuricGround(px-25,py)??ground))/50;
    const dy=((getSulfuricGround(px,py+25)??ground)-(getSulfuricGround(px,py-25)??ground))/50;
    mesh.geometry.attributes.wormSoil.setXYZ(index,ground/25,dx,dy);
  }
  update(world,_time,reducedMotion=false,camera,quality={}){
    if(this.disposed)return;let body=0,heads=0,plates=0,mounds=0,dust=0;
    this.time.value=Number.isFinite(world.elapsed)?world.elapsed:0;this.dustMotion.value=reducedMotion?0:1;
    for(const animal of getWildlifeRenderPopulation(world,'sand-worm')){
      const scale=Math.max(.02,Math.min(1,Number.isFinite(animal.lifecycleScale)?animal.lifecycleScale:1));
      if(animal.lifecycleRenderOnly&&animal.lifecycleHabitat&&animal.lifecycleHabitat!=='sulfuric-land')continue;
      if(animal.lifecycleInactive||animal.squidRespawnIn>0||animal.squidHeldBy||camera&&Math.hypot(animal.x/25-camera.x,animal.z/25-camera.y,animal.y/25-camera.z)>capRenderDistance(quality,quality.mobile?130:170)+SAND_WORM_LENGTH_METERS*scale)continue;
      let worm=animal;
      if(animal.lifecycleRenderOnly){
        let target=this.youngPoses.get(animal);if(!target){target={};this.youngPoses.set(animal,target);}
        worm=sampleJuvenileSandWorm(animal,this.time.value,target);
      }
      if(!worm.segments?.length)continue;
      const headScale=this.headScale*scale;
      for(let i=0;i<worm.segments.length;i++){
        const s=worm.segments[i],front=worm.segments[Math.max(0,i-1)],back=worm.segments[Math.min(worm.segments.length-1,i+1)];
        // Fully buried sections need no GPU work; partially exposed sections use
        // the exact soil shader so emergence has no whole-ring popping.
        if(Math.max(s.z+s.radius,front.z+front.radius,back.z+back.radius)<Math.min(s.ground,front.ground,back.ground)-10)continue;
        this.direction.set(front.x-back.x,front.z-back.z,front.y-back.y).normalize();
        this.transform.position.set(s.x/25,s.z/25,s.y/25);
        this.transform.rotation.set(-Math.atan2(this.direction.y,Math.hypot(this.direction.x,this.direction.z)),Math.atan2(this.direction.x,this.direction.z),0,'YXZ');
        this.transform.scale.set(s.radius/25/this.segmentRadius.x,s.radius/25/this.segmentRadius.y,SAND_WORM_SPACING_METERS*1.10*scale);
        if(i){this.place(this.meshes.segment,body++);continue;}
        this.transform.scale.setScalar(headScale);this.place(this.meshes.head,heads++);this.headRotation.copy(this.transform.quaternion);
        for(let j=0;j<4;j++){
          this.petalRotation.setFromAxisAngle(Z,j*Math.PI/2);this.openRotation.setFromAxisAngle(X,-worm.mouthOpen*1.15);
          this.pivot.set(0,SAND_WORM_PLATE_HINGE_RADIUS,SAND_WORM_MOUTH_Z).multiplyScalar(headScale).applyQuaternion(this.petalRotation).applyQuaternion(this.headRotation);
          this.transform.position.set(s.x/25,s.z/25,s.y/25).add(this.pivot);
          this.transform.quaternion.copy(this.headRotation).multiply(this.petalRotation).multiply(this.openRotation);this.transform.scale.setScalar(headScale);
          this.place(this.meshes.plate,plates++);
        }
      }
      const strength=worm.state==='rumbling'?.8:worm.state==='leaping'||worm.state==='diving'?1:.25;
      for(let j=0;j<4;j++){
        const s=worm.segments[Math.floor(j*(worm.segments.length-1)/4)],exposed=s.z>s.ground+s.radius;
        this.transform.position.set(s.x/25,s.ground/25-.02,s.y/25);this.transform.rotation.set(0,worm.time*.2+j,0);
        this.transform.scale.setScalar((exposed?.01:.8+.2*Math.sin(worm.time*3+j))*scale);this.transform.updateMatrix();this.mounds.setMatrixAt(mounds++,this.transform.matrix);
        for(let k=0;k<4;k++){
          this.transform.position.set(s.x/25,s.ground/25+.1,s.y/25);this.transform.scale.setScalar(1);this.transform.updateMatrix();this.dust.setMatrixAt(dust,this.transform.matrix);
          this.dustGeometry.attributes.wormDust.setXYZ(dust,(j*4+k)/16,strength*(exposed?.15:1),scale);dust++;
        }
      }
    }
    for(const [name,count]of Object.entries({segment:body,head:heads,plate:plates})){
      const mesh=this.meshes[name];mesh.count=count;mesh.geometry.attributes.wormSoil.needsUpdate=true;
      if(count){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
    }
    for(const [mesh,count,padding]of [[this.mounds,mounds,0],[this.dust,dust,6]]){
      mesh.count=count;if(count){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius+=padding*2;}
    }
    this.dustGeometry.attributes.wormDust.needsUpdate=true;
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;Object.values(this.meshes).forEach(m=>m.dispose());Object.values(this.geometry).forEach(g=>g.dispose());
    this.armor.dispose();this.maps.dispose();this.mounds.dispose();this.moundGeometry.dispose();this.moundMaterial.dispose();
    this.dust.dispose();this.dustGeometry.dispose();this.dustMaterial.dispose();this.dustTexture.dispose();this.group.removeFromParent();this.group.clear();
  }
}
