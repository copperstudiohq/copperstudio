import {capRenderDistance} from './render-distance.js';
import * as THREE from './vendor/three.module.js';
import { PlantMesh } from './plant-mesh.js';
import { createCreatureSurfaceMaps, applyCreatureSurface } from './creature-materials.js';
import { applySealSwimming, deformSealSwimmingPoint, sealSwimmingParameters, SEAL_SWIMMING_BOUNDS } from './seal-swimming.js';

const v=(x,y,z)=>new THREE.Vector3(x,y,z);
function sealSection(z){
  const u=THREE.MathUtils.clamp((z+1.3)/2.4,0,1),envelope=Math.sin(u*Math.PI)**.55;
  const shoulder=Math.exp(-(((u-.64)/.29)**2));
  return {width:(.43+.13*shoulder)*envelope,height:(.31+.10*shoulder)*envelope,y:.015+.025*shoulder};
}
export const FROST_HOUND_JAW_PIVOT=Object.freeze({x:0,y:-.075,z:.94});

/** The lower jaw opens from the rear mouth corners, then snaps shut on a bite. */
export function frostHoundJawAngle(hound,reducedMotion=false) {
  if(hound.state==='noticing')return .10+.25*Math.min(1,(hound.stateTime??0)/.55);
  if(hound.state==='pursuing')return .78+(reducedMotion?0:Math.sin(hound.phase*4)*.035);
  if(hound.state==='retreating')return .06;
  return .045;
}
/** A 3.4 m alien seal: overlapping scales, four lateral eyes, swept horns,
 * broad flippers, a tapered tail and two dark rear water-jet nozzles. */
export function frostHoundAnatomy(options={}) {
  const shell=new PlantMesh(),face=new PlantMesh(),jaw=new PlantMesh(),fins=new PlantMesh(),fangs=new PlantMesh();
  const egg=(mesh,p,r,color,segments=12)=>mesh.ellipsoid(v(...p),v(...r),color,{segments,rings:8});
  const skin=new THREE.Color(),back=new THREE.Color(0x6f919c),belly=new THREE.Color(0xc4cec5),irisRanges=[];
  shell.grid(28,24,(u,t)=>{
    const z=-1.3+2.4*u,section=sealSection(z),a=t*Math.PI*2;
    return v(Math.sin(a)*section.width,section.y+Math.cos(a)*section.height,z);
  },(u,t)=>skin.copy(back).lerp(belly,(1-Math.cos(t*Math.PI*2))*.44).getHex(),0,true);
  egg(shell,[0,.18,1.04],[.37,.27,.48],0xa5c1c5,18);
  // Broad, low upper snout and a recessed dark palate replace the round muzzle.
  egg(shell,[0,.09,1.35],[.32,.115,.31],0xbfd4d7,16);
  egg(face,[0,-.028,1.30],[.29,.029,.30],0x342b42,16);
  egg(face,[0,-.055,1.08],[.22,.085,.16],0x50354a,12);
  for(const side of [-1,1]){
    shell.tube([v(side*.29,-.015,1.02),v(side*.32,-.015,1.32),v(side*.23,-.015,1.57),v(0,-.015,1.64)],
      [.023,.025,.022,.017],0x8ba9b5,8);
    // Long recurved upper fangs, with smaller rear-facing teeth behind them.
    fangs.tube([v(side*.22,0,0),v(side*.23,-.103,-.01),v(side*.20,-.223,-.09),v(side*.16,-.273,-.18)],
      [.039,.032,.017,0],0xf0e5bd,8);
    for(let i=0;i<5;i++)face.tube([v(side*(.27-i*.013),-.026,1.31-i*.065),v(side*(.24-i*.012),-.12,1.26-i*.065)],
      [.016,0],0xddd8bc,5);
  }

  for(let row=0;row<9;row++)for(let side=0;side<9;side++){
    const z=-.77+row*.19,angle=-1.34+side*.335+(row%2)*.09;
    const section=sealSection(z),center=v(Math.sin(angle)*section.width,section.y+Math.cos(angle)*section.height,z);
    const before=sealSection(z-.005),after=sealSection(z+.005);
    const normal=v(Math.sin(angle)/section.width,Math.cos(angle)/section.height,0);
    normal.z=-(normal.x*Math.sin(angle)*(after.width-before.width)/.01+normal.y*((after.y-before.y)+(after.height-before.height)*Math.cos(angle))/.01);
    const rotation=new THREE.Quaternion().setFromUnitVectors(v(0,1,0),normal.normalize());
    center.addScaledVector(normal,.014);
    const rings=options.black?[0,.125,.25,.375,.46,.48,.5,.52,.54,.625,.75,.875,1]:[0,.125,.25,.375,.5,.625,.75,.875,1];
    shell.grid(rings.length-1,12,(u,t)=>{
      const latitude=rings[Math.round(u*(rings.length-1))]*Math.PI,azimuth=t*Math.PI*2;
      return v(Math.sin(latitude)*Math.cos(azimuth)*.09,Math.cos(latitude)*.023,Math.sin(latitude)*Math.sin(azimuth)*.125).applyQuaternion(rotation).add(center);
    },(u)=>u>.38&&u<.62?0x98b3b8:row%2?0x628590:0x7c9ba2,u=>{
      if(!options.black)return 0;
      const latitude=rings[Math.round(u*(rings.length-1))];return Math.max(0,1-Math.abs(latitude-.5)/.04);
    });
  }
  for(const side of [-1,1]){
    shell.tube([v(side*.28,.34,.93),v(side*.41,.62,.77),v(side*.43,.86,.48),v(side*.37,.96,.24)], [.12,.085,.044,0],u=>u>.8?0xd6d2b5:u>.25?0xb4b5a1:0x7a9399,10);
    for(const [height,z]of [[.19,1.22],[.04,1.05]]){
      egg(face,[side*.327,height,z],[.065,.081,.097],0x142635,14);
      const first=face.positions.length/3,iris=new THREE.Color(),deep=new THREE.Color(options.black?0x693c9f:0x9e782c),light=new THREE.Color(options.black?0xc394ef:0xefc76a);
      egg(face,[side*.38,height,z+.025],[.025,.058,.074],(u,t)=>iris.copy(deep).lerp(light,.35+.65*((1+Math.sin(t*Math.PI*86+u*13))*.5)).getHex(),18);
      irisRanges.push([first,face.positions.length/3]);
      egg(face,[side*.405,height,z+.034],[.007,.040,.025],0x07151f,12);
      egg(face,[side*.412,height+.024,z+.051],[.005,.009,.009],0xf5f5df,10);
      for(const fold of [0,.018])shell.tube([v(side*.32,height+.057+fold,z-.075),v(side*.34,height+.085+fold,z),v(side*.32,height+.057+fold,z+.075)],
        [.010,.015,.010],0x8da8aa,7);
    }
    egg(face,[side*.10,.065,1.585],[.035,.027,.018],0x243e50,8);
    shell.tube([v(side*.22,-.02,-.91),v(side*.24,-.06,-1.26)], [.14,.115],0x668caa,10);
    egg(face,[side*.24,-.06,-1.275],[.095,.087,.023],0x102837,12);
    fins.leaf(v(side*.38,-.15,.25),v(side*.95,-.34,-.18),.24,0x668ea8,{segments:8,curve:.07,cup:.3});
    for(let rib=0;rib<3;rib++)fins.tube([v(side*.40,-.15,.22),v(side*(.65+rib*.08),-.25,-.01-rib*.055),v(side*(.82+rib*.04),-.30,-.13-rib*.04)],
      [.012,.008,.002],0x72959e,5);
    fins.leaf(v(side*.08,-.03,-1.26),v(side*.49,-.09,-1.72),.20,0x709aaf,{segments:8,curve:.04,cup:.2});
  }
  // Everything below is local to the mouth hinge, including gums and tongue.
  egg(jaw,[0,-.055,.30],[.31,.075,.39],0xb9cbd0,16);
  egg(jaw,[0,.012,.30],[.275,.022,.35],0x6f445b,16);
  egg(jaw,[0,.034,.32],[.10,.014,.24],0x9c6078,12);
  for(const side of [-1,1]){
    jaw.tube([v(side*.22,-.01,.03),v(side*.29,.005,.30),v(side*.22,.005,.58),v(0,.005,.67)],
      [.021,.023,.02,.017],0x86a0ad,8);
    for(let i=0;i<6;i++)jaw.tube([v(side*(.245-i*.013),.02,.50-i*.072),v(side*(.22-i*.013),.105,.46-i*.072)],
      [.017,0],0xeee7ce,5);
    jaw.tube([v(0,.05,.47),v(side*.045,.052,.61)], [.018,.003],0xa16c85,6);
  }
  const geometry={shell:shell.geometry({normalizeHeight:false}),face:face.geometry({normalizeHeight:false}),fangs:fangs.geometry({normalizeHeight:false}),jaw:jaw.geometry({normalizeHeight:false}),fins:fins.geometry({normalizeHeight:false})};
  const irisMask=new Float32Array(geometry.face.attributes.position.count);
  for(const [a,b]of irisRanges)irisMask.fill(1,a,b);
  geometry.face.setAttribute('irisMask',new THREE.Float32BufferAttribute(irisMask,1));
  return geometry;
}

/** Fin batches share the mantle deformation and species surface hooks. */
function sealFinMaterial(base){
  const material=base.clone(),previous=base.onBeforeCompile.bind(base),key=base.customProgramCacheKey.bind(base);
  material.onBeforeCompile=previous;
  material.customProgramCacheKey=()=>key()+'|seal-fin-strokes-v2';return material;
}

/** Six shared batches for the whole population; no per-animal lights. */
export class FrostHoundRenderer {
  constructor(world,quality={},options={}) {
    this.group=new THREE.Group();this.group.name=options.populationKey??'frost-hounds';this.disposed=false;
    this.populationKey=options.populationKey??'frostHounds';
    this.maps=createCreatureSurfaceMaps(options.black?'void-armor':'frost-hide',quality.mobile?64:128);
    this.faceMaps=createCreatureSurfaceMaps('horn',quality.mobile?64:128);
    this.geometry=frostHoundAnatomy(options);this.geometry.jet=new THREE.ConeGeometry(.10,1,8).rotateX(Math.PI/2);
    if(options.black)for(const kind of ['shell','jaw','fins']){
      const colors=this.geometry[kind].attributes.color,rim=this.geometry[kind].attributes.plantGlow;
      this.geometry[kind].setAttribute('scaleRim',rim.clone());
      const purple=new THREE.Color(0x8f45ca),tint=new THREE.Color();
      for(let i=0;i<colors.count;i++){
        const shade=.006+(colors.getX(i)+colors.getY(i)+colors.getZ(i))/3*.016;
        tint.setRGB(shade*.78,shade*.9,shade).lerp(purple,rim.getX(i));
        colors.setXYZ(i,tint.r,tint.g,tint.b);
      }
    }
    this.materials={shell:applyCreatureSurface(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.66}),this.maps,options.black ? .40 : .28),
      face:applyCreatureSurface(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.60}),this.faceMaps,.10),
      jet:new THREE.MeshBasicMaterial({color:0xa7d9eb,transparent:true,opacity:.18,depthWrite:false})};
    if(options.black){
      const material=this.materials.shell;
      material.onBeforeCompile=shader=>{
        shader.vertexShader='attribute float scaleRim; varying float vScaleRim;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvScaleRim=scaleRim;');
        shader.fragmentShader='varying float vScaleRim;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.035,.004,.07)*vScaleRim;');
      };
      material.customProgramCacheKey=()=> 'croba-void-scale-rims-v1';
    }
    applySealSwimming(this.materials.shell);applySealSwimming(this.materials.face);
    this.materials.fins=sealFinMaterial(this.materials.shell);
    this.meshes={};this.transform=new THREE.Object3D();this.local=new THREE.Object3D();this.matrix=new THREE.Matrix4();
    this.swim={};this.nozzle=v(0,0,0);this.nozzleAhead=v(0,0,0);this.nozzleBehind=v(0,0,0);
    this.jetDirection=v(0,0,1);this.jetAxis=v(0,0,1);
    this.ids=(world[this.populationKey]??[]).map(h=>{
      if(typeof h.id!=='string'||![h.x,h.y,h.z,h.heading,h.phase].every(Number.isFinite))throw new TypeError('Frost Hounds need an id and finite pose.');return h.id;
    });
    for(const kind of ['shell','face','jaw','fins','fangs','jet']){
      const mesh=new THREE.InstancedMesh(this.geometry[kind],this.materials[kind==='jet'?'jet':kind==='fins'?'fins':kind==='face'||kind==='fangs'?'face':'shell'],this.ids.length*(kind==='jet'?2:1));
      if(kind!=='jet'){
        for(const key of ['sealPhase','sealPower','sealMotion'])mesh.geometry.setAttribute(key,
          new THREE.InstancedBufferAttribute(new Float32Array(this.ids.length),1).setUsage(THREE.DynamicDrawUsage));
        const p=mesh.geometry.attributes.position,z=new Float32Array(p.count),fin=new Float32Array(p.count);
        const offset=kind==='jaw'?FROST_HOUND_JAW_PIVOT.z:kind==='fangs'?1.45:0;
        for(let i=0;i<p.count;i++){z[i]=p.getZ(i)+offset;fin[i]=kind==='fins'?1:0;}
        mesh.geometry.setAttribute('sealBodyZ',new THREE.Float32BufferAttribute(z,1));
        mesh.geometry.setAttribute('sealFin',new THREE.Float32BufferAttribute(fin,1));
      }
      mesh.name=`frost-hound-${kind}`;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.meshes[kind]=mesh;this.group.add(mesh);
    }
  }
  update(world,_time,reducedMotion=false,camera,quality={}) {
    if(this.disposed)return;let count=0;
    for(const h of world[this.populationKey]??[]){
      if(h.squidRespawnIn>0||!this.ids.includes(h.id))continue;
      if(camera&&Math.hypot(h.x/25-camera.x,h.z/25-camera.y,h.y/25-camera.z)>capRenderDistance(quality,quality.mobile?42:65))continue;
      const swim=sealSwimmingParameters(h,reducedMotion,this.swim);
      this.transform.position.set(h.x/25,h.z/25,h.y/25);this.transform.rotation.set(h.swimPitch??0,Math.PI/2-h.heading,h.swimBank??0,'YXZ');this.transform.updateMatrix();
      for(const kind of ['shell','face','jaw','fins','fangs']){
        this.local.position.set(0,kind==='jaw'?FROST_HOUND_JAW_PIVOT.y:kind==='fangs'?-.027:0,kind==='jaw'?FROST_HOUND_JAW_PIVOT.z:kind==='fangs'?1.45:0);this.local.scale.set(1,1,1);
        this.local.rotation.set(kind==='jaw'?frostHoundJawAngle(h,reducedMotion):kind==='fangs'?1.1*Math.max(0,1-frostHoundJawAngle(h,reducedMotion)/.55):0,0,
          0);
        this.local.updateMatrix();this.matrix.multiplyMatrices(this.transform.matrix,this.local.matrix);this.meshes[kind].setMatrixAt(count,this.matrix);
        const attributes=this.geometry[kind].attributes;
        attributes.sealPhase.setX(count,reducedMotion?0:swim.phase);
        attributes.sealPower.setX(count,reducedMotion?0:swim.power);
        attributes.sealMotion.setX(count,swim.motion);
      }
      for(let side=0;side<2;side++){
        const length=.18+(h.squidHeldBy?0:(h.jet??0))*(.35+1.1*swim.jetPulse),x=(side?1:-1)*.24;
        this.nozzle.set(x,-.06,-1.28);deformSealSwimmingPoint(this.nozzle,swim,false,this.nozzle);
        this.nozzleAhead.set(x,-.06,-1.27);deformSealSwimmingPoint(this.nozzleAhead,swim,false,this.nozzleAhead);
        this.nozzleBehind.set(x,-.06,-1.29);deformSealSwimmingPoint(this.nozzleBehind,swim,false,this.nozzleBehind);
        this.jetDirection.copy(this.nozzleAhead).sub(this.nozzleBehind).normalize();
        this.local.position.copy(this.nozzle).addScaledVector(this.jetDirection,-length/2);
        this.local.quaternion.setFromUnitVectors(this.jetAxis,this.jetDirection);
        // Geometry's long axis is Z after rotation.
        this.local.scale.set(1,1,length);this.local.updateMatrix();this.matrix.multiplyMatrices(this.transform.matrix,this.local.matrix);this.meshes.jet.setMatrixAt(count*2+side,this.matrix);
      }
      count++;
    }
    for(const kind of ['shell','face','jaw','fins','fangs'])for(const key of ['sealPhase','sealPower','sealMotion'])this.geometry[kind].attributes[key].needsUpdate=true;
    this.group.visible=count>0;
    for(const [kind,mesh]of Object.entries(this.meshes)){mesh.count=count*(kind==='jet'?2:1);mesh.instanceMatrix.needsUpdate=true;if(count){mesh.computeBoundingSphere();if(kind!=='jet')mesh.boundingSphere.radius+=kind==='fins'?SEAL_SWIMMING_BOUNDS.fins:SEAL_SWIMMING_BOUNDS.body;}}
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.group.removeFromParent();Object.values(this.meshes).forEach(m=>m.dispose());Object.values(this.geometry).forEach(g=>g.dispose());Object.values(this.materials).forEach(m=>m.dispose());this.maps.dispose();this.faceMaps.dispose();this.group.clear();}
}
