import { Not, createAdded, type Entity, type World } from 'koota';
import {
  Desk,
  IsControlled,
  IsEnteringDesk,
  IsFocused,
  IsOpen,
  IsResting,
  ItemFocusMotion,
  Position,
  StackIndex,
  Velocity,
} from '../traits/index.js';
import {
  getDeskPlaneInsertIndex,
  getStackIndexedItems,
  renumberStackIndices,
  sortByStackIndex,
  toStackOrderItem,
  type StackOrderItem,
} from '../utils/stack-order.js';

const Added = createAdded();

export function restackDeskPlaneItems(world: World) {
  const deskPlaneRestackThreshold = world.queryFirst(Desk)?.get(Desk)?.restackThreshold ?? 0;
  const candidates: Array<{ entity: Entity; stackIndex: number }> = [];

  world.query(Added(IsResting), StackIndex).readEach(([stackIndex], entity) => {
    candidates.push({ entity, stackIndex: stackIndex.value });
  });

  if (deskPlaneRestackThreshold > 0) {
    world
      .query(
        Position,
        Velocity,
        StackIndex,
        Not(IsResting),
        Not(IsControlled),
        Not(IsEnteringDesk),
        Not(IsFocused),
        Not(ItemFocusMotion),
        Not(IsOpen)
      )
      .readEach(([position, velocity, stackIndex], entity) => {
        if (position.z > deskPlaneRestackThreshold || velocity.z > 0) return;
        candidates.push({ entity, stackIndex: stackIndex.value });
      });
  }

  sortByStackIndex(candidates);

  for (const item of candidates) {
    restackDeskPlaneItem(world, item.entity, deskPlaneRestackThreshold);
  }
}

function restackDeskPlaneItem(world: World, entity: Entity, deskPlaneRestackThreshold: number) {
  const items: StackOrderItem[] = getStackIndexedItems(world).map((item) =>
    toStackOrderItem(item.entity, item.stackIndex, deskPlaneRestackThreshold)
  );

  const itemIndex = items.findIndex((item) => item.entity === entity);
  if (itemIndex === -1) return;

  const [item] = items.splice(itemIndex, 1);
  const insertIndex = getDeskPlaneInsertIndex(item, items);
  if (insertIndex === undefined) return;
  if (insertIndex === itemIndex) return;

  items.splice(insertIndex, 0, item);

  renumberStackIndices(items);
}
