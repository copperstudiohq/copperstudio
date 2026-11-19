import * as THREE from './vendor/three.module.js';

/** Authored layout stays forward of the entry ramp and the cabin bird nurseries.
 * Only the left seat has driving controls; |x|<1.1 remains the walking aisle. */
export const HAULER_CABIN_DECOR_LAYOUT=Object.freeze({
  driverX:1.75,steeringWheelCount:1,floorY:3.35,aisleHalfWidth:1.1,
  minZ:18.04,maxZ:21.95,addedTriangles:952,
});
export const HAULER_LEFT_WHEEL_SOLID=Object.freeze({
  id:'hauler-left-steering-wheel',center:Object.freeze([1.75,4.60,20.62]),size:Object.freeze([.85,.84,.22]),
});

/** Car-like fittings share the hauler's existing material batches. The builder
 * owns each supplied geometry, just as it owns the existing wreck fittings. */
export function addHaulerCabinDecor(ship){
  if(!ship||!['add','box','panel','beam'].every(name=>typeof ship[name]==='function'))
    throw new TypeError('Hauler cabin decor requires the add/box/panel/beam builder.');

  // A single left-hand steering wheel and short column face the driver's seat.
  ship.add('darkMetal','hauler-left-steering-wheel',new THREE.TorusGeometry(.39,.035,4,12),[1.75,4.60,20.62],[-.18,0,0]);
  ship.beam('darkMetal','hauler-left-steering-column',[1.75,4.19,21.06],[1.75,4.60,20.62],.045,4);
  for(const angle of[.25,Math.PI-.25,Math.PI*1.5]){
    const up=Math.sin(angle)*.35;
    ship.beam('whiteMetal','hauler-left-wheel-spoke',[1.75,4.60,20.62],
      [1.75+Math.cos(angle)*.35,4.60+up*Math.cos(.18),20.62-up*Math.sin(.18)],.022,4);
  }
  ship.add('orangeMetal','hauler-left-wheel-hub',new THREE.CylinderGeometry(.08,.08,.07,6),[1.75,4.60,20.62],[Math.PI/2-.18,0,0]);

  // Pedals sit in the driver's footwell, outside the shared central aisle.
  for(const [x,width]of[[1.96,.16],[1.55,.24]]){
    ship.beam('darkMetal','hauler-driver-pedal-arm',[x,3.36,20.52],[x,3.51,20.28],.025,4);
    ship.box('whiteMetal','hauler-driver-pedal',[x,3.52,20.28],[width,.075,.24],[.40,0,0]);
  }

  for(const side of[-1,1]){
    const x=side*1.75;
    // Rounded cushion and headrest silhouettes soften the original seat blocks.
    ship.add('whiteMetal','hauler-seat-upholstered-cushion',new THREE.SphereGeometry(1,8,4),[x,3.995,18.8],[0,0,0],[.635,.045,.67]);
    ship.box('whiteMetal','hauler-seat-upholstered-back',[x,4.60,18.275],[1.25,1.30,.045],[.10,0,0]);
    for(const offset of[-.24,.24]){
      ship.beam('darkMetal','hauler-seat-headrest-post',[x+offset,5.25,18.18],[x+offset,5.46,18.18],.018,4);
      ship.panel('darkMetal','hauler-seat-cushion-channel',[[x+offset-.007,4.041,18.30],[x+offset+.007,4.041,18.30],
        [x+offset+.007,4.041,19.30],[x+offset-.007,4.041,19.30]]);
    }
    ship.add('whiteMetal','hauler-seat-padded-headrest',new THREE.SphereGeometry(1,6,4),[x,5.52,18.16],[0,0,0],[.40,.15,.13]);
    for(const y of[4.32,4.83]){
      const z=18.302+(y-4.6)*.10;
      ship.panel('darkMetal','hauler-seat-backrest-stitch',[[x-.53,y-.007,z],[x+.53,y-.007,z],[x+.53,y+.007,z],[x-.53,y+.007,z]]);
    }
    const beltZ=y=>18.312+(y-4.6)*.10;
    ship.panel('orangeMetal','hauler-seat-diagonal-belt',[[x-.47,5.16,beltZ(5.16)],[x-.39,5.16,beltZ(5.16)],
      [x+.45,4.02,beltZ(4.02)],[x+.37,4.02,beltZ(4.02)]]);
    ship.box('darkMetal','hauler-seat-belt-buckle',[x+.41,4.06,beltZ(4.06)+.018],[.12,.10,.032]);

    ship.box('darkMetal','hauler-footwell-rubber-mat',[x,3.363,20.02],[1.05,.020,1.20]);
    for(const offset of[-.32,0,.32])ship.panel('whiteMetal','hauler-floor-mat-groove',[
      [x+offset-.008,3.374,19.52],[x+offset+.008,3.374,19.52],[x+offset+.008,3.374,20.52],[x+offset-.008,3.374,20.52]]);

    // Roof-mounted handles are high above heads and do not enter nest rooms.
    ship.beam('whiteMetal','cab-overhead-handle-mount',[side*3.45,7.85,18.2],[side*3.45,7.55,18.2],.035,4);
    ship.beam('darkMetal','cab-overhead-grab-handle',[side*3.45,7.55,18.2],[side*3.45,7.55,19.0],.04,4);
    ship.beam('whiteMetal','cab-overhead-handle-mount',[side*3.45,7.55,19.0],[side*3.45,7.82,19.0],.035,4);
  }

  // Dashboard details sit on the existing dashboard box, not in the aisle.
  ship.box('darkMetal','hauler-dashboard-soft-brow',[0,4.40,21.8],[6.6,.10,.28]);
  ship.box('darkMetal','hauler-dashboard-driver-cluster',[1.75,4.43,21.04],[1.1,.23,.07]);
  for(const x of[2.01,1.49]){
    ship.add('glass','hauler-dashboard-unpowered-dial',new THREE.CircleGeometry(.073,12),[x,4.44,20.999],[0,Math.PI,0]);
    ship.panel('whiteMetal','hauler-dashboard-dial-needle',[[x-.006,4.413,20.994],[x+.006,4.413,20.994],
      [x+.022,4.475,20.994],[x+.012,4.475,20.994]]);
  }
  for(const x of[-3.0,3.0]){
    ship.box('whiteMetal','hauler-dashboard-vent-frame',[x,4.46,21.31],[.53,.13,.08]);
    ship.panel('darkMetal','hauler-dashboard-vent-recess',[[x-.23,4.41,21.263],[x+.23,4.41,21.263],
      [x+.23,4.51,21.263],[x-.23,4.51,21.263]]);
    for(const offset of[-.15,0,.15])ship.panel('whiteMetal','hauler-dashboard-vent-louver',[
      [x+offset-.009,4.425,21.255],[x+offset+.009,4.425,21.255],
      [x+offset+.009,4.495,21.255],[x+offset-.009,4.495,21.255]]);
  }
  for(let button=0;button<4;button++)ship.box(button%2?'orangeMetal':'whiteMetal','hauler-dashboard-instrument-switch',
    [-.42+button*.28,4.385,21.22],[.09,.07,.10]);

  // Passenger storage and restrained objects use the dashboard's solid footprint.
  ship.panel('whiteMetal','hauler-dashboard-glovebox',[[-1.95,4.09,20.942],[-3.10,4.09,20.942],
    [-3.10,4.29,20.942],[-1.95,4.29,20.942]]);
  ship.box('darkMetal','hauler-dashboard-glovebox-latch',[-2.53,4.19,20.918],[.22,.04,.025]);
  ship.box('whiteMetal','hauler-restrained-notebook',[-1.60,4.368,21.43],[.46,.025,.32],[0,-.12,0]);
  ship.panel('orangeMetal','hauler-notebook-retaining-strap',[[-1.55,4.383,21.26],[-1.59,4.383,21.26],
    [-1.59,4.383,21.60],[-1.55,4.383,21.60]]);
  ship.add('darkMetal','hauler-dashboard-cup-holder',new THREE.TorusGeometry(.13,.019,4,8),[-2.75,4.37,21.3],[Math.PI/2,0,0]);
  ship.add('orangeMetal','hauler-insulated-cup',new THREE.CylinderGeometry(.085,.07,.23,6),[-2.75,4.48,21.3]);
  ship.add('darkMetal','hauler-insulated-cup-lid',new THREE.CylinderGeometry(.09,.09,.025,6),[-2.75,4.606,21.3]);
  return HAULER_CABIN_DECOR_LAYOUT;
}
