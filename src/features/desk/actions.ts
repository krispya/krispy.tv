import { createActions, type Entity } from 'koota';
import { createSeededLayout } from './utils/create-seeded-layout.js';
import { getPaperStackIndex } from './utils/paper-stack-index.js';
import {
  Desk,
  Paper,
  PaperPhysics,
  Position,
  Rotation,
  StackIndex,
  Velocity,
  Viewport,
} from './traits.js';

type DeskConfig = Partial<{
  viewportWallBuffer: number;
  viewportWallBounce: number;
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
  position?: {
    x: number;
    y: number;
    z?: number;
  };
  rotation?: {
    x?: number;
    y?: number;
    z?: number;
  };
  stackIndex?: number;
  thickness?: number;
  physics?: PaperPhysicsConfig;
  centered?: boolean;
};

export const actions = createActions((world) => ({
  spawnDesk: (config: DeskConfig = {}) => {
    return world.spawn(Desk({ wallBuffer: 200, wallBounce: 0.58, ...config }));
  },
  spawnPaper: (config: PaperConfig) => {
    let position = config.position;
    let rotationZ = config.rotation?.z;
    let stackIndex = config.stackIndex;

    if (position === undefined || rotationZ === undefined) {
      const viewport = world.get(Viewport);
      const viewportWidth = viewport?.width || window.innerWidth;
      const viewportHeight = viewport?.height || window.innerHeight;
      const itemWidth = Math.min(Math.max(viewportWidth * 0.32, 220), 380);
      const itemHeight = itemWidth * (11 / 8.5);

      const layout = createSeededLayout({
        id: config.id,
        centered: config.centered,
        viewportWidth,
        viewportHeight,
        itemWidth,
        itemHeight,
      });

      position ??= { x: layout.x, y: layout.y };
      rotationZ ??= layout.rotation;
    }

    stackIndex ??= getPaperStackIndex(config.id);
    const paper = {
      id: config.id,
      thickness: config.thickness ?? DEFAULT_PAPER.thickness,
    };
    const physics = { ...DEFAULT_PAPER_PHYSICS, ...config.physics };

    return world.spawn(
      Paper(paper),
      Position({ x: position.x, y: position.y, z: position.z ?? 0 }),
      Rotation({
        x: config.rotation?.x ?? 0,
        y: config.rotation?.y ?? 0,
        z: rotationZ ?? 0,
      }),
      Velocity,
      PaperPhysics(physics),
      StackIndex({ value: stackIndex ?? 0 })
    );
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
