import {EYE_HEIGHT} from './terrain.js';
import {WRECK_INTERIOR_SOLIDS,wreckLocalPoint,wreckWorldPoint,wreckFloorAt} from './wreck-interior.js';
import {WRECK_WINGS,wreckWingHeight} from './wreck-wings.js';

const machinery=[[[0,-10],[0,-8.4],2.65,4.5],[[0,6.4],[0,7.15],1.35,2.4],
  [[-4,-7.5],[-4,-3],1.2,2.8],[[4,-7.5],[4,-3],1.2,2.8],
  [[-2.8,-1],[-6.7,-4.5],.45,1.0],[[2.8,-1],[8.5,-4.5],.45,1.0],
  [[-2.45,2.2],[-1.85,6.3],.12,3.2],[[2.45,2.2],[1.85,6.3],.12,3.2]];
// Filled outer volumes keep wildlife out of the hull, including the open cabin.
// The swept wing faces extend well beyond the narrow spars used by the player.
const hullRings=[[-10,2.5,.55,4.1],[-6,3,.45,4.5],[2,2.7,.35,3.8],[4.6,2.15,.22,3.35],[6.9,1.8,.20,1.55],[8.5,1.35,.18,1.05]];
const wildlifeSolids=hullRings.slice(1).map((b,i)=>{
  const a=hullRings[i];return {points:[[-a[1],a[0]],[a[1],a[0]],[b[1],b[0]],[-b[1],b[0]]],bottom:Math.min(a[2],b[2]),top:Math.max(a[3],b[3])};
});
for(const {points}of WRECK_WINGS){
  wildlifeSolids.push({wing:true,points:points.map(([x,,z])=>[x,z]),bottom:Math.min(...points.map(p=>p[1]))-.05,top:Math.max(...points.map(p=>p[1]))+.04});
}

function segmentDistance(x,z,a,b){
  const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
  return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
}
function polygonPenetration(x,z,points,radius){
  let inside=false,distance=Infinity;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];distance=Math.min(distance,segmentDistance(x,z,a,b));
    if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return Math.max(0,radius+(inside?distance:-distance));
}

/** Pure wildlife-body query. Positions, radius, height and bottom are world units;
 * the returned overlap score is in ship-local metres. The player is never moved.
 * @param {{designVersion?:number,x:number,y:number,z?:number,yaw?:number}} ship
 * @param {{x:number,y:number,z:number}} position
 * @param {{radius:number,height:number,bottom?:number}} body
 */
export function wreckBodyPenetration(ship,position,body,wingTop=false){
  if(ship?.designVersion!==2)return 0;
  const local=wreckLocalPoint(ship,position.x,position.y),radius=body.radius/25;
  if(Math.abs(local.x)>12+radius||local.z<-13-radius||local.z>10+radius)return 0;
  const feet=(position.z+(body.bottom??0)-(ship.z??0))/25,head=feet+body.height/25;
  // Only nest-route walkers can stand on the actual sloping wing face. Near its
  // edge, require the same height before allowing their body over the lip.
  let supported=false;
  if(wingTop){
    let surface=wreckWingHeight(local.x,local.z);
    if(surface===null)for(const {points}of WRECK_WINGS)for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[2]-a[2];
      const t=Math.max(0,Math.min(1,((local.x-a[0])*dx+(local.z-a[2])*dz)/(dx*dx+dz*dz)));
      if(Math.hypot(local.x-a[0]-dx*t,local.z-a[2]-dz*t)<=radius+.001){
        const edge=a[1]+(b[1]-a[1])*t;surface=surface===null?edge:Math.max(surface,edge);
      }
    }
    supported=surface!==null&&feet>=surface+.025;
  }
  let overlap=0;
  for(const solid of wildlifeSolids)if(!(supported&&solid.wing)&&feet<solid.top&&head>solid.bottom)overlap+=polygonPenetration(local.x,local.z,solid.points,radius);
  for(const [index,[start,end,width,top]]of machinery.entries())if(!(supported&&(index===4||index===5))&&feet<top&&head>0)overlap+=Math.max(0,width+radius-segmentDistance(local.x,local.z,start,end));
  return overlap;
}

/** Sweep the complete body, permitting only decreasing overlap if a bird starts
 * inside a wing after loading. Small samples also catch thin faces between poses. */
export function wreckBodyPathClear(ship,from,to,body,allowEscape=false,wingTop=false){
  if(ship?.designVersion!==2)return true;
  const start=wreckBodyPenetration(ship,from,body,wingTop),steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z)/4));
  let previous=start;
  for(let i=1;i<=steps;i++){
    const t=i/steps,overlap=wreckBodyPenetration(ship,{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,z:from.z+(to.z-from.z)*t},body,wingTop);
    if(overlap>1e-8&&(!allowEscape||start<=1e-8||overlap>previous+1e-8))return false;
    previous=overlap;
  }
  return start<=1e-8||previous<start-1e-8;
}

/** Nest walkers may cross the wing top and its spars, never its underside,
 * hull or engines. Normal land and dive steering retains the full wreck body. */
export function wreckWingBodyPathClear(ship,from,to,body){
  return wreckBodyPathClear(ship,from,to,body,false,true);
}

/** Hollow pressure cabin, a port breach and solid machinery/furniture. All
 * collision uses the same ship-local metres and yaw as the rendered interior. */
export function resolveWreckCollision(world) {
  const {ship,player}=world;
  if(ship?.designVersion!==2)return;
  const local=wreckLocalPoint(ship,player.x,player.y);
  if(Math.abs(local.x)>12||Math.abs(local.z)>15)return;
  const feet=(player.z-(ship.z??0))/25,head=feet+EYE_HEIGHT/25,radius=.20;
  for(let pass=0;pass<3;pass++){
    for(const [start,end,width,top]of machinery){
      if(feet>=top||head<=0)continue;
      const dx=end[0]-start[0],dz=end[1]-start[1];
      const t=Math.max(0,Math.min(1,((local.x-start[0])*dx+(local.z-start[1])*dz)/(dx*dx+dz*dz)));
      const x=start[0]+dx*t,z=start[1]+dz*t,reach=width+radius;
      let nx=local.x-x,nz=local.z-z,length=Math.hypot(nx,nz);
      if(length>=reach)continue;
      if(length<1e-8){nx=dz;nz=-dx;length=Math.hypot(nx,nz);}
      local.x=x+nx/length*(reach+.0004);local.z=z+nz/length*(reach+.0004);
    }
    for(const {center:[x,y,z],size:[sx,sy,sz]}of WRECK_INTERIOR_SOLIDS){
      if(feet>=y+sy/2||head<=y-sy/2)continue;
      const left=x-sx/2-radius,right=x+sx/2+radius,back=z-sz/2-radius,front=z+sz/2+radius;
      if(local.x<=left||local.x>=right||local.z<=back||local.z>=front)continue;
      const distances=[local.x-left,right-local.x,local.z-back,front-local.z],edge=distances.indexOf(Math.min(...distances));
      if(edge===0)local.x=left-.0004;else if(edge===1)local.x=right+.0004;else if(edge===2)local.z=back-.0004;else local.z=front+.0004;
    }
  }
  Object.assign(player,wreckWorldPoint(ship,local.x,local.z));
  const floor=wreckFloorAt(local.x,local.z);
  if(floor!==null&&!player.swimming){
    const ground=(ship.z??0)+floor*25;
    if(!player.jumping&&!player.falling||player.z<=ground){
      player.z=ground;player.falling=false;player.fallVelocity=0;
    }
    // The cabin ceiling arrests a jump rather than allowing it through the hull.
    const ceiling=(ship.z??0)+(local.z>2?3.2:3.8)*25-EYE_HEIGHT-2;
    if(player.z>ceiling){player.z=ceiling;player.jumping=false;player.falling=true;player.fallVelocity=0;}
  }
}
