import * as THREE from './vendor/three.module.js';
import {SPIRES_SUBMARINE_PARTS} from './jelly-spires-submarine.js';

const UP=new THREE.Vector3(0,1,0);
const PALETTE=Object.freeze({paint:0x718985,metal:0x65716f,rust:0x93563b,glass:0x142e32});
const SCAR_COLOR=new THREE.Color(0x87543d),SILT_COLOR=new THREE.Color(0x5e6250);
const point=(x,y,z)=>new THREE.Vector3(x,y,z);

/** Static pressure-hull details merge into four opaque material batches. */
class SubmarineMesh {
  constructor(){this.batches=new Map();this.pose=new THREE.Object3D();this.color=new THREE.Color();}
  add(kind,name,source,color=PALETTE[kind],position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
    const geometry=source.index?source.toNonIndexed():source;
    if(geometry!==source)source.dispose();
    this.pose.position.fromArray(position);this.pose.rotation.set(...rotation);this.pose.scale.fromArray(scale);this.pose.updateMatrix();geometry.applyMatrix4(this.pose.matrix);
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    const p=geometry.attributes.position,n=geometry.attributes.normal;
    let batch=this.batches.get(kind);
    if(!batch){batch={position:[],normal:[],color:[],uv:[],features:[]};this.batches.set(kind,batch);}
    const first=batch.position.length/3,base=new THREE.Color(color);
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);
      if(![x,y,z,nx,ny,nz].every(Number.isFinite))throw new TypeError(`Submarine ${name} contains a non-finite surface.`);
      const grain=.87+.08*Math.sin(x*17.3+y*11.7+z*7.1)**2+.05*Math.sin(x*2.9-z*1.3+y*.8)**2;
      const silt=Math.max(0,Math.min(1,(-y+.1)/2.8))*.22;
      this.color.copy(base).multiplyScalar(grain-silt);
      if(kind==='paint'){
        const scar=Math.sin(z*2.4+x*7.1)*Math.sin(y*13.2-z*.7);
        if(scar>.66)this.color.lerp(SCAR_COLOR,(scar-.66)*1.8);
        if(y<-.9)this.color.lerp(SILT_COLOR,Math.min(.32,(-y-.9)*.2));
      }
      batch.position.push(x,y,z);batch.normal.push(nx,ny,nz);batch.color.push(this.color.r,this.color.g,this.color.b);
      batch.uv.push((Math.abs(nx)>Math.abs(nz)?z:x)*.35,(Math.abs(ny)>.65?z:y)*.35);
    }
    batch.features.push({name,first,count:p.count});geometry.dispose();
  }
  solid(part){
    if(!part||!PALETTE[part.material]||!Array.isArray(part.vertices)||!Array.isArray(part.indices))
      throw new TypeError('Submarine anatomy requires named, indexed shared solid parts.');
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.vertices,3));geometry.setIndex(part.indices);
    const source=geometry.toNonIndexed();geometry.dispose();
    const normals=new Float32Array(source.attributes.position.count*3);
    for(let face=0;face<part.indices.length/3;face++)for(let corner=0;corner<3;corner++)
      normals.set(part.normals.slice(face*3,face*3+3),(face*3+corner)*3);
    source.setAttribute('normal',new THREE.BufferAttribute(normals,3));
    this.add(part.material,part.id,source);
  }
  box(kind,name,position,size,color=PALETTE[kind],rotation=[0,0,0]){this.add(kind,name,new THREE.BoxGeometry(...size),color,position,rotation);}
  strut(kind,name,start,end,radius,color=PALETTE[kind],segments=7){
    const a=new THREE.Vector3().fromArray(start),b=new THREE.Vector3().fromArray(end),direction=b.clone().sub(a);
    if(direction.lengthSq()<1e-8)return;
    this.add(kind,name,new THREE.CylinderGeometry(radius,radius,direction.length(),segments),color,
      a.add(b).multiplyScalar(.5).toArray(),rotationTo(direction.normalize()));
  }
  finish(materials){
    const group=new THREE.Group();group.name='old-flooded-exploration-submarine';
    for(const[kind,batch]of this.batches){
      const geometry=new THREE.BufferGeometry();
      for(const[name,size]of[['position',3],['normal',3],['color',3],['uv',2]])geometry.setAttribute(name,new THREE.Float32BufferAttribute(batch[name],size));
      geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.userData.features=batch.features;
      const mesh=new THREE.Mesh(geometry,materials[kind]);mesh.name=`old-submarine-${kind}`;mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
    }
    return group;
  }
}

/** Radial attachments sample the exact shared shell triangles. Missing sectors
 * return no hit, so cosmetic seams, rivets and portholes never span a breach.
 */
function shellSampler(parts,inside=false){
  const shells=parts.filter(part=>part.kind==='hull-sector');
  const ray=new THREE.Ray(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),hit=new THREE.Vector3();
  return(angle,z)=>{
    ray.origin.set(0,0,z);ray.direction.set(Math.sin(angle),Math.cos(angle),0);
    let distance=inside?Infinity:-Infinity,result=null;
    for(const part of shells){
      if(z<part.bounds.minZ-.001||z>part.bounds.maxZ+.001)continue;
      for(let triangle=0;triangle<part.indices.length;triangle+=3){
        a.fromArray(part.vertices,part.indices[triangle]*3);b.fromArray(part.vertices,part.indices[triangle+1]*3);c.fromArray(part.vertices,part.indices[triangle+2]*3);
        if(!ray.intersectTriangle(a,b,c,false,hit))continue;
        const span=hit.distanceToSquared(ray.origin);
        if(inside?span<distance:span>distance){distance=span;result={position:hit.clone(),normal:new THREE.Vector3().fromArray(part.normals,triangle)};}
      }
    }
    return result;
  };
}

function rotationTo(normal){return new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,normal)).toArray().slice(0,3);}

function addShellFittings(builder,sample){
  for(const z of[-10.75,-7.2,-3.25,4.25,7.5]){
    const seam=[];
    for(let step=0;step<=40;step++)seam.push(sample(step*Math.PI/20,z));
    for(let step=0;step<40;step++){
      const first=seam[step],second=seam[step+1];if(!first||!second)continue;
      const a=first.position.clone().addScaledVector(first.normal,.008),b=second.position.clone().addScaledVector(second.normal,.008);
      const positions=[a.x,a.y,z-.022,b.x,b.y,z+.022,b.x,b.y,z-.022,a.x,a.y,z-.022,a.x,a.y,z+.022,b.x,b.y,z+.022];
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
      builder.add('metal','pressure-hull-weld-seam',geometry,0x46534f);
    }
    for(let bolt=0;bolt<12;bolt++){
      const surface=sample(bolt*Math.PI/6,z);if(!surface)continue;
      builder.add('rust','worn-pressure-seam-fastener',new THREE.CylinderGeometry(.034,.034,.025,6),0x82523a,
        surface.position.clone().addScaledVector(surface.normal,.017).toArray(),rotationTo(surface.normal));
    }
  }
  for(const side of[-1,1])for(const z of[-8,-4.8,5.6,8.3]){
    const surface=sample(side*Math.PI*.4,z);if(!surface)continue;
    const rotation=new THREE.Quaternion().setFromUnitVectors(point(0,0,1),surface.normal),euler=new THREE.Euler().setFromQuaternion(rotation).toArray().slice(0,3);
    builder.add('metal','small-bolted-pressure-porthole-rim',new THREE.TorusGeometry(.195,.035,6,16),0x74786b,
      surface.position.clone().addScaledVector(surface.normal,.04).toArray(),euler);
    builder.add('glass','recessed-dark-porthole-glazing',new THREE.CircleGeometry(.157,20),0x183238,
      surface.position.clone().addScaledVector(surface.normal,.038).toArray(),euler);
    for(let bolt=0;bolt<6;bolt++){
      const offset=point(Math.cos(bolt*Math.PI/3)*.198,Math.sin(bolt*Math.PI/3)*.198,.065).applyQuaternion(rotation);
      builder.add('rust','porthole-rim-rust-bolt',new THREE.SphereGeometry(.026,6,4),0xa46a43,surface.position.clone().add(offset).toArray());
    }
  }
}

function addEncrustation(builder,sample){
  const pattern=[[-.17,-.10],[-.02,-.13],[.13,-.08],[-.12,.06],[.04,.03],[.18,.09]];
  for(const angle of[Math.PI*.6,Math.PI*1.4])for(const z of[-7,6.2]){
    const surface=sample(angle,z);if(!surface)continue;
    const rotation=rotationTo(surface.normal),q=new THREE.Quaternion().setFromUnitVectors(UP,surface.normal);
    for(const[index,[dx,dz]]of pattern.entries()){
      const size=.75+(index%3)*.15,offset=point(dx,0,dz).applyQuaternion(q);
      const root=surface.position.clone().add(offset).addScaledVector(surface.normal,.015);
      builder.add('paint','old-attached-barnacle-shell',new THREE.CylinderGeometry(.052,.085,.13,6,1,true),0xb3b4a0,
        root.clone().addScaledVector(surface.normal,.065*size).toArray(),rotation,[size,size,size]);
      const mouth=new THREE.CircleGeometry(.041,8);mouth.rotateX(-Math.PI/2);
      builder.add('glass','barnacle-shell-dark-mouth',mouth,0x283b32,root.clone().addScaledVector(surface.normal,.13*size).toArray(),rotation,[size,size,size]);
    }
  }
}

/** Shallow controls are attached to actual inner hull faces. Their fittings are
 * too small to obstruct a swimmer; substantial cabinets/bench/shelves above are
 * shared solids with gameplay, rather than decorative collision-free boxes.
 */
function addInteriorFittings(builder,sample){
  const mounted=(kind,name,geometry,color,surface,offset)=>{
    const q=new THREE.Quaternion().setFromUnitVectors(point(0,0,1),surface.normal);
    const position=new THREE.Vector3().fromArray(offset).applyQuaternion(q).add(surface.position);
    builder.add(kind,name,geometry,color,position.toArray(),new THREE.Euler().setFromQuaternion(q).toArray().slice(0,3));
  };
  for(const [panelIndex,z] of [-8.9,-1.9,4.9].entries()){
    const surface=sample(-Math.PI*.5,z);if(!surface)continue;
    mounted('paint','interior-switch-panel',new THREE.BoxGeometry(.8,.7,.045),0x5d706d,surface,[0,.12,.045]);
    for(let gauge=0;gauge<3;gauge++){
      const x=(gauge-1)*.23,y=.26;
      mounted('metal','analog-pressure-gauge-rim',new THREE.TorusGeometry(.086,.014,5,14),0x9a9c85,surface,[x,y,.082]);
      mounted('paint','analog-pressure-gauge-dial',new THREE.CircleGeometry(.074,16),0xb6b6a0,surface,[x,y,.081]);
      const angle=-.8+gauge*.6+panelIndex*.23;
      const needle=new THREE.BoxGeometry(.008,.10,.004);needle.rotateZ(angle);
      mounted('glass','frozen-pressure-gauge-needle',needle,0x253b36,surface,[x+.018*Math.sin(angle),y-.018*Math.cos(angle),.087]);
    }
    for(let toggle=0;toggle<4;toggle++){
      mounted('glass','old-switch-recess',new THREE.BoxGeometry(.075,.12,.014),0x273b37,surface,[(toggle-1.5)*.16,-.04,.076]);
      const lever=new THREE.CylinderGeometry(.011,.011,.075,5);lever.rotateX(.63);
      mounted('metal','corroded-control-toggle',lever,0x929682,surface,[(toggle-1.5)*.16,-.025,.11]);
    }
    mounted('rust','panel-faded-warning-strip',new THREE.BoxGeometry(.56,.035,.006),0xa27648,surface,[0,-.15,.072]);
  }

  // Door furniture is thin and remains attached to the solid locker fronts.
  for(const z of[-6.3,-4.3]){
    builder.box('metal','locker-door-frame',[-1.509,-.535,z],[.026,1.36,1.24],0x475b56);
    builder.box('paint','locker-recessed-door',[-1.489,-.535,z],[.025,1.25,1.12],0x718079);
    builder.strut('rust','locker-pull-handle',[-1.445,-.65,z+.38],[-1.445,-.40,z+.38],.022,0x9a7952);
    for(let louver=0;louver<5;louver++)builder.box('glass','locker-vent-slot',[-1.471,-.05-louver*.064,z],[.012,.022,.62],0x2f4540);
  }
  for(const z of[-.15,.6,1.35]){
    builder.box('rust','shelf-box-lid',[-1.85,-.105,z],[.49,.025,.58],0x8b7353);
    builder.box('metal','shelf-box-latch',[-1.61,-.27,z],[.025,.095,.065],0x9c9d88);
  }
  for(let slat=0;slat<4;slat++)builder.box('metal','bench-worn-seat-slat',[1.64+slat*.17,-.708,6.5],[.025,.012,2.79],0x9a9d8e);

  // Bow instruments are bolted to the surviving slanted console top.
  const consoleQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.18,0,0));
  const consoleNormal=UP.clone().applyQuaternion(consoleQ),consoleOrigin=point(-.8,.08,11.1).addScaledVector(consoleNormal,.05);
  const consoleSurface={position:consoleOrigin,normal:consoleNormal};
  for(const x of[-.30,0,.30]){
    mounted('metal','bow-console-gauge-rim',new THREE.TorusGeometry(.104,.014,5,14),0x929886,consoleSurface,[x,0,.015]);
    mounted('paint','bow-console-gauge-dial',new THREE.CircleGeometry(.09,16),0xb2b49f,consoleSurface,[x,0,.014]);
    mounted('glass','bow-console-gauge-needle',new THREE.BoxGeometry(.008,.12,.004),0x294039,consoleSurface,[x,.02,.02]);
  }

  // Longitudinal pipes follow the shell, with a deliberate break across the
  // missing starboard hull section. All valve wheels stay above the aisle.
  for(const [angle,runs] of [[-.36*Math.PI,[[-10.4,11.6]]],[.36*Math.PI,[[-10.4,-3.35],[4.35,11.6]]],[-.10*Math.PI,[[-10.4,12.2]]]]){
    for(const [start,end] of runs){
      const a=sample(angle,start),b=sample(angle,end);if(!a||!b)continue;
      const pa=a.position.clone().addScaledVector(a.normal,.065),pb=b.position.clone().addScaledVector(b.normal,.065);
      builder.strut('metal','interior-longitudinal-pipe',pa.toArray(),pb.toArray(),.048,0x6c8076,8);
      for(let z=start+.6;z<end;z+=2.8){
        const surface=sample(angle,z);if(!surface)continue;
        mounted('rust','pipe-wall-clamp',new THREE.BoxGeometry(.19,.08,.035),0x8d6947,surface,[0,0,.04]);
      }
    }
  }
  for(const z of[-7.9,6.1]){
    const surface=sample(-.36*Math.PI,z);if(!surface)continue;
    mounted('rust','interior-isolation-valve-wheel',new THREE.TorusGeometry(.14,.018,5,14),0x926847,surface,[0,0,.19]);
    for(const angle of[0,Math.PI/3,Math.PI*2/3]){
      const spoke=new THREE.BoxGeometry(.25,.015,.016);spoke.rotateZ(angle);
      mounted('metal','valve-wheel-spoke',spoke,0x839182,surface,[0,0,.19]);
    }
    mounted('metal','valve-stem',new THREE.CylinderGeometry(.025,.025,.16,6).rotateX(Math.PI/2),0x6c8076,surface,[0,0,.12]);
  }
  for(const [angle,start,end] of [[-.23*Math.PI,-10.2,10.8],[.16*Math.PI,4.5,11.8]]){
    const points=[];
    for(let step=0;step<9;step++){
      const z=start+(end-start)*step/8,surface=sample(angle,z);if(!surface)continue;
      points.push(surface.position.clone().addScaledVector(surface.normal,.07+.09*Math.sin(step*Math.PI/2)**2));
    }
    if(points.length>2)builder.add('glass','slack-ceiling-control-cable',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.021,5,false),0x354d45);
  }
}

function createMaterials(library,decorateMaterial){
  const sources={paint:library.whiteMetal??library.darkMetal,metal:library.darkMetal??library.whiteMetal,
    rust:library.orangeMetal??library.darkMetal,glass:library.darkMetal};
  const result={};
  for(const kind of Object.keys(PALETTE)){
    const source=sources[kind],material=source?.isMeshStandardMaterial?source.clone():new THREE.MeshStandardMaterial();
    material.name=`old-submarine-${kind}-surface`;material.color.setHex(0xffffff);material.vertexColors=true;
    material.transparent=false;material.opacity=1;material.depthWrite=true;material.side=THREE.FrontSide;
    material.metalness=kind==='metal'?.4:kind==='glass'?.22:.12;
    material.roughness=kind==='glass'?.24:kind==='metal'?.77:.94;
    material.emissive.setHex(0);material.emissiveIntensity=0;
    if(material.isMeshPhysicalMaterial){material.transmission=0;material.clearcoat=0;material.sheen=0;}
    decorateMaterial?.(material);result[kind]=material;
  }
  return result;
}

/** A flooded industrial submarine built from the collision helper's exact
 * metal sectors, surviving deck, tower, fins and separate bent stern. Only
 * shallow seams, controls, wall pipes and attached crusts are cosmetic additions.
 * The caller owns four geometries/material clones; all texture maps are borrowed.
 */
export function createSubmarineAnatomy(materialLibrary={}, {decorateMaterial}={}){
  const materials=createMaterials(materialLibrary,decorateMaterial),builder=new SubmarineMesh();
  for(const part of SPIRES_SUBMARINE_PARTS)builder.solid(part);
  const sample=shellSampler(SPIRES_SUBMARINE_PARTS);addShellFittings(builder,sample);addEncrustation(builder,sample);
  addInteriorFittings(builder,shellSampler(SPIRES_SUBMARINE_PARTS,true));
  const group=builder.finish(materials);group.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(group);
  group.userData={design:'old flooded exploration submarine',surfaceBatches:group.children.length,
    sharedSolidParts:SPIRES_SUBMARINE_PARTS.length,realHullOpenings:true,detachedStern:true,floodedInterior:true,
    bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
  return group;
}

/** Release only model-owned surfaces, never the shared library's texture maps. */
export function disposeSubmarineAnatomy(group){
  if(!group||group.userData.disposed)return;group.userData.disposed=true;
  for(const mesh of group.children){mesh.geometry?.dispose();mesh.material?.dispose();}
  group.removeFromParent();group.clear();
}
