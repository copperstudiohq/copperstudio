import {getPlatformVertices,pointInPolygon} from './terrain.js';

const cache=new WeakMap();

/** Optional literal terrain vertices use island-relative x/y and map-unit
 * elevation. Offline authoring can retain a broad walking corridor without
 * introducing a second surface for rendering, animals or collision. */
function authoredSurface(floe, mesh) {
  if (!Array.isArray(mesh.points) || mesh.points.length < 3
    || !mesh.points.every(point => Array.isArray(point) && point.length === 3 && point.every(Number.isFinite))
    || !Array.isArray(mesh.indices) || !mesh.indices.length || mesh.indices.length % 3
    || !mesh.indices.every(index => Number.isInteger(index) && index >= 0 && index < mesh.points.length))
    throw new TypeError(`Ice surface ${floe.id} needs finite authored terrain vertices and valid triangle indices.`);
  return { positions: mesh.points.flatMap(([x,y,z]) => [floe.x+x*floe.rx,floe.y+y*floe.ry,(floe.z??0)+z]),
    indices: [...mesh.indices] };
}

/** Literal ring elevations are authored in prepared-world.js. The exact same
 * triangles provide the visible snow surface and walking/jump collision. */
export function getIceSurface(floe) {
  const cached=cache.get(floe);
  if(cached&&cached.x===floe.x&&cached.y===floe.y&&cached.rx===floe.rx&&cached.ry===floe.ry&&cached.outline===floe.outline&&cached.z===floe.z&&cached.relief===floe.relief)return cached.surface;
  const outline=getPlatformVertices(floe),n=outline.length,base=floe.z??0;
  const relief=floe.relief;
  if(relief&&(!Array.isArray(relief.inner)||!Array.isArray(relief.middle)
    ||relief.inner.length!==n||relief.middle.length!==n
    ||![relief.center,...relief.inner,...relief.middle].every(Number.isFinite)))
    throw new TypeError(`Ice surface ${floe.id} needs a finite center and one height per ring vertex.`);
  if (relief?.mesh) {
    const surface=authoredSurface(floe,relief.mesh);
    cache.set(floe,{x:floe.x,y:floe.y,rx:floe.rx,ry:floe.ry,outline:floe.outline,z:floe.z,relief,surface});return surface;
  }
  const positions=[floe.x,floe.y,base+(relief?.center??0)],indices=[];
  for(const [ring,fraction]of [.33,.67,1].entries())for(let i=0;i<n;i++){
    const p=outline[i],height=ring===0?relief?.inner[i]??0:ring===1?relief?.middle[i]??0:0;
    positions.push(floe.x+(p.x-floe.x)*fraction,floe.y+(p.y-floe.y)*fraction,base+height);
  }
  for(let i=0;i<n;i++)indices.push(0,1+i,1+(i+1)%n);
  for(let ring=0;ring<2;ring++)for(let i=0;i<n;i++){
    const a=1+ring*n+i,b=1+ring*n+(i+1)%n,c=a+n,d=b+n;
    indices.push(a,c,b,b,c,d);
  }
  const area=outline.reduce((sum,a,i)=>{const b=outline[(i+1)%n];return sum+a.x*b.y-b.x*a.y;},0);
  if(area>0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  const surface={positions,indices};cache.set(floe,{x:floe.x,y:floe.y,rx:floe.rx,ry:floe.ry,outline:floe.outline,z:floe.z,relief,surface});return surface;
}

export function getIceSurfaceHeight(floe,x,y) {
  if(!floe.relief||Math.abs(x-floe.x)>floe.rx+1e-7||Math.abs(y-floe.y)>floe.ry+1e-7)return floe.z??0;
  const {positions:p,indices}=getIceSurface(floe);
  for(let i=0;i<indices.length;i+=3){
    const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
    const denominator=(p[b+1]-p[c+1])*(p[a]-p[c])+(p[c]-p[b])*(p[a+1]-p[c+1]);
    if(Math.abs(denominator)<1e-10)continue;
    const u=((p[b+1]-p[c+1])*(x-p[c])+(p[c]-p[b])*(y-p[c+1]))/denominator;
    const v=((p[c+1]-p[a+1])*(x-p[c])+(p[a]-p[c])*(y-p[c+1]))/denominator;
    if(u>=-1e-8&&v>=-1e-8&&u+v<=1+1e-8)return p[a+2]*u+p[b+2]*v+p[c+2]*(1-u-v);
  }
  return floe.z??0;
}

export function highestIceAt(platforms,x,y) {
  let found,height=-Infinity;
  for(const floe of platforms)if(Math.abs(x-floe.x)<=floe.rx&&Math.abs(y-floe.y)<=floe.ry
    &&pointInPolygon(getPlatformVertices(floe),x,y)){
    const candidate=getIceSurfaceHeight(floe,x,y);if(candidate>height){found=floe;height=candidate;}
  }
  return found;
}
