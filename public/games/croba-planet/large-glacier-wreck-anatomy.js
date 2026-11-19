import * as THREE from './vendor/three.module.js';
import {addHaulerCabinDecor,HAULER_LEFT_WHEEL_SOLID} from './hauler-cabin-decor.js';

/** Local render metres, Y up, cab/front +Z and restrained cargo to the rear. */
export const LARGE_WRECK_DECK=Object.freeze({minX:-5.1,maxX:5.1,minZ:-19.8,maxZ:10.6,topY:1.35});
export const LARGE_WRECK_RAMP=Object.freeze({minX:-1.3,maxX:1.3,minZ:-24.5,maxZ:-19.8,startY:0,endY:1.35});
/** The preserved cab floor rises from the cargo aisle to the cockpit. */
export const LARGE_WRECK_CAB=Object.freeze({minX:-4.6,maxX:4.6,minZ:10.6,maxZ:23.1,topY:3.35,entryY:1.35,rampEndZ:16,rampHalfWidth:1.1});
export const LARGE_WRECK_CARGO=Object.freeze([-1,1].flatMap(side=>[-16.3,-9.3,-2.3,4.7].map((z,bay)=>Object.freeze({
 id:'cargo-'+(side<0?'port':'starboard')+'-'+bay,side,bay,
 center:Object.freeze([side*2.6,1.35+[2.05,3.0,2.35,2.65][bay]/2,z]),
 size:Object.freeze([3.9,[2.05,3.0,2.35,2.65][bay],6.2]),
}))));

/** Localized pressed-in metal keeps the upright truck silhouette and cabin. */
const dentFalloff=(a,b=0)=>Math.exp(-(a*a+b*b));
function dentedCabPoint(x,y,z){
 const front=dentFalloff((z-23.15)/.8),side=dentFalloff((Math.abs(x)-4.8)/.5);
 const cheek=dentFalloff((y-3.2)/1.35,(z-17.2)/2.8);
 const nose=.65*dentFalloff((x+2.3)/2.3,(y-3.0)/1.6);
 const roof=.5*dentFalloff((y-7.95)/.65,(x+1.8)/2.8)*dentFalloff((z-16.2)/4);
 return[x-Math.sign(x)*side*cheek*.55,y-roof,z-front*nose];
}

/** Roof nests follow the surviving sloped, dented cab skin. */
export function largeWreckCabRoofHeight(x,z){
 if(Math.abs(x)>4.1||z<11.5||z>21.8)return null;
 const v=(z-10.6)/(22.85-10.6),u=(x/(4.8-.2*v)+1)/2;
 const col=Math.floor(u*5),row=Math.floor(v*5),s=u*5-col,t=v*5-row;
 const height=(a,b)=>dentedCabPoint((a*2-1)*(4.8-.2*b),8.2-.55*b,10.6+12.25*b)[1];
 const a=height(col/5,row/5),b=height((col+1)/5,row/5),c=height((col+1)/5,(row+1)/5),d=height(col/5,(row+1)/5);
 return s>=t?a*(1-s)+b*(s-t)+c*t:a*(1-t)+c*s+d*(t-s);
}

/** Only surviving bulkheads, floors and machinery are solid. Torn cargo walls
 * and the rear cab doorway are enterable; root supplies floor/ramp support. */
export const LARGE_WRECK_SOLIDS=Object.freeze([
 {id:'flatbed-deck',center:[0,1.03,-4.6],size:[10.2,.64,30.4]},
 {id:'cab-front-wall',center:[0,4.7,22.85],size:[9.4,6.7,.4]},
 {id:'cab-dashboard',center:[0,4.2,21.5],size:[6.8,.3,1.1]},
 HAULER_LEFT_WHEEL_SOLID,
 {id:'cab-front-floor',center:[0,3.225,19.55],size:[9.2,.25,7.1]},
 ...[-1,1].flatMap(side=>[
  {id:'cab-side-wall-'+side,center:[side*4.58,4.8,16.85],size:[.55,6.8,12.5]},
  {id:'cab-rear-wall-'+side,center:[side*3,4.8,10.6],size:[3.6,6.8,.25]},
  {id:'cab-rear-floor-'+side,center:[side*2.85,3.225,13.3],size:[3.5,.25,5.4]},
  {id:'cab-seat-'+side,center:[side*1.75,4.25,18.6],size:[1.5,1.6,1.8]},
 ]),
 {id:'cab-entry-header',center:[0,6.8,10.6],size:[2.4,2.8,.25]},
 {id:'front-bumper',center:[0,1.22,23.5],size:[10.7,1.06,.80]},
 {id:'port-rear-jet',center:[-6.6,2.0,-17.5],size:[2.5,2.5,8.8]},
 {id:'starboard-rear-jet',center:[6.6,2.0,-17.5],size:[2.5,2.5,8.8]},
 ...LARGE_WRECK_CARGO.flatMap(c=>{
  const[x,y,z]=c.center,[width,height,length]=c.size;
  return[
   {id:c.id+'-inner-wall',center:[x-c.side*width/2,y,z],size:[.16,height,length]},
   {id:c.id+'-floor',center:[x,1.48,z],size:[width,.26,length]},
   {id:c.id+'-outer-wall-remnant',center:[x+c.side*(width/2+.2),1.65,z-2.65],size:[.24,.6,.8]},
  ];
 }),
].map(c=>Object.freeze({...c,center:Object.freeze([...c.center]),size:Object.freeze([...c.size])})));
export const LARGE_GLACIER_WRECK_COLLIDERS=Object.freeze(LARGE_WRECK_SOLIDS.map(c=>Object.freeze({
 id:c.id,kind:'box',center:c.center,halfExtents:Object.freeze(c.size.map(n=>n/2)),
})));

const FALLBACK={orangeMetal:0xb9693b,whiteMetal:0xb7c9cc,darkMetal:0x34444a,glass:0x29495a,snow:0xe4edf0};
const vertex=new THREE.Vector3(),shadeColor=new THREE.Color();

/** Merge by surface so hundreds of ribs, bolts and torn sheets keep five draws. */
class WreckMeshBuilder{
 constructor(materials){this.materials=materials;this.parts=new Map();this.pose=new THREE.Object3D();}
 add(kind,name,source,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
  const geometry=source.index?source.toNonIndexed():source;if(geometry!==source)source.dispose();
  this.pose.position.fromArray(position);this.pose.rotation.set(...rotation);this.pose.scale.fromArray(scale);this.pose.updateMatrix();geometry.applyMatrix4(this.pose.matrix);
  if(/cab|windscreen|grille|headlamp|mirror|truck-window|front-towing|space-truck-bumper/.test(name)&&!/floor|dashboard|seat|entry-ramp|entry-header/.test(name)){
   const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,...dentedCabPoint(p.getX(i),p.getY(i),p.getZ(i)));geometry.computeVertexNormals();
  }
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  let batch=this.parts.get(kind);if(!batch){batch={position:[],normal:[],uv:[],color:[],features:[]};this.parts.set(kind,batch);}
  const p=geometry.attributes.position,n=geometry.attributes.normal,start=batch.position.length/3;
  for(let i=0;i<p.count;i++){
   vertex.fromBufferAttribute(p,i);batch.position.push(vertex.x,vertex.y,vertex.z);batch.normal.push(n.getX(i),n.getY(i),n.getZ(i));
   const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
   batch.uv.push((nx>ny&&nx>nz?vertex.z:vertex.x)*.25,(ny>nx&&ny>nz?vertex.z:vertex.y)*.25);
   const worn=.77+.15*Math.max(0,n.getY(i))+.08*Math.sin(vertex.x*3.1+vertex.y*2.2+vertex.z*1.7)**2;
   const burn=Math.exp(-(((vertex.z+3)/8)**2))*Math.max(0,1-Math.abs(vertex.x)/8);
   const soot=kind==='snow'||kind==='glass'?0:(.08+burn*.32+(/engine|torn|ruptured/.test(name)?.14:0))*(1-Math.max(0,n.getY(i))*.5);
   shadeColor.setRGB(worn-soot,worn-soot*.94,worn-soot*.84);batch.color.push(shadeColor.r,shadeColor.g,shadeColor.b);
  }
  batch.features.push({name,start,count:p.count});geometry.dispose();
 }
 box(kind,name,center,size,rotation=[0,0,0]){
  const segments=name==='wide-truck-grille'?[6,2,1]:name==='heavy-space-truck-bumper'?[6,1,1]:[];
  this.add(kind,name,new THREE.BoxGeometry(...size,...segments),center,rotation);
 }
 panel(kind,name,points){
  const positions=[];
  if(points.length===4&&/^cab-(front-face|roof|side-lower)$/.test(name)){
   // A small surface grid gives the dents actual depth rather than a decal.
   const p=(u,v)=>[0,1,2].map(i=>(1-v)*((1-u)*points[0][i]+u*points[1][i])+v*((1-u)*points[3][i]+u*points[2][i]));
   for(let y=0;y<5;y++)for(let x=0;x<5;x++){
    const a=p(x/5,y/5),b=p((x+1)/5,y/5),c=p((x+1)/5,(y+1)/5),d=p(x/5,(y+1)/5);
    positions.push(...a,...b,...c,...a,...c,...d);
   }
  }else for(let i=1;i<points.length-1;i++)positions.push(...points[0],...points[i],...points[i+1]);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));this.add(kind,name,geometry);
 }
 beam(kind,name,from,to,radius=.1,sides=7){
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a),rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()));
  this.add(kind,name,new THREE.CylinderGeometry(radius,radius,direction.length(),sides),a.add(b).multiplyScalar(.5).toArray(),[rotation.x,rotation.y,rotation.z]);
 }
 finish(){
  const group=new THREE.Group();group.name='large-glacier-cargo-hauler-wreck';const geometries=[],materials=[];
  for(const[kind,batch]of this.parts){
   const geometry=new THREE.BufferGeometry();for(const[name,size]of[['position',3],['normal',3],['uv',2],['color',3]])geometry.setAttribute(name,new THREE.Float32BufferAttribute(batch[name],size));
   geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.userData.features=batch.features;geometries.push(geometry);
   const material=this.materials[kind]?.clone()??new THREE.MeshStandardMaterial({color:FALLBACK[kind],roughness:kind==='snow'?.96:.74,metalness:kind==='darkMetal'?.62:.22});
   material.vertexColors=true;material.side=THREE.DoubleSide;material.forceSinglePass=true;
   if(kind==='glass'){material.transparent=true;material.opacity=.37;material.depthWrite=false;material.transmission=0;material.roughness=.3;}
   materials.push(material);const mesh=new THREE.Mesh(geometry,material);mesh.name=`large-glacier-wreck-${kind}`;mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
  }
  const bounds=new THREE.Box3().setFromObject(group);group.userData={wreckage:true,design:'crashed cargo hauler',lengthMeters:bounds.max.z-bounds.min.z,widthMeters:bounds.max.x-bounds.min.x,
   heightMeters:bounds.max.y-bounds.min.y,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},surfaceBatches:group.children.length,collisionVolumes:LARGE_GLACIER_WRECK_COLLIDERS,
   cargoCount:LARGE_WRECK_CARGO.length,tieDownCount:LARGE_WRECK_CARGO.length*2,crushedCargoCount:8,breachedCargoCount:8,
   dentedCab:true,preservedCabInterior:true,rupturedEngines:2,brokenTieDownCount:6,heavyCrashDamage:true,
   deck:LARGE_WRECK_DECK,ramp:LARGE_WRECK_RAMP,centralWalkway:{minX:-.65,maxX:.65,minZ:-19.8,maxZ:10.6}};
  let disposed=false;group.dispose=()=>{if(disposed)return;disposed=true;group.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();};
  return group;
 }
}

/** A crashed truck: preserved dented cab, buckled flatbed and eight breached
 * shipping boxes with surviving and snapped restraints. Existing maps
 * are borrowed; the returned group owns and disposes its geometry/materials. */
export function createLargeGlacierWreck(materials={}, {rampStartY=LARGE_WRECK_RAMP.startY,landingHeightAt=()=>0}={}){
 if(!Number.isFinite(rampStartY))throw new TypeError('Cargo hauler ramp start must be finite.');
 const ship=new WreckMeshBuilder(materials);
 const strap=(name,path,width=.24)=>{
  for(let i=0;i<path.length-1;i++){
   const a=path[i],b=path[i+1];
   ship.panel('darkMetal',name,[[a[0],a[1],a[2]-width/2],[b[0],b[1],b[2]-width/2],
    [b[0],b[1],b[2]+width/2],[a[0],a[1],a[2]+width/2]]);
  }
 };
 const loop=(name,x,y,z)=>{
  ship.add('whiteMetal',name,new THREE.TorusGeometry(.105,.025,3,6),[x,y,z],[Math.PI/2,0,0]);
 };

 // Long exposed chassis and flat freight deck replace the survey ship's tube.
 ship.box('darkMetal','flatbed-deck-slab',[0,1.03,-4.6],[10.2,.64,30.4]);
 ship.box('whiteMetal','scuffed-flatbed-surface',[0,1.36,-4.6],[10.15,.025,30.35]);
 for(const side of[-1,1]){
  for(let bay=0;bay<5;bay++){
   const z=-17.6+bay*6.0,drop=bay%2===0?.38:.05,out=bay%2===0?.5:.08;
   ship.beam('orangeMetal','split-hauler-chassis-rail',[side*4.38,.78,z-2.7],[side*(4.38+out),.66-drop,z+2.0],.25,6);
   ship.beam('darkMetal','buckled-deck-edge',[side*5.02,1.49,z-2.7],[side*(5.25+out),1.1-drop,z+.7],.10,5);
   ship.panel('whiteMetal','peeled-flatbed-edge',[[side*4.6,1.38,z-1.9],[side*5.08,1.36,z-1.9],
    [side*(5.7+out),.72-drop,z+.8],[side*4.75,1.35,z+1.5]]);
  }
  // The starboard rear rail buckled during impact; the deck stays supported.
  ship.beam('darkMetal','buckled-rear-underframe',[side*4.36,.75,-20.0],[side*4.95,.28,-22.0],.16,8);
  for(const z of[-17,-5,7.5,19.3]){
   const ground=landingHeightAt(side*4.85,z-.55),mount=z>10?1.42:.75;
   if(!Number.isFinite(ground))throw new TypeError('Cargo-hauler landing support must be finite.');
   const knee=[side*5.3,(mount+ground+.2)*.5,z+.2];
   ship.beam('darkMetal','folded-landing-upper',[side*4.25,mount,z],knee,.18,8);
   if(z!==7.5)ship.beam('darkMetal','folded-landing-lower',knee,[side*4.85,ground+.20,z-.55],.14,7);
   else ship.beam('darkMetal','snapped-landing-piston',knee,[side*5.55,ground+.27,z+.5],.12,7);
   ship.box('darkMetal','twisted-landing-skid-foot',[side*4.85,ground+.07,z-.55],[1.25,.14,3.0],[0,side*.24,side*.04]);
   ship.box('whiteMetal','crushed-strut-collar',knee,[.46,.32,.48],[.25,0,side*.35]);
  }
 }
 for(let i=0;i<11;i++)ship.box('darkMetal','flatbed-crossmember',[0,.72,-18.7+i*2.75],[8.8,.28,.35]);
 for(let i=0;i<8;i++)ship.box('darkMetal','central-catwalk-grip',[0,1.386,-17.7+i*3.7],[1.15,.035,.13]);
 // Rear loading ramp remains attached and gives access to the narrow aisle.
 const r={...LARGE_WRECK_RAMP,startY:rampStartY};
 ship.panel('whiteMetal','lowered-loading-ramp',[[r.minX,r.startY,r.minZ],[r.maxX,r.startY,r.minZ],
  [r.maxX,r.endY,r.maxZ],[r.minX,r.endY,r.maxZ]]);
 for(const side of[-1,1])ship.beam('darkMetal','loading-ramp-edge',[side*1.29,r.startY+.065,-24.5],[side*1.29,r.endY+.065,-19.8],.065,7);
 for(let i=0;i<11;i++){
  const t=i/10,z=-24.5+4.7*t,y=r.startY+(r.endY-r.startY)*t;
  ship.beam('darkMetal','ramp-traction-rung',[-1.2,y+.024,z],[1.2,y+.024,z],.022,5);
 }

 // All eight containers are hollow wrecks. Missing side/roof sheets are real
 // openings, bounded by bent ribs and torn metal rather than dark decals.
 for(const cargo of LARGE_WRECK_CARGO){
  const[x,y,z]=cargo.center,[width,height,length]=cargo.size,top=y+height/2,left=x-width/2,right=x+width/2,side=cargo.side;
  const color=(cargo.bay+cargo.side)%2===0?'orangeMetal':'whiteMetal';
  ship.box('darkMetal',cargo.id+'-lower-cradle',[x,1.43,z],[width+.12,.16,length+.08]);
  const inside=x-side*width/2,outside=x+side*width/2,lean=.26+(cargo.bay%2)*.28;
  const p=(across,up,along)=>[x+side*(across+lean*up/height),1.35+up,z+along+.18*Math.sin(up*1.7+along)];
  // Intact inner bulkhead supports the aisle; its top is visibly pinched.
  ship.panel(color,cargo.id+'-creased-inner-wall',[[inside,1.35,z-3.1],[inside,1.35,z+3.1],
   [inside,top-.35,z+2.5],[inside,top-.12,z-.5],[inside,top,z-3.1]]);
  for(let rib=0;rib<8;rib++){
   const zz=z-2.7+rib*.76;
   ship.beam(color,cargo.id+'-inner-corrugation',[inside-side*.04,1.45,zz],[inside-side*.04,top-.2,zz],.047,4);
  }
  // Ragged frame around a large torn-out side, leaving the packed interior
  // visible. The middle two metres have no side or roof polygon at all.
  ship.panel(color,cargo.id+'-torn-side-bottom',[p(width/2,0,-3.1),p(width/2,0,3.1),p(width/2,.5,2.8),p(width/2+.25,.26,.8),p(width/2,.58,-.1),p(width/2,.35,-2.0)]);
  ship.panel(color,cargo.id+'-torn-side-aft',[p(width/2,0,-3.1),p(width/2,height,-3.1),p(width/2+.1,height-.25,-2.45),p(width/2+.3,height*.55,-2.15),p(width/2,.5,-2.5)]);
  ship.panel(color,cargo.id+'-torn-side-forward',[p(width/2,0,3.1),p(width/2,.6,2.4),p(width/2+.15,height*.6,2.15),p(width/2+.3,height-.3,2.75),p(width/2,height,3.1)]);
  ship.panel(color,cargo.id+'-peeled-roof-aft',[p(-width/2,height,-3.1),p(width/2,height,-3.1),p(width/2+.45,height-.38,-2.35),p(.15,height-.8,-1.55),p(-width/2,height-.17,-2.0)]);
  ship.panel(color,cargo.id+'-folded-roof-forward',[p(-width/2,height,3.1),p(width/2,height,3.1),p(width/2+.35,height+.3,2.0),p(.35,height-.55,1.3),p(-width/2,height-.25,2.1)]);
  ship.box('darkMetal',cargo.id+'-charred-floor',[x,1.48,z],[width,.26,length]);
  for(const end of[-1,1]){
   const a=p(-width/2,0,end*3.1),b=p(-width/2,height,end*3.1),c=p(width/2,height,end*3.1),d=p(width/2,0,end*3.1);
   ship.beam('darkMetal',cargo.id+'-buckled-corner-post',a,b,.09,6);
   ship.beam('darkMetal',cargo.id+'-buckled-corner-post',d,c,.09,6);
   ship.beam('darkMetal',cargo.id+'-sagging-end-header',b,p(0,height-.65,end*3.1),.085,5);
   ship.beam('darkMetal',cargo.id+'-sagging-end-header',p(0,height-.65,end*3.1),c,.085,5);
   ship.box('whiteMetal',cargo.id+'-corner-casting',c,[.22,.2,.22],[.1,.18,side*.25]);
   // One crushed door leaf remains; the other is peeled sideways and open.
   const hinge=p(width/2,height*.46,end*3.12);
   ship.box(color,cargo.id+'-torn-hanging-door',[hinge[0]+side*.48,hinge[1]-.05,hinge[2]+end*.30],[1.12,height*.83,.10],[.15,end*side*.85,side*.22]);
   ship.panel(color,cargo.id+'-crumpled-door-leaf',[p(-width/2,.08,end*3.12),p(-.55,.08,end*3.12),p(-.25,height*.55,end*2.85),p(-width/2,height*.78,end*3.12)]);
   ship.beam('whiteMetal',cargo.id+'-bent-door-bar',p(-.9,.25,end*3.17),p(-.48,height*.58,end*2.9),.045,5);
  }
  // One exposed bent rib crosses the opening without resealing the hole.
  ship.beam(color,cargo.id+'-exposed-side-rib',p(width/2,.3,-1.5),p(width/2+.4,height*.72,-1.1),.065,5);
  ship.beam(color,cargo.id+'-broken-roof-rib',p(-width/2,height,.4),p(.2,height-.7,.6),.07,5);
  ship.box('darkMetal',cargo.id+'-loose-packing-crate',[x+side*.3,1.82,z-.35],[1.25,.6,1.3],[.05,.27,side*.13]);
  ship.panel('orangeMetal',cargo.id+'-spilled-packing-sheet',[[outside,1.42,z-.5],[outside+side*1.3,.65,z+.2],[outside+side*.8,.54,z+1.3],[outside,1.38,z+1.2]]);
  for(const [belt,offset]of[-1.8,1.8].entries()){
   const zz=z+offset;
   const broken=(cargo.bay<3&&belt===(side>0?1:0));
   const inner=[inside-side*.10,1.39,zz],innerTop=[inside-side*.035,top+.07,zz],outerTop=p(width/2+.06,height+.08,offset),outer=[outside+side*.13,1.39,zz];
   if(broken){
    strap(cargo.id+'-snapped-inner-restraint',[inner,innerTop,[x,top-.15,zz],[x+side*.35,top-.85,zz+.25]]);
    strap(cargo.id+'-dangling-outer-restraint',[outer,[outside+side*.25,top-.25,zz],[outside+side*.8,top-.8,zz+.35],[outside+side*.95,.45,zz+.45]]);
   }else strap(cargo.id+'-surviving-cargo-restraint',[inner,innerTop,[x,top-.22,zz],outerTop,outer]);
   for(const xx of[left-.13,right+.13])loop(cargo.id+'-deck-anchor-loop',xx,1.41,zz);
   ship.box('darkMetal',cargo.id+'-ratchet-buckle',[outside+side*.15,1.82,zz],[.16,.37,.34],[.13,0,side*.18]);
   ship.box('whiteMetal',cargo.id+'-ratchet-handle',[outside+side*.21,1.88,zz],[.08,.065,.46],[side*.14,0,0]);
  }
 }

 // A tall cab-over front has a blunt bumper, flat windscreen, big mirrors and
 // short side windows; it reads as a hauling truck rather than a pointed jet.
 const backZ=10.6,frontZ=23.1;
 const c=LARGE_WRECK_CAB;
 ship.box('darkMetal','cab-front-floor',[0,c.topY-.125,19.55],[9.2,.25,7.1]);
 for(const side of[-1,1])ship.box('darkMetal','cab-rear-floor',[side*2.85,c.topY-.125,13.3],[3.5,.25,5.4]);
 ship.panel('darkMetal','cab-entry-ramp',[[-c.rampHalfWidth,c.entryY,c.minZ],[c.rampHalfWidth,c.entryY,c.minZ],
  [c.rampHalfWidth,c.topY,c.rampEndZ],[-c.rampHalfWidth,c.topY,c.rampEndZ]]);
 for(let i=1;i<9;i++){
  const t=i/9;ship.box('whiteMetal','cab-entry-grip',[0,c.entryY+(c.topY-c.entryY)*t+.015,c.minZ+(c.rampEndZ-c.minZ)*t],[1.8,.025,.065]);
 }
 ship.panel('orangeMetal','cab-front-face',[[-4.7,1.35,frontZ],[4.7,1.35,frontZ],[4.7,4.30,frontZ],[-4.7,4.30,frontZ]]);
 for(const side of[-1,1])ship.panel('whiteMetal','cab-rear-wall',[[side*1.2,1.35,backZ],[side*4.8,1.35,backZ],[side*4.8,8.2,backZ],[side*1.2,8.2,backZ]]);
 ship.box('whiteMetal','cab-entry-header',[0,6.8,backZ],[2.4,2.8,.16]);
 ship.panel('orangeMetal','cab-roof',[[-4.8,8.2,backZ],[4.8,8.2,backZ],[4.6,7.65,22.85],[-4.6,7.65,22.85]]);
 for(const side of[-1,1]){
  const x=side*4.8;
  ship.panel('orangeMetal','cab-side-lower',[[x,1.4,backZ],[x,1.4,22.85],[x,4.45,22.85],[x,4.75,backZ]]);
  ship.panel('whiteMetal','cab-side-upper-belt',[[x,7.35,11.0],[x,7.35,22.4],[x,7.70,22.4],[x,8.2,11.0]]);
  ship.panel('orangeMetal','cab-side-rear-pillar',[[x,4.65,backZ],[x,4.65,13.6],[x,8.03,13.6],[x,8.2,backZ]]);
  const window=[[x,4.62,14.1],[x,4.45,21.95],[side*4.65,7.25,22.20],[x,7.45,14.1]];
  if(side>0)ship.panel('glass','cab-side-window',window);
  for(let i=0;i<window.length;i++)ship.beam('darkMetal','truck-window-frame',window[i],window[(i+1)%window.length],.12,7);
  ship.box('whiteMetal','cab-door-belt',[side*4.87,4.18,17.2],[.13,.26,7.1]);
  ship.box('darkMetal','cab-door-handle',[side*4.94,3.70,14.8],[.09,.14,.65]);
  for(const y of[1.65,2.25])ship.box('darkMetal','truck-cab-entry-step',[side*5.10,y,15.8],[.60,.16,2.7]);
  ship.beam('whiteMetal','mirror-support',[side*4.65,5.45,21.4],[side*6.05,5.55,21.4],.10,7);
  ship.box('darkMetal','large-truck-side-mirror',[side*6.08,5.55,21.4],[.30,1.30,.72],[0,side*.07,0]);
  ship.box('glass','truck-mirror-glass',[side*6.08,5.56,21.77],[.235,1.12,.025]);
  ship.box('orangeMetal','cab-wheelhouse-armor',[side*4.85,1.72,19.0],[.60,1.65,4.0]);
 }
 const windscreens=[
  [[-4.42,4.48,23.12],[-.15,4.48,23.12],[-.15,7.38,22.83],[-4.42,7.38,22.83]],
  [[.15,4.48,23.12],[4.42,4.48,23.12],[4.42,7.38,22.83],[.15,7.38,22.83]],
 ];
 for(const[index,pane]of windscreens.entries()){
  if(index===1)ship.panel('glass','truck-front-windscreen',pane);
  else{
   ship.panel('glass','shattered-driver-windscreen',[pane[0],pane[1],[.12,6.55,22.91],[-1.6,6.10,22.96],[-2.5,7.38,22.83],pane[3]]);
   ship.beam('darkMetal','broken-windscreen-wiper',[-3.8,4.62,23.19],[-1.5,5.28,23.12],.045,5);
  }
  for(let i=0;i<pane.length;i++)ship.beam('whiteMetal','cab-front-glazing-frame',pane[i],pane[(i+1)%pane.length],.14,8);
 }
 ship.box('darkMetal','wide-truck-grille',[0,2.76,23.20],[7.5,1.55,.18]);
 for(let i=0;i<12;i++)ship.box('whiteMetal','truck-grille-slat',[-3.4+i*.618,2.76,23.32],[.12,1.30,.10]);
 ship.box('whiteMetal','heavy-space-truck-bumper',[0,1.22,23.5],[10.7,1.06,.80]);
 for(const side of[-1,1]){
  ship.box('darkMetal','headlamp-recess',[side*4.14,3.25,23.23],[.95,.75,.28]);
  ship.box('whiteMetal','unpowered-headlamp-lens',[side*4.14,3.25,23.39],[.70,.50,.065]);
  ship.box('darkMetal','front-towing-eye',[side*3.5,1.0,23.92],[.50,.32,.16]);
  // Chunky, shielded biological-free thruster plumbing marks the space drive.
  ship.add('darkMetal','rear-cab-vent-stack',new THREE.CylinderGeometry(.38,.43,6.7,10),[side*4.48,5.0,11.2]);
  for(const y of[2.5,4.7,7.2])ship.add('whiteMetal','stack-heat-shield-ring',new THREE.TorusGeometry(.45,.06,4,8),[side*4.48,y,11.2],[Math.PI/2,0,0]);
 }
 // Pressed-in cheeks, roof and grille retain the original truck front.
 ship.box('darkMetal','cab-dashboard',[0,4.2,21.5],[6.8,.30,1.1]);
 for(const side of[-1,1]){
  ship.box('darkMetal','cab-seat-cushion',[side*1.75,3.7,18.8],[1.45,.50,1.6]);
  ship.box('darkMetal','cab-seat-back',[side*1.75,4.55,18.15],[1.4,1.55,.22],[.10,0,0]);
 }
 addHaulerCabinDecor(ship);

 // Both engine pods have lost most fairing. Bare turbine cores and broken
 // impellers sit in visibly incomplete shells; no opaque disk caps the rear.
 for(const side of[-1,1]){
  const x=side*6.6,y=2.0,z=-17.5;
  ship.add('darkMetal','ruptured-jet-bottom-casing',new THREE.CylinderGeometry(1.75,1.88,8.8,16,1,true,Math.PI*.2,Math.PI*.92),[x,y,z],[Math.PI/2,0,side*.1]);
  ship.add('orangeMetal','torn-jet-armor-remnant',new THREE.CylinderGeometry(1.83,1.96,3.0,12,1,true,Math.PI*.4,Math.PI*.75),[x,y,z+2.5],[Math.PI/2,0,side*.1]);
  ship.add('darkMetal','exposed-engine-turbine-core',new THREE.CylinderGeometry(.57,.68,7.7,12,1,true),[x,y,z],[Math.PI/2,0,0]);
  for(const dz of[-3.8,-1.5,1.2,3.4]){
   ship.add('whiteMetal','exposed-turbine-ring',new THREE.TorusGeometry(1.14,.11,5,14),[x,y,z+dz],[0,side*.08,dz*.03]);
   for(let blade=0;blade<8;blade++){
    const a=blade*Math.PI/4;
    if((blade+Math.round(dz))%4===0)continue;
    ship.box('darkMetal','ruptured-engine-impeller',[x+Math.cos(a)*.84,y+Math.sin(a)*.84,z+dz],[.22,.75,.18],[.25,side*.2,a-Math.PI/2]);
   }
  }
  // Bent nozzle is open through to the spindle, with a missing rim section.
  ship.add('whiteMetal','broken-jet-nozzle-ring',new THREE.TorusGeometry(1.75,.09,5,18,Math.PI*1.48),[x,y,z-4.45],[.07,side*.13,.2]);
  for(let j=0;j<4;j++){
   const xx=x+side*(.55+j*.24);
   ship.beam('darkMetal','exposed-engine-feed-pipe',[xx,2.5,-12.8],[xx+.15,2.9,-15.4],.07,6);
   ship.beam('darkMetal','severed-engine-feed-pipe',[xx+.15,2.9,-15.4],[xx+side*.55,1.35,-16.2-j*.12],.07,6);
  }
  ship.beam('darkMetal','flatbed-jet-mount',[side*4.45,1.12,z],[x,1.25,z],.32,8);
  ship.panel('orangeMetal','engine-fairing-torn-open',[[x,3.7,z+3.4],[x+side*1.3,3.1,z+3.5],[x+side*1.9,1.4,z+1.3],[x+side*.8,2.7,z+.3]]);
 }
 // Grounded impact debris stays inside the compact crash footprint. Random
 // placement is deterministic so the wreck remains identical on every load.
 for(let i=0;i<18;i++){
  const side=i%2?-1:1,x=side*(5.5+(i%4)*.73),z=-20.9+(i*2.43)%44.1;
  const ground=landingHeightAt(x,z);
  if(!Number.isFinite(ground))throw new TypeError('Cargo-hauler debris grounding must be finite.');
  ship.box(i%3?'orangeMetal':'whiteMetal','scattered-torn-metal',[x,ground+.14,z],[.7+(i%3)*.35,.12,.6+(i%4)*.31],[.06,i*.81,.12]);
  ship.beam('darkMetal','scattered-snapped-spar',[x-.3,ground+.16,z-.6],[x+.4,ground+.28,z+.55],.065,5);
 }
 for(const cargo of LARGE_WRECK_CARGO){
  const[x,y,z]=cargo.center,top=y+cargo.size[1]/2;
  ship.add('snow','snow-in-crushed-cargo',new THREE.IcosahedronGeometry(1,1),[x-cargo.side*.75,top-.13,z-2.5],[0,.18,.02],[.9,.10,.38]);
  ship.add('snow','snow-filled-cargo-floor',new THREE.IcosahedronGeometry(1,1),[x,1.61,z+.45],[0,.18,.02],[1.2,.065,1.4]);
 }
 ship.add('snow','packed-snow-on-cab-roof',new THREE.IcosahedronGeometry(1,1),[1.8,7.99,13],[0,.18,.02],[1.8,.10,1.2]);
 ship.box('orangeMetal','detached-front-armor-panel',[-6.55,landingHeightAt(-6.55,18.0)+.17,18.0],[2.0,.14,2.5],[0,-.25,.04]);
 const group=ship.finish();group.userData.rampStartY=rampStartY;return group;
}
