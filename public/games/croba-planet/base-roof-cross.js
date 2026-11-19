import * as THREE from './vendor/three.module.js';

const HALF_WIDTH=.09,OFFSET=.006,EPSILON=1e-9;

/** Clip one convex polygon against an X/Z half-plane. Coordinates and
 * normals interpolate together, retaining the actual source roof surface. */
function clip(polygon,nx,nz,limit){
 const result=[];
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],da=a.x*nx+a.z*nz-limit,db=b.x*nx+b.z*nz-limit;
  const insideA=da<=EPSILON,insideB=db<=EPSILON;
  if(insideA)result.push(a);
  if(insideA!==insideB){
   const t=Math.max(0,Math.min(1,da/(da-db))),point={};
   for(const key of['x','y','z','nx','ny','nz'])point[key]=a[key]+(b[key]-a[key])*t;
   result.push(point);
  }
 }
 return result;
}

function stripPlanes(ax,az,bx,bz){
 const length=Math.hypot(bx-ax,bz-az),tx=(bx-ax)/length,tz=(bz-az)/length,nx=-tz,nz=tx;
 return{nx,nz,planes:[[nx,nz,HALF_WIDTH],[-nx,-nz,HALF_WIDTH],[-tx,-tz,-ax*tx-az*tz],[tx,tz,bx*tx+bz*tz]]};
}

/** Bake a flat painted X onto the existing curved roof. The caller owns only
 * the returned geometry; the supplied roof and its resources remain borrowed.
 * Both diagonal strips share a non-overlapping central joint, so no extra
 * render pass, transparent layer, material or depth-order workaround is used. */
export function createRoofCross(roofGeometry){
 const source=roofGeometry?.attributes?.position,normal=roofGeometry?.attributes?.normal,index=roofGeometry?.index;
 const count=index?.count??source?.count??0;
 if(!source||source.itemSize!==3||!normal||normal.itemSize!==3||normal.count!==source.count||count%3)throw new TypeError('Roof cross requires a triangle roof with positions and matching normals.');
 const first=stripPlanes(-5.75,-7.75,5.75,7.75),second=stripPlanes(-5.75,7.75,5.75,-7.75);
 // First strip covers the centre. The two remaining pieces of the second
 // strip stop exactly at its sides instead of painting over that joint.
 const regions=[first.planes,[...second.planes,[-first.nx,-first.nz,-HALF_WIDTH]],
  [...second.planes,[first.nx,first.nz,-HALF_WIDTH]]];
 const positions=[],normals=[],uvs=[];
 const vertex=i=>({x:source.getX(i),y:source.getY(i),z:source.getZ(i),nx:normal.getX(i),ny:normal.getY(i),nz:normal.getZ(i)});
 for(let i=0;i<count;i+=3){
  const triangle=[0,1,2].map(j=>vertex(index?.getX(i+j)??i+j)),[a,b,c]=triangle;
  const upward=(b.z-a.z)*(c.x-a.x)-(b.x-a.x)*(c.z-a.z);
  if(upward<=EPSILON)continue; // Keep the closed roof's underside unpainted.
  for(const region of regions){
   let polygon=triangle;
   for(const[nx,nz,limit]of region){polygon=clip(polygon,nx,nz,limit);if(polygon.length<3)break;}
   for(let corner=1;corner<polygon.length-1;corner++){
    const points=[polygon[0],polygon[corner],polygon[corner+1]],[p,q,r]=points;
    const area=(q.z-p.z)*(r.x-p.x)-(q.x-p.x)*(r.z-p.z);
    if(area<=EPSILON)continue;
    for(const point of points){
     const length=Math.hypot(point.nx,point.ny,point.nz);
     if(![point.x,point.y,point.z,length].every(Number.isFinite)||length<EPSILON)throw new TypeError('Roof cross encountered an invalid roof vertex.');
     positions.push(point.x,point.y+OFFSET,point.z);normals.push(point.nx/length,point.ny/length,point.nz/length);uvs.push(point.x,point.z);
    }
   }
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.name='curved-roof-corner-cross-paint';
 geometry.userData={painted:true,roofConforming:true,cornerArms:4,stripWidthMeters:HALF_WIDTH*2,surfaceOffsetMeters:OFFSET,nonOverlappingJoint:true,triangleCount:positions.length/9};return geometry;
}
