import { relation, trait } from 'koota';
import { color } from '../../../color.js';
import { shade } from '../utils/color.js';

export const Time = trait({ last: 0, delta: 0 });
export const Pointer = trait({ x: 0, y: 0 });
export const Viewport = trait({ width: 0, height: 0 });
export const Camera = trait({ x: 720, y: 450, zoom: 0.8 });

export const DeskConfig = trait({
  /** Pixels. Off-screen throw margin. */
  wallGutter: 190,
  /** Pixels. */
  wallGutterMin: 48,
  /** Pixels. */
  wallGutterMax: 200,
  /** Meters above the desk plane where descending items join the resting stack layer. */
  restackThreshold: 0.01,
});

export const Desk = trait({
  /** Pixels. */
  wallGutter: 200,
  /** Meters. */
  restackThreshold: 0.02,
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

export const HEADPHONES_ASPECT_RATIO = 1646 / 731;

export const Headphones = trait({
  id: 'desk-headphones',
  fillColor: color.accent.sky,
  lineColor: shade(color.accent.sky, -132),
  /** Pixels. */
  width: 560,
  /** Pixels. */
  height: 249,
  /** Width-to-height ratio. */
  aspectRatio: HEADPHONES_ASPECT_RATIO,
  /** Meters. */
  thickness: 0.004,
});

export const Polaroid = trait({
  id: '',
  imageSrc: '',
  caption: '',
  /** Pixels. */
  width: 200,
  /** Pixels. */
  height: 240,
  /** Width-to-height ratio. */
  aspectRatio: 3.5 / 4.2,
  /** Meters. */
  thickness: 0.00035,
});

export const KinematicBody = trait({
  throwDamping: 0.35,
  /** Meters per second. */
  maxThrowSpeed: 0.6,
  /** Unitless coefficient of kinetic friction. */
  friction: 0.2,
  /** Meters per second. */
  stopSpeed: 0.01,
  /** Meters (thickness along Z for mesh and support offset). */
  depth: 0,
  /** Arbitrary mass unit for 2D desk collisions. */
  mass: 1,
});

export const BoundingBox = trait({ width: 0, height: 0 });
/** Meters. */
export const Position = trait({ x: 0, y: 0, z: 0 });
/** Degrees. */
export const Rotation = trait({ x: 0, y: 0, z: 0 });
/** Meters per second. */
export const Velocity = trait({ x: 0, y: 0, z: 0 });
/** Meters per second. */
export const AngularVelocity = trait({ x: 0, y: 0, z: 0 });

export const ArticleMotion = trait({
  /** Normalized sheet translation where 0 = open and 1 = below viewport. */
  progress: 0,
  /** Normalized progress per second. */
  velocity: 0,
});

export const Dragging = trait({
  /** Meters. */
  offset: () => ({ x: 0, y: 0 }),
  rotation: () => ({ x: 0, y: 0, z: 0 }),
  liftProgress: 0,
});

export type PolaroidFocusPhase = 'opening' | 'closing';

export const PolaroidFocusMotion = trait({
  phase: 'opening' as PolaroidFocusPhase,
  progress: 0,
  progressVelocity: 0,
  /** Meters. */
  fromPosition: () => ({ x: 0, y: 0, z: 0 }),
  /** Degrees. */
  fromRotation: () => ({ x: 0, y: 0, z: 0 }),
  /** Meters. */
  toPosition: () => ({ x: 0, y: 0, z: 0 }),
  /** Degrees. */
  toRotation: () => ({ x: 0, y: 0, z: 0 }),
  /** Meters per second. */
  positionVelocity: () => ({ x: 0, y: 0, z: 0 }),
  /** Degrees per second. */
  rotationVelocity: () => ({ x: 0, y: 0, z: 0 }),
  /** Meters. */
  curveOffset: 0,
  /** Degrees. */
  sideTilt: 0,
});

export const PolaroidFocusSpin = trait({
  pointerId: 0,
  /** CSS pixels. */
  origin: () => ({ x: 0, y: 0 }),
  /** Degrees. */
  rotation: () => ({ x: 0, y: 0, z: 0 }),
});

export const Pressed = trait({
  pointerId: 0,
  /** CSS pixels. */
  origin: () => ({ x: 0, y: 0 }),
  /** Meters. */
  offset: () => ({ x: 0, y: 0 }),
  rotation: () => ({ x: 0, y: 0, z: 0 }),
});

export const Selected = trait();

export const IsControlled = trait();
export const IsStackable = trait();
export const IsOpen = trait();
export const IsOffScreen = trait();
export const IsEnteringDesk = trait();
export const IsPreloading = trait();
export const IsResting = trait();
export const IsBoundary = trait();
export const ActiveSlug = trait({ slug: '' });
export const ArticleOf = relation({ exclusive: true, autoDestroy: 'orphan' });
export const StackIndex = trait({ value: 0 });
export const Ref = trait(() => null! as HTMLElement);
