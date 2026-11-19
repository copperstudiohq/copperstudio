import * as THREE from './vendor/three.module.js';
import {PREPARED_WORLD_ROCKS} from './world-rock-data.js';
import {createWorldRockGeometry,getWorldRockPose} from './world-rock-geometry.js';

const CELL=200,EPS=1e-7,SKIN=.02,MIN_SOLID_HEIGHT=14;
const caches=new WeakMap();
const finitePoint=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);

/** Cache the same transformed convex vertices that the renderer uploads.
 * Loose gravel stays passable; larger rocks use a spatial index, not a full
 * world scan per frame. The cache belongs to the immutable prepared array. */
function cacheFor(rocks){
 let cache=caches.get(rocks);if(cache)return cache;
 const prototypes=new Map(),cells=new Map(),solids=[],pose=new THREE.Object3D(),point=new THREE.Vector3();
 try{
  for(const rock of rocks){
   if(rock.height<MIN_SOLID_HEIGHT)continue;
   getWorldRockPose(rock,pose);
   let prototype=prototypes.get(rock.style??0);
   if(!prototype){prototype=createWorldRockGeometry(rock.style??0);prototypes.set(rock.style??0,prototype);}
   const attribute=prototype.attributes.position,indices=prototype.index;
   const vertices=[],lookup=new Map(),remap=[];
   for(let i=0;i<attribute.count;i++){
    point.fromBufferAttribute(attribute,i).applyMatrix4(pose.matrix);
    const vertex={x:point.x*25,y:point.z*25,z:point.y*25};
    const key=[vertex.x,vertex.y,vertex.z].map(n=>Math.round(n*1e7)).join(':');
    if(!lookup.has(key)){lookup.set(key,vertices.length);vertices.push(vertex);}
    remap.push(lookup.get(key));
   }
   const edges=[],edgeKeys=new Set(),count=indices?.count??attribute.count;
   for(let i=0;i<count;i+=3){
    const corners=[0,1,2].map(j=>remap[indices?.getX(i+j)??i+j]);
    for(let j=0;j<3;j++){
     const a=corners[j],b=corners[(j+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;
     if(!edgeKeys.has(key)){edgeKeys.add(key);edges.push([a,b]);}
    }
   }
   const minX=Math.min(...vertices.map(v=>v.x)),maxX=Math.max(...vertices.map(v=>v.x));
   const minY=Math.min(...vertices.map(v=>v.y)),maxY=Math.max(...vertices.map(v=>v.y));
   const entry={vertices,edges,minX,maxX,minY,maxY,
    minZ:Math.min(...vertices.map(v=>v.z)),maxZ:Math.max(...vertices.map(v=>v.z))};
   solids.push(entry);
   for(let x=Math.floor(minX/CELL);x<=Math.floor(maxX/CELL);x++)for(let y=Math.floor(minY/CELL);y<=Math.floor(maxY/CELL);y++){
    const key=`${x}:${y}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(entry);
   }
  }
 }finally{for(const geometry of prototypes.values())geometry.dispose();}
 cache={cells,solids};caches.set(rocks,cache);return cache;
}

/** The projection of the height-clipped convex hull is the actual horizontal
 * obstacle touched by a vertical player body. It leaves narrow tops and tilted
 * sides intact rather than turning each boulder into a full-height cylinder. */
function footprint(rock,low,high,radius){
 if(low>=rock.maxZ-EPS||high<=rock.minZ+EPS)return null;
 const points=[];
 for(const v of rock.vertices)if(v.z>=low-EPS&&v.z<=high+EPS)points.push(v);
 for(const [ai,bi]of rock.edges){
  const a=rock.vertices[ai],b=rock.vertices[bi],dz=b.z-a.z;if(Math.abs(dz)<EPS)continue;
  for(const z of[low,high]){
   const t=(z-a.z)/dz;if(t>0&&t<1)points.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  }
 }
 points.sort((a,b)=>a.x-b.x||a.y-b.y);
 const unique=points.filter((p,i)=>!i||Math.abs(p.x-points[i-1].x)>EPS||Math.abs(p.y-points[i-1].y)>EPS);
 if(unique.length<3)return null;
 const lower=[],upper=[];
 for(const p of unique){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=EPS)lower.pop();lower.push(p);}
 for(let i=unique.length-1;i>=0;i--){const p=unique[i];while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=EPS)upper.pop();upper.push(p);}
 const hull=[...lower.slice(0,-1),...upper.slice(0,-1)];
 return hull.map((a,i)=>{
  const b=hull[(i+1)%hull.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  const nx=dy/length,ny=-dx/length;
  // Edge-plane expansion is slightly conservative at corners; it prevents
  // visible clipping without expensive per-frame rigid-body physics.
  return {nx,ny,d:nx*a.x+ny*a.y+radius};
 });
}

function sweep(start,dx,dy,planes){
 let enter=0,exit=1,normal=null,nearest=null,closest=-Infinity,inside=true;
 for(const plane of planes){
  const distance=plane.nx*start.x+plane.ny*start.y-plane.d,velocity=plane.nx*dx+plane.ny*dy;
  if(distance>EPS)inside=false;
  if(distance>closest){closest=distance;nearest=plane;}
  if(Math.abs(velocity)<EPS){if(distance>EPS)return null;continue;}
  const t=-distance/velocity;
  if(velocity<0){if(t>=enter){enter=t;normal=plane;}}else exit=Math.min(exit,t);
  if(enter>exit+EPS)return null;
 }
 if(inside)return {inside:true,plane:nearest,depth:Math.max(0,-closest)};
 return normal&&enter>=0&&enter<=1&&exit>=0?{time:enter,plane:normal}:null;
}

/** Slide around solid boulders while terrain continues to own vertical support.
 * A swept segment prevents fast swimming/walking from crossing a thin rock;
 * existing saves embedded in a newly added boulder are pushed to its nearest
 * clear face. This never raises, lowers or teleports the player's feet.
 * @param {{x:number,y:number,z:number}} from
 * @param {{x:number,y:number,z:number}} to
 * @param {number} [bodyHeight] @param {number} [radius]
 * @param {ReadonlyArray<object>} [rocks]
 * @returns {{x:number,y:number,z:number}}
 */
export function resolveWorldRockMovement(from,to,bodyHeight=36,radius=5,rocks=PREPARED_WORLD_ROCKS){
 if(!finitePoint(from)||!finitePoint(to)||![bodyHeight,radius].every(Number.isFinite)||bodyHeight<=0||radius<0)return {...to};
 if(![to.x-from.x,to.y-from.y,Math.max(from.z,to.z)+bodyHeight].every(Number.isFinite))return {...to};
 const cache=cacheFor(rocks),padding=radius+SKIN;
 const minX=Math.min(from.x,to.x)-padding,maxX=Math.max(from.x,to.x)+padding;
 const minY=Math.min(from.y,to.y)-padding,maxY=Math.max(from.y,to.y)+padding;
 const left=Math.floor(minX/CELL),right=Math.floor(maxX/CELL),bottom=Math.floor(minY/CELL),top=Math.floor(maxY/CELL);
 const candidates=new Set();
 if((right-left+1)*(top-bottom+1)>4096){for(const rock of cache.solids)candidates.add(rock);}
 else for(let x=left;x<=right;x++)for(let y=bottom;y<=top;y++)for(const rock of cache.cells.get(`${x}:${y}`)??[])candidates.add(rock);
 const low=Math.min(from.z,to.z),high=Math.max(from.z,to.z)+bodyHeight;
 const obstacles=[];
 for(const rock of candidates){
  if(rock.maxX<minX||rock.minX>maxX||rock.maxY<minY||rock.minY>maxY)continue;
  const planes=footprint(rock,low,high,radius);if(planes)obstacles.push(planes);
 }
 if(!obstacles.length)return {...to};
 const result={x:from.x,y:from.y,z:to.z};
 // Resolve a saved/creature-pushed overlap before sweeping the intended motion.
 for(let pass=0;pass<4;pass++){
  let moved=false;
  for(const planes of obstacles){const hit=sweep(result,0,0,planes);if(!hit?.inside)continue;
   result.x+=hit.plane.nx*(hit.depth+SKIN);result.y+=hit.plane.ny*(hit.depth+SKIN);moved=true;
  }
  if(!moved)break;
 }
 let dx=to.x-from.x,dy=to.y-from.y;
 for(let pass=0;pass<4&&Math.hypot(dx,dy)>EPS;pass++){
  let first=null;
  for(const planes of obstacles){const hit=sweep(result,dx,dy,planes);if(hit&&!hit.inside&&(!first||hit.time<first.time))first=hit;}
  if(!first){result.x+=dx;result.y+=dy;break;}
  result.x+=dx*first.time+first.plane.nx*SKIN;result.y+=dy*first.time+first.plane.ny*SKIN;
  dx*=1-first.time;dy*=1-first.time;
  const inward=dx*first.plane.nx+dy*first.plane.ny;
  if(inward<0){dx-=first.plane.nx*inward;dy-=first.plane.ny*inward;}
 }
 return result;
}
