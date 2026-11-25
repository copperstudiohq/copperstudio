/** One real second advances one in-game minute. Expedition time is already
 * persisted and paused by the world; this model owns no clock or timer. */
export const DAY_NIGHT_CYCLE_SECONDS=1440;
export const START_HOUR=8;

const SECONDS_PER_HOUR=DAY_NIGHT_CYCLE_SECONDS/24;
const START_SECONDS=START_HOUR*SECONDS_PER_HOUR;
const SUN_HEIGHT=.94,SUN_TILT=Math.sqrt(1-SUN_HEIGHT*SUN_HEIGHT);
const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};

/** @typedef {{hour:number,day:number,phase:'sunrise'|'day'|'sunset'|'night',
 * daylight:number,twilight:number,night:number,sunX:number,sunY:number,sunZ:number,
 * moonX:number,moonY:number,moonZ:number}} DayNightSample */

/** Pure lighting/sky sample. World Y is vertical in the render coordinate
 * system. Sun and moon are opposite unit vectors, with a high tilted noon arc.
 * Daylight is zero below the horizon and about .75 at the initial 8 a.m. pose.
 * Night is its complementary blend; twilight is a separate horizon accent.
 * Day numbers advance at midnight, first reached after sixteen game hours.
 * Reuse `out` to avoid allocating objects or vectors in the render loop.
 * @param {number} elapsedSeconds
 * @param {Partial<DayNightSample>} [out]
 * @returns {DayNightSample}
 */
export function sampleDayNight(elapsedSeconds,out={}){
 if(!out||typeof out!=='object')throw new TypeError('Day/night output must be a reusable object.');
 const elapsed=Number.isFinite(elapsedSeconds)&&elapsedSeconds>0?elapsedSeconds:0;
 // Reduce before adding the start offset, keeping huge finite saves bounded.
 const shifted=elapsed%DAY_NIGHT_CYCLE_SECONDS+START_SECONDS;
 const hour=(shifted%DAY_NIGHT_CYCLE_SECONDS)/SECONDS_PER_HOUR;
 const angle=(hour-6)*Math.PI/12,sine=Math.sin(angle);
 out.hour=hour;
 out.day=1+Math.floor(elapsed/DAY_NIGHT_CYCLE_SECONDS)+Math.floor(shifted/DAY_NIGHT_CYCLE_SECONDS);
 out.phase=hour>=5&&hour<7?'sunrise':hour>=7&&hour<17?'day':hour>=17&&hour<19?'sunset':'night';
 out.sunX=Math.cos(angle);out.sunY=sine*SUN_HEIGHT;out.sunZ=sine*SUN_TILT;
 out.moonX=-out.sunX;out.moonY=-out.sunY;out.moonZ=-out.sunZ;
 out.daylight=smooth(out.sunY/.70);
 out.twilight=1-smooth(Math.abs(out.sunY)/.30);
 out.night=1-out.daylight;
 return out;
}
