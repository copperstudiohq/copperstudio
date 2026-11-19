import{createLargeGlacierWreck,LARGE_WRECK_SOLIDS,LARGE_WRECK_DECK,LARGE_WRECK_RAMP,LARGE_WRECK_CAB}from'./large-glacier-wreck-anatomy.js';
import{wreckLocalPoint,wreckWorldPoint}from'./wreck-interior.js';
import{getIceSurfaceHeight}from'./ice-surface.js';

/** Fixed crash site on the large, centipede-safe glacier east of the starter.
 * The dented chassis rests in the island's broad, flat central clearing. */
export const LARGE_GLACIER_WRECK_SITE=Object.freeze({
 id:'large-glacier-cargo-wreck',platformId:'hunting-glacier',x:-1550,y:-1110,
 z:-16.25,yaw:Math.PI/2,snowEmbedMeters:.65,
});

/** The loading ramp reaches the same prepared snow sampled by walking. */
export function largeWreckRampStartY(world){
 const site=LARGE_GLACIER_WRECK_SITE,ice=world.platforms.find(p=>p.id===site.platformId);
 if(!ice)throw new Error('Missing cargo-hauler glacier.');
 const foot=wreckWorldPoint(site,0,LARGE_WRECK_RAMP.minZ);
 return(getIceSurfaceHeight(ice,foot.x,foot.y)-site.z)/25+.015;
}
export function largeWreckFloorAt(x,z,rampStartY=0){
 const r=LARGE_WRECK_RAMP,d=LARGE_WRECK_DECK,c=LARGE_WRECK_CAB;
 if(x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ){
  const t=(z-r.minZ)/(r.maxZ-r.minZ);return rampStartY+(r.endY-rampStartY)*t;
 }
 if(x>=c.minX&&x<=c.maxX&&z>=c.minZ&&z<=c.maxZ){
  if(Math.abs(x)<=c.rampHalfWidth&&z<c.rampEndZ)return c.entryY+(c.topY-c.entryY)*(z-c.minZ)/(c.rampEndZ-c.minZ);
  return c.topY;
 }
 const cargoFloor=LARGE_WRECK_SOLIDS.find(s=>s.id.endsWith('-floor')&&Math.abs(x-s.center[0])<=s.size[0]/2&&Math.abs(z-s.center[2])<=s.size[2]/2);
 if(cargoFloor)return cargoFloor.center[1]+cargoFloor.size[1]/2;
 return x>=d.minX&&x<=d.maxX&&z>=d.minZ&&z<=d.maxZ?d.topY:null;
}

export class LargeGlacierWreckRenderer{
 constructor(world,materials={}){
  if(!world.platforms.some(p=>p.id===LARGE_GLACIER_WRECK_SITE.platformId))throw new Error('Missing large wreck glacier.');
  const site=LARGE_GLACIER_WRECK_SITE,ice=world.platforms.find(p=>p.id===site.platformId);
  this.group=createLargeGlacierWreck(materials,{rampStartY:largeWreckRampStartY(world),landingHeightAt:(x,z)=>{
   const p=wreckWorldPoint(site,x,z);return(getIceSurfaceHeight(ice,p.x,p.y)-site.z)/25;
  }});
  this.group.position.set(site.x/25,site.z/25,site.y/25);this.group.rotation.y=site.yaw;
  this.group.userData.siteId=site.id;this.disposed=false;
 }
 update(camera){
  const p=this.group.position;this.group.visible=Math.hypot(camera.x-p.x,camera.z-p.z)<175;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.group.dispose();}
}

/** The cab, loaded boxes and chassis share the model's local metre frame.
 * Ramp/deck support retains the previous feet height through ordinary ice
 * grounding, with descending landings and smooth falls off the bed edges. */
export function resolveLargeGlacierWreckCollision(world,from=world.player){
 const p=world.player,site=LARGE_GLACIER_WRECK_SITE;
 if(Math.abs(p.x-site.x)>900||Math.abs(p.y-site.y)>650)return;
 const local=wreckLocalPoint(site,p.x,p.y),previous=wreckLocalPoint(site,from.x,from.y),rampStart=largeWreckRampStartY(world);
 const floor=largeWreckFloorAt(local.x,local.z,rampStart),previousFloor=largeWreckFloorAt(previous.x,previous.z,rampStart);
 const height=floor===null?null:site.z+floor*25,oldHeight=previousFloor===null?null:site.z+previousFloor*25;
 const descending=(p.falling&&p.fallVelocity<=0)||(p.jumping&&p.z<=from.z);
 const onSurface=!p.swimming&&height!==null&&(
  descending&&from.z>=height-1&&p.z<=height||
  !p.jumping&&!p.falling&&((oldHeight!==null&&from.z>=oldHeight-2)||Math.abs(from.z-height)<7.5));
 if(onSurface){p.z=height;p.jumping=false;p.falling=false;p.fallVelocity=0;p.jumpTime=0;delete p.jumpBaseZ;}
 else if(!p.swimming&&!p.jumping&&!p.falling&&floor===null&&oldHeight!==null&&from.z>=oldHeight-2){
  p.z=from.z;p.falling=true;p.fallVelocity=0;
 }
 const feet=(p.z-site.z)/25,head=feet+36/25,radius=.20;
 const solids=LARGE_WRECK_SOLIDS.filter(s=>!(onSurface&&s.id==='flatbed-deck')&&feet<s.center[1]+s.size[1]/2-1e-5&&head>s.center[1]-s.size[1]/2)
  .map(({center:[x,,z],size:[sx,,sz]})=>({left:x-sx/2-radius,right:x+sx/2+radius,back:z-sz/2-radius,front:z+sz/2+radius}));
 const contains=(r,q)=>q.x>r.left&&q.x<r.right&&q.z>r.back&&q.z<r.front;
 const changed=solids.some(r=>contains(r,local));
 if(changed){
  // Exit the union of adjacent cargo/engine volumes. Resolving each box in
  // isolation can bounce a body forever between two closely packed loads.
  const candidates=[];
  for(const edge of['left','right','back','front']){
   const q={...local};
   for(let pass=0;pass<=solids.length;pass++){
    const overlaps=solids.filter(r=>contains(r,q));if(!overlaps.length)break;
    const negative=edge==='left'||edge==='back',values=overlaps.map(r=>r[edge]);
    q[edge==='left'||edge==='right'?'x':'z']=(negative?Math.min(...values):Math.max(...values))+(negative?-.001:.001);
   }
   if(!solids.some(r=>contains(r,q)))candidates.push(q);
  }
  candidates.sort((a,b)=>Math.hypot(a.x-local.x,a.z-local.z)-Math.hypot(b.x-local.x,b.z-local.z));
  if(candidates.length)Object.assign(local,candidates[0]);
 }
 if(changed)Object.assign(p,wreckWorldPoint(site,local.x,local.z));
 if(!p.swimming&&!p.jumping&&!p.falling){
  const supported=onSurface?largeWreckFloorAt(local.x,local.z,rampStart):null;
  if(supported!==null)p.z=site.z+supported*25;
  else if(onSurface){p.falling=true;p.fallVelocity=0;}
  else if(changed){const ice=world.platforms.find(ice=>ice.id===site.platformId);if(ice)p.z=getIceSurfaceHeight(ice,p.x,p.y);}
 }
}
