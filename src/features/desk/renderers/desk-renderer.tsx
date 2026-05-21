import { Entity } from 'koota';
import { useQueryFirst } from 'koota/react';
import { Desk } from '../traits';

export function DeskRenderer() {
  const desk = useQueryFirst(Desk);
  return desk && <DeskView entity={desk} />;
}

function DeskView({ entity: _entity }: { entity: Entity }) {
  return (
    <div
      style={{ backgroundColor: 'rgb(161, 123, 82)' }}
      className="relative h-screen overflow-hidden"
    />
  );
}
