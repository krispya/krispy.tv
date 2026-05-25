import type { Entity, World } from 'koota';
import {
  AngularVelocity,
  CarouselOffset,
  IsOpen,
  Paper,
  Position,
  Rotation,
  Time,
  TimelineSlot,
  Velocity,
  Viewport,
  ViewMode,
} from '../traits/index.js';
import { clamp, dampedLerp } from '../utils/math.js';
import { TIMELINE_LIFT_Z } from '../utils/timeline-layout.js';

const POSITION_RESPONSE = 12;
const MAX_TIMELINE_SPEED = 2400;
const ROTATION_DAMPING = 0.18;

export function updateTimeline(world: World) {
  const viewMode = world.get(ViewMode);
  if (viewMode?.mode !== 'timeline') return;

  const time = world.get(Time);
  const delta = time?.delta ?? 0;

  const carousel = world.get(CarouselOffset);
  const viewport = world.get(Viewport);
  const offsetX = carousel?.x ?? 0;
  const centerY = (viewport?.height ?? window.innerHeight) / 2;

  // Collect all timeline entities sorted by slot index for stagger gating
  type SlotEntry = { entity: Entity; index: number; targetX: number; entered: boolean };
  const sorted: SlotEntry[] = [];

  world.query(TimelineSlot).readEach(([slot], entity) => {
    sorted.push({ entity, index: slot.index, targetX: slot.targetX, entered: slot.entered });
  });
  sorted.sort((a, b) => a.index - b.index);

  const enteredAtFrameStart = new Set(
    sorted.filter((entry) => entry.entered).map((entry) => entry.index)
  );

  // Stagger entrance: each paper starts shortly after the previous one starts.
  for (const entry of sorted) {
    if (entry.entered) continue;

    const shouldEnter = entry.index === 0 || enteredAtFrameStart.has(entry.index - 1);

    if (shouldEnter) {
      const slot = entry.entity.get(TimelineSlot);
      if (slot) entry.entity.set(TimelineSlot, { ...slot, entered: true });
      entry.entered = true;
    }
  }

  // Animate entered papers toward their slots by driving velocity; applyVelocity integrates it.
  world
    .query(Paper, TimelineSlot, Position, Rotation, Velocity, AngularVelocity)
    .updateEach(([_paper, slot, position, rotation, velocity, angularVelocity], entity) => {
      if (entity.has(IsOpen)) return;

      if (!slot.entered) {
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
        angularVelocity.x = 0;
        angularVelocity.y = 0;
        angularVelocity.z = 0;
        return;
      }

      const targetX = slot.targetX - offsetX;

      velocity.x = clamp(
        (targetX - position.x) * POSITION_RESPONSE,
        -MAX_TIMELINE_SPEED,
        MAX_TIMELINE_SPEED
      );
      velocity.y = clamp(
        (centerY - position.y) * POSITION_RESPONSE,
        -MAX_TIMELINE_SPEED,
        MAX_TIMELINE_SPEED
      );
      velocity.z = clamp(
        (TIMELINE_LIFT_Z - position.z) * POSITION_RESPONSE,
        -MAX_TIMELINE_SPEED,
        MAX_TIMELINE_SPEED
      );

      rotation.x = dampedLerp(rotation.x, 0, ROTATION_DAMPING, delta);
      rotation.y = dampedLerp(rotation.y, 0, ROTATION_DAMPING, delta);
      rotation.z = dampedLerp(rotation.z, 0, ROTATION_DAMPING, delta);

      angularVelocity.x = 0;
      angularVelocity.y = 0;
      angularVelocity.z = 0;
    });
}
