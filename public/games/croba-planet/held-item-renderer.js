import * as THREE from './vendor/three.module.js';
import {YOYO_GRIP} from './yoyo-physics.js';
import {createToolModel,createExplorerHand,HELD_ITEM_IDS} from './tool-models.js';

/** A single camera-local grip follows the selected quick slot. The existing
 * physical yo-yo renderer continues to own its disc and simulated cord. */
export class HeldItemRenderer {
 constructor(camera){
  if(!camera?.isCamera)throw new TypeError('Held supplies require a camera.');
  this.camera=camera;this.itemBounds=new Map();this.fitBox=new THREE.Box3();this.fitRotation=new THREE.Matrix4();
  this.handBounds=new THREE.Box3(new THREE.Vector3(-.11,-.12,-.09),new THREE.Vector3(.10,.13,.09));
  this.group=new THREE.Group();this.group.name='first-person-held-supplies';camera.add(this.group);
  this.hand=createExplorerHand();this.group.add(this.hand);this.models=new Map();this.item=null;this.disposed=false;this.phase=0;this.group.visible=false;
 }
 update(world,time=world?.elapsed??0,dt=0,moving=false){
  if(this.disposed)return;
  const id=world.quickSlots?.[world.activeQuickSlot??0],available=id&&(world.inventory?.[id]??0)>0;
  this.group.visible=Boolean(available&&!world.squidEncounter&&!world.centipedeEncounter&&!world.treeStalkerEncounter&&!world.sandWormEncounter);
  if(!this.group.visible)return;
  if(id!==this.item){
   if(this.item&&this.models.has(this.item))this.models.get(this.item).visible=false;
   this.item=id;
   if(id!=='copper-yoyo'&&!this.models.has(id)){
    if(!HELD_ITEM_IDS.includes(id)){this.group.visible=false;return;}
    const model=createToolModel(id,{firstPerson:true}),bounds=new THREE.Box3();
    for(const mesh of model.children)bounds.union(mesh.geometry.boundingBox);
    this.itemBounds.set(id,bounds);this.models.set(id,model);this.group.add(model);
   }
   if(this.models.has(id))this.models.get(id).visible=true;
  }
  const age=world.elapsed-(world.crafting?.lastToolUseAt??-Infinity),swing=age>=0&&age<.42?Math.sin(age/.42*Math.PI):0;
  const clock=Number.isFinite(time)?time:0,bob=moving?Math.sin(clock*8)*.009:Math.sin(clock*1.7)*.002;
  if(id==='copper-yoyo'){
   this.group.position.set(YOYO_GRIP[0],YOYO_GRIP[1]-.040,YOYO_GRIP[2]+.025);this.group.rotation.set(.10,0,-.15);
  }else{
   this.group.rotation.set(-.10-swing*.30,.14,Math.sin(clock*4)*.009+swing*.25);
   this.fitBox.copy(this.handBounds);const bounds=this.itemBounds.get(id);if(bounds)this.fitBox.union(bounds);
   this.fitBox.applyMatrix4(this.fitRotation.makeRotationFromEuler(this.group.rotation));
   const aspect=Number.isFinite(this.camera.aspect)&&this.camera.aspect>0?this.camera.aspect:1;
   const fov=Number.isFinite(this.camera.fov)?THREE.MathUtils.clamp(this.camera.fov,25,120):76;
   const zoom=Number.isFinite(this.camera.zoom)&&this.camera.zoom>0?this.camera.zoom:1;
   const slope=Math.tan(THREE.MathUtils.degToRad(fov/2))*aspect/zoom;
   // Fit the unchanged palm and active tool to the real perspective width.
   // Cropped sleeve below the frame is intentional; fingers stay in view.
   const depth=Math.max(.49+swing*.025,(this.fitBox.max.x-this.fitBox.min.x)/(1.88*slope)+this.fitBox.max.z);
   const halfWidth=Math.max(.02,depth-this.fitBox.max.z)*slope*.94;
   const minX=-halfWidth-this.fitBox.min.x,maxX=halfWidth-this.fitBox.max.x;
   this.group.position.set(THREE.MathUtils.clamp(.285,minX,maxX),-.235+bob,-depth);
  }
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.hand.dispose();for(const model of this.models.values())model.dispose();this.models.clear();this.itemBounds.clear();this.group.removeFromParent();this.group.clear();}
}
