import * as THREE from './vendor/three.module.js';
import {WRECK_DECK} from './wreck-interior.js';

/** Fixed roof anchors and thin cardboard pine cards, in starter-ship metres.
 * The lowest card edge is 2.56m high; standing player heads reach 2.16m. */
export const WRECK_AIR_FRESHENERS=Object.freeze([
  {id:'port',x:-.36,z:3.82,roofY:3.485,cardY:2.88,twist:-.16},
  {id:'starboard',x:.34,z:3.98,roofY:3.457,cardY:2.81,twist:.20},
].map(Object.freeze));

function pineCardGeometry(){
  const shape=new THREE.Shape();
  const outline=[[0,.25],[.055,.15],[.030,.15],[.10,.055],[.060,.055],
    [.14,-.065],[.065,-.065],[.16,-.17],[.045,-.17],[.045,-.25],
    [-.045,-.25],[-.045,-.17],[-.16,-.17],[-.065,-.065],[-.14,-.065],
    [-.060,.055],[-.10,.055],[-.030,.15],[-.055,.15]];
  outline.forEach(([x,y],index)=>index?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const hole=new THREE.Path();
  for(let index=0;index<8;index++){
    const angle=index*Math.PI/4,x=Math.cos(angle)*.008,y=.20+Math.sin(angle)*.008;
    if(index)hole.lineTo(x,y);else hole.moveTo(x,y);
  }
  hole.closePath();shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape,{depth:.009,bevelEnabled:false,curveSegments:1,steps:1});
}

/** Append car-like fittings to the existing wreck surface batches. No added
 * fitting occupies the boarding breach or the narrow central walking aisle. */
export function addWreckCabinDecor(ship){
  if(!ship||!['add','box','panel','strut'].every(name=>typeof ship[name]==='function'))
    throw new TypeError('Cabin decor requires the wreck add/box/panel/strut builder.');

  // Soft-looking pads, stitched cushions and headrests stay in each solid seat.
  for(const side of[-1,1]){
    ship.box('whiteMetal','cabin-upholstered-seat-pad',[side,1.697,3.13],[.73,.044,.69]);
    for(const x of[-.25,0,.25])ship.box('darkMetal','cabin-seat-stitched-channel',[side+x,1.722,3.13],[.012,.008,.58]);
    for(const y of[1.66,1.84,2.03,2.20])ship.box('darkMetal','cabin-backrest-upholstery-seam',[side,y,2.728],[.68,.012,.012],[.15,0,0]);
    for(const x of[-.15,.15])ship.strut('darkMetal','cabin-headrest-post',[side+x,2.21,2.63],[side+x,2.36,2.63],.018);
    ship.box('whiteMetal','cabin-padded-headrest',[side,2.40,2.61],[.52,.23,.19],[.08,0,0]);
    ship.box('darkMetal','cabin-headrest-stitch',[side,2.40,2.711],[.43,.012,.008]);
    ship.panel('orangeMetal','cabin-diagonal-seat-belt',[[side-.31,2.20,2.75],[side-.24,2.20,2.75],
      [side+.30,1.68,2.75],[side+.23,1.68,2.75]]);
    ship.box('darkMetal','cabin-seat-belt-buckle',[side+.26,1.69,2.78],[.105,.085,.035]);
    ship.box('orangeMetal','cabin-seat-belt-release',[side+.26,1.69,2.803],[.047,.038,.013]);

    // A low rubber footwell mat and heel plate never become raised obstacles.
    ship.box('darkMetal','cabin-rubber-floor-mat',[side,WRECK_DECK+.015,4.11],[.82,.022,.95]);
    for(let rib=0;rib<5;rib++)ship.box('whiteMetal','cabin-floor-mat-groove',[side-.29+rib*.145,WRECK_DECK+.028,4.11],[.014,.006,.75]);
    ship.box('whiteMetal','cabin-driver-heel-plate',[side,WRECK_DECK+.030,4.44],[.44,.009,.15]);

    // Car dashboard vents flank the existing unpowered flight displays.
    ship.box('whiteMetal','cabin-dashboard-vent-frame',[side*1.36,1.835,5.35],[.43,.13,.075]);
    ship.box('darkMetal','cabin-dashboard-vent-recess',[side*1.36,1.835,5.304],[.36,.085,.017]);
    for(let slat=0;slat<4;slat++)ship.box('whiteMetal','cabin-dashboard-vent-louver',[side*1.36-.135+slat*.09,1.835,5.289],[.018,.064,.017],[0,.18,0]);

    // Only the left seat has driving controls; the right remains a passenger seat.
    if(side>0){
      ship.add('darkMetal','cabin-steering-wheel-rim',new THREE.TorusGeometry(.275,.030,4,14),[side,1.96,4.51],[-.20,0,0]);
      for(const angle of[.28,Math.PI-.28,Math.PI*1.5]){
        ship.strut('whiteMetal','cabin-steering-wheel-spoke',[side,1.96,4.51],
          [side+Math.cos(angle)*.245,1.96+Math.sin(angle)*.245,4.51],.018);
      }
      ship.add('orangeMetal','cabin-steering-wheel-hub',new THREE.CylinderGeometry(.065,.065,.065,8),[side,1.96,4.51],[Math.PI/2,0,0]);
    }

    // Overhead handles attach to the existing sloped canopy frame.
    const from=[side*1.25,3.78,2.12],a=[side*1.12,3.48,2.12],b=[side*1.12,3.48,2.55],to=[side*1.25,3.705,2.55];
    ship.strut('whiteMetal','cabin-overhead-handle-mount',from,a,.026);
    ship.strut('darkMetal','cabin-overhead-grab-handle',a,b,.034);
    ship.strut('whiteMetal','cabin-overhead-handle-mount',b,to,.026);
  }

  ship.box('darkMetal','cabin-padded-dashboard-brow',[0,1.83,5.58],[3.20,.14,.16]);
  ship.box('whiteMetal','cabin-dashboard-lower-trim',[0,1.60,4.89],[3.12,.055,.035]);
  ship.box('darkMetal','cabin-center-control-plinth',[0,1.724,4.99],[.68,.10,.20]);
  for(const x of[-.22,.22]){
    ship.add('whiteMetal','cabin-dashboard-rotary-knob',new THREE.CylinderGeometry(.048,.048,.045,8),[x,1.77,4.93],[Math.PI/2,0,0]);
    ship.box('orangeMetal','cabin-rotary-knob-indicator',[x,1.80,4.902],[.009,.023,.008]);
  }

  // Cup holders fit on top of the existing console, not across its access aisle.
  for(const x of[-1.40,1.40]){
    ship.add('darkMetal','cabin-console-cup-well',new THREE.CylinderGeometry(.115,.115,.09,8,1,true),[x,1.73,4.99]);
    ship.add('whiteMetal','cabin-console-cup-holder-rim',new THREE.TorusGeometry(.115,.018,4,10),[x,1.785,4.99],[Math.PI/2,0,0]);
  }
  ship.add('orangeMetal','cabin-insulated-cup',new THREE.CylinderGeometry(.075,.063,.20,8),[1.40,1.86,4.99]);
  ship.add('darkMetal','cabin-insulated-cup-lid',new THREE.CylinderGeometry(.080,.080,.025,8),[1.40,1.968,4.99]);
  ship.box('whiteMetal','cabin-restrained-notebook',[-1.35,1.69,5.48],[.33,.025,.19],[0,-.12,0]);
  ship.panel('orangeMetal','cabin-notebook-elastic',[[-1.38,1.706,5.375],[-1.35,1.706,5.375],[-1.35,1.706,5.58],[-1.38,1.706,5.58]]);

  // Familiar mirror and tree cards give the cockpit an inhabited car interior.
  ship.strut('darkMetal','cabin-rearview-mirror-stem',[0,3.47,3.92],[0,3.23,4.02],.015);
  ship.box('darkMetal','cabin-rearview-mirror-housing',[0,3.19,4.04],[.54,.17,.055],[.03,0,0]);
  ship.box('glass','cabin-rearview-mirror-face',[0,3.19,4.007],[.47,.115,.008],[.03,0,0]);
  for(const card of WRECK_AIR_FRESHENERS){
    const hole=new THREE.Vector3(0,.20,.0045).applyEuler(new THREE.Euler(0,card.twist,card.twist*.18)).add(new THREE.Vector3(card.x,card.cardY,card.z));
    ship.box('darkMetal','cabin-air-freshener-roof-hook',[card.x,card.roofY-.012,card.z],[.045,.024,.035]);
    ship.strut('whiteMetal','cabin-air-freshener-string',[card.x,card.roofY-.025,card.z],hole.toArray(),.006);
    ship.add('whiteMetal',`cabin-air-freshener-card-${card.id}`,pineCardGeometry(),[card.x,card.cardY,card.z],[0,card.twist,card.twist*.18]);
  }
}

/** WreckBuilder currently supplies its own per-vertex wear. Apply green paper
 * pigment to just the named pine-card features after finish(), without another
 * material or draw. Safe to call more than once; all other vertex colors stay. */
export function applyWreckCabinDecorTints(group){
  if(!group?.traverse)throw new TypeError('Cabin tinting requires a THREE.Group.');
  group.traverse(mesh=>{
    const geometry=mesh.geometry,color=geometry?.attributes?.color;
    if(!color||geometry.userData.cabinDecorTinted)return;
    for(const feature of geometry.userData.features??[]){
      if(!feature.name.startsWith('cabin-air-freshener-card-'))continue;
      for(let index=feature.start;index<feature.start+feature.count;index++){
        color.setXYZ(index,color.getX(index)*.19,color.getY(index)*.53,color.getZ(index)*.27);
      }
    }
    color.needsUpdate=true;geometry.userData.cabinDecorTinted=true;
  });
  return group;
}
