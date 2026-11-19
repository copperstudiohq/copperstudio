import {BLUE_OCEAN_START_X} from './terrain.js';

export const SQUID_HUNT_CALL_RANGE=3500; // 140 metres, simulation units are 25/m.
export const SQUID_HUNT_CALL_SECONDS=8;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const unavailable=s=>s.squidHeldBy||s.squidRespawnIn>0;

/** Only firsthand sightings produce calls. Recipients get a frozen sighting,
 * never the player's live position; alerts expire without recursive relaying.
 * All sightings are collected before this pass so array order cannot affect recruitment. */
export function coordinateSquidHunt(world,adults,visible,time,getBrain){
 const allowed=world.player?.swimming&&world.player.x>=BLUE_OCEAN_START_X&&!world.squidEncounter;
 for(const squid of adults){
  const brain=getBrain(squid,false);
  if(brain?.assist&&(!allowed||visible.get(squid)||brain.assist.until<=time||!adults.some(s=>s.id===brain.assist.callerId&&!unavailable(s))))brain.assist=null;
  if(brain||Object.hasOwn(squid,'assistingHunt'))squid.assistingHunt=Boolean(brain?.assist&&!visible.get(squid));
 }
 if(!allowed)return;
 const callers=adults.filter(s=>visible.get(s)&&!unavailable(s)&&getBrain(s).lastSeen
  &&time>=(getBrain(s).nextHuntCall??0));
 const delivered=new Set();
 for(const helper of adults){
  if(unavailable(helper)||visible.get(helper)||helper.feeding?.phase==='eating'||helper.feeding?.phase==='pulling')continue;
  const caller=callers.filter(s=>s!==helper&&distance(s,helper)<=SQUID_HUNT_CALL_RANGE)
   .sort((a,b)=>distance(a,helper)-distance(b,helper)||a.id.localeCompare(b.id))[0];
  if(!caller)continue;
  const brain=getBrain(helper),sighting=getBrain(caller).lastSeen;
  const dx=sighting.x-caller.x,dy=sighting.y-caller.y,length=Math.hypot(dx,dy)||1;
  const side=helper.id<caller.id?-1:1;
  brain.assist={callerId:caller.id,until:time+SQUID_HUNT_CALL_SECONDS,
   point:{...sighting},goal:{x:sighting.x-dy/length*200*side,y:sighting.y+dx/length*200*side,z:sighting.z}};
  helper.assistingHunt=true;delivered.add(caller);
 }
 for(const caller of delivered){
  getBrain(caller).nextHuntCall=time+6;
  caller.huntCallCount=(caller.huntCallCount??0)+1;
 }
}
