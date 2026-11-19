import{COPPER_CARGO_SITE}from'./copper-yoyo.js';
import*as THREE from'./vendor/three.module.js';
import{PlantMesh}from'./plant-mesh.js';
import{createCrobonBirdSkeletonGeometry,createIceCentipedeRemainsGeometry}from'./basin-remains-anatomy.js';
import{createOldCargoGeometry,OLD_CARGO_KINDS}from'./old-cargo-anatomy.js';
import{BASIN_REMAINS,OLD_CARGO_SITES,BASIN_SNOW_DRIFTS,BASIN_TORCHES}from'./basin-life-data.js';
import{getIceSurfaceHeight}from'./ice-surface.js';
import{getSeabedHeight}from'./seabed.js';
const UP=new THREE.Vector3(0,1,0),v=(x,y,z)=>new THREE.Vector3(x,y,z);
function snowGeometry(){
 const mesh=new PlantMesh();mesh.grid(10,20,(u,t)=>{
  const a=t*Math.PI*2,r=Math.sin(u*Math.PI/2),edge=1+.07*Math.sin(a*3)+.04*Math.sin(a*7);
  return v(Math.cos(a)*r*edge,Math.cos(u*Math.PI/2)**1.4,Math.sin(a)*r*edge);
 },(u,t)=>new THREE.Color(0xf4f8fc).multiplyScalar(.94+.06*Math.sin(t*17+u*5)**2).getHex(),0,false);
 return mesh.geometry({normalizeHeight:false});
}
function wallHeaterGeometry(){
 const mesh=new PlantMesh();
 mesh.grid(2,8,(u,t)=>v(Math.cos(t*Math.PI*2)*.15,Math.sin(t*Math.PI*2)*.22,-.25+u*.035),0x39434b);
 mesh.tube([v(0,-.23,-.22),v(0,-.23,.19),v(0,-.12,.19)],[.035,.035,.035],0x46515a,8);
 // Tapered metal body, pale orange chamber and capped rim match the warmth
 // beacons outside, scaled to a compact wall fixture instead of a burning stick.
 mesh.tube([v(0,-.27,.19),v(0,-.20,.19),v(0,.13,.19)],[.14,.13,.07],0x536d78,8);
 for(const y of[-.23,.10,.45])mesh.tube([v(0,y,.19),v(0,y+.035,.19)],[y===.45?.115:.10,y===.45?.115:.10],0x82969c,8);
 for(const side of[-1,1])mesh.tube([v(side*.078,.11,.19),v(side*.078,.45,.19)],[.014,.014],0x34454f,5);
 const geometry=mesh.geometry({normalizeHeight:false});geometry.userData.warmthBeaconStyle=true;return geometry;
}
function heaterGlowGeometry(){
 const mesh=new PlantMesh();mesh.tube([v(0,.135,.19),v(0,.45,.19)],[.077,.077],0xffd1a1,10);
 const geometry=mesh.geometry({normalizeHeight:false});geometry.userData.warmthBeaconStyle=true;return geometry;
}

/** Shared scenery prototypes: remains, earlier cargo, snow banks and wall
 * torches. Detail is culled by distance; no added lights or shadow passes. */
export class BasinDetailsRenderer{
 constructor(world,materials={}){
  this.group=new THREE.Group();this.group.name='traces-of-earlier-croba-visitors';this.batches=[];this.disposed=false;this.clock={value:0};
  this.materials={chitin:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94}),bone:new THREE.MeshStandardMaterial({color:0x9a9078,vertexColors:true,roughness:.92}),cargo:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.82,metalness:.24}),snow:materials.snow?.clone()??new THREE.MeshStandardMaterial({vertexColors:true,color:0xf3f7ff,roughness:.95}),torch:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}),flame:new THREE.MeshBasicMaterial({vertexColors:true,color:0xffffff,side:THREE.DoubleSide,toneMapped:false})};
  this.materials.bone.userData.waterLevel=-135/25;this.materials.snow.userData.waterLevel=-135/25;this.materials.snow.vertexColors=true;
  this.materials.flame.onBeforeCompile=shader=>{shader.uniforms.visitorTorchTime=this.clock;shader.fragmentShader='uniform float visitorTorchTime;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=.97+.03*sin(visitorTorchTime*1.6);');};this.materials.flame.customProgramCacheKey=()=> 'croba-wall-warmth-chamber-v1';
  const bird=createCrobonBirdSkeletonGeometry();bird.rotateZ(1.48);bird.computeBoundingBox();bird.translate(0,-bird.boundingBox.min.y,0);
  this.add(world,'bird-skeleton',bird,this.materials.bone,BASIN_REMAINS.filter(p=>p.kind==='bird'),38);
  this.add(world,'ice-centipede-remains',createIceCentipedeRemainsGeometry(),this.materials.chitin,BASIN_REMAINS.filter(p=>p.kind==='centipede'),52);
  for(const kind of OLD_CARGO_KINDS)this.add(world,`old-cargo-${kind}`,createOldCargoGeometry(kind),this.materials.cargo,OLD_CARGO_SITES.filter(p=>p.kind===kind&&p.id!==COPPER_CARGO_SITE.sourceId),70);
  this.add(world,'snow-wall-drifts',snowGeometry(),this.materials.snow,BASIN_SNOW_DRIFTS,60,true);
  this.add(world,'earlier-visitor-wall-heaters',wallHeaterGeometry(),this.materials.torch,BASIN_TORCHES,35);
  this.add(world,'wall-heater-warmth-chambers',heaterGlowGeometry(),this.materials.flame,BASIN_TORCHES,35);
 }
 add(world,name,geometry,material,sites,range,snow=false){
  const entries=sites.map(p=>{
   if(![p.x,p.y,p.z,p.yaw??0].every(Number.isFinite))throw new TypeError(`Invalid visitor scenery: ${p.id}`);
   const pose=new THREE.Object3D();pose.position.set(p.x/25,(p.z+(!snow ? .7 : 0))/25,p.y/25);
   let normal=UP;
   if(p.habitat==='land'||p.habitat==='ocean'){
    const ice=world.platforms.find(ice=>ice.id===p.platformId),height=(x,y)=>ice?getIceSurfaceHeight(ice,x,y):getSeabedHeight(x,y);
    normal=v(-(height(p.x+15,p.y)-height(p.x-15,p.y))/30,1,-(height(p.x,p.y+15)-height(p.x,p.y-15))/30).normalize();
   }
   pose.quaternion.setFromUnitVectors(UP,normal).multiply(new THREE.Quaternion().setFromAxisAngle(UP,Math.PI/2-(p.yaw??0)));
   if(snow)pose.scale.set(p.width/25,p.height/25,p.length/25);else pose.scale.setScalar(p.scale??1);
   pose.updateMatrix();return{id:p.id,position:pose.position.clone(),matrix:pose.matrix.clone()};
  });
  const mesh=new THREE.InstancedMesh(geometry,material,entries.length);mesh.name=name;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.group.add(mesh);this.batches.push({mesh,geometry,entries,range,key:null});
 }
 update(camera,time=0,reducedMotion=false){
  if(this.disposed)return;this.clock.value=reducedMotion?0:time;
  for(const batch of this.batches){const visible=batch.entries.filter(p=>p.position.distanceToSquared(camera)<batch.range**2),key=visible.map(p=>p.id).join('|');if(key===batch.key)continue;batch.key=key;
   visible.forEach((p,i)=>batch.mesh.setMatrixAt(i,p.matrix));batch.mesh.count=visible.length;batch.mesh.visible=visible.length>0;batch.mesh.instanceMatrix.needsUpdate=true;if(visible.length)batch.mesh.computeBoundingSphere();
  }
 }
 dispose(){if(this.disposed)return;this.disposed=true;for(const b of this.batches){b.mesh.dispose();b.geometry.dispose();}Object.values(this.materials).forEach(m=>m.dispose());this.group.removeFromParent();this.group.clear();}
}
