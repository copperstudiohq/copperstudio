import * as THREE from './vendor/three.module.js';
import {STRUCTURE_SPECS,BASE_SIDE_PLANK_BOUNDS} from './base-building.js';
import {sideArmorOuterXAt} from './base-armor-taper.js';
import {createRoundedWallBand,createBaseFloorPattern} from './base-patterns.js';
import {createRoundedBaseRoof,createInsetWallPanel,createRoundedPerimeter,createMetalWallBand} from './base-trim.js';
import {createRoofCross} from './base-roof-cross.js';
import {addHabitatLighting,interiorSurfaceShade} from './base-lighting.js';
import {addHabitatDoor} from './base-door-renderer.js';
import {addHabitatFurniture} from './furniture-renderer.js';
import {FURNITURE_SPECS} from './build-catalog.js';

const v=(x,y,z)=>new THREE.Vector3(x,y,z),UP=v(0,1,0);
/** Merge fixed fittings by material. A completed house uses six draw calls. */
class StructureMesh{
 constructor({shadeInterior=false}={}){this.batches=new Map();this.pose=new THREE.Object3D();this.shadeInterior=shadeInterior;}
 add(kind,name,geometry,position=[0,0,0],rotation=[0,0,0],color=0xffffff){
  const details=Object.keys(geometry.userData).length?{...geometry.userData}:null;
  const source=geometry.index?geometry.toNonIndexed():geometry.clone();geometry.dispose();
  this.pose.position.fromArray(position);this.pose.rotation.set(...rotation);this.pose.updateMatrix();source.applyMatrix4(this.pose.matrix);
  if(!source.attributes.normal)source.computeVertexNormals();
  const p=source.attributes.position,n=source.attributes.normal,uv=source.attributes.uv,sourceColor=source.attributes.color,tint=new THREE.Color(color);
  let batch=this.batches.get(kind);if(!batch){batch={positions:[],normals:[],uvs:[],colors:[],features:[]};this.batches.set(kind,batch);}
  const first=batch.positions.length/3;
  for(let i=0;i<p.count;i++){
   const wear=(kind==='sky'?1:.91+.09*Math.sin(p.getX(i)*19+p.getY(i)*13+p.getZ(i)*17)**2)*(this.shadeInterior?interiorSurfaceShade(kind,p.getX(i),p.getY(i),p.getZ(i)):1);
   batch.positions.push(p.getX(i),p.getY(i),p.getZ(i));batch.normals.push(n.getX(i),n.getY(i),n.getZ(i));
   batch.uvs.push(uv?.getX(i)??p.getX(i),uv?.getY(i)??p.getZ(i));
   batch.colors.push(tint.r*wear*(sourceColor?.getX(i)??1),tint.g*wear*(sourceColor?.getY(i)??1),tint.b*wear*(sourceColor?.getZ(i)??1));
  }
  batch.features.push({name,first,count:p.count,...(details?{details}:{})});source.dispose();
 }
 box(kind,name,position,size,color,rotation=[0,0,0]){this.add(kind,name,new THREE.BoxGeometry(...size),position,rotation,color);}
 strut(kind,name,a,b,radius,color){
  const start=v(...a),end=v(...b),axis=end.clone().sub(start),rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,axis.clone().normalize()));
  this.add(kind,name,new THREE.CylinderGeometry(radius,radius,axis.length(),8),start.add(end).multiplyScalar(.5).toArray(),[rotation.x,rotation.y,rotation.z],color);
 }
 capsule(kind,name,position,height,radius,color,rotation=[0,0,0]){
  const geometry=new THREE.CapsuleGeometry(radius,Math.max(0,height-radius*2),3,10);geometry.userData={rounded:true,radiusMeters:radius};this.add(kind,name,geometry,position,rotation,color);
 }
 finish(materials,name){
  const group=new THREE.Group();group.name=name;
  for(const[kind,batch]of this.batches){
   const geometry=new THREE.BufferGeometry();
   for(const[field,values,size]of[['position',batch.positions,3],['normal',batch.normals,3],['uv',batch.uvs,2],['color',batch.colors,3]])geometry.setAttribute(field,new THREE.Float32BufferAttribute(values,size));
   geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.userData.features=batch.features;
   const mesh=new THREE.Mesh(geometry,materials[kind]);mesh.name=`${name}-${kind}`;mesh.receiveShadow=kind!=='sky';mesh.castShadow=false;group.add(mesh);
  }
  return group;
 }
}

function universalBase(site,materials){
 const b=new StructureMesh({shadeInterior:true}),height=STRUCTURE_SPECS['universal-base'].height/25,bandHeight=Math.min(3.15,height-.6),plank=BASE_SIDE_PLANK_BOUNDS,plankOrigin=plank.innerX/25+.06,navy=0x285879;
 b.box('metal','level-reinforced-foundation-slab',[0,-.12,0],[11.7,.24,15.7],0x405a65);
 b.box('floor','smooth-continuous-interior-floor',[0,.012,0],[11.38,.024,15.38],0x9ca7ad);
 b.add('floor','hexagonal-floor-outlines-and-navy-inlays',createBaseFloorPattern());
 // Panel corners meet heavy framing, leaving visible inset seams rather than
 // a single plain cube. The room stays twelve by sixteen metres; its side
 // armor projects one metre beyond each exterior wall.
 for(const side of[-1,1]){
  for(const z of[-5.8,-1.93,1.93,5.8]){
   b.add('shell','recessed-side-armor-module',createInsetWallPanel(3.82,height-.30),[side*5.87,(height-.30)/2,z],[0,side*Math.PI/2,0],0xf6f7f5);
   for(const y of[.24,height-.25])for(const dz of[-.76,.76])b.add('metal','exterior-locking-bolt',new THREE.CylinderGeometry(.034,.034,.025,6),[side*5.999,y,z+dz],[0,0,Math.PI/2],0x71848b);
  }
  b.box('interior','insulated-inner-side-wall',[side*5.70,height/2,0],[.035,height-.04,15.4],0xf8f9f5);
  for(const z of[-4,0,4])b.box('metal','side-load-bearing-rib',[side*5.84,height/2,z],[.28,height+.02,.16],0xc8d3d5);
  b.add('shell',`outer-gray-wall-band-${side<0?'left':'right'}`,createRoundedWallBand(15.2),[side*5.997,bandHeight,0],[0,side*Math.PI/2,0]);
  b.add('interior',`inner-gray-wall-band-${side<0?'left':'right'}`,createRoundedWallBand(14.8),[side*5.681,bandHeight,0],[0,-side*Math.PI/2,0]);
  b.add('metal','outer-blue-metal-band-side',createMetalWallBand(plank.halfLength*2/25,(plank.top-plank.bottom)/25,sideArmorOuterXAt(0)/25-plankOrigin),[side*plankOrigin,(plank.top+plank.bottom)/50,0],[0,side*Math.PI/2,0]);
  const circle=new THREE.CircleGeometry(.45,40);circle.userData={painted:true,radiusMeters:.45};
  b.add('interior','side-armor-center-circle',circle,[side*(sideArmorOuterXAt(0)/25+.003),(plank.top+plank.bottom)/50,0],[0,side*Math.PI/2,0],0x62686c);
 }
 for(const x of[-3.82,0,3.82])b.add('shell','recessed-rear-armor-module',createInsetWallPanel(3.72,height-.30,.30),[x,(height-.30)/2,-7.85],[0,Math.PI,0],0xf6f7f5);
 b.box('interior','insulated-rear-wall',[0,height/2,-7.68],[11.4,height-.04,.025],0xf8f9f5);
 b.add('shell','outer-gray-wall-band-rear',createRoundedWallBand(11.3),[0,bandHeight,-8.001],[0,Math.PI,0]);
 b.add('interior','inner-gray-wall-band-rear',createRoundedWallBand(10.95),[0,bandHeight,-7.666],[0,0,0]);
 for(const side of[-1,1]){
  b.add('shell','recessed-front-armor-module',createInsetWallPanel(4.35,height-.30,.30),[side*3.575,(height-.30)/2,7.85],[0,0,0],0xf6f7f5);
  b.box('interior','front-insulation',[side*3.57,height/2,7.68],[4.22,height-.04,.035],0xf8f9f5);
  b.capsule('metal','rounded-navy-door-jamb',[side*1.52,1.36,7.85],2.72,.12,navy);
 }
 b.box('shell','armored-door-header',[0,(height-.3+2.6)/2,7.85],[2.8,height-.3-2.6,.3],0xf6f7f5);
 b.box('interior','insulated-door-header',[0,(height+2.6)/2,7.68],[2.8,height-2.6,.035],0xf8f9f5);
 b.add('shell','outer-gray-wall-band-front',createRoundedWallBand(11.3),[0,bandHeight,8.001]);
 b.add('interior','inner-gray-wall-band-front',createRoundedWallBand(10.95),[0,bandHeight,7.661],[0,Math.PI,0]);
 b.capsule('metal','rounded-navy-door-lintel',[0,2.72,7.85],3.28,.12,navy,[0,0,Math.PI/2]);
 const door=addHabitatDoor(b,site);
 const roof=createRoundedBaseRoof(),cross=createRoofCross(roof);
 b.add('shell','sculpted-white-shoulder-and-blue-roof-crown',roof,[0,height,0]);
 b.add('interior','roof-corner-cross',cross,[0,height,0],[0,0,0],0x62686c);
 b.add('metal','rounded-navy-roof-perimeter',createRoundedPerimeter(11.78,15.78,.13,.11),[0,height-.20,0],[0,0,0],navy);
 b.add('metal','rounded-navy-bottom-perimeter',createRoundedPerimeter(11.76,15.76,.12,.12),[0,-.12,0],[0,0,0],navy);
 for(const x of[-1,1])for(const z of[-1,1]){
  b.capsule('metal','rounded-navy-exterior-corner-guard',[x*5.77,height/2,z*7.77],height,.23,navy);
  b.capsule('metal','rounded-navy-interior-corner-guard',[x*5.63,height/2,z*7.62],height,.10,navy);
 }
 const ceilingLighting=addHabitatLighting(b,height);
 const furnishing=addHabitatFurniture(b,site.furniture??[]);
 for(const foot of site.ground??[]){
  const x=foot.x/25,z=foot.y/25,bottom=(foot.z-site.z)/25,top=-.12,height=top-bottom;
  b.box('metal','foundation-spread-foot',[x,bottom+.045,z],[.64,.09,.64],0x415d6c);
  b.add('metal','automatic-foundation-pole',new THREE.CylinderGeometry(.14,.18,Math.max(.05,height),10),[x,(bottom+top)/2,z],[0,0,0],0x607a86);
  b.add('metal','adjustable-pole-collar',new THREE.CylinderGeometry(.22,.22,.14,10),[x,Math.min(-.2,bottom+.25),z],[0,0,0],0x344f5e);
 }
 const s=site.stair;
 if(s){
  const run=s.run/25,rise=(site.z-s.bottom)/25,width=s.width/25;
  for(let i=0;i<s.steps;i++){
   const top=-rise+rise*(i+1)/s.steps,z=s.end/25-run*(i+.5)/s.steps;
   b.box('metal','automatic-entry-stair-tread',[0,top-.045,z],[width,.09,run/s.steps+.006],0x708895);
   b.box('light','stair-safety-edge',[0,top+.001,z-run/s.steps/2+.022],[width-.08,.01,.035],0xc3b57d);
  }
  for(const side of[-1,1]){
   b.strut('metal','stair-stringer',[side*(width/2-.15),-rise-.08,s.end/25],[side*(width/2-.15),-.08,s.start/25],.065,0x405e6d);
   b.strut('metal','stair-handrail',[side*(width/2+.02),-rise+.92,s.end/25],[side*(width/2+.02),.92,s.start/25],.04,0x9bb2b7);
   for(const t of[0,.5,1])b.strut('metal','stair-rail-upright',[side*(width/2+.02),-rise*(1-t),s.end/25-run*t],[side*(width/2+.02),-rise*(1-t)+.92,s.end/25-run*t],.025,0x718c97);
  }
 }
 const group=b.finish(materials,'universal-base');group.userData={widthMeters:12,lengthMeters:16,clearHeightMeters:height,reinforced:true,skyCeiling:true,...ceilingLighting,...door,...furnishing,dimInterior:true,whiteWalls:true,grayWallBands:8,smoothFloor:true,hexagonalFloor:true,roundedNavyEdges:true,sculptedShoulders:true,recessedWallModules:13,blueRoofAreaFraction:.76,automaticStairs:true,foundationPoleCount:site.ground?.length??0};return group;
}

function workbench(materials){
 const b=new StructureMesh();
 b.box('metal','salvage-workbench-top',[0,.88,0],[1.76,.08,.96],0x839798);
 b.box('shell','wood-salvage-working-insert',[-.10,.93,0],[1.35,.025,.71],0x9a7955);
 for(const x of[-.72,.72])for(const z of[-.32,.32]){
  b.box('metal','bench-square-leg',[x,.43,z],[.075,.86,.075],0x405f6b);
  b.box('metal','bench-foot-plate',[x,.025,z],[.19,.05,.17],0x263f4e);
 }
 b.box('metal','bench-low-tool-shelf',[0,.24,0],[1.48,.055,.69],0x526d77);
 b.box('metal','bench-rear-tool-rail',[0,1.06,-.37],[1.5,.20,.045],0x3a5664);
 b.box('metal','workbench-vise-base',[.54,.98,.18],[.32,.09,.30],0x405a66);
 for(const z of[.08,.32])b.box('metal','vice-jaws',[.54,1.075,z],[.29,.16,.055],0x84958f);
 b.add('metal','vice-handle',new THREE.CylinderGeometry(.015,.015,.35,8),[.54,.99,.45],[0,0,Math.PI/2],0x9ba7a0);
 b.box('shell','copper-knife-blank',[-.35,.96,.1],[.06,.022,.31],0xa86c44,[0,.35,0]);
 b.box('shell','broken-copper-scrap',[.05,.97,-.13],[.19,.035,.16],0xaa774e,[0,-.24,0]);
 return b.finish(materials,'salvage-workbench');
}

function materialsFor(finishMaterial){
 const materials={
  shell:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.18}),
  metal:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.54,metalness:.68}),
  interior:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.48,metalness:.04}),
  floor:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.19,metalness:.12}),
  sky:new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,fog:false,toneMapped:false}),
  light:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.28,emissive:0xffffff,emissiveIntensity:1.15}),
 };
 for(const material of Object.values(materials))finishMaterial?.(material);
 return materials;
}

export class BaseRenderer{
 constructor(world,{finishMaterial}={}){
  this.group=new THREE.Group();this.group.name='player-built-croba-shelters';this.materials=materialsFor(finishMaterial);this.version=null;this.disposed=false;this.records=[];
  this.ghost=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0x9be3cc,wireframe:true,transparent:true,opacity:.55,depthWrite:false,toneMapped:false}));
  this.ghost.name='land-construction-preview';this.ghost.visible=false;
  this.furnitureGhost=new THREE.Group();this.furnitureGhost.name='furniture-placement-preview';this.furnitureGhost.visible=false;
  this.previewMaterial=new THREE.MeshBasicMaterial({color:0x82e8c4,transparent:true,opacity:.34,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  this.group.add(this.ghost,this.furnitureGhost);this.update(world);
 }
 rebuild(world){
  for(const{group}of this.records){group.traverse(o=>o.geometry?.dispose());group.removeFromParent();}this.records=[];
  for(const site of[...(world.structures?.bases??[]),...(world.structures?.workbenches??[])]){
   const group=site.kind==='universal-base'?universalBase(site,this.materials):workbench(this.materials);
   group.position.set(site.x/25,site.z/25,site.y/25);group.rotation.y=site.yaw;group.userData.siteId=site.id;this.group.add(group);this.records.push({site,group});
  }
  this.version=world.structures?.version??0;this.state=world.structures;
 }
 update(world,camera,range=Infinity){
  if(this.disposed)return;
  if(this.version!==(world.structures?.version??0)||this.state!==world.structures)this.rebuild(world);
  for(const{site,group}of this.records){const extent=site.kind==='universal-base'?18:2;group.visible=!camera||Math.hypot(camera.x-site.x/25,camera.y-site.z/25,camera.z-site.y/25)<=range+extent;}
  const preview=world.buildPreview,site=preview?.record,furniture=site&&FURNITURE_SPECS[site.kind],spec=site&&(STRUCTURE_SPECS[site.kind]??furniture);
  this.ghost.visible=Boolean(spec&&!furniture);this.furnitureGhost.visible=Boolean(furniture);
  if(furniture){
   if(this.previewKind!==site.kind){
    this.furnitureGhost.traverse(object=>object.geometry?.dispose());this.furnitureGhost.clear();
    const builder=new StructureMesh();addHabitatFurniture(builder,[{id:'preview',kind:site.kind,x:0,y:0,yaw:0}]);
    this.furnitureGhost.add(builder.finish({interior:this.previewMaterial,metal:this.previewMaterial},'furniture-blueprint'));this.previewKind=site.kind;
   }
   this.furnitureGhost.position.set(site.x/25,site.z/25,site.y/25);this.furnitureGhost.rotation.y=site.yaw;this.previewMaterial.color.setHex(preview.valid?0x82e8c4:0xef866d);
  }else if(spec){this.ghost.position.set(site.x/25,(site.z+spec.height/2)/25,site.y/25);this.ghost.rotation.y=site.yaw;this.ghost.scale.set(spec.width/25,spec.height/25,spec.length/25);this.ghost.material.color.setHex(preview.valid?0x82e8c4:0xef866d);}
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const{group}of this.records)group.traverse(o=>o.geometry?.dispose());this.ghost.geometry.dispose();this.ghost.material.dispose();this.furnitureGhost.traverse(object=>object.geometry?.dispose());this.previewMaterial.dispose();Object.values(this.materials).forEach(m=>m.dispose());this.group.removeFromParent();this.group.clear();this.records=[];
 }
}
