/** Authored dimensions stay intact; one bounded factor scales physical/render
 * anatomy at its use site. Legacy descriptors retain their full adult size. */
export function getLifecycleScale(animal){
 return Number.isFinite(animal?.lifecycleScale)?Math.max(.05,Math.min(1,animal.lifecycleScale)):1;
}
