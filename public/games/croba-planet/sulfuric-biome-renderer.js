import {carveSaltGeyserShaft} from './salt-cave-geometry.js';
import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {SULFURIC_LAND as LAND,SULFURIC_PASSAGE,getSulfuricGround,createSulfuricTerrainData} from './sulfuric-biome.js';
import {SULFURIC_VENTS} from './sulfuric-biome-data.js';
import {createSulfuricTunnelGeometry} from './sulfuric-passage-geometry.js';
import {createBackgroundSmokeTexture} from './background-smoke-texture.js';
import {SulfuricGeyserRenderer} from './sulfuric-geyser-renderer.js';
import {SulfuricPondRenderer} from './sulfuric-pond-renderer.js';
import {matchEntranceRock} from './entrance-rock-surface.js';

/** Fixed terrain and bounded mineral/vent batches, identical on every device. */
export class SulfuricBiomeRenderer{
  constructor(materials,cliffSurface={}){
    this.group=new THREE.Group();this.group.name='sulfuric-land';this.disposed=false;this.time={value:0};
    this.geometries=[];this.materials=[];this.instances=[];this.texture=createBackgroundSmokeTexture(128);
    const ownMaterial=m=>{this.materials.push(m);return m;},ownGeometry=g=>{this.geometries.push(g);return g;};
    const stone=ownMaterial(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94,normalMap:materials?.rock?.normalMap??null,normalScale:new THREE.Vector2(.6,.6)}));
    const dark=ownMaterial(new THREE.MeshStandardMaterial({color:0x555548,roughness:.91,normalMap:materials?.rock?.normalMap??null}));
    const sulfur=ownMaterial(new THREE.MeshStandardMaterial({color:0xe1bf32,roughness:.66,emissive:0x58421a,emissiveIntensity:.12}));
    const data=createSulfuricTerrainData(),terrain=new THREE.BufferGeometry();
    terrain.setAttribute('position',new THREE.BufferAttribute(data.positions,3));terrain.setIndex(new THREE.BufferAttribute(data.indices,1));
    const colors=new Float32Array(data.positions.length),tint=new THREE.Color();
    for(let i=0;i<data.positions.length/3;i++){
      const x=data.positions[i*3]*25,y=data.positions[i*3+2]*25,z=data.positions[i*3+1]*25;
      const vein=.5+.5*Math.sin(x/130+Math.sin(y/180)*2.3),basalt=THREE.MathUtils.smoothstep(vein,.64,.86);
      tint.setHex(0xc8af43).lerp(new THREE.Color(0xca824e),basalt*.93).multiplyScalar(.86+.10*Math.sin(x/38)*Math.cos(y/43)+Math.min(.2,z/1800));
      colors.set(tint.toArray(),i*3);
    }
    terrain.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const uv=new Float32Array(data.positions.length/3*2);for(let i=0;i<data.positions.length/3;i++){uv[i*2]=data.positions[i*3]/4;uv[i*2+1]=data.positions[i*3+2]/4;}
    terrain.setAttribute('uv',new THREE.BufferAttribute(uv,2));terrain.computeVertexNormals();terrain.computeBoundingSphere();
    const ground=new THREE.Mesh(ownGeometry(carveSaltGeyserShaft(terrain)),stone);ground.name='sulfuric-authored-ground';this.group.add(ground);
    const rim=new PlantMesh();
    const edges=[[[LAND.minX,LAND.minY],[LAND.maxX,LAND.minY]],[[LAND.minX,LAND.minY],[LAND.minX,LAND.maxY]],
      [[LAND.maxX,LAND.minY],[LAND.maxX,LAND.maxY]],[[LAND.minX,LAND.maxY],[5950,LAND.maxY]],[[6250,LAND.maxY],[LAND.maxX,LAND.maxY]]];
    for(const [a,b]of edges){
      const count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/75);
      rim.grid(2,count,(u,v)=>{const x=a[0]+(b[0]-a[0])*v,y=a[1]+(b[1]-a[1])*v,z=getSulfuricGround(x,y);
        return new THREE.Vector3(x/25,(z+u*(175+55*Math.sin(v*count*2.1)))/25,y/25);},0x77734a);
    }
    const rimMaterial=ownMaterial(stone.clone());rimMaterial.side=THREE.DoubleSide;
    this.group.add(new THREE.Mesh(ownGeometry(rim.geometry({normalizeHeight:false})),rimMaterial));
    const tunnelMaterial=ownMaterial(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94,map:materials?.rock?.map??null,normalMap:materials?.rock?.normalMap??null,normalScale:new THREE.Vector2(.65,.65),side:THREE.DoubleSide}));
    tunnelMaterial.forceSinglePass=true;
    const tunnelGeometry=ownGeometry(createSulfuricTunnelGeometry());matchEntranceRock(tunnelMaterial,tunnelGeometry,materials?.rock,cliffSurface);
    const tunnel=new THREE.Mesh(tunnelGeometry,tunnelMaterial);tunnel.name='shell-field-sulfur-arch';this.group.add(tunnel);
    const transform=new THREE.Object3D();
    const batch=(geometry,material,count,name)=>{const mesh=new THREE.InstancedMesh(ownGeometry(geometry),material,count);mesh.name=name;this.instances.push(mesh);this.group.add(mesh);return mesh;};
    const chimneys=batch(new THREE.CylinderGeometry(.48,1.2,1,10,2),dark,SULFURIC_VENTS.length,'sulfuric-fumarole-chimneys');
    const crystals=batch(new THREE.ConeGeometry(.25,1,5),sulfur,SULFURIC_VENTS.length*6,'sulfur-crystal-outcrops');
    let crystal=0;
    SULFURIC_VENTS.forEach(([x,y,size],i)=>{
      const z=getSulfuricGround(x,y);transform.position.set(x/25,z/25+size,y/25);transform.scale.set(size,size*2,size);transform.rotation.set(0,i*.8,.08*Math.sin(i));transform.updateMatrix();chimneys.setMatrixAt(i,transform.matrix);
      for(let j=0;j<6;j++){
        const angle=j/6*Math.PI*2+i,px=x+Math.cos(angle)*40*size,py=y+Math.sin(angle)*40*size,h=.55+(j%3)*.38;
        transform.position.set(px/25,getSulfuricGround(px,py)/25+h/2,py/25);transform.scale.set(1,h,1);transform.rotation.set(.15*Math.cos(angle),angle,.18*Math.sin(angle));transform.updateMatrix();crystals.setMatrixAt(crystal++,transform.matrix);
      }
    });
    this.ponds=new SulfuricPondRenderer(materials);this.group.add(this.ponds.group);
    const steamMaterial=ownMaterial(new THREE.MeshBasicMaterial({color:0xeee3b0,map:this.texture,transparent:true,opacity:.40,depthWrite:false,side:THREE.DoubleSide}));
    steamMaterial.forceSinglePass=true;
    steamMaterial.onBeforeCompile=shader=>{
      shader.uniforms.sulfurTime=this.time;
      shader.vertexShader=`uniform float sulfurTime;varying float sulfurFade;\n${shader.vertexShader}`.replace('#include <project_vertex>',`
        vec4 puff=instanceMatrix*vec4(0.,0.,0.,1.);float seed=puff.x*.13+puff.z*.19+puff.y*.37;
        float cycle=fract(sulfurTime*.065+seed);sulfurFade=sin(cycle*3.14159);
        puff.y+=cycle*4.;puff.x+=sin(sulfurTime*.17+seed)*.6;
        vec4 mvPosition=modelViewMatrix*puff;
        mvPosition.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz))*(.65+cycle*.55);
        gl_Position=projectionMatrix*mvPosition;`);
      shader.fragmentShader=`varying float sulfurFade;\n${shader.fragmentShader}`.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=sulfurFade;');
    };
    steamMaterial.customProgramCacheKey=()=> 'sulfuric-soft-steam-v1';
    const steam=batch(new THREE.PlaneGeometry(1,1),steamMaterial,SULFURIC_VENTS.length*5,'sulfuric-steam');steam.frustumCulled=false;
    SULFURIC_VENTS.forEach(([x,y,size],i)=>{for(let j=0;j<5;j++){
      transform.position.set(x/25+.3*Math.sin(j*2+i),(getSulfuricGround(x,y)/25)+size*2+j*1.2,y/25+.3*Math.cos(j+i));
      transform.rotation.set(0,0,0);transform.scale.set((1.5+j*.55)*size,(2+j*.7)*size,1);transform.updateMatrix();steam.setMatrixAt(i*5+j,transform.matrix);
    }});
    for(const mesh of this.instances){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
    this.geysers=new SulfuricGeyserRenderer();this.group.add(this.geysers.group);
  }
  update(camera,time,reducedMotion=false,simulationTime=time){
    if(this.disposed)return;
    const x=camera.x*25,y=camera.z*25,dx=Math.max(LAND.minX-x,0,x-LAND.maxX),dy=Math.max(LAND.minY-y,0,y-SULFURIC_PASSAGE.frontY);
    this.group.visible=Math.hypot(dx,dy)<5000;this.time.value=reducedMotion?0:time;
    this.ponds.update(simulationTime,reducedMotion);
    this.geysers.update(simulationTime,reducedMotion);
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;this.instances.forEach(m=>m.dispose());this.geometries.forEach(g=>g.dispose());
    this.materials.forEach(m=>m.dispose());this.texture.dispose();this.geysers.dispose();this.ponds.dispose();this.group.removeFromParent();this.group.clear();
  }
}
