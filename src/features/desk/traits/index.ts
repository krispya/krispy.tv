import { relation, trait } from 'koota';
import { color } from '../../../color.js';

export const Time = trait({ last: 0, delta: 0 });
export const Pointer = trait({ x: 0, y: 0 });
export const Viewport = trait({ width: 0, height: 0 });

export const DeskConfig = trait({
  paperViewportScale: 0.5,
  /** Pixels. */
  paperMinWidth: 280,
  /** Pixels. */
  paperMaxWidth: 380,
  wallGutterPaperScale: 0.5,
  /** Pixels. */
  wallGutterMin: 48,
  /** Pixels. */
  wallGutterMax: 200,
});

export const Desk = trait({
  /** Pixels. */
  wallGutter: 200,
  wallBounce: 0.85,
  wallFriction: 0.68,
  lastThrowCol: -1,
});

export const Paper = trait({
  id: '',
  openable: true,
  color: color.surface.paper,
  /** Pixels. */
  width: 380,
  /** Pixels. */
  height: 380 / (8.5 / 11),
  /** Width-to-height ratio. */
  aspectRatio: 8.5 / 11,
  /** Meters. */
  thickness: 0.0001,
});

export const Book = trait({
  id: '',
  title: '',
  color: color.accent.sage,
  coverImage: '',
  /** Pixels. */
  width: 260,
  /** Pixels. */
  height: 390,
  pageCount: 200,
  /** Meters. */
  pageThickness: 0.0001,
  /** Meters. */
  coverThickness: 0.002,
});

export const KinematicBody = trait({
  throwDamping: 0.35,
  /** Meters per second. */
  maxThrowSpeed: 0.6,
  /** Unitless coefficient of kinetic friction. */
  friction: 0.2,
  /** Meters per second. */
  stopSpeed: 0.01,
  /** Pixels. */
  depth: 0,
  /** Arbitrary mass unit for 2D desk collisions. */
  mass: 1,
});

export const BoundingBox = trait({ width: 0, height: 0 });
export const Position = trait({ x: 0, y: 0, z: 0 });
export const Rotation = trait({ x: 0, y: 0, z: 0 });
export const Velocity = trait({ x: 0, y: 0, z: 0 });
export const AngularVelocity = trait({ x: 0, y: 0, z: 0 });

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

export const IsStackable = trait();
export const IsOpen = trait();
export const IsOffScreen = trait();
export const IsEnteringDesk = trait();
export const IsPreloading = trait();
export const IsResting = trait();
export const ActiveSlug = trait({ slug: '' });
export const ArticleOf = relation({ exclusive: true, autoDestroy: 'orphan' });
export const StackIndex = trait({ value: 0 });
export const Ref = trait(() => null! as HTMLElement);
