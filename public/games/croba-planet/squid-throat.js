import * as THREE from './vendor/three.module.js';
import {createCreatureSurfaceMaps,applyCreatureSurface} from './creature-materials.js';

const ROWS=8,TEETH_PER_ROW=14,SIDES=48,STATIONS=64;
const radiusAt=row=>1.02-row*.085;
const centerAt=depth=>({x:.065*Math.sin(depth*.75)*Math.min(1,depth),y:.045*Math.sin(depth*1.1)*Math.min(1,depth)});
function foldedRadius(depth,angle){
 const base=1.02-depth/6.8*.68,fade=Math.min(1,depth*2);
 return base*(1+fade*(.035*Math.sin(angle*5+depth*.7)+.023*Math.sin(depth*8+Math.sin(angle*3)*.5)));
}
function curvedTooth(){
 const positions=[],colors=[],indices=[],tint=new THREE.Color(),root=new THREE.Color(0x9d8766),tip=new THREE.Color(0xe7dec7);
 for(let row=0;row<=8;row++)for(let side=0;side<=8;side++){
  const t=row/8,angle=side/8*Math.PI*2,radius=.058*(1-t)**.85+.0004;
  const groove=1+.035*Math.sin(angle*5+t*15);
  positions.push(.035*t*t+Math.cos(angle)*radius*groove,.29*t,-.095*t*t+Math.sin(angle)*radius*groove);
  tint.copy(root).lerp(tip,Math.sqrt(t));colors.push(tint.r,tint.g,tint.b);
 }
 for(let row=0;row<8;row++)for(let side=0;side<8;side++){
  const a=row*9+side,b=a+9;indices.push(a,b,a+1,a+1,b,b+1);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

/** Permanent head-local interior. The opening starts at Z=0 and the tube
 * extends backward; normal depth testing allows the beak to occlude it. */
export class SquidThroat extends THREE.Group {
 constructor({surfaces}={}){
  super();this.name='crobonic-toothed-throat';
  this.surfaceMaps=surfaces??createCreatureSurfaceMaps('throat',128);this.ownsSurfaceMaps=!surfaces;
  const lining=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.48,clearcoat:.65,clearcoatRoughness:.19,side:THREE.DoubleSide,vertexColors:true,emissive:0x0b0609});
  applyCreatureSurface(lining,this.surfaceMaps,.48);
  const enamel=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.34,clearcoat:.38,clearcoatRoughness:.24,vertexColors:true});
  const positions=[],indices=[],uvs=[],colors=[],tint=new THREE.Color(),deep=new THREE.Color(0x4f3548),ridge=new THREE.Color(0xa77b83);
  for(let station=0;station<=STATIONS;station++)for(let side=0;side<=SIDES;side++){
   const angle=side/SIDES*Math.PI*2,depth=station/STATIONS*6.8,radius=foldedRadius(depth,angle),center=centerAt(depth);
   positions.push(center.x+Math.cos(angle)*radius,center.y+Math.sin(angle)*radius,-depth);
   uvs.push(side/SIDES,station/STATIONS*2);
   const crease=.5+.5*Math.sin(depth*8+Math.sin(angle*3)*.5);
   tint.copy(deep).lerp(ridge,.28+crease*.5);tint.multiplyScalar(1-station/STATIONS*.23);colors.push(tint.r,tint.g,tint.b);
  }
  for(let station=0;station<STATIONS;station++)for(let side=0;side<SIDES;side++){
   const a=station*(SIDES+1)+side,b=a+SIDES+1;indices.push(a,b,a+1,a+1,b,b+1);
  }
  const wallGeometry=new THREE.BufferGeometry();wallGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));wallGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));wallGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  wallGeometry.setIndex(indices);wallGeometry.computeVertexNormals();
  const ringGeometry=new THREE.TorusGeometry(1,.045,6,48),ringPoints=ringGeometry.attributes.position,ringColors=[];
  for(let i=0;i<ringPoints.count;i++){
   const angle=Math.atan2(ringPoints.getY(i),ringPoints.getX(i)),warp=1+.022*Math.sin(angle*5)+.013*Math.sin(angle*9+.8);
   ringPoints.setXYZ(i,ringPoints.getX(i)*warp,ringPoints.getY(i)*warp,ringPoints.getZ(i)+.012*Math.sin(angle*4));
   tint.setHex(0x98717a);ringColors.push(tint.r,tint.g,tint.b);
  }
  ringGeometry.setAttribute('color',new THREE.Float32BufferAttribute(ringColors,3));ringGeometry.computeVertexNormals();
  const lip=new THREE.Mesh(ringGeometry,lining);lip.name='permanent-mouth-rim';this.add(lip);
  const wall=new THREE.Mesh(wallGeometry,lining);wall.name='throat-tapered-lining';this.add(wall);
  const end=new THREE.Mesh(new THREE.CircleGeometry(.36,24),new THREE.MeshBasicMaterial({color:0x020207,side:THREE.DoubleSide}));
  const endCenter=centerAt(6.85);end.position.set(endCenter.x,endCenter.y,-6.85);this.add(end);
  this.teeth=new THREE.InstancedMesh(curvedTooth(),enamel,ROWS*TEETH_PER_ROW);
  this.teeth.name='eight-rows-of-inward-teeth';
  const ribs=new THREE.InstancedMesh(ringGeometry,lining,ROWS);ribs.name='throat-ridges';
  const pose=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3();
  for(let row=0;row<ROWS;row++){
   const radius=radiusAt(row),z=-.15-row*.85,center=centerAt(-z);
   pose.position.set(center.x,center.y,z);pose.rotation.set(.015*Math.sin(row),.02*Math.cos(row),row*.43);pose.scale.set(radius,radius*(1+.025*Math.sin(row*1.9)),radius);pose.updateMatrix();ribs.setMatrixAt(row,pose.matrix);
   for(let tooth=0;tooth<TEETH_PER_ROW;tooth++){
    const angle=(tooth+(row%2)*.5)/TEETH_PER_ROW*Math.PI*2+.018*Math.sin(tooth*2.7+row);
    const gumRadius=foldedRadius(-z,angle)-.012;
    pose.position.set(center.x+Math.cos(angle)*gumRadius,center.y+Math.sin(angle)*gumRadius,z+.015*Math.sin(row*2+tooth));
    direction.set(-Math.cos(angle),-Math.sin(angle),-.45).normalize();pose.quaternion.setFromUnitVectors(up,direction);
    pose.scale.setScalar((1-row*.055)*(.83+.22*(.5+.5*Math.sin(tooth*3.1+row*1.3))));pose.updateMatrix();this.teeth.setMatrixAt(row*TEETH_PER_ROW+tooth,pose.matrix);
   }
  }
  this.teeth.instanceMatrix.needsUpdate=true;ribs.instanceMatrix.needsUpdate=true;
  this.teeth.computeBoundingSphere();ribs.computeBoundingSphere();this.add(ribs,this.teeth);
 }
 dispose(){
  const geometries=new Set(),materials=new Set();this.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());if(this.ownsSurfaceMaps)this.surfaceMaps.dispose();this.clear();
 }
}

/** Open real triangles in the front skin/shell instead of drawing a dark decal. */
export function cutSquidMouthOpening(geometry){
 const p=geometry.attributes.position,index=geometry.index,kept=[];
 for(let i=0;i<(index?.count??p.count);i+=3){
  const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);
  const x=ids.reduce((s,id)=>s+p.getX(id),0)/3,y=ids.reduce((s,id)=>s+p.getY(id),0)/3,z=ids.reduce((s,id)=>s+p.getZ(id),0)/3;
  if(z>.55&&(x/.24)**2+((y+.32)/.19)**2<1)continue;
  kept.push(...ids);
 }
 geometry.setIndex(kept);geometry.computeBoundingSphere();return geometry;
}
