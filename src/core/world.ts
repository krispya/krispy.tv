import { createWorld } from 'koota';
import { Pointer, Time, Viewport } from './traits.js';

export function createDeskWorld() {
  return createWorld(Time, Pointer, Viewport);
}
