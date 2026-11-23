import * as THREE from './vendor/three.module.js';
import {createWeatheredRockGeometry} from './weathered-rock-geometry.js';

const SCALE=25;
/** @typedef {{id:string,x:number,y:number,z:number,rx:number,ry:number,height:number,heading:number,style:number,habitat:string}} WorldRock */

/** Three compact asymmetric convex fracture shapes, authored from uneven face
 * planes rather than an affine regular polyhedron. Exact facets serve physics.
 * X/Z fit a unit circle and Y spans 0..1 before the shared authored pose.
 * @param {number} [style] @returns {THREE.BufferGeometry}
 */
export function createWorldRockGeometry(style=0){
 if(!Number.isInteger(style)||style<0||style>2)throw new RangeError('World rock style must be 0, 1 or 2.');
 const geometry=createWeatheredRockGeometry(style),p=geometry.attributes.position;
 const normal=geometry.attributes.normal,uv=[],colors=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=Math.abs(normal.getX(i)),ny=Math.abs(normal.getY(i)),nz=Math.abs(normal.getZ(i));
  // Face projection leaves seamless fine stone grain within each planar facet.
  uv.push(...(ny>=nx&&ny>=nz?[x*.5+.5,z*.5+.5]:nx>=nz?[z*.5+.5,y]:[x*.5+.5,y]).map(value=>value*3));
  const layer=.95+.035*Math.sin(y*14+x*2.1+z*1.7+style),facet=.98+.02*normal.getY(i);
  colors.push(layer*facet,layer*facet,layer*facet);
 }
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.name=`chipped-world-rock-${style}`;geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

/** Authored embedded base and dimensions, in simulation units. The same pose
 * is shared by rendering and physical contact tests; input is never mutated.
 * @param {WorldRock} rock @param {THREE.Object3D} [target] @returns {THREE.Object3D}
 */
export function getWorldRockPose(rock,target=new THREE.Object3D()){
 if(!rock||![rock.x,rock.y,rock.z,rock.rx,rock.ry,rock.height,rock.heading].every(Number.isFinite)
   ||rock.rx<=0||rock.ry<=0||rock.height<=0)
  throw new TypeError(`World rock ${rock?.id??'(unnamed)'} needs a finite pose and positive radii and height.`);
 target.position.set(rock.x/SCALE,rock.z/SCALE,rock.y/SCALE);
 target.scale.set(rock.rx/SCALE,rock.height/SCALE,rock.ry/SCALE);
 target.rotation.set(0,rock.heading,0);target.updateMatrix();return target;
}
