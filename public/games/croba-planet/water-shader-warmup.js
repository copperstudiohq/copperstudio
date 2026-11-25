/** Compile only the small, initially hidden water effects after startup paints.
 * The main scene supplies the existing lighting/environment; it is never
 * traversed for material compilation. No render pass or resource is created.
 * @param {import('./vendor/three.module.js').WebGLRenderer} renderer
 * @param {import('./vendor/three.module.js').Camera} camera
 * @param {import('./vendor/three.module.js').Scene} targetScene
 * @param {import('./vendor/three.module.js').Object3D[]} objects
 * @param {{requestIdleCallback?:Function|null,cancelIdleCallback?:Function,
 * setTimeout?:Function,clearTimeout?:Function,onError?:(message:string,error:unknown)=>void}} [options]
 * @returns {()=>void} Cancel pending work and any remaining effects.
 */
export function scheduleWaterShaderWarmup(renderer,camera,targetScene,objects,{
 requestIdleCallback=globalThis.requestIdleCallback?.bind(globalThis),
 cancelIdleCallback=globalThis.cancelIdleCallback?.bind(globalThis),
 setTimeout=globalThis.setTimeout?.bind(globalThis),
 clearTimeout=globalThis.clearTimeout?.bind(globalThis),
 onError=(message,error)=>console.warn(message,error),
}={}){
 if(typeof renderer?.compile!=='function'||typeof renderer?.getContext!=='function'||!camera||!targetScene||!Array.isArray(objects))
  throw new TypeError('Water shader warmup needs a renderer, camera, target scene and effect objects.');
 if(objects.some(object=>!object||object===targetScene||object.isScene))
  throw new TypeError('Water shader warmup accepts effect objects, never a whole scene.');
 if(typeof onError!=='function')throw new TypeError('Water shader warmup needs an error callback.');
 const pending=[...new Set(objects)],idle=typeof requestIdleCallback==='function';
 if(!idle&&typeof setTimeout!=='function')throw new TypeError('Water shader warmup needs an idle or timer scheduler.');
 let handle=null,canceled=false,finished=false;
 const run=()=>{
  handle=null;
  if(canceled||finished)return;
  try{
   for(const object of pending){
    if(canceled||renderer.getContext().isContextLost())break;
    renderer.compile(object,camera,targetScene);
   }
  }catch(error){
   onError('Croba water shaders could not warm; effects will compile when first shown.',error);
  }finally{finished=true;pending.length=0;}
 };
 const cancel=()=>{
  if(canceled||finished)return;
  canceled=true;
  if(handle!==null){
   if(idle)cancelIdleCallback?.(handle);else clearTimeout?.(handle);
   handle=null;
  }
  pending.length=0;
 };
 if(pending.length){
  try{handle=idle?requestIdleCallback(run,{timeout:1500}):setTimeout(run,50);}
  catch(error){finished=true;pending.length=0;onError('Croba water shader warmup could not be scheduled.',error);}
 }else finished=true;
 return cancel;
}
