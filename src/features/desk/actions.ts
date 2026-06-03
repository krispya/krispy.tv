import { createActions, Not, type Entity } from 'koota';
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
  Position,
  Rotation,
  IsStackable,
  StackIndex,
  Velocity,
  Viewport,
} from './traits/index.js';
import { getBookDepthMeters } from './utils/resting-height.js';
import { metersToCssPixels } from './utils/physics-units.js';
import { getPaperSize } from './utils/paper-size.js';
import { randomInRange } from './utils/math.js';

type DeskConfigOverrides = Partial<{
  paperViewportScale: number;
  paperMinWidth: number;
  paperMaxWidth: number;
  wallGutterPaperScale: number;
  wallGutterMin: number;
  wallGutterMax: number;
}>;

type KinematicBodyConfig = Partial<{
  throwDamping: number;
  maxThrowSpeed: number;
  friction: number;
  stopSpeed: number;
  mass: number;
}>;

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

export const actions = createActions((world) => ({
  spawnDesk: (config: DeskConfigOverrides = {}) => {
    return world.spawn(Desk, DeskConfig(config));
  },

  spawnPaper: (config: PaperConfig) => {
    const viewport = world.get(Viewport);
    const desk = world.queryFirst(Desk)?.get(Desk);
    const deskConfig = world.queryFirst(DeskConfig)?.get(DeskConfig);
    if (!desk) throw new Error('spawnPaper requires a Desk entity. Call spawnDesk() first.');
    if (!deskConfig)
      throw new Error('spawnPaper requires a DeskConfig entity. Call spawnDesk() first.');

    const viewportWidth = viewport?.width || window.innerWidth;
    const viewportHeight = viewport?.height || window.innerHeight;
    const paperLayout = {
      aspectRatio: config.aspectRatio ?? 8.5 / 11,
    };
    const paperSize = getPaperSize(viewportWidth, deskConfig, paperLayout);
    const paperWidth = config.width ?? paperSize.width;
    const paperHeight = config.height ?? paperWidth / paperLayout.aspectRatio;
    const position = {
      x: config.centered
        ? viewportWidth / 2
        : randomInRange(paperWidth * 0.5, viewportWidth - paperWidth * 0.5),
      y: viewportHeight + paperHeight / 2 + randomInRange(24, desk.wallGutter),
      z: metersToCssPixels(randomInRange(0.055, 0.09)),
    };
    const rotation = {
      x: 0,
      y: 0,
      z: config.centered ? randomInRange(-4, 4) : randomInRange(-28, 28),
    };
    const paperThickness = config.thickness ?? 0.0001;

    const paper = {
      id: config.id,
      ...(config.openable !== undefined && { openable: config.openable }),
      ...(config.color !== undefined && { color: config.color }),
      width: paperWidth,
      height: paperHeight,
      ...(config.aspectRatio !== undefined && { aspectRatio: config.aspectRatio }),
      thickness: paperThickness,
    };
    const stackIndex = config.stackIndex ?? 0;
    const paperDepth = metersToCssPixels(paper.thickness);

    return world.spawn(
      Paper(paper),
      BoundingBox({ width: paperWidth, height: paperHeight }),
      Position(position),
      Rotation(rotation),
      Velocity,
      AngularVelocity,
      KinematicBody({ mass: 1, ...config.physics, depth: paperDepth }),
      IsStackable,
      StackIndex({ value: stackIndex })
    );
  },

  spawnBook: (config: BookConfig) => {
    const viewport = world.get(Viewport);
    const desk = world.queryFirst(Desk)?.get(Desk);
    const deskConfig = world.queryFirst(DeskConfig)?.get(DeskConfig);
    if (!desk) throw new Error('spawnBook requires a Desk entity. Call spawnDesk() first.');
    if (!deskConfig)
      throw new Error('spawnBook requires a DeskConfig entity. Call spawnDesk() first.');

    const viewportWidth = viewport?.width || window.innerWidth;
    const viewportHeight = viewport?.height || window.innerHeight;
    const bookLayout = {
      aspectRatio: config.aspectRatio ?? 2 / 3,
    };
    const paperSize = getPaperSize(viewportWidth, deskConfig, bookLayout);
    const bookWidth = config.width ?? paperSize.width * 0.72;
    const bookHeight = config.height ?? bookWidth / bookLayout.aspectRatio;
    const position = {
      x: config.centered
        ? viewportWidth / 2
        : randomInRange(bookWidth * 0.5, viewportWidth - bookWidth * 0.5),
      y: viewportHeight + bookHeight / 2 + randomInRange(24, desk.wallGutter),
      z: metersToCssPixels(randomInRange(0.055, 0.09)),
    };
    const rotation = {
      x: 0,
      y: 0,
      z: config.centered ? randomInRange(-4, 4) : randomInRange(-28, 28),
    };
    const pageCount = config.pageCount ?? 200;
    const pageThickness = config.pageThickness ?? 0.0001;
    const coverThickness = config.coverThickness ?? 0.002;
    const book = {
      id: config.id,
      ...(config.title !== undefined && { title: config.title }),
      ...(config.color !== undefined && { color: config.color }),
      ...(config.coverImage !== undefined && { coverImage: config.coverImage }),
      width: bookWidth,
      height: bookHeight,
      pageCount,
      pageThickness,
      coverThickness,
    };
    const stackIndex = config.stackIndex ?? 0;
    const bookDepth = metersToCssPixels(getBookDepthMeters(book));

    return world.spawn(
      Book(book),
      BoundingBox({ width: bookWidth, height: bookHeight }),
      Position(position),
      Rotation(rotation),
      Velocity,
      AngularVelocity,
      KinematicBody({ mass: 8, ...config.physics, depth: bookDepth }),
      StackIndex({ value: stackIndex })
    );
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
      x: metersToCssPixels(Math.sin(launchAngle) * launchSpeed),
      y: -metersToCssPixels(Math.cos(launchAngle) * launchSpeed),
      z: metersToCssPixels(config.centered ? randomInRange(0.14, 0.16) : randomInRange(0.12, 0.22)),
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
      const col = Math.min(Math.max(Math.floor(pos.x / colWidth), 0), NUM_COLS - 1);
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
}));
