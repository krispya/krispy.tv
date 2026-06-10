import type { Entity, World } from 'koota';
import {
  Dragging,
  IsControlled,
  IsEnteringDesk,
  IsOpen,
  IsResting,
  IsStackable,
  PolaroidFocusMotion,
  Position,
  StackIndex,
  Velocity,
} from '../traits/index.js';

export type StackOrderItem = {
  entity: Entity;
  stackIndex: number;
  deskPlaneLayer: boolean;
  stackable: boolean;
};

export type StackIndexedEntity = {
  entity: Entity;
  stackIndex: number;
};

export function sortByStackIndex<T extends StackIndexedEntity>(items: T[]) {
  items.sort((a, b) => a.stackIndex - b.stackIndex || a.entity.id() - b.entity.id());
}

export function getStackIndexedItems(world: World): StackIndexedEntity[] {
  const items: StackIndexedEntity[] = [];

  world.query(StackIndex).readEach(([stackIndex], entity) => {
    items.push({ entity, stackIndex: stackIndex.value });
  });

  sortByStackIndex(items);
  return items;
}

export function getNextStackIndex(world: World) {
  let nextStackIndex = 0;

  world.query(StackIndex).readEach(([stackIndex]) => {
    nextStackIndex = Math.max(nextStackIndex, stackIndex.value + 1);
  });

  return nextStackIndex;
}

export function renumberStackIndices(items: StackIndexedEntity[]) {
  items.forEach((item, index) => {
    if (item.stackIndex === index) return;

    item.entity.set(StackIndex, { value: index });
    item.stackIndex = index;
  });
}

export function toStackOrderItem(
  entity: Entity,
  stackIndex: number,
  restackThreshold: number
): StackOrderItem {
  return {
    entity,
    stackIndex,
    deskPlaneLayer: entity.has(IsResting) || isThresholdItem(entity, restackThreshold),
    stackable: entity.has(IsStackable),
  };
}

export function getDeskPlaneInsertIndex(item: StackOrderItem, items: StackOrderItem[]) {
  if (item.entity.has(Dragging)) return items.length;

  if (item.stackable) {
    const firstDeskPlaneSolidIndex = items.findIndex(
      (candidate) => candidate.deskPlaneLayer && !candidate.stackable
    );
    if (firstDeskPlaneSolidIndex === -1) return undefined;

    const firstDeskPlaneSolid = items[firstDeskPlaneSolidIndex];
    if (item.stackIndex < firstDeskPlaneSolid.stackIndex) return undefined;

    return firstDeskPlaneSolidIndex;
  }

  let lastDeskPlaneStackableIndex = -1;

  for (let index = 0; index < items.length; index++) {
    const candidate = items[index];
    if (!candidate.deskPlaneLayer || !candidate.stackable) continue;

    lastDeskPlaneStackableIndex = index;
  }

  if (lastDeskPlaneStackableIndex === -1) return undefined;

  const lastDeskPlaneStackable = items[lastDeskPlaneStackableIndex];
  if (item.stackIndex > lastDeskPlaneStackable.stackIndex) return undefined;

  return lastDeskPlaneStackableIndex + 1;
}

export function isClosingFromFocus(entity: Entity) {
  return entity.get(PolaroidFocusMotion)?.phase === 'closing';
}

export function isThresholdItem(entity: Entity, restackThreshold: number) {
  if (restackThreshold <= 0) return false;
  if (entity.has(IsEnteringDesk)) return false;

  // A polaroid descending from focus is still controlled by its close spring,
  // but it should join the desk plane layer at the threshold like any fall.
  if (!isClosingFromFocus(entity) && (entity.has(IsControlled) || entity.has(IsOpen))) {
    return false;
  }

  const position = entity.get(Position);
  const velocity = entity.get(Velocity);
  if (!position || !velocity) return false;

  return position.z <= restackThreshold && velocity.z <= 0;
}
