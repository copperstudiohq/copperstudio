import {CaveBarnacleRenderer} from './cave-barnacle-renderer.js';
import {createSaltPlantGeometry,saltCavePlantSites} from './salt-cave-plants.js';
import {SaltCaveSeepRenderer} from './salt-cave-seep-renderer.js';
import {SALT_CAVE_SEEPS} from './salt-cave-seeps.js';
import {buildShellFieldTexturePixels,createShellFieldNormalTexture} from './shell-field-texture.js';
import * as THREE from './vendor/three.module.js';
import {SALT_CAVE,SALT_CAVE_SHAFT,SALT_CAVE_HALLS,saltCaveStation,saltCaveSection} from './salt-cave.js';
import {createSaltCaveGeometry} from './salt-cave-geometry.js';
import {createSaltCaveDetailsGeometry} from './salt-cave-details.js';
import {getSulfuricGround} from './sulfuric-biome.js';
import {matchEntranceRock} from './entrance-rock-surface.js';
import {createSaltCrystalGeometry} from './salt-crystal-geometry.js';
import {createSaltCrystalSurface} from './salt-crystal-surface.js';

/** Halite grows in stepped cubic clusters, rather than sulfur's pointed cones.
 * Mineral deposits, sparse withered plants and geothermal seeps share batches. */
export class SaltCaveRenderer{
 constructor(materials,cliffSurface={}){
  this.group=new THREE.Group();this.group.name='salt-cave-connected-biome';this.disposed=false;
  const {geometry,shaft}=createSaltCaveGeometry(getSulfuricGround);
  const halite=createSaltCrystalGeometry();
  this.geometries=[geometry,shaft,halite];
  const colorTexture=new THREE.DataTexture(buildShellFieldTexturePixels(128),128,128,THREE.RGBAFormat);
  const atlas=createShellFieldNormalTexture(),normalPixels=new Uint8Array(128*128*4);
  for(let row=0;row<128;row++)normalPixels.set(atlas.image.data.subarray(row*256*4,row*256*4+128*4),row*128*4);
  atlas.dispose();const normalTexture=new THREE.DataTexture(normalPixels,128,128,THREE.RGBAFormat);
  colorTexture.colorSpace=THREE.SRGBColorSpace;
  this.textures=[colorTexture,normalTexture];
  for(const texture of this.textures){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=2;texture.needsUpdate=true;}
  const salt=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.87,side:THREE.DoubleSide,map:colorTexture,normalMap:normalTexture,normalScale:new THREE.Vector2(.55,.55)});
  salt.forceSinglePass=true;
  salt.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 saltDepositPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsaltDepositPosition=position;');
   shader.fragmentShader='varying vec3 saltDepositPosition;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec3 rock=saltDepositPosition;
    float scorched=smoothstep(.12,.86,sin(rock.x*.19+sin(rock.z*.23))*sin(rock.y*.53+rock.z*.15));
    float sulfur=smoothstep(.53,.91,.5+.5*sin(rock.x*.36+rock.z*.22+sin(rock.y*1.1)*1.7));
    diffuseColor.rgb*=vec3(.72,.66,.48);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.07,.085,.055),scorched*.8);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.54,.38,.065),sulfur*.67);`);
  };salt.customProgramCacheKey=()=> 'salt-cave-sulfur-scars-v1';
  const shaftMaterial=salt.clone();shaftMaterial.vertexColors=false;
  shaftMaterial.onBeforeCompile=salt.onBeforeCompile;shaftMaterial.customProgramCacheKey=salt.customProgramCacheKey;
  const {material:crystal,textures:crystalTextures}=createSaltCrystalSurface();
  crystal.vertexColors=Boolean(halite.attributes.color);this.textures.push(...crystalTextures);
  this.materials=[salt,shaftMaterial,crystal];this.instances=[];this.time={value:0};
  const shell=new THREE.Mesh(geometry,salt);shell.name='salt-cavern-continuous-floor-walls-roof';this.group.add(shell);
  const throat=new THREE.Mesh(shaft,shaftMaterial);throat.name='salt-geyser-open-shaft';this.group.add(throat);
  const detailGeometry=createSaltCaveDetailsGeometry(),detailMaterial=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.88,normalMap:normalTexture,normalScale:new THREE.Vector2(.35,.35),side:THREE.DoubleSide});
  matchEntranceRock(detailMaterial,detailGeometry,materials?.rock,cliffSurface,detailGeometry.userData.mouthVertexCount);
  detailMaterial.userData.waterMediumEntranceZ=-11298/25;
  detailMaterial.forceSinglePass=true;this.geometries.push(detailGeometry);this.materials.push(detailMaterial);
  const details=new THREE.Mesh(detailGeometry,detailMaterial);details.name='salt-cave-layered-entrances-and-mineral-seams';this.group.add(details);
  const poses=[],pose=new THREE.Object3D(),growth=new THREE.Vector3();
  const cube=(x,y,size,angle,stretch=1,surface='floor',wallHeight=0)=>{
   const height=size*stretch,q=saltCaveSection(x,y),hanging=surface==='ceiling';
   if(surface!=='surface'&&(!q||q.clearance<1||(hanging&&!Number.isFinite(q.ceiling))))return;
   pose.rotation.set(.12*Math.sin(angle*3),angle,.13*Math.cos(angle*2));pose.scale.set(size,height*2,size*.82);
   if(surface==='wall'){
    const station=saltCaveStation(y),side=x<station.x?-1:1,wallX=station.x+side*station.width,wall=saltCaveSection(wallX,y);
    // Embed the side of the prism in the entrance wall rather than suspending it.
    pose.position.set(wallX/25-side*size*.15,(wall.floor+wallHeight)/25,y/25);
   }else{
    const z=surface==='surface'?getSulfuricGround(x,y):hanging?q.roof:q.floor;
    if(!Number.isFinite(z))return;
    // Seat each root in the actual surface at its own final coordinates. Offsets
    // from a neighboring cluster sample left smaller pieces hanging in the water.
    pose.position.set(x/25,z/25+(hanging ? 0.12 : -0.12),y/25);
    growth.set(0,height*(hanging?-1:1),0).applyQuaternion(pose.quaternion);pose.position.add(growth);
   }
   pose.updateMatrix();poses.push(pose.matrix.clone());
  };
  for(let i=0;i<70;i++){
   const y=-11315-i*36.3,s=saltCaveStation(y),side=i%2?1:-1,x=s.x+side*s.width*(.81+.045*Math.sin(i*2.2));
   for(let j=0;j<5;j++){
    const size=.28+(i%5)*.13+j*.085,px=x+Math.sin(j*2.4+i)*18,py=y+Math.cos(j*1.8)*16;
    cube(px,py,size,i*.71+j*.2,1+(j%3)*.55);
   }
   if(i%2===0)for(let j=0;j<3;j++)cube(x-side*20+j*8,y+j*12,.34+(i%4)*.18,i+j,1.6,'ceiling');
  }
  // Salt around both mouths makes the entrances recognizable from outside.
  for(let i=0;i<24;i++){
   const a=i/24*Math.PI*2,x=SALT_CAVE_SHAFT.x+Math.cos(a)*101,y=SALT_CAVE_SHAFT.y+Math.sin(a)*101;
   cube(x,y,.44+(i%4)*.18,a,1.3,'surface');
  }
  for(let i=0;i<18;i++){
   if(i%3===1)continue;
   const side=i<9?-1:1,y=-11308-(i%9)*17+Math.sin(i*2.2)*7;
   cube(5150+side*118,y,.34+(i%4)*.10,i,1.45,'wall',38+(i%3)*85);
  }
  for(const hall of SALT_CAVE_HALLS)for(let i=1;i<hall.length;i++){
   const a=hall[i-1],b=hall[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/length,ny=(b[0]-a[0])/length;
   for(let j=0;j<5;j++){
    const t=(j+.25)/5,side=j%2?1:-1,x=a[0]+(b[0]-a[0])*t+nx*side*125,y=a[1]+(b[1]-a[1])*t+ny*side*125,q=saltCaveSection(x,y);
    if(!q||q.clearance<8)continue;
    for(let k=0;k<5;k++)cube(x+Math.sin(k+j)*20,y+Math.cos(k*2)*18,.35+(j%3)*.28+k*.1,j*.16+k*.08,1.4+(k%3)*.6);
   }
  }
  this.crystals=new THREE.InstancedMesh(this.geometries[2],crystal,poses.length);this.crystals.name='salt-halite-cubic-crystal-clusters';
  poses.forEach((matrix,i)=>{this.crystals.setMatrixAt(i,matrix);this.crystals.setColorAt(i,new THREE.Color([0xfff5e0,0xf1e4cf,0xe9dec9,0xc9c8be][i%4]));});this.crystals.instanceMatrix.needsUpdate=true;this.crystals.computeBoundingSphere();this.group.add(this.crystals);this.instances.push(this.crystals);
  const plantMaterial=new THREE.MeshStandardMaterial({color:0x95854f,vertexColors:true,roughness:.9,side:THREE.DoubleSide});plantMaterial.forceSinglePass=true;
  plantMaterial.onBeforeCompile=shader=>{
   shader.uniforms.saltPlantTime=this.time;
   shader.vertexShader='uniform float saltPlantTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    float wave=sin(saltPlantTime*.7+instanceMatrix[3].x*.17+instanceMatrix[3].z*.1);
    transformed.y*=.68;transformed.x+=(.17+wave*.025)*pow(clamp(position.y,0.,1.5),2.);`);
  };plantMaterial.customProgramCacheKey=()=> 'salt-cave-withered-plants-v1';this.materials.push(plantMaterial);
  const sites=saltCavePlantSites().filter((p,i)=>i%5===0&&!SALT_CAVE_SEEPS.some(seep=>Math.hypot(p.x-seep.x,p.y-seep.y)<seep.radius+15));this.plantSites=sites;
  for(let kind=0;kind<4;kind++){
   const geometry=createSaltPlantGeometry(kind);this.geometries.push(geometry);const plants=sites.filter(p=>p.kind===kind),batch=new THREE.InstancedMesh(geometry,plantMaterial,plants.length);batch.name=['yellow-ribbon-kelp','yellow-cave-fans','yellow-cup-stalks','yellow-anemones'][kind];
   plants.forEach((p,i)=>{pose.position.set(p.x/25,p.z/25,p.y/25);pose.rotation.set(0,p.angle,0);pose.scale.setScalar(p.scale);pose.updateMatrix();batch.setMatrixAt(i,pose.matrix);});batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();this.group.add(batch);this.instances.push(batch);
  }
  this.seeps=new SaltCaveSeepRenderer();this.group.add(this.seeps.group);
  this.barnacles=new CaveBarnacleRenderer(materials);this.group.add(this.barnacles.group);
  for(const material of [...this.materials,...this.seeps.materials])material.userData.waterMedium='sulfuric';
 }
 update(camera,time=0,reducedMotion=false){
  if(this.disposed)return;
  this.time.value=reducedMotion?0:time;
  this.seeps.update(time,reducedMotion);
  this.barnacles.update(time,reducedMotion);
  this.group.visible=Math.abs(camera.x*25-5200)<2400&&camera.z*25<SALT_CAVE.mouthY+2000&&camera.z*25>SALT_CAVE.endY-1600;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.barnacles.dispose();this.seeps.dispose();this.instances.forEach(mesh=>mesh.dispose());this.textures.forEach(t=>t.dispose());this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.group.removeFromParent();this.group.clear();
 }
}
