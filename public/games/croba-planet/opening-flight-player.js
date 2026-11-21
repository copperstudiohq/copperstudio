import {OpeningFlight,OPENING_FLIGHT_DURATION,sampleOpeningFlight} from './opening-flight.js';

/** Owns only opening UI and its bounded clock. The game owns the renderer/RAF.
 * @param {{document:Document,createFlight?:()=>OpeningFlight,drawWake:()=>void,
 * onComplete:(event?:Event)=>void,onError?:(error:unknown)=>void}} options
 */
export function createOpeningFlightPlayer({document,createFlight=()=>new OpeningFlight(),drawWake,onComplete,
  onError=error=>console.warn('Croba Planet: opening sequence could not play.',error)}){
  const element=id=>{const value=document.getElementById(id);if(!value)throw new Error(`Missing opening control: ${id}`);return value;};
  const panel=element('opening-cinematic'),tag=element('opening-tag'),title=element('opening-title'),subtitle=element('opening-subtitle'),progress=element('opening-progress'),fade=element('opening-fade');
  let flight=null,active=false,disposed=false,elapsed=0,lastPhase='';
  function release(){
    const owned=flight;flight=null;active=false;
    panel.hidden=true;document.body.classList.remove('opening');
    owned?.dispose();
  }
  function finish(event){if(!active)return;release();onComplete(event);}
  function fail(error){try{release();}finally{onError(error);onComplete();}}
  function present(){
    const state=sampleOpeningFlight(elapsed);
    if(state.phase!==lastPhase){tag.textContent=`CROBA / ${state.phase.replaceAll('-',' ').toUpperCase()}`;title.textContent=state.title;subtitle.textContent=state.subtitle;lastPhase=state.phase;}
    progress.value=state.progress;fade.style.opacity=String(state.blackout);
    return state;
  }
  return{
    get active(){return active;},get elapsed(){return elapsed;},
    start(){
      if(disposed)return false;
      if(active)release();elapsed=0;lastPhase='';
      try{flight=createFlight();active=true;panel.hidden=false;document.body.classList.add('opening');present();return true;}
      catch(error){fail(error);return false;}
    },
    advance(dt,{paused=false}={}){
      if(!active||paused||!Number.isFinite(dt)||dt<=0)return;
      elapsed=Math.min(OPENING_FLIGHT_DURATION,elapsed+Math.min(dt,.25));
      if(elapsed>=OPENING_FLIGHT_DURATION)finish();
    },
    draw(renderer,{aspect=1,reducedMotion=false}={}){
      if(!active)return;
      try{
        const state=present();
        if(state.phase==='wake')drawWake();
        else{flight.update(elapsed,{aspect,reducedMotion});renderer.render(flight.scene,flight.camera);}
      }catch(error){fail(error);}
    },
    skip(event){finish(event);},
    cancel(){if(active||flight)release();},
    dispose(){if(disposed)return;disposed=true;release();},
  };
}
