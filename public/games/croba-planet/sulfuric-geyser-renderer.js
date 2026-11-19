import * as THREE from './vendor/three.module.js';
import {SULFURIC_POOLS} from './sulfuric-biome-data.js';
import {SULFURIC_POND_LEVEL} from './sulfuric-pond-profile.js';
import {createBackgroundSmokeTexture} from './background-smoke-texture.js';

/** Shared jets, surface rings, ballistic spray, boiling bubbles and soft mist.
 * Only two uniforms change per frame; no CPU particles, lights or post effects. */
export class SulfuricGeyserRenderer{
  constructor(){
    this.group=new THREE.Group();this.group.name='geyser-pond-eruptions';this.disposed=false;
    this.time={value:0};this.motion={value:1};this.geometries=[];this.materials=[];this.meshes=[];
    this.texture=createBackgroundSmokeTexture(64);
    // Condensed water is white; retain the smoke sprite's irregular density only.
    for(let i=0;i<this.texture.image.data.length;i+=4)this.texture.image.data.fill(255,i,i+3);
    this.texture.name='soft-white-geyser-mist';
    const transform=new THREE.Object3D();
    const build=(kind,geometry,count,color,opacity)=>{
      const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide});material.forceSinglePass=true;
      if(kind==='mist')material.map=this.texture;
      const slots=new Float32Array(count),seeds=new Float32Array(count);
      geometry.setAttribute('geyserSlot',new THREE.InstancedBufferAttribute(slots,1));
      geometry.setAttribute('geyserSeed',new THREE.InstancedBufferAttribute(seeds,1));
      material.onBeforeCompile=shader=>{
        shader.uniforms.geyserTime=this.time;shader.uniforms.geyserMotion=this.motion;
        shader.vertexShader=`uniform float geyserTime,geyserMotion;attribute float geyserSlot,geyserSeed;varying float geyserAlpha;varying vec3 geyserLocal;
          float eruption(float slot){float t=mod(geyserTime+mod(slot,3.)*8.,24.);return smoothstep(2.,3.,t)*(1.-smoothstep(6.,7.5,t));}\n${shader.vertexShader}`
          .replace('#include <begin_vertex>',`#include <begin_vertex>
            float clock=geyserTime*geyserMotion,power=eruption(geyserSlot),height=8.5+mod(geyserSlot,3.)*1.5;
            geyserLocal=position;
            ${kind==='column'?`float h=position.y,angle=geyserSeed*6.28318;
              float pulse=.88+.12*sin(clock*6.5+geyserSeed*21.);
              float width=(.09+.10*geyserSeed)*(1.-h*.65)*(1.+.20*sin(h*31.-clock*10.+angle));
              transformed.xz*=width;
              transformed.y=h*power*mix(.8,height*(.62+.38*geyserSeed)*pulse,geyserMotion);
              transformed.xz+=vec2(cos(angle),sin(angle))*(.13+h*h*.50*geyserMotion);
              transformed.xz+=vec2(sin(h*17.-clock*5.+angle),cos(h*21.-clock*6.+angle))*.11*h*geyserMotion;
              geyserAlpha=power*(1.-smoothstep(.65,1.,h));`
            :kind==='foam'?`float ring=fract(geyserTime*.32*geyserMotion+geyserSeed);
              transformed.xz*=.30+ring*2.8;transformed.y+=.012*sin(ring*24.);
              geyserAlpha=(1.-ring)*(.20+.8*power);`
            :kind==='spray'?`float flight=fract(clock*(.36+geyserSeed*.08)+geyserSeed);
              float angle=geyserSeed*94.2478;
              transformed*=.6+geyserSeed*.9;transformed.y*=1.5;
              transformed+=vec3(cos(angle)*flight*(.8+geyserSeed*3.4),4.*flight*(1.-flight)*height*(.50+geyserSeed*.50),sin(angle)*flight*(.8+geyserSeed*3.4))*power;
              geyserAlpha=power*sin(flight*3.14159)*geyserMotion;`
            :kind==='bubbles'?`float phase=mod(geyserTime+mod(geyserSlot,3.)*8.,24.);
              float warning=1.-smoothstep(1.5,2.5,phase),boil=.2+.8*max(warning,power)*geyserMotion;
              float life=fract(clock*(.65+geyserSeed*.25)+geyserSeed);
              float angle=geyserSeed*69.115,radial=.25+geyserSeed*1.3;
              transformed*=sin(life*3.14159)*(.6+boil*.6);transformed.y*=.55;
              transformed+=vec3(cos(angle)*radial,.018+life*.08,sin(angle)*radial);
              geyserAlpha=sin(life*3.14159)*(.25+boil*.55);`
            :`geyserAlpha=1.;`}`);
        if(kind==='mist')shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
          float lift=fract(clock*.12+geyserSeed),angle=geyserSeed*75.398;
          vec4 puff=instanceMatrix*vec4(0.,0.,0.,1.);
          puff.x+=cos(angle)*(.4+lift*2.4)+lift*1.4;
          puff.z+=sin(angle)*(.4+lift*1.8);
          puff.y+=.25+lift*mix(.9,3.5,power*geyserMotion);
          vec4 mvPosition=modelViewMatrix*puff;
          mvPosition.xy+=position.xy*(1.1+lift*2.5+power*1.3*geyserMotion);
          geyserAlpha=sin(lift*3.14159)*(.25+.5*power*geyserMotion);
          gl_Position=projectionMatrix*mvPosition;`);
        shader.fragmentShader=`varying float geyserAlpha;varying vec3 geyserLocal;\n${shader.fragmentShader}`
          .replace('#include <color_fragment>',`#include <color_fragment>
            diffuseColor.a*=geyserAlpha;
            ${kind==='column'?'diffuseColor.a*=.45+.55*smoothstep(-.6,.6,sin(geyserLocal.y*84.+geyserLocal.x*31.));':''}
            ${kind==='foam'?'diffuseColor.a*=.4+.6*smoothstep(-.4,.4,sin(geyserLocal.x*11.+geyserLocal.z*15.));':''}`);
      };
      material.customProgramCacheKey=()=>`sulfur-geyser-${kind}-v2`;
      const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.name=`geyser-${kind}`;
      const perPond=count/SULFURIC_POOLS.length;
      for(let i=0;i<count;i++){
        const slot=Math.floor(i/perPond),[x,y]=SULFURIC_POOLS[slot];slots[i]=slot;seeds[i]=(i%perPond)/perPond;
        transform.position.set(x/25,SULFURIC_POND_LEVEL/25+.018,y/25);transform.rotation.set(0,0,0);transform.scale.set(1,1,1);
        transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius+=14;
      this.group.add(mesh);this.meshes.push(mesh);this.geometries.push(geometry);this.materials.push(material);
    };
    const ponds=SULFURIC_POOLS.length;
    build('column',new THREE.CylinderGeometry(1,1,1,6,18,true).translate(0,.5,0),ponds*7,0xeaf9f3,.82);
    build('foam',new THREE.TorusGeometry(1,.018,4,40).rotateX(-Math.PI/2),ponds*6,0xf2f4dc,.58);
    build('spray',new THREE.SphereGeometry(.035,6,4),ponds*48,0xf3faf4,.83);
    build('bubbles',new THREE.SphereGeometry(.08,8,4),ponds*18,0xe6f0cf,.52);
    build('mist',new THREE.PlaneGeometry(1,1),ponds*8,0xfff9e8,.36);
  }
  update(time,reducedMotion=false){if(this.disposed)return;this.time.value=Number.isFinite(time)?Math.max(0,time):0;this.motion.value=reducedMotion?0:1;}
  dispose(){
    if(this.disposed)return;this.disposed=true;this.meshes.forEach(m=>m.dispose());this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.texture.dispose();this.group.removeFromParent();this.group.clear();
  }
}
