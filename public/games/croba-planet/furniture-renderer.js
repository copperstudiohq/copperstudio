import * as THREE from './vendor/three.module.js';

const WHITE=0xe8eeeb,NAVY=0x304d60,CUSHION=0x46525c,COPPER=0xaa7855;

/** Forty-four triangles form real rounded bevels, sharing normals at their
 * joins. Small furniture details do not need high-segment box meshes. */
function roundedBox(size,radius=.035){
 const half=size.map(n=>n/2),r=Math.min(radius,...half.map(n=>n*.55)),inner=half.map(n=>n-r),positions=[],indices=[],vertices=new Map();
 const vertex=p=>{const key=p.map(n=>n.toFixed(9)).join(':');if(!vertices.has(key)){vertices.set(key,positions.length/3);positions.push(...p);}return vertices.get(key);};
 const face=(points,normal)=>{
  const a=new THREE.Vector3(...points[0]),b=new THREE.Vector3(...points[1]),c=new THREE.Vector3(...points[2]);
  if(b.sub(a).cross(c.sub(a)).dot(new THREE.Vector3(...normal))<0)points.reverse();
  const ids=points.map(vertex);for(let i=1;i<ids.length-1;i++)indices.push(ids[0],ids[i],ids[i+1]);
 };
 for(let axis=0;axis<3;axis++)for(const sign of[-1,1]){
  const others=[0,1,2].filter(i=>i!==axis),normal=[0,0,0];normal[axis]=sign;
  face([[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const p=[0,0,0];p[axis]=sign*half[axis];p[others[0]]=a*inner[others[0]];p[others[1]]=b*inner[others[1]];return p;}),normal);
 }
 for(const[a,b]of[[0,1],[0,2],[1,2]])for(const sa of[-1,1])for(const sb of[-1,1]){
  const other=3-a-b,normal=[0,0,0];normal[a]=sa;normal[b]=sb;
  face([[-1,false],[1,false],[1,true],[-1,true]].map(([sign,switchFace])=>{const p=[0,0,0];p[a]=sa*(switchFace?inner[a]:half[a]);p[b]=sb*(switchFace?half[b]:inner[b]);p[other]=sign*inner[other];return p;}),normal);
 }
 for(const sx of[-1,1])for(const sy of[-1,1])for(const sz of[-1,1]){
  const signs=[sx,sy,sz];face([0,1,2].map(axis=>signs.map((s,i)=>s*(i===axis?half[i]:inner[i]))),signs);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.userData={rounded:true,bevelMeters:r};return geometry;
}

/** Bake furniture-local primitives through one explicit render-Y rotation.
 * Parent base placement remains the caller's transform. */
function localBuilder(builder,item){
 const itemPose=new THREE.Object3D(),partPose=new THREE.Object3D();
 itemPose.position.set(item.x/25,0,item.y/25);itemPose.rotation.y=item.yaw;itemPose.updateMatrix();
 const add=(kind,name,geometry,position=[0,0,0],rotation=[0,0,0],color=WHITE)=>{
  partPose.position.fromArray(position);partPose.rotation.set(...rotation);partPose.updateMatrix();geometry.applyMatrix4(partPose.matrix);geometry.applyMatrix4(itemPose.matrix);
  geometry.userData={...geometry.userData,furnitureId:item.id,furnitureKind:item.kind};
  builder.add(kind,`furniture/${item.kind}/${item.id}/${name}`,geometry,[0,0,0],[0,0,0],color);
 };
 return{
  add,
  box:(kind,name,position,size,color=NAVY)=>add(kind,name,new THREE.BoxGeometry(...size),position,[0,0,0],color),
  soft:(name,position,size,color=WHITE,radius=.035)=>add('interior',name,roundedBox(size,radius),position,[0,0,0],color),
  plate:(name,position,width,length,color)=>add('interior',name,new THREE.PlaneGeometry(width,length),position,[-Math.PI/2,0,0],color),
 };
}

function chair(b){
 b.soft('white-seat-frame',[0,.42,0],[.8,.13,.78]);
 b.soft('dark-grey-seat-cushion',[0,.50,.045],[.67,.10,.61],CUSHION,.04);
 b.soft('white-curved-back-frame',[0,.815,-.315],[.74,.57,.12]);
 b.soft('dark-grey-back-pad',[0,.82,-.236],[.63,.43,.035],CUSHION,.015);
 for(const x of[-.30,.30])for(const z of[-.27,.27])b.box('metal','navy-chair-leg',[x,.18,z],[.045,.36,.045]);
 for(const x of[-.30,.30])b.box('metal','low-chair-leg-brace',[x,.13,0],[.035,.035,.57]);
 for(const x of[-.32,.32])b.box('metal','copper-back-frame-mount',[x,.60,-.29],[.04,.14,.06],COPPER);
}

function table(b){
 b.soft('smooth-white-table-top',[0,.76,0],[1.8,.08,1],WHITE,.025);
 for(const x of[-.76,.76])for(const z of[-.36,.36])b.add('metal','rounded-table-leg',new THREE.CylinderGeometry(.035,.045,.72,6),[x,.36,z],[0,0,0],NAVY);
 for(const z of[-.36,.36])b.box('metal','table-lower-cross-brace',[0,.16,z],[1.56,.035,.035]);
 for(const x of[-.76,.76])b.box('metal','copper-table-collar',[x,.67,0],[.065,.07,.77],COPPER);
 b.plate('dark-grey-table-inlay',[0,.8005,0],1.20,.57,0x69747a);
}

function bunk(b){
 b.soft('white-bunk-frame',[0,.26,0],[1,.13,2.2]);
 b.soft('dark-grey-bunk-mattress',[0,.43,.02],[.86,.20,1.96],CUSHION,.055);
 b.soft('pale-grey-pillow',[0,.59,-.70],[.67,.13,.40],0xc7cfcd,.045);
 b.soft('rounded-white-bunk-headboard',[0,.635,-1.045],[.95,.73,.09]);
 b.soft('rounded-white-bunk-footboard',[0,.43,1.045],[.95,.33,.08]);
 for(const x of[-.39,.39])for(const z of[-.94,.94])b.box('metal','bunk-foot',[x,.10,z],[.065,.20,.065]);
 for(const x of[-.44,.44])b.box('metal','navy-bunk-underside-rail',[x,.17,0],[.055,.075,1.95]);
 for(const x of[-.39,.39])b.box('metal','copper-bunk-head-mount',[x,.31,-1.02],[.07,.10,.06],COPPER);
}

function cabinet(b){
 b.soft('white-cabinet-body',[0,.90,-.025],[.9,1.8,.54]);
 b.box('metal','navy-cabinet-plinth',[0,.06,0],[.82,.12,.52]);
 for(const side of[-1,1]){
  b.soft('rounded-cabinet-door',[side*.2175,.95,.268],[.42,1.56,.055],WHITE,.015);
  b.box('metal','copper-cabinet-handle',[side*.055,.98,.297],[.025,.20,.006],COPPER);
 }
 b.box('metal','cabinet-upper-recess',[0,1.72,.296],[.62,.055,.004]);
 b.add('interior','navy-cabinet-lower-inlay',new THREE.PlaneGeometry(.65,.07),[0,.25,.298],[0,0,0],NAVY);
}

function planterLeaves(){
 const positions=[],colors=[],indices=[];
 for(let leaf=0;leaf<8;leaf++){
  const angle=leaf*Math.PI/4+.18,dx=Math.cos(angle),dz=Math.sin(angle),sideX=-dz,sideZ=dx,length=.31+(leaf%3)*.018;
  const root=[dx*.045,.385,dz*.045],tip=[dx*length,.74+(leaf%3)*.015,dz*length],middle=[dx*length*.53,.59,dz*length*.53];
  const points=[root,[middle[0]+sideX*.063,middle[1],middle[2]+sideZ*.063],tip,[middle[0]-sideX*.063,middle[1],middle[2]-sideZ*.063],
   [middle[0],middle[1]+.020,middle[2]],[middle[0],middle[1]-.008,middle[2]]];
  const first=positions.length/3,tint=new THREE.Color(leaf%2?0x8370a5:0x467fa9);
  for(const point of points){positions.push(...point);colors.push(tint.r,tint.g,tint.b);}
  for(const tri of[[0,1,4],[1,2,4],[2,3,4],[3,0,4],[1,0,5],[2,1,5],[3,2,5],[0,3,5]])indices.push(...tri.map(i=>first+i));
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

function planter(b){
 b.soft('white-rounded-planter-bowl',[0,.19,0],[.9,.38,.9],WHITE,.07);
 b.box('metal','navy-planter-foot',[0,.03,0],[.8,.06,.8]);
 b.plate('dark-growing-medium',[0,.381,0],.68,.68,0x283d46);
 b.add('interior','blue-and-purple-alien-leaves',planterLeaves());
 b.add('interior','purple-central-bud',new THREE.ConeGeometry(.035,.16,6),[0,.72,0],[0,0,0],0x9179ae);
 for(const x of[-.35,.35])b.box('metal','copper-planter-bracket',[x,.27,.40],[.07,.11,.05],COPPER);
}

const MODELS=Object.freeze({'habitat-chair':chair,'habitat-table':table,'habitat-bunk':bunk,'habitat-cabinet':cabinet,'habitat-planter':planter});

/** Place solid decorative furniture into the existing habitat surface batches.
 * Records use base-local simulation X/Y and render-Y yaw; floor height is zero.
 * The caller retains control of collisions, placement, saves and materials. */
export function addHabitatFurniture(builder,items=[]){
 if(typeof builder?.add!=='function'||!Array.isArray(items))throw new TypeError('Habitat furniture requires a merged builder and an item array.');
 const seen=new Set();
 for(const item of items){
  if(!item||typeof item.id!=='string'||!item.id||seen.has(item.id)||!Object.hasOwn(MODELS,item.kind)||![item.x,item.y,item.yaw].every(Number.isFinite))throw new TypeError('Habitat furniture needs unique IDs, known kinds and finite local poses.');
  seen.add(item.id);
 }
 for(const item of items)MODELS[item.kind](localBuilder(builder,item));
 return{furnitureCount:items.length,furnitureKinds:[...new Set(items.map(item=>item.kind))]};
}
