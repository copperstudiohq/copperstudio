import{highestIceAt,getIceSurfaceHeight}from'./ice-surface.js';
import{getSeabedHeight}from'./seabed.js';
import{basinCaveMeshField}from'./basin-caves.js';
import{YOYO_SPOOL,resetYoyoSpool,stepYoyoSpool}from'./yoyo-spool.js';

export const YOYO_ROPE_LINKS=12;
export const YOYO_GRIP=Object.freeze([.25,.04,-.85]);
const STEP=1/120;
const point=()=>({x:0,y:0,z:0,px:0,py:0,pz:0});

/** Render coordinates are metres, Y up. Keeping the chain in world space lets
 * walking, jumping and turning the hand produce inertia instead of a canned sway. */
function viewFrame(world,look){
 const yaw=Number.isFinite(look?.yaw)?look.yaw:0,pitch=Number.isFinite(look?.pitch)?look.pitch:0;
 const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
 return{position:{x:world.player.x/25,y:(world.player.z+36)/25,z:world.player.y/25},
  right:{x:cy,y:0,z:sy},up:{x:-sy*sp,y:cp,z:cy*sp},back:{x:-sy*cp,y:-sp,z:cy*cp}};
}
function toWorld(frame,local){
 const p=frame.position,r=frame.right,u=frame.up,b=frame.back;
 return{x:p.x+r.x*local[0]+u.x*local[1]+b.x*local[2],y:p.y+r.y*local[0]+u.y*local[1]+b.y*local[2],z:p.z+r.z*local[0]+u.z*local[1]+b.z*local[2]};
}
function seed(y,anchor,length){
 y.rope={nodes:Array.from({length:YOYO_ROPE_LINKS+1},point),localNodes:Array.from({length:YOYO_ROPE_LINKS+1},point),anchor:{...anchor},step:STEP};
 for(let i=0;i<=YOYO_ROPE_LINKS;i++){
  const n=y.rope.nodes[i],t=i/YOYO_ROPE_LINKS;
  Object.assign(n,{x:anchor.x,y:anchor.y-length*t,z:anchor.z,px:anchor.x,py:anchor.y-length*t,pz:anchor.z});
 }
}

export function resetYoyoPhysics(y){resetYoyoSpool(y);y.rope=null;}
function contactFloor(world,node){
 const x=node.x*25,y=node.z*25;
 if(world.player.basinCaveId){const q=basinCaveMeshField(x,y);if(q?.clearance>0)return q.floor/25+.06;}
 const ice=!world.player.swimming&&highestIceAt(world.platforms??[],x,y);
 return(ice?getIceSurfaceHeight(ice,x,y):getSeabedHeight(x,y))/25+.06;
}
function constrain(nodes,length){
 for(let pass=0;pass<12;pass++)for(let i=1;i<nodes.length;i++){
  const a=nodes[i-1],b=nodes[i],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,d=Math.hypot(dx,dy,dz)||1;
  const wa=i===1?0:1,wb=i===YOYO_ROPE_LINKS?.16:1,k=(d-length)/d/(wa+wb);
  a.x+=dx*k*wa;a.y+=dy*k*wa;a.z+=dz*k*wa;
  b.x-=dx*k*wb;b.y-=dy*k*wb;b.z-=dz*k*wb;
 }
 // The final anchored projection enforces the hard string-length limit even
 // during a fast retraction. It cannot add energy beyond the pinned hand.
 for(let i=1;i<nodes.length;i++){
  const a=nodes[i-1],b=nodes[i],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,d=Math.hypot(dx,dy,dz);
  if(d>length){const k=length/d;b.x=a.x+dx*k;b.y=a.y+dy*k;b.z=a.z+dz*k;}
 }
}

/** A small, fixed-step Verlet string with a heavier copper disc, gravity,
 * drag, inextensible links and ground contact. State is transient and pausable. */
export function updateYoyoPhysics(world,dt,look){
 const y=world.yoyo;if(!y||!Number.isFinite(dt)||dt<=0)return;
 const frame=viewFrame(world,look),anchor=toWorld(frame,YOYO_GRIP);
 const old=y.rope;
 if(!old||old.nodes.length!==YOYO_ROPE_LINKS+1||old.nodes.some(n=>![n.x,n.y,n.z,n.px,n.py,n.pz].every(Number.isFinite))||![y.length,y.spoolSpeed,y.angularVelocity].every(Number.isFinite)||Math.hypot(anchor.x-old.anchor.x,anchor.y-old.anchor.y,anchor.z-old.anchor.z)>2){
  resetYoyoSpool(y);seed(y,anchor,YOYO_SPOOL.minLength);
 }
 const state=y.rope,nodes=state.nodes,h=STEP;
 y.accumulator+=Math.min(.1,dt);const steps=Math.min(12,Math.floor((y.accumulator+1e-9)/STEP));y.accumulator=Math.max(0,y.accumulator-steps*STEP);
 const damping=Math.exp(-(world.player.underwater?4.5:1.8)*h);
 for(let step=1;step<=steps;step++){
  stepYoyoSpool(y,h,world.player.underwater);const link=y.length/YOYO_ROPE_LINKS;
  const t=step/steps,root=nodes[0];
  root.x=state.anchor.x+(anchor.x-state.anchor.x)*t;root.y=state.anchor.y+(anchor.y-state.anchor.y)*t;root.z=state.anchor.z+(anchor.z-state.anchor.z)*t;
  root.px=root.x;root.py=root.y;root.pz=root.z;
  for(let i=1;i<nodes.length;i++){
   const n=nodes[i],x=n.x,y0=n.y,z=n.z,ratio=h/state.step;
   const vx=(n.x-n.px)*ratio*damping,vy=(n.y-n.py)*ratio*damping,vz=(n.z-n.pz)*ratio*damping;
   const limit=.12,speed=Math.hypot(vx,vy,vz),k=speed>limit?limit/speed:1;
   n.x+=vx*k;n.y+=vy*k-(world.player.underwater?3.2:9.81)*h*h;n.z+=vz*k;
   n.px=x;n.py=y0;n.pz=z;
  }
  constrain(nodes,link);
  const disc=nodes.at(-1),floor=contactFloor(world,disc);
  if(disc.y<floor){disc.y=floor;disc.py=Math.min(disc.py,floor);disc.px=disc.x+(disc.px-disc.x)*.65;disc.pz=disc.z+(disc.pz-disc.z)*.65;y.angularVelocity*=Math.exp(-9*h);constrain(nodes,link);}
  if(y.mode==='caught')for(const n of nodes){n.px=n.x;n.py=n.y;n.pz=n.z;}
  state.step=h;
 }
 // The hand remains attached even on render frames shorter than one substep.
 Object.assign(nodes[0],anchor,{px:anchor.x,py:anchor.y,pz:anchor.z});constrain(nodes,y.length/YOYO_ROPE_LINKS);
 Object.assign(state.anchor,anchor);
 for(let i=0;i<nodes.length;i++){
  const n=nodes[i],local=state.localNodes[i],dx=n.x-frame.position.x,dy=n.y-frame.position.y,dz=n.z-frame.position.z;
  local.x=dx*frame.right.x+dy*frame.right.y+dz*frame.right.z;
  local.y=dx*frame.up.x+dy*frame.up.y+dz*frame.up.z;
  local.z=dx*frame.back.x+dy*frame.back.y+dz*frame.back.z;
 }
}
