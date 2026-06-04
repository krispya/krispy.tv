import { Entity } from 'koota';
import { useQueryFirst } from 'koota/react';
import { getDeskFillTransform } from '../camera.js';
import { getDeskBaseStyle, getDeskFoamLayerStyle } from '../desk-background.js';
import { Desk } from '../traits';

export function DeskRenderer() {
  const desk = useQueryFirst(Desk);
  return desk && <DeskView entity={desk} />;
}

function DeskView({ entity: _entity }: { entity: Entity }) {
  const foamStyle = getDeskFoamLayerStyle();

  const fillTransform = getDeskFillTransform();

  return (
    <div
      style={{
        ...getDeskBaseStyle(),
        transform: fillTransform,
        transformOrigin: 'center center',
      }}
      className="absolute inset-0 touch-none select-none"
    >
      {foamStyle && (
        <div aria-hidden className="pointer-events-none absolute inset-0" style={foamStyle} />
      )}
    </div>
  );
}
