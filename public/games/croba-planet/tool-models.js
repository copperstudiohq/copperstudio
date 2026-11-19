import * as THREE from './vendor/three.module.js';

/** Small rigid supplies share a consistent grip at their local origin. Details
 * are baked into a few material batches, never one draw per screw or finger. */
export class SupplyMeshBuilder {
 constructor(){this.parts=new Map();}
 add(kind,geometry,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0],color=0xffffff){
  const pose=new THREE.Object3D();pose.position.fromArray(position);pose.scale.fromArray(scale);pose.rotation.set(...rotation);pose.updateMatrix();
  const flat=geometry.index?geometry.toNonIndexed():geometry.clone();geometry.dispose();flat.applyMatrix4(pose.matrix);
  const data=this.parts.get(kind)??{position:[],normal:[],uv:[],color:[]};this.parts.set(kind,data);const tint=new THREE.Color(color);
  for(const name of ['position','normal','uv'])data[name].push(...flat.attributes[name].array);
  for(let i=0;i<flat.attributes.position.count;i++){const p=flat.attributes.position,grain=this.clothNoise&&kind==='grip'?1+.035*Math.sin(p.getX(i)*713+p.getY(i)*347+p.getZ(i)*571):1;data.color.push(tint.r*grain,tint.g*grain,tint.b*grain);}flat.dispose();return this;
 }
 sphere(kind,p,s,c,segments=16){return this.add(kind,new THREE.SphereGeometry(1,segments,10),p,s,[0,0,0],c);}
 box(kind,p,s,c,r=[0,0,0]){return this.add(kind,new THREE.BoxGeometry(1,1,1),p,s,r,c);}
 link(kind,a,b,r,c,r2=r){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),d=end.clone().sub(start),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const e=new THREE.Euler().setFromQuaternion(q);return this.add(kind,new THREE.CylinderGeometry(r2,r,d.length(),10,1),start.add(end).multiplyScalar(.5).toArray(),[1,1,1],[e.x,e.y,e.z],c);}
 finish(name,{firstPerson=false}={}){
  const group=new THREE.Group();group.name=name;const palette={metal:{roughness:.56,metalness:.74},grip:{roughness:.91,metalness:.02},skin:{roughness:.70,metalness:0},rubber:{roughness:.78,metalness:0},lens:{roughness:.20,metalness:.44,emissive:0x064c63,emissiveIntensity:.35},leaf:{roughness:.85,metalness:0,side:THREE.DoubleSide}};
  for(const [kind,data]of this.parts){const geometry=new THREE.BufferGeometry();for(const [key,size]of [['position',3],['normal',3],['uv',2],['color',3]])geometry.setAttribute(key,new THREE.Float32BufferAttribute(data[key],size));geometry.computeBoundingBox();geometry.computeBoundingSphere();const material=new THREE.MeshStandardMaterial({vertexColors:true,...palette[kind],fog:!firstPerson});if(firstPerson){material.userData.firstPerson=true;material.depthTest=false;material.depthWrite=false;material.emissive??=new THREE.Color();if(kind!=='lens')material.emissive.setHex(0x17232a);material.emissiveIntensity=.28;}const mesh=new THREE.Mesh(geometry,material);mesh.name=`${name}-${kind}`;mesh.renderOrder=firstPerson?40:0;mesh.frustumCulled=!firstPerson;group.add(mesh);}
  let disposed=false;group.dispose=()=>{if(disposed)return;disposed=true;group.removeFromParent();for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose();}group.clear();};return group;
 }
}

const steel=0x71848a,copper=0xb96b3d,rust=0x603f30,dark=0x263842;
const handle=(b,length=.30)=>{b.link('grip',[0,-length*.52,0],[0,length*.48,0],.018,dark,.021);for(let i=0;i<7;i++)b.add('grip',new THREE.TorusGeometry(.021,.003,5,12),[0,-.11+i*.027,0],[1,1,1],[Math.PI/2,0,0],0x536770);};
const bolts=(b,points)=>{for(const p of points)b.sphere('metal',p,[.006,.006,.004],0xb7b9aa,8);};
function leaf(b,id){
 const shape=new THREE.Shape();shape.moveTo(0,-.11);shape.bezierCurveTo(-.10,-.02,-.075,.095,0,.18);shape.bezierCurveTo(.08,.08,.065,-.035,0,-.11);
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.006,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:2,curveSegments:14});
 b.add('leaf',geo,[0,0,0],[1,1,1],[0,.15,-.12],id==='crown-frond'?0x9b70ba:id==='kelp-leaf'?0x388eae:id==='frost-leaf'?0xdbeee7:0x6ea8a2);
 b.link('leaf',[0,-.13,.011],[0,.16,.011],.003,0xc4dcbd);for(let i=0;i<5;i++){const y=-.04+i*.036;for(const s of[-1,1])b.link('leaf',[0,y,.012],[s*(.05-Math.abs(y)*.18),y+.028,.012],.0015,0xb3d2c8);}
}
export const HELD_ITEM_IDS=Object.freeze(['ration','glassroot-leaf','kelp-leaf','crown-frond','frost-leaf','penguin-egg','croban-mango','copper-yoyo','debris','broken-hammer','workbench','rusty-copper-knife','rock-chipper','identifier','builder-tool']);

export function createToolModel(id,{firstPerson=false}={}){
 if(!HELD_ITEM_IDS.includes(id))throw new TypeError(`Unknown held supply: ${id}.`);
 const b=new SupplyMeshBuilder();
 if(id==='broken-hammer'){
  handle(b,.34);b.box('metal',[.005,.185,0],[.25,.09,.075],steel,[0,0,-.06]);b.box('metal',[-.13,.189,0],[.045,.10,.085],0x98a4a5);b.box('metal',[.105,.18,0],[.065,.055,.065],rust,[0,0,.25]);
  for(let i=0;i<5;i++)b.add('leaf',new THREE.TorusGeometry(.025,.006,5,12),[0,.075+i*.017,0],[1,1,1],[Math.PI/2,0,.05],i%2?0xc5ded1:0x8faaa7);b.link('leaf',[-.01,.10,0],[-.045,.015,.012],.008,0xaac6ba,.004);bolts(b,[[0,.184,.041]]);
 }else if(id==='rock-chipper'){
  handle(b,.36);b.link('metal',[-.16,.19,0],[.01,.22,0],.035,steel,.047);b.link('metal',[.01,.22,0],[.16,.16,0],.047,steel,.004);b.box('metal',[-.16,.19,0],[.045,.075,.06],0xa3b1ad);bolts(b,[[0,.21,.044]]);
 }else if(id==='rusty-copper-knife'){
  handle(b,.21);const s=new THREE.Shape();s.moveTo(-.025,.08);s.lineTo(.035,.08);s.bezierCurveTo(.05,.18,.028,.27,.008,.34);s.bezierCurveTo(-.024,.27,-.04,.16,-.025,.08);const blade=new THREE.ExtrudeGeometry(s,{depth:.009,bevelEnabled:true,bevelThickness:.002,bevelSize:.004,bevelSegments:2,curveSegments:8});b.add('metal',blade,[0,0,-.005],[1,1,1],[0,0,0],copper);b.box('metal',[0,.085,0],[.105,.018,.04],0x76503c);for(let i=0;i<8;i++)b.sphere('metal',[Math.sin(i*2.1)*.018,.12+i*.018,.007],[.006,.012,.001],i%2?rust:0x7e9a8b,8);
 }else if(id==='identifier'||id==='builder-tool'){
  const build=id==='builder-tool',housing=build?0xe6b25c:0x6e989f;handle(b,.19);b.box('metal',[0,.10,-.025],[.15,.135,.09],housing,[.08,0,0]);b.box('grip',[0,.105,.026],[.12,.09,.012],dark);b.box('lens',[0,.11,.035],[.087,.055,.006],build?0x97ddc6:0x84d6e8);
  b.link('metal',[-.07,.12,-.055],[-.075,.18,-.15],.012,steel);b.link('metal',[.07,.12,-.055],[.075,.18,-.15],.012,steel);b.link('metal',[-.075,.18,-.15],[.075,.18,-.15],.009,steel);b.add('lens',new THREE.TorusGeometry(.035,.006,6,20),[0,.17,-.14],[1,1,1],[.12,0,0],0x8ee2e0);bolts(b,[[-.059,.15,.03],[.059,.15,.03],[-.059,.06,.03],[.059,.06,.03]]);
  for(let i=0;i<3;i++)b.box('lens',[-.028+i*.028,.078,.039],[.014,.005,.003],build?0xc3ebbc:0x6db9c9);
 }else if(id==='workbench'){
  b.box('metal',[0,.02,0],[.25,.13,.11],steel);b.box('grip',[0,.02,.06],[.15,.06,.015],dark);for(const s of[-1,1])b.box('metal',[s*.105,-.075,0],[.024,.07,.09],rust);b.link('metal',[-.11,.1,0],[.11,.1,0],.012,copper);
 }else if(id==='debris'){
  b.box('metal',[0,.02,0],[.16,.19,.018],steel,[.1,.12,-.17]);b.box('metal',[-.06,-.02,.025],[.05,.13,.02],rust,[0,.5,.1]);b.link('metal',[-.06,.08,.02],[.07,-.04,.027],.006,copper);bolts(b,[[-.055,.07,.014],[.052,-.06,.016]]);
 }else if(id==='ration'){
  b.sphere('grip',[0,.02,0],[.082,.13,.038],0xae7951);b.box('grip',[0,.025,.036],[.112,.14,.008],0x345951);for(const y of[-.085,.128])b.box('metal',[0,y,0],[.14,.014,.055],0xbb9567);b.box('leaf',[0,.03,.043],[.066,.057,.002],0xdbc696);
 }else if(id.endsWith('leaf')||id==='crown-frond')leaf(b,id);
 else if(id==='penguin-egg'){
  const geo=new THREE.SphereGeometry(1,24,18),a=geo.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i),n=1-.15*Math.max(0,y);a.setXYZ(i,a.getX(i)*n,a.getY(i),a.getZ(i)*n);}geo.computeVertexNormals();b.add('skin',geo,[0,.035,0],[.072,.108,.072],[0,0,.1],0xddd8bd);for(let i=0;i<13;i++){const angle=i*2.399,y=Math.sin(i*1.7)*.075,r=Math.sqrt(Math.max(0,1-(y/.11)**2))*.071;b.sphere('skin',[Math.cos(angle)*r,y+.035,Math.sin(angle)*r],[.008,.012,.004],0x759493,8);}
 }else if(id==='croban-mango'){
  b.sphere('skin',[0,.04,0],[.09,.13,.075],0x267cc2,24);b.link('grip',[.018,.15,0],[.035,.19,0],.008,0x78654d);for(let i=0;i<6;i++)b.sphere('skin',[Math.cos(i*1.7)*.05,.02+Math.sin(i*2)*.06,.062],[.005,.011,.002],0x7ac2e5,8);
 }else if(id==='copper-yoyo'){
  for(const z of[-.025,.025])b.add('metal',new THREE.CylinderGeometry(.07,.07,.025,24),[0,0,z],[1,1,1],[Math.PI/2,0,0],copper);b.link('metal',[0,0,-.025],[0,0,.025],.013,steel);
 }
 const model=b.finish(`held-${id}`,{firstPerson});model.userData.itemId=id;return model;
}

/** A complete insulated explorer glove. Continuous curved finger sleeves overlap
 * the padded palm; rubber contact panels, stitched seams and a ribbed cuff
 * cover every surface, including fingertips and wrist. No exposed skin. */
export function createExplorerHand({firstPerson=true}={}){
 const b=new SupplyMeshBuilder(),cloth=0x577486,rubber=0x283e4a,seam=0x91a6af;b.clothNoise=true;
 b.sphere('grip',[.007,-.008,.037],[.066,.091,.034],cloth,24);
 b.sphere('grip',[-.034,-.035,.026],[.040,.058,.035],0x4b697b,20);
 b.sphere('rubber',[.006,-.014,.069],[.049,.064,.006],rubber,20);
 b.link('grip',[.012,-.09,.043],[.026,-.18,.067],.035,cloth,.043);
 b.link('grip',[.026,-.17,.067],[.065,-.33,.13],.048,0x3b586b,.067);
 b.add('rubber',new THREE.TorusGeometry(.047,.009,8,24),[.026,-.17,.067],[1,1,1],[Math.PI/2,0,-.14],0x253d4b);
 for(let i=0;i<4;i++)b.add('grip',new THREE.TorusGeometry(.042+i*.001,.002,5,20),[.023,-.135-i*.009,.057],[1,1,1],[Math.PI/2,0,-.14],i%2?0x69818d:0x3f5a6b);
 b.box('metal',[.070,-.173,.070],[.025,.024,.014],0x87999f,[0,0,-.16]);
 const sleeve=(points,radius,endRadius,color)=>{
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments=24,sides=12;
  const geometry=new THREE.TubeGeometry(curve,segments,1,sides,false),position=geometry.attributes.position;
  for(let row=0;row<=segments;row++){const t=row/segments,center=curve.getPointAt(t),r=THREE.MathUtils.lerp(radius,endRadius,t);
   for(let side=0;side<=sides;side++){const index=row*(sides+1)+side;position.setXYZ(index,center.x+(position.getX(index)-center.x)*r,center.y+(position.getY(index)-center.y)*r,center.z+(position.getZ(index)-center.z)*r);}
  }
  geometry.computeVertexNormals();b.add('grip',geometry,[0,0,0],[1,1,1],[0,0,0],color);
  const tip=points.at(-1);b.sphere('rubber',tip,[endRadius,endRadius*.95,endRadius],rubber,14);
 };
 const fingers=[[-.048,.049],[-.016,.069],[.018,.064],[.048,.043]];
 fingers.forEach(([x,y],i)=>{
  const r=.017-i*.0011,points=[[x,y-.010,.030],[x,y+.010,-.015],[x,y-.011,-.049],[x,y-.039,-.037]];
  sleeve(points,r,r*.78,cloth);
  // Flattened knuckle protection follows the finger sleeve instead of bead joints.
  b.sphere('rubber',[x,y+.009,-.020],[r*.88,.017,.010],0x344d5b,14);
  for(let k=0;k<2;k++)b.link('rubber',[x-r*.62,y-.010-k*.006,-.064],[x+r*.62,y-.010-k*.006,-.064],.0014,0x607986);
  b.link('grip',[x-r*.67,y-.020,.042],[x-r*.67,y+.002,.019],.0011,seam);
 });
 sleeve([[-.055,-.037,.029],[-.080,-.003,.004],[-.071,.028,-.032],[-.035,.025,-.051]],.023,.016,0x4e6c7e);
 b.sphere('rubber',[-.043,.028,-.063],[.022,.013,.004],rubber,16);
 for(const sign of[-1,1]){
  b.link('grip',[sign*.039,-.058,.067],[sign*.032,.010,.066],.0013,seam);
  for(let i=0;i<5;i++)b.link('grip',[sign*.040,-.050+i*.010,.068],[sign*.034,-.046+i*.010,.070],.0009,0xb0bec2);
 }
 const model=b.finish('explorer-insulated-glove',{firstPerson});model.userData={fingerCount:5,knuckleCount:9,sleeve:true,gloved:true,exposedSkin:false};return model;
}
