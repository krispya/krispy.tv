import { Sketch } from './sketch.js';

export function SketchRoute({ id }: { id: string }) {
  return (
    <div className="relative h-dvh bg-black/85">
      <Sketch id={id} />
    </div>
  );
}
