import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';

const v=(x,y,z)=>new THREE.Vector3(x,y,z);
const UP=v(0,1,0),TAU=Math.PI*2;
export const OLD_CARGO_KINDS=Object.freeze(['container','hull','engine']);
export const OLD_CARGO_COLORS=Object.freeze({
  ceramic:0xb7b6a5,orange:0xa46a3f,metal:0x697b80,dark:0x28383f,
  rim:0x889797,rust:0x72584b,paint:0xc8b486,cable:0x343d43,
});

/** Owns only temporary geometry. All three finished assets are one static,
 * indexed vertex-color batch each; the caller owns the returned geometry. */
class CargoBuilder{
  constructor(){this.positions=[];this.colors=[];this.normals=[];this.uvs=[];this.indices=[];this.features=[];this.pose=new THREE.Object3D();this.tint=new THREE.Color();}
  add(name,source,color,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1],reverse=false){
    this.pose.position.set(...position);this.pose.rotation.set(...rotation);this.pose.scale.set(...scale);this.pose.updateMatrix();
    source.applyMatrix4(this.pose.matrix);if(!source.attributes.normal)source.computeVertexNormals();
    const p=source.attributes.position,n=source.attributes.normal,uv=source.attributes.uv,start=this.positions.length/3,triangleStart=this.indices.length/3;
    const base=new THREE.Color(color);
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      // Wide faded patches, narrow soot streaks and irregular fine corrosion
      // are fixed in the prototype instead of requiring extra textures.
      const wear=.77+.13*Math.sin(x*2.9+z*1.7+y*3.1)**2+.10*Math.sin(x*31+y*23-z*19)**2;
      const soot=(.5+.5*Math.sin(z*3.3+x*.9))*.055;
      this.tint.copy(base).multiplyScalar(wear-soot);
      this.positions.push(x,y,z);this.colors.push(this.tint.r,this.tint.g,this.tint.b);
      this.normals.push(n.getX(i)*(reverse?-1:1),n.getY(i)*(reverse?-1:1),n.getZ(i)*(reverse?-1:1));
      this.uvs.push(uv?.getX(i)??x,uv?.getY(i)??z);
    }
    const index=source.index;
    for(let i=0;i<(index?.count??p.count);i+=3){
      const a=start+(index?index.getX(i):i),b=start+(index?index.getX(i+1):i+1),c=start+(index?index.getX(i+2):i+2);
      this.indices.push(...(reverse?[a,c,b]:[a,b,c]));
    }
    this.features.push({name,triangleStart,triangleCount:this.indices.length/3-triangleStart});source.dispose();
  }
  box(name,position,size,color,rotation=[0,0,0]){this.add(name,new THREE.BoxGeometry(...size),color,position,rotation);}
  strut(name,from,to,radius,color,sides=6){
    const a=v(...from),b=v(...to),delta=b.clone().sub(a),q=new THREE.Quaternion().setFromUnitVectors(UP,delta.clone().normalize());
    this.add(name,new THREE.CylinderGeometry(radius,radius,delta.length(),sides),color,a.add(b).multiplyScalar(.5).toArray(),new THREE.Euler().setFromQuaternion(q).toArray().slice(0,3));
  }
  cable(name,points,radius=.027,color=OLD_CARGO_COLORS.cable){
    const mesh=new PlantMesh();mesh.tube(points.map(p=>v(...p)),radius,color,6);this.add(name,mesh.geometry({normalizeHeight:false}),color);
  }
  /** Closed-thickness planar plate, including all real torn edge faces. */
  plate(name,points,thickness,color){
    const origin=v(...points[0]),u=v(...points[1]).sub(origin).normalize();
    const normal=new THREE.Vector3().crossVectors(u,v(...points[2]).sub(origin)).normalize();
    if(normal.lengthSq()<.5)throw new TypeError(`Cargo plate ${name} needs a non-collinear outline.`);
    const side=new THREE.Vector3().crossVectors(normal,u).normalize(),shape=new THREE.Shape();
    points.forEach((point,i)=>{const p=v(...point).sub(origin),x=p.dot(u),y=p.dot(side);if(i)shape.lineTo(x,y);else shape.moveTo(x,y);});shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:thickness,steps:1,bevelEnabled:false,curveSegments:1});
    geometry.translate(0,0,-thickness/2);geometry.applyMatrix4(new THREE.Matrix4().makeBasis(u,side,normal).setPosition(origin));this.add(name,geometry,color);
  }
  bolt(name,point,color=OLD_CARGO_COLORS.rim){this.add(name,new THREE.CylinderGeometry(.043,.043,.035,6),color,point,[Math.PI/2,0,0]);}
  finish(kind){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(this.normals,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(this.colors,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(this.uvs,2));geometry.setIndex(this.indices);
    geometry.computeBoundingBox();const ground=geometry.boundingBox.min.y;geometry.translate(0,-ground,0);geometry.computeBoundingBox();geometry.computeBoundingSphere();
    geometry.name=`old-croba-${kind}-debris`;geometry.userData={kind,static:true,grounded:true,openInterior:kind!=='hull',features:this.features,source:'old crashed cargo and spacecraft'};
    return geometry;
  }
}

function container(builder){
  const c=OLD_CARGO_COLORS;
  builder.box('scuffed-cargo-floor',[0,.13,0],[2.85,.22,5.15],c.dark);
  for(const side of[-1,1]){
    builder.box('ground-skid',[side*1.04,.08,0],[.20,.16,5.35],c.rust);
    builder.box('lower-frame-rail',[side*1.42,.30,0],[.14,.26,5.20],c.metal);
    const x=side*1.39;
    // An unequal fractured top edge leaves the interior visible from above.
    const heights=side<0?[1.80,1.93,1.83,1.16,1.38,1.24]:[1.83,1.61,1.72,.78,1.04,1.16];
    for(let panel=0;panel<3;panel++){
      const z=-2.43+panel*1.62,a=heights[panel*2],b=heights[panel*2+1];
      builder.plate('fractured-cargo-side',[[x,.36,z],[x,.36,z+1.57],[x,b,z+1.57],[x,b+.12,z+1.05],[x,b-.07,z+.75],[x,a,z]],.075,panel===1?c.orange:c.ceramic);
    }
    for(const [index,z]of[-2.49,-1.64,-.80,.04,.88,1.72,2.49].entries()){
      const height=index<3?2.02:1.2+index*.08;
      const bend=side*(index===4?.17:0);
      builder.strut('bent-cargo-pressure-rib',[x,.32,z],[x+bend,height*.7,z+.05],.052,c.dark);
      builder.strut('broken-upper-cargo-rib',[x+bend,height*.7,z+.05],[x+side*.12,height,z+.12],.048,c.rim);
      builder.bolt('cargo-frame-fastener',[x+side*.055,.56,z]);
    }
    builder.box('faded-side-warning-stripe',[x+side*.049,1.05,-1.56],[.014,.12,1.26],c.paint);
    for(let mark=0;mark<5;mark++)builder.box('worn-cargo-serial-strokes',[x+side*.053,.80,-1.99+mark*.19],[.014,.14,.044],mark===3?c.dark:c.paint,[side*.03,0,mark%2?.12:-.06]);
  }
  builder.plate('rear-container-pressure-bulkhead',[[-1.34,.35,-2.48],[1.34,.35,-2.48],[1.34,1.82,-2.48],[.82,2.03,-2.48],[.28,1.88,-2.48],[-.31,2.06,-2.48],[-1.34,1.93,-2.48]],.095,c.metal);
  builder.box('rear-inset-cargo-plate',[0,1.10,-2.545],[1.95,.95,.07],c.orange);
  builder.strut('torn-front-diagonal',[-1.37,.39,2.45],[-.69,1.39,2.40],.065,c.metal);
  builder.strut('fractured-front-latch',[1.37,.36,2.45],[.98,.92,2.51],.060,c.metal);
  builder.box('cargo-latch-lock',[.98,.86,2.53],[.20,.25,.14],c.orange,[0,0,-.18]);
  // A lid has fallen outboard. Its actual edge thickness and underside ribs
  // distinguish it from a flat decal or another intact crate.
  builder.plate('displaced-fractured-lid',[[1.45,.37,-1.56],[3.02,.08,-1.27],[3.14,.08,.72],[2.90,.11,1.10],[3.05,.08,1.69],[1.44,.38,1.55]],.09,c.ceramic);
  for(const z of[-1.18,-.22,.74])builder.strut('lid-reinforcing-flute',[1.51,.42,z],[2.90,.16,z+.16],.042,c.dark);
  builder.cable('loose-cargo-harness',[[1.27,1.32,.83],[1.72,.71,1.23],[1.63,.29,1.73],[1.97,.20,2.17],[2.34,.10,2.29]],.032);
  builder.cable('floor-utility-line',[[-1.20,.28,-2.18],[-.73,.31,-1.34],[-.30,.27,-.14],[.37,.29,.74],[.71,.29,1.94]],.023);
  for(const [x,z,yaw]of[[-.83,-1.25,.1],[.32,-.48,-.28],[.76,.83,.17]])builder.box('scattered-inner-cargo',[x,.48,z],[.58,.40,.70],c.orange,[.08,yaw,.08]);
}

function hull(builder){
  const c=OLD_CARGO_COLORS;
  const outline=[[-3.35,.22,-1.14],[-2.12,.22,-1.86],[.46,.22,-1.51],[3.54,.22,.22],[3.03,.22,1.46],[2.62,.22,1.28],[2.37,.22,1.70],[1.91,.22,1.42],[1.33,.22,1.94],[-.38,.22,1.53],[-1.91,.22,.63],[-2.72,.22,.91]];
  builder.plate('torn-spacecraft-wing-skin',outline,.16,c.metal);
  builder.plate('worn-ceramic-wing-plate',[[-2.84,.33,-1.08],[-2.03,.33,-1.57],[-.23,.33,-1.30],[1.01,.33,-.62],[.46,.33,.74],[-.91,.33,.58],[-2.33,.33,-.06]],.08,c.ceramic);
  builder.plate('faded-orange-wing-panel',[[.98,.34,-.56],[3.23,.34,.28],[2.81,.34,1.18],[2.38,.34,1.04],[2.11,.34,1.39],[1.43,.34,1.55],[.59,.34,.89]],.07,c.orange);
  for(const [index,[from,to]]of[
    [[-3.1,.13,-1.1],[2.95,.13,1.3]],
    [[-2.19,.12,-1.65],[-1.61,.12,.74]],
    [[-.78,.12,-1.55],[-.37,.12,1.56]],
    [[.74,.14,-1.06],[1.09,.14,2.36]],
    [[1.87,.13,-.44],[2.19,.30,2.14]],
  ].entries())builder.strut('exposed-wing-spar-'+index,from,to,.073,c.dark,8);
  builder.strut('twisted-tip-spar',[2.38,.20,1.53],[2.58,.69,2.20],.07,c.metal);
  builder.strut('broken-rolled-wing-edge',[-2.72,.25,.91],[-1.83,.60,1.20],.083,c.rim);
  for(let bolt=0;bolt<12;bolt++){
    const t=bolt/11;builder.add('flush-wing-fastener',new THREE.CylinderGeometry(.033,.033,.028,6),c.rim,[-2.74+t*5.74,.401,-1.17+t*1.52]);
  }
  builder.box('faded-flight-stripe',[-.99,.391,-.28],[.19,.012,1.87],c.paint,[0,-.48,0]);
  for(const z of[-.83,-.57,-.31])builder.box('broken-navigation-stencil',[-.67,.403,z],[.42,.012,.045],c.dark,[0,-.48,0]);
  // Open honeycomb and severed cables hang out of the broken trailing edge.
  for(let cell=0;cell<5;cell++){
    const x=.18+cell*.30;
    builder.strut('exposed-core-web',[x,.14,1.61],[x+.18,.42,1.89],.025,c.rust,5);
    builder.strut('exposed-core-web',[x+.18,.42,1.89],[x+.29,.13,1.64],.025,c.rust,5);
  }
  builder.cable('severed-control-cable',[[-.31,.28,1.18],[.26,.29,1.75],[.21,.10,2.21],[.77,.07,2.50],[1.20,.08,2.39]],.026);
  builder.cable('loose-wing-pipe',[[-1.53,.35,-.20],[-.82,.54,.27],[-.37,.47,.83],[.09,.32,1.56]],.039,c.rim);
  builder.plate('small-detached-ceramic-shard',[[-2.60,.07,1.49],[-1.67,.07,1.64],[-1.54,.07,2.25],[-2.32,.07,2.09]],.065,c.ceramic);
}

function engine(builder){
  const c=OLD_CARGO_COLORS,radius=1.17,length=3.62,center=[0,1.40,0],start=.32,arc=TAU-.80;
  builder.add('ruptured-engine-outer-shell',new THREE.CylinderGeometry(radius,radius*1.04,length,18,1,true,start,arc),c.metal,center,[Math.PI/2,0,0]);
  builder.add('hollow-charred-engine-lining',new THREE.CylinderGeometry(radius-.095,radius*1.04-.095,length,18,1,true,start,arc),c.dark,center,[Math.PI/2,0,0],[1,1,1],true);
  for(const z of[-1.81,-1.42,1.34,1.81]){
    builder.add('fractured-engine-collar',new THREE.TorusGeometry(radius+.015,.065,6,18,arc),z<0?c.rim:c.rust,[0,1.40,z],[0,0,start]);
    for(let bolt=0;bolt<7;bolt++){
      const a=start+arc*(bolt+.5)/7;builder.bolt('engine-collar-bolt',[Math.cos(a)*(radius+.015),1.40+Math.sin(a)*(radius+.015),z+.055],c.dark);
    }
  }
  for(const a of[start,start+arc]){
    const x=Math.sin(a)*radius,y=1.40-Math.cos(a)*radius;
    builder.strut('thick-rupture-edge',[x,y,-1.81],[x,y,1.81],.055,c.orange);
  }
  // Rear stator leaves open gaps around every twisted blade and hub.
  builder.add('damaged-turbine-hub',new THREE.CylinderGeometry(.22,.31,.55,10),c.rim,[0,1.40,.48],[Math.PI/2,0,0]);
  for(let blade=0;blade<9;blade++){
    const a=blade*TAU/9,radial=v(Math.cos(a),Math.sin(a),0),side=v(-Math.sin(a),Math.cos(a),0);
    const p=(r,s,z)=>radial.clone().multiplyScalar(r).addScaledVector(side,s).add(v(0,1.40,z)).toArray();
    builder.plate('twisted-turbine-blade',[p(.26,0,.34),p(.94,.10,.25),p(1.01,.24,.44),p(.40,.13,.58)],.045,blade%3===0?c.orange:c.metal);
  }
  for(const side of[-1,1]){
    builder.box('broken-engine-mount',[side*1.18,.46,-.52],[.38,.38,.96],c.dark,[0,0,side*.18]);
    builder.strut('torn-mount-brace',[side*.78,.70,-1.16],[side*1.58,.13,-.92],.095,c.metal,8);
    builder.cable('external-fuel-pipe',[[side*.84,2.20,-1.47],[side*1.12,2.32,-.60],[side*1.09,2.16,.72],[side*.94,2.04,1.37]],.050,c.rust);
  }
  builder.box('faded-engine-service-patch',[.02,2.59,-.40],[.57,.035,1.21],c.orange,[0,0,-.07]);
  for(let vent=0;vent<5;vent++)builder.box('scorched-service-vent',[.03,2.62,-.79+vent*.17],[.34,.019,.055],c.dark,[0,0,-.07]);
  builder.cable('dangling-engine-wires',[[.96,.83,1.35],[1.32,.44,1.71],[1.60,.12,2.10],[1.98,.07,2.33]],.027);
  builder.cable('second-dangling-wire',[[.89,.76,1.39],[1.18,.34,1.81],[1.45,.09,2.34],[1.82,.07,2.60]],.020,c.rust);
  builder.plate('scattered-engine-shell-shard',[[-1.72,.07,.79],[-2.20,.07,1.00],[-2.42,.07,1.79],[-1.69,.07,1.69]],.07,c.orange);
}

/** Old broken cargo and spacecraft parts, in metres with Y up and ground at 0.
 * +Z is the long axis. Every result has finite bounds and vertex colors.
 * @param {'container'|'hull'|'engine'} kind
 * @returns {THREE.BufferGeometry} */
export function createOldCargoGeometry(kind){
  if(!OLD_CARGO_KINDS.includes(kind))throw new RangeError(`Unknown old cargo debris kind: ${String(kind)}`);
  const builder=new CargoBuilder();({container,hull,engine})[kind](builder);return builder.finish(kind);
}
