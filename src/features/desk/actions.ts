import { createActions, Not, type Entity } from 'koota';
import { color } from '../../color.js';
import {
  AngularVelocity,
  Book,
  type BookStickyNote,
  BoundingBox,
  Desk,
  DeskConfig,
  Dragging,
  HEADPHONES_ASPECT_RATIO,
  Headphones,
  IsBoundary,
  IsControlled,
  IsEnteringDesk,
  IsOffScreen,
  IsOpen,
  IsResting,
  KinematicBody,
  Paper,
  Polaroid,
  PolaroidFocusMotion,
  PolaroidFocusSpin,
  Position,
  Pressed,
  Rotation,
  Selected,
  IsStackable,
  StackIndex,
  Velocity,
} from './traits/index.js';
import { getBookDepthMeters } from './utils/resting-height.js';
import { cssPixelsToMeters, metersToCssPixels } from './utils/physics-units.js';
import { clamp, randomInRange } from './utils/math.js';
import { getVisibleDeskRectForWorld, type VisibleDeskRect } from './utils/camera.js';
import {
  getNextStackIndex,
  getStackIndexedItems,
  renumberStackIndices,
} from './utils/stack-order.js';

const POLAROID_FOCUS_Z_M = 0.26;
const POLAROID_FOCUS_CURVE_M = 0.055;
const POLAROID_FOCUS_ROTATION_X = -4;
const POLAROID_FOCUS_ROTATION_Y = 5;
const POLAROID_FOCUS_ROTATION_Z = 3;
const POLAROID_FOCUS_SIDE_VELOCITY_SCALE = 10;
const POLAROID_FOCUS_UPWARD_VELOCITY = 0.48;
const POLAROID_FOCUS_ROTATION_X_VELOCITY = -120;
const POLAROID_FOCUS_ROTATION_Y_VELOCITY = 80;
const POLAROID_SPIN_ROTATION_Y_PER_PX = 0.55;
const POLAROID_SPIN_ROTATION_X_PER_PX = 0.12;
const POLAROID_SPIN_ROTATION_X_MIN = -18;
const POLAROID_SPIN_ROTATION_X_MAX = 12;
const POLAROID_SPIN_TOUCH_SENSITIVITY = 2.5;
const POLAROID_SPIN_VELOCITY_SCALE = 1;
const POLAROID_SPIN_MAX_VELOCITY_DEG = 750;
const POLAROID_SPIN_MIN_DELTA_MS = 8;
const HEADPHONES_CORNER_OVERLAP_X_PX = 62;
const HEADPHONES_CORNER_OVERLAP_Y_PX = 26;
const HEADPHONES_MASS = 120;

type DeskConfigOverrides = Partial<{
  wallGutter: number;
  wallGutterMin: number;
  wallGutterMax: number;
  restackThreshold: number;
}>;

type KinematicBodyConfig = Partial<{
  throwDamping: number;
  maxThrowSpeed: number;
  friction: number;
  stopSpeed: number;
  mass: number;
}>;

type ThrowOntoDeskConfig = {
  centered?: boolean;
};

export type PaperConfig = {
  id: string;
  openable?: boolean;
  color?: string;
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
  width?: number;
  height?: number;
  aspectRatio?: number;
  centered?: boolean;
  pageCount?: number;
  pageThickness?: number;
  coverThickness?: number;
  stickyNote?: BookStickyNote;
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

export type PolaroidConfig = {
  id: string;
  imageSrc: string;
  caption?: string;
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
  wallGutter: number
) {
  return {
    x: cssPixelsToMeters(
      config.centered
        ? visibleRect.x + visibleRect.width / 2
        : randomInRange(visibleRect.x + width * 0.5, visibleRect.right - width * 0.5)
    ),
    y: cssPixelsToMeters(visibleRect.bottom + height / 2 + randomInRange(24, wallGutter)),
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

function getStablePolaroidSign(id: string) {
  let hash = 0;

  for (let index = 0; index < id.length; index++) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }

  return hash % 2 === 0 ? 1 : -1;
}

function getPolaroidFocusTarget(entity: Entity, visibleRect: VisibleDeskRect) {
  const polaroid = entity.get(Polaroid);
  const position = entity.get(Position) ?? { x: 0, y: 0, z: 0 };
  const centerX = cssPixelsToMeters(visibleRect.x + visibleRect.width / 2);
  const centerY = cssPixelsToMeters(visibleRect.y + visibleRect.height / 2);
  const sourceSide = position.x < centerX ? -1 : 1;
  const stableSign = getStablePolaroidSign(polaroid?.id ?? String(entity.id()));

  return {
    position: {
      x: centerX,
      y: centerY,
      z: POLAROID_FOCUS_Z_M,
    },
    rotation: {
      x: POLAROID_FOCUS_ROTATION_X,
      y: POLAROID_FOCUS_ROTATION_Y * -sourceSide,
      z: POLAROID_FOCUS_ROTATION_Z * stableSign,
    },
    curveOffset: POLAROID_FOCUS_CURVE_M * stableSign,
    sideTilt: POLAROID_FOCUS_ROTATION_Y * -sourceSide,
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
        wallGutter: clamp(resolved.wallGutter, resolved.wallGutterMin, resolved.wallGutterMax),
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
        color:
          config.color ??
          (config.openable === false ? color.surface.paper : color.surface.articlePaper),
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
        getOffScreenThrowPosition(paper.width, paper.height, config, visibleRect, desk.wallGutter)
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
        ...(config.width !== undefined && { width: config.width }),
        ...(config.height !== undefined && { height: config.height }),
        ...(config.pageCount !== undefined && { pageCount: config.pageCount }),
        ...(config.pageThickness !== undefined && { pageThickness: config.pageThickness }),
        ...(config.coverThickness !== undefined && { coverThickness: config.coverThickness }),
        ...(config.stickyNote !== undefined && {
          hasStickyNote: true,
          stickyNoteText: config.stickyNote.text ?? '',
          stickyNoteColor: config.stickyNote.color ?? '',
          stickyNoteRotation: config.stickyNote.rotation ?? -7,
        }),
      }),
      Rotation(getThrowRotation(config.centered)),
      Velocity,
      AngularVelocity,
      StackIndex({ value: getNextStackIndex(world) })
    );

    const book = entity.get(Book)!;
    entity.add(BoundingBox({ width: book.width, height: book.height }));
    entity.add(
      Position(
        getOffScreenThrowPosition(book.width, book.height, config, visibleRect, desk.wallGutter)
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

  spawnPolaroid: (config: PolaroidConfig) => {
    const desk = world.queryFirst(Desk)?.get(Desk);
    if (!desk) throw new Error('spawnPolaroid requires a Desk entity. Call spawnDesk() first.');

    const visibleRect = getVisibleDeskRectForWorld(world);

    const entity = world.spawn(
      Polaroid({
        id: config.id,
        imageSrc: config.imageSrc,
        ...(config.caption !== undefined && { caption: config.caption }),
        ...(config.width !== undefined && { width: config.width }),
        ...(config.height !== undefined && { height: config.height }),
        ...(config.aspectRatio !== undefined && { aspectRatio: config.aspectRatio }),
        ...(config.thickness !== undefined && { thickness: config.thickness }),
      }),
      Rotation(getThrowRotation(config.centered)),
      Velocity,
      AngularVelocity,
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
          desk.wallGutter
        )
      )
    );
    entity.add(KinematicBody({ mass: 2, ...config.physics, depth: polaroid.thickness }));

    return entity;
  },

  throwOntoDesk: (
    entity: Entity,
    config: Partial<{
      centered: boolean;
    }> = {}
  ) => {
    const launchAngle = config.centered ? 0 : randomInRange(-0.42, 0.42);
    const launchSpeed = config.centered ? randomInRange(0.78, 0.84) : randomInRange(0.75, 0.95);
    const spinDir = Math.random() < 0.5 ? -1 : 1;

    entity.set(Velocity, {
      x: Math.sin(launchAngle) * launchSpeed,
      y: -Math.cos(launchAngle) * launchSpeed,
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

  openPolaroid: (entity: Entity) => {
    const polaroid = entity.get(Polaroid);
    const position = entity.get(Position);
    const rotation = entity.get(Rotation);
    if (!polaroid || !position || !rotation) return;

    world.query(Polaroid, IsOpen).forEach((candidate) => {
      if (candidate === entity) return;

      const candidateMotion = candidate.get(PolaroidFocusMotion);
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

      candidate.remove(IsOpen, IsControlled, PolaroidFocusMotion);
    });

    const target = getPolaroidFocusTarget(entity, getVisibleDeskRectForWorld(world));

    entity.remove(Dragging, Pressed, Selected, IsResting);
    entity.set(Velocity, { x: 0, y: 0, z: 0 });
    entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
    entity.add(IsOpen, IsControlled);

    actions(world).raiseDeskItem(entity);
    entity.add(
      PolaroidFocusMotion({
        phase: 'opening',
        progress: 0,
        progressVelocity: 0,
        fromPosition: { x: position.x, y: position.y, z: position.z },
        fromRotation: { x: rotation.x, y: rotation.y, z: rotation.z },
        toPosition: target.position,
        toRotation: target.rotation,
        positionVelocity: {
          x: target.curveOffset * POLAROID_FOCUS_SIDE_VELOCITY_SCALE,
          y: 0,
          z: POLAROID_FOCUS_UPWARD_VELOCITY,
        },
        rotationVelocity: {
          x: POLAROID_FOCUS_ROTATION_X_VELOCITY,
          y: Math.sign(target.sideTilt || 1) * POLAROID_FOCUS_ROTATION_Y_VELOCITY,
          z: 0,
        },
        curveOffset: target.curveOffset,
        sideTilt: target.sideTilt,
      })
    );
  },

  closePolaroid: (entity: Entity) => {
    const motion = entity.get(PolaroidFocusMotion);
    const position = entity.get(Position);
    const rotation = entity.get(Rotation);

    if (!motion || !position || !rotation) {
      entity.remove(IsOpen, IsControlled, PolaroidFocusMotion);
      return;
    }

    if (motion.phase === 'closing') return;

    // Drop IsOpen as soon as the close starts: the desk becomes interactive
    // again and the descending polaroid can be grabbed, restacked at the
    // threshold, or knocked by collisions. IsControlled stays so gravity and
    // friction don't fight the focus spring while it still owns the motion.
    entity.remove(IsOpen, PolaroidFocusSpin);
    entity.set(Velocity, { x: 0, y: 0, z: 0 });
    entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
    entity.set(PolaroidFocusMotion, {
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
        x: motion.curveOffset * -POLAROID_FOCUS_SIDE_VELOCITY_SCALE * 0.35,
        y: 0,
        z: 0,
      },
      rotationVelocity: { x: 0, y: 0, z: 0 },
      curveOffset: motion.curveOffset * -0.45,
      sideTilt: motion.sideTilt,
    });
  },

  startPolaroidFocusSpin: (
    entity: Entity,
    pointerId: number,
    x: number,
    y: number,
    timeMs: number,
    pointerType: string
  ) => {
    if (!entity.has(IsOpen)) return;

    const rotation = entity.get(Rotation);
    const motion = entity.get(PolaroidFocusMotion);
    if (!rotation || !motion || motion.phase === 'closing') return;

    const currentRotation = { x: rotation.x, y: rotation.y, z: rotation.z };

    entity.set(PolaroidFocusMotion, {
      ...motion,
      toRotation: currentRotation,
      rotationVelocity: { x: 0, y: 0, z: 0 },
    });
    entity.add(
      PolaroidFocusSpin({
        pointerId,
        pointerType,
        lastClient: { x, y },
        lastTimeMs: timeMs,
        rotation: currentRotation,
      })
    );
  },

  updatePolaroidFocusSpin: (
    entity: Entity,
    pointerId: number,
    x: number,
    y: number,
    timeMs: number
  ) => {
    const spin = entity.get(PolaroidFocusSpin);
    const motion = entity.get(PolaroidFocusMotion);
    if (!spin || !motion || spin.pointerId !== pointerId || motion.phase === 'closing') return;

    const dx = x - spin.lastClient.x;
    const dy = y - spin.lastClient.y;
    if (dx === 0 && dy === 0) return;

    const sensitivity = spin.pointerType === 'touch' ? POLAROID_SPIN_TOUCH_SENSITIVITY : 1;
    const deltaRotationX = -dy * POLAROID_SPIN_ROTATION_X_PER_PX * sensitivity;
    const deltaRotationY = dx * POLAROID_SPIN_ROTATION_Y_PER_PX * sensitivity;
    const nextRotation = {
      x: clamp(
        spin.rotation.x + deltaRotationX,
        POLAROID_SPIN_ROTATION_X_MIN,
        POLAROID_SPIN_ROTATION_X_MAX
      ),
      y: spin.rotation.y + deltaRotationY,
      z: spin.rotation.z,
    };

    const deltaMs = timeMs - spin.lastTimeMs;
    const nextRotationVelocity = { ...motion.rotationVelocity };

    if (deltaMs >= POLAROID_SPIN_MIN_DELTA_MS) {
      const deltaSeconds = deltaMs / 1000;
      nextRotationVelocity.x = clamp(
        (deltaRotationX / deltaSeconds) * POLAROID_SPIN_VELOCITY_SCALE,
        -POLAROID_SPIN_MAX_VELOCITY_DEG,
        POLAROID_SPIN_MAX_VELOCITY_DEG
      );
      nextRotationVelocity.y = clamp(
        (deltaRotationY / deltaSeconds) * POLAROID_SPIN_VELOCITY_SCALE,
        -POLAROID_SPIN_MAX_VELOCITY_DEG,
        POLAROID_SPIN_MAX_VELOCITY_DEG
      );
    }

    entity.set(PolaroidFocusSpin, {
      ...spin,
      lastClient: { x, y },
      lastTimeMs: timeMs,
      rotation: nextRotation,
    });
    entity.set(PolaroidFocusMotion, {
      ...motion,
      toRotation: nextRotation,
      rotationVelocity: nextRotationVelocity,
    });
  },

  endPolaroidFocusSpin: (entity: Entity, pointerId: number) => {
    const spin = entity.get(PolaroidFocusSpin);
    if (!spin || spin.pointerId !== pointerId) return;

    entity.remove(PolaroidFocusSpin);
  },

  closeOpenPolaroid: () => {
    world.query(Polaroid, IsOpen).forEach((entity) => {
      actions(world).closePolaroid(entity);
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

  destroyPapers: () => {
    world.query(Paper).forEach((entity) => entity.destroy());
  },

  destroyPolaroids: () => {
    world.query(Polaroid).forEach((entity) => entity.destroy());
  },
}));
