import {highestIceAt,getIceSurfaceHeight} from './ice-surface.js';
import {getSeabedHeight} from './seabed.js';
import {wreckLocalPoint} from './wreck-interior.js';
import {wreckWingHeight} from './wreck-wings.js';
import {wreckBodyPenetration} from './wreck-collision.js';

export const CROBON_TAIL_SEGMENTS=6;
const SCALE=25,LENGTH=.92*SCALE,STEP=1/120;
const waterStates=new Set(['diving','swimming','surfacing','landing']);
const states=new WeakMap();
const clamp=value=>Math.max(0,Math.min(1,value));
// Equal-length rest links preserve the old raised, gently curved silhouette.
const rest=new Float64Array((CROBON_TAIL_SEGMENTS+1)*3);
for(let i=1;i<=CROBON_TAIL_SEGMENTS;i++){
 const u=i/CROBON_TAIL_SEGMENTS,v=(i-1)/CROBON_TAIL_SEGMENTS;
 const dx=.04*(Math.sin(u*Math.PI)-Math.sin(v*Math.PI)),dy=.12*(u-v)+.04*(Math.sin(u*Math.PI)-Math.sin(v*Math.PI)),dz=-.92*(u-v);
 const ratio=.92/CROBON_TAIL_SEGMENTS/Math.hypot(dx,dy,dz),offset=i*3,previous=offset-3;
 rest[offset]=rest[previous]+dx*ratio;rest[offset+1]=rest[previous+1]+dy*ratio;rest[offset+2]=rest[previous+2]+dz*ratio;
}

/** Juvenile anatomy and tail share one bounded growth scale. */
export function penguinTailScale(bird){return bird.offspringId&&Number.isFinite(bird.growth) ? .38+.62*clamp(bird.growth) : 1;}

/** Write a rest node in simulation coordinates (z up), without allocating.
 * The root is local [0,.31,-.18], including the mantle's static nest crouch.
 * Decorative gait/peck motions stay inside the broad attachment at the pelvis.
 * @param {object} bird @param {number} index @param {{x:number,y:number,z:number}} target
 */
export function penguinTailRestPoint(bird,index,target){
 const scale=penguinTailScale(bird),crouch=waterStates.has(bird.state)||!Number.isFinite(bird.nestCrouch)?0:clamp(bird.nestCrouch);
 const pitch=(bird.pitch??0)+crouch*.12,cp=Math.cos(pitch),sp=Math.sin(pitch),ch=Math.cos(bird.heading),sh=Math.sin(bird.heading);
 const offset=index*3,side=rest[offset],up=(.31+rest[offset+1])*(1-.18*crouch),forward=-.18+rest[offset+2];
 const along=up*sp+forward*cp,height=up*cp-forward*sp-.015*crouch;
 target.x=bird.x+(side*sh+along*ch)*SCALE*scale;
 target.y=bird.y+(-side*ch+along*sh)*SCALE*scale;
 target.z=bird.z+height*SCALE*scale;return target;
}

/** @typedef {{x:number,y:number,z:number,px:number,py:number,pz:number}} TailNode */
function resetTail(bird,state){
 if(!Array.isArray(bird.tailNodes)||bird.tailNodes.length!==CROBON_TAIL_SEGMENTS+1)bird.tailNodes=Array.from({length:CROBON_TAIL_SEGMENTS+1},()=>({x:0,y:0,z:0,px:0,py:0,pz:0}));
 for(let i=0;i<=CROBON_TAIL_SEGMENTS;i++){
  const node=bird.tailNodes[i]??(bird.tailNodes[i]={x:0,y:0,z:0,px:0,py:0,pz:0});penguinTailRestPoint(bird,i,node);node.px=node.x;node.py=node.y;node.pz=node.z;
 }
 state.scale=penguinTailScale(bird);state.step=STEP;
 state.x=bird.x;state.y=bird.y;state.z=bird.z;
 const root=bird.tailNodes[0];state.rootX=root.x;state.rootY=root.y;state.rootZ=root.z;
}

function floorAt(world,bird,node,radius,swimming,platforms){
 let floor=-Infinity;
 if(swimming)floor=getSeabedHeight(node.x,node.y)+radius;
 else{
  const ice=highestIceAt(platforms,node.x,node.y);
  if(ice)floor=getIceSurfaceHeight(ice,node.x,node.y)+radius;
 }
 if(Number.isFinite(bird.feetSurfaceZ)&&world.ship?.designVersion===2){
  const local=wreckLocalPoint(world.ship,node.x,node.y),height=wreckWingHeight(local.x,local.z);
  // The wildlife query requires feet above the wing lip by .025 metres.
  if(height!==null)floor=Math.max(floor,(world.ship.z??0)+height*SCALE+radius+.7);
 }
 return floor;
}

/** Project onto a link sphere, intersecting the support plane when necessary. */
function constrainLink(world,bird,parent,node,length,radius,swimming,platforms){
 let dx=node.x-parent.x,dy=node.y-parent.y,dz=node.z-parent.z,distance=Math.hypot(dx,dy,dz);
 if(distance<1e-9){dx=-Math.cos(bird.heading);dy=-Math.sin(bird.heading);dz=.12;distance=Math.hypot(dx,dy,dz);}
 const ratio=length/distance;node.x=parent.x+dx*ratio;node.y=parent.y+dy*ratio;node.z=parent.z+dz*ratio;
 const floor=floorAt(world,bird,node,radius,swimming,platforms);
 if(node.z<floor){
  dz=Math.min(length,floor-parent.z);const horizontal=Math.sqrt(Math.max(0,length*length-dz*dz));
  dx=node.x-parent.x;dy=node.y-parent.y;distance=Math.hypot(dx,dy);
  if(distance<1e-9){dx=-Math.cos(bird.heading);dy=-Math.sin(bird.heading);distance=1;}
  node.x=parent.x+dx/distance*horizontal;node.y=parent.y+dy/distance*horizontal;node.z=parent.z+dz;
  // Contact discards downward velocity instead of creating a bounce.
  node.pz=Math.min(node.pz,node.z);
 }
}

/** Pure wreck overlap queries keep tails out of hulls, engines and wing spars.
 * Sample both the endpoint and link centre, so thin solids cannot sit between
 * nodes. A finite-difference projection follows decreasing overlap; its scratch
 * objects are retained per bird rather than allocated for each solver pass.
 */
function avoidWreck(world,bird,parent,node,state,radius){
 const ship=world.ship;if(ship?.designVersion!==2||Math.hypot(node.x-ship.x,node.y-ship.y)>360)return false;
 const point=state.probe,body=state.body;body.radius=radius;body.height=radius*2;body.bottom=-radius;
 const wingTop=Number.isFinite(bird.feetSurfaceZ),probe=.55;let contact=false;
 for(let sample=1;sample<=2;sample++){
  const t=sample===1?1:.5;
  point.x=parent.x+(node.x-parent.x)*t;point.y=parent.y+(node.y-parent.y)*t;point.z=parent.z+(node.z-parent.z)*t;
  const overlap=wreckBodyPenetration(ship,point,body,wingTop);if(overlap<=1e-8)continue;contact=true;
  point.x+=probe;const right=wreckBodyPenetration(ship,point,body,wingTop);point.x-=probe*2;const left=wreckBodyPenetration(ship,point,body,wingTop);point.x+=probe;
  point.y+=probe;const front=wreckBodyPenetration(ship,point,body,wingTop);point.y-=probe*2;const back=wreckBodyPenetration(ship,point,body,wingTop);point.y+=probe;
  let nx=left-right,ny=back-front,distance=Math.hypot(nx,ny);
  if(distance<1e-8){nx=parent.x-point.x;ny=parent.y-point.y;distance=Math.hypot(nx,ny)||1;}
  const correction=Math.min(state.scale*4,(overlap*SCALE+.08)/t);
  node.x+=nx/distance*correction;node.y+=ny/distance*correction;
 }
 return contact;
}

/** Bounded Verlet tail simulation. Only the seven nodes are public/transient;
 * scratch state lives in a WeakMap and is never part of expedition saves.
 * Ownership/distance guards also make direct calls safe. A teleport, growth
 * change or corrupt chain resets without carrying velocity into the new pose.
 * @param {object} world @param {object & {tailNodes?:TailNode[]}} bird @param {number} dt
 */
export function updatePenguinTail(world,bird,dt){
 if(!Number.isFinite(dt)||dt<=0||bird.squidHeldBy||bird.squidRespawnIn>0)return;
 if(world.player&&Math.hypot(world.player.x-bird.x,world.player.y-bird.y)>2000)return;
 if(!Number.isFinite(bird.x)||!Number.isFinite(bird.y)||!Number.isFinite(bird.z)||!Number.isFinite(bird.heading)||!Number.isFinite(bird.pitch??0))return;
 let state=states.get(bird);
 if(!state){state={probe:{x:0,y:0,z:0},body:{radius:0,height:0,bottom:0},rest:Array.from({length:7},()=>({x:0,y:0,z:0})),platforms:[],scale:0,step:STEP};states.set(bird,state);}
 const scale=penguinTailScale(bird),length=LENGTH/CROBON_TAIL_SEGMENTS*scale;
 let reset=Math.abs(state.scale-scale)>.02||!Array.isArray(bird.tailNodes)||bird.tailNodes.length!==7||Math.hypot(bird.x-state.x,bird.y-state.y,bird.z-state.z)>LENGTH*scale*1.8;
 if(!reset)for(const node of bird.tailNodes)if(!node||!Number.isFinite(node.x)||!Number.isFinite(node.y)||!Number.isFinite(node.z)||!Number.isFinite(node.px)||!Number.isFinite(node.py)||!Number.isFinite(node.pz)){reset=true;break;}
 if(!reset)for(let i=1;i<=CROBON_TAIL_SEGMENTS;i++)if(Math.hypot(bird.tailNodes[i].x-bird.tailNodes[i-1].x,bird.tailNodes[i].y-bird.tailNodes[i-1].y,bird.tailNodes[i].z-bird.tailNodes[i-1].z)>length*3){reset=true;break;}
 if(reset)resetTail(bird,state);
 // Each chain fits within 35 simulation units of its bird. Reduce the authored
 // archipelago to nearby supports once, outside the iterative solver.
 state.platforms.length=0;
 if(!waterStates.has(bird.state))for(const ice of world.platforms??[])if(Math.abs(ice.x-bird.x)<=ice.rx+35*scale&&Math.abs(ice.y-bird.y)<=ice.ry+35*scale)state.platforms.push(ice);
 const nodes=bird.tailNodes,delta=Math.min(.05,dt),steps=Math.ceil(delta/STEP),h=delta/steps,swimming=waterStates.has(bird.state);
 const damping=Math.exp(-(swimming?7:5)*h),spring=swimming?42:32,gravity=(swimming?-5:-18)*scale;
 for(let i=0;i<=CROBON_TAIL_SEGMENTS;i++)penguinTailRestPoint(bird,i,state.rest[i]);
 const root=nodes[0],target=state.rest[0],startX=state.rootX,startY=state.rootY,startZ=state.rootZ;
 for(let step=1;step<=steps;step++){
  const t=step/steps;root.x=startX+(target.x-startX)*t;root.y=startY+(target.y-startY)*t;root.z=startZ+(target.z-startZ)*t;
  root.px=root.x;root.py=root.y;root.pz=root.z;
  const timestep=h/state.step;
  for(let i=1;i<=CROBON_TAIL_SEGMENTS;i++){
   const node=nodes[i],restNode=state.rest[i],oldX=node.x,oldY=node.y,oldZ=node.z;
   let vx=(node.x-node.px)*timestep*damping,vy=(node.y-node.py)*timestep*damping,vz=(node.z-node.pz)*timestep*damping;
   const speed=Math.hypot(vx,vy,vz),maximum=length*.5;if(speed>maximum){const ratio=maximum/speed;vx*=ratio;vy*=ratio;vz*=ratio;}
   node.x+=vx+(restNode.x-node.x)*spring*h*h;node.y+=vy+(restNode.y-node.y)*spring*h*h;node.z+=vz+((restNode.z-node.z)*spring+gravity)*h*h;
   node.px=oldX;node.py=oldY;node.pz=oldZ;
  }
  // A forward pass fixes each link once; only actual wreck contacts require
  // extra projections. Stationary birds avoid repeated terrain/ship queries.
  for(let i=1;i<=CROBON_TAIL_SEGMENTS;i++){
   const radius=(.078*(1-i/CROBON_TAIL_SEGMENTS)**.72+.012)*SCALE*scale;
   constrainLink(world,bird,nodes[i-1],nodes[i],length,radius,swimming,state.platforms);
   for(let pass=0;pass<5;pass++){
    if(!avoidWreck(world,bird,nodes[i-1],nodes[i],state,radius))break;
    constrainLink(world,bird,nodes[i-1],nodes[i],length,radius,swimming,state.platforms);
   }
  }
  state.step=h;
 }
 state.scale=scale;state.x=bird.x;state.y=bird.y;state.z=bird.z;state.rootX=root.x;state.rootY=root.y;state.rootZ=root.z;
}
