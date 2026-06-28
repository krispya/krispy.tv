import { relation, trait } from 'koota';
import { color } from '../../../color.js';
import { inchesToDeskPixels, US_LETTER_INCHES } from '../utils/dimensions.js';

/**
 * Scene render lifecycle. Asset fetch/decode suspends in React before the
 * world exists, so the world starts at `warming`: the scene is mounted behind
 * the boot screen while the GPU rasterizes layers and uploads textures.
 * `ready` = frames are stable and the scene can go live.
 */
export type ScenePhase = 'warming' | 'ready';
export const Scene = trait({ phase: 'warming' as ScenePhase });

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
  lineColor: color.line.ink,
  /** Pixels. */
  width: inchesToDeskPixels(US_LETTER_INCHES.width),
  /** Pixels. */
  height: inchesToDeskPixels(US_LETTER_INCHES.height),
  /** Width-to-height ratio. */
  aspectRatio: US_LETTER_INCHES.width / US_LETTER_INCHES.height,
  /** Meters. */
  thickness: 0.0001,
});

export type BookStickyNote = {
  text?: string;
  color?: string;
  /** Degrees. */
  rotation?: number;
};

export const Book = trait({
  id: '',
  title: '',
  author: '',
  color: color.accent.sage,
  coverImage: '',
  backCoverImage: '',
  spineImage: '',
  /** Pixels. */
  width: 260,
  /** Pixels. */
  height: 390,
  pageCount: 200,
  /** Meters. */
  pageThickness: 0.0001,
  /** Meters. */
  coverThickness: 0.002,
  hasStickyNote: false,
  stickyNoteText: '',
  stickyNoteColor: '',
  /** Degrees. */
  stickyNoteRotation: 0,
});

export const HEADPHONES_ASPECT_RATIO = 1646 / 731;

export const Headphones = trait({
  id: 'desk-headphones',
  fillColor: color.accent.sky,
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
  captionImageSrc: '',
  captionImageAlt: '',
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
  /** Meters per second. Previous frame's drag velocity, for acceleration. */
  lastVelocity: () => ({ x: 0, y: 0 }),
  /** Degrees. Inertial tilt spring state. */
  tilt: () => ({ x: 0, y: 0 }),
  /** Degrees per second. */
  tiltVelocity: () => ({ x: 0, y: 0 }),
});

export const FocusableItem = trait({
  focusedScale: 1.34,
  /** Meters. */
  targetZ: 0.26,
  /** Meters. */
  curveOffset: 0.055,
  /** Degrees. */
  targetRotationX: -4,
  /** Degrees. */
  targetRotationY: 5,
  /** Degrees. */
  targetRotationZ: 3,
  sideVelocityScale: 10,
  /** Meters per second. */
  upwardVelocity: 0.48,
  /** Degrees per second. */
  rotationXVelocity: -120,
  /** Degrees per second. */
  rotationYVelocity: 80,
  /** Degrees per CSS pixel. */
  spinRotationYPerPx: 0.55,
  /** Degrees per CSS pixel. */
  spinRotationXPerPx: 0.12,
  /** Degrees. */
  spinRotationXMin: -18,
  /** Degrees. */
  spinRotationXMax: 12,
  spinTouchSensitivity: 2.5,
  spinVelocityScale: 1,
  /** Degrees per second. */
  spinMaxVelocityDeg: 750,
  /** Milliseconds. */
  spinMinDeltaMs: 8,
});

export type ItemFocusPhase = 'opening' | 'closing';

export const ItemFocusMotion = trait({
  phase: 'opening' as ItemFocusPhase,
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

export const ItemFocusSpin = trait({
  pointerId: 0,
  pointerType: 'mouse',
  /** CSS pixels. */
  lastClient: () => ({ x: 0, y: 0 }),
  lastTimeMs: 0,
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
export const IsDroppedFromDragging = trait();
export const IsFocused = trait();
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
