import {createArcticMusic,isArcticMusicRegion} from './arctic-music.js';
import {getBasinCave} from './basin-caves.js';
import {EYE_HEIGHT} from './terrain.js';

export const BASIN_CAVE_MUSIC_URL=new URL('./assets/audio/cold-world.m4a',import.meta.url).href;

/** Real cave volume takes precedence over its surface biome or a stale cave ID.
 * This also works immediately after loading, before movement restores cave tags.
 * @param {import('./world.js').World} world
 */
export function isBasinCaveMusicRegion(world){
  const p=world?.player;
  return Boolean(p&&[p.x,p.y,p.z].every(Number.isFinite)&&getBasinCave(p.x,p.y,p.z,EYE_HEIGHT));
}

/** Two lazy streams share the existing sound context. Only a short crossfade
 * plays both; each track pauses once inaudible and retains its own cursor.
 * @param {{createMedia?:(region:'arctic'|'basin-cave')=>HTMLAudioElement,
 * onError?:(region:string,error:unknown)=>void,volume?:number,fadeSeconds?:number}} [options]
 */
export function createRegionMusic({createMedia=()=>new Audio(),
  onError=(region,error)=>console.warn(`Croba Planet: ${region} music could not play.`,error),
  volume=.35,fadeSeconds=2}={}){
  let caveEligible=false,cinematicEligible=false;
  const arctic=createArcticMusic({volume,fadeSeconds,createMedia:()=>createMedia('arctic'),
    isRegion:world=>(cinematicEligible||isArcticMusicRegion(world))&&!caveEligible,onError:error=>onError('Arctic',error)});
  const cave=createArcticMusic({src:BASIN_CAVE_MUSIC_URL,volume,fadeSeconds,
    createMedia:()=>createMedia('basin-cave'),isRegion:()=>caveEligible,onError:error=>onError('Basin Cave',error)});
  return{
    /** Prime both elements synchronously in the existing sound-on gesture. */
    activate(context){return Promise.all([arctic.activate(context),cave.activate(context)]).then(results=>results.some(Boolean));},
    update(world,dt,state={}){
      cinematicEligible=Boolean(state.cinematic);
      caveEligible=!cinematicEligible&&isBasinCaveMusicRegion(world);
      arctic.update(world,dt,state);cave.update(world,dt,state);
    },
    stop(){caveEligible=cinematicEligible=false;arctic.stop();cave.stop();},
    reset(){caveEligible=cinematicEligible=false;arctic.reset();cave.reset();},
    dispose(){caveEligible=cinematicEligible=false;arctic.dispose();cave.dispose();},
  };
}
