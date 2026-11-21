import * as THREE from './vendor/three.module.js';
import {SupplyMeshBuilder,createExplorerHand} from './tool-models.js';

export const OPENING_FLIGHT_DURATION=46;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const between=(time,start,end)=>smooth((time-start)/(end-start));
const mix=(a,b,t)=>a+(b-a)*t;
const UP=new THREE.Vector3(0,1,0),FORWARD=new THREE.Vector3(0,0,1);
const SHOTS=Object.freeze([15.6,17.5,19.4]);
const PHASES=Object.freeze([
 [0,'orbit','Coasting past Croba','Croba passes beside the ship. The sun and open space lie ahead.'],
 [6,'mistake','The wrong switch','Your friend reaches across the console. The cloak begins to fail.'],
 [11,'spotted','Something sees you','An alien vessel draws alongside on the right. Your ship is no longer hidden.'],
 [15,'attack','Incoming fire','The enemy opens fire. The cabin shudders.'],
 [20,'breach','Window breach','The right window breaks. Your friend is pulled into space.'],
 [24,'brace','Lock the harness','Hold on. Pull the straps tight and secure your seat.'],
 [29,'descent','Croba’s Arctic pole','White glaciers, vast purple spruce forests and sulfuric volcanic regions rush closer.'],
 [40,'blackout','Impact imminent','The ice rises through the window.'],
 [44,'wake','A cold silence','Your rescue tether has brought you back to the wreck.'],
]);

/** @typedef {{seconds:number,phase:string,title:string,subtitle:string,blackout:number,progress:number,finished:boolean,press:number,cloak:number,enemy:number,hit:number,breach:number,extraction:number,brace:number,latch:number,descent:number}} OpeningFlightState */
/** A pure, seekable timeline. Wake deliberately fades onto the existing game
 * scene; the controller owns that handoff and withholds simulation until46s.
 * @param {number} seconds @returns {Readonly<OpeningFlightState>} */
export function sampleOpeningFlight(seconds){
 const time=clamp(Number.isFinite(seconds)?seconds:0,0,OPENING_FLIGHT_DURATION);
 const row=PHASES.findLast(phase=>time>=phase[0]);
 const hit=SHOTS.reduce((value,shot)=>Math.max(value,Math.max(0,1-Math.abs(time-shot-.12)/.26)),0);
 const blackout=time<44?between(time,40,42):1-between(time,44,46);
 return Object.freeze({seconds:time,phase:row[1],title:row[2],subtitle:row[3],blackout,progress:time/OPENING_FLIGHT_DURATION,finished:time>=OPENING_FLIGHT_DURATION,
  press:between(time,6.3,9)*(1-between(time,10.3,12)),cloak:1-between(time,9.5,10.5),enemy:between(time,11,14),hit,
  breach:between(time,19.6,20.2),extraction:between(time,20,24),brace:between(time,24,26.5),latch:between(time,26,27.2),descent:between(time,29,40)});
}

/** Bake static directional shading into vertex colors, including the existing
 * glove. The cinematic needs no realtime lights, shadow maps or texture loads. */
function unlit(group){
 const light=new THREE.Vector3(-.45,.75,.6).normalize();
 group.traverse(object=>{
  if(!object.isMesh)return;
  const geometry=object.geometry,position=geometry.attributes.position,normal=geometry.attributes.normal;
  if(!geometry.attributes.color)geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(position.count*3).fill(1),3));
  const color=geometry.attributes.color;
  for(let i=0;i<position.count;i++){
   const shade=.48+.52*Math.max(0,normal.getX(i)*light.x+normal.getY(i)*light.y+normal.getZ(i)*light.z);
   color.setXYZ(i,color.getX(i)*shade,color.getY(i)*shade,color.getZ(i)*shade);
  }
  const old=object.material;object.material=new THREE.MeshBasicMaterial({vertexColors:true,color:old.color,side:old.side});old.dispose();
 });return group;
}
const finish=(builder,name)=>unlit(builder.finish(name));
const basic=(geometry,color,options={})=>new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,...options}));
function strap(builder,a,b,width,color){
 const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start),rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,direction.clone().normalize()));
 builder.box('grip',start.add(end).multiplyScalar(.5).toArray(),[width,direction.length(),.018],color,[rotation.x,rotation.y,rotation.z]);
}
function makeCockpit(){
 const b=new SupplyMeshBuilder(),navy=0x254e68,metal=0x82979e,dark=0x152c3b;
 b.box('metal',[0,-.18,-.1],[4.5,.28,6.0],dark);b.box('metal',[0,2.63,-.25],[4.5,.18,5.4],navy);
 b.box('metal',[0,1.1,2.1],[4.5,3,.18],dark);
 for(const side of[-1,1]){
  b.box('metal',[side*2.16,.40,-.15],[.18,1.1,5.5],navy);
  b.link('metal',[side*2.1,.75,-2.5],[side*1.83,2.55,-2.7],.075,metal);
  b.link('metal',[side*2.16,2.58,.9],[side*1.83,2.55,-2.7],.065,metal);
  b.box('metal',[side*1.87,1.25,.8],[.10,2.5,.12],metal);
 }
 b.link('metal',[-2.1,.75,-2.5],[2.1,.75,-2.5],.075,metal);b.link('metal',[-1.83,2.55,-2.7],[1.83,2.55,-2.7],.065,metal);
 b.link('metal',[.25,.75,-2.5],[.25,2.55,-2.7],.045,metal);
 b.box('metal',[0,.64,-1.72],[4,.33,1.15],navy,[.08,0,0]);
 for(const x of[-1.2,-.35,.5]){
  b.box('rubber',[x,.88,-1.59],[.68,.06,.43],0x0b1d2b,[-.25,0,0]);
  b.box('lens',[x,.918,-1.57],[.56,.008,.31],0x58c9df,[-.25,0,0]);
  for(let i=0;i<5;i++)b.box('metal',[x-.23+i*.11,.94,-1.69],[.025,.015,.03],0xc8edf0);
 }
 for(const x of[-.62,.78]){
  b.box('grip',[x,.25,-.15],[.72,.17,.88],0x304c61);b.box('grip',[x,.86,.15],[.72,1.18,.21],0x274255,[-.12,0,0]);
  b.box('grip',[x,1.52,.08],[.56,.27,.19],0x466174);
  for(const side of[-1,1])b.box('metal',[x+side*.36,.51,-.16],[.08,.09,.70],metal);
 }
 for(let i=0;i<12;i++)b.box('metal',[-1.7+i*.30,.77,-1.08],[.065,.025,.09],i===10?0xd49a4d:0x546f80);
 return finish(b,'opening-cockpit');
}
function makeFriend(){
 const root=new THREE.Group(),b=new SupplyMeshBuilder();root.name='suited-friend';
 b.sphere('grip',[0,.86,.02],[.25,.36,.18],0xd5dfda);b.sphere('grip',[0,.49,.04],[.24,.17,.20],0x829aaa);
 b.box('metal',[0,.95,-.145],[.25,.24,.045],0x3a6c8b);b.box('lens',[0,1.00,-.176],[.13,.055,.014],0x9ce8ee);
 for(const side of[-1,1]){
  b.link('grip',[side*.12,.48,.0],[side*.16,.36,-.38],.11,0x91a7b2);b.link('grip',[side*.16,.36,-.38],[side*.16,.06,-.60],.085,0xbfcfce);
  b.sphere('rubber',[side*.16,.045,-.68],[.105,.07,.18],0x243a4b);
  strap(b,[side*.17,1.12,-.155],[side*.04,.57,-.185],.045,0x243f53);
 }
 b.link('grip',[-.24,1.10,.02],[-.32,.80,.10],.075,0xcbd8d3);b.link('grip',[-.32,.80,.10],[-.25,.57,-.08],.065,0x8ca5b2);b.sphere('rubber',[-.25,.55,-.10],[.07,.08,.09],0x354d5b);
 root.add(finish(b,'friend-suit'));
 const head=new THREE.Group(),h=new SupplyMeshBuilder();head.position.set(0,1.39,0);
 h.sphere('grip',[0,0,0],[.225,.25,.225],0xd3ded9);h.sphere('lens',[0,.015,-.175],[.166,.135,.085],0x162b40);
 h.add('metal',new THREE.TorusGeometry(.16,.014,5,18),[0,.015,-.204],[1,.83,1],[0,0,0],0x5b7f91);h.box('lens',[.10,.07,-.232],[.035,.012,.012],0xa3f6ee);
 head.add(finish(h,'friend-helmet'));root.add(head);
 const armPart=(length,name)=>{const a=new SupplyMeshBuilder();a.link('grip',[0,0,0],[0,-length,0],.068,0xc2d2d0);a.add('metal',new THREE.TorusGeometry(.073,.014,5,12),[0,-length*.82,0],[1,1,1],[Math.PI/2,0,0],0x395e78);if(name==='forearm'){a.sphere('grip',[0,-length-.045,0],[.072,.08,.065],0x354f5f);for(let i=0;i<4;i++)a.link('grip',[-.05+i*.03,-length-.02,-.015],[-.05+i*.03,-length-.11,-.025],.013,0x466573);}return finish(a,`friend-${name}`);};
 const upper=armPart(.35,'upperarm'),fore=armPart(.37,'forearm');root.add(upper,fore);return{root,head,upper,fore};
}
function planetRegion(normal){
 const lat=normal.y,lon=Math.atan2(normal.z,normal.x),ellipse=(y,x,ry,rx)=>((lat-y)/ry)**2+(Math.atan2(Math.sin(lon-x),Math.cos(lon-x))/rx)**2<1;
 if(lat>.81+.018*Math.sin(lon*7))return'ice';
 const main=ellipse(.38,1.1,.44,.68),far=ellipse(-.2,-1.15,.45,.85),east=ellipse(.25,2.5,.28,.38);
 if(!main&&!far&&!east)return'ocean';
 if(east||main&&lat<.22&&lon<.95)return'sulfur';
 if(main&&lat>.23&&lat<.72)return'forest';
 return main&&lat>=.72?'ice':'land';
}
function planetColor(normal,target){
 const lat=normal.y,lon=Math.atan2(normal.z,normal.x),grain=.035*Math.sin(normal.x*73+normal.z*31)*Math.sin(lat*83-lon*19),region=planetRegion(normal);
 target.setHex({ice:0xe1f0ee,sulfur:0xbe7943,forest:0x724992,land:0x7097a6,ocean:0x154a72}[region]);
 const light=.34+.66*Math.max(0,-normal.x*.5+normal.y*.55+normal.z*.65);target.multiplyScalar(Math.max(.1,light+grain));return target;
}
function makePlanet(){
 const root=new THREE.Group();root.name='croba-planet-polar-descent';
 const sphere=new THREE.SphereGeometry(100,80,48),p=sphere.attributes.position,colors=new Float32Array(p.count*3),normal=new THREE.Vector3(),tint=new THREE.Color();
 for(let i=0;i<p.count;i++){normal.fromBufferAttribute(p,i).normalize();planetColor(normal,tint);colors.set([tint.r,tint.g,tint.b],i*3);}sphere.setAttribute('color',new THREE.BufferAttribute(colors,3));
 root.add(new THREE.Mesh(sphere,new THREE.MeshBasicMaterial({vertexColors:true})));
 root.add(basic(new THREE.SphereGeometry(101.1,48,28),0x82c8e6,{transparent:true,opacity:.115,side:THREE.BackSide,depthWrite:false}));
 const treeBuilder=new SupplyMeshBuilder();for(let layer=0;layer<3;layer++)treeBuilder.add('grip',new THREE.ConeGeometry(.48-layer*.09,.86,6),[0,.28+layer*.32,0],[1,1,1],[0,0,0],layer===2?0xa67ac0:0x69458b);
 const source=finish(treeBuilder,'planet-spruce-prototype'),prototype=source.children[0];source.remove(prototype);
 const trees=new THREE.InstancedMesh(prototype.geometry,prototype.material,224),mountains=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,5),new THREE.MeshBasicMaterial({color:0xd9e9e6}),96);
 const vents=new THREE.InstancedMesh(new THREE.ConeGeometry(.9,1.1,7),new THREE.MeshBasicMaterial({color:0xc18449}),32),pose=new THREE.Object3D();let treeCount=0,mountainCount=0,ventCount=0;
 for(let row=0;row<14;row++)for(let col=0;col<16;col++){
  const lat=.30+row*.025,lon=.65+col*.065+Math.sin(row*7+col)*.008,y=lat,r=Math.sqrt(1-y*y);normal.set(Math.cos(lon)*r,y,Math.sin(lon)*r);
  pose.position.copy(normal).multiplyScalar(100.1);pose.quaternion.setFromUnitVectors(UP,normal);pose.scale.setScalar(.8+.25*Math.sin(row*4+col*9));pose.updateMatrix();trees.setMatrixAt(treeCount++,pose.matrix);
 }
 for(let i=0;i<96;i++){const y=.83+(i%8)*.020,lon=i*2.39996,r=Math.sqrt(1-y*y);normal.set(Math.cos(lon)*r,y,Math.sin(lon)*r);pose.position.copy(normal).multiplyScalar(100);pose.quaternion.setFromUnitVectors(UP,normal);pose.scale.set(.7+(i%4)*.3,1.2+(i%7)*.38,.9+(i%3)*.2);pose.position.addScaledVector(normal,pose.scale.y*.35);pose.updateMatrix();mountains.setMatrixAt(mountainCount++,pose.matrix);}
 for(let i=0;i<32;i++){const y=.04+(i%8)*.018,lon=.70+Math.floor(i/8)*.04,r=Math.sqrt(1-y*y);normal.set(Math.cos(lon)*r,y,Math.sin(lon)*r);pose.position.copy(normal).multiplyScalar(100.2);pose.quaternion.setFromUnitVectors(UP,normal);pose.scale.setScalar(1+(i%3)*.25);pose.updateMatrix();vents.setMatrixAt(ventCount++,pose.matrix);}
 let ocean=0;for(let i=0;i<2048;i++){const y=1-2*(i+.5)/2048,lon=i*2.399963,r=Math.sqrt(1-y*y);normal.set(Math.cos(lon)*r,y,Math.sin(lon)*r);if(planetRegion(normal)==='ocean')ocean++;}
 trees.count=treeCount;mountains.count=mountainCount;vents.count=ventCount;root.add(trees,mountains,vents);root.userData={purpleSpruceTrees:treeCount,polarMountains:mountainCount,sulfurFeatures:ventCount,oceanFraction:ocean/2048};return root;
}
function makeEnemy(){
 const b=new SupplyMeshBuilder();b.sphere('metal',[0,0,0],[2.5,.65,1.6],0x423c61);b.sphere('metal',[0,.25,.8],[.85,.55,.85],0x5b526e);
 for(const side of[-1,1]){b.link('metal',[side*.9,0,.2],[side*3.7,-.55,-.6],.28,0x262f49,.12);b.link('metal',[side*3.7,-.55,-.6],[side*2.6,-.30,1.7],.11,0x9e7695,.22);b.sphere('lens',[side*.8,.05,1.5],[.22,.16,.16],0xfa775d);}
 b.sphere('lens',[0,.45,1.46],[.48,.30,.12],0x122839);b.sphere('lens',[0,.49,1.58],[.12,.12,.06],0xf5c077);return finish(b,'enemy-alien-vessel');
}

/** Isolated scene graph only. The caller supplies its existing renderer and
 * frame clock; this class creates no context, animation loop, timers or lights. */
export class OpeningFlight{
 constructor({reducedMotion=false}={}){
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x020812);this.scene.name='opening-flight';
  this.camera=new THREE.PerspectiveCamera(65,16/9,.025,1800);this.scene.add(this.camera);this.reducedMotion=Boolean(reducedMotion);this.disposed=false;
  this.cockpit=makeCockpit();this.scene.add(this.cockpit);this.friend=makeFriend();this.scene.add(this.friend.root);
  this.planet=makePlanet();this.scene.add(this.planet);this.enemy=makeEnemy();this.scene.add(this.enemy);
  this.sun=basic(new THREE.SphereGeometry(19,24,16),0xffe3ab);this.sun.name='opening-sun';this.sun.position.set(-30,85,-350);this.scene.add(this.sun);
  for(const [radius,opacity]of[[24,.08],[30,.035]]){const halo=basic(new THREE.CircleGeometry(radius,40),0xffd9a0,{transparent:true,opacity,depthWrite:false});halo.position.copy(this.sun.position);this.scene.add(halo);}
  const starPositions=new Float32Array(700*3);for(let i=0;i<700;i++){const y=1-2*(i+.5)/700,r=Math.sqrt(1-y*y),a=i*2.399963;starPositions.set([Math.cos(a)*r*850,y*850,Math.sin(a)*r*850],i*3);}const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));this.scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0xa8cadf,size:1.2,sizeAttenuation:false})));
  const glassMaterial=new THREE.MeshBasicMaterial({color:0x7bd2e0,transparent:true,opacity:.075,side:THREE.DoubleSide,depthWrite:false});glassMaterial.forceSinglePass=true;
  this.leftGlass=new THREE.Mesh(new THREE.PlaneGeometry(3.95,1.76),glassMaterial);this.leftGlass.position.set(0,1.64,-2.61);this.leftGlass.rotation.x=-.10;this.scene.add(this.leftGlass);
  this.rightGlass=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.76),glassMaterial);this.rightGlass.position.set(2.06,1.64,-.55);this.rightGlass.rotation.y=Math.PI/2;this.scene.add(this.rightGlass);
  this.cloak=basic(new THREE.SphereGeometry(3.5,20,12),0x74d9ed,{transparent:true,opacity:.035,side:THREE.BackSide,depthWrite:false});this.cloak.position.set(0,1,0);this.scene.add(this.cloak);
  this.button=basic(new THREE.CylinderGeometry(.075,.085,.035,18),0x8ce5e8);this.button.position.set(1.22,.91,-1.03);this.scene.add(this.button);
  this.player=new THREE.Group();this.player.name='visible-seated-player-and-harness';this.camera.add(this.player);
  const suit=new SupplyMeshBuilder();suit.box('grip',[0,-.63,-.32],[.6,.46,.26],0x2c516d);for(const side of[-1,1])strap(suit,[side*.27,-.05,-.73],[side*.035,-.34,-.69],.045,0xb2b7a9);this.playerSuit=finish(suit,'seated-player-suit');this.player.add(this.playerSuit);
  const lap=new SupplyMeshBuilder();for(const side of[-1,1]){lap.sphere('grip',[side*.17,-.55,-.59],[.125,.12,.31],0x4a687d);lap.box('grip',[side*.17,-.54,-.84],[.22,.12,.18],0x738b96);lap.box('grip',[side*.44,-.35,-.62],[.08,.08,.50],0x405b6c);lap.link('grip',[side*.31,-.44,-.65],[side*.31,-.22,-.65],.023,0x233d50);lap.box('grip',[side*.31,-.44,-.65],[.13,.045,.14],0x75949f);}this.lap=finish(lap,'visible-pilot-lap-chair-and-controls');this.player.add(this.lap);
  this.hands=[-1,1].map(side=>{const hand=unlit(createExplorerHand({firstPerson:false}));hand.name=side<0?'player-left-glove':'player-right-glove';this.player.add(hand);return hand;});
  this.hands[0].scale.x=-1;
  this.sleeves=[-1,1].map(()=>{const mesh=basic(new THREE.CylinderGeometry(.063,.075,1,12),0x536f85);this.player.add(mesh);return mesh;});
  this.buckle=basic(new THREE.BoxGeometry(.13,.095,.035),0xd9b481);this.buckle.position.set(0,-.34,-.70);this.player.add(this.buckle);
  this.latch=basic(new THREE.BoxGeometry(.04,.025,.041),0xe09a6b);this.latch.position.set(0,-.34,-.724);this.player.add(this.latch);
  this.laser=new THREE.InstancedMesh(new THREE.CylinderGeometry(.035,.035,1,6),new THREE.MeshBasicMaterial({color:0xff8770}),1);this.laser.count=0;this.scene.add(this.laser);
  const shardGeometry=new THREE.BufferGeometry();shardGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.18,-.08,0,.18,-.1,0,.03,.22,0],3));shardGeometry.computeVertexNormals();
  const shardMaterial=new THREE.MeshBasicMaterial({color:0xb5dbe8,transparent:true,opacity:.63,side:THREE.DoubleSide});shardMaterial.forceSinglePass=true;
  this.shards=new THREE.InstancedMesh(shardGeometry,shardMaterial,12);this.shards.count=0;this.scene.add(this.shards);
  this.flames=new THREE.InstancedMesh(new THREE.ConeGeometry(.14,1,6),new THREE.MeshBasicMaterial({color:0xffa056,transparent:true,opacity:.82}),14);this.flames.count=0;this.scene.add(this.flames);
  this.smoke=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshBasicMaterial({color:0x34414c,transparent:true,opacity:.23,depthWrite:false}),10);this.smoke.count=0;this.scene.add(this.smoke);
  for(const mesh of[this.laser,this.shards,this.flames,this.smoke])mesh.frustumCulled=false;
  const sparksGeometry=new THREE.BufferGeometry();sparksGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(48*3),3));this.sparks=new THREE.Points(sparksGeometry,new THREE.PointsMaterial({color:0xffd197,size:.035,transparent:true,opacity:.85}));this.sparks.visible=false;this.scene.add(this.sparks);
  this.pose=new THREE.Object3D();this.a=new THREE.Vector3();this.b=new THREE.Vector3();this.delta=new THREE.Vector3();this.target=new THREE.Vector3();this.elbow=new THREE.Vector3();this.bend=new THREE.Vector3();this.lastState=null;this.update(0);
 }
 /** @param {number} seconds @param {{aspect?:number,reducedMotion?:boolean}} [options] */
 update(seconds,{aspect=16/9,reducedMotion=this.reducedMotion}={}){
  if(this.disposed)return this.lastState;const state=sampleOpeningFlight(seconds),t=state.seconds;this.lastState=state;this.reducedMotion=Boolean(reducedMotion);
  this.camera.aspect=Number.isFinite(aspect)&&aspect>0?aspect:16/9;this.camera.fov=this.camera.aspect<.8?76:65;this.camera.updateProjectionMatrix();
  const glance=between(t,6,8)*(1-between(t,11,13)),follow=between(t,20,21)*(1-between(t,23.5,25)),braceLook=between(t,24,25)*(1-between(t,28,29));
  const shake=this.reducedMotion?0:state.hit*.025+state.breach*(1-state.descent)*.006;
  this.camera.position.set(-.45+Math.sin(t*39)*shake,1.44+Math.sin(t*31)*shake,-.35);this.target.set(mix(.1,.77,glance),mix(1.45,1.07,glance)-braceLook*.7,mix(-9,-.6,glance));
  const lift=between(t,20,21),travel=between(t,20.7,24);
  this.friend.root.position.set(.78+travel*10,.15+lift*.40,-.45-travel*.65);this.friend.root.rotation.set(lift*.7,travel*.4,-travel*.9);this.friend.root.visible=t<24;
  this.friend.head.rotation.y=(1.65+glance*.08)*(1-between(t,11,14));
  const sideGlance=between(t,11.3,12.8)*(1-between(t,23.5,25));this.target.lerp(new THREE.Vector3(26,3,-12),sideGlance);
  if(follow>0){this.a.set(this.friend.root.position.x,clamp(this.friend.root.position.y+.8,1.4,1.7),this.friend.root.position.z);this.target.lerp(this.a,follow);}
  this.camera.lookAt(this.target);if(!this.reducedMotion)this.camera.rotation.z+=Math.sin(t*13)*shake*.22;
  this.a.set(.25,1.1,.02);this.target.set(mix(.34,.44,state.press),mix(.65,.75,state.press),mix(.10,-.58,state.press));this.delta.subVectors(this.target,this.a);const length=Math.min(.715,this.delta.length());this.delta.normalize();
  const along=(.35*.35-.37*.37+length*length)/(2*Math.max(.001,length)),height=Math.sqrt(Math.max(0,.35*.35-along*along));
  this.bend.set(.8,-.2,.25).addScaledVector(this.delta,-this.bend.dot(this.delta)).normalize();this.elbow.copy(this.a).addScaledVector(this.delta,along).addScaledVector(this.bend,height);
  this.friend.upper.position.copy(this.a);this.friend.upper.quaternion.setFromUnitVectors(UP.clone().negate(),this.elbow.clone().sub(this.a).normalize());
  this.friend.fore.position.copy(this.elbow);this.friend.fore.quaternion.setFromUnitVectors(UP.clone().negate(),this.target.clone().sub(this.elbow).normalize());
  this.button.position.y=.91-state.press*.018;this.button.material.color.setHex(state.cloak>.5?0x8ce5e8:0xf08b62);this.rightGlass.visible=state.breach<.4;
  this.cloak.visible=state.cloak>0;this.cloak.material.opacity=.035*state.cloak;
  const passing=between(t,0,29);this.planet.position.set(mix(mix(-145,-260,passing),0,state.descent),mix(-46,-113,state.descent),mix(mix(-235,-80,passing),-122,state.descent));this.planet.scale.setScalar(mix(1.1,1.32,state.descent));this.planet.rotation.set(-.06*state.descent,1.7+.002*t,.10*(1-state.descent));
  this.enemy.visible=state.enemy>0&&t<31;this.enemy.position.set(mix(42,26,state.enemy),3+Math.sin(t*.4)*.3,-12);this.enemy.rotation.set(.12,-1.1,.1);
  const grip=state.brace*(1-between(t,28.4,29.4));this.playerSuit.visible=t>=24&&t<29.4;this.buckle.visible=this.latch.visible=this.playerSuit.visible;
  for(let i=0;i<2;i++){
   const side=i?1:-1,hand=this.hands[i];hand.position.set(mix(side*.31,side<0?-.13:.035,grip),mix(-.29,side<0?-.13:-.31,grip),mix(-.65,-.69,grip));hand.rotation.set(-.15,grip*side*.32,side<0?.38:-.38+grip*.8);
   this.a.set(side*.48,-.53,-.24);this.b.copy(hand.position);this.delta.subVectors(this.b,this.a);this.sleeves[i].position.copy(this.a).add(this.b).multiplyScalar(.5);this.sleeves[i].quaternion.setFromUnitVectors(UP,this.delta.clone().normalize());this.sleeves[i].scale.set(1,this.delta.length(),1);
  }
  this.latch.material.color.setHex(state.latch>.8?0x9fe9d5:0xe09a6b);this.buckle.position.x=.03*(1-state.latch);
  const shot=SHOTS.find(at=>t>=at&&t<=at+(this.reducedMotion?.34:.18));this.laser.count=shot===undefined?0:1;
  if(this.laser.count){this.a.copy(this.enemy.position).add(new THREE.Vector3(0,0,1.6).applyQuaternion(this.enemy.quaternion));this.b.set(2.06,1.6,-.55);this.delta.subVectors(this.b,this.a);this.pose.position.copy(this.a).add(this.b).multiplyScalar(.5);this.pose.quaternion.setFromUnitVectors(UP,this.delta.clone().normalize());this.pose.scale.set(1,this.delta.length(),1);this.pose.updateMatrix();this.laser.setMatrixAt(0,this.pose.matrix);this.laser.instanceMatrix.needsUpdate=true;}
  this.shards.count=t>=20&&t<26?12:0;for(let i=0;i<this.shards.count;i++){const age=t-20;this.pose.position.set(2.06+age*(1+i*.13),1.6+Math.cos(i*5)*(.2+age*.4),-.55+Math.sin(i*7)*(.2+age*.55));this.pose.rotation.set(age+i,age*.5+i,i);this.pose.scale.setScalar(.5+(i%3)*.2);this.pose.updateMatrix();this.shards.setMatrixAt(i,this.pose.matrix);}if(this.shards.count)this.shards.instanceMatrix.needsUpdate=true;
  const burn=between(t,17.5,21);this.flames.count=burn>0?14:0;this.smoke.count=burn>0?10:0;this.sparks.visible=burn>0;
  for(let i=0;i<this.flames.count;i++){this.pose.position.set(-1.7+(i%7)*.43,.9+Math.sin(i*9)*.06,-1.55-Math.floor(i/7)*.25);this.pose.rotation.set(.2,0,.2*Math.sin(t*4+i));this.pose.scale.set(.7,.18+burn*(.25+.15*Math.sin((this.reducedMotion?0:t)*6+i)),.7);this.pose.updateMatrix();this.flames.setMatrixAt(i,this.pose.matrix);}if(this.flames.count)this.flames.instanceMatrix.needsUpdate=true;
  for(let i=0;i<this.smoke.count;i++){const rise=(t*.12+i*.13)%1;this.pose.position.set(-1.4+(i%5)*.62,1.1+rise*1.2,-1.7+rise*.5);this.pose.rotation.set(0,t*.1+i,0);this.pose.scale.setScalar(.12+rise*.3);this.pose.updateMatrix();this.smoke.setMatrixAt(i,this.pose.matrix);}if(this.smoke.count)this.smoke.instanceMatrix.needsUpdate=true;
  const spark=this.sparks.geometry.attributes.position;for(let i=0;i<48;i++){const age=(t*.7+i*.137)%1;spark.setXYZ(i,-1.4+(i%9)*.32+Math.sin(i*8)*age*.4,.9+Math.sin(age*Math.PI)*.7,-1.5+age*.8);}spark.needsUpdate=true;
  this.scene.updateMatrixWorld(true);return state;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;const geometry=new Set(),materials=new Set();
  this.scene.traverse(object=>{if(object.geometry)geometry.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[])materials.add(material);if(object.isInstancedMesh)object.dispose();});
  geometry.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());this.scene.clear();
 }
}
