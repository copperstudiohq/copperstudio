const ranges=new WeakMap();

/** Upload only the active, compacted prefix of a preallocated dynamic buffer.
 * Three.js clears update ranges after upload; retain one range object per
 * attribute so steady animation does not allocate replacement range records.
 * Empty draws need no upload. Initial GPU allocation still uses the full array.
 * @param {import('./vendor/three.module.js').BufferAttribute} attribute
 * @param {number} itemCount Number of attribute items, not scalar components.
 */
export function uploadAttributePrefix(attribute,itemCount){
 if(!attribute?.isBufferAttribute||!Number.isInteger(itemCount)||itemCount<0||itemCount>attribute.count)
  throw new RangeError('Dynamic uploads need a buffer attribute and an active item count within its capacity.');
 if(itemCount===0)return;
 let range=ranges.get(attribute);
 if(!range){range={start:0,count:0};ranges.set(attribute,range);}
 range.count=itemCount*attribute.itemSize;
 attribute.updateRanges[0]=range;attribute.updateRanges.length=1;
 attribute.needsUpdate=true;
}
