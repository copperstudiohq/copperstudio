import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';

export const COPPER_SHIRT_ART_URL = new URL('./images/rain-and-copper-shirt.jpg', import.meta.url).href;
const v = (x, y, z) => new THREE.Vector3(x, y, z);

/** A real cut shirt silhouette, with sleeves, neckline, hem and soft wrinkles.
 * It is folded against the inner rear wall, safely below the closed lid. */
function shirtGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-.235, 0); s.lineTo(.235, 0);
  s.quadraticCurveTo(.25, .015, .24, .05); s.lineTo(.22, .36);
  s.lineTo(.295, .325); s.quadraticCurveTo(.31, .32, .32, .34);
  s.lineTo(.385, .465); s.quadraticCurveTo(.39, .48, .37, .49);
  s.lineTo(.16, .60); s.lineTo(.092, .60);
  s.quadraticCurveTo(.075, .505, 0, .507);
  s.quadraticCurveTo(-.075, .505, -.092, .60);
  s.lineTo(-.16, .60); s.lineTo(-.37, .49);
  s.quadraticCurveTo(-.39, .48, -.385, .465); s.lineTo(-.32, .34);
  s.quadraticCurveTo(-.31, .32, -.295, .325); s.lineTo(-.22, .36);
  s.lineTo(-.24, .05); s.quadraticCurveTo(-.25, .015, -.235, 0);
  const geometry = new THREE.ExtrudeGeometry(s, {depth:.012, bevelEnabled:true,
    bevelSize:.004, bevelThickness:.004, bevelSegments:2, curveSegments:6, steps:1});
  const p = geometry.attributes.position;
  for (let i=0; i<p.count; i++) {
    const x=p.getX(i), y=p.getY(i);
    p.setZ(i, p.getZ(i) + clothFold(x,y));
  }
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

function clothFold(x, y) {
  return .005*Math.sin(x*28+y*5) + .003*Math.sin(y*39-x*8);
}

function clothPrintGeometry(width, height) {
  const geometry = new THREE.PlaneGeometry(width,height,12,8), p=geometry.attributes.position;
  for (let i=0; i<p.count; i++) p.setZ(i,.024+clothFold(p.getX(i),p.getY(i)+.32));
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

function seamGeometry() {
  const mesh = new PlantMesh();
  const path=(points)=>mesh.tube(points.map(([x,y])=>v(x,y,.018+clothFold(x,y))),.0022,0x899195,5);
  path(Array.from({length:13},(_,i)=>{const a=Math.PI-i*Math.PI/12;return [.09*Math.cos(a),.60-.087*Math.sin(a)];}));
  path(Array.from({length:13},(_,i)=>[-.22+i*.44/12,.025]));
  path([[-.313,.345],[-.34,.397],[-.368,.454]]);
  path([[.313,.345],[.34,.397],[.368,.454]]);
  return mesh.geometry({normalizeHeight:false});
}

function copperWireGeometry() {
  const mesh=new PlantMesh();
  // One continuous helix gives the spool actual round wire, not painted lines.
  const points=Array.from({length:193},(_,i)=>{
    const t=i/192,a=t*Math.PI*14;return v(Math.cos(a)*.132,-.087+t*.174,Math.sin(a)*.132);
  });
  mesh.tube(points,.0075,0xc27c43,6);
  // Two loose wire ends trail across the bottom of the trunk.
  mesh.tube([v(.132,-.087,0),v(.18,-.10,.035),v(.23,-.115,.10),v(.25,-.12,.17),
    v(.20,-.125,.23),v(.10,-.13,.24),v(.04,-.13,.19)],[.0075,.0075,.0075,.0075,.0075,.0075,.0075],0xb7763f,6);
  return mesh.geometry({normalizeHeight:false});
}

function ingotGeometry() {
  const shape=new THREE.Shape(), w=.43, d=.14, r=.015;
  shape.moveTo(-w/2+r,-d/2);shape.lineTo(w/2-r,-d/2);
  shape.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);shape.lineTo(w/2,d/2-r);
  shape.quadraticCurveTo(w/2,d/2,w/2-r,d/2);shape.lineTo(-w/2+r,d/2);
  shape.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);shape.lineTo(-w/2,-d/2+r);
  shape.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,
    bevelSize:.008,bevelThickness:.008,bevelSegments:1,steps:1,curveSegments:3});
  geometry.rotateX(-Math.PI/2);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

function conceptTexture() {
  if (typeof document==='undefined') {
    const map=new THREE.DataTexture(new Uint8Array([97,151,186,255]),1,1);
    map.colorSpace=THREE.SRGBColorSpace;map.needsUpdate=true;return map;
  }
  const map=new THREE.TextureLoader().load(COPPER_SHIRT_ART_URL,undefined,undefined,
    error=>console.error('Croba: Rain and Copper cargo-shirt print could not load.',error));
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=2;return map;
}

/** Decorative-only contents in trunk-local metres, Y up and front +Z.
 * No item registry, inventory mutation, lights or per-frame work is created.
 * The caller owns the returned group and calls group.dispose() exactly once. */
export function createCopperCargoDecor() {
  const group=new THREE.Group();group.name='copperstudio-decorative-cargo';
  group.userData={decorative:true,shirtArt:COPPER_SHIRT_ART_URL,ingotCount:3};
  const geometries=new Set(), materials=new Set(), textures=new Set();
  const add=(name,geometry,material,parent=group)=>{
    geometries.add(geometry);materials.add(material);const mesh=new THREE.Mesh(geometry,material);
    mesh.name=name;parent.add(mesh);return mesh;
  };
  const cloth=new THREE.MeshStandardMaterial({color:0x334b5c,roughness:.98});
  const seam=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1});
  const copper=new THREE.MeshStandardMaterial({color:0xb9753e,metalness:.92,roughness:.32});
  const wireMaterial=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.91,roughness:.29});
  const spoolMaterial=new THREE.MeshStandardMaterial({color:0x4a4e4a,roughness:.84,metalness:.08});
  const shirt=new THREE.Group();shirt.name='folded-rain-and-copper-t-shirt';
  shirt.position.set(-.34,.34,-.245);shirt.rotation.x=-.075;group.add(shirt);
  add('shirt-cloth-sleeves-and-open-neckline',shirtGeometry(),cloth,shirt);
  add('shirt-collar-and-hem-stitching',seamGeometry(),seam,shirt);
  const map=conceptTexture();textures.add(map);
  const print=new THREE.MeshStandardMaterial({map,color:0xffffff,roughness:.94,metalness:0});
  const panel=add('rain-and-copper-concept-art-print',clothPrintGeometry(.47,.282),print,shirt);panel.position.y=.32;
  const border=new THREE.MeshStandardMaterial({color:0xa7aaa0,roughness:1});
  const backing=add('worn-print-fabric-border',clothPrintGeometry(.482,.294),border,shirt);
  backing.position.set(0,.32,-.001);

  const spool=new THREE.Group();spool.name='copper-wire-spool';spool.position.set(.43,.33,-.19);group.add(spool);
  const core=add('wire-spool-core',new THREE.CylinderGeometry(.095,.095,.225,16),spoolMaterial,spool);
  const flange=new THREE.CylinderGeometry(.166,.166,.018,20);
  for(const side of[-1,1]){const disc=add(`wire-spool-flange-${side}`,flange,spoolMaterial,spool);disc.position.y=side*.111;}
  add('coiled-copper-wire-and-loose-ends',copperWireGeometry(),wireMaterial,spool);

  const ingot=ingotGeometry();
  for(let i=0;i<3;i++){
    const mesh=add(`copper-ingot-${i+1}`,ingot,copper);mesh.position.set(.30+(i===2?.035:0),.174+(i===2?.095:0),i===0?.12:i===1?.30:.20);
    mesh.rotation.y=i===2?.10:i===1?-.04:.035;
  }
  let disposed=false;
  group.dispose=()=>{
    if(disposed)return;disposed=true;group.removeFromParent();
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());group.clear();
  };
  return group;
}
