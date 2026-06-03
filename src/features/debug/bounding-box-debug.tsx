import type { Entity } from 'koota';
import { useHas, useTrait } from 'koota/react';
import { BoundingBox, Rotation, IsStackable, StackIndex } from '../desk/traits/index.js';

export function BoundingBoxDebug({ entity }: { entity: Entity }) {
  const box = useTrait(entity, BoundingBox);
  const rotation = useTrait(entity, Rotation);
  const stackIndex = useTrait(entity, StackIndex);
  const isStackable = useHas(entity, IsStackable);

  if (!box) return null;

  const color = isStackable ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  const label = `${isStackable ? 'stackable' : 'solid'} • stack ${stackIndex?.value ?? '-'}`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 z-[2147483647] border-2"
      style={{
        width: box.width,
        height: box.height,
        marginLeft: box.width / -2,
        marginTop: box.height / -2,
        transform: `rotate(${rotation?.z ?? 0}deg)`,
        borderColor: color,
        backgroundColor: isStackable ? 'rgb(34 197 94 / 0.14)' : 'rgb(239 68 68 / 0.14)',
      }}
    >
      <div
        className="absolute top-0 left-0 px-1 py-0.5 font-mono text-[10px] whitespace-nowrap text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
    </div>
  );
}
