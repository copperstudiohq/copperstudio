import * as THREE from './vendor/three.module.js';
import {PlantMesh} from './plant-mesh.js';
import {SULFURIC_POOLS} from './sulfuric-biome-data.js';
import {getSulfuricGround} from './sulfuric-biome.js';
import {SULFURIC_POND_LEVEL,SULFURIC_POND_ASPECT,sulfuricPondRadius} from './sulfuric-pond-profile.js';
import {SALT_CAVE_SHAFT} from './salt-cave.js';

const TAU=Math.PI*2;

/** Two shared draws for all three scalloped mineral rims and water surfaces. */
export class SulfuricPondRenderer{
  constructor(materials){
    this.group=new THREE.Group();this.group.name='sulfuric-mineral-basins';this.disposed=false;this.time={value:0};
    const crust=new PlantMesh(),water=new PlantMesh(),tint=new THREE.Color(),other=new THREE.Color();
    const radii=[.96,1,1.045,1.10,1.18,1.28,1.44,1.65],lip=[.005,.06,.15,.23,.15,.06,.035,.035];
    const sample=(values,u)=>{
      const t=u*(values.length-1),i=Math.min(values.length-2,Math.floor(t));return THREE.MathUtils.lerp(values[i],values[i+1],t-i);
    };
    SULFURIC_POOLS.forEach(([x,y,r],index)=>{
      const caveEntrance=index===SALT_CAVE_SHAFT.poolIndex;
      const point=(q,angle,height)=>{
        const radial=q*sulfuricPondRadius(angle,index)*r;
        return new THREE.Vector3((x+Math.cos(angle)*radial)/25,height,(y+Math.sin(angle)*radial*SULFURIC_POND_ASPECT)/25);
      };
      crust.grid(28,96,(u,v)=>{
        const q=sample(radii,u),height=sample(lip,u),angle=v*TAU,p=point(q,angle,0);
        const ground=getSulfuricGround(p.x*25,p.z*25)/25;
        const raised=SULFURIC_POND_LEVEL/25+height+Math.sin(angle*29+index)*.018*Math.sin(u*Math.PI);
        p.y=q<1.44?Math.max(ground+.035,raised):ground+height;return p;
      },(u,v)=>{
        const q=sample(radii,u),angle=v*TAU;
        if(caveEntrance){
          // The cave's pond joins pale salt crust directly to the surrounding
          // ground, without the orange outline used on other sulfur pools.
          tint.setHex(0xe5debd).lerp(other.setHex(0xc8af43),THREE.MathUtils.smoothstep(q,1.15,1.65));
        }else{
          const bands=q<1.02?0xa58c39:q<1.22?0xe5debd:q<1.4?0xd3bb43:0xc8af43;
          tint.setHex(bands).lerp(other.setHex(0xb7773e),(.5+.5*Math.sin(angle*17+u*24+index))*(q>1.2?.24:.08));
        }
        return tint.multiplyScalar(.93+.07*Math.sin(angle*37+u*45)**2).getHex();
      });
      // Knobbly geyserite grows on the cream lip; all nodules share the rim mesh.
      for(let j=0;j<30;j++){
        const angle=j/30*TAU+index*.9,p=point(1.085,angle,SULFURIC_POND_LEVEL/25+.19);
        const size=.045+.04*(.5+.5*Math.sin(j*2.1+index));
        crust.ellipsoid(p,new THREE.Vector3(size*1.5,size*.65,size),!caveEntrance&&j%4===0?0xd6c36e:0xe7dfc1,{segments:6,rings:4});
      }
      const start=water.positions.length/3;
      water.grid(14,96,(u,v)=>point(u*.997,v*TAU,SULFURIC_POND_LEVEL/25),0xffffff);
      for(let i=start;i<water.positions.length/3;i++){
        const angle=water.uvs[i*2]*TAU,q=water.uvs[i*2+1];
        water.uvs[i*2]=Math.cos(angle)*q;water.uvs[i*2+1]=Math.sin(angle)*q;
      }
    });
    this.geometries=[crust.geometry({normalizeHeight:false}),water.geometry({normalizeHeight:false})];
    const crustMaterial=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.88,
      normalMap:materials?.rock?.normalMap??null,normalScale:new THREE.Vector2(.25,.25)});
    const waterMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.23,metalness:.04,envMapIntensity:1.15});
    waterMaterial.userData.waterLevel=SULFURIC_POND_LEVEL/25;waterMaterial.userData.waterMedium='sulfuric';
    waterMaterial.onBeforeCompile=shader=>{
      shader.uniforms.pondTime=this.time;
      shader.vertexShader=`uniform float pondTime;varying vec2 pondCoord;\n${shader.vertexShader}`
        .replace('#include <begin_vertex>',`#include <begin_vertex>
          pondCoord=uv;float r=length(uv);
          transformed.y+=(sin(r*43.-pondTime*3.2)*.006+sin(position.x*5.+position.z*4.+pondTime*1.7)*.003)*(1.-smoothstep(.8,1.,r));`);
      shader.fragmentShader=`uniform float pondTime;varying vec2 pondCoord;\n${shader.fragmentShader}`
        .replace('#include <color_fragment>',`#include <color_fragment>
          float pondR=length(pondCoord);
          vec3 deep=vec3(.08,.18,.14),aqua=vec3(.22,.37,.25),milk=vec3(.49,.53,.31);
          diffuseColor.rgb=mix(deep,aqua,smoothstep(.05,.72,pondR));
          diffuseColor.rgb=mix(diffuseColor.rgb,milk,smoothstep(.68,1.,pondR));
          float caustic=sin(pondCoord.x*48.+pondCoord.y*19.+pondTime*.8)*sin(pondCoord.y*41.-pondCoord.x*17.-pondTime*.65);
          diffuseColor.rgb+=vec3(.010,.014,.009)*smoothstep(.55,.95,caustic)*smoothstep(.35,.9,pondR);`)
        .replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
          normal=normalize(normal+vec3(sin(pondCoord.x*47.+pondTime*1.7),cos(pondCoord.y*51.-pondTime*1.4),0.)*.045);`);
    };
    waterMaterial.customProgramCacheKey=()=> 'sulfuric-turquoise-pond-v1';
    this.materials=[crustMaterial,waterMaterial];
    this.meshes=this.geometries.map((geometry,i)=>{
      const mesh=new THREE.Mesh(geometry,this.materials[i]);mesh.name=i?'sulfuric-turquoise-water':'sulfuric-scalloped-mineral-crust';this.group.add(mesh);return mesh;
    });
  }
  update(time,reducedMotion=false){if(!this.disposed)this.time.value=reducedMotion?0:Number.isFinite(time)?Math.max(0,time):0;}
  dispose(){
    if(this.disposed)return;this.disposed=true;this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.group.removeFromParent();this.group.clear();
  }
}
