import { trait } from 'koota';

export const Time = trait({ last: 0, delta: 0 });
export const Pointer = trait({ x: 0, y: 0 });
export const Viewport = trait({ width: 0, height: 0 });

export const Desk = trait({
  wallBuffer: 96,
  wallBounce: 0.45,
  wallFriction: 0.68,
});

export const Position = trait({ x: 0, y: 0, z: 0 });
export const Rotation = trait({ x: 0, y: 0, z: 0 });
export const Velocity = trait({ x: 0, y: 0, z: 0 });
export const AngularVelocity = trait({ x: 0, y: 0, z: 0 });
export const Paper = trait({
  id: '',
  openable: true,
  color: '#fffdf7',
  /** Meters. */
  thickness: 0,
});
export const PaperPhysics = trait({
  throwDamping: 0,
  /** Meters per second. */
  maxThrowSpeed: 0,
  /** Unitless coefficient of kinetic friction. */
  friction: 0,
  /** Meters per second. */
  stopSpeed: 0,
});

export const Dragging = trait({
  offset: () => ({ x: 0, y: 0 }),
  rotation: () => ({ x: 0, y: 0, z: 0 }),
  liftProgress: 0,
});

export const Pressed = trait({
  pointerId: 0,
  origin: () => ({ x: 0, y: 0 }),
  offset: () => ({ x: 0, y: 0 }),
  rotation: () => ({ x: 0, y: 0, z: 0 }),
});

export const Selected = trait();

export const IsEnteringDesk = trait();
export const StackIndex = trait({ value: 0 });
export const Ref = trait(() => null! as HTMLElement);
