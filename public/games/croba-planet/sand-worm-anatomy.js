import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';

/** Metre prototypes, Y up and +Z forward. The renderer supplies body-section
 * transforms, world scale and four independent radial mouth-plate hinges. */
export const SAND_WORM_SEGMENT_LENGTH=1;
export const SAND_WORM_BODY_RADIUS=1.1;
export const SAND_WORM_MOUTH_Z=.55;
export const SAND_WORM_PLATE_HINGE_RADIUS=1.10;
export const SAND_WORM_PLATE_OPEN_SIGN=-1;

const TAU=Math.PI*2;
const vector=(x,y,z)=>new THREE.Vector3(x,y,z);
const tint=new THREE.Color(),shade=(color,amount)=>tint.setHex(color).multiplyScalar(amount).getHex();
const OCHRE=0xa58142,BRONZE=0x94713c,EDGE=0xc6a363,CREVICE=0x493b28;
const bell=(value,center,width)=>Math.exp(-(((value-center)/width)**2));

/** Sculpted shell damage stays deterministic and shallow enough to preserve
 * plate thickness. Vertex colors darken the same recessed geometry. */
function shellWear(u,v,seed){
  const crack=.024*bell(v,.43+.034*Math.sin(u*5+seed),.075)*Math.sin(u*Math.PI)**.7;
  const scar=.014*bell(u,.54+.14*Math.sin(v*4+seed),.11)*Math.sin(v*Math.PI);
  const pits=.009*Math.max(0,Math.sin(u*23+v*17+seed))**8*Math.sin(u*Math.PI)*Math.sin(v*Math.PI);
  return crack+scar+pits;
}

/** A closed hard plate with a raised lip and four bevelled side faces. Gaps
 * between neighboring plates expose the lower dark body instead of painted
 * lines. The inner surface is buried slightly in that flexible core. */
function armorPanel(mesh,start,end,angle,halfAngle,radiusAt,ring=0){
  const seed=angle*3.7+ring*2.13,rows=4,columns=7;
  const surface=(u,v,inner=false)=>{
    const across=v*2-1,chip=.013*bell(u,.38+.16*Math.sin(seed),.14);
    const a=angle+across*(halfAngle-chip)+.006*Math.sin(u*12+seed)*across**5;
    // Scalloped broken ends remove little wedges rather than adding noise to
    // the whole silhouette. The outer segment still fits its metre interval.
    const startChip=.025*bell(v,.23+.12*Math.sin(seed),.15);
    const endChip=.030*bell(v,.72+.10*Math.cos(seed),.13);
    const along=u+startChip*(1-u)**8-endChip*u**8,z=start+(end-start)*along;
    const lip=.049+.064*u+.025*Math.sin(u*Math.PI)*Math.sin(v*Math.PI);
    const grain=.004*Math.sin(z*27+a*11)*Math.sin(a*23-z*17);
    const radius=radiusAt(z)+lip+grain-shellWear(u,v,seed)-(inner ? .065 : 0);
    return vector(Math.cos(a)*radius,Math.sin(a)*radius,z);
  };
  mesh.grid(rows,columns,(u,v)=>surface(u,v),(u,v)=>{
    const exposed=.87+.12*u+.06*Math.sin(v*Math.PI),mottle=Math.sin(v*31+ring)*Math.sin(u*21-v*13)*.025;
    return shade(ring%2?BRONZE:OCHRE,exposed+mottle-shellWear(u,v,seed)*5.4);
  });
  mesh.grid(1,columns,(u,v)=>surface(u,v,true),CREVICE,0,true);
  const edge=[];
  for(let i=0;i<=columns;i++)edge.push([0,i/columns]);
  for(let i=1;i<=rows;i++)edge.push([i/rows,1]);
  for(let i=columns-1;i>=0;i--)edge.push([1,i/columns]);
  for(let i=rows-1;i>=0;i--)edge.push([i/rows,0]);
  mesh.grid(2,edge.length-1,(u,v)=>{
    const [along,across]=edge[Math.round(v*(edge.length-1))];
    const p=surface(along,across).lerp(surface(along,across,true),u);
    // A second chamfer catches light independently of the worn outer face.
    const a=angle+(across*2-1)*halfAngle,inset=.012*Math.sin(u*Math.PI);
    return p.add(vector(Math.sin(a)*(across-.5)*inset,-Math.cos(a)*(across-.5)*inset,-(along-.5)*inset));
  },(u,v)=>shade(u<.5?EDGE:BRONZE,.78+.08*Math.sin(v*TAU+seed)));
}

/** A shallow closed collar cap; a true mouth never uses this at its front. */
function disk(mesh,z,radius,color,forward=true,sides=32){
  mesh.grid(1,sides,(u,v)=>vector(Math.cos(v*TAU)*radius*u,Math.sin(v*TAU)*radius*u,z),color,0,forward);
}

function buildSegment(){
  const mesh=new PlantMesh(),radiusAt=()=>.98;
  // The core remains visible at recessed inter-plate grooves and rear joint.
  mesh.grid(4,32,(u,v)=>{
    const z=-.5+u,a=v*TAU,r=.966+.014*Math.sin(u*Math.PI);
    return vector(Math.cos(a)*r,Math.sin(a)*r,z);
  },(u,v)=>shade(0x61543b,.86+.07*Math.sin(v*TAU*12+u*6)));
  disk(mesh,-.5,.966,0x403a2d,false);
  disk(mesh,.5,.966,0x665037,true);

  // A dark corrugated rear coupling provides a real flexible inter-segment
  // groove below the shell. Its entire extent stays within the 1m prototype.
  mesh.grid(8,40,(u,v)=>{
    const a=v*TAU,r=.980+.032*Math.sin(u*Math.PI)+.013*(.5+.5*Math.cos(u*TAU*3))
      +.006*Math.sin(a*20+u*3)*Math.sin(u*Math.PI);
    return vector(Math.cos(a)*r,Math.sin(a)*r,-.5+.15*u);
  },(u,v)=>shade(0x49463e,.76+.15*Math.cos(u*TAU*3)+.035*Math.sin(v*TAU*20+u*3)));

  for(const [ring,start,end]of[[0,-.35,.09],[1,.065,.5]])for(let band=0;band<8;band++)
    armorPanel(mesh,start,end,band*TAU/8+(ring ? .065 : 0),.342,radiusAt,ring);
  return mesh;
}

function collarRadius(z){
  const profile=[[-1,.91],[-.7,.97],[-.4,1.035],[-.05,1.075],[.3,1.055],[.45,1.045]];
  let i=1;while(i<profile.length-1&&profile[i][0]<z)i++;
  const [a,r]=profile[i-1],[b,s]=profile[i],t=THREE.MathUtils.clamp((z-a)/(b-a),0,1);
  const smooth=t*t*(3-2*t);return r+(s-r)*smooth;
}

function buildHead(){
  const mesh=new PlantMesh();
  // A rear neck sleeve extends into the first section. Every forward surface
  // is annular: no ellipsoid or flat face blocks the central mouth aperture.
  mesh.grid(7,32,(u,v)=>{
    const z=-1+1.45*u,a=v*TAU,r=collarRadius(z);
    return vector(Math.cos(a)*r,Math.sin(a)*r,z);
  },(u,v)=>shade(CREVICE,.94+.05*Math.sin(v*TAU*18+u*12)));
  disk(mesh,-1,.91,0x3b3529,false);
  mesh.grid(7,32,(u,v)=>{
    const a=v*TAU,r=collarRadius(-.99+.31*u)+.024*Math.sin(u*Math.PI*3+.12*Math.sin(a*5))**2;
    return vector(Math.cos(a)*r,Math.sin(a)*r,-.99+.31*u);
  },(u,v)=>shade(0x514c40,.78+.14*Math.sin(u*Math.PI*6+.12*Math.sin(v*TAU*5))));
  for(const [ring,start,end]of[[0,-.70,-.16],[1,-.19,.35]])for(let band=0;band<8;band++)
    armorPanel(mesh,start,end,band*TAU/8+(ring ? .055 : 0),.345,collarRadius,ring);

  // An outward flared annulus joins the armored collar to a thick lip. Parent
  // plates sit ahead of this plane and cover it when their hinges are closed.
  mesh.grid(2,32,(u,v)=>{
    const a=v*TAU,r=1.045+u*.085,z=.45+u*.10;
    return vector(Math.cos(a)*r,Math.sin(a)*r,z);
  },(u,v)=>shade(OCHRE,.92+.05*Math.sin(v*TAU*8)));
  const lip=Array.from({length:33},(_,i)=>{
    const a=i/32*TAU,r=1.04+.007*Math.sin(a*9);
    return vector(Math.cos(a)*r,Math.sin(a)*r,.55+.008*Math.sin(a*7));
  });
  mesh.tube(lip,.09,(u,v)=>shade(0x9b8050,.83+.10*Math.cos(v*TAU)+.04*Math.sin(u*TAU*9)),8);

  // A full metre of visible throat depth, with real inward-facing pleats.
  const throatRadius=u=>.94-.56*u;
  mesh.grid(16,40,(u,v)=>{
    const a=v*TAU,envelope=Math.sin(u*Math.PI);
    const fold=(.030*Math.sin(a*13+u*7)+.012*Math.sin(a*21-u*4))*envelope;
    const r=throatRadius(u)+fold+.013*Math.sin(u*TAU*2+a*3)*envelope;
    return vector(Math.cos(a)*r,Math.sin(a)*r,.55-1.05*u);
  },(u,v)=>{
    const pleat=.5+.5*Math.sin(v*TAU*13+u*7);
    return tint.setHex(0x755449).lerp(new THREE.Color(0x1b1a1c),u*.88)
      .multiplyScalar(.74+.21*pleat).getHex();
  },0,false);
  // The back cap faces the observer. It is behind every lip/tooth ring and
  // closes the throat without a false dark disk over the mouth opening.
  disk(mesh,-.5,.38,0x171a19,true);
  for(const [count,u,length]of[[16,.21,.20],[12,.57,.15]]){
    const radius=throatRadius(u),z=.55-1.05*u;
    for(let i=0;i<count;i++){
      const a=i/count*TAU+(u>.4?.13:0),c=Math.cos(a),s=Math.sin(a),toothLength=length*(.86+.16*Math.sin(i*2.7));
      mesh.tube([vector(c*radius,s*radius,z),vector(c*(radius-toothLength*.55),s*(radius-toothLength*.55),z-.04),
        vector(c*(radius-toothLength),s*(radius-toothLength),z-.10)],[.040,.026,0],shade(0xcfc09a,.88+.09*Math.sin(i*1.7)),5);
    }
  }
  return mesh;
}

/** One upper-quadrant shield. Its local hinge is the origin; after translating
 * it to radial Y1.10/Z.55, rotate copies about Z by quarter turns. Opening uses
 * local X=-openAngle: the pointed tip lifts forward/outward rather than folding
 * backward through the collar. The tips and diagonal edges overlap slightly;
 * wear only changes depth so four closed plates keep their full coverage.
 */
function buildPlate(){
  const mesh=new PlantMesh();
  const surface=(u,v,inside=false)=>{
    const across=v*2-1,width=Math.max(0,Math.min(.75,1.12*(1-u)-.009));
    const y=-1.12*u,z=.12+.18*Math.sin(u*Math.PI*.88)
      +.05*(1-across*across)*Math.sin(u*Math.PI*.85);
    const rough=.0045*Math.sin(u*31+across*9)*Math.sin(across*25-u*12)*Math.sin(u*Math.PI);
    const crack=.024*bell(v,.34+.10*Math.sin(u*5),.055)*Math.sin(u*Math.PI)**.7;
    const chips=.016*Math.abs(across)**8*bell(u,.35+.12*Math.sin(v*11),.13);
    const innerFold=.009*Math.sin(v*TAU*5+u*8)*Math.sin(u*Math.PI);
    return vector(across*width,y,z+rough-(inside ? .10-.075*u+innerFold : crack+chips));
  };
  mesh.grid(10,16,(u,v)=>surface(u,v),(u,v)=>shade(OCHRE,
    .88+.12*u+.075*Math.sin(v*Math.PI)-shellWear(u,v,.8)*6),0,true);
  mesh.grid(8,14,(u,v)=>surface(u,v,true),(u,v)=>shade(0x514039,
    .73+.11*Math.sin(v*TAU*5+u*8)+.10*u),0,false);
  const edge=[];
  for(let i=0;i<=16;i++)edge.push([0,i/16]);
  for(let i=1;i<=10;i++)edge.push([i/10,1]);
  for(let i=15;i>=0;i--)edge.push([1,i/16]);
  for(let i=9;i>=0;i--)edge.push([i/10,0]);
  mesh.grid(2,edge.length-1,(u,v)=>{
    const [along,across]=edge[Math.round(v*(edge.length-1))];
    return surface(along,across).lerp(surface(along,across,true),u).add(vector(0,0,-.008*Math.sin(u*Math.PI)));
  },(u,v)=>shade(u<.5?EDGE:BRONZE,.74+.10*Math.sin(v*TAU)));
  // A low central keel reads as hard crustacean-like shell, without long spikes.
  const ridge=Array.from({length:11},(_,i)=>surface(.09+i/10*.77,.5).add(vector(0,0,.007)));
  mesh.tube(ridge,ridge.map((_,i)=>.005+.014*Math.sin(i/10*Math.PI)),0xb59555,6);
  return mesh;
}

/** Unique immutable prototypes only: parent renderers own instancing, textures,
 * articulated hinges, terrain clipping and disposal.
 * @returns {{segment:THREE.BufferGeometry,head:THREE.BufferGeometry,plate:THREE.BufferGeometry}}
 */
export function buildSandWormAnatomy(){
  const result={segment:buildSegment().geometry({normalizeHeight:false}),head:buildHead().geometry({normalizeHeight:false}),
    plate:buildPlate().geometry({normalizeHeight:false})};
  const metadata={bodyRadius:SAND_WORM_BODY_RADIUS,segmentLength:SAND_WORM_SEGMENT_LENGTH,mouthPlateCount:4,
    mouthStyle:'recessed-annular',mouthFrontZ:SAND_WORM_MOUTH_Z,throatBackZ:-.5,headHasFrontCap:false,
    plateHingeRadius:SAND_WORM_PLATE_HINGE_RADIUS,plateHingeZ:SAND_WORM_MOUTH_Z,plateOpeningSign:SAND_WORM_PLATE_OPEN_SIGN};
  let total=0;
  for(const [name,geometry]of Object.entries(result)){
    geometry.deleteAttribute('plantGlow');geometry.name=`armored-sand-worm-${name}`;
    for(const attribute of Object.values(geometry.attributes))if(!attribute.array.every(Number.isFinite))
      throw new Error(`Sand worm ${name} contains non-finite geometry.`);
    Object.assign(geometry.userData,metadata,{triangleCount:geometry.index.count/3});total+=geometry.index.count/3;
  }
  if(total>11000)throw new Error('Sand worm prototypes exceed their unique triangle budget.');
  result.segment.userData.totalTriangles=total;
  return result;
}
