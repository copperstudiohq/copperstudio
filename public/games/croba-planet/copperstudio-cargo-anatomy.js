import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';

const v=(x,y,z)=>new THREE.Vector3(x,y,z);
const COLORS=Object.freeze({shell:0x697b7f,ceramic:0xb6b4a2,frame:0x34464d,rim:0x8c9995,
  rust:0x735646,orange:0xa66d42,lining:0x47575a,label:0xc9bd98,copper:0xbb783c,copperDark:0x77472a});

/** Metres, Y up, front +Z. Negative X rotation lifts the front of the lid. */
export const COPPERSTUDIO_CARGO_ANCHORS=Object.freeze({
  lidHinge:Object.freeze([0,1.16,-.50]),
  lidOpenAngle:-110*Math.PI/180,
  yoyoInside:Object.freeze([.08,.235,.06]),
  label:Object.freeze({position:Object.freeze([0,.69,.532]),rotation:Object.freeze([0,0,0]),size:Object.freeze([1.46,.39])}),
  yoyoSpinAxis:'x',
});

/** Compact opaque batches. The returned geometries own their buffers; no
 * external material, texture, light, scene or animation state is allocated. */
class TrunkBuilder{
  constructor(){this.positions=[];this.colors=[];this.normals=[];this.uvs=[];this.indices=[];this.features=[];this.pose=new THREE.Object3D();this.tint=new THREE.Color();}
  add(name,source,color,position=[0,0,0],rotation=[0,0,0]){
    this.pose.position.set(...position);this.pose.rotation.set(...rotation);this.pose.scale.set(1,1,1);this.pose.updateMatrix();source.applyMatrix4(this.pose.matrix);
    if(!source.attributes.normal)source.computeVertexNormals();
    const p=source.attributes.position,n=source.attributes.normal,uv=source.attributes.uv,vertexColor=source.attributes.color,start=this.positions.length/3,first=this.indices.length/3,base=new THREE.Color(color);
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const fade=.79+.13*Math.sin(x*8.1+z*5.3-y*4.6)**2+.08*Math.sin(x*51-y*41+z*37)**2;
      if(vertexColor)this.tint.fromBufferAttribute(vertexColor,i);else this.tint.copy(base);
      this.tint.multiplyScalar(fade);
      this.positions.push(x,y,z);this.colors.push(this.tint.r,this.tint.g,this.tint.b);
      this.normals.push(n.getX(i),n.getY(i),n.getZ(i));this.uvs.push(uv?.getX(i)??x,uv?.getY(i)??z);
    }
    const index=source.index;
    for(let i=0;i<(index?.count??p.count);i++)this.indices.push(start+(index?index.getX(i):i));
    this.features.push({name,triangleStart:first,triangleCount:this.indices.length/3-first});source.dispose();
  }
  box(name,center,size,color,rotation=[0,0,0]){this.add(name,new THREE.BoxGeometry(...size),color,center,rotation);}
  /** Parallel faces stay thick while a shallow localized dent bends the panel. */
  panel(name,center,size,color,axis='z'){
    const geometry=new THREE.BoxGeometry(...size,6,3,axis==='z'?1:3),p=geometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      if(axis==='z')p.setZ(i,z+.018*Math.sin(x*3.1+y*2.2)*Math.sin((x/size[0]+.5)*Math.PI)*Math.sin((y/size[1]+.5)*Math.PI));
      else p.setX(i,x+.014*Math.sin(z*4.1-y*3.3)*Math.sin((z/size[2]+.5)*Math.PI)*Math.sin((y/size[1]+.5)*Math.PI));
    }
    geometry.computeVertexNormals();this.add(name,geometry,color,center);
  }
  pin(name,center,length,radius,color){this.add(name,new THREE.CylinderGeometry(radius,radius,length,8),color,center,[0,0,Math.PI/2]);}
  bolt(name,center,rotation=[Math.PI/2,0,0]){this.add(name,new THREE.CylinderGeometry(.024,.024,.021,6),COLORS.rim,center,rotation);}
  finish(name){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(this.normals,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(this.colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(this.uvs,2));geometry.setIndex(this.indices);
    geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.name=name;geometry.userData={static:true,features:this.features};return geometry;
  }
}

function createBase(){
  const b=new TrunkBuilder();
  for(const side of[-1,1]){
    b.box('ground-skid',[side*.61,.045,0],[.15,.09,1.04],COLORS.frame);
    b.box('bottom-edge-rail',[side*.86,.165,0],[.09,.13,1.04],COLORS.rust);
  }
  b.box('deep-trunk-floor',[0,.09,0],[1.73,.12,.96],COLORS.frame);
  b.box('worn-interior-liner',[0,.157,0],[1.62,.014,.84],COLORS.lining);
  // Four independent solid walls leave a true open volume above the floor.
  b.panel('front-dented-metal-wall',[0,.6425,.475],[1.73,.985,.07],COLORS.shell);
  b.panel('rear-dented-metal-wall',[0,.6425,-.475],[1.73,.985,.07],COLORS.shell);
  for(const side of[-1,1]){
    b.panel('dented-container-side',[side*.865,.6425,0],[.07,.985,.96],COLORS.orange,'x');
    for(const z of[-.47,.47]){
      b.box('reinforced-corner-post',[side*.875,.645,z],[.10,1.04,.10],COLORS.frame);
      b.box('worn-corner-cap',[side*.875,1.105,z],[.12,.06,.12],COLORS.rim);
    }
    b.box('side-top-rim',[side*.855,1.105,0],[.085,.06,.91],COLORS.rim);
    b.box('side-ceramic-patch',[side*.909,.61,-.13],[.017,.33,.37],COLORS.ceramic);
    // Folded carry handles are real U-shaped metal pieces on both ends.
    const x=side*.969;
    b.box('side-handle-upper',[x,.77,.01],[.050,.05,.36],COLORS.frame);
    for(const z of[-.145,.165])b.box('side-handle-return',[side*.941,.68,z],[.10,.19,.045],COLORS.frame);
  }
  for(const z of[-.455,.455])b.box('end-top-rim',[0,1.105,z],[1.65,.06,.085],COLORS.rim);
  // Blank, faded placard: root supplies the large COPPERSTUDIO text texture.
  b.box('front-cartoon-label-backing',[0,.69,.518],[1.53,.45,.013],COLORS.label);
  for(const x of[-.792,.792])b.box('placard-side-frame',[x,.69,.526],[.038,.47,.017],COLORS.frame);
  for(const y of[.445,.935])b.box('placard-horizontal-frame',[0,y,.526],[1.62,.034,.017],COLORS.frame);
  for(const x of[-.756,.756])for(const y of[.474,.906])b.bolt('placard-fastener',[x,y,.540]);
  b.box('front-latch-receiver',[0,1.015,.535],[.17,.18,.07],COLORS.frame);
  b.box('front-latch-worn-face',[0,1.018,.574],[.105,.11,.016],COLORS.rust);
  for(const x of[-.60,.60]){
    b.pin('rear-hinge-axle',[x,1.16,-.50],.36,.027,COLORS.frame);
    b.box('rear-hinge-backing',[x,1.045,-.518],[.24,.19,.035],COLORS.rust);
  }
  const g=b.finish('copperstudio-old-cargo-base');g.userData.openInterior=true;g.userData.labelPlane=structuredClone(COPPERSTUDIO_CARGO_ANCHORS.label);return g;
}

function createLid(){
  const b=new TrunkBuilder();
  // This geometry is local to the rear hinge. It must not be translated to
  // the trunk center before rotating: local Z=0 is the actual hinge axis.
  b.panel('dented-closed-lid-skin',[0,.015,.505],[1.84,.08,1.05],COLORS.ceramic);
  b.box('lid-inner-recess',[0,-.030,.50],[1.64,.016,.88],COLORS.lining);
  for(const x of[-.81,.81])b.box('lid-long-edge-frame',[x,.038,.505],[.075,.055,1.05],COLORS.frame);
  for(const z of[.025,.985])b.box('lid-cross-edge-frame',[0,.038,z],[1.68,.055,.075],COLORS.frame);
  for(const x of[-.58,0,.58])b.box('lid-interior-pressed-rib',[x,-.050,.505],[.045,.035,.82],COLORS.rim);
  for(const x of[-.60,.60])for(const dx of[-.126,.126])b.pin('articulated-lid-hinge-barrel',[x+dx,0,0],.09,.044,COLORS.rim);
  b.box('lid-front-latch-tongue',[0,-.018,1.054],[.10,.12,.032],COLORS.orange);
  b.box('faded-lid-orange-band',[-.50,.063,.505],[.18,.014,.86],COLORS.orange);
  for(const x of[-.81,.81])for(const z of[.025,.985])b.bolt('lid-corner-fastener',[x,.077,z],[0,0,0]);
  const g=b.finish('copperstudio-hinged-cargo-lid');g.userData.hingeLocal=[0,0,0];g.userData.openAngle=COPPERSTUDIO_CARGO_ANCHORS.lidOpenAngle;return g;
}

function createYoyo(){
  const mesh=new PlantMesh(),radius=.060;
  const ringRadii=[0,.18,.32,.38,.40,.42,.57,.65,.67,.69,.83,.85,.87,.95,1];
  const shade=new THREE.Color(),copper=new THREE.Color(COLORS.copper),dark=new THREE.Color(COLORS.copperDark);
  for(const side of[-1,1]){
    const outer=r=>{
      const groove=[.40,.67,.85].reduce((sum,at)=>sum+Math.exp(-(((r-at)/.012)**2)),0);
      return .008+.016*Math.sqrt(Math.max(0,1-r*r))-.0014*groove;
    };
    mesh.grid(ringRadii.length-1,24,(u,t)=>{
      const r=ringRadii[Math.round(u*(ringRadii.length-1))],a=t*Math.PI*2;
      return v(side*outer(r),Math.cos(a)*radius*r,Math.sin(a)*radius*r);
    },(u,t)=>{
      const r=ringRadii[Math.round(u*(ringRadii.length-1))],groove=Math.min(...[.40,.67,.85].map(at=>Math.abs(r-at)));
      return shade.copy(copper).lerp(dark,groove<.006?.40:.06+.05*Math.sin(t*37+u*19)**2).getHex();
    },0,side>0);
    // The inner face dishes into a real eight-millimetre string groove.
    mesh.grid(3,24,(u,t)=>v(side*(.004+.004*u**8),Math.cos(t*Math.PI*2)*radius*u,Math.sin(t*Math.PI*2)*radius*u),COLORS.copperDark,0,side<0);
  }
  const geometry=mesh.geometry({normalizeHeight:false}),b=new TrunkBuilder();b.add('convex-copper-yoyo-halves',geometry,COLORS.copper);
  b.pin('narrow-central-string-axle',[0,0,0],.016,.0085,COLORS.rim);
  for(const side of[-1,1])b.pin('tiny-outer-axle-cap',[side*.0245,0,0],.0018,.0095,COLORS.orange);
  const g=b.finish('collectible-copperstudio-copper-yoyo');g.userData.spinAxis='x';g.userData.diameterMetres=.12;g.userData.incisedRings=3;return g;
}

/** A hollow cargo trunk, independently hinged lid, and one small copper yo-yo.
 * Position lid at COPPERSTUDIO_CARGO_ANCHORS.lidHinge, then animate rotation.x
 * from 0 to lidOpenAngle. Yo-yo geometry stays centered and spins around X.
 * @returns {{base:THREE.BufferGeometry,lid:THREE.BufferGeometry,yoyo:THREE.BufferGeometry}} */
export function createCopperStudioCargoAnatomy(){return{base:createBase(),lid:createLid(),yoyo:createYoyo()};}
