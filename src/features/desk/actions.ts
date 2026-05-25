import { createActions, Not, type Entity } from 'koota';
import {
  AngularVelocity,
  CarouselOffset,
  Desk,
  DeskConfig,
  Dragging,
  IsEnteringDesk,
  IsOffScreen,
  IsOpen,
  Paper,
  PaperPhysics,
  Position,
  Pressed,
  Rotation,
  Selected,
  StackIndex,
  TimelineSlot,
  Velocity,
  Viewport,
  ViewMode,
} from './traits/index.js';
import { metersToCssPixels } from './utils/physics-units.js';
import { getPaperSize } from './utils/paper-size.js';
import { randomInRange } from './utils/math.js';
import { getTimelineVisualWidth, TIMELINE_GAP } from './utils/timeline-layout.js';
import { articles as articlesCatalog } from '../article/index.js';

type DeskConfigOverrides = Partial<{
  paperViewportScale: number;
  paperMinWidth: number;
  paperMaxWidth: number;
  wallGutterPaperScale: number;
  wallGutterMin: number;
  wallGutterMax: number;
}>;

type PaperPhysicsConfig = Partial<{
  throwDamping: number;
  maxThrowSpeed: number;
  friction: number;
  stopSpeed: number;
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
  physics?: PaperPhysicsConfig;
};

type PaperThrowConfig = Partial<{
  centered: boolean;
}>;

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

    const paper = {
      id: config.id,
      ...(config.openable !== undefined && { openable: config.openable }),
      ...(config.color !== undefined && { color: config.color }),
      width: paperWidth,
      height: paperHeight,
      ...(config.aspectRatio !== undefined && { aspectRatio: config.aspectRatio }),
      ...(config.thickness !== undefined && { thickness: config.thickness }),
    };
    const stackIndex = config.stackIndex ?? 0;

    return world.spawn(
      Paper(paper),
      Position(position),
      Rotation(rotation),
      Velocity,
      AngularVelocity,
      PaperPhysics(config.physics),
      StackIndex({ value: stackIndex })
    );
  },
  throwPaperOntoDesk: (entity: Entity, config: PaperThrowConfig = {}) => {
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

    entity.add(IsEnteringDesk);
  },
  raisePaper: (entity: Entity) => {
    let top = 0;

    world.query(StackIndex).forEach((item) => {
      top = Math.max(top, item.get(StackIndex)?.value ?? 0);
    });

    entity.set(StackIndex, { value: top + 1 });
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
  toggleViewMode: () => {
    const viewMode = world.get(ViewMode);

    if (viewMode?.mode === 'timeline') {
      // Switch back to desk — scatter timeline papers and resume physics
      const timelinePapers: Entity[] = [];
      world.query(TimelineSlot).forEach((entity) => {
        entity.remove(TimelineSlot);
        timelinePapers.push(entity);
      });

      timelinePapers.forEach((entity, index) => {
        const spinDir = Math.random() < 0.5 ? -1 : 1;
        const fan = timelinePapers.length > 1 ? index / (timelinePapers.length - 1) - 0.5 : 0;

        entity.set(Velocity, {
          x: metersToCssPixels(fan * randomInRange(1.1, 1.6) + randomInRange(-0.65, 0.65)),
          y: metersToCssPixels(randomInRange(-0.9, 0.95)),
          z: metersToCssPixels(randomInRange(0.38, 0.62)),
        });

        entity.set(AngularVelocity, {
          x: randomInRange(-55, 55),
          y: randomInRange(-55, 55),
          z: spinDir * randomInRange(70, 145),
        });
      });

      world.set(ViewMode, { mode: 'desk' });
      world.set(CarouselOffset, { x: 0, targetX: 0 });
    } else {
      // Switch to timeline — compute sorted slots for openable papers only
      const dateBySlug = new Map(articlesCatalog.map((a) => [a.slug, Date.parse(a.date)]));

      const openablePapers: Array<{ entity: Entity; paperWidth: number; date: number }> = [];

      world.query(Paper).readEach(([paper], entity) => {
        entity.remove(Dragging, Pressed, Selected);

        if (!paper.openable) {
          entity.set(Velocity, { x: 0, y: 0, z: 0 });
          entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
          return;
        }

        const date = dateBySlug.get(paper.id) ?? 0;
        openablePapers.push({ entity, paperWidth: paper.width, date });
      });

      // Sort newest → oldest (left to right)
      openablePapers.sort((a, b) => b.date - a.date);

      let topStackIndex = 0;
      world.query(StackIndex).readEach(([stackIndex]) => {
        topStackIndex = Math.max(topStackIndex, stackIndex.value);
      });

      let cursor = TIMELINE_GAP;

      openablePapers.forEach(({ entity, paperWidth }, index) => {
        const visualPaperWidth = getTimelineVisualWidth(paperWidth);
        const targetX = cursor + visualPaperWidth / 2;
        cursor += visualPaperWidth + TIMELINE_GAP;
        entity.set(StackIndex, { value: topStackIndex + index + 1 });
        entity.add(TimelineSlot({ targetX, index, entered: false }));
      });

      world.set(ViewMode, { mode: 'timeline' });
      world.set(CarouselOffset, { x: 0, targetX: 0 });
    }
  },
}));
