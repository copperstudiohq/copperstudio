import * as THREE from './vendor/three.module.js';
import {BASE_SIDE_PLANK_BOUNDS,SIDE_ARMOR_TAPER_KNOTS,sideArmorOuterXAt} from './base-armor-taper.js';

/** A solid projecting metal plank with rolled edges and an embedded backing.
 * Longitudinal cross-sections return the outer face smoothly into the wall.
 * The baseline height and rounded vertical ends remain unchanged. */
export function createMetalWallBand(width,height=2,projection=1.04){
 const bounds=BASE_SIDE_PLANK_BOUNDS,half=bounds.halfLength/25,origin=bounds.innerX/25+.06;
 if(![width,height,projection].every(Number.isFinite)||Math.abs(width-half*2)>1e-6||Math.abs(height-(bounds.top-bounds.bottom)/25)>1e-6||Math.abs(projection-(bounds.outerX/25-origin))>1e-6)throw new TypeError('Side armor requires its shared fixed dimensions and outward projection.');
 const positions=[],colors=[],indices=[],sections=[],radius=height/2,straight=half-radius,count=8;
 const white=new THREE.Color(0xf6f7f5),navy=new THREE.Color(0x193d5b);
 const positive=[...new Set([...SIDE_ARMOR_TAPER_KNOTS.map(p=>p.y),165,185])].sort((a,b)=>a-b),stations=[...positive.filter(y=>y>0).reverse().map(y=>-y),...positive];
 for(const station of stations){
  const x=station/25,distance=Math.max(0,Math.abs(x)-straight),halfHeight=Math.max(.04,Math.sqrt(Math.max(0,radius*radius-distance*distance)));
  const back=-.060,front=sideArmorOuterXAt(station)/25-origin,thickness=front-back;
  // The embedded tips are only two centimetres thick. Scale both bevel axes
  // with that real width so no cross-section can fold through itself.
  const bevelDepth=Math.min(.08,thickness*.22),bevelHeight=Math.min(.04,halfHeight*.25,thickness*.25);
  const section=[
   [halfHeight-bevelHeight,back],[halfHeight,back+bevelDepth],[halfHeight,front-bevelDepth],[halfHeight-bevelHeight,front],
   [-halfHeight+bevelHeight,front],[-halfHeight,front-bevelDepth],[-halfHeight,back+bevelDepth],[-halfHeight+bevelHeight,back],
  ];sections.push(section);
  for(const [index,[y,z]]of section.entries()){
   const tint=index===0||index===7?white:navy;positions.push(x,y,z);colors.push(tint.r,tint.g,tint.b);
  }
 }
 for(let ring=0;ring<stations.length-1;ring++)for(let i=0;i<count;i++){
  const next=(i+1)%count,a=ring*count+i,b=ring*count+next,c=a+count,d=b+count;indices.push(a,b,c,b,d,c);
 }
 for(const [ring,right]of[[0,false],[stations.length-1,true]])for(const tri of THREE.ShapeUtils.triangulateShape(sections[ring].map(([y,z])=>new THREE.Vector2(y,z)),[])){
  const [a,b,c]=tri,p=sections[ring],area=(p[b][0]-p[a][0])*(p[c][1]-p[a][1])-(p[b][1]-p[a][1])*(p[c][0]-p[a][0]);
  indices.push(...((area>0)===right?[a,b,c]:[a,c,b]).map(i=>ring*count+i));
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.userData={metalBand:true,closed:true,rounded:true,bevelled:true,depthTaper:true,sharedDepthProfile:true,longitudinalStations:stations.length,crossSectionVertices:count,embeddedTipThicknessMeters:(sideArmorOuterXAt(bounds.halfLength)-bounds.innerX)/25,widthMeters:width,heightMeters:height,depthMeters:projection+.060};return geometry;
}

function outline(x,z,r,segments=3){
 const points=[];
 for(const[cx,cz,start]of[[x-r,-z+r,-Math.PI/2],[x-r,z-r,0],[-x+r,z-r,Math.PI/2],[-x+r,-z+r,Math.PI]])for(let i=0;i<=segments;i++){
  const a=start+i*Math.PI/2/segments;points.push([cx+Math.cos(a)*r,cz+Math.sin(a)*r]);
 }
 return points;
}

/** A closed, sculpted white shoulder supports a broad raised blue crown.
 * Inner cove stays outside the usable room; its underside is at clear height. */
export function createRoundedBaseRoof(){
 const positions=[],colors=[],indices=[],white=new THREE.Color(0xf6f7f5),blue=new THREE.Color(0x397da8);
 const profiles=[[6,8,.24,-.42,white],[6,8,.28,-.14,white],[5.97,7.97,.38,.12,white],
  [5.72,7.72,.62,.43,white],[5.36,7.36,.82,.66,white],[5.12,7.12,.92,.74,blue]];
 // Broad stadium profiles form a lengthwise barrel: the width arches inward
 // faster than the length, leaving a long crest and rounded front/back caps.
 const crownHeight=x=>.74+.86*Math.sqrt(1-(x/5.12)**2);
 profiles.push([3.4,6.1,3.35,crownHeight(3.4),blue],[1.7,5.1,1.65,crownHeight(1.7),blue]);
 const rings=profiles.map(([x,z,r,y,tint])=>{
  const points=outline(x,z,r,4),first=positions.length/3;
  for(const[px,pz]of points){positions.push(px,y,pz);colors.push(tint.r,tint.g,tint.b);}return{first,count:points.length};
 });
 const count=rings[0].count;
 for(let ring=0;ring<rings.length-1;ring++)for(let i=0;i<count;i++){
  const n=(i+1)%count,a=rings[ring].first+i,b=rings[ring].first+n,c=rings[ring+1].first+i,d=rings[ring+1].first+n;indices.push(a,c,b,b,c,d);
 }
 const ridge=positions.length/3;
 for(const z of[-3.4,3.4]){positions.push(0,1.60,z);colors.push(blue.r,blue.g,blue.b);}
 for(let i=0;i<count;i++){
  const a=rings.at(-1).first+i,b=rings.at(-1).first+(i+1)%count;
  const ra=ridge+(positions[a*3+2]<0?0:1),rb=ridge+(positions[b*3+2]<0?0:1);
  indices.push(ra,b,a);if(ra!==rb)indices.push(ra,rb,b);
 }
 // The inner cove seals the roof onto the top of the insulated room walls.
 const inner=positions.length/3;for(const[x,z]of outline(5.7,7.7,.24,4)){positions.push(x,0,z);colors.push(white.r,white.g,white.b);}
 for(let i=0;i<count;i++){const n=(i+1)%count;indices.push(i,n,inner+i,n,inner+n,inner+i);}
 const underside=positions.length/3;positions.push(0,0,0);colors.push(white.r,white.g,white.b);
 for(let i=0;i<count;i++)indices.push(underside,inner+i,inner+(i+1)%count);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.userData={rounded:true,sculptedShoulder:true,raisedCrown:true,gentleDome:true,longDome:true,longitudinalRidgeMeters:6.8,closed:true,blueAreaFraction:.76,roofRiseMeters:1.60,crownProfileRings:3,shoulderStartMeters:-.42,widthMeters:12,lengthMeters:16};return geometry;
}

/** A rounded modular armor panel with a genuine recessed central face. The
 * front frame, bevel and backing are one closed geometry, not decal boxes. */
export function createInsetWallPanel(width,height,depth=.24){
 const positions=[],indices=[],profiles=[[width/2,height/2,.15,-depth/2],[width/2,height/2,.15,depth/2],
  [width/2-.10,height/2-.12,.12,depth/2],[width/2-.13,height/2-.15,.10,depth/2-.055]],count=16;
 for(const[x,y,r,z]of profiles)for(const[px,py]of outline(x,y,r,3))positions.push(px,py,z);
 for(let ring=0;ring<profiles.length-1;ring++)for(let i=0;i<count;i++){
  const n=(i+1)%count,a=ring*count+i,b=ring*count+n,c=a+count,d=b+count;indices.push(a,b,c,b,d,c);
 }
 const back=positions.length/3;positions.push(0,0,-depth/2);
 const front=positions.length/3;positions.push(0,0,depth/2-.055);
 for(let i=0;i<count;i++){const n=(i+1)%count;indices.push(back,n,i,front,3*count+i,3*count+n);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.userData={rounded:true,modular:true,recessed:true,recessMeters:.055,closed:true};return geometry;
}

/** One smooth tubular edge, including all four rounded corners. */
export function createRoundedPerimeter(width,length,cornerRadius,radius){
 const x=width/2,z=length/2,r=cornerRadius,positions=[],normals=[],uvs=[],indices=[],stations=[],radial=10;
 // Sample each small corner explicitly. Uniform arc-length sampling wastes
 // vertices along long straight walls and can skip these bends completely.
 for(const[cx,cz,start]of[[x-r,-z+r,-Math.PI/2],[x-r,z-r,0],[-x+r,z-r,Math.PI/2],[-x+r,-z+r,Math.PI]])for(let i=0;i<=6;i++){
  const angle=start+i*Math.PI/12,nx=Math.cos(angle),nz=Math.sin(angle);stations.push({x:cx+nx*r,z:cz+nz*r,nx,nz});
 }
 for(const [index,point]of stations.entries())for(let j=0;j<radial;j++){
  const angle=j*Math.PI*2/radial,c=Math.cos(angle),s=Math.sin(angle);
  positions.push(point.x+point.nx*c*radius,s*radius,point.z+point.nz*c*radius);
  normals.push(point.nx*c,s,point.nz*c);uvs.push(index/stations.length,j/radial);
 }
 for(let i=0;i<stations.length;i++)for(let j=0;j<radial;j++){
  const next=(i+1)%stations.length,a=i*radial+j,b=i*radial+(j+1)%radial,c=next*radial+j,d=next*radial+(j+1)%radial;indices.push(a,b,c,b,d,c);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
 geometry.userData={rounded:true,continuousPerimeter:true,radiusMeters:radius,cornerSegments:6,radialSegments:radial};return geometry;
}
