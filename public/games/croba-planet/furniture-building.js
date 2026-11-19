import {FURNITURE_SPECS} from './build-catalog.js';

export const MAX_BASE_FURNITURE=16,MAX_WORLD_FURNITURE=128;
const quarter=Math.PI/2;
export const normalizeFurnitureYaw=yaw=>Math.atan2(Math.sin(yaw),Math.cos(yaw))||0;
const localPoint=(base,x,y)=>{const c=Math.cos(base.yaw),s=Math.sin(base.yaw),dx=x-base.x,dy=y-base.y;return{x:dx*c-dy*s,y:dx*s+dy*c};};
export function furnitureWorldPoint(base,item){const c=Math.cos(base.yaw),s=Math.sin(base.yaw);return{x:base.x+item.x*c+item.y*s,y:base.y-item.x*s+item.y*c,z:base.z,yaw:normalizeFurnitureYaw(base.yaw+item.yaw)};}
/** Quarter turns keep saved footprints exact and cheap to query. */
export function furnitureBounds(item,padding=0,spec=FURNITURE_SPECS[item.kind]){
 if(!spec)return null;const swap=Math.abs(Math.round(item.yaw/quarter))%2;
 const width=swap?spec.length:spec.width,length=swap?spec.width:spec.length;
 return{minX:item.x-width/2-padding,maxX:item.x+width/2+padding,minY:item.y-length/2-padding,maxY:item.y+length/2+padding,width,length};
}
const overlaps=(a,b)=>a.minX<b.maxX&&a.maxX>b.minX&&a.minY<b.maxY&&a.maxY>b.minY;
const doorAisle={minX:-43,maxX:43,minY:135,maxY:200};
const record=value=>value&&typeof value==='object'&&!Array.isArray(value);

export function furniturePlacementReason(world,base,item,{checkPlayer=true}={}){
 const spec=FURNITURE_SPECS[item.kind];
 if(!spec||![item.x,item.y,item.yaw].every(Number.isFinite)||Math.abs(item.yaw/quarter-Math.round(item.yaw/quarter))>1e-8)return 'Choose a valid furniture pose.';
 const bounds=furnitureBounds(item);
 if(bounds.minX< -135||bounds.maxX>135||bounds.minY< -180||bounds.maxY>180)return 'Keep furniture inside the habitat and clear of its walls.';
 if(overlaps(furnitureBounds(item,5),doorAisle))return 'Keep the doorway and entrance aisle clear.';
 for(const other of base.furniture??[])if(other!==item&&overlaps(furnitureBounds(item,5),furnitureBounds(other,5)))return 'Leave space around the other furniture.';
 for(const bench of world.structures?.workbenches??[]){
  if(Math.abs(bench.z-base.z)>5)continue;const p=localPoint(base,bench.x,bench.y),pose={kind:'workbench',...p,yaw:normalizeFurnitureYaw(bench.yaw-base.yaw)};
  if(overlaps(furnitureBounds(item,5),furnitureBounds(pose,5,{width:44,length:24})))return 'Leave the workbench clear.';
 }
 const player=world.player;
 if(checkPlayer&&player&&player.z<base.z+spec.height&&player.z+36>base.z){
  const p=localPoint(base,player.x,player.y),body=furnitureBounds(item,5);
  if(p.x>body.minX&&p.x<body.maxX&&p.y>body.minY&&p.y<body.maxY)return 'Move clear before placing furniture.';
 }
 return null;
}

/** Import only local poses; no mesh data or arbitrary collision boxes survive. */
export function validateBaseFurniture(base,value,world={}){
 const fail=message=>{throw new Error(`Invalid Croba save: ${message}`);};
 if(value===undefined)return[];
 if(!Array.isArray(value)||value.length>MAX_BASE_FURNITURE)fail('habitat furniture');
 const clean=[],seen=new Set(),holder={...base,furniture:clean};
 for(const source of value){
  if(!record(source)||typeof source.id!=='string'||!new RegExp(`^${base.id}-furniture-(?:[1-9]|1[0-6])$`).test(source.id)||seen.has(source.id)||!Object.hasOwn(FURNITURE_SPECS,source.kind))fail('furniture identity');
  if(![source.x,source.y,source.yaw].every(Number.isFinite)||Math.abs(source.yaw)>Math.PI*2||Math.abs(source.yaw/quarter-Math.round(source.yaw/quarter))>1e-8)fail('furniture pose');
  const item={id:source.id,kind:source.kind,x:source.x||0,y:source.y||0,yaw:normalizeFurnitureYaw(source.yaw)};
  const reason=furniturePlacementReason(world,holder,item,{checkPlayer:false});if(reason)fail(`furniture placement: ${reason}`);
  seen.add(item.id);clean.push(item);
 }return clean;
}

/** Shared seat, mattress and planter body heights match their visible load-
 * bearing surfaces. Foliage is decorative, rather than an invisible platform. */
const solidParts=Object.freeze({
 'habitat-chair':[{x:0,y:0,width:20,length:20,height:13.75},{x:0,y:-7.875,width:18.5,length:3,height:27.5}],
 'habitat-bunk':[{x:0,y:0,width:25,length:55,height:13.25},{x:0,y:-26.125,width:23.75,length:2.25,height:25},{x:0,y:26.125,width:23.75,length:2,height:14.875}],
 'habitat-planter':[{x:0,y:0,width:22.5,length:22.5,height:9.5}],
});
const colliderCache=new WeakMap();
/** Collision coordinates are base-local, matching the nested visual group. */
export function furnitureColliders(base){
 const source=base.furniture,previous=colliderCache.get(base);
 // Placed poses do not move. Appending changes the count; removal and load
 // replace the collection. No body probe needs to rebuild the same boxes.
 if(previous?.source===source&&previous.count===(source?.length??0))return previous.boxes;
 const boxes=(source??[]).flatMap(item=>{
 const spec=FURNITURE_SPECS[item.kind],parts=solidParts[item.kind]??[{x:0,y:0,width:spec.width,length:spec.length,height:spec.height}],c=Math.cos(item.yaw),s=Math.sin(item.yaw);
 return parts.map(part=>{
  const pose={x:item.x+part.x*c+part.y*s,y:item.y-part.x*s+part.y*c,yaw:item.yaw},bounds=furnitureBounds(pose,0,part);
  return{x:pose.x,y:pose.y,w:bounds.width,d:bounds.length,low:base.z,high:base.z+part.height,furniture:true};
 });
 });colliderCache.set(base,{source,count:source?.length??0,boxes});return boxes;
}
export function furnitureSupport(base,point,feet){
 let height=null;for(const box of furnitureColliders(base)){
  if(Math.abs(point.x-box.x)<=box.w/2&&Math.abs(point.y-box.y)<=box.d/2&&feet>=box.high-8)height=height===null?box.high:Math.max(height,box.high);
 }return height;
}
export function workbenchIntersectsFurniture(base,bench){
 const p=localPoint(base,bench.x,bench.y),bounds=furnitureBounds({...p,yaw:bench.yaw-base.yaw},5,{width:44,length:24});
 return(base.furniture??[]).some(item=>overlaps(bounds,furnitureBounds(item,5)));
}
