import type { Entity } from 'koota';
import { useHas, useQuery, useTarget, useTrait, useTraitEffect, useWorld } from 'koota/react';
import { lazy, Suspense, useRef } from 'react';
import { ActiveSlug, IsPreloading, Paper, SketchMotion, SketchOf } from '../traits/index.js';

const Sketch = lazy(() =>
  import('../../sketch/index.js').then((module) => ({ default: module.Sketch }))
);

export function SketchRenderer() {
  const entities = useQuery(SketchOf('*'));
  return entities.map((entity) => <SketchView key={entity.id()} entity={entity} />);
}

function SketchView({ entity }: { entity: Entity }) {
  const backdropRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const world = useWorld();
  const onDismiss = () => world.set(ActiveSlug, { slug: '' });

  useTraitEffect(entity, SketchMotion, (motion) => {
    if (!motion) return;
    if (backdropRef.current) {
      backdropRef.current.style.opacity = String(1 - motion.progress);
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${motion.progress * 100}%)`;
    }
  });

  const paper = useTarget(entity, SketchOf);
  const id = useTrait(paper, Paper)?.id;
  const preloading = useHas(entity, IsPreloading);

  if (!id) return null;

  return (
    <div
      className="fixed inset-0 z-2000"
      style={{
        pointerEvents: preloading ? 'none' : undefined,
        visibility: preloading ? 'hidden' : undefined,
      }}
      aria-hidden={preloading ? true : undefined}
    >
      <button
        type="button"
        ref={backdropRef}
        className="absolute inset-0 bg-black/30"
        style={{ opacity: 0, willChange: 'opacity' }}
        aria-label="Close"
        onClick={onDismiss}
      />

      {/* The page floats over the backdrop; clicks outside it fall through
          to the backdrop and close. */}
      <div
        ref={sheetRef}
        className="pointer-events-none absolute inset-0 will-change-transform"
        style={{ transform: 'translateY(100%)' }}
      >
        <Suspense fallback={null}>
          <Sketch id={id} onClose={onDismiss} />
        </Suspense>
      </div>
    </div>
  );
}
