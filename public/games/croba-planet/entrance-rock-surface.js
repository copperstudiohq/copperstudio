import * as THREE from './vendor/three.module.js';
import {applyShellFieldSurface,addShellFieldBorderMask} from './shell-field-renderer.js';

/** Match the enclosing cliff without allocating another texture or draw.
 * Borrowed maps remain owned by the Scene. Exterior mouth framing receives
 * the same underwater pale-stone blend as the enclosing cliff. */
export function matchEntranceRock(material,geometry,rock,surface={},mouthVertices=geometry.attributes.position.count){
 const p=geometry.attributes.position,n=geometry.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i+=3){
  const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
  for(let j=i;j<i+3;j++){
   uv[j*2]=nx>ny&&nx>nz?p.getZ(j):p.getX(j);
   uv[j*2+1]=ny>=nx&&ny>=nz?p.getZ(j):p.getY(j);
  }
 }
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 addShellFieldBorderMask(geometry);
 const mask=geometry.attributes.shellFieldBlend;
 for(let i=mouthVertices;i<mask.count;i++)mask.setX(i,0);
 if(rock){
  material.map=rock.map;material.normalMap=rock.normalMap;material.roughnessMap=rock.roughnessMap;
  material.normalScale.copy(rock.normalScale);material.roughness=rock.roughness;
  material.metalness=rock.metalness;material.envMapIntensity=rock.envMapIntensity;
 }
 return applyShellFieldSurface(material,surface.map??null,surface.normalMap??null);
}
