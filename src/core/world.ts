import { createWorld } from 'koota';
import { Pointer, RouteState, Time, Viewport } from './traits.js';

export const world = createWorld(Time, Pointer, Viewport, RouteState);
