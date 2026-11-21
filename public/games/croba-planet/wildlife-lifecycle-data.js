/** Compressed expedition-time life histories. Geometry and nests remain authored. */
export const WILDLIFE_LIFECYCLES=Object.freeze(Object.fromEntries(Object.entries({
 hogwong:{group:'hogwongs',capacity:6,courtship:12,incubation:85,growth:280,lifespan:1500,cooldown:250,mateRange:1500,contact:110,birthScale:.3,brood:'gestating'},
 crab:{group:'crabs',capacity:8,courtship:12,incubation:65,growth:200,lifespan:1200,cooldown:200,mateRange:1000,contact:42,birthScale:.22,brood:'incubating'},
 isopod:{group:'isopods',capacity:8,courtship:14,incubation:80,growth:240,lifespan:1350,cooldown:220,mateRange:1100,contact:95,birthScale:.25,brood:'gestating'},
 'sand-worm':{group:'sandWorms',capacity:2,courtship:16,incubation:100,growth:480,lifespan:1800,cooldown:300,mateRange:1800,contact:1800,birthScale:.02,brood:'incubating'},
 woodlon:{group:'woodlons',capacity:4,courtship:14,incubation:75,growth:240,lifespan:1500,cooldown:300,mateRange:250,contact:38,birthScale:.32,brood:'gestating'},
 'sulfur-lizard':{group:'sulfurLizards',capacity:2,courtship:14,incubation:80,growth:240,lifespan:1800,cooldown:300,mateRange:1100,contact:55,birthScale:.28,brood:'incubating'},
 'red-fish':{group:'redFish',capacity:4,courtship:12,incubation:65,growth:210,lifespan:1500,cooldown:240,mateRange:500,contact:30,birthScale:.25,brood:'incubating'},
 'frost-hound':{group:'frostHounds',capacity:3,courtship:16,incubation:95,growth:300,lifespan:1800,cooldown:330,mateRange:650,contact:110,birthScale:.3,brood:'gestating'},
 'void-fish':{group:'voidFish',capacity:3,courtship:16,incubation:100,growth:300,lifespan:2100,cooldown:330,mateRange:650,contact:110,birthScale:.3,brood:'gestating'},
 'crobon-bird':{group:'penguins',capacity:0,courtship:1,incubation:1,growth:150,lifespan:1800,cooldown:60,mateRange:1,contact:1,birthScale:.38,brood:'incubating'},
}).map(([id,spec])=>[id,Object.freeze(spec)])));
export const MAX_WILDLIFE_YOUNG=40;
export const WILDLIFE_DEATH_SECONDS=25;

/** Only a bred offspring's canonical age selects its nursery and migration.
 * The same phase boundaries drive body routes, visibility, growth and restores. */
export const WORM_NURSERY=Object.freeze({ingressSeconds:20,caveUntil:160,approachUntil:190,shaftUntil:215,emergeUntil:230,matureAt:480});
export function getWormNurseryState(seconds){
 const age=Math.max(0,Number.isFinite(seconds)?seconds:0),n=WORM_NURSERY;
 if(age<n.ingressSeconds)return{habitat:'burrowing-to-cave',progress:age/n.ingressSeconds,scale:.02};
 if(age<n.caveUntil){const progress=(age-n.ingressSeconds)/(n.caveUntil-n.ingressSeconds);return{habitat:'salt-cave',progress,scale:.02+.03*progress};}
 if(age<n.approachUntil)return{habitat:'cave-exit',progress:(age-n.caveUntil)/(n.approachUntil-n.caveUntil),scale:.05};
 if(age<n.shaftUntil)return{habitat:'geyser-shaft',progress:(age-n.approachUntil)/(n.shaftUntil-n.approachUntil),scale:.05};
 if(age<n.emergeUntil){const progress=(age-n.shaftUntil)/(n.emergeUntil-n.shaftUntil);return{habitat:'sulfur-emergence',progress,scale:.05+.01*progress};}
 const progress=Math.max(0,Math.min(1,(age-n.emergeUntil)/(n.matureAt-n.emergeUntil)));
 return{habitat:'sulfuric-land',progress,scale:.06+.94*progress};
}
