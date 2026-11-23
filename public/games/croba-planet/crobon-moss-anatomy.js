import * as THREE from './vendor/three.module.js';
import { PlantMesh } from './plant-mesh.js';

const TAU=Math.PI*2,SECTORS=20,RINGS=6,FRONDS=200;
const V=(x,y,z)=>new THREE.Vector3(x,y,z),UP=V(0,1,0);
const hash=index=>{
  let value=Math.imul(index+1,374761393);value=Math.imul(value^(value>>>13),1274126177);
  return((value^(value>>>16))>>>0)/4294967296;
};
const edgeRadius=angle=>.245*(1+.17*Math.sin(angle*3)+.11*Math.cos(angle*5)+.055*Math.sin(angle*9));
const LOBES=[[-.075,-.035,.17,.145,.119],[.10,.045,.15,.125,.108],
  [-.12,.085,.13,.12,.087],[.035,-.135,.12,.105,.094]];

function cushionHeight(x,z){
  let cap=0;
  for(const [cx,cz,rx,rz,height]of LOBES)
    cap=Math.max(cap,height*Math.exp(-1.7*(((x-cx)/rx)**2+((z-cz)/rz)**2)));
  return .018+cap+.004*Math.sin(x*31+z*17)*Math.cos(z*29-x*11);
}

/** One volumetric moss cushion and overlapping crossed fronds. The fine leafy
 * fibers are clipped analytically by moss-fuzz.js in this same opaque draw.
 * Deterministic prototype anatomy never changes prepared world placements.
 */
export function createCrobonMossGeometry(){
  const mesh=new PlantMesh(),parts=[],fiberUV=[],seeds=[],topFaces=[];
  const addVertex=(position,color,glow,{part=0,uv=[0,0],seed=0}={})=>{
    const index=mesh.positions.length/3,tint=new THREE.Color(color);
    mesh.positions.push(position.x,position.y,position.z);mesh.colors.push(tint.r,tint.g,tint.b);
    mesh.uvs.push(...uv);mesh.glow.push(glow);parts.push(part);fiberUV.push(...uv);seeds.push(seed);
    return index;
  };
  const at=index=>new THREE.Vector3().fromArray(mesh.positions,index*3);
  const addFace=(a,b,c,top=false)=>{
    mesh.indices.push(a,b,c);
    if(top){
      const pa=at(a),pb=at(b),pc=at(c),normal=new THREE.Vector3().crossVectors(pb.clone().sub(pa),pc.clone().sub(pa));
      const area=normal.length()*.5;
      if(area<1e-10)throw new Error('Crobon moss has a degenerate core surface.');
      topFaces.push({a:pa,b:pb,c:pc,normal:normal.normalize(),area,end:0});
    }
  };

  // Rounded connected lobes form a thick cushion, including at the perimeter.
  // Fine fronds cover the smooth core and extend its silhouette into soft fuzz.
  const center=addVertex(V(0,cushionHeight(0,0),0),0x2f1d3c,.045),rings=[];
  for(let ring=1;ring<=RINGS;ring++){
    const row=[],fraction=ring/RINGS;
    for(let side=0;side<SECTORS;side++){
      const angle=side/SECTORS*TAU,radius=edgeRadius(angle)*fraction;
      const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius*.82;
      const color=ring===RINGS?0x2a1937:0x392247;
      row.push(addVertex(V(x,cushionHeight(x,z),z),color,.045,{uv:[x,z]}));
    }
    rings.push(row);
  }
  for(let side=0;side<SECTORS;side++){
    const next=(side+1)%SECTORS;addFace(center,rings[0][next],rings[0][side],true);
    for(let ring=0;ring<RINGS-1;ring++){
      const a=rings[ring][side],b=rings[ring][next],c=rings[ring+1][side],d=rings[ring+1][next];
      addFace(a,b,c,true);addFace(b,d,c,true);
    }
  }
  const lower=rings[RINGS-1].map(index=>{const point=at(index);point.y=-.016;return addVertex(point,0x1d1425,0);});
  const bottom=addVertex(V(0,-.016,0),0x1d1425,0);
  for(let side=0;side<SECTORS;side++){
    const next=(side+1)%SECTORS;
    addFace(rings[RINGS-1][side],lower[next],lower[side]);
    addFace(rings[RINGS-1][side],rings[RINGS-1][next],lower[next]);
    addFace(bottom,lower[side],lower[next]);
  }
  const coreTriangles=mesh.indices.length/3;
  let totalArea=0;for(const face of topFaces){totalArea+=face.area;face.end=totalArea;}
  const rootFace=amount=>{
    let lo=0,hi=topFaces.length-1;
    while(lo<hi){const middle=(lo+hi)>>1;if(topFaces[middle].end<amount)lo=middle+1;else hi=middle;}
    return topFaces[lo];
  };

  for(let i=0;i<FRONDS;i++){
    // Area-weighted roots sit exactly on the rendered core triangles. Hash
    // jitter produces local clusters without a planting grid or spiral rows.
    const face=rootFace(hash(i+37)*totalArea),u=Math.sqrt(hash(i+233)),v=hash(i+571);
    const root=face.a.clone().multiplyScalar(1-u).addScaledVector(face.b,u*(1-v)).addScaledVector(face.c,u*v);
    const axis=face.normal.clone().multiplyScalar(.38).addScaledVector(UP,.62).normalize();
    const angle=hash(i+821)*TAU,side=V(Math.cos(angle),0,Math.sin(angle));
    side.addScaledVector(axis,-side.dot(axis)).normalize();
    const cross=new THREE.Vector3().crossVectors(axis,side).normalize();
    const height=.035+hash(i+1103)*.031,width=.030+hash(i+1373)*.018;
    const seed=hash(i+1709),bend=side.clone().multiplyScalar((hash(i+1987)-.5)*.014)
      .addScaledVector(cross,(hash(i+2281)-.5)*.012);
    const tip=root.clone().addScaledVector(axis,height).add(bend);
    const color=new THREE.Color(0x57346c).lerp(new THREE.Color(0x6e4b83),hash(i+2543)*.55).getHex();
    for(const across of[side,cross]){
      const first=mesh.positions.length/3;
      const vertex=(point,glow,uv,tint)=>addVertex(point,tint,glow,{part:1,uv,seed});
      vertex(root.clone().addScaledVector(across,-width*.5),.14,[0,0],0x3a244b);
      vertex(root.clone().addScaledVector(across,width*.5),.14,[1,0],0x3a244b);
      vertex(tip.clone().addScaledVector(across,-width*.27),.56,[0,1],color);
      vertex(tip.clone().addScaledVector(across,width*.27),.56,[1,1],color);
      addFace(first,first+1,first+2);addFace(first+1,first+3,first+2);
    }
  }

  const geometry=mesh.geometry({normalizeHeight:false});
  geometry.setAttribute('mossPart',new THREE.Float32BufferAttribute(parts,1));
  geometry.setAttribute('mossFiberUV',new THREE.Float32BufferAttribute(fiberUV,2));
  geometry.setAttribute('mossFiberSeed',new THREE.Float32BufferAttribute(seeds,1));
  geometry.userData={anatomy:'rounded multi-lobed moss cushion covered in densely overlapping crossed fuzzy fronds',
    fronds:FRONDS,crossedCards:FRONDS*2,coreTriangles,fiberTriangles:FRONDS*4,
    coreVertices:1+RINGS*SECTORS+SECTORS+1,preparedPrototype:true};
  return geometry;
}
