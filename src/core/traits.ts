import { trait } from 'koota';

export const Time = trait({ last: 0, delta: 0 });
export const Pointer = trait({ x: 0, y: 0 });
export const Viewport = trait({ width: 0, height: 0 });

export const DeskItem = trait({ id: '' });

export const Position = trait({ x: 0, y: 0, z: 0 });
export const Rotation = trait({ x: 0, y: 0, z: 0 });
export const Scale = trait({ x: 1, y: 1, z: 1 });
export const Velocity = trait({ x: 0, y: 0 });

export const Dragging = trait({
  offset: () => ({ x: 0, y: 0 }),
});

export const ZIndex = trait({ value: 0 });
export const Ref = trait(() => null! as HTMLElement);
