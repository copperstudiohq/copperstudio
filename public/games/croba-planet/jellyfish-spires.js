import { JELLYFISH_SPIRES, JELLYFISH_SPIRES_GRID as GRID, JELLYFISH_SPIRES_HEIGHTS as HEIGHTS,
  JELLYFISH_SPIRES_SPIRES as SPIRES } from './jellyfish-spires-data.js';
export { JELLYFISH_SPIRES, JELLYFISH_SPIRES_GRID, JELLYFISH_SPIRES_HEIGHTS,
  JELLYFISH_SPIRES_SPIRES } from './jellyfish-spires-data.js';

const byId = new Map(SPIRES.map(spire => [spire.id, spire]));
const nearest = new Float64Array(3);

/** Fixed authored biome footprint; the outer apron remains ordinary ocean. */
export function isJellyfishSpires(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < JELLYFISH_SPIRES.minX || x > JELLYFISH_SPIRES.maxX
    || y < JELLYFISH_SPIRES.minY || y > JELLYFISH_SPIRES.maxY) return false;
  const polygon = JELLYFISH_SPIRES.boundary;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    const cross = (x-a.x)*(b.y-a.y)-(y-a.y)*(b.x-a.x);
    if (Math.abs(cross) < 1e-6 && x >= Math.min(a.x,b.x) && x <= Math.max(a.x,b.x)
      && y >= Math.min(a.y,b.y) && y <= Math.max(a.y,b.y)) return true;
    if ((a.y > y) !== (b.y > y) && x < (b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) inside = !inside;
  }
  return inside;
}

/** Exact same triangle diagonal as the extension's rendered seabed grid. */
export function getJellyfishSpiresFloor(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError('Spires floor coordinates must be finite.');
  if (x < GRID.minX || x > GRID.maxX || y < GRID.minY || y > GRID.maxY) return null;
  const gx=(x-GRID.minX)/GRID.step,gy=(y-GRID.minY)/GRID.step;
  const c=Math.min(GRID.columns-2,Math.floor(gx)),r=Math.min(GRID.rows-2,Math.floor(gy));
  const u=gx-c,v=gy-r,i=r*GRID.columns+c,a=HEIGHTS[i],b=HEIGHTS[i+1],cc=HEIGHTS[i+GRID.columns],d=HEIGHTS[i+GRID.columns+1];
  return (u+v<=1?a+(b-a)*u+(cc-a)*v:d+(cc-d)*(1-u)+(b-d)*(1-v))*25;
}

/** Barycentric surface anchor on a real baked triangle, in simulation axes. */
export function sampleJellyfishSpireSurface(id, triangleIndex, u, v) {
  const spire=byId.get(id);
  if (!spire || !Number.isInteger(triangleIndex) || triangleIndex < 0 || triangleIndex >= spire.indices.length/3)
    throw new RangeError('A spire surface needs an authored spire and triangle.');
  if (![u,v].every(Number.isFinite) || u < 0 || v < 0 || u+v > 1+1e-9)
    throw new RangeError('Spire barycentric weights must lie inside the triangle.');
  const f=triangleIndex*3,a=spire.indices[f]*3,b=spire.indices[f+1]*3,c=spire.indices[f+2]*3,p=spire.vertices,w=1-u-v;
  return {x:p[a]*w+p[b]*u+p[c]*v,y:p[a+1]*w+p[b+1]*u+p[c+1]*v,z:p[a+2]*w+p[b+2]*u+p[c+2]*v,
    normal:{x:spire.normals[f],y:spire.normals[f+1],z:spire.normals[f+2]}};
}

function closestTriangle(p, vertices, a, b, c, out) {
  const ax=vertices[a],ay=vertices[a+1],az=vertices[a+2],bx=vertices[b],by=vertices[b+1],bz=vertices[b+2],cx=vertices[c],cy=vertices[c+1],cz=vertices[c+2];
  const abx=bx-ax,aby=by-ay,abz=bz-az,acx=cx-ax,acy=cy-ay,acz=cz-az;
  const apx=p.x-ax,apy=p.y-ay,apz=p.z-az,d1=abx*apx+aby*apy+abz*apz,d2=acx*apx+acy*apy+acz*apz;
  let u=0,v=0;
  if (!(d1<=0&&d2<=0)) {
    const bpx=p.x-bx,bpy=p.y-by,bpz=p.z-bz,d3=abx*bpx+aby*bpy+abz*bpz,d4=acx*bpx+acy*bpy+acz*bpz;
    if(d3>=0&&d4<=d3)u=1;
    else {
      const vc=d1*d4-d3*d2;
      if(vc<=0&&d1>=0&&d3<=0)u=d1/(d1-d3);
      else {
        const cpx=p.x-cx,cpy=p.y-cy,cpz=p.z-cz,d5=abx*cpx+aby*cpy+abz*cpz,d6=acx*cpx+acy*cpy+acz*cpz;
        if(d6>=0&&d5<=d6)v=1;
        else {
          const vb=d5*d2-d1*d6;
          if(vb<=0&&d2>=0&&d6<=0)v=d2/(d2-d6);
          else {
            const va=d3*d6-d5*d4;
            if(va<=0&&d4-d3>=0&&d5-d6>=0){v=(d4-d3)/((d4-d3)+(d5-d6));u=1-v;}
            else {const denominator=1/(va+vb+vc);u=vb*denominator;v=vc*denominator;}
          }
        }
      }
    }
  }
  out[0]=ax+abx*u+acx*v;out[1]=ay+aby*u+acy*v;out[2]=az+abz*u+acz*v;
}

/** Sphere against the actual convex spire faces, including edges and buried
 * centers. AABB gates avoid triangle work for normal open-water queries.
 * @returns {{id:string,kind:string,normal:{x:number,y:number,z:number},penetration:number,point:{x:number,y:number,z:number}}|null}
 */
export function getJellyfishSpiresCollision(point, radius = 0) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)
    || !Number.isFinite(radius) || radius < 0) return null;
  let result=null;
  for(const spire of SPIRES){
    const bounds=spire.bounds;
    if(point.x+radius<bounds.minX||point.x-radius>bounds.maxX||point.y+radius<bounds.minY||point.y-radius>bounds.maxY
      ||point.z+radius<bounds.minZ||point.z-radius>bounds.maxZ)continue;
    const p=spire.vertices,n=spire.normals,indices=spire.indices;
    let maximum=-Infinity,face=0,exposedMaximum=-Infinity,exposedFace=0;
    for(let f=0;f<indices.length;f+=3){const a=indices[f]*3;
      const distance=n[f]*(point.x-p[a])+n[f+1]*(point.y-p[a+1])+n[f+2]*(point.z-p[a+2]);
      if(distance>maximum){maximum=distance;face=f;}
      if(n[f+2]>-.95&&distance>exposedMaximum){exposedMaximum=distance;exposedFace=f;}
    }
    if(maximum>radius)continue;
    // The bottom cap is buried in the floor. An embedded swimmer must escape
    // through an exposed rock face rather than be pushed below the seabed.
    if(maximum<=0&&n[face+2]<-.95){maximum=exposedMaximum;face=exposedFace;}
    let nx=n[face],ny=n[face+1],nz=n[face+2],penetration,px,py,pz;
    if(maximum<=0){penetration=radius-maximum;px=point.x-nx*maximum;py=point.y-ny*maximum;pz=point.z-nz*maximum;}
    else {
      let best=Infinity;
      for(let f=0;f<indices.length;f+=3){
        closestTriangle(point,p,indices[f]*3,indices[f+1]*3,indices[f+2]*3,nearest);
        const distance=(point.x-nearest[0])**2+(point.y-nearest[1])**2+(point.z-nearest[2])**2;
        if(distance<best){best=distance;px=nearest[0];py=nearest[1];pz=nearest[2];}
      }
      const gap=Math.sqrt(best);if(gap>=radius)continue;
      penetration=radius-gap;if(gap>1e-9){nx=(point.x-px)/gap;ny=(point.y-py)/gap;nz=(point.z-pz)/gap;}
    }
    if(penetration>0&&(!result||penetration>result.penetration))result={id:spire.id,kind:'jellyfish-spire',normal:{x:nx,y:ny,z:nz},penetration,point:{x:px,y:py,z:pz}};
  }
  return result;
}
