import * as THREE from './vendor/three.module.js';
import {createBackgroundSmokeTexture} from './background-smoke-texture.js';

/** Soft camera-facing billows share one texture, one draw and a fixed pool. */
export class BackgroundShipSmoke{
 constructor(capacity=24){
  if(!Number.isInteger(capacity)||capacity<1||capacity>32)throw new RangeError('Background smoke needs 1 to 32 billows.');
  this.capacity=capacity;this.disposed=false;this.texture=createBackgroundSmokeTexture();
  this.geometry=new THREE.PlaneGeometry(1,1);
  this.opacity=new THREE.InstancedBufferAttribute(new Float32Array(capacity),1).setUsage(THREE.DynamicDrawUsage);
  this.angle=new THREE.InstancedBufferAttribute(new Float32Array(capacity),1).setUsage(THREE.DynamicDrawUsage);
  this.geometry.setAttribute('billowOpacity',this.opacity);this.geometry.setAttribute('billowAngle',this.angle);
  this.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,toneMapped:false,
   uniforms:{densityMap:{value:this.texture},fade:{value:1},shadowTint:{value:new THREE.Color()},lightTint:{value:new THREE.Color()}},
   vertexShader:`attribute float billowOpacity,billowAngle;
    varying vec2 vBillowUv;varying float vBillowOpacity;
    void main(){
      vBillowUv=uv;vBillowOpacity=billowOpacity;
      vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);
      vec2 size=vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));
      float c=cos(billowAngle),s=sin(billowAngle);
      vec2 offset=mat2(c,s,-s,c)*(position.xy*size);
      gl_Position=projectionMatrix*(center+vec4(offset,0.,0.));
    }`,
   fragmentShader:`uniform sampler2D densityMap;uniform float fade;
    uniform vec3 shadowTint,lightTint;varying vec2 vBillowUv;varying float vBillowOpacity;
    void main(){
      vec4 density=texture2D(densityMap,vBillowUv);
      float alpha=density.a*vBillowOpacity*fade;
      if(alpha<.002)discard;
      gl_FragColor=vec4(mix(shadowTint,lightTint,density.r),alpha);
      #include <colorspace_fragment>
    }`,
  });
  this.mesh=new THREE.InstancedMesh(this.geometry,this.material,capacity);
  this.mesh.name='distant-courier-soft-smoke';this.mesh.count=0;this.mesh.renderOrder=-820;
  this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.pose=new THREE.Object3D();
 }

 setBillow(index,position,width,height,opacity,angle){
  this.pose.position.copy(position);this.pose.scale.set(width,height,1);this.pose.updateMatrix();
  this.mesh.setMatrixAt(index,this.pose.matrix);this.opacity.setX(index,opacity);this.angle.setX(index,angle);
 }

 commit(count,fade,horizon){
  this.mesh.count=count;this.mesh.visible=count>0;
  this.material.uniforms.fade.value=fade;
  this.material.uniforms.shadowTint.value.setHex(0x303b44).lerp(horizon,.24);
  this.material.uniforms.lightTint.value.setHex(0x879296).lerp(horizon,.32);
  this.mesh.instanceMatrix.needsUpdate=true;this.opacity.needsUpdate=true;this.angle.needsUpdate=true;
  if(count)this.mesh.computeBoundingSphere();
 }

 dispose(){
  if(this.disposed)return;this.disposed=true;this.mesh.removeFromParent();
  this.mesh.dispose();this.geometry.dispose();this.material.dispose();this.texture.dispose();
 }
}
