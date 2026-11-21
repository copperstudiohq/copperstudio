import {pointInPolygon} from './terrain.js';
import {MAIN_PERIMETER,SULFUR_PERIMETER,NEW_PERIMETER_BOUNDS} from './world-perimeter-data.js';
export {MAIN_PERIMETER,SULFUR_PERIMETER,NEW_PERIMETER_BOUNDS} from './world-perimeter-data.js';

const regions={main:MAIN_PERIMETER,sulfur:SULFUR_PERIMETER},caches=new WeakMap(),EPS=1e-6;
function state(polygon){
 let value=caches.get(polygon);if(value)return value;
 const edges=polygon.map((a,i)=>{const b=polygon[(i+1)%polygon.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);return{a,b,dx,dy,length,nx:-dy/length,ny:dx/length};});
 const bounds={minX:Math.min(...polygon.map(p=>p.x)),maxX:Math.max(...polygon.map(p=>p.x)),minY:Math.min(...polygon.map(p=>p.y)),maxY:Math.max(...polygon.map(p=>p.y))};
 value={polygon,edges,bounds,insets:new Map()};caches.set(polygon,value);return value;
}
function projection(edge,x,y){
 const t=Math.max(0,Math.min(1,((x-edge.a.x)*edge.dx+(y-edge.a.y)*edge.dy)/(edge.length*edge.length)));
 return{x:edge.a.x+edge.dx*t,y:edge.a.y+edge.dy*t};
}
function clear(cache,x,y,radius){
 const b=cache.bounds;if(x<b.minX||x>b.maxX||y<b.minY||y>b.maxY)return false;
 if(!pointInPolygon(cache.polygon,x,y))return false;
 if(radius<=0)return true;
 const threshold=Math.max(0,radius-EPS)**2;
 return cache.edges.every(edge=>{const q=projection(edge,x,y);return(x-q.x)**2+(y-q.y)**2>=threshold;});
}

/** Exact authored outline with a conservative circular-body inset. */
export function isInsidePerimeter(region,x,y,radius=0){
 if(!regions[region]||![x,y,radius].every(Number.isFinite)||radius<0)return false;
 return clear(state(regions[region]),x,y,radius);
}

/** Closest safe point on a sampled irregular coast. Cached offset corners
 * handle headlands; projected edge candidates handle long rounded bays. */
export function closestPerimeterPoint(region,x,y,radius=0){
 const polygon=regions[region];if(!polygon||![x,y,radius].every(Number.isFinite)||radius<0)throw new TypeError('Perimeter projection needs a known region, finite point and non-negative radius.');
 const cache=state(polygon);if(clear(cache,x,y,radius))return{x,y};
 let corners=cache.insets.get(radius);
 if(!corners){
  corners=[];
  for(let i=0;i<polygon.length;i++){
   const p=polygon[i],a=cache.edges[(i+polygon.length-1)%polygon.length],b=cache.edges[i],denom=1+a.nx*b.nx+a.ny*b.ny;
   if(denom<.01)continue;
   const q={x:p.x+(a.nx+b.nx)*(radius+EPS)/denom,y:p.y+(a.ny+b.ny)*(radius+EPS)/denom};
   if(clear(cache,q.x,q.y,radius))corners.push(q);
  }
  cache.insets.set(radius,corners);
 }
 let best=null,distance=Infinity;
 const consider=q=>{const d=(q.x-x)**2+(q.y-y)**2;if(best===null||d<distance){best=q;distance=d;}};
 for(const point of corners)consider(point);
 const nearest=cache.edges.map(edge=>{const q=projection(edge,x,y);return{edge,q,d:(q.x-x)**2+(q.y-y)**2};}).sort((a,b)=>a.d-b.d).slice(0,8);
 for(const{edge,q}of nearest){const candidate={x:q.x+edge.nx*(radius+EPS),y:q.y+edge.ny*(radius+EPS)};if(clear(cache,candidate.x,candidate.y,radius))consider(candidate);}
 if(!best)throw new RangeError('The requested body is too large for this perimeter.');
 return{...best};
}

/** Region lookup is shared by terrain collars and map/placement validation. */
export function perimeterRegionAt(x,y){return isInsidePerimeter('main',x,y)?'main':isInsidePerimeter('sulfur',x,y)?'sulfur':null;}
