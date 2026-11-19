/** Heavy wildlife/physics runs at the same 30 Hz as rendering, independently
 * of a 60/120/144 Hz display. Bounded catch-up prevents a slow-frame spiral. */
export function createSimulationClock({hz=30,maxSteps=2}={}){
 if(!Number.isFinite(hz)||hz<=0||!Number.isInteger(maxSteps)||maxSteps<1)throw new RangeError('Invalid simulation clock budget.');
 const step=1/hz;let pending=0;
 return{step,reset(){pending=0;},advance(dt,update){
  if(!Number.isFinite(dt)||dt<=0)return 0;
  if(typeof update!=='function')throw new TypeError('Simulation update must be a function.');
  pending=Math.min(pending+dt,step*maxSteps);let count=0;
  while(pending+1e-10>=step&&count<maxSteps){update(step);pending=Math.max(0,pending-step);count++;}
  return count;
 }};
}
