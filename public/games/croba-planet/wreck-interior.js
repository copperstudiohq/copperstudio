/** Shared authored cabin layout, in ship-local metres (x, height, fore/aft). */
export const WRECK_DECK = .72;
export const WRECK_RAMP = Object.freeze({outer:-4.4,inner:-2.15,start:-.6,end:1.2});
/** Furniture and structural walls are shared by rendering and walking collision.
 * Boxes use centre/size in metres; the port breach opens beside the ramp. */
export const WRECK_INTERIOR_SOLIDS = Object.freeze([
  {name:'aft-pressure-bulkhead',center:[0,1.85,-5.65],size:[4.8,2.25,.20],kind:'whiteMetal'},
  {name:'starboard-cabin-liner',center:[2.45,1.65,-1.5],size:[.18,1.8,8.1],kind:'whiteMetal'},
  {name:'port-aft-door-jamb',center:[-2.45,1.65,-5.1],size:[.18,1.8,1.0],kind:'whiteMetal'},
  {name:'port-forward-door-jamb',center:[-2.45,1.65,1.7],size:[.18,1.8,1.0],kind:'whiteMetal'},
  {name:'starboard-storage-lockers',center:[1.96,1.35,-3.7],size:[.65,1.25,2.4],kind:'whiteMetal'},
  {name:'port-survival-crate',center:[-1.65,1.02,-4.75],size:[1.0,.60,.85],kind:'orangeMetal'},
  {name:'port-flight-seat',center:[-1.0,1.2,3.0],size:[.8,.95,1.0],kind:'darkMetal'},
  {name:'starboard-flight-seat',center:[1.0,1.2,3.0],size:[.8,.95,1.0],kind:'darkMetal'},
  {name:'cockpit-navigation-console',center:[0,1.2,5.3],size:[3.3,.95,.8],kind:'darkMetal'},
].map(item=>Object.freeze({...item,center:Object.freeze(item.center),size:Object.freeze(item.size)})));

export function wreckLocalPoint(ship,x,y){
  const c=Math.cos(ship.yaw??0),s=Math.sin(ship.yaw??0),dx=(x-ship.x)/25,dy=(y-ship.y)/25;
  return {x:dx*c-dy*s,z:dx*s+dy*c};
}
export function wreckWorldPoint(ship,x,z){
  const c=Math.cos(ship.yaw??0),s=Math.sin(ship.yaw??0);
  return {x:ship.x+(x*c+z*s)*25,y:ship.y+(-x*s+z*c)*25};
}
/** null outside the entrance and supported cabin. */
export function wreckFloorAt(x,z){
  if(x>=WRECK_RAMP.outer&&x<=WRECK_RAMP.inner&&z>=WRECK_RAMP.start&&z<=WRECK_RAMP.end)
    return (x-WRECK_RAMP.outer)/(WRECK_RAMP.inner-WRECK_RAMP.outer)*WRECK_DECK;
  const width=z>2?2.35-(z-2)*.125:2.35;
  if(Math.abs(x)<=width&&z>=-5.55&&z<=6.0)return WRECK_DECK;
  return null;
}

/** Append interior fittings to the wreck's existing merged material batches. */
export function addWreckInterior(ship){
  ship.box('darkMetal','walkable-cabin-deck',[0,WRECK_DECK-.07,-1.75],[4.7,.14,7.5]);
  ship.panel('darkMetal','tapered-cockpit-deck',[[-2.35,WRECK_DECK,2],[2.35,WRECK_DECK,2],[1.85,WRECK_DECK,6],[-1.85,WRECK_DECK,6]]);
  const r=WRECK_RAMP;
  ship.panel('darkMetal','breached-boarding-ramp',[[r.outer,0,r.start],[r.inner,WRECK_DECK,r.start],[r.inner,WRECK_DECK,r.end],[r.outer,0,r.end]]);
  for(const item of WRECK_INTERIOR_SOLIDS)ship.box(item.kind,item.name,item.center,item.size);
  for(const side of [-1,1]){
    ship.box('darkMetal','cockpit-side-liner',[side*2.13,1.45,3.8],[.15,1.4,3.5],[0,-side*.15,0]);
    ship.box('whiteMetal','seat-backrest',[side,1.88,2.62],[.83,.78,.16],[.15,0,0]);
    for(const arm of [-1,1])ship.box('whiteMetal','seat-armrest',[side+arm*.46,1.4,3.02],[.08,.09,.7]);
    if(side>0){
      ship.strut('whiteMetal','cockpit-control-yoke',[side,1.5,4.75],[side,1.85,4.6],.035);
      ship.strut('darkMetal','cockpit-control-grip',[side-.18,1.85,4.6],[side+.18,1.85,4.6],.035);
    }
    ship.box('whiteMetal','aisle-safety-strip',[side*.72,WRECK_DECK+.009,-1.1],[.04,.012,6.8]);
    ship.box('whiteMetal','console-instrument-recess',[side*.85,1.72,5.2],[1.1,.035,.52],[.22,0,0]);
    ship.box('glass','unpowered-flight-display',[side*.85,1.745,5.18],[.96,.018,.40],[.22,0,0]);
    for(let button=0;button<5;button++)ship.box(button%2?'whiteMetal':'orangeMetal','console-toggle',[side*.85-.4+button*.19,1.76,4.94],[.045,.035,.045]);
  }
  for(let row=0;row<3;row++){
    ship.box('darkMetal','locker-door-recess',[1.623,1.35,-4.46+row*.76],[.015,1.06,.66]);
    ship.strut('orangeMetal','locker-recessed-pull',[1.60,1.23,-4.46+row*.76],[1.60,1.45,-4.46+row*.76],.025);
  }
  for(let z=-4.8;z<2;z+=.7)ship.box('whiteMetal','deck-grating-rib',[0,WRECK_DECK+.009,z],[1.2,.015,.024]);
  ship.box('darkMetal','aft-service-recess',[0,1.8,-5.53],[1.5,1.5,.04]);
  for(const x of [-.5,0,.5])ship.strut('orangeMetal','bulkhead-service-pipe',[x,1.1,-5.48],[x,2.5,-5.48],.045);
}
