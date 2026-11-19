/** Display range is a device preference, independent of expedition saves. */
export const RENDER_DISTANCE_STORAGE_KEY='croba.render-distance.v1';
export const RENDER_DISTANCE_OPTIONS=Object.freeze([
 Object.freeze({value:40,label:'Short · 40 m'}),
 Object.freeze({value:80,label:'Balanced · 80 m'}),
 Object.freeze({value:140,label:'Far · 140 m'}),
]);

function accepted(value){
 for(const option of RENDER_DISTANCE_OPTIONS)if(value===option.value||value===String(option.value))return option.value;
 return null;
}

/** Accept only supported metre values, including native select/storage strings.
 * Invalid fallbacks themselves safely resolve to the balanced preset.
 * @param {unknown} value @param {unknown} [fallback] @returns {40|80|140}
 */
export function normalizeRenderDistance(value,fallback=80){return accepted(value)??accepted(fallback)??80;}

/** Storage access can throw when disabled or unavailable. An injected storage
 * keeps this usable in tests and lets callers choose a phone-specific fallback.
 * @param {{getItem:(key:string)=>string|null}|null} [storage] @param {40|80|140} [fallback]
 * @returns {40|80|140}
 */
export function loadRenderDistance(storage,fallback=80){
 const defaultValue=normalizeRenderDistance(fallback);
 try{return normalizeRenderDistance((storage===undefined?globalThis.localStorage:storage)?.getItem(RENDER_DISTANCE_STORAGE_KEY),defaultValue);}
 catch{return defaultValue;}
}

/** Persistence is best effort; a blocked/full store must not prevent applying
 * the validated preference in the current game.
 * @param {unknown} value @param {{setItem:(key:string,value:string)=>void}|null} [storage]
 * @returns {40|80|140}
 */
export function saveRenderDistance(value,storage){
 const distance=normalizeRenderDistance(value);
 try{(storage===undefined?globalThis.localStorage:storage)?.setItem(RENDER_DISTANCE_STORAGE_KEY,String(distance));}catch{}
 return distance;
}
