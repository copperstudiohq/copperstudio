import * as THREE from './vendor/three.module.js';
import {addWreckInterior} from './wreck-interior.js';
import {addCompactCockpit} from './wreck-cockpit.js';
import {WRECK_WINGS,addWreckWingNests} from './wreck-wings.js';
import {addWreckCabinDecor,applyWreckCabinDecorTints} from './wreck-cabin-decor.js';
import {addWreckRoofCargo} from './wreck-roof-cargo.js';

/** Merge the wreck by surface rather than issuing a draw for every rivet. */
class WreckBuilder {
  constructor(materials) {
    this.materials=materials;this.batches=new Map();this.transform=new THREE.Object3D();
  }
  add(kind,name,source,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]) {
    let geometry=source.index?source.toNonIndexed():source;
    if(geometry!==source)source.dispose();
    this.transform.position.set(...position);this.transform.rotation.set(...rotation);this.transform.scale.set(...scale);this.transform.updateMatrix();
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    geometry.applyMatrix4(this.transform.matrix);
    let batch=this.batches.get(kind);
    if(!batch){batch={positions:[],normals:[],uvs:[],colors:[],features:[]};this.batches.set(kind,batch);}
    const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv,start=batch.positions.length/3;
    for(let i=0;i<p.count;i++){
      batch.positions.push(p.getX(i),p.getY(i),p.getZ(i));batch.normals.push(n.getX(i),n.getY(i),n.getZ(i));
      batch.uvs.push(uv?.getX(i)??p.getX(i)*.2+p.getZ(i)*.13,uv?.getY(i)??p.getY(i)*.25+p.getZ(i)*.09);
      const shade=.70+.30*Math.max(0,n.getY(i));
      // Crash soot collects aft and inside exposed machinery; wind scours
      // upward hull faces. Vertex wear shares the existing five batches.
      const aft=Math.max(0,Math.min(1,(-p.getZ(i)-2)/8));
      const machinery=/engine|turbine|wiring|internal/.test(name)?1:.35;
      const soot=kind==='snow'||kind==='glass'?0:aft*machinery*(.13+.16*(.5+.5*Math.sin(p.getX(i)*2.9+p.getY(i)*3.1)));
      batch.colors.push(shade-soot,shade-soot*.95,shade-soot*.88);
    }
    batch.features.push({name,start,count:p.count});geometry.dispose();
  }
  box(kind,name,position,size,rotation=[0,0,0]) {this.add(kind,name,new THREE.BoxGeometry(...size),position,rotation);}
  panel(kind,name,points) {
    const geometry=new THREE.BufferGeometry(),positions=[];
    for(let i=1;i<points.length-1;i++)positions.push(...points[0],...points[i],...points[i+1]);
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));this.add(kind,name,geometry);
  }
  strut(kind,name,from,to,radius=.065) {
    const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a);
    const rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()));
    this.add(kind,name,new THREE.CylinderGeometry(radius,radius,direction.length(),8),a.add(b).multiplyScalar(.5).toArray(),rotation.toArray().slice(0,3));
  }
  finish() {
    const group=new THREE.Group();group.name='surface-wreckage';group.userData.wreckage=true;group.userData.lengthMeters=20.5;
    const fallback={orangeMetal:0xbd7146,whiteMetal:0xcbd7d8,darkMetal:0x33434b,glass:0x244252,snow:0xe2edf1,bark:0x725747};
    for(const [kind,batch]of this.batches){
      const geometry=new THREE.BufferGeometry();
      for(const [name,key,size]of [['position','positions',3],['normal','normals',3],['uv','uvs',2],['color','colors',3]])
        geometry.setAttribute(name,new THREE.Float32BufferAttribute(batch[key],size));
      geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.userData.features=batch.features;
      const material=this.materials?.[kind]?.clone()??new THREE.MeshStandardMaterial({color:fallback[kind]});
      material.vertexColors=true;material.side=THREE.DoubleSide;
      if(kind==='glass'){material.transparent=true;material.forceSinglePass=true;material.opacity=.36;material.depthWrite=false;material.transmission=0;material.roughness=.24;}
      const mesh=new THREE.Mesh(geometry,material);mesh.name=`crash-wreck-${kind}`;mesh.receiveShadow=true;mesh.castShadow=true;group.add(mesh);
    }
    return group;
  }
}

/** A 20.5-meter crashed survey ship: tapered orange hull, framed glass canopy,
 * twin turbine pods, swept wings, torn ribs, cables and drifted snow. */
export function createCrashWreck(materials) {
  const ship=new WreckBuilder(materials);
  const rings=[[-10,2.5,.55,4.1],[-6,3.0,.45,4.5],[2,2.7,.35,3.8],[4.6,2.15,.22,3.35],[6.9,1.8,.20,1.55],[8.5,.95,.18,.90]];
  const hullProfile=[[1,.55],[.866,.85],[.5,1],[0,1],[-.5,1],[-.866,.85],[-1,.55],[-.95,.12],[-.7,0],[0,0],[.7,0],[.95,.12]];
  const point=(ring,index)=>{const [z,width,floor,roof]=ring,[x,y]=hullProfile[index%12];return [x*width,floor+y*(roof-floor),z];};
  for(let section=0;section<rings.length-1;section++)for(let side=0;side<12;side++){
    const torn=section===1&&(side===0||side===5||side===6);
    // The compact canopy and cheek plates replace the forward upper shell.
    if(torn||(section>=2&&(side<7||side===11)))continue;
    ship.panel('orangeMetal',`fuselage-panel-${section}-${side}`,
      [point(rings[section],side),point(rings[section+1],side),point(rings[section+1],side+1),point(rings[section],side+1)]);
  }
  addCompactCockpit(ship);
  addWreckInterior(ship);
  addWreckCabinDecor(ship);
  addWreckRoofCargo(ship);
  for(const [index,ring]of rings.entries())for(let side=0;side<12;side++){
    if(index>=3)continue; // The new canopy uses its own wide-pane frames.
    ship.strut('darkMetal',`pressure-frame-${index}`,point(ring,side),point(ring,side+1),.055);
    if(index<4)ship.add('whiteMetal','flush-fastener',new THREE.IcosahedronGeometry(.05,0),point(ring,side));
  }
  for(const z of [-8,-4,0]){
    for(const side of [-1,1])if(side===1||z!==0)ship.box('whiteMetal','ceramic-hull-belt',[side*2.78,2.0,z],[.14,1.35,.45],[0,0,side*.10]);
    ship.strut('darkMetal','torn-internal-rib',[-2.7,1,z],[-2.2,3.9,z],.08);
  }
  for(let cable=0;cable<9;cable++){
    const x=-2.6+cable*.14;
    ship.strut('darkMetal','exposed-wiring',[x,2.4,-.5],[x-.5,.8,1.5],.025);
    ship.strut('darkMetal','loose-wiring',[x-.5,.8,1.5],[x-.1,.25,2.3],.025);
  }
  for(const side of [-1,1]){
    const x=side*4.05;
    ship.add('darkMetal','turbine-casing',new THREE.CylinderGeometry(1.05,1.25,5.4,20,1,true),[x,1.45,-5.5],[Math.PI/2,0,0]);
    ship.add('orangeMetal','engine-armored-fairing',new THREE.CylinderGeometry(1.14,1.31,3.6,20,1,true,0,Math.PI),[x,1.45,-4.9],[Math.PI/2,0,0]);
    ship.add('darkMetal','recessed-engine-bore',new THREE.CircleGeometry(.98,20),[x,1.45,-8.23],[0,Math.PI,0]);
    for(const radius of [.38,.65,1.04])ship.add('whiteMetal','concentric-turbine-ring',new THREE.TorusGeometry(radius,.055,6,20),[x,1.45,-8.3]);
    for(let fin=0;fin<10;fin++){
      const angle=fin*Math.PI/5;
      ship.box('darkMetal','engine-cooling-fin',[x+Math.cos(angle)*1.08,1.45+Math.sin(angle)*1.08,-7.4],[.07,.38,1.1],[0,0,angle-Math.PI/2]);
    }
    ship.strut('whiteMetal','engine-pylon',[side*2.3,1.4,-4.6],[x,1.2,-5.5],.24);
    const tip=side>0?8.7:6.8;
    ship.panel('orangeMetal','swept-impact-wing',WRECK_WINGS.find(wing=>wing.side===side).points);
    ship.panel('whiteMetal','wing-ceramic-strip',[[side*3.5,.92,-.5],[side*(tip-.4),.25,-3.2],[side*(tip-.3),.25,-3.7],[side*3.6,.91,-1.1]]);
    ship.strut('darkMetal','exposed-wing-spar',[side*2.8,.6,-4.6],[side*tip,.15,-5.2],.1);
  }
  for(const side of [-1,1]){
    for(let vent=0;vent<6;vent++)ship.box('darkMetal','recessed-hull-vent',[side*2.81,1.65,-2.7+vent*.20],[.035,.42,.09],[0,0,side*.08]);
    for(let pipe=0;pipe<4;pipe++)ship.strut('whiteMetal','exposed-engine-feed',[side*(2.0+pipe*.17),1.05,-2.7],[side*(2.5+pipe*.12),2.1,-5.6],.06);
    ship.box('whiteMetal','tail-ceramic-stripe',[side*.16,5.0,-10.25],[.035,.38,2.7]);
    for(const z of [-7.8,-5.2])ship.panel('orangeMetal','torn-aft-skin',[[side*2.7,1.2,z],[side*3.25,2.9,z-.8],[side*2.2,3.65,z-.3],[side*2.45,1.6,z+.5]]);
  }
  for(const x of [-.14,.14])ship.panel('orangeMetal','broken-vertical-tail',[[x,2.1,-9.6],[x,7.3,-11.9],[x,7.0,-8.4],[x,3,-4.8]]);
  ship.panel('whiteMetal','tail-identification-band',[[-.15,5.3,-11.0],[-.15,5.9,-11.3],[-.15,5.7,-8.2],[-.15,5.1,-7.8]]);
  ship.panel('orangeMetal','peeled-hull-panel',[[-2.9,2.8,-2],[-3.6,2.3,-3.4],[-3.9,1.1,-1.5],[-2.8,1.8,.1]]);
  ship.panel('whiteMetal','detached-forward-shard',[[-8,.1,3.3],[-5.9,.15,2.1],[-5,.12,5.1],[-7.7,.12,6.2]]);
  for(const [x,z]of [[-4,4],[-6,-1],[5,2],[7,-8],[-3,7.8]])
    ship.box('orangeMetal','scattered-impact-panel',[x,.12,z],[1.0,.12,1.5],[0,x*.31,.03]);
  for(const [x,z]of [[-1.3,-8],[1.4,-5],[0,-1],[3.7,-4],[6,-4.8],[-5,-3.8]])
    ship.add('snow','wind-packed-frost',new THREE.IcosahedronGeometry(1,1),[x,Math.abs(x)>3?.32:4.0,z],[.08,0,.1],[1.0,.075,1.5]);
  addWreckWingNests(ship);
  return applyWreckCabinDecorTints(ship.finish());
}
