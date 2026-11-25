import * as THREE from './vendor/three.module.js';

const NIGHT_HORIZON = new THREE.Color(0x101b34);
const NIGHT_WATER = new THREE.Color(0x031121);
const TWILIGHT_HORIZON = new THREE.Color(0x9e6c85);
const MOONLIGHT = new THREE.Color(0x98b9ef);
const NIGHT_FILL = new THREE.Color(0x758ebd);
const SUNSET_LIGHT = new THREE.Color(0xffa15f);

/** Grade the existing biome lighting after its daytime profile is restored.
 * Reuses all lights, colors and fog; caves retain their local illumination.
 * @param {{scene:THREE.Scene,ambient:THREE.HemisphereLight,keyLight:THREE.DirectionalLight}} view
 * @param {{daylight:number,twilight:number,night:number,sunY:number}} cycle
 * @param {boolean} [underwater]
 */
export function applyDayNightLighting(view, cycle, underwater = false) {
  const {daylight, twilight, night} = cycle;
  view.scene.background.lerp(underwater ? NIGHT_WATER : NIGHT_HORIZON, night)
    .lerp(TWILIGHT_HORIZON, twilight * (underwater ? .12 : .65));
  view.ambient.color.lerp(NIGHT_FILL, night * .8);
  view.ambient.intensity *= (underwater ? .18 : .24) + (underwater ? .82 : .76) * daylight;
  view.keyLight.color.lerp(SUNSET_LIGHT, twilight * .9).lerp(MOONLIGHT, night * (1 - twilight * .9));
  // Fade through zero while the one directional light hands off from sun to
  // moon at the horizon, so the opposite direction cannot flash lit faces.
  const horizon = THREE.MathUtils.smoothstep(Math.abs(cycle.sunY), 0, .08);
  view.keyLight.intensity *= (.12 + .88 * daylight) * horizon;
  view.scene.environmentIntensity *= .16 + .84 * daylight;
  view.scene.fog.color.copy(view.scene.background);
}
