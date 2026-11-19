/** Cap an existing renderer budget without expanding its normal quality range.
 * Distances are render metres. Missing/invalid preferences retain that budget.
 * @param {{renderDistance?:number}|null|undefined} quality
 * @param {number} fallback @returns {number}
 */
export function capRenderDistance(quality,fallback){
 if(!Number.isFinite(fallback)||fallback<=0)throw new RangeError('Render distance fallback must be a finite positive number.');
 const requested=quality?.renderDistance;
 return Number.isFinite(requested)&&requested>0?Math.min(fallback,requested):fallback;
}
