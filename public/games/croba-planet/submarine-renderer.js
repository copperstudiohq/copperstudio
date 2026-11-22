import * as THREE from './vendor/three.module.js';
import {SPIRES_SUBMARINE} from './jelly-spires-submarine.js';
import {createSubmarineAnatomy,disposeSubmarineAnatomy} from './submarine-anatomy.js';

/** One static, authored wreck. Scene handles distance/fog visibility using the
 * complete world bounds, including the detached stern and settled debris.
 */
export class SpiresSubmarineRenderer{
  constructor(materialLibrary={},options={}){
    const site=SPIRES_SUBMARINE;
    if(!site||![site.x,site.y,site.z,site.pitch,site.yaw,site.roll].every(Number.isFinite))
      throw new TypeError('The sunken submarine needs a finite authored pose.');
    this.group=createSubmarineAnatomy(materialLibrary,options);
    this.group.position.set(site.x/25,site.z/25,site.y/25);
    this.group.rotation.set(site.pitch,site.yaw,site.roll,site.rotationOrder??'XYZ');
    this.group.updateMatrixWorld(true);this.bounds=new THREE.Box3().setFromObject(this.group);
    this.disposed=false;
  }
  dispose(){if(this.disposed)return;this.disposed=true;disposeSubmarineAnatomy(this.group);}
}
