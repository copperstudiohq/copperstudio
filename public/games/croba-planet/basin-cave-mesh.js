import * as THREE from './vendor/three.module.js';
import {createGlacierShellSections} from './glacier-shell-profile.js';
import {basinCaveMeshNode,BASIN_CAVE_GRID,BASIN_CAVE_MOUTH_REACH} from './basin-caves.js';

/** The actual calved glacier section, including its third-edge vertices.
 * Interior surfaces are clipped here so nothing projects out of the ice. */
export function createBasinIceClip(ice){
 const layers=createGlacierShellSections(ice).map(ring=>ring.map(([x,z,y])=>({x:ice.x+Math.fround(x)*25,y:ice.y+Math.fround(y)*25,z:Math.fround(z)*25})));
 return p=>{
  if(p.z>layers[0][0].z)return layers[0][0].z-p.z;
  if(p.z<layers.at(-1)[0].z)return p.z-layers.at(-1)[0].z;
  let k=1;while(k<layers.length-1&&p.z<layers[k][0].z)k++;
  const a=layers[k-1],b=layers[k],t=(p.z-a[0].z)/(b[0].z-a[0].z);let distance=Infinity,inside=false;
  const segment=(ax,ay,bx,by)=>{
   const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;if(length<1e-16)return;
   const along=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/length));
   distance=Math.min(distance,Math.hypot(p.x-ax-dx*along,p.y-ay-dy*along));
   if((ay>p.y)!==(by>p.y)&&p.x<(bx-ax)*(p.y-ay)/(by-ay)+ax)inside=!inside;
  };
  for(let i=0;i<a.length;i++){
   const next=(i+1)%a.length,A=a[i],B=a[next],C=b[i],D=b[next];
   const ax=A.x+(C.x-A.x)*t,ay=A.y+(C.y-A.y)*t;
   const bx=B.x+(D.x-B.x)*t,by=B.y+(D.y-B.y)*t;
   // The diagonal is an actual shell edge. A loft-only polygon would bridge
   // its non-planar calving panels and reopen small triangular wall seams.
   const dx=B.x+(C.x-B.x)*t,dy=B.y+(C.y-B.y)*t;
   segment(ax,ay,dx,dy);segment(dx,dy,bx,by);
  }
  return inside?Math.min(distance,layers[0][0].z-p.z,p.z-layers.at(-1)[0].z):-distance;
 };
}

const interpolate=(a,b,t)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*t]));
function clipPolygon(points,signed,exact=false){
 const result=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],fa=signed(a),fb=signed(b);
  if(fa>=0)result.push(a);
  if((fa>=0)!==(fb>=0)){
   let t=fa/(fa-fb);
   // Calving faces change plane across both layer and diagonal boundaries.
   // Linear signed-distance interpolation can leave centimetre-wide wedges.
   if(exact){let low=0,high=1;for(let step=0;step<18;step++){const middle=(low+high)/2;if((signed(interpolate(a,b,middle))>=0)===(fa>=0))low=middle;else high=middle;}t=(low+high)/2;}
   result.push(interpolate(a,b,t));
  }
 }
 return result;
}

/** One union mesh per ice island. A clipped height-field gives flat walkable
 * floors, broken arched roofs and open intersections without overlapping pipes. */
export function createBasinCavernGeometry(ice,caves){
 const clipIce=createBasinIceClip(ice),positions=[],colors=[],coordinates=[],water=[];
 const bounds=caves.flatMap(c=>[0,1].map(s=>({x:c.x+c.nx*c.length*s,y:c.y+c.ny*c.length*s})));
 const step=BASIN_CAVE_GRID,minX=Math.floor((Math.min(...bounds.map(p=>p.x))-300)/step)*step;
 const minY=Math.floor((Math.min(...bounds.map(p=>p.y))-300)/step)*step;
 const columns=Math.ceil((Math.max(...bounds.map(p=>p.x))+300-minX)/step),rows=Math.ceil((Math.max(...bounds.map(p=>p.y))+300-minY)/step);
 const nodes=new Map(),level=caves[0].waterLevel;
 const node=(column,row)=>{
  const key=row*(columns+1)+column;if(nodes.has(key))return nodes.get(key);
  const x=minX+column*step,y=minY+row*step,q=basinCaveMeshNode(x,y,ice.id);
  const p={x,y,f:q.clearance,floor:q.floor,ceiling:q.ceiling};nodes.set(key,p);return p;
 };
 const emit=(points,target=positions,depth=0)=>{
  // A tall triangle can cross a curved glacier face twice. Refine only actual
  // shell intersections before clipping, so endpoint distances cannot cut a
  // see-through wedge out of an otherwise supported entrance wall.
  const distances=points.map(clipIce),edges=points.map((a,i)=>{const b=points[(i+1)%points.length];return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);});
  if(depth<7&&Math.max(...edges)>20&&Math.min(...distances)<0&&Math.max(...distances)>=0){
   const k=edges.indexOf(Math.max(...edges)),a=points[k],b=points[(k+1)%3],c=points[(k+2)%3],mid=interpolate(a,b,.5);
   emit([a,mid,c],target,depth+1);emit([mid,b,c],target,depth+1);return;
  }
  const clipped=clipPolygon(points,clipIce,true);
  for(let i=1;i<clipped.length-1;i++){
   const triangle=[clipped[0],clipped[i],clipped[i+1]],a=triangle[0],b=triangle[1],c=triangle[2];
   const normal=new THREE.Vector3(b.x-a.x,b.z-a.z,b.y-a.y).cross(new THREE.Vector3(c.x-a.x,c.z-a.z,c.y-a.y));
   const nx=Math.abs(normal.x),ny=Math.abs(normal.y),nz=Math.abs(normal.z);
   for(const p of triangle){
   target.push(p.x/25,p.z/25,p.y/25);
   if(target===positions){coordinates.push((nx>ny&&nx>nz?p.y:p.x)/25,(ny>=nx&&ny>=nz?p.y:p.z)/25);const shade=.64+.22*Math.sin(p.x*.033+p.y*.017+p.z*.07)**2;colors.push(.47*shade,.76*shade,.87*shade);}
   }
  }
 };
 const triangle=points=>{
  const polygon=clipPolygon(points,p=>p.f);if(polygon.length<3)return;
  for(let i=1;i<polygon.length-1;i++){
   const tri=[polygon[0],polygon[i],polygon[i+1]];
   emit([...tri].reverse().map(p=>({...p,z:p.floor})));
   emit(tri.map(p=>({...p,z:p.ceiling})));
  }
  const wet=clipPolygon(clipPolygon(polygon,p=>level-p.floor),p=>p.ceiling-level);
  for(let i=1;i<wet.length-1;i++)emit([wet[0],wet[i+1],wet[i]].map(p=>({...p,z:level})),water);
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length];if(Math.abs(a.f)>.001||Math.abs(b.f)>.001)continue;
   // Only the actual mouth cap is open; adjacent side walls remain sealed.
   if(caves.some(c=>Math.abs((a.x-c.x)*c.nx+(a.y-c.y)*c.ny+BASIN_CAVE_MOUTH_REACH)<.001&&Math.abs((b.x-c.x)*c.nx+(b.y-c.y)*c.ny+BASIN_CAVE_MOUTH_REACH)<.001&&Math.abs(-(a.x-c.x)*c.ny+(a.y-c.y)*c.nx)<160))continue;
   const lowA={...a,z:a.floor},lowB={...b,z:b.floor},highA={...a,z:a.ceiling},highB={...b,z:b.ceiling};
   emit([lowA,lowB,highA]);emit([lowB,highB,highA]);
  }
 };
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
  const a=node(column,row),b=node(column+1,row),c=node(column+1,row+1),d=node(column,row+1);
  if(Math.max(a.f,b.f,c.f,d.f)< -step*1.5)continue;
  triangle([a,b,c]);triangle([a,c,d]);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(coordinates,2));geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const pool=new THREE.BufferGeometry();pool.setAttribute('position',new THREE.Float32BufferAttribute(water,3));pool.computeVertexNormals();pool.computeBoundingSphere();
 geometry.userData.connectedBranches=caves.length;geometry.userData.flushIceOpenings=true;
 return{geometry,pool};
}
