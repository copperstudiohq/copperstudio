import * as THREE from './vendor/three.module.js';
import {WATER_OPTICS} from './water-optics.js';
import {createBasinCavernGeometry} from './basin-cave-mesh.js';
import {BASIN_CAVES,basinCaveField,basinCaveVolumeClearance} from './basin-caves.js';
import {createBasinBoneNestGeometry} from './basin-bone-nests.js';
import {BASIN_BONE_NEST_SITES} from './basin-bone-sites.js';
const at=(c,s,lateral,z)=>new THREE.Vector3((c.x+c.nx*s*c.length-c.ny*lateral)/25,z/25,(c.y+c.ny*s*c.length+c.nx*lateral)/25);

/** Cut real openings into the existing glacier shell, refining only the small
 * five mouth regions. Untouched islands retain their exact existing geometry. */
export function carveBasinIceGeometry(source,floe){
 const caves=BASIN_CAVES.filter(c=>c.platformId===floe.id);if(!caves.length)return source;
 const p=source.attributes.position,color=source.attributes.color,positions=[],colors=[];
 const bounds=caves.map(c=>{const to=at(c,Math.min(430/c.length,1),0,0);return{minX:Math.min(c.x,to.x*25)-260,maxX:Math.max(c.x,to.x*25)+260,minY:Math.min(c.y,to.z*25)-260,maxY:Math.max(c.y,to.z*25)+260,minZ:-240,maxZ:-10};});
 let removed=0;
 const append=(a,b,c,depth=0)=>{
  const lo=[0,1,2].map(i=>Math.min(a[i],b[i],c[i])),hi=[0,1,2].map(i=>Math.max(a[i],b[i],c[i]));
  let near=bounds.some(q=>hi[1]*25>=q.minZ&&lo[1]*25<=q.maxZ&&hi[0]*25+floe.x>=q.minX&&lo[0]*25+floe.x<=q.maxX&&hi[2]*25+floe.y>=q.minY&&lo[2]*25+floe.y<=q.maxY);
  const center={x:(a[0]+b[0]+c[0])/3*25+floe.x,y:(a[2]+b[2]+c[2])/3*25+floe.y,z:(a[1]+b[1]+c[1])/3*25};
  const span=Math.hypot(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])*25;
  if(near){const field=basinCaveField(center.x,center.y,floe.id);near=field.clearance>=-span&&center.z>=field.floor-span&&center.z<=field.ceiling+span;}
  if(near&&depth<10&&Math.hypot(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])>1.25){
   const mid=(a,b)=>a.map((v,i)=>(v+b[i])/2),ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);
   append(a,ab,ca,depth+1);append(ab,b,bc,depth+1);append(ca,bc,c,depth+1);append(ab,bc,ca,depth+1);return;
  }
  const toPoint=q=>({x:q[0]*25+floe.x,y:q[2]*25+floe.y,z:q[1]*25});
  // Clip the boundary instead of deleting whole triangles by their centre.
  // A tiny retained lip overlaps the interior and seals floating-point seams.
  const outside=q=>{const p=toPoint(q);return 1.0-basinCaveVolumeClearance(p.x,p.y,p.z,floe.id);};
  let polygon=[a,b,c];
  if(near){
   const clipped=[];
   for(let i=0;i<polygon.length;i++){
    const from=polygon[i],to=polygon[(i+1)%polygon.length],fa=outside(from),fb=outside(to);
    if(fa>=0)clipped.push(from);
    if((fa>=0)!==(fb>=0)){const t=fa/(fa-fb);clipped.push(from.map((v,k)=>v+(to[k]-v)*t));}
   }
   polygon=clipped;removed++;
  }
  for(let i=1;i<polygon.length-1;i++)for(const q of[polygon[0],polygon[i],polygon[i+1]]){positions.push(q[0],q[1],q[2]);colors.push(q[3],q[4],q[5]);}
 };
 for(let i=0;i<p.count;i+=3)append(...[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j),color.getX(i+j),color.getY(i+j),color.getZ(i+j)]));
 const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));result.computeVertexNormals();result.computeBoundingSphere();result.userData.caveOpeningTriangles=removed;source.dispose();return result;
}


/** The two islands each own one connected interior. All four mainland halls
 * join without duplicate floors or wall caps. The existing suit lamp is reused. */
export class BasinCaveRenderer{
 constructor(world,materials){
  this.group=new THREE.Group();this.group.name='icy-basin-air-pocket-caves';this.rooms=[];this.disposed=false;
  this.bones=createBasinBoneNestGeometry();this.boneMaterial=new THREE.MeshStandardMaterial({color:0x9a9078,vertexColors:true,roughness:.92});this.boneMaterial.userData.waterLevel=-135/25;
  for(const platformId of new Set(BASIN_CAVES.map(c=>c.platformId))){
   const caves=BASIN_CAVES.filter(c=>c.platformId===platformId),ice=world.platforms.find(p=>p.id===platformId);
   if(!ice)throw new Error(`Missing ice for cave network ${platformId}`);
   const room=new THREE.Group();room.name=`${platformId}-connected-caverns`;
   const {geometry,pool}=createBasinCavernGeometry(ice,caves);
   const material=materials.ice.clone();material.side=THREE.DoubleSide;material.forceSinglePass=true;material.vertexColors=true;material.userData={...material.userData,waterLevel:caves[0].waterLevel/25};
   const shell=new THREE.Mesh(geometry,material);shell.name='continuous-cave-floor-walls-and-glacier-roof';room.add(shell);
   const waterMaterial=new THREE.MeshStandardMaterial({color:0x163e52,roughness:.26,metalness:.12,transparent:true,opacity:WATER_OPTICS.caveSurfaceOpacity,side:THREE.DoubleSide,depthWrite:false});waterMaterial.userData.waterLevel=caves[0].waterLevel/25;
   const water=new THREE.Mesh(pool,waterMaterial);water.name='trapped-air-waterline';room.add(water);
   const nests=new THREE.InstancedMesh(this.bones,this.boneMaterial,caves.length*2),pose=new THREE.Object3D(),nestPoses=[];nests.name='ancient-croba-bone-nests';
   BASIN_BONE_NEST_SITES.filter(p=>p.platformId===platformId).forEach((p,index)=>{
    pose.position.set(p.x/25,p.z/25,p.y/25);pose.rotation.y=p.rotation;pose.updateMatrix();nests.setMatrixAt(index,pose.matrix);nestPoses.push({matrix:pose.matrix.clone(),position:pose.position.clone()});
   });
   nests.computeBoundingSphere();room.add(nests);this.group.add(room);this.rooms.push({room,caves,cave:caves[0],shell,water,nests,nestPoses,nestVisibility:null,material,waterMaterial});
  }
 }
 update(camera){for(const entry of this.rooms){
  entry.room.visible=camera.y<2&&entry.caves.some(c=>{
   const along=Math.max(0,Math.min(c.length,(camera.x*25-c.x)*c.nx+(camera.z*25-c.y)*c.ny));
   return Math.hypot(camera.x-(c.x+c.nx*along)/25,camera.z-(c.y+c.ny*along)/25)<55;
  });
  if(!entry.room.visible)continue;
  const visible=entry.nestPoses.filter(pose=>pose.position.distanceToSquared(camera)<28*28);
  const key=visible.map(pose=>entry.nestPoses.indexOf(pose)).join(',');
  if(key===entry.nestVisibility)continue;
  entry.nestVisibility=key;entry.nests.count=visible.length;
  visible.forEach((pose,index)=>entry.nests.setMatrixAt(index,pose.matrix));
  entry.nests.instanceMatrix.needsUpdate=true;entry.nests.visible=visible.length>0;
  if(visible.length)entry.nests.computeBoundingSphere();
 }}

 dispose(){if(this.disposed)return;this.disposed=true;for(const r of this.rooms){r.shell.geometry.dispose();r.water.geometry.dispose();r.material.dispose();r.waterMaterial.dispose();r.nests.dispose();}this.bones.dispose();this.boneMaterial.dispose();this.group.removeFromParent();this.group.clear();}
}
