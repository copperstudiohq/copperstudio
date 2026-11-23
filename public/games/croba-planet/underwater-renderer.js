import * as THREE from "./vendor/three.module.js";
import { WATER_LEVEL, BLUE_OCEAN_START_X } from "./terrain.js";
import { getSeabedHeight, SEABED_GRID, SEABED_RENDER_BOUNDS } from "./seabed.js";
import {JELLYFISH_SPIRES} from './jellyfish-spires-data.js';
import { getForestHeight } from "./forest-terrain.js";
import { getPlatformVertices, pointInPolygon } from "./terrain.js";
import {WATER_OPTICS,waterOpticsVec3} from './water-optics.js';

const SCALE = 25;
const LEVEL = WATER_LEVEL / SCALE;
const UP = new THREE.Vector3(0, 1, 0);
const SUN = new THREE.Vector3(-0.28, 0.92, -0.28).normalize();
const mediumMaterials = new WeakSet();
const NOISE = `float waterHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float waterNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(waterHash(i),waterHash(i+vec2(1.,0.)),f.x),mix(waterHash(i+vec2(0.,1.)),waterHash(i+1.),f.x),f.y);}`;

function random(seed) {
  let value = seed >>> 0;
  return () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Small visual depth/light field, sampled from the actual seabed and solid surface islands. */
export function createWaterField(world) {
  const { minX, minY, maxX, maxY } = SEABED_RENDER_BOUNDS;
  // Keep the shared RGBA lighting field below its 0.31 MiB budget as the
  // prepared map grows. Physical terrain retains its original 50-unit grid.
  const sourceColumns=(maxX-minX)/SEABED_GRID.step+1,sourceRows=(maxY-minY)/SEABED_GRID.step+1;
  const scale=Math.min(1,Math.sqrt(79000/(sourceColumns*sourceRows)));
  const columns=Math.max(2,Math.floor((sourceColumns-1)*scale)+1);
  const rows=Math.max(2,Math.floor((sourceRows-1)*scale)+1);
  const stepX=(maxX-minX)/(columns-1),stepY=(maxY-minY)/(rows-1);
  const bytes = new Uint8Array(columns * rows * 4);
  const ice = (world.platforms ?? []).map((floe) => ({ floe, vertices: getPlatformVertices(floe) }));
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const x = minX + column * stepX, y = minY + row * stepY;
    const forest = getForestHeight(world, x, y);
    const ground = Math.max(getSeabedHeight(x, y), forest ?? -Infinity);
    const covered = ground > WATER_LEVEL || ice.some(({ floe, vertices }) =>
      Math.abs(x - floe.x) < floe.rx && Math.abs(y - floe.y) < floe.ry && pointInPolygon(vertices, x, y));
    const index = (row * columns + column) * 4;
    bytes[index] = Math.round(Math.min(1, Math.max(0, (WATER_LEVEL - ground) / (SCALE * JELLYFISH_SPIRES.maxDepthMeters))) * 255);
    bytes[index + 1] = covered ? 0 : 255;
    bytes[index + 2] = x >= BLUE_OCEAN_START_X || forest !== null ? 255 : 0;
    bytes[index + 3] = 255;
  }
  const texture = new THREE.DataTexture(bytes, columns, rows, THREE.RGBAFormat);
  texture.magFilter = texture.minFilter = THREE.LinearFilter; texture.generateMipmaps = false; texture.needsUpdate = true;
  return { texture, maxDepthMeters:JELLYFISH_SPIRES.maxDepthMeters, bounds: new THREE.Vector4(minX / SCALE, minY / SCALE,
    (maxX-minX) / SCALE, (maxY-minY) / SCALE) };
}

export function createOceanMaterial(fogColor) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,
    uniforms: {
      time: { value: 0 }, fogColor: { value: fogColor }, underwater: { value: 0 }, viewerDepth: { value: 0 },
      blueOceanStart: { value: BLUE_OCEAN_START_X / SCALE },
      blueSurfaceColor: { value: new THREE.Color(0x082b43) }, blueHorizonColor: { value: new THREE.Color(0x4a7189) },
      waterField: { value: null }, fieldBounds: { value: new THREE.Vector4() }, fieldReady: { value: 0 }, fieldDepth:{value:JELLYFISH_SPIRES.maxDepthMeters},
    },
    vertexShader: `varying vec3 vWorld; varying float vDepth; uniform float time;
      void main(){vec4 world=modelMatrix*vec4(position,1.);
        world.y+=sin(world.x*.075+world.z*.031+time*.7)*.047+cos(world.z*.113-world.x*.029-time*.5)*.037;
        vWorld=world.xyz;vec4 view=viewMatrix*world;vDepth=-view.z;gl_Position=projectionMatrix*view;}`,
    fragmentShader: `${NOISE}
      varying vec3 vWorld;varying float vDepth;
      uniform float time,underwater,viewerDepth,blueOceanStart,fieldReady,fieldDepth;
      uniform vec3 fogColor,blueSurfaceColor,blueHorizonColor;uniform sampler2D waterField;uniform vec4 fieldBounds;
      void main(){
        vec2 p=vWorld.xz;
        vec2 warp=p+(vec2(waterNoise(p*.29+time*.025),waterNoise(p*.23-time*.018+31.7))-.5)*2.1;
        float grain=waterNoise(p*2.7+time*.021);
        float chop=sin(warp.x*2.31+warp.y*.67+time*1.1)*.6+sin(warp.y*1.83-warp.x*1.17-time*.83+grain*2.)*.4;
        float capillary=sin(warp.x*19.+warp.y*11.-time*1.9+grain*4.1)*.55+sin(warp.y*23.-warp.x*7.+time*1.3+grain*3.3)*.45;
        vec3 normal=normalize(vec3(cos(p.x*.075+p.y*.031+time*.7)*.075+chop*.032+capillary*.009,1.,
          sin(p.y*.113-p.x*.029-time*.5)*.07-chop*.04+capillary*.008));
        vec3 view=normalize(cameraPosition-vWorld);float facing=clamp(abs(dot(view,normal)),0.,1.);
        float fresnel=.025+.975*pow(1.-facing,5.);vec3 reflection=reflect(-view,normal);
        vec2 uv=(p-fieldBounds.xy)/max(fieldBounds.zw,vec2(1.));
        vec4 field=texture2D(waterField,clamp(uv,0.,1.));
        float blue=max(smoothstep(blueOceanStart-3.,blueOceanStart+3.,p.x),fieldReady*field.b);
        vec3 sky=mix(vec3(.30,.47,.57),blueHorizonColor*1.6+.12,blue);
        sky=mix(sky*.67,sky,clamp(reflection.y*.8+.3,0.,1.));
        float glitter=pow(max(dot(reflection,normalize(vec3(-.28,.92,-.28))),0.),180.)*(1.+capillary*.22);
        float depth=mix(mix(11.,100.,blue),field.r*fieldDepth,fieldReady);
        float nearShore=fieldReady*(1.-smoothstep(1.5,9.,depth));
        vec3 absorption=exp(-${waterOpticsVec3(WATER_OPTICS.surfaceAbsorption)}*depth/max(facing,.22));
        vec3 bottom=mix(vec3(.08,.22,.24),vec3(.035,.17,.23),blue)*absorption;
        vec3 water=mix(vec3(.012,.075,.10),blueSurfaceColor,blue)+bottom;
        water=mix(water,vec3(.025,.19,.25)+bottom*.85,nearShore*.55);
        vec3 above=mix(water,sky,fresnel*.76)+glitter*.42;
        above+=pow(max(0.,chop*.65+capillary*.18),10.)*.035;
        float iceRim=fieldReady*(1.-smoothstep(.04,.30,abs(field.g-.5)));
        float shallowRim=fieldReady*(1.-smoothstep(.3,1.5,depth));
        float foam=max(iceRim,shallowRim)*smoothstep(.45,.85,grain+chop*.12)*.24;
        above=mix(above,vec3(.70,.86,.90),foam);
        float window=smoothstep(.62,.80,facing);
        vec3 below=mix(vec3(.014,.06,.085),sky*.65,window)*exp(-vec3(.055,.025,.012)*viewerDepth);
        below+=pow(max(0.,chop),14.)*.055*exp(-viewerDepth/28.);
        vec3 color=mix(above,below,underwater);
        float fog=1.-exp(-.000055*vDepth*vDepth);color=mix(color,fogColor,clamp(fog,0.,1.));
        float alpha=mix(mix(${WATER_OPTICS.arcticSurfaceOpacity}+fresnel*.10,${WATER_OPTICS.oceanSurfaceOpacity}+fresnel*.02,blue),${WATER_OPTICS.underSurfaceOpacity}+fresnel*.30,underwater);
        alpha=mix(alpha,${WATER_OPTICS.shoreSurfaceOpacity}+fresnel*.20,nearShore*(1.-underwater));
        alpha=mix(alpha,max(alpha,.8),foam*(1.-underwater));
        gl_FragColor=vec4(color,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** Compose wavelength-dependent water absorption with existing wind/detail hooks, without an extra render pass. */
export function applyWaterMedium(material) {
  if (!material?.isMeshStandardMaterial || mediumMaterials.has(material)) return;
  mediumMaterials.add(material);
  const level=Number.isFinite(material.userData?.waterLevel)?material.userData.waterLevel:LEVEL;
  const sulfuric=material.userData?.waterMedium==='sulfuric';
  const entrance=material.userData?.waterMediumEntranceZ;
  const entranceBlend=sulfuric&&Number.isFinite(entrance);
  const previous = material.onBeforeCompile.bind(material), cache = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = (shader) => {
    previous(shader);
    shader.vertexShader = `varying vec3 vWaterMedium;\n${shader.vertexShader}`.replace("#include <worldpos_vertex>",
      `#include <worldpos_vertex>\nvec4 mediumPoint=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nmediumPoint=instanceMatrix*mediumPoint;\n#endif\nvWaterMedium=(modelMatrix*mediumPoint).xyz;`);
    shader.fragmentShader = `varying vec3 vWaterMedium;\n${shader.fragmentShader}`.replace("#include <opaque_fragment>",
      `float mediumDistance=distance(cameraPosition,vWaterMedium);
       float wetFraction=clamp((${level.toFixed(4)}-min(cameraPosition.y,vWaterMedium.y))/max(abs(cameraPosition.y-vWaterMedium.y),.001),0.,1.);
       if(cameraPosition.y<${level.toFixed(4)}&&vWaterMedium.y<${level.toFixed(4)})wetFraction=1.;
       ${entranceBlend?`float caveWater=smoothstep(0.,4.,${entrance.toFixed(4)}-vWaterMedium.z);
       vec3 mediumAbsorption=mix(${waterOpticsVec3(WATER_OPTICS.absorption)},${waterOpticsVec3(WATER_OPTICS.sulfurAbsorption)},caveWater);
       vec3 mediumScatter=mix(${waterOpticsVec3(WATER_OPTICS.scatter)},${waterOpticsVec3(WATER_OPTICS.sulfurScatter)},caveWater);`
       :`vec3 mediumAbsorption=${waterOpticsVec3(sulfuric?WATER_OPTICS.sulfurAbsorption:WATER_OPTICS.absorption)};
       vec3 mediumScatter=${waterOpticsVec3(sulfuric?WATER_OPTICS.sulfurScatter:WATER_OPTICS.scatter)};`}
       vec3 mediumTransmission=exp(-mediumAbsorption*mediumDistance*wetFraction);
       outgoingLight=outgoingLight*mediumTransmission+mediumScatter*(1.-mediumTransmission);
       #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => `${cache()}|croba-water-medium-v1${level===LEVEL?'':':'+level.toFixed(4)}${entranceBlend?':entrance-'+entrance.toFixed(4):''}${sulfuric?':sulfuric':''}`;
  material.needsUpdate = true;
}

/** Organic sediment/stone transitions use world-space metre grain and broad patches instead of visible tile grids. */
export function applyTerrainSurface(material, library, clock) {
  if (!material?.isMeshStandardMaterial || !library?.sand?.map || !library?.rock?.map) return;
  const previous = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader) => {
    previous(shader);
    Object.assign(shader.uniforms, { sedimentMap: { value: library.sand.map }, mineralMap: { value: library.rock.map },
      siltMap: { value: library.silt?.map ?? library.sand.map }, terrainTime: clock });
    shader.vertexShader = `attribute float sedimentOcclusion;varying vec3 vTerrainWorld;varying vec3 vTerrainNormal;varying float vSedimentAO;\n${shader.vertexShader}`
      .replace("#include <worldpos_vertex>", `#include <worldpos_vertex>\nvTerrainWorld=(modelMatrix*vec4(transformed,1.)).xyz;
        vTerrainNormal=normalize(mat3(modelMatrix)*objectNormal);vSedimentAO=sedimentOcclusion;`);
    shader.fragmentShader = `${NOISE}\nuniform sampler2D sedimentMap,mineralMap,siltMap;uniform float terrainTime;
      varying vec3 vTerrainWorld,vTerrainNormal;varying float vSedimentAO;\n${shader.fragmentShader}`
      .replace("#include <map_fragment>", `
        float terrainMacro=waterNoise(vTerrainWorld.xz*.087);float terrainPatch=waterNoise(vTerrainWorld.xz*.31+17.3);
        vec3 axis=pow(abs(normalize(vTerrainNormal)),vec3(4.));axis/=max(dot(axis,vec3(1.)),.0001);
        vec2 sedimentUV=vTerrainWorld.xz*.73+vec2(terrainMacro*.33,terrainPatch*.27);
        float stoneMix=clamp((1.-abs(vTerrainNormal.y))*.95+(terrainMacro-.5)*.75,0.,1.);
        vec3 sediment=texture2D(sedimentMap,sedimentUV).rgb;
        vec2 mineralOffset=vec2(terrainPatch*.2);
        vec3 mineral=texture2D(mineralMap,vTerrainWorld.zy*.83+mineralOffset).rgb*axis.x
          +texture2D(mineralMap,vTerrainWorld.xz*.83+mineralOffset).rgb*axis.y
          +texture2D(mineralMap,vTerrainWorld.xy*.83+mineralOffset).rgb*axis.z;
        float abyssMud=(1.-smoothstep(-85.,-24.,vTerrainWorld.y))*(1.-stoneMix)*(.35+terrainPatch*.4);
        sediment=mix(sediment,texture2D(siltMap,sedimentUV*.61+9.2).rgb,abyssMud);
        diffuseColor.rgb*=mix(sediment,mineral,stoneMix)*(.76+terrainMacro*.28+terrainPatch*.14);`)
      .replace("#include <aomap_fragment>", `#include <aomap_fragment>\nreflectedLight.indirectDiffuse*=1.-vSedimentAO*.56;`);
  };
  material.customProgramCacheKey = () => "croba-sediment-stone-macro-v1";
}

/** Two lightweight batches add suspended matter and soft sun columns, never a screen-sized postprocess. */
export class UnderwaterRenderer {
  constructor(world, quality = {}) {
    this.group = new THREE.Group(); this.group.name = "croba-water-volume";
    this.field = createWaterField(world); this.clock = { value: 0 }; this.disposed = false;
    this.center = { value: new THREE.Vector3() }; this.depth = { value: 0 }; this.sun = { value: 1 };
    this.direction = { value: new THREE.Vector3(0, 0, -1) };
    this.waterLevel = { value: LEVEL }; this.turbidity = { value: 1 };
    const rng = random(0x0cea7), count = quality.mobile ? 300 : 720;
    const seeds = new Float32Array(count * 3), sizes = new Float32Array(count), kinds = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      seeds.set([(rng() - .5) * 24, (rng() - .5) * 18, (rng() - .5) * 24], index * 3);
      kinds[index] = rng() > .94 ? 1 : 0;
      sizes[index] = kinds[index] ? 1.35 + rng() * .85 : .48 + rng() * .65;
    }
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(seeds, 3));
    this.particleGeometry.setAttribute("moteSize", new THREE.Float32BufferAttribute(sizes, 1));
    this.particleGeometry.setAttribute("marineSnow", new THREE.Float32BufferAttribute(kinds, 1));
    this.particleMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      uniforms: { time: this.clock, center: this.center, viewerDepth: this.depth, sunlight: this.sun, viewDirection: this.direction,
        waterLevel: this.waterLevel, turbidity: this.turbidity },
      vertexShader: `attribute float moteSize,marineSnow;uniform float time,sunlight,waterLevel;uniform vec3 center,viewDirection;
        varying float vMote,vSnow,vRange,vIllumination,vEdge;
        void main(){vec3 p=position-center;
          p.x=mod(p.x+time*.018+sin(time*.047+position.z)*.23+12.,24.)-12.;
          p.z=mod(p.z+time*.009+sin(time*.039+position.x)*.19+12.,24.)-12.;
          p.y=mod(p.y-time*mix(.004,.022,marineSnow)+9.,18.)-9.;vec3 world=center+p;
          float submerged=1.-smoothstep(waterLevel-.24,waterLevel-.035,world.y);vMote=moteSize*submerged;vSnow=marineSnow;
          float boundary=max(max(abs(p.x)/12.,abs(p.z)/12.),abs(p.y)/9.);vEdge=1.-smoothstep(.78,1.,boundary);
          vec4 view=viewMatrix*vec4(world,1.);vRange=length(p);
          float cone=pow(max(0.,dot(p/max(vRange,.001),viewDirection)),14.);
          vIllumination=.12+sunlight*.62+(.50+(1.-sunlight)*.45)*cone;
          gl_Position=projectionMatrix*view;
          gl_PointSize=clamp(28.*moteSize/max(1.,-view.z),mix(.7,1.1,marineSnow),mix(2.2,4.6,marineSnow));}`,
      fragmentShader: `uniform float viewerDepth,turbidity;varying float vMote,vSnow,vRange,vIllumination,vEdge;void main(){
        vec2 q=(gl_PointCoord-.5)*2.;q*=vec2(1.+vSnow*.22,1.-vSnow*.12);
        float dotShape=exp(-dot(q,q)*3.2)*(1.-smoothstep(.65,1.,length(q)));
        float distanceFade=(1.-smoothstep(8.5,14.5,vRange))*smoothstep(.4,1.3,vRange);
        float alpha=dotShape*distanceFade*vEdge*min(vMote,1.2)*mix(.15,.19,vSnow)*vIllumination*sqrt(turbidity);
        vec3 color=mix(vec3(.54,.69,.73),vec3(.30,.49,.61),clamp(viewerDepth/70.,0.,1.));
        color=mix(color,vec3(.65,.72,.70),vSnow*.35);gl_FragColor=vec4(color,min(alpha,.32));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    });
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particles.name = "suspended-ocean-motes"; this.particles.frustumCulled = false;
    this.shaftGeometry = new THREE.PlaneGeometry(1, 1).translate(0, -.5, 0);
    this.shaftMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
      forceSinglePass: true, blending: THREE.AdditiveBlending,
      uniforms: { time: this.clock, center: this.center, sunlight: this.sun, waterLevel: this.waterLevel, turbidity: this.turbidity,
        waterField: { value: this.field.texture }, fieldBounds: { value: this.field.bounds } },
      vertexShader: `varying vec2 vBeam;varying vec3 vWorld;varying float vOpen;uniform sampler2D waterField;uniform vec4 fieldBounds;
        void main(){vBeam=uv;vec4 world=modelMatrix*instanceMatrix*vec4(position,1.);vWorld=world.xyz;
          vec2 top=instanceMatrix[3].xz;vOpen=texture2D(waterField,clamp((top-fieldBounds.xy)/fieldBounds.zw,0.,1.)).g;
          gl_Position=projectionMatrix*viewMatrix*world;}`,
      fragmentShader: `varying vec2 vBeam;varying vec3 vWorld;varying float vOpen;uniform float time,sunlight,waterLevel,turbidity;uniform vec3 center;
        void main(){float edge=pow(max(0.,1.-abs(vBeam.x*2.-1.)),2.4);
          float end=smoothstep(0.,.12,vBeam.y)*(1.-smoothstep(.9,1.,vBeam.y));
          float range=1.-smoothstep(11.,21.,distance(vWorld.xz,center.xz));
          float shimmer=.83+.17*sin(vWorld.x*.7+time*.38+vWorld.z*.4);
          float below=1.-smoothstep(waterLevel-.12,waterLevel,vWorld.y);
          float extinction=exp(-max(0.,waterLevel-vWorld.y)*.045*turbidity);
          float alpha=edge*end*range*vOpen*sunlight*shimmer*below*extinction*.062;
          gl_FragColor=vec4(.43,.69,.76,alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.shafts = new THREE.InstancedMesh(this.shaftGeometry, this.shaftMaterial, 9);
    this.shafts.name = "diffused-sunlight-columns"; this.shafts.frustumCulled = false;
    this.shafts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.particles, this.shafts);
    this.transform = new THREE.Object3D(); this.view = new THREE.Vector3(); this.right = new THREE.Vector3();
    this.normal = new THREE.Vector3(); this.matrix = new THREE.Matrix4();
    this.group.visible = false;
  }

  bind(material) {
    if (!material?.uniforms) return;
    Object.assign(material.uniforms, { waterField: { value: this.field.texture }, fieldBounds: { value: this.field.bounds }, fieldReady: { value: 1 } });
  }

  update(cameraPosition, time, { underwater = false, reducedMotion = false, depth = 0, direction, waterLevel = LEVEL, turbidity = 1 } = {}) {
    if (this.disposed) return;
    this.group.visible = this.particles.visible = underwater;
    this.clock.value = reducedMotion || !Number.isFinite(time) ? 0 : Math.max(0,time);
    const safeDepth=Number.isFinite(depth)?Math.max(0,depth):0;
    this.waterLevel.value=Number.isFinite(waterLevel)?waterLevel:LEVEL;
    this.turbidity.value=Number.isFinite(turbidity)?Math.max(.5,Math.min(3,turbidity)):1;
    this.center.value.copy(cameraPosition); this.depth.value = safeDepth; this.sun.value = Math.exp(-safeDepth*this.turbidity.value / 18);
    if (direction) {this.direction.value.copy(direction).normalize();if(this.direction.value.lengthSq()<.000001)this.direction.value.set(0,0,-1);}
    this.shafts.visible = underwater&&safeDepth < 40/this.turbidity.value;
    if (!underwater || !this.shafts.visible) return;
    let index = 0;
    const cellX = Math.floor(cameraPosition.x / 16), cellZ = Math.floor(cameraPosition.z / 16);
    for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) {
      const gx = cellX + x, gz = cellZ + z, phase = Math.sin(gx * 12.9898 + gz * 78.233);
      this.transform.position.set(gx * 16 + phase * 2, this.waterLevel.value - .12, gz * 16 + Math.cos(phase * 17) * 2);
      this.view.subVectors(cameraPosition, this.transform.position);
      this.normal.copy(this.view).addScaledVector(SUN, -this.view.dot(SUN)).normalize();
      if (this.normal.lengthSq() < .01) this.normal.set(0, 0, 1);
      this.right.crossVectors(SUN, this.normal).normalize();
      this.matrix.makeBasis(this.right, SUN, this.normal);
      this.transform.quaternion.setFromRotationMatrix(this.matrix); this.transform.scale.set(1.4 + phase * .4, 22/this.turbidity.value, 1);
      this.transform.updateMatrix(); this.shafts.setMatrixAt(index++, this.transform.matrix);
    }
    this.shafts.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.shafts.dispose(); this.particleGeometry.dispose(); this.shaftGeometry.dispose();
    this.particleMaterial.dispose(); this.shaftMaterial.dispose(); this.field.texture.dispose(); this.group.clear();
  }
}
