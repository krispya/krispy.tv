import type { World } from 'koota';
import {
  ActiveSlug,
  AngularVelocity,
  Dragging,
  IsOffScreen,
  IsOpen,
  Paper,
  Position,
  Pressed,
  Ref,
  Selected,
  StackIndex,
  Velocity,
  Viewport,
} from '../traits/index.js';
import { actions } from '../actions.js';
import { metersToCssPixels } from '../utils/physics-units.js';
import { randomInRange } from '../utils/math.js';

const EXIT_SPEED = metersToCssPixels(1.2);

export function syncOpenState(world: World) {
  const { throwPaperOntoDesk } = actions(world);
  const route = world.get(ActiveSlug);
  if (!route) return;

  const { slug } = route;
  const viewport = world.get(Viewport);

  world.query(Paper).readEach(([paper], entity) => {
    if (slug && paper.id === slug) {
      if (entity.has(IsOpen)) return;

      // Initiate exit — fly downward off the desk
      entity.add(IsOpen);
      entity.remove(Dragging, Pressed, Selected);
      entity.set(Velocity, { x: 0, y: EXIT_SPEED, z: 0 });
      entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
    } else if (entity.has(IsOpen)) {
      // Paper was open, now closing — throw back onto desk
      entity.remove(IsOpen, IsOffScreen);

      // Raise to top of stack
      let top = 0;
      world.query(StackIndex).readEach(([stackIndex]) => {
        top = Math.max(top, stackIndex.value);
      });
      entity.set(StackIndex, { value: top + 1 });

      const viewportWidth = viewport?.width || window.innerWidth;
      const viewportHeight = viewport?.height || window.innerHeight;
      const ref = entity.get(Ref);
      const width = ref?.offsetWidth ?? paper.width;
      const height = ref?.offsetHeight ?? paper.height;

      // Reposition just below viewport edge
      entity.set(Position, {
        x: randomInRange(width * 0.5, viewportWidth - width * 0.5),
        y: viewportHeight + height / 2 + randomInRange(8, 24),
        z: metersToCssPixels(randomInRange(0.03, 0.06)),
      });

      throwPaperOntoDesk(entity);
    }
  });
}
