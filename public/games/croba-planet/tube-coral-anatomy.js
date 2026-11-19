import * as THREE from './vendor/three.module.js';

export const TUBE_CORAL_TRIANGLE_BUDGET=464;
const SIDES=16,TAU=Math.PI*2;
const OUTER_LEVELS=[0,.14,.36,.62,.86,1];
const INNER_LEVELS=[.025,.25,.53,.80,1];
const PROFILE=[[0,.90],[.14,.77],[.36,.66],[.62,.66],[.86,.71],[1,.77]];

// Mouth heights vary around the lip; normalize discrete samples so the highest
// real vertex is exactly 1 and root/height remain the authored placement bounds.
const mouthWave=Array.from({length:SIDES},(_,i)=>.65*Math.sin(i*TAU/SIDES+.4)+.35*Math.cos(i*TAU/SIDES*3-.2));
const waveMin=Math.min(...mouthWave),waveSpan=Math.max(...mouthWave)-waveMin;
const mouthHeight=index=>.962+.038*(mouthWave[index%SIDES]-waveMin)/waveSpan;

function radius(t,angle){
  let index=0;while(index<PROFILE.length-2&&t>PROFILE[index+1][0])index++;
  const[a,ra]=PROFILE[index],[b,rb]=PROFILE[index+1],u=(t-a)/(b-a);
  const smooth=u*u*(3-2*u);
  return ra+(rb-ra)*smooth+.025*Math.sin(angle*5+.35*t)+.015*Math.cos(angle*9-1.5*t);
}

function point(t,index,inner=false,raise=0){
  const angle=(index%SIDES)*TAU/SIDES,wall=inner ? .18-.02*t : 0;
  const r=radius(t,angle)-wall+raise;
  const lip=mouthHeight(index)-(inner ? .004 : .008);
  const y=t-(1-lip)*t**8;
  return[.18*t*t-.03*Math.sin(Math.PI*t)+Math.cos(angle)*r,y,
    .07*Math.sin(Math.PI*t)*t+Math.sin(angle)*r];
}

function geometry(rows,kind){
  const positions=[],uv=[],colors=[],indices=[];
  for(let row=0;row<rows.length;row++)for(let side=0;side<=SIDES;side++){
    positions.push(...rows[row][side%SIDES]);uv.push(side/SIDES,row/(rows.length-1));
    const shade=kind==='inner' ? .62+.20*row/(rows.length-1) : .87+.09*Math.sin(side*1.7+row*.6)**2;
    colors.push(shade,shade,shade);
  }
  for(let row=0;row<rows.length-1;row++)for(let side=0;side<SIDES;side++){
    const a=row*(SIDES+1)+side,b=a+1,c=a+SIDES+1,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const result=new THREE.BufferGeometry();
  result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  result.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  result.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));result.setIndex(indices);result.computeVertexNormals();
  // The UV seam duplicates positions; averaging its normals keeps soft tissue
  // smooth while preserving cylindrical texture coordinates.
  const normal=result.attributes.normal;
  for(let row=0;row<rows.length;row++){
    const a=row*(SIDES+1),b=a+SIDES,n=new THREE.Vector3(normal.getX(a)+normal.getX(b),normal.getY(a)+normal.getY(b),normal.getZ(a)+normal.getZ(b)).normalize();
    normal.setXYZ(a,n.x,n.y,n.z);normal.setXYZ(b,n.x,n.y,n.z);
  }
  result.userData={organicTube:true,part:kind,openEnded:true};
  result.computeBoundingBox();result.computeBoundingSphere();return result;
}

function growthRidges(){
  const positions=[],uv=[],colors=[],indices=[];
  for(const[band,fraction]of[.23,.49,.76].entries()){
    const start=positions.length/3;
    for(let edge=0;edge<2;edge++)for(let side=0;side<=SIDES;side++){
      const angle=side*TAU/SIDES,t=fraction+.012*Math.sin(angle*3+band*.8)+.004*Math.cos(angle*7)+(edge?1:-1)*.0045;
      positions.push(...point(t,side,false,.009));uv.push(side/SIDES,t);
      const shade=.78+.16*Math.sin(angle*2.7+band)**2;colors.push(shade,shade,shade);
    }
    for(let side=0;side<SIDES;side++){
      const a=start+side,b=a+1,c=a+SIDES+1,d=c+1;indices.push(a,c,b,b,c,d);
    }
  }
  const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  result.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));result.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  result.setIndex(indices);result.computeVertexNormals();result.computeBoundingBox();result.computeBoundingSphere();
  result.userData={organicTube:true,part:'growth-ridges',growthBands:3};return result;
}

function recessedBottom(){
  const t=INNER_LEVELS[0],center=[.18*t*t-.03*Math.sin(Math.PI*t),t,.07*Math.sin(Math.PI*t)*t];
  const positions=[...center],uv=[.5,.5],indices=[];
  for(let side=0;side<SIDES;side++){
    const p=point(t,side,true);p[1]=t;positions.push(...p);uv.push(.5+p[0]*.5,.5+p[2]*.5);
  }
  for(let side=0;side<SIDES;side++)indices.push(0,1+(side+1)%SIDES,1+side);
  const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  result.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));result.setIndex(indices);result.computeVertexNormals();
  result.userData={organicTube:true,part:'deep-bottom'};result.computeBoundingBox();result.computeBoundingSphere();return result;
}

/** One normalized sponge tube: smooth curved/fluted walls, a softly rolled,
 * uneven flaring mouth, deep hollow lining and three subtle irregular growth
 * scars. Every point stays inside the authored radius; roots and max height
 * are exactly 0 and 1. All five returned buffers are owned by the caller. */
export function createTubeCoralAnatomy(){
  const result={};
  try{
    result.outer=geometry(OUTER_LEVELS.map(t=>Array.from({length:SIDES},(_,i)=>point(t,i))),'outer');
    result.inner=geometry(INNER_LEVELS.map(t=>Array.from({length:SIDES},(_,i)=>point(t,i,true))),'inner');
    const lip=[[],[],[]];
    for(let i=0;i<SIDES;i++){
      const outer=point(1,i),inner=point(1,i,true),angle=i*TAU/SIDES;
      lip[0].push(outer);
      lip[1].push([outer[0]-Math.cos(angle)*.055,mouthHeight(i),outer[2]-Math.sin(angle)*.055]);
      lip[2].push(inner);
    }
    result.rim=geometry(lip,'rolled-mouth');result.bottom=recessedBottom();result.ridge=growthRidges();
    let triangles=0;
    for(const[part,g]of Object.entries(result)){
      for(const attribute of Object.values(g.attributes))if(![...attribute.array].every(Number.isFinite))throw new Error(`Tube coral ${part} needs finite surface attributes.`);
      triangles+=(g.index?.count??g.attributes.position.count)/3;
      const p=g.attributes.position;
      for(let i=0;i<p.count;i++)if(Math.hypot(p.getX(i),p.getZ(i))>1+1e-6||p.getY(i)<-1e-6||p.getY(i)>1+1e-6)
        throw new RangeError(`Tube coral ${part} exceeds its authored footprint or height.`);
    }
    if(triangles>TUBE_CORAL_TRIANGLE_BUDGET)throw new RangeError(`Tube coral exceeds ${TUBE_CORAL_TRIANGLE_BUDGET} triangles.`);
    return result;
  }catch(error){for(const g of Object.values(result))g.dispose();throw error;}
}
