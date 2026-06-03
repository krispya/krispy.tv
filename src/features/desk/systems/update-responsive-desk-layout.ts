import type { World } from 'koota';
import { BoundingBox, Desk, DeskConfig, Paper, Viewport } from '../traits/index.js';
import { clamp } from '../utils/math.js';
import { getPaperBaseWidth, getPaperSize } from '../utils/paper-size.js';

export function updateResponsiveDeskLayout(world: World) {
  const viewport = world.get(Viewport);
  const deskEntity = world.queryFirst(Desk, DeskConfig);
  const desk = deskEntity?.get(Desk);
  const config = deskEntity?.get(DeskConfig);

  if (!viewport || !desk || !config || viewport.width <= 0) return;

  const basePaperWidth = getPaperBaseWidth(viewport.width, config);
  desk.wallGutter = clamp(
    basePaperWidth * config.wallGutterPaperScale,
    config.wallGutterMin,
    config.wallGutterMax
  );

  world.query(Paper, BoundingBox).updateEach(([paper, box]) => {
    const size = getPaperSize(viewport.width, config, paper);
    paper.width = size.width;
    paper.height = size.height;
    box.width = size.width;
    box.height = size.height;
  });
}
