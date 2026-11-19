import * as THREE from './vendor/three.module.js';

/** Courier model frame: render metres, Y up, nose toward -Z. */
export const FALLING_SHIP_LENGTH=14.8;

const SURFACES=Object.freeze(['orangeMetal','whiteMetal','darkMetal','glass']);
const TRIANGLE_LIMIT=3500;

/** Copy transformed primitives into four owned surface buffers. */
class CourierBuilder{
  constructor(){this.batches=new Map();this.pose=new THREE.Object3D();}
  add(surface,name,source,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
    if(!SURFACES.includes(surface))throw new TypeError(`Unknown falling-ship surface: ${surface}`);
    const geometry=source.index?source.toNonIndexed():source;if(geometry!==source)source.dispose();
    this.pose.position.fromArray(position);this.pose.rotation.set(...rotation);this.pose.scale.fromArray(scale);this.pose.updateMatrix();geometry.applyMatrix4(this.pose.matrix);
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    let batch=this.batches.get(surface);
    if(!batch){batch={position:[],normal:[],uv:[],color:[],features:[]};this.batches.set(surface,batch);}
    const p=geometry.attributes.position,n=geometry.attributes.normal,start=batch.position.length/3;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);
      batch.position.push(x,y,z);batch.normal.push(nx,ny,nz);
      const side=Math.abs(nx)>Math.abs(ny)&&Math.abs(nx)>Math.abs(nz);
      batch.uv.push((side?z:x)*.35,(Math.abs(ny)>.7?z:y)*.35);
      const soot=surface==='glass'?0:Math.max(0,x)*.09*Math.exp(-(((z-.7)/2)**2));
      const wear=surface==='glass'?1:.76+.18*Math.max(0,ny)+.06*Math.sin(x*3.1+z*2.4)**2;
      batch.color.push(wear-soot,wear-soot*.93,wear-soot*.84);
    }
    batch.features.push({name,start,count:p.count});geometry.dispose();
  }
  box(surface,name,position,size,rotation=[0,0,0]){this.add(surface,name,new THREE.BoxGeometry(...size),position,rotation);}
  panel(surface,name,points){
    const positions=[];for(let i=1;i<points.length-1;i++)positions.push(...points[0],...points[i],...points[i+1]);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));this.add(surface,name,geometry);
  }
  beam(surface,name,from,to,radius=.035,sides=4){
    const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a);
    const rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()));
    this.add(surface,name,new THREE.CylinderGeometry(radius,radius,direction.length(),sides),a.add(b).multiplyScalar(.5).toArray(),[rotation.x,rotation.y,rotation.z]);
  }
  finish(){
    const result={};let triangles=0;
    try{
      for(const surface of SURFACES){
        const batch=this.batches.get(surface);if(!batch)throw new Error(`Falling courier has no ${surface} geometry.`);
        const geometry=new THREE.BufferGeometry();result[surface]=geometry;
        for(const[name,size]of[['position',3],['normal',3],['uv',2],['color',3]]){
          if(!batch[name].every(Number.isFinite))throw new Error(`Falling courier ${surface} has non-finite ${name}.`);
          geometry.setAttribute(name,new THREE.Float32BufferAttribute(batch[name],size));
        }
        triangles+=batch.position.length/9;geometry.computeBoundingBox();geometry.computeBoundingSphere();
        geometry.userData.features=batch.features;geometry.userData.model='damaged-courier';geometry.userData.frontAxis='-Z';
      }
      if(triangles>TRIANGLE_LIMIT)throw new RangeError(`Falling courier exceeds ${TRIANGLE_LIMIT} triangles: ${triangles}.`);
      return Object.freeze(result);
    }catch(error){for(const geometry of Object.values(result))geometry.dispose();throw error;}
  }
}

/** Four geometries only: callers own and dispose every returned surface.
 * No materials, maps, lights or mobile-specific alternative are allocated. */
export function createFallingShipGeometry(){
  const ship=new CourierBuilder();
  const rings=[[-8,.62,-.50,.40],[-6,1.25,-.85,.68],[-2.8,1.72,-.96,1.45],
    [2.6,1.75,-.96,1.30],[5.8,1.45,-.82,.94],[6.8,.95,-.60,.60]];
  const profile=[[1,.24],[.68,.90],[0,1],[-.68,.90],[-1,.24],[-.75,0],[0,0],[.75,0]];
  const at=(ring,index)=>{const[z,width,bottom,top]=ring,[x,y]=profile[index%8];return[x*width,bottom+y*(top-bottom),z];};
  for(let section=0;section<rings.length-1;section++)for(let side=0;side<8;side++){
    if(section===1&&side<4)continue; // Actual glazed cockpit opening.
    if(section===2&&side===0)continue; // Torn starboard machinery bay.
    ship.panel(side>=4?'darkMetal':'orangeMetal',`courier-hull-panel-${section}-${side}`,
      [at(rings[section],side),at(rings[section+1],side),at(rings[section+1],side+1),at(rings[section],side+1)]);
  }
  ship.panel('orangeMetal','courier-blunt-nose',profile.map((_,index)=>at(rings[0],index)));
  ship.panel('darkMetal','courier-rear-pressure-cap',profile.map((_,index)=>at(rings.at(-1),7-index)));
  for(const ring of rings.slice(1,-1))for(let side=0;side<8;side++){
    if(ring[0]===-6&&side<4)continue;
    ship.beam('whiteMetal','courier-recessed-hull-seam',at(ring,side),at(ring,side+1),.018,4);
  }

  // Four broad cockpit panes retain dark framing and a visible interior floor.
  ship.box('darkMetal','courier-cockpit-floor',[0,-.10,-4.3],[2.5,.14,2.8]);
  ship.box('darkMetal','courier-cockpit-dashboard',[0,.38,-5.45],[1.8,.20,.38]);
  ship.box('whiteMetal','courier-flight-seat-headrest',[0,.62,-3.55],[.42,.50,.20]);
  for(const side of[-1,1]){
    const front=[side*1.15,.55,-5.95],rear=[side*1.25,1.42,-2.83];
    const windshield=[[side*.08,.75,-6.02],front,rear,[side*.08,1.65,-2.83]];
    const sideWindow=[front,[side*1.50,.78,-2.80],rear];
    ship.panel('glass','courier-front-windscreen',windshield);ship.panel('glass','courier-side-window',sideWindow);
    for(const pane of[windshield,sideWindow])for(let edge=0;edge<pane.length;edge++)
      ship.beam('darkMetal','courier-cockpit-frame',pane[edge],pane[(edge+1)%pane.length],.035,4);
    ship.panel('orangeMetal','courier-cockpit-armored-cheek',[[side*1.25,-.48,-6],[side*1.72,-.38,-2.8],[side*1.50,.78,-2.8],front]);
    ship.panel('whiteMetal','courier-cockpit-roof-strip',[[side*.08,1.65,-2.83],rear,[side*1.2,1.40,-2.45],[side*.08,1.47,-2.45]]);
    ship.box('whiteMetal','courier-nose-lamp-housing',[side*.55,.12,-7.55],[.22,.16,.18],[0,side*.14,0]);
  }

  // The ripped bay exposes supported ribs, conduits and a scorched inner wall.
  ship.box('darkMetal','courier-exposed-machinery-backing',[1.36,.10,.2],[.12,1.15,3.1]);
  for(const z of[-1.8,-.6,.6,1.8]){
    ship.beam('whiteMetal','courier-torn-bay-rib',[1.65,-.38,z],[1.72,1.12,z],.04,4);
    ship.box('darkMetal','courier-internal-equipment-cell',[1.49,.15,z],[.20,.56,.48]);
  }
  for(let pipe=0;pipe<3;pipe++)ship.beam('orangeMetal','courier-exposed-feed-line',[1.62,-.15+pipe*.22,-2],[1.64,-.10+pipe*.22,2.15],.025,4);
  ship.panel('orangeMetal','courier-peeled-bay-skin',[[1.74,-.35,-1.7],[2.12,.46,-1.1],[1.92,.82,.35],[1.73,-.22,1.0]]);

  for(const side of[-1,1]){
    // Compact swept wings keep the distant courier silhouette recognizable.
    const wing=[[side*1.4,-.40,-.2],[side*4.35,-.52,1.15],[side*4.0,-.50,2.3],[side*1.4,-.38,2.65]];
    ship.panel('orangeMetal','courier-short-wing-top',wing);
    ship.panel('darkMetal','courier-short-wing-underside',wing.map(([x,y,z])=>[x,y-.12,z]).reverse());
    for(let edge=0;edge<wing.length;edge++){
      const a=wing[edge],b=wing[(edge+1)%wing.length];
      ship.panel('whiteMetal','courier-wing-edge',[[...a],[...b],[b[0],b[1]-.12,b[2]],[a[0],a[1]-.12,a[2]]]);
    }
    ship.panel('whiteMetal','courier-wing-identification-band',[[side*2.7,-.445,.45],[side*3.12,-.465,.65],[side*2.9,-.425,2.43],[side*2.55,-.415,2.46]]);
    ship.beam('darkMetal','courier-engine-mount',[side*1.45,-.25,3.0],[side*2.15,-.12,3.3],.14,6);
    const x=side*2.15,y=-.05,z=4.25;
    ship.add('darkMetal','courier-engine-casing',new THREE.CylinderGeometry(.63,.68,4.4,14,1,true),[x,y,z],[Math.PI/2,0,0]);
    ship.add('orangeMetal','courier-engine-armor',new THREE.CylinderGeometry(.65,.71,2.5,10,1,true,0,side>0?Math.PI*1.35:Math.PI*1.8),[x,y,z-.5],[Math.PI/2,0,0]);
    ship.add('darkMetal','courier-engine-intake',new THREE.CircleGeometry(.57,12),[x,y,z-2.15],[0,Math.PI,0]);
    ship.add('darkMetal','courier-engine-dark-throat',new THREE.CircleGeometry(.52,12),[x,y,z+1.85]);
    ship.add('whiteMetal','courier-engine-nozzle',new THREE.TorusGeometry(.62,.055,4,14),[x,y,z+2.17]);
    ship.add('whiteMetal','courier-engine-intake-rim',new THREE.TorusGeometry(.59,.035,4,12),[x,y,z-2.18]);
    for(let blade=0;blade<6;blade++){
      const angle=blade*Math.PI/3;
      ship.box('darkMetal','courier-recessed-turbine-vane',[x+Math.cos(angle)*.30,y+Math.sin(angle)*.30,z+2.04],[.06,.37,.08],[0,0,angle-Math.PI/2]);
    }
    ship.box('darkMetal','courier-collapsed-landing-runner',[side*1.15,-1.0,.2],[.18,.10,4.6]);
  }

  // Two restrained cargo pods and copper-coloured ties identify a small courier.
  for(const side of[-1,1]){
    const x=side*.82;
    ship.box('whiteMetal','courier-roof-cargo-pod',[x,1.55,2.05],[.95,.50,1.8],[0,0,side*.025]);
    ship.box('darkMetal','courier-cargo-lock',[x,1.57,1.135],[.25,.15,.035]);
    for(const z of[1.5,2.6]){
      ship.panel('orangeMetal','courier-copper-cargo-restraint',[[x-.53,1.30,z-.06],[x-.53,1.82,z-.06],[x-.53,1.82,z+.06],[x-.53,1.30,z+.06]]);
      ship.panel('orangeMetal','courier-copper-cargo-restraint',[[x-.53,1.82,z-.06],[x+.53,1.82,z-.06],[x+.53,1.82,z+.06],[x-.53,1.82,z+.06]]);
      ship.panel('orangeMetal','courier-copper-cargo-restraint',[[x+.53,1.82,z-.06],[x+.53,1.30,z-.06],[x+.53,1.30,z+.06],[x+.53,1.82,z+.06]]);
    }
  }
  for(const x of[-.055,.055])ship.panel('orangeMetal','courier-short-tail-fin',[[x,.70,4.6],[x,2.6,5.45],[x,2.0,6.8],[x,.60,6.8]]);
  ship.panel('whiteMetal','courier-tail-marking',[[-.058,1.40,5.48],[-.058,1.70,5.62],[-.058,1.50,6.45],[-.058,1.24,6.45]]);
  return ship.finish();
}
