import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';

/** Common rest frame in metres: Y up and +Z toward the circular mouth.
 * Front left/right, middle left/right, then rear left/right: limb parts 1–6. */
export const SULFUR_LIZARD_FEET=Object.freeze([
  Object.freeze([-.64,.04,.46]),Object.freeze([.64,.04,.46]),
  Object.freeze([-.69,.04,0]),Object.freeze([.69,.04,0]),
  Object.freeze([-.64,.04,-.46]),Object.freeze([.64,.04,-.46]),
]);
export const SULFUR_LIZARD_PARTS=Object.freeze({MOUTH:7,TAIL:8});

const TAU=Math.PI*2,vector=(x,y,z)=>new THREE.Vector3(x,y,z);
const BACK=0x657a77,FLANK=0x86917a,BELLY=0xc6b490;
const tint=new THREE.Color(),base=new THREE.Color(),other=new THREE.Color();
const SHADE=(color,factor)=>tint.setHex(color).multiplyScalar(factor).getHex();

/** Fill one immutable part tag per generated vertex without extra model draws. */
function tagged(mesh,tags,part,build){
  const start=mesh.positions.length/3;build();
  for(let index=start;index<mesh.positions.length/3;index++)tags.push(part);
}

function hideColor(u,v){
  const latitude=Math.cos(u*Math.PI),side=Math.abs(Math.sin(v*TAU));
  const belly=THREE.MathUtils.smoothstep(-latitude,.10,.75);
  const mottle=Math.sin(v*31+u*14)*Math.sin(v*67-u*21);
  base.setHex(BACK).lerp(other.setHex(FLANK),side*.55).lerp(other.setHex(BELLY),belly*.93);
  return tint.copy(base).multiplyScalar(.91+.045*mottle+.045*Math.sin(v*13+u*17)**2).getHex();
}

/** Detailed, squat six-legged lizard with a recessed annular mouth. The head
 * shell omits its forward cap; only throat walls and a deep rear cap span the
 * mouth bore. No texture, material, light or simulation object is created here.
 *
 * lizardPart: 0 torso/head/eyes, 1–6 limbs, 7 mouth, 8 muscular tail.
 * @returns {{skin:THREE.BufferGeometry,face:THREE.BufferGeometry}}
 */
export function buildSulfurLizardAnatomy(){
  const skin=new PlantMesh(),face=new PlantMesh(),skinTags=[],faceTags=[],eyeCenters=[];
  const addSkin=(part,build)=>tagged(skin,skinTags,part,build);
  const addFace=(part,build)=>tagged(face,faceTags,part,build);

  // The broad chest, hanging flank and rounded rump form one continuous volume.
  addSkin(0,()=>skin.ellipsoid(vector(0,.37,-.08),vector(.47,.31,.72),hideColor,{segments:20,rings:16}));

  // A short, broad skull joins the chest. Theta begins behind the mouth lip,
  // leaving the central front opening empty rather than painting it black.
  const cut=.72,headZ=.69,headY=.43,headRadius=[.37,.28,.34];
  const cutZ=headZ+headRadius[2]*Math.cos(cut),cutX=headRadius[0]*Math.sin(cut),cutY=headRadius[1]*Math.sin(cut);
  addSkin(0,()=>skin.grid(14,20,(u,v)=>{
    const theta=cut+(Math.PI-cut)*u,angle=v*TAU,envelope=Math.sin(theta);
    const relief=1+.008*Math.sin(angle*10+u*21)*Math.sin(u*Math.PI);
    return vector(Math.cos(angle)*headRadius[0]*envelope*relief,
      headY+Math.sin(angle)*headRadius[1]*envelope*relief,headZ+headRadius[2]*Math.cos(theta));
  },(u,v)=>SHADE(FLANK,.89+.08*Math.sin(v*TAU)+.03*Math.sin(v*29-u*18)),0,true));

  // Soft lip tissue meets the cut skull continuously; the opening stays clear.
  addSkin(SULFUR_LIZARD_PARTS.MOUTH,()=>skin.grid(2,24,(u,v)=>{
    const angle=v*TAU,rx=cutX+(.272-cutX)*u,ry=cutY+(.213-cutY)*u;
    return vector(Math.cos(angle)*rx,headY+Math.sin(angle)*ry,cutZ+(.998-cutZ)*u);
  },(u,v)=>SHADE(0x9b8380,.90+.10*Math.sin(v*TAU)),0,false));

  // Six articulated, padded limbs overlap the torso and knee joints. Their
  // complete geometry receives one tag per limb so animation keeps toes joined.
  for(const [index,foot]of SULFUR_LIZARD_FEET.entries()){
    const side=Math.sign(foot[0]),middle=index>=2&&index<4,front=index<4?1:-1;
    const shoulder=vector(side*(middle?.36:.34),.35,middle?0:front*.40);
    const knee=vector(side*(middle?.64:.59),.17,middle?-.015:front*.47);
    addSkin(index+1,()=>{
      skin.ellipsoid(shoulder,vector(.15,.145,.205),hideColor,{segments:10,rings:5});
      skin.tube([shoulder,knee,vector(foot[0],.065,foot[2])],[.115,.095,.067],
        (u,v)=>SHADE(FLANK,.86+.08*Math.sin(v*TAU)),8);
      skin.ellipsoid(knee,vector(.111,.101,.122),FLANK,{segments:8,rings:4});
      skin.ellipsoid(vector(foot[0],.052,foot[2]),vector(.115,.041,.135),BELLY,{segments:8,rings:4});
      for(const digit of[-1,0,1]){
        const root=vector(foot[0]+digit*.063,.038,foot[2]+front*.067);
        const knuckle=vector(foot[0]+digit*.076,.028,foot[2]+front*.14);
        const tip=vector(foot[0]+digit*.082,.026,foot[2]+front*(.192-Math.abs(digit)*.024));
        skin.tube([root,knuckle,tip],[.026,.021,.013],0x9c9d82,5);
        skin.tube([tip,tip.clone().add(vector(digit*.008,-.004,front*.037))],[.014,0],0x565b50,5);
      }
    });
  }

  // A thick tail root disappears inside the rump and narrows to a round point.
  // It remains in the shared body frame for continuous shader-driven bending.
  addSkin(SULFUR_LIZARD_PARTS.TAIL,()=>skin.grid(14,10,(u,v)=>{
    const along=1-u,z=-.65-1.13*along,radius=.215*u**.88,angle=v*TAU;
    const y=.105+.185*u;
    return vector(Math.cos(angle)*radius,y+Math.sin(angle)*radius*.82,z);
  },(u,v)=>SHADE(BACK,.84+.12*u+.04*Math.cos(v*TAU)),0,false));

  // Two shallow flesh folds retain the plump belly silhouette without armor.
  for(const side of[-1,1])addSkin(0,()=>{
    const points=Array.from({length:9},(_,i)=>{
      const t=i/8;return vector(side*(.392+.012*Math.sin(t*Math.PI)),.247-.035*Math.sin(t*Math.PI),-.47+t*.79);
    });
    skin.tube(points,points.map((_,i)=>.012*Math.sin(i/8*Math.PI)+.004),0x7b8475,5);
  });

  // Two embedded lenses per side. Each iris faces laterally, with a vertical
  // pupil and small wet highlight; socket folds join the surrounding skin.
  for(const side of[-1,1])for(const [x,y,z]of [[.30,.59,.79],[.335,.40,.855]]){
    const center=vector(side*x,y,z);eyeCenters.push(center.toArray());
    addSkin(0,()=>{
      skin.ellipsoid(center.clone().add(vector(-side*.025,0,-.009)),vector(.083,.099,.108),
        0x748476,{segments:8,rings:5});
      const fold=Array.from({length:7},(_,i)=>{
        const a=i/6*Math.PI;
        return center.clone().add(vector(side*(.027+.012*Math.sin(a)),Math.sin(a)*.087,Math.cos(a)*.092));
      });
      skin.tube(fold,.012,0x96a088,5);
    });
    addFace(0,()=>{
      face.ellipsoid(center.clone().add(vector(side*.036,0,0)),vector(.035,.073,.085),
        (u,v)=>SHADE(0xe8b353,.82+.18*Math.sin(v*49+u*11)**2),{segments:10,rings:6});
      face.ellipsoid(center.clone().add(vector(side*.066,.002,.006)),vector(.015,.056,.028),
        0x101a1b,{segments:8,rings:5});
      face.ellipsoid(center.clone().add(vector(side*.081,.025,.024)),vector(.009,.012,.011),
        0xf4f0d6,{segments:6,rings:3});
    });
  }

  addFace(SULFUR_LIZARD_PARTS.MOUTH,()=>{
    // A real fleshy annulus surrounds a 34cm deep pleated throat. Its front is
    // +Z, so normals on the bore point inward and the buried rear cap faces out.
    const ring=Array.from({length:21},(_,i)=>{
      const a=i/20*TAU;return vector(Math.cos(a)*.253,headY+Math.sin(a)*.194,.998);
    });
    face.tube(ring,.022,(u,v)=>SHADE(0xa9858a,.91+.09*Math.sin(v*TAU)),6);
    face.grid(10,24,(u,v)=>{
      const angle=v*TAU,pleat=.006*Math.sin(angle*12+u*4)*Math.sin(u*Math.PI);
      const rx=.234*(1-u)+.075*u+pleat,ry=.175*(1-u)+.056*u+pleat;
      return vector(Math.cos(angle)*rx,headY+Math.sin(angle)*ry,.998-.338*u);
    },(u,v)=>{
      return tint.setHex(0x784c60).lerp(other.setHex(0x26212b),u*.86)
        .multiplyScalar(.85+.15*Math.sin(v*TAU*12+u*4)**2).getHex();
    });
    face.grid(1,24,(u,v)=>vector(Math.cos(v*TAU)*.075*u,headY+Math.sin(v*TAU)*.056*u,.66),0x151b20,0,true);
    for(const [count,u,length]of [[12,.14,.067],[10,.53,.047]]){
      const rx=.234*(1-u)+.075*u,ry=.175*(1-u)+.056*u,z=.998-.338*u;
      for(let index=0;index<count;index++){
        const a=index/count*TAU+(u>.3?.19:0),c=Math.cos(a),s=Math.sin(a);
        const root=vector(c*rx,headY+s*ry,z);
        const mid=vector(c*(rx-length*.57),headY+s*(ry-length*.57),z-.012);
        const tip=vector(c*(rx-length),headY+s*(ry-length),z-.027);
        face.tube([root,mid,tip],[.014,.010,0],0xd9c9a5,5);
      }
    }
  });

  const result={skin:skin.geometry({normalizeHeight:false}),face:face.geometry({normalizeHeight:false})};
  const metadata={eyeCount:4,legCount:6,mouthStyle:'annular-worm',lengthMeters:2.8,
    mouthFrontZ:1.02,mouthBackZ:.66,headHasFrontCap:false,eyeCenters:eyeCenters.map(p=>[...p])};
  for(const [name,geometry]of Object.entries(result)){
    const tags=name==='skin'?skinTags:faceTags;
    if(tags.length!==geometry.attributes.position.count)throw new Error(`Sulfur lizard ${name} part tags do not match its vertices.`);
    geometry.setAttribute('lizardPart',new THREE.Float32BufferAttribute(tags,1));
    geometry.name=`sulfur-maw-lizard-${name}`;Object.assign(geometry.userData,metadata);
    geometry.userData.triangleCount=geometry.index.count/3;
  }
  result.skin.userData.totalTriangles=Object.values(result).reduce((sum,g)=>sum+g.index.count/3,0);
  if(result.skin.userData.totalTriangles>7600)throw new Error('Sulfur lizard anatomy exceeds its triangle budget.');
  return result;
}
