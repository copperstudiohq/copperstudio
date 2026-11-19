import * as THREE from './vendor/three.module.js';
import {SALT_CAVE_SHAFT,SALT_SHAFT_RING,saltCaveSection,saltCaveMeshNode,SALT_CAVE_GRID} from './salt-cave.js';

/** Face-aligned UVs keep the shared Shell Field stone from stretching on walls. */
function projectStoneUvs(geometry){
 const p=geometry.attributes.position,n=geometry.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i+=3){
  const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
  for(let j=i;j<i+3;j++){uv[j*2]=(nx>ny&&nx>nz?p.getZ(j):p.getX(j))*.22;uv[j*2+1]=(ny>=nx&&ny>=nz?p.getZ(j):p.getY(j))*.22;}
 }
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));return geometry;
}

/** Subtract a convex volume without deleting neighboring triangles. Attribute
 * interpolation seals the opening even where a source triangle is very large. */
function subtractVolume(source,planes,near){
 const indexed=Boolean(source.index),input=indexed?source.toNonIndexed():source,attributes=input.attributes;
 const keys=Object.keys(attributes),sizes=keys.map(key=>attributes[key].itemSize),offsets=[];let size=0;
 for(const n of sizes){offsets.push(size);size+=n;}
 const output=keys.map(()=>[]),read=i=>keys.flatMap(key=>Array.from({length:attributes[key].itemSize},(_,k)=>attributes[key].array[i*attributes[key].itemSize+k]));
 const emit=poly=>{for(let i=1;i<poly.length-1;i++)for(const p of[poly[0],poly[i],poly[i+1]])keys.forEach((_,k)=>output[k].push(...p.slice(offsets[k],offsets[k]+sizes[k])));};
 for(let i=0;i<attributes.position.count;i+=3){
  const triangle=[read(i),read(i+1),read(i+2)];if(!near(triangle)){emit(triangle);continue;}
  let polygon=triangle;
  for(const plane of planes){
   if(polygon.length<3)break;
   const inside=[],outside=[],distance=p=>plane[0]*p[0]+plane[1]*p[1]+plane[2]*p[2]+plane[3];
   for(let j=0;j<polygon.length;j++){
    const a=polygon[j],b=polygon[(j+1)%polygon.length],da=distance(a),db=distance(b),ain=da<=1e-8,bin=db<=1e-8;
    (ain?inside:outside).push(a);
    if(ain!==bin){const t=da/(da-db),p=a.map((v,k)=>v+(b[k]-v)*t);inside.push(p);outside.push(p);}
   }
   if(outside.length>=3)emit(outside);polygon=inside;
  }
 }
 const result=new THREE.BufferGeometry();keys.forEach((key,k)=>result.setAttribute(key,new THREE.Float32BufferAttribute(output[k],sizes[k])));
 result.computeVertexNormals();result.computeBoundingSphere();result.userData={...source.userData,saltCaveOpening:true};
 if(indexed)input.dispose();source.dispose();return result;
}
export function carveSaltCliffEntrance(source){
 const arch=[[-130,-814],[130,-814]];
 for(let i=24;i>=0;i--){const x=-130+i/24*260,edge=Math.max(0,1-(130-Math.abs(x))/180);arch.push([x,-235-260*edge*edge-3]);}
 const planes=arch.map((a,i)=>{const b=arch[(i+1)%arch.length],nx=b[1]-a[1],nz=a[0]-b[0];return[nx,nz,0,-(nx*(5150+a[0])+nz*a[1])/25];});
 planes.push([0,0,1,11298/25],[0,0,-1,-11485/25]);
 return subtractVolume(source,planes,t=>Math.max(...t.map(p=>p[0]))>=5020/25&&Math.min(...t.map(p=>p[0]))<=5280/25&&Math.max(...t.map(p=>p[2]))>=-11485/25&&Math.min(...t.map(p=>p[2]))<=-11298/25);
}
export function carveSaltGeyserShaft(source){
 const planes=SALT_SHAFT_RING.map((a,i)=>{const b=SALT_SHAFT_RING[(i+1)%SALT_SHAFT_RING.length],nx=b[1]-a[1],ny=a[0]-b[0];return[nx,0,ny,-(nx*a[0]+ny*a[1])/25];});
 const s=SALT_CAVE_SHAFT;
 return subtractVolume(source,planes,t=>Math.max(...t.map(p=>p[0]))>=(s.x-s.radius)/25&&Math.min(...t.map(p=>p[0]))<=(s.x+s.radius)/25&&Math.max(...t.map(p=>p[2]))>=(s.y-s.radius)/25&&Math.min(...t.map(p=>p[2]))<=(s.y+s.radius)/25);
}

/** A continuous floor, arched roof and side walls, with a vertical shaft cut
 * through the roof. The sole open end meets the carved ocean cliff. */
export function createSaltCaveGeometry(groundAt){
 const cliffMouthY=-11298;
 const positions=[],colors=[],uvs=[],tint=new THREE.Color();
 const emit=(a,b,c)=>{
  for(const p of[a,b,c]){positions.push(p[0]/25,p[2]/25,p[1]/25);uvs.push(p[0]/90,p[1]/90+p[2]/75);
   const grain=.86+.10*Math.sin(p[0]*.036+p[1]*.018+p[2]*.12)**2;
   tint.setRGB(grain,grain,grain);colors.push(...tint.toArray());}
 };
 const quad=(a,b,c,d)=>{emit(a,b,c);emit(b,d,c);};
 const clip=points=>{
  const result=[];
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length];if(a.f>=0)result.push(a);
   if((a.f>=0)!==(b.f>=0)){const t=a.f/(a.f-b.f),p={};for(const key of Object.keys(a))p[key]=a[key]+(b[key]-a[key])*t;result.push(p);}
  }return result;
 };
 const triangle=points=>{
  const polygon=clip(points);if(polygon.length<3)return;
  const at=(p,roof)=>[p.x,p.y,roof?p.roof:p.floor];
  for(let i=1;i<polygon.length-1;i++){
   emit(at(polygon[0],false),at(polygon[i+1],false),at(polygon[i],false));
   emit(at(polygon[0],true),at(polygon[i],true),at(polygon[i+1],true));
  }
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length];if(Math.abs(a.f)>.001||Math.abs(b.f)>.001)continue;
   if(Math.abs(a.y-cliffMouthY)<.01&&Math.abs(b.y-cliffMouthY)<.01)continue;
   quad(at(a,false),at(b,false),at(a,true),at(b,true));
  }
 };
 // The physical capture zone begins just outside the cliff, but its rock
 // sleeve must stop flush with the cut instead of protruding into the ocean.
 const node=(x,y)=>{const q=saltCaveMeshNode(x,y);return{x,y,f:Math.min(q.clearance,cliffMouthY-y),floor:q.floor,roof:q.roof};};
 for(let y=-13950;y<-11250;y+=SALT_CAVE_GRID)for(let x=4000;x<6450;x+=SALT_CAVE_GRID){
  const a=node(x,y),b=node(x+25,y),c=node(x+25,y+25),d=node(x,y+25);
  if(Math.max(a.f,b.f,c.f,d.f)<0)continue;triangle([a,b,c]);triangle([a,c,d]);
 }
 const source=new THREE.BufferGeometry();source.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));source.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));source.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 // Only the roof needs a hole; re-append the floor under the shaft afterwards.
 const geometry=carveSaltGeyserShaft(source),shaftPositions=[],shaftUvs=[];
 const add=p=>{shaftPositions.push(p[0]/25,p[2]/25,p[1]/25);shaftUvs.push(p[0]/80,p[2]/80);};
 for(let i=0;i<SALT_SHAFT_RING.length;i++){
  const a=SALT_SHAFT_RING[i],b=SALT_SHAFT_RING[(i+1)%SALT_SHAFT_RING.length],qa=saltCaveSection(...a),qb=saltCaveSection(...b);
  const lowA=[...a,qa.roof-.3],lowB=[...b,qb.roof-.3],topA=[...a,groundAt(...a)+.8],topB=[...b,groundAt(...b)+.8];
  for(const p of[lowA,lowB,topA,lowB,topB,topA])add(p);
  const center=[SALT_CAVE_SHAFT.x,SALT_CAVE_SHAFT.y,-640];
  for(const p of[center,[...a,qa.floor],[...b,qb.floor]])add(p);
 }
 const shaft=new THREE.BufferGeometry();shaft.setAttribute('position',new THREE.Float32BufferAttribute(shaftPositions,3));shaft.setAttribute('uv',new THREE.Float32BufferAttribute(shaftUvs,2));shaft.computeVertexNormals();shaft.computeBoundingSphere();
 projectStoneUvs(geometry);projectStoneUvs(shaft);return{geometry,shaft};
}
