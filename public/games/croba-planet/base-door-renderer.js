import * as THREE from './vendor/three.module.js';
import {BASE_DOOR_BOUNDS} from './base-building.js';

/** A closed bevelled leaf. The front cap is inset slightly from its rounded
 * backing, giving the white habitat panel a hard, smooth reinforced edge. */
function leafGeometry(width,height,depth){
 const positions=[],indices=[],profiles=[[width/2,height/2,.055,-depth/2],[width/2-.025,height/2-.025,.045,depth/2]],count=8;
 for(const[x,y,r,z]of profiles)for(const[px,py]of[[-x+r,-y],[x-r,-y],[x,-y+r],[x,y-r],[x-r,y],[-x+r,y],[-x,y-r],[-x,-y+r]])positions.push(px,py,z);
 for(let i=0;i<count;i++){const n=(i+1)%count;indices.push(i,n,count+i,n,count+n,count+i);}
 for(let i=1;i<count-1;i++)indices.push(0,i+1,i,count,count+i,count+i+1);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.userData={doorLeaf:true,reinforced:true,rounded:true,closed:true};return geometry;
}

function innerFaceGeometry(width,height){
 const x=width/2,y=height/2,r=.045,points=[[-x+r,-y],[x-r,-y],[x,-y+r],[x,y-r],[x-r,y],[-x+r,y],[-x,y-r],[-x,-y+r]],indices=[];
 for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flatMap(([px,py])=>[px,py,0]),3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

/** Flat details share the existing surface batches rather than adding panels,
 * transparent layers, textures or lights. */
function face(builder,kind,name,x,y,z,width,height,color,inside=false){
 builder.add(kind,name,new THREE.PlaneGeometry(width,height),[x,y,z],[0,inside?Math.PI:0,0],color);
}

/** Add two reinforced sliding leaves and controls to the caller's merged
 * habitat builder. Geometry ownership follows builder.add/box; no material
 * or texture is allocated. Closed is the default for old/new base records. */
export function addHabitatDoor(builder,site){
 if(typeof builder?.add!=='function'||typeof builder?.box!=='function')throw new TypeError('Habitat door requires a merged geometry builder.');
 const open=site?.doorOpen===true,half=BASE_DOOR_BOUNDS.halfWidth/25,centerZ=BASE_DOOR_BOUNDS.centerY/25,height=BASE_DOOR_BOUNDS.height/25;
 const leafWidth=half-.02,leafHeight=height-.04,leafY=height/2,travel=half;
 const stateColor=open?0x94d7c6:0xe2c78b;
 for(const side of[-1,1]){
  const centerX=side*(leafWidth/2+(open?travel:0)),handleX=centerX-side*.48;
  builder.add('shell','habitat-door-white-reinforced-leaf',leafGeometry(leafWidth,leafHeight,.18),[centerX,leafY,centerZ],[0,0,0],0xf2f4f1);
  builder.add('interior','habitat-door-dark-interior-face',innerFaceGeometry(leafWidth-.025,leafHeight-.025),[centerX,leafY,centerZ-.110],[0,Math.PI,0],0x263641);
  face(builder,'metal','habitat-door-navy-outer-spine',centerX+side*.49,leafY,centerZ+.096,.055,2.18,0x29495c);
  face(builder,'metal','habitat-door-lower-armor-accent',centerX,.42,centerZ+.096,.79,.12,0x3b5260);
  const seamX=centerX-side*(leafWidth/2-.007);
  face(builder,'metal','habitat-door-outer-meeting-seal',seamX,leafY,centerZ+.097,.014,2.40,0x233e50);
  face(builder,'metal','habitat-door-inner-meeting-seal',seamX,leafY,centerZ-.112,.014,2.40,0x182c38,true);
  for(const inside of[false,true]){
   const faceZ=inside?centerZ-.113:centerZ+.098;
   face(builder,'metal','habitat-door-handle-recess',handleX,leafY,faceZ,.12,.34,inside?0x46585e:0x576970,inside);
   builder.box('metal','habitat-door-raised-grab-handle',[handleX,leafY,inside?centerZ-.131:centerZ+.116],[.045,.25,.040],0xa1adb0);
  }
  // Fixed controls remain accessible on either face after the leaves retract.
  for(const inside of[false,true]){
   const x=side*(half+.31),z=centerZ+(inside?-.26:.135);
   builder.box('metal','habitat-door-fixed-control-housing',[x,1.42,z],[.18,.30,.05],0x344d5b);
   face(builder,'interior','habitat-door-state-control',x,1.45,z+(inside?-.027:.027),.105,.105,stateColor,inside);
  }
 }
 return{doorOpen:open,workingDoor:true,slidingLeaves:2,leafTravelMeters:travel};
}
