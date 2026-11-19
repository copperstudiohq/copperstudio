import * as THREE from './vendor/three.module.js';
import {highestIceAt,getIceSurfaceHeight} from './ice-surface.js';
import {EYE_HEIGHT} from './terrain.js';
import {PREPARED_HOGWONGS} from './hogwong-data.js';

/** Authored pressure ridges leave staggered routes, not a sealed maze. Units
 * match the prepared map. Each ridge is rooted to the actual snow surface. */
export const ICY_BASIN_RIDGES=Object.freeze([
 {points:[[-5100,-6400],[-4550,-6600],[-3900,-6460]],width:52,height:155},
 {points:[[-3300,-6500],[-2600,-6740],[-1800,-6600]],width:60,height:185},
 {points:[[-4300,-7150],[-3900,-7480],[-3150,-7340],[-2700,-7490]],width:54,height:165},
 {points:[[-2100,-7200],[-1300,-7450],[-500,-7200]],width:65,height:190},
 {points:[[-5200,-7950],[-4500,-8140],[-3900,-7950]],width:62,height:180},
 {points:[[-3300,-8050],[-2650,-8300],[-1900,-8120]],width:58,height:170},
 {points:[[-1200,-8050],[-500,-8300],[100,-8130]],width:58,height:165},
 {points:[[-4600,-8800],[-3900,-9050],[-3200,-8820]],width:64,height:190},
 {points:[[-2500,-8900],[-1800,-9150],[-1050,-8900]],width:60,height:180},
 {points:[[-3550,-9750],[-2850,-9950],[-2150,-9710]],width:65,height:200},
 {points:[[-1450,-9820],[-900,-9650],[-400,-9810]],width:55,height:155},
].map(r=>Object.freeze({...r,points:Object.freeze(r.points.map(Object.freeze))})));
const cache=new WeakMap();
export const isIcyBasin=ice=>ice?.biome==='iceberg-tundra';
/** Shared sampled ridges keep visible geometry and solid collision aligned. */
export function getBasinWallSegments(platforms){
 if(cache.has(platforms))return cache.get(platforms);
 const segments=[];
 for(const [ridgeIndex,ridge]of ICY_BASIN_RIDGES.entries())for(let i=1;i<ridge.points.length;i++){
  const a=ridge.points[i-1],b=ridge.points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/95);
  const sample=t=>{
   const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,ice=highestIceAt(platforms,x,y);
   return isIcyBasin(ice)?{x,y,z:getIceSurfaceHeight(ice,x,y)}:null;
  };
  for(let step=0;step<steps;step++){
   const from=sample(step/steps),to=sample((step+1)/steps);if(!from||!to)continue;
   const height=ridge.height*(.65+.35*Math.sin(ridgeIndex*1.7+(i-1+step/steps)*4.1)**2);
   const segment={from,to,width:ridge.width,height,ridgeIndex};
   // Keep authored grazer homes and their small roaming clearings open.
   if(PREPARED_HOGWONGS.some(h=>{const p=projection(segment,h.homeX,h.homeY);return Math.hypot(h.homeX-p.x,h.homeY-p.y)<ridge.width+220;}))continue;
   segments.push(segment);
  }
 }
 cache.set(platforms,segments);return segments;
}
function projection(segment,x,y){
 const {from:a,to:b}=segment,dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
 return {x:a.x+dx*t,y:a.y+dy*t,z:a.z+(b.z-a.z)*t,dx,dy};
}
export function nearBasinWall(platforms,x,y,padding=0){
 return getBasinWallSegments(platforms).some(s=>{const p=projection(s,x,y);return Math.hypot(x-p.x,y-p.y)<s.width+padding;});
}
/** Slide walkers around the same pressure ridges rendered in the basin. */
export function resolveBasinWalls(world){
 const p=world.player;if(p.y> -6100||p.x>500||p.x< -5600)return;
 for(let pass=0;pass<3;pass++)for(const segment of getBasinWallSegments(world.platforms)){
  const q=projection(segment,p.x,p.y),top=q.z+segment.height;
  if(p.z>=top||p.z+EYE_HEIGHT<=q.z-10)continue;
  let dx=p.x-q.x,dy=p.y-q.y,distance=Math.hypot(dx,dy);const reach=segment.width+6;
  if(distance>=reach)continue;
  if(distance<1e-8){const length=Math.hypot(q.dx,q.dy);dx=-q.dy/length;dy=q.dx/length;distance=1;}
  p.x=q.x+dx/distance*(reach+.01);p.y=q.y+dy/distance*(reach+.01);
 }
}

/** One merged, unanimated glacier-ridge draw; snow caps and fractured flanks. */
export function createBasinWallGeometry(platforms){
 const positions=[],colors=[],ice=new THREE.Color(0xb9d9e3),snow=new THREE.Color(0xf5f8fa);
 const tri=(a,b,c,color)=>{for(const p of [a,b,c]){positions.push(p[0]/25,p[2]/25,p[1]/25);colors.push(color.r,color.g,color.b);}};
 for(const s of getBasinWallSegments(platforms)){
  const dx=s.to.x-s.from.x,dy=s.to.y-s.from.y,length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
  const corners=(p,top)=>{
   const width=s.width*(top ? .40+.20*Math.sin(p.x*.017+p.y*.013)**2 : 1);
   return [-1,1].map(side=>[p.x+nx*width*side,p.y+ny*width*side,p.z+(top?s.height:-4)]);
  };
  const a=corners(s.from,false),b=corners(s.to,false),c=corners(s.from,true),d=corners(s.to,true);
  for(const side of [0,1]){tri(a[side],b[side],c[side],ice);tri(b[side],d[side],c[side],ice);}
  tri(c[0],d[0],c[1],snow);tri(c[1],d[0],d[1],snow);
  tri(a[0],c[0],a[1],ice);tri(a[1],c[0],c[1],ice);tri(b[0],b[1],d[0],ice);tri(b[1],d[1],d[0],ice);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
