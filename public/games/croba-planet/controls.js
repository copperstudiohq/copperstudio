/** @typedef {{yaw:number,pitch:number}} LookState */
/** @typedef {{x:number,y:number}} Movement */

const FULL_TURN = Math.PI * 2;
const MAX_PITCH = 1.25;
const DEFAULT_SENSITIVITY = 0.0025;

/** Keyboard turning speed in radians per second. */
export const TURN_SPEED = 1.8;

/** @returns {LookState} */
export function createLookState() {
  return { yaw: 0, pitch: -0.08 };
}

/** @param {number} angle @returns {number} */
function wrapYaw(angle) {
  return ((((angle + Math.PI) % FULL_TURN) + FULL_TURN) % FULL_TURN) - Math.PI;
}

/**
 * Update the view in place. Yaw zero faces north; positive pitch looks up.
 * Non-finite pointer values are ignored so a bad event cannot poison the view.
 * @param {LookState} look
 * @param {number} dx Pointer movement to the right, in pixels.
 * @param {number} dy Pointer movement down, in pixels.
 * @param {number} [sensitivity] Radians per pixel.
 * @returns {LookState} The same state object.
 */
export function rotateLook(look, dx, dy, sensitivity = DEFAULT_SENSITIVITY) {
  const factor =
    Number.isFinite(sensitivity) && sensitivity > 0
      ? sensitivity
      : DEFAULT_SENSITIVITY;
  const yawDelta = dx * factor;
  const pitchDelta = dy * factor;
  const yaw = Number.isFinite(look.yaw) ? look.yaw : 0;
  const pitch = Number.isFinite(look.pitch) ? look.pitch : -0.08;

  look.yaw = wrapYaw(
    wrapYaw(yaw) + (Number.isFinite(yawDelta) ? wrapYaw(yawDelta) : 0),
  );
  look.pitch = Math.max(
    -MAX_PITCH,
    Math.min(MAX_PITCH, pitch - (Number.isFinite(pitchDelta) ? pitchDelta : 0)),
  );
  return look;
}

/**
 * Convert local walking input into world x/y, preserving analog input below 1.
 * Positive strafe walks right; positive forward walks toward the current view.
 * @param {number} strafe
 * @param {number} forward
 * @param {number} yaw Radians, with zero looking along negative world y.
 * @returns {Movement}
 */
export function movementFromView(strafe, forward, yaw) {
  let right = Number.isFinite(strafe) ? strafe : 0;
  let ahead = Number.isFinite(forward) ? forward : 0;
  const angle = Number.isFinite(yaw) ? yaw : 0;

  // Scale first to avoid overflow even when synthetic input is extremely large.
  const largest = Math.max(1, Math.abs(right), Math.abs(ahead));
  right /= largest;
  ahead /= largest;
  const length = Math.max(1, Math.hypot(right, ahead));
  right /= length;
  ahead /= length;

  return {
    x: right * Math.cos(angle) + ahead * Math.sin(angle),
    y: right * Math.sin(angle) - ahead * Math.cos(angle),
  };
}

/** @typedef {'look'|'stick'|'up'|'down'|'left'|'right'|'ascend'|'dive'|'use'} TouchAction */
/** Independent pointer owners let both thumbs and action fingers work together. */
export class TouchInput {
  constructor() {
    /** @type {Map<number,{action:TouchAction,x:number,y:number,originX:number,originY:number}>} */
    this.pointers = new Map();
  }

  /** @param {TouchAction} action @param {number} id @param {number} [x] @param {number} [y] */
  begin(action, id, x = 0, y = 0) {
    if (!Number.isFinite(id) || this.pointers.has(id) ||
      ((action === "look" || action === "stick") && this.active(action))) return false;
    if (![x, y].every(Number.isFinite)) return false;
    this.pointers.set(id, { action, x, y, originX: x, originY: y });
    return true;
  }

  /** Return only the owning look finger's delta; stick movement remains independent. */
  move(id, x, y) {
    const pointer = this.pointers.get(id);
    if (!pointer || ![x, y].every(Number.isFinite)) return null;
    const delta = pointer.action === "look" ? { x: x - pointer.x, y: y - pointer.y } : null;
    pointer.x = x; pointer.y = y;
    return delta;
  }

  /** A stray cancel from another control must not release the actual owner. */
  release(action, id) {
    if (this.pointers.get(id)?.action !== action) return false;
    return this.pointers.delete(id);
  }

  active(action) {
    return [...this.pointers.values()].some((pointer) => pointer.action === action);
  }

  movement() {
    let strafe = Number(this.active("right")) - Number(this.active("left"));
    let forward = Number(this.active("up")) - Number(this.active("down"));
    const stick = [...this.pointers.values()].find((pointer) => pointer.action === "stick");
    if (stick) {
      const dx = stick.x - stick.originX, dy = stick.y - stick.originY;
      const distance = Math.hypot(dx, dy);
      const strength = Math.max(0, Math.min(1, (distance - 6) / 42));
      if (distance > 0) { strafe += dx / distance * strength; forward -= dy / distance * strength; }
    }
    return { strafe, forward };
  }

  clear() { this.pointers.clear(); }
}
