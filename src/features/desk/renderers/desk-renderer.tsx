import { Entity } from 'koota';
import { useQueryFirst } from 'koota/react';
import { getDeskBaseStyle, getDeskFoamLayerStyle } from '../presentation/background.js';
import { Desk } from '../traits';

const DESK_WORLD_SURFACE_SIZE_PX = 20000;
const DESK_WORLD_SURFACE_OFFSET_PX = DESK_WORLD_SURFACE_SIZE_PX / -2;

export function DeskRenderer() {
  const desk = useQueryFirst(Desk);
  return desk && <DeskView entity={desk} />;
}

function DeskView({ entity: _entity }: { entity: Entity }) {
  const foamStyle = getDeskFoamLayerStyle();

  return (
    <div
      style={{
        ...getDeskBaseStyle(),
        left: DESK_WORLD_SURFACE_OFFSET_PX,
        top: DESK_WORLD_SURFACE_OFFSET_PX,
        width: DESK_WORLD_SURFACE_SIZE_PX,
        height: DESK_WORLD_SURFACE_SIZE_PX,
      }}
      className="absolute touch-none select-none"
    >
      {foamStyle && (
        <div aria-hidden className="pointer-events-none absolute inset-0" style={foamStyle} />
      )}
    </div>
  );
}
