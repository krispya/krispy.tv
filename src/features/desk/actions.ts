import { createActions, type Entity } from 'koota';
import {
  AngularVelocity,
  Desk,
  IsEnteringDesk,
  Paper,
  PaperPhysics,
  Position,
  Rotation,
  StackIndex,
  Velocity,
  Viewport,
} from './traits/index.js';
import { metersToCssPixels } from './utils/physics-units.js';

type DeskConfig = Partial<{
  wallBuffer: number;
  wallBounce: number;
  wallFriction: number;
}>;

type PaperPhysicsConfig = Partial<{
  throwDamping: number;
  maxThrowSpeed: number;
  friction: number;
  stopSpeed: number;
}>;

const DEFAULT_PAPER = {
  thickness: 0.0001,
};

const DEFAULT_PAPER_PHYSICS = {
  throwDamping: 0.35,
  maxThrowSpeed: 0.6,
  friction: 0.2,
  stopSpeed: 0.01,
};

export type PaperConfig = {
  id: string;
  centered?: boolean;
  stackIndex?: number;
  thickness?: number;
  physics?: PaperPhysicsConfig;
};

type PaperThrowConfig = Partial<{
  centered: boolean;
}>;

function getPaperSize(viewportWidth: number) {
  const width = Math.min(Math.max(viewportWidth * 0.32, 220), 380);

  return {
    width,
    height: width * (11 / 8.5),
  };
}

function randomInRange(min: number, max: number) {
  if (max <= min) return (min + max) / 2;

  return min + (max - min) * Math.random();
}

export const actions = createActions((world) => ({
  spawnDesk: (config: DeskConfig = {}) => {
    return world.spawn(Desk({ wallBuffer: 200, wallBounce: 0.85, wallFriction: 0.68, ...config }));
  },
  spawnPaper: (config: PaperConfig) => {
    const viewport = world.get(Viewport);
    const desk = world.queryFirst(Desk)?.get(Desk);
    const viewportWidth = viewport?.width || window.innerWidth;
    const viewportHeight = viewport?.height || window.innerHeight;
    const wallBuffer = desk?.wallBuffer ?? 200;
    const paperSize = getPaperSize(viewportWidth);
    const position = {
      x: config.centered
        ? viewportWidth / 2
        : randomInRange(paperSize.width * 0.5, viewportWidth - paperSize.width * 0.5),
      y: viewportHeight + paperSize.height / 2 + randomInRange(24, wallBuffer),
      z: metersToCssPixels(randomInRange(0.055, 0.09)),
    };
    const rotation = {
      x: 0,
      y: 0,
      z: config.centered ? randomInRange(-4, 4) : randomInRange(-28, 28),
    };

    const paper = {
      id: config.id,
      thickness: config.thickness ?? DEFAULT_PAPER.thickness,
    };
    const physics = { ...DEFAULT_PAPER_PHYSICS, ...config.physics };
    const stackIndex = config.stackIndex ?? 0;

    return world.spawn(
      Paper(paper),
      Position(position),
      Rotation(rotation),
      Velocity,
      AngularVelocity,
      PaperPhysics(physics),
      StackIndex({ value: stackIndex })
    );
  },
  throwPaperOntoDesk: (entity: Entity, config: PaperThrowConfig = {}) => {
    const launchAngle = config.centered ? 0 : randomInRange(-0.42, 0.42);
    const launchSpeed = config.centered ? randomInRange(0.78, 0.84) : randomInRange(0.65, 0.95);
    const spin = config.centered ? randomInRange(-0.25, 0.25) : randomInRange(-1, 1);

    entity.set(Velocity, {
      x: metersToCssPixels(Math.sin(launchAngle) * launchSpeed),
      y: -metersToCssPixels(Math.cos(launchAngle) * launchSpeed),
      z: metersToCssPixels(config.centered ? randomInRange(0.14, 0.16) : randomInRange(0.12, 0.22)),
    });

    entity.set(AngularVelocity, {
      x: config.centered ? randomInRange(-2, 2) : randomInRange(-8, 8),
      y: config.centered ? randomInRange(-2, 2) : randomInRange(-8, 8),
      z: spin * (config.centered ? randomInRange(6, 12) : randomInRange(14, 30)),
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
  destroyPapers: () => {
    world.query(Paper).forEach((entity) => entity.destroy());
  },
}));
