import type { Entity } from 'koota';
import { useQuery, useTrait, useWorld } from 'koota/react';
import { createElement, Suspense, use, type ComponentType } from 'react';
import { getPolaroid } from '../../polaroid/index.js';
import {
  getPolaroidFocusBodyPlacement,
  POLAROID_FOCUS_BODY_BELOW_GAP_PX,
  POLAROID_FOCUS_BODY_BELOW_INSET_PX,
  POLAROID_FOCUS_BODY_GAP_PX,
  POLAROID_FOCUS_BODY_SHIFT_PX,
  POLAROID_FOCUS_BODY_WIDTH_PX,
  POLAROID_FOCUSED_SCALE,
} from '../presentation/polaroid-focus.js';
import { getInverseStageTiltTransform } from '../presentation/stage.js';
import { Camera, IsOpen, Polaroid, PolaroidFocusMotion, Viewport } from '../traits/index.js';
import { getVisibleDeskRect } from '../utils/camera.js';
import { clamp01 } from '../utils/math.js';

// Above the focus backdrop (1500), below the focused card's stack boost.
const BODY_Z_INDEX = 1600;

/**
 * MDX body floated to the right of the focused polaroid. Rendered as a
 * screen-aligned overlay (inverse stage tilt, outside the card's transform
 * tree) so it never moves, scales, or rotates with the photo.
 */
export function PolaroidFocusBody() {
  const focusedPolaroids = useQuery(Polaroid, PolaroidFocusMotion);
  const focusedPolaroid =
    focusedPolaroids.find((entity) => entity.has(IsOpen)) ?? focusedPolaroids[0];

  if (!focusedPolaroid) return null;

  return <PolaroidFocusBodyPanel entity={focusedPolaroid} />;
}

function PolaroidFocusBodyPanel({ entity }: { entity: Entity }) {
  const world = useWorld();
  const viewport = useTrait(world, Viewport);
  const camera = useTrait(world, Camera);
  const motion = useTrait(entity, PolaroidFocusMotion);
  const polaroid = useTrait(entity, Polaroid);

  if (!polaroid) return null;
  if (!getPolaroid(polaroid.id)?.hasBody) return null;

  const rect = getVisibleDeskRect(viewport, camera);
  const progress = motion ? clamp01(motion.progress) : entity.has(IsOpen) ? 1 : 0;
  const placement = getPolaroidFocusBodyPlacement(viewport?.width ?? 0);
  const scaledHalfWidthPx = (polaroid.width * POLAROID_FOCUSED_SCALE) / 2;
  const scaledHalfHeightPx = (polaroid.height * POLAROID_FOCUSED_SCALE) / 2;

  const layout =
    placement === 'right'
      ? {
          left:
            rect.x +
            rect.width / 2 -
            POLAROID_FOCUS_BODY_SHIFT_PX +
            scaledHalfWidthPx +
            POLAROID_FOCUS_BODY_GAP_PX,
          top: rect.y + rect.height / 2,
          width: POLAROID_FOCUS_BODY_WIDTH_PX,
          // Center the column on the card's vertical midline.
          transform: `translateY(-50%) ${getInverseStageTiltTransform()}`,
        }
      : (() => {
          const width = Math.min(
            POLAROID_FOCUS_BODY_WIDTH_PX,
            rect.width - POLAROID_FOCUS_BODY_BELOW_INSET_PX * 2
          );

          return {
            left: rect.x + (rect.width - width) / 2,
            top: rect.y + rect.height / 2 + scaledHalfHeightPx + POLAROID_FOCUS_BODY_BELOW_GAP_PX,
            width,
            transform: getInverseStageTiltTransform(),
          };
        })();

  return (
    <div
      className="pointer-events-none absolute select-none"
      style={{
        left: layout.left,
        top: layout.top,
        width: layout.width,
        opacity: progress,
        transform: layout.transform,
        transformOrigin: 'center center',
        zIndex: BODY_Z_INDEX,
      }}
    >
      <div
        className={`line-clamp-4 text-xl leading-snug text-stone-100/90 [text-shadow:0_1px_2px_rgb(0_0_0/0.5)] ${
          placement === 'below' ? 'text-center' : ''
        }`}
      >
        <Suspense fallback={null}>
          <PolaroidBodyContent slug={polaroid.id} />
        </Suspense>
      </div>
    </div>
  );
}

const polaroidBodyPromises = new Map<string, Promise<unknown>>();

function loadPolaroidBodyComponent(slug: string) {
  const cachedPromise = polaroidBodyPromises.get(slug);
  if (cachedPromise) return cachedPromise;

  const polaroid = getPolaroid(slug);
  if (!polaroid) return null;

  const promise = polaroid.loadComponent();
  polaroidBodyPromises.set(slug, promise);

  return promise;
}

function PolaroidBodyContent({ slug }: { slug: string }) {
  const promise = loadPolaroidBodyComponent(slug);
  if (!promise) return null;

  const Component = use(promise) as ComponentType;

  return createElement(Component);
}
