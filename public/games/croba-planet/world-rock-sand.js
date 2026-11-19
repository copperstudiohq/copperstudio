import * as THREE from './vendor/three.module.js';
import {createWorldRockGeometry,getWorldRockPose} from './world-rock-geometry.js';

const SCALE=25,LIFT=.006*SCALE,MIN_UP=.5,EPS=1e-7;
const prototypes=new Map(),surfaces=new WeakMap();
const hash=id=>Array.from(String(id)).reduce((value,ch)=>(Math.imul(value,31)+ch.charCodeAt(0))>>>0,0);

/** Retain only three tiny CPU prototypes. No maps or GPU resources are owned. */
function prototype(style){
 let result=prototypes.get(style);if(result)return result;
 const geometry=createWorldRockGeometry(style),p=geometry.attributes.position;
 result=Array.from({length:geometry.index?.count??p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,geometry.index?.getX(i)??i));
 geometry.dispose();prototypes.set(style,result);return result;
}

function surfaceFor(rock){
 if(!rock||typeof rock!=='object')throw new TypeError('A rock surface requires an authored rock record.');
 let cached=surfaces.get(rock);if(cached)return cached;
 const pose=getWorldRockPose(rock),center=new THREE.Vector3(rock.x,rock.y,rock.z+rock.height/2);
 const points=prototype(rock.style??0).map(point=>{
  const p=point.clone().applyMatrix4(pose.matrix);return new THREE.Vector3(p.x*SCALE,p.z*SCALE,p.y*SCALE);
 });
 const faces=[];
 for(let i=0;i<points.length;i+=3){
  const [a,b,c]=points.slice(i,i+3),normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
  if(normal.dot(a.clone().sub(center))<0)normal.negate();
  const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
  faces.push({a,b,c,normal,denominator});
 }
 const seed=hash(rock.id),cx=.035*Math.sin(seed*.017),cy=.045*Math.cos(seed*.023),radius=.61+.075*Math.sin(seed*.013);
 const planes=Array.from({length:12},(_,i)=>{
  const angle=i/12*Math.PI*2,nx=Math.cos(angle),ny=Math.sin(angle);
  return{nx,ny,d:radius+.035*Math.sin(seed*.011+i*2.17)+nx*cx+ny*cy};
 });
 cached={faces,planes};surfaces.set(rock,cached);return cached;
}

function topAt(rock,x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 let result=null;
 for(const face of surfaceFor(rock).faces){
  const {a,b,c,normal,denominator}=face;if(normal.z<=EPS||Math.abs(denominator)<EPS)continue;
  const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/denominator;
  const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/denominator,w=1-u-v;
  if(u< -EPS||v< -EPS||w< -EPS)continue;
  const z=a.z*u+b.z*v+c.z*w;if(!result||z>result.z)result={z,face};
 }
 return result;
}

/** Highest exact facet at simulation X/Y. Sloping edges remain the actual
 * convex rock surface rather than a flat height or bounding ellipsoid.
 * @returns {{z:number,normal:{x:number,y:number,z:number}}|null}
 */
export function getWorldRockTopSurface(rock,x,y){
 const top=topAt(rock,x,y);if(!top)return null;
 return{z:top.z,normal:{x:top.face.normal.x,y:top.face.normal.y,z:top.face.normal.z}};
}

function localPoint(rock,point){
 const dx=point.x-rock.x,dy=point.y-rock.y,c=Math.cos(rock.heading),s=Math.sin(rock.heading);
 return{x:(dx*c-dy*s)/rock.rx,y:(dx*s+dy*c)/rock.ry};
}

function sandEligible(rock){return rock.habitat==='marine'&&rock.size==='boulder';}
function inSand(rock,x,y){
 const local=localPoint(rock,{x,y});return surfaceFor(rock).planes.every(p=>p.nx*local.x+p.ny*local.y<=p.d+EPS);
}

/** Matching sand support for offline plant authoring. The 6 mm lifted facet
 * and irregular cover boundary are exactly the ones drawn by the merged mesh.
 * @returns {{z:number,normal:{x:number,y:number,z:number}}|null}
 */
export function getWorldRockSandSurface(rock,x,y){
 if(!sandEligible(rock))return null;
 const top=topAt(rock,x,y);if(!top||top.face.normal.z<=MIN_UP||!inSand(rock,x,y))return null;
 return{z:top.z+LIFT,normal:{x:top.face.normal.x,y:top.face.normal.y,z:top.face.normal.z}};
}

/** Clip each actual upper facet against one uneven convex sand patch. Shared
 * local half-planes make the boundary continuous across adjacent rock faces. */
function sandPolygon(rock,face,planes){
 let polygon=[face.a,face.b,face.c];
 for(const plane of planes){
  if(!polygon.length)break;
  const output=[],distance=p=>{const local=localPoint(rock,p);return plane.nx*local.x+plane.ny*local.y-plane.d;};
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],da=distance(a),db=distance(b),insideA=da<=0,insideB=db<=0;
   if(insideA)output.push(a);
   if(insideA!==insideB)output.push(a.clone().lerp(b,da/(da-db)));
  }
  polygon=output;
 }
 return polygon;
}

/** One opaque world-coordinate sand mesh for all prepared marine boulders.
 * Irregular patches conform to upper facets and leave the chipped sides bare.
 * UVs are measured in world metres and use the existing sand maps.
 * @param {ReadonlyArray<import('./world-rock-geometry.js').WorldRock>} rocks
 * @returns {THREE.BufferGeometry}
 */
export function createWorldRockSandGeometry(rocks){
 if(!Array.isArray(rocks))throw new TypeError('Rock sand requires the prepared rock array.');
 const positions=[],normals=[],uvs=[],colors=[],ranges=[];
 for(const rock of rocks){
  if(!sandEligible(rock))continue;
  const {faces,planes}=surfaceFor(rock),start=positions.length/3,seed=hash(rock.id);
  for(const face of faces){
   if(face.normal.z<=MIN_UP)continue;
   const polygon=sandPolygon(rock,face,planes);
   for(let i=1;i<polygon.length-1;i++){
    let triangle=[polygon[0],polygon[i],polygon[i+1]];
    const normal=triangle[1].clone().sub(triangle[0]).cross(triangle[2].clone().sub(triangle[0]));
    if(normal.lengthSq()<1e-10)continue;
    // Swapping simulation Y/Z for render axes reverses triangle handedness.
    if(normal.dot(face.normal)>0)triangle=[triangle[0],triangle[2],triangle[1]];
    for(const point of triangle){
     positions.push(point.x/SCALE,(point.z+LIFT)/SCALE,point.y/SCALE);
     normals.push(face.normal.x,face.normal.z,face.normal.y);uvs.push(point.x/SCALE,point.y/SCALE);
     const grain=.94+.035*Math.sin(point.x*.31+point.y*.27+seed*.011);
     colors.push(grain,grain*.985,grain*.95);
    }
   }
  }
  ranges.push({id:rock.id,start,count:positions.length/3-start});
 }
 const geometry=new THREE.BufferGeometry();geometry.name='sand-on-marine-boulders';
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.userData.rockRanges=ranges;geometry.userData.sandLiftMeters=LIFT/SCALE;
 geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
