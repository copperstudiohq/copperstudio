import * as THREE from './vendor/three.module.js';

const TAU=Math.PI*2,SEGMENTS=144,ROWS=6;
const clamp=v=>Math.max(0,Math.min(1,v));
function detail(i,seed){let n=Math.imul(i+17,374761393)^seed;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}

/** One static western skyline, ending before the open-ocean half of the sky. Camera-relative geometry is purely
 * decorative: it never enters terrain, collision, spawning or map bounds. */
export function createBackgroundMountainGeometry(){
  const positions=[],colors=[],haze=[],a=new THREE.Vector3(),b=new THREE.Vector3(),normal=new THREE.Vector3();
  const sun=new THREE.Vector3(-.5,.6,-.65).normalize(),tint=new THREE.Color();
  for(let range=0;range<1;range++){
    const radius=370-range*25,seed=719+range*271;
    const crest=i=>{
      const t=(i%SEGMENTS)/SEGMENTS*TAU;
      const massif=.5+.5*Math.sin(t*3+range*.9);
      const shoulder=.5+.5*Math.cos(t*7+range*1.6);
      return 84+massif*73+shoulder*38+detail(i%SEGMENTS,seed)*34+(range===1?22:0);
    };
    const point=(i,row)=>{
      const index=i%SEGMENTS,t=index/SEGMENTS*TAU,f=row/(ROWS-1),top=crest(index);
      const spur=Math.sin(f*Math.PI)*(.25+.75*detail(index,seed+83));
      const r=radius-spur*18+Math.sin(t*17+range)*f*3;
      const edgeFade=clamp((.18-Math.cos(t))/.24);
      return new THREE.Vector3(Math.cos(t)*r,-24+(top*edgeFade+24)*f,Math.sin(t)*r);
    };
    const triangle=(p,q,r)=>{
      normal.crossVectors(a.subVectors(q,p),b.subVectors(r,p)).normalize();
      const center=a.copy(p).add(q).add(r).multiplyScalar(1/3);
      if(normal.dot(b.set(-center.x,0,-center.z))<0)normal.negate();
      const light=.66+.34*Math.max(0,normal.dot(sun));
      for(const v of [p,q,r]){
        const altitude=clamp((v.y-15)/150),snow=clamp((altitude-.34)*2.9+normal.y*.23);
        tint.setHex(range===0?0x879bae:range===1?0x607e98:0x49667f).lerp(new THREE.Color(0xdce8ee),snow);
        const strata=Math.sin(v.y*.63+v.x*.09+v.z*.11)*.025;
        tint.multiplyScalar(light+strata);
        positions.push(v.x,v.y,v.z);colors.push(tint.r,tint.g,tint.b);
        haze.push(clamp((range===0?.49:range===1?.30:.15)+Math.max(0,1-v.y/70)*.60));
      }
    };
    for(let row=0;row<ROWS-1;row++)for(let i=0;i<SEGMENTS;i++){
      if(Math.cos((i+.5)/SEGMENTS*TAU)>.14)continue;
      const p=point(i,row),q=point(i+1,row),r=point(i,row+1),s=point(i+1,row+1);
      triangle(p,r,q);triangle(q,r,s);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('mountainHaze',new THREE.Float32BufferAttribute(haze,1));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.userData.skylineLayers=1;geometry.userData.openOceanDirection=[1,0,0];return geometry;
}

/** One unlit scenery draw behind every world surface, unaffected by local fog. */
export class BackgroundMountains{
  constructor(){
    this.geometry=createBackgroundMountainGeometry();this.disposed=false;
    this.material=new THREE.ShaderMaterial({vertexColors:true,side:THREE.DoubleSide,depthWrite:false,depthTest:false,toneMapped:false,fog:false,
      uniforms:{horizon:{value:new THREE.Color(0x8daab9)},daylight:{value:1}},
      vertexShader:`attribute float mountainHaze;varying vec3 vMountainColor;varying float vMountainHaze;
        void main(){vMountainColor=color;vMountainHaze=mountainHaze;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform vec3 horizon;uniform float daylight;varying vec3 vMountainColor;varying float vMountainHaze;
        void main(){gl_FragColor=vec4(mix(vMountainColor*mix(.10,1.,daylight),horizon,vMountainHaze),1.);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh=new THREE.Mesh(this.geometry,this.material);this.mesh.name='distant-background-mountains';
    this.mesh.renderOrder=-900;this.mesh.frustumCulled=false;this.mesh.userData.backgroundOnly=true;
  }
  update(horizon,daylight=1){this.material.uniforms.horizon.value.copy(horizon);this.material.uniforms.daylight.value=daylight;}
  dispose(){if(this.disposed)return;this.disposed=true;this.mesh.removeFromParent();this.geometry.dispose();this.material.dispose();}
}
