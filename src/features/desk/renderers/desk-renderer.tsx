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
      style={{
        backgroundColor: 'rgb(161, 123, 82)',
        backgroundImage: `url(${import.meta.env.BASE_URL}desk-wood-d.webp)`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
      className="relative h-dvh touch-none overflow-hidden select-none"
    />
  );
}
