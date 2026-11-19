import * as THREE from './vendor/three.module.js';
import {SULFURIC_ARCH as ARCH,SULFURIC_PASSAGE as PASSAGE,getSulfuricPassageFloor} from './sulfuric-biome.js';

/** Cut a convex arch prism from real stone triangles. Interpolated colors keep
 * original cliffs intact; no transparent decal or concealed wall spans the hole. */
export function carveSulfuricPassage(source){
  const position=source.attributes.position,color=source.attributes.color,planes=[];
  for(let i=0;i<ARCH.length;i++){
    const a=ARCH[i],b=ARCH[(i+1)%ARCH.length],nx=b[1]-a[1],ny=a[0]-b[0];
    planes.push([nx,ny,0,-nx*(PASSAGE.x+a[0])/25-ny*a[1]/25]);
  }
  planes.push([0,0,1,-(PASSAGE.innerY+2)/25],[0,0,-1,(PASSAGE.outerY-2)/25]);
  const positions=[],colors=[];let cut=0;
  const push=polygon=>{for(let i=1;i<polygon.length-1;i++)for(const p of [polygon[0],polygon[i],polygon[i+1]]){positions.push(...p.slice(0,3));colors.push(...p.slice(3));}};
  const split=(polygon,plane)=>{
    const inside=[],outside=[],distance=p=>plane[0]*p[0]+plane[1]*p[1]+plane[2]*p[2]+plane[3];
    for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length],da=distance(a),db=distance(b),ain=da<=1e-8,bin=db<=1e-8;
      (ain?inside:outside).push(a);
      if(ain!==bin){const t=da/(da-db),point=a.map((v,c)=>v+(b[c]-v)*t);inside.push(point);outside.push(point);}
    }
    return {inside,outside};
  };
  for(let i=0;i<position.count;i+=3){
    const triangle=[0,1,2].map(j=>[position.getX(i+j),position.getY(i+j),position.getZ(i+j),color.getX(i+j),color.getY(i+j),color.getZ(i+j)]);
    const xs=triangle.map(p=>p[0]),ys=triangle.map(p=>p[1]),zs=triangle.map(p=>p[2]);
    if(Math.max(...xs)<(PASSAGE.x-150)/25||Math.min(...xs)>(PASSAGE.x+150)/25||Math.max(...ys)<PASSAGE.floor/25||Math.min(...ys)>PASSAGE.ceiling/25
      ||Math.max(...zs)<(PASSAGE.outerY-2)/25||Math.min(...zs)>(PASSAGE.innerY+2)/25){push(triangle);continue;}
    let pending=triangle;
    for(const plane of planes){if(pending.length<3)break;const parts=split(pending,plane);if(parts.outside.length>=3)push(parts.outside);pending=parts.inside;}
    if(pending.length>=3)cut++;
  }
  if(!cut)return source;
  const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  result.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));result.computeVertexNormals();result.computeBoundingSphere();
  result.userData.sulfuricOpening=true;source.dispose();return result;
}

/** One static draw joins the actual cut to fractured, embedded mineral lips.
 * Relief always expands away from ARCH; the shared player opening stays clear. */
export function createSulfuricTunnelGeometry(){
  const positions=[],uvs=[],colors=[],tint=new THREE.Color();let perimeter=0;
  const add=(p,color)=>{
    positions.push((p[0]+PASSAGE.x)/25,p[1]/25,p[2]/25);
    uvs.push((p[0]+p[2]*.37)/75,p[1]/75);tint.setHex(color);colors.push(tint.r,tint.g,tint.b);
  };
  const quad=(a,b,c,d,color)=>{for(const p of[a,b,c,b,d,c])add(p,color);};
  const center=(PASSAGE.floor+PASSAGE.ceiling)/2;
  const expand=(x,z,amount,y)=>[x*(1+amount/150),center+(z-center)*(1+amount/150),y];
  for(let i=0;i<ARCH.length;i++){
    const a=ARCH[i],b=ARCH[(i+1)%ARCH.length],front=PASSAGE.innerY,back=PASSAGE.outerY;
    const next=perimeter+Math.hypot(b[0]-a[0],b[1]-a[1]);
    const point=(u,v)=>{
      const x=a[0]+(b[0]-a[0])*u,z=a[1]+(b[1]-a[1])*u,y=front+(back-front)*v;
      // Adjacent faces share exact edge vertices: recesses cannot open cracks.
      const relief=i===0?0:Math.sin(u*Math.PI)*Math.sin(v*Math.PI)**2*(2+5*(.5+.5*Math.sin((perimeter+(next-perimeter)*u)*.11+y*.08)));
      const point=expand(x,z,relief,y),rise=getSulfuricPassageFloor(PASSAGE.x+x,y)-PASSAGE.floor;
      point[1]+=rise*Math.max(0,(50-z)/(50-PASSAGE.floor));return point;
    };
    for(let u=0;u<6;u++)for(let v=0;v<10;v++){
      quad(point(u/6,v/10),point((u+1)/6,v/10),point(u/6,(v+1)/10),point((u+1)/6,(v+1)/10),
        i===0?0xa78b5b:0xab8557);
    }
    perimeter=next;
  }
  const linerCount=positions.length/3;
  for(const [mouth,direction]of [[PASSAGE.innerY,1],[PASSAGE.outerY,-1]]){
    // Alternating raised laminae make chipped rock, rather than a smooth torus.
    const widths=[0,7,18,36,61,86,110],depths=[0,3,5,2,-3,-9,-17];
    // Frame only the sides and roof. No horizontal lip projects into the ocean.
    for(let edge=1;edge<ARCH.length;edge++){
      const a=ARCH[edge],b=ARCH[(edge+1)%ARCH.length],point=(step,ring)=>{
        const u=step/6,x=a[0]+(b[0]-a[0])*u,z=a[1]+(b[1]-a[1])*u;
        const phase=edge+u,chip=ring===0?0:1+.18*Math.sin(phase*2.1)+.07*Math.cos(phase*9.7);
        const p=expand(x,z,widths[ring]*chip,mouth+direction*(depths[ring]+(ring===0?0:2*Math.sin(phase*5.1+ring))));
        p[1]+=(getSulfuricPassageFloor(PASSAGE.x+x,mouth)-PASSAGE.floor)*Math.max(0,(50-z)/(50-PASSAGE.floor));return p;
      };
      for(let step=0;step<6;step++)for(let ring=0;ring<widths.length-1;ring++){
        // Fade the mineral tint into the cliff's own rock map, rather than
        // painting a contrasting concentric border around the opening.
        const tone=new THREE.Color(0xe2d4be).lerp(new THREE.Color(0xffffff),ring/(widths.length-2));
        quad(point(step,ring),point(step+1,ring),point(step,ring+1),point(step+1,ring+1),tone.getHex());
      }
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.computeVertexNormals();
  // Smooth the recessed liner while retaining crisp fracture faces on the lips.
  const normal=g.attributes.normal,position=g.attributes.position,averages=new Map(),key=i=>`${position.getX(i)},${position.getY(i)},${position.getZ(i)}`;
  for(let i=0;i<linerCount;i++){
    const k=key(i),sum=averages.get(k)??new THREE.Vector3();sum.x+=normal.getX(i);sum.y+=normal.getY(i);sum.z+=normal.getZ(i);averages.set(k,sum);
  }
  for(const sum of averages.values())sum.normalize();
  for(let i=0;i<linerCount;i++){const sum=averages.get(key(i));normal.setXYZ(i,sum.x,sum.y,sum.z);}
  g.userData.linerVertexCount=linerCount;g.computeBoundingSphere();return g;
}
