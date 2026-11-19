import {BASIN_MERCH_CARGO_SITE as SITE,BASIN_MERCH_CARGO_SOLIDS} from './basin-merch-cargo.js';
import {wreckLocalPoint,wreckWorldPoint} from './wreck-interior.js';

/** Exit the union of the crate and tipped lid without bouncing between them. */
export function resolveBasinMerchCollision(world){
 const p=world.player;if(Math.abs(p.x-SITE.x)>160||Math.abs(p.y-SITE.y)>160)return;
 const q=wreckLocalPoint(SITE,p.x,p.y),feet=(p.z-SITE.z)/25,head=feet+36/25,radius=.20;
 const boxes=BASIN_MERCH_CARGO_SOLIDS.filter(s=>feet<s.center[1]+s.size[1]/2&&head>s.center[1]-s.size[1]/2)
  .map(s=>({left:s.center[0]-s.size[0]/2-radius,right:s.center[0]+s.size[0]/2+radius,back:s.center[2]-s.size[2]/2-radius,front:s.center[2]+s.size[2]/2+radius}));
 const inside=(b,a)=>a.x>b.left&&a.x<b.right&&a.z>b.back&&a.z<b.front;
 if(!boxes.some(b=>inside(b,q)))return;
 const candidates=[];
 for(const edge of['left','right','back','front']){
  const a={...q},negative=edge==='left'||edge==='back';
  for(let pass=0;pass<=boxes.length;pass++){
   const overlaps=boxes.filter(b=>inside(b,a));if(!overlaps.length)break;
   a[edge==='left'||edge==='right'?'x':'z']=(negative?Math.min(...overlaps.map(b=>b[edge])):Math.max(...overlaps.map(b=>b[edge])))+(negative?-.001:.001);
  }
  if(!boxes.some(b=>inside(b,a)))candidates.push(a);
 }
 candidates.sort((a,b)=>Math.hypot(a.x-q.x,a.z-q.z)-Math.hypot(b.x-q.x,b.z-q.z));
 if(candidates[0])Object.assign(p,wreckWorldPoint(SITE,candidates[0].x,candidates[0].z));
}
