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
function shellSampler(parts){
  const shells=parts.filter(part=>part.kind==='hull-sector');
  const ray=new THREE.Ray(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),hit=new THREE.Vector3();
  return(angle,z)=>{
    ray.origin.set(0,0,z);ray.direction.set(Math.sin(angle),Math.cos(angle),0);
    let distance=-Infinity,result=null;
    for(const part of shells){
      if(z<part.bounds.minZ-.001||z>part.bounds.maxZ+.001)continue;
      for(let triangle=0;triangle<part.indices.length;triangle+=3){
        a.fromArray(part.vertices,part.indices[triangle]*3);b.fromArray(part.vertices,part.indices[triangle+1]*3);c.fromArray(part.vertices,part.indices[triangle+2]*3);
        if(!ray.intersectTriangle(a,b,c,false,hit))continue;
        const span=hit.distanceToSquared(ray.origin);
        if(span>distance){distance=span;result={position:hit.clone(),normal:new THREE.Vector3().fromArray(part.normals,triangle)};}
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
 * shallow seams, porthole rims and attached crusts are cosmetic additions.
 * The caller owns four geometries/material clones; all texture maps are borrowed.
 */
export function createSubmarineAnatomy(materialLibrary={}, {decorateMaterial}={}){
  const materials=createMaterials(materialLibrary,decorateMaterial),builder=new SubmarineMesh();
  for(const part of SPIRES_SUBMARINE_PARTS)builder.solid(part);
  const sample=shellSampler(SPIRES_SUBMARINE_PARTS);addShellFittings(builder,sample);addEncrustation(builder,sample);
  const group=builder.finish(materials);group.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(group);
  group.userData={design:'old flooded exploration submarine',surfaceBatches:group.children.length,
    sharedSolidParts:SPIRES_SUBMARINE_PARTS.length,realHullOpenings:true,detachedStern:true,
    bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
  return group;
}

/** Release only model-owned surfaces, never the shared library's texture maps. */
export function disposeSubmarineAnatomy(group){
  if(!group||group.userData.disposed)return;group.userData.disposed=true;
  for(const mesh of group.children){mesh.geometry?.dispose();mesh.material?.dispose();}
  group.removeFromParent();group.clear();
}
