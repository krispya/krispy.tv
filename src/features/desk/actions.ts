import { createActions, Not, type Entity } from 'koota';
import { color } from '../../color.js';
import {
  AngularVelocity,
  Book,
  BoundingBox,
  Desk,
  DeskConfig,
  IsEnteringDesk,
  IsOffScreen,
  IsOpen,
  IsResting,
  KinematicBody,
  Paper,
  Polaroid,
  Position,
  Rotation,
  IsStackable,
  StackIndex,
  Velocity,
  Viewport,
} from './traits/index.js';
import { getBookDepthMeters } from './utils/resting-height.js';
import { cssPixelsToMeters, metersToCssPixels } from './utils/physics-units.js';
import { clamp, randomInRange } from './utils/math.js';

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
  stackIndex?: number;
  thickness?: number;
  physics?: KinematicBodyConfig;
};

export type BookConfig = {
  id: string;
  title?: string;
  color?: string;
  coverImage?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  centered?: boolean;
  stackIndex?: number;
  pageCount?: number;
  pageThickness?: number;
  coverThickness?: number;
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
  stackIndex?: number;
  thickness?: number;
  physics?: KinematicBodyConfig;
};

function getOffScreenThrowPosition(
  width: number,
  height: number,
  config: ThrowOntoDeskConfig,
  viewportWidth: number,
  viewportHeight: number,
  wallGutter: number
) {
  return {
    x: cssPixelsToMeters(
      config.centered ? viewportWidth / 2 : randomInRange(width * 0.5, viewportWidth - width * 0.5)
    ),
    y: cssPixelsToMeters(viewportHeight + height / 2 + randomInRange(24, wallGutter)),
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
    const viewport = world.get(Viewport);
    const desk = world.queryFirst(Desk)?.get(Desk);
    if (!desk) throw new Error('spawnPaper requires a Desk entity. Call spawnDesk() first.');

    const viewportWidth = viewport?.width || window.innerWidth;
    const viewportHeight = viewport?.height || window.innerHeight;

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
      StackIndex({ value: config.stackIndex ?? 0 })
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
          viewportWidth,
          viewportHeight,
          desk.wallGutter
        )
      )
    );

    return entity;
  },

  spawnBook: (config: BookConfig) => {
    const viewport = world.get(Viewport);
    const desk = world.queryFirst(Desk)?.get(Desk);
    if (!desk) throw new Error('spawnBook requires a Desk entity. Call spawnDesk() first.');

    const viewportWidth = viewport?.width || window.innerWidth;
    const viewportHeight = viewport?.height || window.innerHeight;

    const entity = world.spawn(
      Book({
        id: config.id,
        ...(config.title !== undefined && { title: config.title }),
        ...(config.color !== undefined && { color: config.color }),
        ...(config.coverImage !== undefined && { coverImage: config.coverImage }),
        ...(config.width !== undefined && { width: config.width }),
        ...(config.height !== undefined && { height: config.height }),
        ...(config.pageCount !== undefined && { pageCount: config.pageCount }),
        ...(config.pageThickness !== undefined && { pageThickness: config.pageThickness }),
        ...(config.coverThickness !== undefined && { coverThickness: config.coverThickness }),
      }),
      Rotation(getThrowRotation(config.centered)),
      Velocity,
      AngularVelocity,
      StackIndex({ value: config.stackIndex ?? 0 })
    );

    const book = entity.get(Book)!;
    entity.add(BoundingBox({ width: book.width, height: book.height }));
    entity.add(
      Position(
        getOffScreenThrowPosition(
          book.width,
          book.height,
          config,
          viewportWidth,
          viewportHeight,
          desk.wallGutter
        )
      )
    );
    entity.add(KinematicBody({ mass: 8, ...config.physics, depth: getBookDepthMeters(book) }));

    return entity;
  },

  spawnPolaroid: (config: PolaroidConfig) => {
    const viewport = world.get(Viewport);
    const desk = world.queryFirst(Desk)?.get(Desk);
    if (!desk) throw new Error('spawnPolaroid requires a Desk entity. Call spawnDesk() first.');

    const viewportWidth = viewport?.width || window.innerWidth;
    const viewportHeight = viewport?.height || window.innerHeight;

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
      StackIndex({ value: config.stackIndex ?? 0 }),
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
          viewportWidth,
          viewportHeight,
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
    const items: Array<{ entity: Entity; stackIndex: number }> = [];

    world.query(StackIndex).forEach((item) => {
      const stackIndex = item.get(StackIndex);
      if (!stackIndex) return;

      items.push({ entity: item, stackIndex: stackIndex.value });
    });

    items.sort((a, b) => a.stackIndex - b.stackIndex || a.entity.id() - b.entity.id());

    const entityIndex = items.findIndex((item) => item.entity === entity);
    if (entityIndex === -1) return;

    const [raisedItem] = items.splice(entityIndex, 1);
    items.push(raisedItem);

    items.forEach((item, index) => {
      item.entity.set(StackIndex, { value: index });
    });
  },

  getLeastCoveredX: (exclude?: Entity) => {
    const viewport = world.get(Viewport);
    const viewportWidth = viewport?.width || window.innerWidth;
    const desk = world.queryFirst(Desk)?.get(Desk);
    const NUM_COLS = 4;
    const colWidth = viewportWidth / NUM_COLS;
    const coverage = Array.from<number>({ length: NUM_COLS }).fill(0);

    world.query(Paper, Position, Not(IsOpen), Not(IsOffScreen)).readEach(([_paper, pos], entity) => {
      if (entity === exclude) return;
      const col = Math.min(
        Math.max(Math.floor(metersToCssPixels(pos.x) / colWidth), 0),
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
      chosen * colWidth + colWidth * 0.2,
      (chosen + 1) * colWidth - colWidth * 0.2
    );
  },

  destroyPapers: () => {
    world.query(Paper).forEach((entity) => entity.destroy());
  },

  destroyPolaroids: () => {
    world.query(Polaroid).forEach((entity) => entity.destroy());
  },
}));
