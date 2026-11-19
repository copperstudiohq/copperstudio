import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {saltCaveSection,saltCaveStation,SALT_CAVE_HALLS} from './salt-cave.js';
const UP=new THREE.Vector3(0,1,0),V=(x,y,z)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
export function createBarnacleGeometry(){
 const shell=new PlantMesh();
 shell.grid(5,24,(u,v)=>{const a=v*TAU,r=.145-u*.075+.008*Math.cos(a*6),h=.20*u+.009*Math.sin(a*7)*u**5;return V(Math.cos(a)*r,h,Math.sin(a)*r);},(u,v)=>new THREE.Color(0xded3ae).lerp(new THREE.Color(0x817443),(1-u)*.4+.18*Math.sin(v*TAU*6)**2).getHex());
 shell.grid(2,24,(u,v)=>{const a=v*TAU,r=.07-u*.012;return V(Math.cos(a)*r,.20-u*.012+.009*Math.sin(a*7),Math.sin(a)*r);},0xe5d7ac);
 shell.grid(3,24,(u,v)=>{const a=v*TAU,r=.058-u*.033;return V(Math.cos(a)*r,.188-u*.10,Math.sin(a)*r);},0x484b30);
 shell.grid(1,16,(u,v)=>V(Math.cos(v*TAU)*u*.025,.087,Math.sin(v*TAU)*u*.025),0x22271b);
 for(let i=0;i<6;i++){
  const a=i/6*TAU,root=V(Math.cos(a)*.025,.165,Math.sin(a)*.025),tip=V(Math.cos(a)*.095,.33,Math.sin(a)*.095);
  shell.tube([root,root.clone().lerp(tip,.55).add(V(0,.025,0)),tip],[.007,.005,.0015],0xafaa77,5,1);
  for(let j=1;j<=4;j++)for(const side of[-1,1]){
   const p=root.clone().lerp(tip,j/5),out=V(-Math.sin(a)*side*.026,.018,Math.cos(a)*side*.026);
   shell.tube([p,p.clone().add(out)],[.003,.0005],0xc6bd83,3,1);
  }
 }
 return shell.geometry({normalizeHeight:false});
}

export function createBarnacleMaterial(materials,time,sulfuric=false){
 const material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.78,side:THREE.DoubleSide,normalMap:materials?.rock?.normalMap??null,normalScale:new THREE.Vector2(.18,.18)});material.forceSinglePass=true;if(sulfuric)material.userData.waterMedium='sulfuric';
  material.onBeforeCompile=shader=>{
   shader.uniforms.barnacleTime=time;
   shader.vertexShader='uniform float barnacleTime;attribute float plantGlow;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    float bend=plantGlow*clamp((position.y-.16)/.17,0.,1.);
    float phase=barnacleTime*1.7+instanceMatrix[3].x*.6+instanceMatrix[3].z*.4;
    transformed.x+=sin(phase)*.028*bend;transformed.z+=cos(phase*.83)*.02*bend;`);
  };material.customProgramCacheKey=()=> 'cave-barnacle-filter-feelers-v1';
 return material;
}

/** Project to the same clipped field boundary used by the real cave wall. */
function wallSite(x,y,fraction){
 let q;
 for(let i=0;i<10;i++){
  q=saltCaveSection(x,y);if(!q)return null;if(Math.abs(q.clearance)<.05)break;
  const a=saltCaveSection(x+1,y),b=saltCaveSection(x-1,y),c=saltCaveSection(x,y+1),d=saltCaveSection(x,y-1);if(!a||!b||!c||!d)return null;
  const dx=(a.clearance-b.clearance)/2,dy=(c.clearance-d.clearance)/2,squared=dx*dx+dy*dy;if(squared<.01)return null;
  x-=dx*q.clearance/squared;y-=dy*q.clearance/squared;
 }
 q=saltCaveSection(x,y);if(!q||Math.abs(q.clearance)>.2)return null;
 const a=saltCaveSection(x+1,y),b=saltCaveSection(x-1,y),c=saltCaveSection(x,y+1),d=saltCaveSection(x,y-1);if(!a||!b||!c||!d)return null;
 const normal=V(a.clearance-b.clearance,0,c.clearance-d.clearance).normalize();
 return{x,y,z:q.floor+(q.roof-q.floor)*fraction,normal};
}
/** Every colony is attached to real floor or wall stone, never suspended in water. */
export class CaveBarnacleRenderer{
 constructor(materials){
  this.group=new THREE.Group();this.group.name='sulfur-cave-barnacle-colonies';this.time={value:0};this.disposed=false;this.sites=[];
  const add=(site,i)=>{if(!site)return;this.sites.push({...site,scale:.65+(i%5)*.16,angle:i*1.3});};
  for(let i=0;i<14;i++)for(const side of[-1,1]){
   const y=-11580-i*156,s=saltCaveStation(y);
   for(let j=0;j<4;j++)add(wallSite(s.x+side*s.width*.96,y+j*8,.19+(i%4)*.1+j*.025),i+j);
   const x=s.x+side*s.width*.45,q=saltCaveSection(x,y);if(q?.clearance>15)add({x,y,z:q.floor,normal:UP.clone()},i);
  }
  for(const hall of SALT_CAVE_HALLS)for(let i=1;i<hall.length;i++){
   const a=hall[i-1],b=hall[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
   for(let j=0;j<4;j++){
    const x=(a[0]+b[0])*.5-dy/length*(100+j*4),y=(a[1]+b[1])*.5+dx/length*(100+j*4);
    add(wallSite(x,y,.23+j*.027),i+j);
   }
  }
  this.geometry=createBarnacleGeometry();this.material=createBarnacleMaterial(materials,this.time,true);
  this.mesh=new THREE.InstancedMesh(this.geometry,this.material,this.sites.length);this.mesh.name='attached-cave-barnacles';const pose=new THREE.Object3D(),spin=new THREE.Quaternion();
  this.sites.forEach((site,i)=>{
   pose.position.set(site.x/25,site.z/25,site.y/25).addScaledVector(site.normal,-.025);pose.quaternion.setFromUnitVectors(UP,site.normal);spin.setFromAxisAngle(UP,site.angle);pose.quaternion.multiply(spin);pose.scale.setScalar(site.scale);pose.updateMatrix();this.mesh.setMatrixAt(i,pose.matrix);
  });this.mesh.instanceMatrix.needsUpdate=true;this.mesh.computeBoundingSphere();this.group.add(this.mesh);
 }
 update(time,reducedMotion=false){if(!this.disposed)this.time.value=reducedMotion?0:time;}
 dispose(){if(this.disposed)return;this.disposed=true;this.mesh.dispose();this.geometry.dispose();this.material.dispose();this.group.removeFromParent();this.group.clear();}
}
