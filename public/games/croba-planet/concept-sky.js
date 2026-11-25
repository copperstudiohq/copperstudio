import * as THREE from './vendor/three.module.js';
import {BackgroundMountains} from './background-mountains.js';
import {BackgroundFallingShips} from './background-falling-ships.js';
import {sampleDayNight} from './day-night-cycle.js';

const DEFAULT_DAY=sampleDayNight(240);
const NIGHT_ZENITH=new THREE.Color(0x030a1c),TWILIGHT_ZENITH=new THREE.Color(0x493553);
const NIGHT_CLOUD=new THREE.Color(0x303e5d),TWILIGHT_CLOUD=new THREE.Color(0xf4b28c);

const smooth = value => value*value*(3-2*value);
function cloudNoise(u,v,frequency) {
  const x=u*frequency,y=v*frequency,ix=Math.floor(x),iy=Math.floor(y);
  const fx=smooth(x-ix),fy=smooth(y-iy);
  const hash=(a,b)=>{
    let n=Math.imul((a%frequency+frequency)%frequency+17,374761393)^Math.imul((b%frequency+frequency)%frequency+53,668265263);
    n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;
  };
  const a=hash(ix,iy)*(1-fx)+hash(ix+1,iy)*fx,b=hash(ix,iy+1)*(1-fx)+hash(ix+1,iy+1)*fx;
  return a*(1-fy)+b*fy;
}

/** Fixed, seamless cloud atlas. One small sample replaces per-pixel noise loops. */
export function createConceptCloudPixels(width=256,height=128) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2)
    throw new RangeError('Cloud atlas dimensions must be integers of at least two pixels.');
  const pixels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/(width-1),v=y/(height-1);
    const cloud=cloudNoise(u,v,4)*.53+cloudNoise(u,v,8)*.29+cloudNoise(u,v,16)*.18;
    const offset=(y*width+x)*4;
    pixels[offset]=pixels[offset+1]=pixels[offset+2]=Math.round(cloud*255);pixels[offset+3]=255;
  }
  return pixels;
}

/** The concept artwork's cool cloud banks and distant light, using one static
 * sky draw. No extra lighting passes, animation clock or post-processing. */
export class ConceptSky {
  constructor() {
    this.texture=new THREE.DataTexture(createConceptCloudPixels(),256,128,THREE.RGBAFormat);
    this.texture.wrapS=this.texture.wrapT=THREE.RepeatWrapping;this.texture.magFilter=this.texture.minFilter=THREE.LinearFilter;
    this.texture.generateMipmaps=false;this.texture.needsUpdate=true;
    this.material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,toneMapped:false,
      uniforms:{clouds:{value:this.texture},horizon:{value:new THREE.Color()},zenith:{value:new THREE.Color(0x466a86)},
        cloudTint:{value:new THREE.Color(0xe5f1f5)},cloudStrength:{value:.84},oceanSmoke:{value:0},smokeTime:{value:0},
        sunDirection:{value:new THREE.Vector3(DEFAULT_DAY.sunX,DEFAULT_DAY.sunY,DEFAULT_DAY.sunZ)},daylight:{value:1},twilight:{value:0}},
      vertexShader:`varying vec2 vSkyUv;varying vec3 vSkyDirection;
        void main(){vSkyUv=uv;vSkyDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 vSkyUv;varying vec3 vSkyDirection;
        uniform sampler2D clouds;uniform vec3 horizon,zenith,cloudTint;uniform float cloudStrength,oceanSmoke,smokeTime;
        uniform vec3 sunDirection;uniform float daylight,twilight;
        void main(){vec3 direction=normalize(vSkyDirection);
          float altitude=smoothstep(-.025,.75,direction.y);
          vec3 color=mix(horizon,zenith,pow(altitude,.65));
          float oceanView=max(oceanSmoke,smoothstep(.05,.35,direction.x)),cloudCover=0.;
          if(oceanView<1.){
          float sampleCloud=texture2D(clouds,vSkyUv*vec2(2.,1.)).r;
          sampleCloud=mix(sampleCloud,.53,smoothstep(.92,1.,direction.y));
          float bank=smoothstep(.30,.74,sampleCloud)*cloudStrength*smoothstep(.015,.24,direction.y);
          float glow=pow(max(0.,dot(direction,sunDirection)),24.);
          cloudCover=bank*(1.-oceanView);
          color=mix(color,cloudTint*(.70+sampleCloud*.40),bank);
          color+=cloudTint*glow*(.12+bank*.12)*daylight;
          }
          if(oceanView>0.){
            vec2 uv=vSkyUv*vec2(3.,1.5)+vec2(smokeTime*.0005,smokeTime*.0002);
            float warp=texture2D(clouds,uv*.5+vec2(.13,-smokeTime*.0001)).r;
            float plume=texture2D(clouds,uv+vec2(warp*.18,warp*.09)).r;
            float wisps=texture2D(clouds,uv*2.+vec2(-smokeTime*.0002,.37)).r;
            float density=plume*.76+wisps*.24;
            float smoke=smoothstep(.48,.72,density)*smoothstep(-.015,.12,direction.y)*(1.-smoothstep(.80,.98,direction.y));
            vec3 emptySky=mix(horizon,zenith,pow(altitude,.65));
            vec3 smokeColor=mix(vec3(.18,.23,.29),vec3(.56,.64,.70),density)*mix(.10,1.,daylight);
            vec3 oceanColor=mix(emptySky,smokeColor,smoke*.82);
            color=mix(color,oceanColor,oceanView);
            cloudCover=mix(cloudCover,smoke*.82,oceanView);
          }
          // Sun, moon and sparse stars share the existing sky draw. Crossing
          // dawn/dusk changes uniforms only, never light or material counts.
          float sunDot=dot(direction,sunDirection),moonDot=dot(direction,-sunDirection);
          float horizonMask=smoothstep(-.025,.015,direction.y);
          float sunDisk=smoothstep(.99970,.99993,sunDot);
          float moonDisk=smoothstep(.99965,.99990,moonDot);
          vec3 sunColor=mix(vec3(1.0,.78,.46),vec3(1.,.28,.08),twilight);
          float cover=1.-cloudCover*.85;
          color+=sunColor*(sunDisk*2.+pow(max(0.,sunDot),48.)*.12)*horizonMask*cover;
          color+=vec3(.38,.49,.72)*(moonDisk+pow(max(0.,moonDot),96.)*.07)*(1.-daylight)*horizonMask*cover;
          color+=vec3(.42,.12,.04)*pow(max(0.,sunDot),8.)*twilight*(1.-altitude)*cover;
          if(sunDirection.y<.08){
            vec2 cell=floor(vSkyUv*vec2(256.,128.)),local=fract(vSkyUv*vec2(256.,128.))-.5;
            float seed=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);
            float star=step(.995,seed)*(1.-smoothstep(.025,.17,length(local)));
            color+=vec3(.55,.66,.87)*star*(1.-smoothstep(-.10,.04,sunDirection.y))*smoothstep(.02,.2,direction.y)*cover;
          }
          gl_FragColor=vec4(color,1.);
          #include <colorspace_fragment>
        }`,
    });
    this.group=new THREE.Group();this.group.name='concept-art-cloud-sky';
    this.mesh=new THREE.Mesh(new THREE.SphereGeometry(420,24,12),this.material);
    this.mesh.name="concept-cloud-dome";this.mesh.frustumCulled=false;this.mesh.renderOrder=-1000;this.group.add(this.mesh);
    this.mountains=new BackgroundMountains();this.group.add(this.mountains.mesh);
    this.fallingShips=new BackgroundFallingShips();this.group.add(this.fallingShips.group);
    this.forestZenith=new THREE.Color(0x696780);this.disposed=false;
  }

  update(camera,horizon,underwater,blueOcean,forestBlend=0,forestAir=false,time=0,reducedMotion=false,cycle=DEFAULT_DAY) {
    this.group.visible=!underwater;
    if(underwater)return;
    this.group.position.copy(camera.position);
    this.material.uniforms.horizon.value.copy(horizon);
    this.mountains.update(horizon,cycle.daylight);
    this.fallingShips.update(horizon,time,reducedMotion,cycle.daylight);
    // The distant western skyline stays behind the world from the ocean too;
    // its authored open eastern sector still leaves the smoke horizon clear.
    this.mountains.mesh.visible=true;
    this.material.uniforms.oceanSmoke.value=blueOcean&&!forestAir?1:0;
    this.material.uniforms.smokeTime.value=!reducedMotion&&Number.isFinite(time)?Math.max(0,time)%10000:0;
    this.material.uniforms.zenith.value.setHex(blueOcean?0x387fa9:0x416f98).lerp(this.forestZenith,forestBlend);
    this.material.uniforms.zenith.value.lerp(NIGHT_ZENITH,cycle.night).lerp(TWILIGHT_ZENITH,cycle.twilight*.5);
    this.material.uniforms.cloudTint.value.setHex(0xe5f1f5).lerp(NIGHT_CLOUD,cycle.night).lerp(TWILIGHT_CLOUD,cycle.twilight*.65);
    this.material.uniforms.sunDirection.value.set(cycle.sunX,cycle.sunY,cycle.sunZ);
    this.material.uniforms.daylight.value=cycle.daylight;
    this.material.uniforms.twilight.value=cycle.twilight;
    this.material.uniforms.cloudStrength.value=(blueOcean ? .26 : .84)*(1-forestBlend)+.58*forestBlend;
  }

  dispose() {
    if(this.disposed)return;this.disposed=true;
    this.group.removeFromParent();this.fallingShips.dispose();this.mountains.dispose();this.mesh.geometry.dispose();this.material.dispose();this.texture.dispose();
  }
}
