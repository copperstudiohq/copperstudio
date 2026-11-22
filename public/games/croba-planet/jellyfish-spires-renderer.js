import * as THREE from './vendor/three.module.js';
import { JELLYFISH_SPIRES_SPIRES } from './jellyfish-spires-data.js';

/** One shared rock draw with pooled whole-spire indices. Geometry comes from
 * the same offline faces used for contact and barnacle anchors; no world or
 * material textures are generated here.
 */
export class JellyfishSpiresRenderer {
  constructor(_world = {}, { material, decorateMaterial } = {}) {
    this.group = new THREE.Group(); this.group.name = 'jellyfish-spires-volcanic-rock';
    this.disposed = false; this.entries = [];
    const positions=[],normals=[],colors=[],uvs=[],tint=new THREE.Color(0x79818a);
    for(const spire of JELLYFISH_SPIRES_SPIRES){
      const start=positions.length/3;
      for(let face=0;face<spire.indices.length;face+=3){
        const shade=.82+.1*Math.max(0,spire.normals[face+2])+.08*((face*.61803398875)%1);
        // Swapping simulation Y/Z reverses winding; emit the reflected face in
        // reverse order while reflecting its true outward normal identically.
        for(const corner of[0,2,1]){
          const i=spire.indices[face+corner]*3,x=spire.vertices[i],y=spire.vertices[i+1],z=spire.vertices[i+2];
          positions.push(x/25,z/25,y/25);
          normals.push(spire.normals[face],spire.normals[face+2],spire.normals[face+1]);
          colors.push(tint.r*shade,tint.g*shade,tint.b*shade);uvs.push((x-spire.x)/100,z/100);
        }
      }
      const b=spire.bounds,box=new THREE.Box3(new THREE.Vector3(b.minX/25,b.minZ/25,b.minY/25),
        new THREE.Vector3(b.maxX/25,b.maxZ/25,b.maxY/25));
      this.entries.push({id:spire.id,start,count:positions.length/3-start,box,sphere:box.getBoundingSphere(new THREE.Sphere()),visible:null});
    }
    this.geometry=new THREE.BufferGeometry();
    for(const[name,values,size]of[['position',positions,3],['normal',normals,3],['color',colors,3],['uv',uvs,2]])
      this.geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,size));
    this.index=new THREE.BufferAttribute(new Uint32Array(positions.length/3),1);this.index.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setIndex(this.index);this.geometry.boundingBox=new THREE.Box3();this.geometry.boundingSphere=new THREE.Sphere();
    this.geometry.userData={prepared:true,spires:JELLYFISH_SPIRES_SPIRES.length,triangles:positions.length/9};
    this.material=material?.isMaterial?material.clone():new THREE.MeshStandardMaterial();
    this.material.name='neutral-gray-volcanic-spires';this.material.color.setHex(0xffffff);
    this.material.map=null;this.material.vertexColors=true;this.material.roughness=.98;this.material.metalness=.01;
    this.material.flatShading=true;decorateMaterial?.(this.material);
    this.mesh=new THREE.Mesh(this.geometry,this.material);this.mesh.name='jellyfish-spires-shared-rock-batch';
    this.mesh.castShadow=false;this.mesh.receiveShadow=true;this.group.add(this.mesh);
    this.visibleBounds=new THREE.Box3();this.update();
  }

  update(_world, camera, range = 180) {
    if(this.disposed)return;
    const eye=camera?.position??camera,hasEye=eye&&Number.isFinite(eye.x)&&Number.isFinite(eye.y)&&Number.isFinite(eye.z);
    const distance=Number.isFinite(range)&&range>0?range:180;
    let changed=false;
    for(const entry of this.entries){
      const visible=!hasEye||entry.sphere.center.distanceToSquared(eye)<(distance+entry.sphere.radius)**2;
      if(visible!==entry.visible){entry.visible=visible;changed=true;}
    }
    if(!changed)return;
    let cursor=0;this.visibleBounds.makeEmpty();
    for(const entry of this.entries)if(entry.visible){
      for(let vertex=entry.start;vertex<entry.start+entry.count;vertex++)this.index.array[cursor++]=vertex;
      this.visibleBounds.union(entry.box);
    }
    this.index.needsUpdate=true;this.geometry.setDrawRange(0,cursor);
    this.group.visible=this.mesh.visible=cursor>0;
    this.geometry.boundingBox.copy(this.visibleBounds);
    if(cursor)this.visibleBounds.getBoundingSphere(this.geometry.boundingSphere);else this.geometry.boundingSphere.makeEmpty();
  }

  /** Only this geometry and material clone are owned; maps remain borrowed. */
  dispose() {
    if(this.disposed)return;this.disposed=true;
    this.geometry.dispose();this.material.dispose();this.group.removeFromParent();this.group.clear();
  }
}
