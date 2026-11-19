import * as THREE from './vendor/three.module.js';

/** Flat capsule-shaped paint, with a narrow feather into the white wall.
 * Only colour changes across the edge: the band has no extruded block sides. */
export function createRoundedWallBand(width,height=.7){
 if(!Number.isFinite(width)||!Number.isFinite(height)||height<=0||width<height)throw new TypeError('Wall paint requires a positive capsule size.');
 const radius=height/2,straight=width/2-radius,positions=[],colors=[],indices=[];
 const gray=new THREE.Color(0x7f898e),white=new THREE.Color(0xf6f7f5);
 const ring=r=>{
  const points=[];
  for(let side=0;side<2;side++)for(let i=0;i<=18;i++){
   const angle=(side===0?Math.PI/2:-Math.PI/2)+Math.PI*i/18;
   points.push([(side===0?-straight:straight)+Math.cos(angle)*r,Math.sin(angle)*r]);
  }
  return points;
 };
 const inner=ring(radius-.018),outer=ring(radius),count=inner.length;
 positions.push(0,0,0);colors.push(gray.r,gray.g,gray.b);
 for(const[points,tint]of[[inner,gray],[outer,white]])for(const[x,y]of points){positions.push(x,y,0);colors.push(tint.r,tint.g,tint.b);}
 for(let i=0;i<count;i++){
  const next=(i+1)%count,a=i+1,b=next+1,c=count+i+1,d=count+next+1;
  indices.push(0,a,b,a,c,b,b,c,d);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.userData={painted:true,flush:true,roundedCaps:true,featherMeters:.018,widthMeters:width,heightMeters:height};return geometry;
}

/** Coplanar hexagonal linework and navy inlays. All triangles sit at one
 * height on the smooth floor; none become a tile, lip, or collision obstacle. */
export function createBaseFloorPattern(){
 const positions=[],colors=[],indices=[],gray=new THREE.Color(0x63737e),navy=new THREE.Color(0x193d5b),radius=.48;
 let hexagons=0,navyInlays=0;
 const point=(x,z,tint)=>{const index=positions.length/3;positions.push(x,.0247,z);colors.push(tint.r,tint.g,tint.b);return index;};
 const quad=(a,b,c,d,tint)=>{const start=positions.length/3;for(const p of[a,b,c,d])point(p[0],p[1],tint);indices.push(start,start+2,start+1,start+1,start+2,start+3);};
 const ring=(cx,cz,r,width,tint)=>{
  for(let side=0;side<6;side++){
   const a=side*Math.PI/3,b=(side+1)*Math.PI/3;
   quad([cx+Math.cos(a)*r,cz+Math.sin(a)*r],[cx+Math.cos(b)*r,cz+Math.sin(b)*r],
    [cx+Math.cos(a)*(r-width),cz+Math.sin(a)*(r-width)],[cx+Math.cos(b)*(r-width),cz+Math.sin(b)*(r-width)],tint);
  }
 };
 // A regular honeycomb runs across the room; margin leaves the white wall
 // base clean and the doorway approach entirely flat.
 for(let col=-7;col<=7;col++)for(let row=-8;row<=8;row++){
  const x=col*radius*1.5,z=(row+(Math.abs(col)%2)*.5)*Math.sqrt(3)*radius;
  if(Math.abs(x)+radius>5.43||Math.abs(z)+radius>7.38)continue;
  ring(x,z,radius,.015,gray);hexagons++;
  // Three pairs of restrained navy islands flank the central walking lane.
  if(Math.abs(col)===3&&Math.abs(row)%3===0){
   ring(x,z,radius*.78,.055,navy);
   const center=point(x,z,navy),r=radius*.34;
   for(let side=0;side<6;side++){
    const a=side*Math.PI/3,b=(side+1)*Math.PI/3;
    indices.push(center,point(x+Math.cos(b)*r,z+Math.sin(b)*r,navy),point(x+Math.cos(a)*r,z+Math.sin(a)*r,navy));
   }
   navyInlays++;
  }
 }
 // A small navy direction motif leads inward from the door rather than
 // adding a raised threshold or a second floor material.
 for(const z of[5.8,6.35,6.9]){
  quad([-.34,z-.16],[0,z-.40],[-.29,z-.10],[.05,z-.34],navy);
  quad([0,z-.40],[.34,z-.16],[-.05,z-.34],[.29,z-.10],navy);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.userData={flush:true,hexagonCount:hexagons,navyInlayCount:navyInlays,paintHeightMeters:.0247};return geometry;
}
