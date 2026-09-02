import { createActions, Not, type Entity } from 'koota';
import { color } from '../../color.js';
import {
  AngularVelocity,
  Book,
  type BookFoldedPaper,
  type BookStickyNote,
  BoundingBox,
  Desk,
  DeskConfig,
  Dragging,
  FocusableItem,
  FoldedPaperMotion,
  HEADPHONES_ASPECT_RATIO,
  Headphones,
  IsBoundary,
  IsControlled,
  IsDroppedFromDragging,
  IsEnteringDesk,
  IsFocused,
  IsOffScreen,
  IsOpen,
  IsResting,
  ItemFocusMotion,
  ItemFocusSpin,
  KinematicBody,
  MousePad,
  Paper,
  Polaroid,
  Position,
  Pressed,
  Rotation,
  Selected,
  IsStackable,
  StackIndex,
  Velocity,
} from './traits/index.js';
import { getBookDepthMeters } from './utils/resting-height.js';
import { clamp, randomInRange } from './utils/math.js';
import { getVisibleDeskRectForWorld, type VisibleDeskRect } from './utils/camera.js';
import {
  getNextStackIndex,
  getStackIndexedItems,
  renumberStackIndices,
} from './utils/stack-order.js';
import {
  cssPixelsToMeters,
  GRAVITY_METERS_PER_SECOND_SQUARED,
  metersToCssPixels,
} from './utils/physics-units.js';
import { getDeskBarrierOverflow } from './utils/visible-desk-barrier.js';
import { isFoldedPaperOut } from './utils/folded-paper.js';

const HEADPHONES_CORNER_OVERLAP_X_PX = 62;
const HEADPHONES_CORNER_OVERLAP_Y_PX = 26;
const HEADPHONES_MASS = 120;
/** How far the mouse pad tucks past the bottom-right corner of the visible desk. */
const MOUSE_PAD_CORNER_OVERLAP_X_PX = 40;
const MOUSE_PAD_CORNER_OVERLAP_Y_PX = 48;
/**
 * Cluster radius for a constrained axis, as a fraction of the visible
 * dimension. Smaller = tighter grouping around the target anchor. Sampling is
 * center-biased, so landings concentrate well inside this radius.
 */
const TARGET_RADIUS_RATIO = 0.1;
/**
 * Window aspect the base cluster radius is tuned for. A `'center'` target
 * widens along whichever axis the window is longer than this, so the toss
 * covers a wide or tall window instead of bunching at its midpoint.
 */
const TARGET_REFERENCE_ASPECT = 1440 / 900;
const QUADRANT_CORNER_TARGET_INSET_PX = 28;
/** Fraction of the visible width the entry point is offset toward center for a diagonal arc. */
const QUADRANT_ENTRY_OFFSET_RATIO = 0.1;
/** Friction fallback when a body's coefficient is unavailable. */
const DEFAULT_THROW_FRICTION = 0.2;
/**
 * Fraction of the visible width a `'left-wall'` toss aims past the wall. The
 * slide would stop this far beyond the barrier, so the item always reaches it
 * with speed to spare and bounces off. Larger = harder hit.
 */
const WALL_HIT_OVERSHOOT_RATIO = 0.15;
/** Fraction of the visible width a `'left-wall'` toss enters from, so it approaches diagonally. */
const WALL_HIT_ENTRY_OFFSET_RATIO = 0.3;

/**
 * Triangular random in [-1, 1] peaked at 0 (sum of two uniforms). Used to bias
 * aimed landings toward their anchor so they cluster within a radius rather than
 * spreading uniformly across a band.
 */
function centerBiasedUnit() {
  return Math.random() + Math.random() - 1;
}

/**
 * Cluster radius for a `'center'` target. Starts from the base ratio of the
 * visible size, then grows by half of whatever the window extends past the
 * reference aspect on that axis, so the cluster stretches to cover the extra
 * width of a wide window (or the extra height of a tall one).
 */
function getCenterClusterRadius(visibleRect: VisibleDeskRect) {
  const referenceWidth = visibleRect.height * TARGET_REFERENCE_ASPECT;
  const referenceHeight = visibleRect.width / TARGET_REFERENCE_ASPECT;
  const excessWidth = Math.max(0, visibleRect.width - referenceWidth);
  const excessHeight = Math.max(0, visibleRect.height - referenceHeight);

  return {
    x: (visibleRect.width - excessWidth) * TARGET_RADIUS_RATIO + excessWidth / 2,
    y: (visibleRect.height - excessHeight) * TARGET_RADIUS_RATIO + excessHeight / 2,
  };
}

type DeskConfigOverrides = Partial<{
  barrierOverflowRatio: number;
  restackThreshold: number;
}>;

type KinematicBodyConfig = Partial<{
  throwDamping: number;
  maxThrowSpeed: number;
  friction: number;
  stopSpeed: number;
  mass: number;
}>;

export type DeskQuadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * A quadrant corner, a half-side where the cross-axis spans the full desk,
 * `'center'` which clusters at the desk midpoint on both axes, `'spread'`
 * which scatters uniformly across the whole desk, or `'left-wall'` which aims
 * past the left barrier so the item hits it and bounces back.
 */
export type DeskThrowTarget =
  DeskQuadrant | 'left' | 'right' | 'top' | 'bottom' | 'center' | 'spread' | 'left-wall';

type ThrowOntoDeskConfig = {
  centered?: boolean;
  target?: DeskThrowTarget;
};

export type PaperConfig = {
  id: string;
  openable?: boolean;
  sketchable?: boolean;
  color?: string;
  lineColor?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  centered?: boolean;
  thickness?: number;
  physics?: KinematicBodyConfig;
};

export type BookConfig = {
  id: string;
  title?: string;
  author?: string;
  color?: string;
  coverImage?: string;
  backCoverImage?: string;
  spineImage?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  centered?: boolean;
  pageCount?: number;
  pageThickness?: number;
  coverThickness?: number;
  stickyNote?: BookStickyNote;
  foldedPaper?: BookFoldedPaper;
  physics?: KinematicBodyConfig;
};

export type HeadphonesConfig = {
  id?: string;
  fillColor?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  thickness?: number;
  rotation?: number;
  cornerOverlapX?: number;
  cornerOverlapY?: number;
  physics?: KinematicBodyConfig;
};

export type MousePadConfig = {
  id?: string;
  fillColor?: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
  thickness?: number;
  /** Degrees. */
  rotation?: number;
  cornerOverlapX?: number;
  cornerOverlapY?: number;
};

export type PolaroidConfig = {
  id: string;
  imageSrc: string;
  caption?: string;
  captionImageSrc?: string;
  captionImageAlt?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  centered?: boolean;
  thickness?: number;
  physics?: KinematicBodyConfig;
};

function getOffScreenThrowPosition(
  width: number,
  height: number,
  config: ThrowOntoDeskConfig,
  visibleRect: VisibleDeskRect,
  barrierOverflowRatio: number
) {
  const entryDistance = Math.max(24, getDeskBarrierOverflow(height, barrierOverflowRatio));

  return {
    x: cssPixelsToMeters(
      config.centered
        ? visibleRect.x + visibleRect.width / 2
        : randomInRange(visibleRect.x + width * 0.5, visibleRect.right - width * 0.5)
    ),
    y: cssPixelsToMeters(visibleRect.bottom + height / 2 + randomInRange(24, entryDistance)),
    z: randomInRange(0.055, 0.09),
  };
}

function getThrowRotation(centered?: boolean) {
  return {
    x: 0,
    y: 0,
    z: centered ? randomInRange(-4, 4) : randomInRange(-28, 28),
  };
}

/**
 * Solves an aimed toss toward a desk corner or half-side. In this sim `x`/`y`
 * are the desk plane and `z` is a small hop, so an item slides to rest under
 * constant friction (`dampVelocity`) rather than falling onto a spot. The launch
 * speed therefore comes from the friction stopping-distance relation
 * `v = sqrt(2·a·d)`, which is viewport-independent and keeps the toss at a
 * natural pace.
 *
 * The item is re-entered just below the target band (offset toward center for a
 * natural diagonal arc) so the slide distance — and thus the speed — stays
 * consistent no matter where it spawned horizontally. A target that omits a
 * horizontal or vertical edge (e.g. `'right'`) spans that axis fully, so the
 * landing varies freely along it.
 *
 * `'left-wall'` aims at a point past the left barrier from an entry well to
 * its right, so the solved speed carries the item into the wall on a diagonal
 * and it rebounds toward the vertical middle.
 */
function getTargetedThrow(
  position: { x: number; y: number; z: number },
  target: DeskThrowTarget,
  visibleRect: VisibleDeskRect,
  box?: { width: number; height: number },
  friction = DEFAULT_THROW_FRICTION
) {
  const halfWidth = (box?.width ?? 0) / 2;
  const halfHeight = (box?.height ?? 0) / 2;
  const insetX = Math.max(QUADRANT_CORNER_TARGET_INSET_PX, halfWidth);
  const insetY = Math.max(QUADRANT_CORNER_TARGET_INSET_PX, halfHeight);
  const centerRadius = getCenterClusterRadius(visibleRect);
  const minVisibleX = visibleRect.x + insetX;
  const maxVisibleX = visibleRect.right - insetX;
  const minVisibleY = visibleRect.y + insetY;
  const maxVisibleY = visibleRect.bottom - insetY;
  const aimsAtWall = target === 'left-wall';
  const horizontal =
    target === 'center'
      ? 'center'
      : target.includes('left')
        ? 'left'
        : target.includes('right')
          ? 'right'
          : 'full';
  const vertical =
    target === 'center' || aimsAtWall
      ? 'center'
      : target.includes('top')
        ? 'top'
        : target.includes('bottom')
          ? 'bottom'
          : 'full';

  // A constrained axis clusters within a radius around its anchor (an edge or
  // the midpoint); a `full` axis spreads uniformly so its landing varies freely.
  // Edge anchors keep the base radius so corners stay tight; the midpoint uses
  // the aspect-aware radius so a wide or tall window still gets covered.
  const radiusX = horizontal === 'center' ? centerRadius.x : visibleRect.width * TARGET_RADIUS_RATIO;
  const radiusY = vertical === 'center' ? centerRadius.y : visibleRect.height * TARGET_RADIUS_RATIO;
  const anchorX =
    horizontal === 'left'
      ? minVisibleX + radiusX
      : horizontal === 'right'
        ? maxVisibleX - radiusX
        : (minVisibleX + maxVisibleX) / 2;
  const anchorY =
    vertical === 'top'
      ? minVisibleY + radiusY
      : vertical === 'bottom'
        ? maxVisibleY - radiusY
        : (minVisibleY + maxVisibleY) / 2;
  const targetXpx = aimsAtWall
    ? minVisibleX - visibleRect.width * WALL_HIT_OVERSHOOT_RATIO
    : horizontal === 'full'
      ? randomInRange(minVisibleX, maxVisibleX)
      : clamp(anchorX + centerBiasedUnit() * radiusX, minVisibleX, maxVisibleX);
  const targetYpx =
    vertical === 'full'
      ? randomInRange(minVisibleY, maxVisibleY)
      : clamp(anchorY + centerBiasedUnit() * radiusY, minVisibleY, maxVisibleY);

  const entryOffsetPx = visibleRect.width * QUADRANT_ENTRY_OFFSET_RATIO;
  const entryShiftPx =
    horizontal === 'right' ? -entryOffsetPx : horizontal === 'left' ? entryOffsetPx : 0;
  const entryXpx = aimsAtWall
    ? clamp(minVisibleX + visibleRect.width * WALL_HIT_ENTRY_OFFSET_RATIO, minVisibleX, maxVisibleX)
    : clamp(targetXpx + entryShiftPx, minVisibleX, maxVisibleX);

  const targetX = cssPixelsToMeters(targetXpx);
  const targetY = cssPixelsToMeters(targetYpx);
  const entryX = cssPixelsToMeters(entryXpx);

  const dx = targetX - entryX;
  const dy = targetY - position.y;
  const distance = Math.max(Math.hypot(dx, dy), 1e-6);
  const decel = Math.max(friction, 0.05) * GRAVITY_METERS_PER_SECOND_SQUARED;
  const speed = Math.sqrt(2 * decel * distance) * randomInRange(0.98, 1.06);

  return {
    entryX,
    velocity: {
      x: (dx / distance) * speed,
      y: (dy / distance) * speed,
    },
  };
}

function getStableFocusSign(id: string) {
  let hash = 0;

  for (let index = 0; index < id.length; index++) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }

  return hash % 2 === 0 ? 1 : -1;
}

function getFocusItemId(entity: Entity) {
  return entity.get(Polaroid)?.id ?? entity.get(Book)?.id ?? String(entity.id());
}

function getItemFocusTarget(entity: Entity, visibleRect: VisibleDeskRect) {
  const focusable = entity.get(FocusableItem);
  const position = entity.get(Position) ?? { x: 0, y: 0, z: 0 };
  const centerX = cssPixelsToMeters(visibleRect.x + visibleRect.width / 2);
  const centerY = cssPixelsToMeters(visibleRect.y + visibleRect.height / 2);
  const sourceSide = position.x < centerX ? -1 : 1;
  const stableSign = getStableFocusSign(getFocusItemId(entity));
  const sideTilt = (focusable?.targetRotationY ?? 0) * -sourceSide;

  return {
    position: {
      x: centerX,
      y: centerY,
      z: focusable?.targetZ ?? 0,
    },
    rotation: {
      x: focusable?.targetRotationX ?? 0,
      y: sideTilt,
      z: (focusable?.targetRotationZ ?? 0) * stableSign,
    },
    curveOffset: (focusable?.curveOffset ?? 0) * stableSign,
    sideTilt,
  };
}

function getHeadphonesSize(config: HeadphonesConfig) {
  const aspectRatio = config.aspectRatio ?? HEADPHONES_ASPECT_RATIO;
  const width =
    config.width ?? (config.height !== undefined ? config.height * aspectRatio : undefined);
  const height = config.height ?? (width !== undefined ? width / aspectRatio : undefined);

  return { aspectRatio, width, height };
}

export const actions = createActions((world) => ({
  spawnDesk: (config: DeskConfigOverrides = {}) => {
    const deskEntity = world.spawn(Desk, DeskConfig(config));
    const resolved = deskEntity.get(DeskConfig);
    if (resolved) {
      deskEntity.set(Desk, {
        barrierOverflowRatio: resolved.barrierOverflowRatio,
        restackThreshold: Math.max(0, resolved.restackThreshold),
      });
    }
    return deskEntity;
  },

  spawnPaper: (config: PaperConfig) => {
    const desk = world.queryFirst(Desk)?.get(Desk);
    if (!desk) throw new Error('spawnPaper requires a Desk entity. Call spawnDesk() first.');

    const visibleRect = getVisibleDeskRectForWorld(world);

    const entity = world.spawn(
      Paper({
        id: config.id,
        ...(config.openable !== undefined && { openable: config.openable }),
        ...(config.sketchable !== undefined && { sketchable: config.sketchable }),
        color:
          config.color ??
          (config.openable === false ? color.surface.paper : color.surface.articlePaper),
        ...(config.lineColor !== undefined && { lineColor: config.lineColor }),
        ...(config.width !== undefined && { width: config.width }),
        ...(config.height !== undefined && { height: config.height }),
        ...(config.aspectRatio !== undefined && { aspectRatio: config.aspectRatio }),
        ...(config.thickness !== undefined && { thickness: config.thickness }),
      }),
      Rotation(getThrowRotation(config.centered)),
      Velocity,
      AngularVelocity,
      IsStackable,
      StackIndex({ value: getNextStackIndex(world) })
    );

    const paper = entity.get(Paper)!;
    entity.add(BoundingBox({ width: paper.width, height: paper.height }));
    entity.add(KinematicBody({ mass: 1, ...config.physics, depth: paper.thickness }));
    entity.add(
      Position(
        getOffScreenThrowPosition(
          paper.width,
          paper.height,
          config,
          visibleRect,
          desk.barrierOverflowRatio
        )
      )
    );

    return entity;
  },

  spawnBook: (config: BookConfig) => {
    const desk = world.queryFirst(Desk)?.get(Desk);
    if (!desk) throw new Error('spawnBook requires a Desk entity. Call spawnDesk() first.');

    const visibleRect = getVisibleDeskRectForWorld(world);

    const entity = world.spawn(
      Book({
        id: config.id,
        ...(config.title !== undefined && { title: config.title }),
        ...(config.author !== undefined && { author: config.author }),
        ...(config.color !== undefined && { color: config.color }),
        ...(config.coverImage !== undefined && { coverImage: config.coverImage }),
        ...(config.backCoverImage !== undefined && { backCoverImage: config.backCoverImage }),
        ...(config.spineImage !== undefined && { spineImage: config.spineImage }),
        ...(config.width !== undefined && { width: config.width }),
        ...(config.height !== undefined && { height: config.height }),
        ...(config.pageCount !== undefined && { pageCount: config.pageCount }),
        ...(config.pageThickness !== undefined && { pageThickness: config.pageThickness }),
        ...(config.coverThickness !== undefined && { coverThickness: config.coverThickness }),
        ...(config.stickyNote !== undefined && {
          hasStickyNote: true,
          stickyNoteText: config.stickyNote.text ?? '',
          stickyNoteImage: config.stickyNote.image ?? '',
          stickyNoteColor: config.stickyNote.color ?? '',
          stickyNoteRotation: config.stickyNote.rotation ?? -7,
        }),
        ...(config.foldedPaper !== undefined && {
          hasFoldedPaper: true,
          foldedPaperColor: config.foldedPaper.color ?? '',
          foldedPaperPageFraction: clamp(config.foldedPaper.pageFraction ?? 0.5, 0, 1),
          foldedPaperOverhang: config.foldedPaper.overhang ?? 4,
          foldedPaperRotation: config.foldedPaper.rotation ?? 0,
          foldedPaperText: (config.foldedPaper.text ?? []).join('\n'),
        }),
      }),
      Rotation(getThrowRotation(config.centered)),
      Velocity,
      AngularVelocity,
      FocusableItem,
      StackIndex({ value: getNextStackIndex(world) })
    );

    const book = entity.get(Book)!;
    entity.add(BoundingBox({ width: book.width, height: book.height }));
    entity.add(
      Position(
        getOffScreenThrowPosition(
          book.width,
          book.height,
          config,
          visibleRect,
          desk.barrierOverflowRatio
        )
      )
    );
    entity.add(KinematicBody({ mass: 8, ...config.physics, depth: getBookDepthMeters(book) }));

    return entity;
  },

  spawnHeadphones: (config: HeadphonesConfig = {}) => {
    const visibleRect = getVisibleDeskRectForWorld(world);
    const headphonesSize = getHeadphonesSize(config);

    const entity = world.spawn(
      Headphones({
        ...(config.id !== undefined && { id: config.id }),
        ...(config.fillColor !== undefined && { fillColor: config.fillColor }),
        ...(headphonesSize.width !== undefined && { width: headphonesSize.width }),
        ...(headphonesSize.height !== undefined && { height: headphonesSize.height }),
        aspectRatio: headphonesSize.aspectRatio,
        ...(config.thickness !== undefined && { thickness: config.thickness }),
      }),
      Rotation({ x: 0, y: 0, z: config.rotation ?? -14 }),
      Velocity,
      AngularVelocity,
      StackIndex({ value: getNextStackIndex(world) }),
      IsBoundary,
      IsResting
    );

    const headphones = entity.get(Headphones)!;
    const cornerOverlapX = config.cornerOverlapX ?? HEADPHONES_CORNER_OVERLAP_X_PX;
    const cornerOverlapY = config.cornerOverlapY ?? HEADPHONES_CORNER_OVERLAP_Y_PX;
    entity.add(BoundingBox({ width: headphones.width, height: headphones.height }));
    entity.add(
      Position({
        x: cssPixelsToMeters(visibleRect.x + headphones.width / 2 - cornerOverlapX),
        y: cssPixelsToMeters(visibleRect.y + headphones.height / 2 - cornerOverlapY),
        z: 0,
      })
    );
    entity.add(
      KinematicBody({
        mass: HEADPHONES_MASS,
        friction: 0.72,
        stopSpeed: 0,
        ...config.physics,
        depth: headphones.thickness,
      })
    );

    return entity;
  },

  /**
   * Inert decoration: no kinematic body or stack index, so items slide over it
   * and it never joins collisions or restacking. Anchored to the bottom-right
   * corner of the visible desk at spawn.
   */
  spawnMousePad: (config: MousePadConfig = {}) => {
    const visibleRect = getVisibleDeskRectForWorld(world);

    const entity = world.spawn(
      MousePad({
        ...(config.id !== undefined && { id: config.id }),
        ...(config.fillColor !== undefined && { fillColor: config.fillColor }),
        ...(config.width !== undefined && { width: config.width }),
        ...(config.height !== undefined && { height: config.height }),
        ...(config.cornerRadius !== undefined && { cornerRadius: config.cornerRadius }),
        ...(config.thickness !== undefined && { thickness: config.thickness }),
      }),
      Rotation({ x: 0, y: 0, z: config.rotation ?? 4 })
    );

    const mousePad = entity.get(MousePad)!;
    const cornerOverlapX = config.cornerOverlapX ?? MOUSE_PAD_CORNER_OVERLAP_X_PX;
    const cornerOverlapY = config.cornerOverlapY ?? MOUSE_PAD_CORNER_OVERLAP_Y_PX;
    entity.add(BoundingBox({ width: mousePad.width, height: mousePad.height }));
    entity.add(
      Position({
        x: cssPixelsToMeters(visibleRect.right - mousePad.width / 2 + cornerOverlapX),
        y: cssPixelsToMeters(visibleRect.bottom - mousePad.height / 2 + cornerOverlapY),
        z: 0,
      })
    );

    return entity;
  },

  spawnPolaroid: (config: PolaroidConfig) => {
    const desk = world.queryFirst(Desk)?.get(Desk);
    if (!desk) throw new Error('spawnPolaroid requires a Desk entity. Call spawnDesk() first.');

    const visibleRect = getVisibleDeskRectForWorld(world);

    const entity = world.spawn(
      Polaroid({
        id: config.id,
        imageSrc: config.imageSrc,
        ...(config.caption !== undefined && { caption: config.caption }),
        ...(config.captionImageSrc !== undefined && { captionImageSrc: config.captionImageSrc }),
        ...(config.captionImageAlt !== undefined && { captionImageAlt: config.captionImageAlt }),
        ...(config.width !== undefined && { width: config.width }),
        ...(config.height !== undefined && { height: config.height }),
        ...(config.aspectRatio !== undefined && { aspectRatio: config.aspectRatio }),
        ...(config.thickness !== undefined && { thickness: config.thickness }),
      }),
      Rotation(getThrowRotation(config.centered)),
      Velocity,
      AngularVelocity,
      FocusableItem,
      StackIndex({ value: getNextStackIndex(world) }),
      IsStackable
    );

    const polaroid = entity.get(Polaroid)!;
    entity.add(BoundingBox({ width: polaroid.width, height: polaroid.height }));
    entity.add(
      Position(
        getOffScreenThrowPosition(
          polaroid.width,
          polaroid.height,
          config,
          visibleRect,
          desk.barrierOverflowRatio
        )
      )
    );
    entity.add(KinematicBody({ mass: 2, ...config.physics, depth: polaroid.thickness }));

    return entity;
  },

  throwOntoDesk: (entity: Entity, config: ThrowOntoDeskConfig = {}) => {
    const launchAngle = config.centered ? 0 : randomInRange(-0.42, 0.42);
    const launchSpeed = config.centered ? randomInRange(0.78, 0.84) : randomInRange(0.75, 0.95);
    const spinDir = Math.random() < 0.5 ? -1 : 1;
    const position = entity.get(Position);
    const targetedThrow =
      position && config.target && !config.centered
        ? getTargetedThrow(
            position,
            config.target,
            getVisibleDeskRectForWorld(world),
            entity.get(BoundingBox),
            entity.get(KinematicBody)?.friction
          )
        : undefined;

    // Re-enter under the target band so the slide distance stays consistent.
    if (targetedThrow && position) {
      entity.set(Position, { x: targetedThrow.entryX, y: position.y, z: position.z });
    }

    entity.set(Velocity, {
      x: targetedThrow?.velocity.x ?? Math.sin(launchAngle) * launchSpeed,
      y: targetedThrow?.velocity.y ?? -Math.cos(launchAngle) * launchSpeed,
      z: config.centered ? randomInRange(0.14, 0.16) : randomInRange(0.12, 0.22),
    });

    entity.set(AngularVelocity, {
      x: config.centered ? randomInRange(-2, 2) : randomInRange(-12, 12),
      y: config.centered ? randomInRange(-2, 2) : randomInRange(-12, 12),
      z: spinDir * (config.centered ? randomInRange(6, 12) : randomInRange(22, 50)),
    });

    entity.remove(IsResting);
    entity.add(IsEnteringDesk);
  },

  raiseDeskItem: (entity: Entity) => {
    const items = getStackIndexedItems(world);

    const entityIndex = items.findIndex((item) => item.entity === entity);
    if (entityIndex === -1) return;

    const [raisedItem] = items.splice(entityIndex, 1);
    items.push(raisedItem);

    renumberStackIndices(items);
  },

  focusItem: (entity: Entity) => {
    const focusable = entity.get(FocusableItem);
    const position = entity.get(Position);
    const rotation = entity.get(Rotation);
    if (!focusable || !position || !rotation) return;

    world.query(IsFocused, ItemFocusMotion).forEach((candidate) => {
      if (candidate === entity) return;

      const candidateMotion = candidate.get(ItemFocusMotion);
      if (candidateMotion) {
        candidate.set(Position, {
          x: candidateMotion.fromPosition.x,
          y: candidateMotion.fromPosition.y,
          z: candidateMotion.fromPosition.z,
        });
        candidate.set(Rotation, {
          x: candidateMotion.fromRotation.x,
          y: candidateMotion.fromRotation.y,
          z: candidateMotion.fromRotation.z,
        });
      }

      candidate.remove(IsFocused, IsControlled, ItemFocusMotion, ItemFocusSpin, FoldedPaperMotion);
    });

    const target = getItemFocusTarget(entity, getVisibleDeskRectForWorld(world));

    entity.remove(Dragging, IsDroppedFromDragging, IsEnteringDesk, Pressed, Selected, IsResting);
    entity.set(Velocity, { x: 0, y: 0, z: 0 });
    entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
    entity.add(IsFocused, IsControlled);

    actions(world).raiseDeskItem(entity);
    entity.add(
      ItemFocusMotion({
        phase: 'opening',
        progress: 0,
        progressVelocity: 0,
        fromPosition: { x: position.x, y: position.y, z: position.z },
        fromRotation: { x: rotation.x, y: rotation.y, z: rotation.z },
        toPosition: target.position,
        toRotation: target.rotation,
        positionVelocity: {
          x: target.curveOffset * focusable.sideVelocityScale,
          y: 0,
          z: focusable.upwardVelocity,
        },
        rotationVelocity: {
          x: focusable.rotationXVelocity,
          y: Math.sign(target.sideTilt || 1) * focusable.rotationYVelocity,
          z: 0,
        },
        curveOffset: target.curveOffset,
        sideTilt: target.sideTilt,
      })
    );
  },

  closeFocusedItem: (entity: Entity) => {
    const focusable = entity.get(FocusableItem);
    const motion = entity.get(ItemFocusMotion);
    const position = entity.get(Position);
    const rotation = entity.get(Rotation);

    // A sheet pulled out of the book folds back in as the book returns.
    if (entity.get(FoldedPaperMotion)?.phase === 'opening') {
      entity.set(FoldedPaperMotion, { phase: 'closing' });
    }

    if (!focusable || !motion || !position || !rotation) {
      entity.remove(IsFocused, IsControlled, ItemFocusMotion, ItemFocusSpin);
      return;
    }

    if (motion.phase === 'closing') return;

    // Drop IsFocused as soon as the close starts so the backdrop can stop
    // blocking input. ItemFocusMotion + IsControlled keep physics out until
    // the close spring finishes or the user grabs the item.
    entity.remove(IsFocused, ItemFocusSpin);
    entity.set(Velocity, { x: 0, y: 0, z: 0 });
    entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
    entity.set(ItemFocusMotion, {
      phase: 'closing',
      progress: 1,
      progressVelocity: 0,
      fromPosition: { x: position.x, y: position.y, z: position.z },
      fromRotation: { x: rotation.x, y: rotation.y, z: rotation.z },
      toPosition: {
        x: motion.fromPosition.x,
        y: motion.fromPosition.y,
        z: motion.fromPosition.z,
      },
      toRotation: {
        x: motion.fromRotation.x,
        y: motion.fromRotation.y,
        z: motion.fromRotation.z,
      },
      positionVelocity: {
        x: motion.curveOffset * -focusable.sideVelocityScale * 0.35,
        y: 0,
        z: 0,
      },
      rotationVelocity: { x: 0, y: 0, z: 0 },
      curveOffset: motion.curveOffset * -0.45,
      sideTilt: motion.sideTilt,
    });
  },

  startItemFocusSpin: (
    entity: Entity,
    pointerId: number,
    x: number,
    y: number,
    timeMs: number,
    pointerType: string
  ) => {
    if (!entity.has(IsFocused)) return;
    // Rotation is locked while the folded letter is out.
    if (isFoldedPaperOut(entity)) return;

    const focusable = entity.get(FocusableItem);
    const rotation = entity.get(Rotation);
    const motion = entity.get(ItemFocusMotion);
    if (!focusable || !rotation || !motion || motion.phase === 'closing') return;

    const currentRotation = { x: rotation.x, y: rotation.y, z: rotation.z };

    entity.remove(Dragging, IsDroppedFromDragging, Pressed, Selected, IsResting);
    entity.add(IsControlled);
    entity.set(ItemFocusMotion, {
      ...motion,
      toRotation: currentRotation,
      rotationVelocity: { x: 0, y: 0, z: 0 },
    });
    entity.add(
      ItemFocusSpin({
        pointerId,
        pointerType,
        lastClient: { x, y },
        lastTimeMs: timeMs,
        rotation: currentRotation,
      })
    );
  },

  updateItemFocusSpin: (entity: Entity, pointerId: number, x: number, y: number, timeMs: number) => {
    const focusable = entity.get(FocusableItem);
    const spin = entity.get(ItemFocusSpin);
    const motion = entity.get(ItemFocusMotion);
    if (
      !focusable ||
      !spin ||
      !motion ||
      spin.pointerId !== pointerId ||
      motion.phase === 'closing'
    ) {
      return;
    }

    const dx = x - spin.lastClient.x;
    const dy = y - spin.lastClient.y;
    if (dx === 0 && dy === 0) return;

    const sensitivity = spin.pointerType === 'touch' ? focusable.spinTouchSensitivity : 1;
    const deltaRotationX = -dy * focusable.spinRotationXPerPx * sensitivity;
    const deltaRotationY = dx * focusable.spinRotationYPerPx * sensitivity;
    const nextRotation = {
      x: clamp(
        spin.rotation.x + deltaRotationX,
        focusable.spinRotationXMin,
        focusable.spinRotationXMax
      ),
      y: spin.rotation.y + deltaRotationY,
      z: spin.rotation.z,
    };

    const deltaMs = timeMs - spin.lastTimeMs;
    const nextRotationVelocity = { ...motion.rotationVelocity };

    if (deltaMs >= focusable.spinMinDeltaMs) {
      const deltaSeconds = deltaMs / 1000;
      nextRotationVelocity.x = clamp(
        (deltaRotationX / deltaSeconds) * focusable.spinVelocityScale,
        -focusable.spinMaxVelocityDeg,
        focusable.spinMaxVelocityDeg
      );
      nextRotationVelocity.y = clamp(
        (deltaRotationY / deltaSeconds) * focusable.spinVelocityScale,
        -focusable.spinMaxVelocityDeg,
        focusable.spinMaxVelocityDeg
      );
    }

    entity.set(ItemFocusSpin, {
      ...spin,
      lastClient: { x, y },
      lastTimeMs: timeMs,
      rotation: nextRotation,
    });
    entity.set(ItemFocusMotion, {
      ...motion,
      toRotation: nextRotation,
      rotationVelocity: nextRotationVelocity,
    });
  },

  endItemFocusSpin: (entity: Entity, pointerId: number) => {
    const spin = entity.get(ItemFocusSpin);
    if (!spin || spin.pointerId !== pointerId) return;

    entity.remove(ItemFocusSpin);
  },

  /**
   * Pulls the tucked sheet out of a book (focusing the book so it can be read)
   * or folds it back in if it is already out.
   */
  toggleFoldedPaper: (entity: Entity) => {
    const book = entity.get(Book);
    if (!book?.hasFoldedPaper) return;

    const motion = entity.get(FoldedPaperMotion);

    if (motion?.phase === 'opening') {
      entity.set(FoldedPaperMotion, { phase: 'closing' });
      return;
    }

    if (!entity.has(IsFocused)) actions(world).focusItem(entity);

    // Spinning is locked while the letter is out, and a spun book squares back
    // up to its neutral focus pose so the letter reads the right way round.
    const focusable = entity.get(FocusableItem);
    const focusMotion = entity.get(ItemFocusMotion);
    if (focusable && focusMotion && focusMotion.phase === 'opening') {
      entity.remove(ItemFocusSpin);
      entity.set(ItemFocusMotion, {
        ...focusMotion,
        toRotation: {
          x: focusable.targetRotationX,
          y: focusMotion.sideTilt,
          z: focusable.targetRotationZ * getStableFocusSign(getFocusItemId(entity)),
        },
      });
    }

    if (motion) {
      entity.set(FoldedPaperMotion, { phase: 'opening' });
      return;
    }

    entity.add(FoldedPaperMotion({ phase: 'opening', progress: 0, progressVelocity: 0 }));
  },

  closeFocusedItems: () => {
    world.query(IsFocused).forEach((entity) => {
      actions(world).closeFocusedItem(entity);
    });
  },

  getLeastCoveredX: (exclude?: Entity) => {
    const visibleRect = getVisibleDeskRectForWorld(world);
    const desk = world.queryFirst(Desk)?.get(Desk);
    const NUM_COLS = 4;
    const colWidth = visibleRect.width / NUM_COLS;
    const coverage = Array.from<number>({ length: NUM_COLS }).fill(0);

    world.query(Paper, Position, Not(IsOpen), Not(IsOffScreen)).readEach(([_paper, pos], entity) => {
      if (entity === exclude) return;
      const col = Math.min(
        Math.max(Math.floor((metersToCssPixels(pos.x) - visibleRect.x) / colWidth), 0),
        NUM_COLS - 1
      );
      coverage[col]++;
    });

    let minCoverage = Infinity;
    const candidates: number[] = [];
    for (let i = 0; i < NUM_COLS; i++) {
      if (coverage[i] < minCoverage) {
        minCoverage = coverage[i];
        candidates.length = 0;
        candidates.push(i);
      } else if (coverage[i] === minCoverage) {
        candidates.push(i);
      }
    }

    const lastCol = desk?.lastThrowCol ?? -1;
    const filtered = candidates.filter((col) => col !== lastCol);
    const pool = filtered.length > 0 ? filtered : candidates;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    if (desk) desk.lastThrowCol = chosen;

    return randomInRange(
      visibleRect.x + chosen * colWidth + colWidth * 0.2,
      visibleRect.x + (chosen + 1) * colWidth - colWidth * 0.2
    );
  },

  /**
   * Settles in-flight pointer interactions the same way the renderers'
   * pointer-cancel handlers do. Used when the view unmounts mid-interaction
   * (e.g. going fullscreen while dragging) since pointer capture dies with
   * the DOM and the release handlers will never fire.
   */
  releaseTransientInput: () => {
    world.query(Pressed).forEach((entity) => entity.remove(Pressed));
    world.query(Selected).forEach((entity) => entity.remove(Selected));
    world.query(ItemFocusSpin).forEach((entity) => entity.remove(ItemFocusSpin));
    world.query(Dragging).forEach((entity) => {
      entity.add(IsDroppedFromDragging);
      entity.remove(Dragging, IsControlled);
    });
  },

  destroyPapers: () => {
    world.query(Paper).forEach((entity) => entity.destroy());
  },

  destroyPolaroids: () => {
    world.query(Polaroid).forEach((entity) => entity.destroy());
  },
}));
