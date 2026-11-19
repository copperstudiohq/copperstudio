import {highestIceAt,getIceSurfaceHeight} from './ice-surface.js';
import {getForestHeight} from './forest-terrain.js';
import {getSulfuricGround,SULFURIC_MAP_BOUNDS} from './sulfuric-biome.js';
import {SULFURIC_POOLS,SULFURIC_VENTS} from './sulfuric-biome-data.js';
import {nearBasinWall} from './icy-basin.js';
import {OLD_CARGO_SITES} from './basin-life-data.js';
import {loadPreparedWorld} from './prepared-world.js';
import {EYE_HEIGHT,WATER_LEVEL} from './terrain.js';
import {FURNITURE_SPECS,getBuildPlan} from './build-catalog.js';
import {MAX_BASE_FURNITURE,MAX_WORLD_FURNITURE,furnitureBounds,furniturePlacementReason,validateBaseFurniture,furnitureColliders,furnitureSupport,furnitureWorldPoint,normalizeFurnitureYaw,workbenchIntersectsFurniture} from './furniture-building.js';
import {BAG_CAPACITY,inventoryCount} from './survival.js';
import {assignQuickSlot,activeQuickItem} from './copper-yoyo.js';
import {BASE_SIDE_PLANK_BOUNDS,SIDE_ARMOR_TAPER_KNOTS,sideArmorOuterXAt} from './base-armor-taper.js';
export {BASE_SIDE_PLANK_BOUNDS} from './base-armor-taper.js';

/** Simulation dimensions; 25 units = one metre. Doors face local +Y. */
export const STRUCTURE_SPECS=Object.freeze({
 'universal-base':Object.freeze({width:300,length:400,height:112.5,max:8}),
 workbench:Object.freeze({width:44,length:24,height:23,max:12}),
});
export const UNIVERSAL_BASE_DEBRIS_COST=8;
/** Door leaf and reach share the same local +Y portal as the visible model. */
export const BASE_DOOR_BOUNDS=Object.freeze({halfWidth:35,centerY:197.25,depth:8,height:65,interactRadius:90});
const WALL=7.5,DOOR=35,STEP_RISE=5,STEP_RUN=8,STAIR_WIDTH=60;
const BASE_HEIGHT=STRUCTURE_SPECS['universal-base'].height;
const finite=n=>Number.isFinite(n),plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const cache=new WeakMap();let validationWorld;
const armorStations=[...SIDE_ARMOR_TAPER_KNOTS.slice(1).reverse().map(point=>-point.y),...SIDE_ARMOR_TAPER_KNOTS.map(point=>point.y)];
const armorPolygons=[-1,1].map(side=>{
 const inner=BASE_SIDE_PLANK_BOUNDS.innerX,points=[{x:side*inner,y:armorStations[0]},...armorStations.map(y=>({x:side*sideArmorOuterXAt(y),y})),{x:side*inner,y:armorStations.at(-1)}];
 if(side<0)points.reverse();return{points,polygon:true};
});

export function structureLocalPoint(site,x,y){
 const c=Math.cos(site.yaw),s=Math.sin(site.yaw),dx=x-site.x,dy=y-site.y;
 return{x:dx*c-dy*s,y:dx*s+dy*c};
}
export function structureWorldPoint(site,x,y){
 const c=Math.cos(site.yaw),s=Math.sin(site.yaw);
 return{x:site.x+x*c+y*s,y:site.y-x*s+y*c};
}

/** No generated or synthetic ground: the same prepared land supports building. */
export function naturalStructureGround(world,x,y){
 const ice=highestIceAt(world.platforms??[],x,y),forest=getForestHeight(world,x,y),sulfur=getSulfuricGround(x,y);
 const candidates=[ice?getIceSurfaceHeight(ice,x,y):null,forest,sulfur].filter(finite);
 if(!candidates.length)return null;
 const height=Math.max(...candidates);return height>=WATER_LEVEL+2?height:null;
}

function footprint(site,extra=0){
 const spec=STRUCTURE_SPECS[site.kind],halfX=spec.width/2+extra,halfY=spec.length/2+extra;
 const corners=[[-halfX,-halfY],[halfX,-halfY],[halfX,halfY],[-halfX,halfY]];
 if(site.stair)corners.push([-site.stair.width/2,site.stair.end+extra],[site.stair.width/2,site.stair.end+extra]);
 const points=corners.map(([x,y])=>structureWorldPoint(site,x,y));
 return{minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};
}
function contains(site,p,radius=0){
 const q=structureLocalPoint(site,p.x,p.y),spec=STRUCTURE_SPECS[site.kind];
 return Math.abs(q.x)<spec.width/2+radius&&Math.abs(q.y)<spec.length/2+radius
  ||Boolean(site.stair&&Math.abs(q.x)<site.stair.width/2+radius&&q.y>site.stair.start-radius&&q.y<site.stair.end+radius);
}
function overlaps(a,b){return a.minX<b.maxX&&a.maxX>b.minX&&a.minY<b.maxY&&a.maxY>b.minY;}
const distanceToSegment=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);};

function obstacleReason(world,site){
 if(world.ship&&contains(site,world.ship,320))return 'Move away from your crashed ship.';
 if(contains(site,{x:-1550,y:-1110},660))return 'Leave the cargo hauler and its loading ramp clear.';
 for(const cargo of OLD_CARGO_SITES)if(cargo.habitat==='land'&&contains(site,cargo,(cargo.scale??1)*95))return 'Leave the old cargo clear.';
 for(const tree of world.forest?.trees??[])if(contains(site,tree,(tree.trunkRadius??tree.radius*.12)+12))return 'Choose a clearing away from tree trunks.';
 for(const rock of world.forest?.rocks??[])if(contains(site,rock,rock.radius+8))return 'Choose ground clear of large rocks.';
 for(const log of world.forest?.logs??[]){
  const a={x:log.x-Math.cos(log.heading)*log.length/2,y:log.y-Math.sin(log.heading)*log.length/2},b={x:log.x+Math.cos(log.heading)*log.length/2,y:log.y+Math.sin(log.heading)*log.length/2};
  if(contains(site,a,log.radius)||contains(site,b,log.radius)||distanceToSegment(site,a,b)<Math.hypot(STRUCTURE_SPECS[site.kind].width,STRUCTURE_SPECS[site.kind].length)/2+log.radius)return 'Move clear of fallen trunks.';
 }
 for(const[x,y,size]of SULFURIC_VENTS)if(contains(site,{x,y},size*34))return 'Move clear of the sulfur vents.';
 for(const pool of SULFURIC_POOLS){
  const x=Array.isArray(pool)?pool[0]:pool.x,y=Array.isArray(pool)?pool[1]:pool.y,r=Array.isArray(pool)?pool[2]:pool.radius??pool.rx??100;
  if(contains(site,{x,y},r+30))return 'Keep the geyser pools clear.';
 }
 const bounds=footprint(site,15);
 for(const other of[...(world.structures?.bases??[]),...(world.structures?.workbenches??[])]){
  // A bench can furnish a completed house, provided it leaves the walls and
  // doorway clear. Its legs stand on that house's real floor.
  if(site.kind==='workbench'&&other.kind==='universal-base'){
   const q=structureLocalPoint(other,site.x,site.y);
   if(Math.abs(q.x)<110&&Math.abs(q.y)<160&&Math.abs(site.z-other.z-1)<.01){
    if(workbenchIntersectsFurniture(other,site))return 'Leave the habitat furniture clear.';
    continue;
   }
  }
  if(overlaps(bounds,footprint(other,15)))return 'Leave room around the other structure.';
 }
 return null;
}

/** Recompute a complete, level foundation and stairs from a requested land pose. */
export function planStructureAt(world,kind,pose){
 const spec=STRUCTURE_SPECS[kind];
 if(!spec||!pose||![pose.x,pose.y,pose.yaw].every(finite))return{valid:false,reason:'Choose a valid construction site.',record:null};
 const site={id:'preview',kind,x:pose.x,y:pose.y,z:0,yaw:Math.round(pose.yaw/(Math.PI/2))*Math.PI/2,ground:[],stair:null};
 if(kind==='universal-base'){site.doorOpen=false;site.furniture=[];}
 const reject=reason=>({valid:false,reason,record:site});
 const hx=spec.width/2,hy=spec.length/2,samples=[];
 const columns=Math.ceil(spec.width/32),rows=Math.ceil(spec.length/32);
 for(let ix=0;ix<=columns;ix++)for(let iy=0;iy<=rows;iy++){
  const p=structureWorldPoint(site,-hx+spec.width*ix/columns,-hy+spec.length*iy/rows);
  let z=naturalStructureGround(world,p.x,p.y);
  if(kind==='workbench')for(const base of world.structures?.bases??[]){
   const local=structureLocalPoint(base,p.x,p.y);
   if(Math.abs(local.x)<140&&Math.abs(local.y)<185)z=Math.max(z??-Infinity,base.z);
  }
  if(z===null)return reject('The entire foundation must stand on dry land.');
  if(nearBasinWall(world.platforms??[],p.x,p.y,12))return reject('Move away from the natural ice walls.');
  samples.push(z);
 }
 const low=Math.min(...samples),high=Math.max(...samples);
 if(high-low>100)return reject('This slope is too steep. Find a gentler piece of land.');
 site.z=high+(kind==='universal-base'?10:1);
 if(kind==='universal-base'){
  let run=32,bottom=high;
  for(let pass=0;pass<5;pass++){
   const p=structureWorldPoint(site,0,hy+run);bottom=naturalStructureGround(world,p.x,p.y);
   if(bottom===null)return reject('The entrance staircase needs dry land.');
   const steps=Math.max(2,Math.ceil((site.z-bottom)/STEP_RISE));
   if(steps>24)return reject('The entrance slope is too steep for the automatic stairs.');
   const next=steps*STEP_RUN;if(next===run)break;run=next;
  }
  const endpoint=structureWorldPoint(site,0,hy+run);bottom=naturalStructureGround(world,endpoint.x,endpoint.y);
  if(bottom===null||bottom>=site.z)return reject('The entrance staircase needs a clear, lower landing.');
  const steps=Math.max(2,Math.ceil((site.z-bottom)/STEP_RISE));
  if(steps>24)return reject('The entrance slope is too steep for the automatic stairs.');
  site.stair={start:hy,end:hy+run,steps,run,width:STAIR_WIDTH,bottom};
  for(let iy=0;iy<=Math.ceil(run/8);iy++)for(const x of[-STAIR_WIDTH/2,0,STAIR_WIDTH/2]){
   const y=hy+run*iy/Math.ceil(run/8),p=structureWorldPoint(site,x,y),z=naturalStructureGround(world,p.x,p.y);
   if(z===null||z>site.z-1||nearBasinWall(world.platforms??[],p.x,p.y,12))return reject('The staircase needs a clear strip of dry land.');
   if(z>site.z+(bottom-site.z)*(y-hy)/run+6)return reject('The entrance hill blocks the automatic staircase.');
  }
  for(const x of[-hx+12,hx-12])for(const y of[-hy+12,0,hy-12]){
   const p=structureWorldPoint(site,x,y);site.ground.push({x,y,z:naturalStructureGround(world,p.x,p.y)});
  }
 }
 const reason=obstacleReason(world,site);if(reason)return reject(reason);
 return{valid:true,reason:kind==='universal-base'?'Build reinforced Universal Base · 8 debris':'Place workbench',record:site};
}

export function previewStructure(world,kind,look={yaw:0},rotation=0){
 if(!STRUCTURE_SPECS[kind])return{valid:false,reason:'Unknown structure.',record:null};
 const p=world.player;
 if(!p||p.swimming||p.underwater||p.basinCaveId||p.saltCaveId)return{valid:false,reason:'Construction requires open, dry land.',record:null};
 const yaw=Math.round((finite(look.yaw)?look.yaw:0)/(Math.PI/2))*Math.PI/2,distance=kind==='universal-base'?355:65;
 const pose={x:Math.round((p.x+Math.sin(yaw)*distance)/5)*5,y:Math.round((p.y-Math.cos(yaw)*distance)/5)*5,yaw:normalizeFurnitureYaw(-yaw+rotation*Math.PI/2)};
 const key=[kind,pose.x,pose.y,pose.yaw,world.structures?.version??0].join(':'),previous=cache.get(world);
 if(previous?.key===key&&previous.state===world.structures)return previous.value;
 const value=planStructureAt(world,kind,pose);cache.set(world,{key,value,state:world.structures});return value;
}

export function placeStructure(world,kind,look,rotation=0){
 const announce=message=>{world.notice=message;world.noticeTime=5;return false;},spec=STRUCTURE_SPECS[kind];
 if(!spec)return announce('Unknown construction plan.');
 if(world.squidEncounter||world.treeStalkerEncounter||world.centipedeEncounter||world.sandWormEncounter)return false;
 const state=world.structures??={version:0,workbenches:[],bases:[]},list=kind==='universal-base'?state.bases:state.workbenches;
 if(list.length>=spec.max)return announce(`You already have ${spec.max} ${kind==='universal-base'?'bases':'workbenches'}.`);
 if(kind==='universal-base'&&(!(world.inventory?.['builder-tool']>0)||(world.inventory?.debris??0)<UNIVERSAL_BASE_DEBRIS_COST))return announce('Universal Base needs the builder tool and 8 debris.');
 if(kind==='workbench'&&!(world.inventory?.workbench>0))return announce('Craft a workbench kit first.');
 const proposal=previewStructure(world,kind,look,rotation);if(!proposal.valid)return announce(proposal.reason);
 const item=kind==='universal-base'?'debris':'workbench',cost=kind==='universal-base'?UNIVERSAL_BASE_DEBRIS_COST:1;
 world.inventory[item]-=cost;if(!world.inventory[item])delete world.inventory[item];
 const prefix=kind==='universal-base'?'base':'workbench';let slot=1;while(list.some(site=>site.id===`${prefix}-${slot}`))slot++;
 list.push({...proposal.record,id:`${prefix}-${slot}`});state.version++;cache.delete(world);
 world.notice=kind==='universal-base'?'Universal Base built. Reinforced shell, automatic stairs and an Earth-sky ceiling.':'Workbench placed. Stand beside it to craft tools.';world.noticeTime=7;return true;
}

const buildCaptured=world=>Boolean(world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter||world.sandWormEncounter);
const buildNotice=(world,message)=>{world.notice=message;world.noticeTime=6;return false;};
const worldFurnitureCount=world=>(world.structures?.bases??[]).reduce((total,base)=>total+(base.furniture?.length??0),0);
export function getBuildState(world,id){
 const plan=getBuildPlan(id),resource=id==='workbench'?'workbench':'debris',owned=world.inventory?.[resource]??0,cost=plan?.cost??0;
 let reason='';
 if(!plan)reason='Unknown build plan.';
 else if(buildCaptured(world))reason='Finish the creature encounter before building.';
 else if(!(world.inventory?.['builder-tool']>0))reason='Find the builder tool in the Basin cargo crate.';
 else if(id==='workbench'&&!owned)reason='Craft a workbench kit first.';
 else if(owned<cost)reason=`Needs ${cost} debris.`;
 else if(plan.category==='furniture'){
  const base=insideUniversalBase(world);
  if(!base)reason='Stand inside a Universal Base to place furniture.';
  else if((base.furniture?.length??0)>=MAX_BASE_FURNITURE||worldFurnitureCount(world)>=MAX_WORLD_FURNITURE)reason='This habitat has reached its furniture limit.';
 }
 return{canSelect:!reason,reason:reason||'Ready to preview.',cost,owned,resource};
}
export function selectBuildPlan(world,id){
 const state=getBuildState(world,id);if(!state.canSelect)return buildNotice(world,state.reason);
 if(!Array.isArray(world.quickSlots)||world.quickSlots.length!==5)world.quickSlots=Array(5).fill(null);
 let slot=world.quickSlots.indexOf('builder-tool');if(slot<0)slot=world.quickSlots.findIndex(item=>!item||!world.inventory?.[item]);
 if(slot<0)slot=Number.isInteger(world.activeQuickSlot)&&world.activeQuickSlot>=0&&world.activeQuickSlot<5?world.activeQuickSlot:0;
 if(!assignQuickSlot(world,slot,'builder-tool'))return false;
 world.buildPlan=id;world.buildRotation=0;world.buildPreview=null;world.buildPreviewKey=null;
 world.notice=`${getBuildPlan(id).name} selected. F / USE places it; R rotates.`;world.noticeTime=6;return true;
}
export function rotateBuildPlan(world,delta=1){
 if(!(world.inventory?.['builder-tool']>0)||buildCaptured(world)||!Number.isInteger(delta))return false;
 world.buildRotation=(((world.buildRotation??0)+delta)%4+4)%4;world.buildPreviewKey=null;
 world.notice=`Rotated ${getBuildPlan(world.buildPlan??'universal-base')?.name??'build plan'}.`;world.noticeTime=3;return true;
}
export function previewBuild(world,id=world.buildPlan??'universal-base',look={yaw:0}){
 const plan=getBuildPlan(id);if(!plan)return{valid:false,reason:'Unknown build plan.',record:null};
 const state=getBuildState(world,id),rotation=world.buildRotation??0;
 if(plan.category==='habitat'){
  const proposal=previewStructure(world,id,look,rotation);
  const record=proposal.record?{...proposal.record,width:plan.width,length:plan.length,height:plan.height}:null;
  return{...proposal,record,valid:proposal.valid&&state.canSelect,reason:state.canSelect?proposal.reason:state.reason};
 }
 const base=insideUniversalBase(world);if(!base)return{valid:false,reason:'Furniture belongs inside a Universal Base.',record:null};
 const yaw=finite(look?.yaw)?look.yaw:0,p=world.player,center=structureLocalPoint(base,p.x+Math.sin(yaw)*50,p.y-Math.cos(yaw)*50);
 const item={kind:id,x:Math.round(center.x/5)*5||0,y:Math.round(center.y/5)*5||0,yaw:normalizeFurnitureYaw(-Math.round(yaw/(Math.PI/2))*Math.PI/2+rotation*Math.PI/2-base.yaw)};
 const reason=furniturePlacementReason(world,base,item);
 return{valid:state.canSelect&&!reason,reason:!state.canSelect?state.reason:reason??`Place ${plan.name.toLowerCase()} · ${plan.cost} debris`,base,item,
  record:{...furnitureWorldPoint(base,item),kind:id,baseId:base.id,width:plan.width,length:plan.length,height:plan.height}};
}
export function placeBuild(world,id=world.buildPlan??'universal-base',look){
 const state=getBuildState(world,id);if(!state.canSelect)return buildNotice(world,state.reason);
 const plan=getBuildPlan(id);if(plan.category==='habitat')return placeStructure(world,id,look,world.buildRotation??0);
 const proposal=previewBuild(world,id,look);if(!proposal.valid)return buildNotice(world,proposal.reason);
 const base=proposal.base,list=base.furniture??=[];let slot=1;while(list.some(item=>item.id===`${base.id}-furniture-${slot}`))slot++;
 world.inventory.debris-=plan.cost;if(!world.inventory.debris)delete world.inventory.debris;
 list.push({...proposal.item,id:`${base.id}-furniture-${slot}`});world.structures.version++;
 world.notice=`Built ${plan.name.toLowerCase()}. Q / RECLAIM returns its debris nearby.`;world.noticeTime=6;return true;
}
export function removeNearbyFurniture(world){
 if(buildCaptured(world)||activeQuickItem(world)!=='builder-tool'||!(world.inventory?.['builder-tool']>0))return buildNotice(world,'Equip the builder tool to reclaim furniture.');
 const base=insideUniversalBase(world);if(!base)return buildNotice(world,'Enter a Universal Base to reclaim its furniture.');
 const player=world.player,point=structureLocalPoint(base,player.x,player.y);let selected=null,best=50;
 for(const item of base.furniture??[]){const bounds=furnitureBounds(item),height=FURNITURE_SPECS[item.kind].height;
  const distance=Math.hypot(Math.max(0,bounds.minX-point.x,point.x-bounds.maxX),Math.max(0,bounds.minY-point.y,point.y-bounds.maxY),Math.max(0,base.z-player.z-22,player.z+22-base.z-height));
  if(distance<best){best=distance;selected=item;}
 }
 if(!selected)return buildNotice(world,'Move within 2 m of furniture to reclaim it.');
 const plan=getBuildPlan(selected.kind);if(inventoryCount(world)+plan.cost>BAG_CAPACITY)return buildNotice(world,'Make room in your backpack for the reclaimed debris.');
 base.furniture=base.furniture.filter(item=>item!==selected);world.inventory.debris=(world.inventory.debris??0)+plan.cost;world.structures.version++;
 world.notice=`Reclaimed ${plan.name.toLowerCase()}. Returned ${plan.cost} debris.`;world.noticeTime=5;return true;
}

/** Exact visible stair treads and floor; no support is offered under the house. */
export function getStructureSupport(world,x,y,feet=world.player?.z??-Infinity){
 let best=null;
 for(const base of world.structures?.bases??[]){
  const p=structureLocalPoint(base,x,y),s=base.stair;let height=null;
  if(Math.abs(p.x)<=150&&Math.abs(p.y)<=200)height=base.z;
  else if(s&&Math.abs(p.x)<=s.width/2&&p.y>=s.start&&p.y<=s.end){
   const t=Math.max(0,Math.min(s.steps-1,Math.floor((s.end-p.y)/s.run*s.steps)));
   height=s.bottom+(base.z-s.bottom)*(t+1)/s.steps;
  }
  const plank=BASE_SIDE_PLANK_BOUNDS;
  if(Math.abs(p.x)>=plank.innerX&&Math.abs(p.y)<=plank.halfLength&&Math.abs(p.x)<=sideArmorOuterXAt(p.y)&&feet>=base.z+plank.top-8)height=base.z+plank.top;
  const furnishing=furnitureSupport(base,p,feet);if(furnishing!==null)height=height===null?furnishing:Math.max(height,furnishing);
  if(height!==null)best=best===null?height:Math.max(best,height);
 }
 return best;
}

/** Sheltered interior excludes the open stairs and the space under the floor. */
export function insideUniversalBase(world,point=world.player){
 if(!point)return null;
 return(world.structures?.bases??[]).find(base=>{
  const p=structureLocalPoint(base,point.x,point.y);
  return Math.abs(p.x)<142&&Math.abs(p.y)<192&&point.z>=base.z-.1&&point.z+EYE_HEIGHT<=base.z+BASE_HEIGHT+.1;
 })??null;
}

/** Reachable from the interior or stairs; the floor and roof cannot be used
 * to operate the door through a solid level above or below its leaf. */
export function nearbyBaseDoor(world){
 const player=world.player;if(!player)return null;
 const bounds=BASE_DOOR_BOUNDS;let closest=null,best=bounds.interactRadius;
 for(const base of world.structures?.bases??[]){
  const local=structureLocalPoint(base,player.x,player.y);
  if(Math.abs(local.x)>bounds.halfWidth+15||player.z+EYE_HEIGHT<base.z-5||player.z>base.z+bounds.height)continue;
  const distance=Math.hypot(local.x,local.y-bounds.centerY,player.z+22-base.z-bounds.height/2);
  if(distance<best){closest=base;best=distance;}
 }return closest;
}
export function interactBaseDoor(world){
 if(world.player?.jumping||world.squidEncounter||world.centipedeEncounter||world.treeStalkerEncounter||world.sandWormEncounter)return false;
 const base=nearbyBaseDoor(world);if(!base)return false;
 const bounds=BASE_DOOR_BOUNDS,player=world.player,local=structureLocalPoint(base,player.x,player.y);
 if(base.doorOpen&&Math.abs(local.x)<=bounds.halfWidth+5&&Math.abs(local.y-bounds.centerY)<=bounds.depth/2+5
  &&player.z<base.z+bounds.height&&player.z+EYE_HEIGHT>base.z){
  world.notice='Move clear of the doorway before closing it.';world.noticeTime=5;return false;
 }
 base.doorOpen=!base.doorOpen;world.structures.version=(world.structures.version??0)+1;
 world.notice=base.doorOpen?'Universal Base door opened.':'Universal Base door closed.';world.noticeTime=5;return true;
}

function baseBoxes(base){
 return[
  {x:-150+WALL/2,y:0,w:WALL,d:400,low:base.z,high:base.z+BASE_HEIGHT},
  {x:150-WALL/2,y:0,w:WALL,d:400,low:base.z,high:base.z+BASE_HEIGHT},
  {x:0,y:-200+WALL/2,w:300,d:WALL,low:base.z,high:base.z+BASE_HEIGHT},
  ...[-1,1].map(side=>({x:side*(150+DOOR)/2,y:200-WALL/2,w:150-DOOR,d:WALL,low:base.z,high:base.z+BASE_HEIGHT})),
  {x:0,y:200-WALL/2,w:DOOR*2,d:WALL,low:base.z+65,high:base.z+BASE_HEIGHT},
  ...(!base.doorOpen?[{x:0,y:BASE_DOOR_BOUNDS.centerY,w:BASE_DOOR_BOUNDS.halfWidth*2,d:BASE_DOOR_BOUNDS.depth,low:base.z,high:base.z+BASE_DOOR_BOUNDS.height}]:[]),
  ...furnitureColliders(base),
 ];
}
function polygonContains(point,shape){
 let inside=false;const vertices=shape.points;
 for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
  const a=vertices[i],b=vertices[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }return inside;
}
function nearestPolygonEdge(point,shape){
 let best=null;const vertices=shape.points;
 for(let i=0;i<vertices.length;i++){
  const a=vertices[i],b=vertices[(i+1)%vertices.length],dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
  if(length2<1e-12)continue;const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length2)),x=a.x+dx*t,y=a.y+dy*t,distance2=(point.x-x)**2+(point.y-y)**2;
  if(!best||distance2<best.distance2){const length=Math.sqrt(length2);best={x,y,distance2,nx:dy/length,ny:-dx/length};}
 }return best;
}
function insideArmor(point,shape,radius=0){return polygonContains(point,shape)||nearestPolygonEdge(point,shape).distance2<=radius*radius+1e-10;}
/** A jumping head or falling feet can cross a thin plank without horizontal
 * movement. Test the footprint at the actual height crossing, not just at the
 * end of a diagonal step. Walls continue to own horizontal sliding. */
function resolvePlankHeight(world,site,from,result,old,local){
 const player=world.player;
 const bounds=BASE_SIDE_PLANK_BOUNDS;
 for(const shape of armorPolygons){
  const box={low:site.z+bounds.bottom,high:site.z+bounds.top};
  const crossing=(height,offset)=>{
   const start=from.z+offset,end=result.z+offset,t=(height-start)/(end-start);
   return t>=0&&t<=1&&insideArmor({x:old.x+(local.x-old.x)*t,y:old.y+(local.y-old.y)*t},shape,5);
  };
  if(from.z+EYE_HEIGHT<=box.low&&result.z+EYE_HEIGHT>box.low&&crossing(box.low,EYE_HEIGHT))result.z=box.low-EYE_HEIGHT;
  else if(from.z>=box.high&&result.z<box.high&&crossing(box.high,0)){
   result.z=box.high;
   if(player){
    player.jumping=false;player.jumpTime=0;delete player.jumpBaseZ;
    player.falling=!insideArmor(local,shape);player.fallVelocity=player.falling?Math.min(0,player.fallVelocity??0):0;
   }
  }
 }
}
/** Sweep the body circle against the actual tapered perimeter. Testing only
 * its boundary avoids internal slice edges and preserves smooth diagonal
 * sliding along the sampled fish-like contour. Shapes are cached at import. */
function sweepArmor(from,to,shape,radius){
 const nearest=nearestPolygonEdge(from,shape),inside=polygonContains(from,shape),dx=to.x-from.x,dy=to.y-from.y;
 if(inside||nearest.distance2<radius*radius-1e-8){
  const distance=Math.sqrt(nearest.distance2),sign=inside?-1:1;
  const nx=distance>1e-8?(from.x-nearest.x)/distance*sign:nearest.nx,ny=distance>1e-8?(from.y-nearest.y)/distance*sign:nearest.ny;
  return{inside:true,x:nearest.x+nx*(radius+.01),y:nearest.y+ny*(radius+.01)};
 }
 let first=null;const vertices=shape.points,speed2=dx*dx+dy*dy;
 const accept=(time,nx,ny)=>{if(time>=0&&time<=1&&(!first||time<first.time))first={time,normal:{x:nx,y:ny}};};
 for(let i=0;i<vertices.length;i++){
  const a=vertices[i],b=vertices[(i+1)%vertices.length],ex=b.x-a.x,ey=b.y-a.y,length=Math.hypot(ex,ey);if(length<1e-8)continue;
  const nx=ey/length,ny=-ex/length,distance=(from.x-a.x)*nx+(from.y-a.y)*ny,velocity=dx*nx+dy*ny;
  if(velocity< -1e-8&&distance>=radius-1e-8){
   const time=(radius-distance)/velocity,x=from.x+dx*time,y=from.y+dy*time,along=((x-a.x)*ex+(y-a.y)*ey)/length;
   if(along>=0&&along<=length)accept(time,nx,ny);
  }
  if(speed2<1e-12)continue;
  const ax=from.x-a.x,ay=from.y-a.y,projection=ax*dx+ay*dy,discriminant=projection*projection-speed2*(ax*ax+ay*ay-radius*radius);
  if(discriminant<0)continue;const time=(-projection-Math.sqrt(discriminant))/speed2;
  if(time<0||time>1)continue;const point={x:from.x+dx*time,y:from.y+dy*time};
  if(!polygonContains(point,shape))accept(time,(point.x-a.x)/radius,(point.y-a.y)/radius);
 }
 return first;
}
function sweepBox(from,to,box,radius){
 const minX=box.x-box.w/2-radius,maxX=box.x+box.w/2+radius,minY=box.y-box.d/2-radius,maxY=box.y+box.d/2+radius;
 if(from.x>minX&&from.x<maxX&&from.y>minY&&from.y<maxY){
  const sides=[{d:from.x-minX,x:minX-.01,y:from.y},{d:maxX-from.x,x:maxX+.01,y:from.y},{d:from.y-minY,x:from.x,y:minY-.01},{d:maxY-from.y,x:from.x,y:maxY+.01}];
  return{inside:true,...sides.sort((a,b)=>a.d-b.d)[0]};
 }
 let enter=0,exit=1,normal=null;
 for(const[axis,min,max]of[['x',minX,maxX],['y',minY,maxY]]){
  const delta=to[axis]-from[axis];if(Math.abs(delta)<1e-8){if(from[axis]<min||from[axis]>max)return null;continue;}
  const a=(min-from[axis])/delta,b=(max-from[axis])/delta,near=Math.min(a,b),far=Math.max(a,b);
  if(near>=enter){enter=near;normal={axis,sign:delta>0?-1:1};}exit=Math.min(exit,far);if(enter>exit)return null;
 }
 return normal&&enter>=0&&enter<=1?{time:enter,normal}:null;
}
function resolveFurnitureLanding(world,site,from,result,old,local){
 let landed=null;
 for(const box of furnitureColliders(site)){
  if(from.z<box.high-.001||result.z>=box.high||Math.abs(local.x-box.x)>box.w/2||Math.abs(local.y-box.y)>box.d/2)continue;
  const t=(box.high-from.z)/(result.z-from.z),x=old.x+(local.x-old.x)*t,y=old.y+(local.y-old.y)*t;
  if(t>=0&&t<=1&&Math.abs(x-box.x)<=box.w/2+5&&Math.abs(y-box.y)<=box.d/2+5)landed=landed===null?box.high:Math.max(landed,box.high);
 }
 if(landed!==null){result.z=landed;const p=world.player;p.jumping=false;p.falling=false;p.fallVelocity=0;p.jumpTime=0;delete p.jumpBaseZ;}
}

/** Apply after natural terrain/ship grounding. Swept walls keep the open door
 * passable and only reachable stair/floor heights can support the player. */
export function resolveStructureMovement(world,from,to=world.player){
 const result={x:to.x,y:to.y,z:to.z},p=world.player;
 for(const site of[...(world.structures?.bases??[]),...(world.structures?.workbenches??[])]){
  const q=structureLocalPoint(site,result.x,result.y),old=structureLocalPoint(site,from.x,from.y),spec=STRUCTURE_SPECS[site.kind];
  if(Math.abs(q.x)>spec.width/2+100&&Math.abs(old.x)>spec.width/2+100)continue;
  if(site.kind==='universal-base')resolvePlankHeight(world,site,from,result,old,q);
  if(site.kind==='universal-base')resolveFurnitureLanding(world,site,from,result,old,q);
  const boxes=site.kind==='universal-base'?baseBoxes(site):[{x:0,y:0,w:spec.width,d:spec.length,low:site.z,high:site.z+spec.height}];
  if(site.kind==='universal-base')for(const shape of armorPolygons)boxes.push({...shape,low:site.z+BASE_SIDE_PLANK_BOUNDS.bottom,high:site.z+BASE_SIDE_PLANK_BOUNDS.top});
  const active=boxes.filter(b=>Math.min(from.z,result.z)<b.high&&Math.max(from.z,result.z)+EYE_HEIGHT>b.low);
  let start={...old},end={...q};
  for(let pass=0;pass<5;pass++){
   let hit=null;for(const box of active){const candidate=box.polygon?sweepArmor(start,end,box,5):sweepBox(start,end,box,5);if(candidate&&(candidate.inside||!hit||candidate.time<hit.time))hit=candidate;}
   if(!hit){start=end;break;}
   if(hit.inside){const dx=end.x-start.x,dy=end.y-start.y;start={x:hit.x,y:hit.y};end={x:start.x+dx,y:start.y+dy};continue;}
   const dx=end.x-start.x,dy=end.y-start.y;start={x:start.x+dx*hit.time,y:start.y+dy*hit.time};
   const remaining={x:dx*(1-hit.time),y:dy*(1-hit.time)};
   if(hit.normal.axis){start[hit.normal.axis]+=hit.normal.sign*.01;remaining[hit.normal.axis]=0;}
   else{const {x:nx,y:ny}=hit.normal;start.x+=nx*.01;start.y+=ny*.01;const into=remaining.x*nx+remaining.y*ny;if(into<0){remaining.x-=nx*into;remaining.y-=ny*into;}}
   end={x:start.x+remaining.x,y:start.y+remaining.y};
  }
  Object.assign(result,structureWorldPoint(site,start.x,start.y));
  if(site.kind==='universal-base'&&Math.abs(q.x)<150&&Math.abs(q.y)<200){
   const underside=site.z-6;if(from.z+EYE_HEIGHT<=underside&&result.z+EYE_HEIGHT>underside)result.z=underside-EYE_HEIGHT;
   if(from.z+EYE_HEIGHT<=site.z+BASE_HEIGHT&&result.z+EYE_HEIGHT>site.z+BASE_HEIGHT)result.z=site.z+BASE_HEIGHT-EYE_HEIGHT;
  }
 }
 const support=getStructureSupport(world,result.x,result.y,result.z),oldSupport=getStructureSupport(world,from.x,from.y,from.z);
 const descending=(p?.falling&&(p.fallVelocity??0)<=0)||(p?.jumping&&result.z<=from.z);
 if(!p?.swimming&&support!==null&&(
  descending&&from.z>=support-1&&result.z<=support
  ||!p?.jumping&&!p?.falling&&from.z>=support-8&&(Math.abs(from.z-support)<8||oldSupport!==null&&from.z>=oldSupport-2&&support<=oldSupport+6)
 )){
  result.z=support;if(p){p.jumping=false;p.falling=false;p.fallVelocity=0;p.jumpTime=0;delete p.jumpBaseZ;}
 }
 return result;
}

/** Saved geometry is never trusted. Replay bounded land poses against the
 * prepared map, rebuilding poles/stairs and checking every overlap. */
export function validateStructuresSave(value){
 if(value===undefined)return{version:0,workbenches:[],bases:[]};
 const fail=message=>{throw new Error(`Invalid Croba save: ${message}`);};
 if(!plain(value)||!Array.isArray(value.workbenches)||!Array.isArray(value.bases)||value.workbenches.length>12||value.bases.length>8)fail('structures');
 validationWorld??=loadPreparedWorld();
 const world={...validationWorld,structures:{version:0,workbenches:[],bases:[]}},ids=new Set();
 for(const[kind,list]of[['universal-base',value.bases],['workbench',value.workbenches]])for(const source of list){
  if(!plain(source)||source.kind!==kind||typeof source.id!=='string'||!new RegExp(`^${kind==='universal-base'?'base':'workbench'}-[1-9][0-9]?$`).test(source.id)||ids.has(source.id))fail('structure identity');
  if(![source.x,source.y,source.yaw].every(finite)||source.x<SULFURIC_MAP_BOUNDS.minX||source.x>SULFURIC_MAP_BOUNDS.maxX||source.y<SULFURIC_MAP_BOUNDS.minY||source.y>SULFURIC_MAP_BOUNDS.maxY||Math.abs(source.yaw)>Math.PI*2||Math.abs(source.yaw/(Math.PI/2)-Math.round(source.yaw/(Math.PI/2)))>1e-8)fail('structure position');
  if(kind==='universal-base'&&source.doorOpen!==undefined&&typeof source.doorOpen!=='boolean')fail('base door state');
  const proposal=planStructureAt(world,kind,source);if(!proposal.valid)fail(`structure site: ${proposal.reason}`);
  const saved={...proposal.record,id:source.id,...(kind==='universal-base'?{doorOpen:source.doorOpen??false}:{})};
  if(kind==='universal-base')saved.furniture=validateBaseFurniture(saved,source.furniture,world);
  ids.add(source.id);world.structures[kind==='universal-base'?'bases':'workbenches'].push(saved);
 }
 if(worldFurnitureCount(world)>MAX_WORLD_FURNITURE)fail('world furniture limit');
 for(const base of world.structures.bases)for(const item of base.furniture){const reason=furniturePlacementReason(world,base,item,{checkPlayer:false});if(reason)fail(`furniture placement: ${reason}`);}
 world.structures.version=world.structures.bases.length+world.structures.workbenches.length;return world.structures;
}
