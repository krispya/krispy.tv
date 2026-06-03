import { Entity } from 'koota';
import { useQueryFirst } from 'koota/react';
import { getDeskBaseStyle, getDeskFoamLayerStyle } from '../desk-background.js';
import { Desk } from '../traits';

export function DeskRenderer() {
  const desk = useQueryFirst(Desk);
  return desk && <DeskView entity={desk} />;
}

function DeskView({ entity: _entity }: { entity: Entity }) {
  const foamStyle = getDeskFoamLayerStyle();

  return (
    <div style={getDeskBaseStyle()} className="relative h-dvh touch-none overflow-hidden select-none">
      {foamStyle && (
        <div aria-hidden className="pointer-events-none absolute inset-0" style={foamStyle} />
      )}
    </div>
  );
}
