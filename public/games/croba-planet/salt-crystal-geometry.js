import * as THREE from './vendor/three.module.js';

const HALF=[.44,.5,.44],BEVEL=.035;

/** A single connected halite crystal: orthogonal cleavage, square hopper
 * terraces and partly buried intergrowths. Y remains the existing growth axis;
 * its ±.5 roots keep floor, wall and hanging instance attachments unchanged. */
export function createSaltCrystalGeometry(){
 const positions=[],uvs=[];
 const triangle=(a,b,c,outward)=>{
  const ab=b.map((value,i)=>value-a[i]),ac=c.map((value,i)=>value-a[i]);
  let normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  if(outward&&normal.reduce((sum,value,i)=>sum+value*outward[i],0)<0){[b,c]=[c,b];normal=normal.map(value=>-value);}
  const axis=normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs)));
  for(const point of[a,b,c]){
   positions.push(...point);
   // Face projection also gives the recessed risers useful, noncollapsed UVs.
   uvs.push((axis===0?point[2]:point[0])+.5,(axis===1?point[2]:point[1])+.5);
  }
 };
 const quad=(a,b,c,d,outward)=>{triangle(a,b,c,outward);triangle(a,c,d,outward);};
 const faces=[
  {axis:1,sign:1,u:[1,0,0],v:[0,0,-1],kind:'hopper'},
  {axis:1,sign:-1,u:[1,0,0],v:[0,0,1],kind:'flat'},
  {axis:2,sign:1,u:[1,0,0],v:[0,1,0],kind:'hopper'},
  {axis:2,sign:-1,u:[-1,0,0],v:[0,1,0],kind:'shoulder',center:[.23,-.22]},
  {axis:0,sign:1,u:[0,0,-1],v:[0,1,0],kind:'shoulder',center:[-.20,.23]},
  {axis:0,sign:-1,u:[0,0,1],v:[0,1,0],kind:'hopper'},
 ];
 for(const face of faces){
  const uAxis=face.u.findIndex(value=>value!==0),vAxis=face.v.findIndex(value=>value!==0);
  const width=HALF[uAxis]-BEVEL,height=HALF[vAxis]-BEVEL;
  const ring=(w,h,depth=0,center=[0,0])=>[[-w,-h],[w,-h],[w,h],[-w,h]].map(([u,v])=>{
   const point=face.u.map((value,i)=>value*(u+center[0])+face.v[i]*(v+center[1]));
   point[face.axis]=face.sign*(HALF[face.axis]+depth);return point;
  });
  const outer=ring(width,height);let rings;
  if(face.kind==='hopper'){
   // Flat square lips alternate with true perpendicular inward walls. The
   // second terrace and central basin are geometry, rather than painted bands.
   rings=[outer,ring(width-.065,height-.065),ring(width-.065,height-.065,-.075),
    ring(width-.16,height-.16,-.075),ring(width-.16,height-.16,-.16)];
  }else if(face.kind==='shoulder'){
   // These shoulders share the core's face boundary: no separate cube, hidden
   // overlapping shell or detached fragment is needed for a small intergrowth.
   rings=[outer,ring(.13,.17,0,face.center),ring(.13,.17,.055,face.center),ring(.118,.158,.075,face.center)];
  }else rings=[outer];
  for(let layer=1;layer<rings.length;layer++)for(let edge=0;edge<4;edge++){
   const next=(edge+1)%4;
   quad(rings[layer-1][edge],rings[layer-1][next],rings[layer][next],rings[layer][edge]);
  }
  const cap=rings[rings.length-1];quad(cap[0],cap[1],cap[2],cap[3]);
 }

 // Narrow cleavage bevels join all six face boundaries into a watertight core.
 for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)for(const sa of[-1,1])for(const sb of[-1,1]){
  const c=3-a-b,outward=[0,0,0];outward[a]=sa;outward[b]=sb;
  const at=(side,end)=>{
   const point=[0,0,0];point[a]=sa*(HALF[a]-(side?BEVEL:0));
   point[b]=sb*(HALF[b]-(side?0:BEVEL));point[c]=end*(HALF[c]-BEVEL);return point;
  };
  quad(at(0,-1),at(1,-1),at(1,1),at(0,1),outward);
 }
 for(const x of[-1,1])for(const y of[-1,1])for(const z of[-1,1]){
  const signs=[x,y,z],points=HALF.map((_,axis)=>HALF.map((half,i)=>signs[i]*(half-(i===axis?0:BEVEL))));
  triangle(points[0],points[1],points[2],signs);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.userData.saltCrystal=true;return geometry;
}
