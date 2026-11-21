import { ADULT_SQUID_MOUTH_LOCAL } from './adult-squid-anatomy.js';

/** Juvenile drawing shares adult anchors while retaining its spherical physics
 * head, rear siphons and eight original tentacle sockets. */
export const JUVENILE_SQUID_RADIUS_SCALE = .90;
export const JUVENILE_SQUID_HEAD_Y_SCALE = 1.12;
export const JUVENILE_SQUID_HEAD_SIDE_RATIO = .92;
export const JUVENILE_SQUID_EYE_SCALE = 1.4;
// Separate the larger lenses and black rims while keeping the adult side columns.
export const JUVENILE_SQUID_EYE_LAYOUT = Object.freeze([
  Object.freeze([-.50, .43]), Object.freeze([.50, .43]),
  Object.freeze([-.50, -.02]), Object.freeze([.50, -.02]),
]);
export const JUVENILE_SQUID_MOUTH_LOCAL = ADULT_SQUID_MOUTH_LOCAL;
