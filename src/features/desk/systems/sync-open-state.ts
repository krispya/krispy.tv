import type { World } from 'koota';
import {
  ActiveSlug,
  AngularVelocity,
  Camera,
  Dragging,
  IsControlled,
  IsOffScreen,
  IsOpen,
  IsResting,
  Paper,
  Position,
  Pressed,
  Ref,
  Selected,
  Velocity,
  Viewport,
} from '../traits/index.js';
import { actions } from '../actions.js';
import { cssPixelsToMeters } from '../utils/physics-units.js';
import { clamp, randomInRange } from '../utils/math.js';
import { getVisibleDeskRect } from '../utils/camera.js';

const EXIT_SPEED = 1.3;

export function syncOpenState(world: World) {
  const { throwOntoDesk: throwPaperOntoDesk, getLeastCoveredX, raiseDeskItem } = actions(world);
  const route = world.get(ActiveSlug);
  if (!route) return;

  const { slug } = route;
  const viewport = world.get(Viewport);
  const camera = world.get(Camera);
  const visibleRect = getVisibleDeskRect(viewport, camera);

  world.query(Paper).readEach(([paper], entity) => {
    if (slug && paper.id === slug) {
      if (entity.has(IsOpen)) return;

      // Initiate exit — fly downward off the desk
      entity.add(IsOpen);
      entity.remove(Dragging, IsControlled, Pressed, Selected, IsResting);
      entity.set(Velocity, { x: 0, y: EXIT_SPEED, z: 0 });
      entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
    } else if (entity.has(IsOpen)) {
      // Paper was open, now closing — throw back onto desk
      entity.remove(IsOpen, IsOffScreen, IsResting);

      raiseDeskItem(entity);

      const ref = entity.get(Ref);
      const width = ref?.offsetWidth ?? paper.width;
      const height = ref?.offsetHeight ?? paper.height;

      // Reposition just below viewport edge, biased toward the least-covered quadrant
      entity.set(Position, {
        x: cssPixelsToMeters(
          clamp(
            getLeastCoveredX(entity),
            visibleRect.x + width * 0.5,
            visibleRect.right - width * 0.5
          )
        ),
        y: cssPixelsToMeters(visibleRect.bottom + height / 2 + randomInRange(8, 24)),
        z: randomInRange(0.03, 0.06),
      });

      throwPaperOntoDesk(entity);
    }
  });
}
