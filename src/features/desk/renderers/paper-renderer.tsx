import type { Entity } from 'koota';
import { useActions, useHas, useQuery, useTrait, useWorld } from 'koota/react';
import { useCallback, type CSSProperties } from 'react';
import { color } from '../../../color.js';
import { BoundingBoxDebug, useDebug } from '../../debug/index.js';
import { actions } from '../actions.js';
import {
  AngularVelocity,
  ActiveSlug,
  Dragging,
  IsControlled,
  IsDroppedFromDragging,
  IsResting,
  Paper,
  Pressed,
  Position,
  Ref,
  Rotation,
  Selected,
  Velocity,
} from '../traits/index.js';
import { screenPointToDeskMetersForWorld } from '../utils/camera.js';
import {
  getShadowBoilFrameStyle,
  getShadowBoilPhaseOffset,
  SHADOW_BOIL_FRAME_COUNT,
} from '../presentation/shadow.js';
import { ITEM_PERSPECTIVE_PX } from '../presentation/stage.js';
import { PaperLinesOverlay } from './paper-lines-overlay.js';
// Import the store module directly so the sketch surface stays lazy-loaded.
import { useSketchTexture } from '../../sketch/store.js';

const DRAG_THRESHOLD_PX = 5;
type PaperStyle = CSSProperties & Record<`--${string}`, string>;

const PAPER_INITIAL_STYLE = {
  '--item-perspective': `${ITEM_PERSPECTIVE_PX}px`,
  '--item-persp-x': '0px',
  '--item-persp-y': '0px',
  '--item-z': '0px',
  '--item-rotate-x': '0deg',
  '--item-rotate-y': '0deg',
  '--item-rotate-z': '0deg',
  '--item-lift-scale': '1',
  '--item-focus-progress': '0',
  '--shadow-offset-x': '2px',
  '--shadow-offset-y': '3px',
  '--shadow-scale-x': '1',
  '--shadow-scale-y': '1',
  '--shadow-opacity': '0.2',
} satisfies PaperStyle;
const PAPER_TEXTURE_OVERLAYS = [
  'linear-gradient(17deg, rgba(49, 35, 18, 0.024), rgba(49, 35, 18, 0.04))',
  'linear-gradient(133deg, rgba(75, 57, 26, 0.032), rgba(75, 57, 26, 0.048))',
  'linear-gradient(251deg, rgba(34, 52, 65, 0.026), rgba(34, 52, 65, 0.04))',
  'linear-gradient(68deg, rgba(56, 67, 38, 0.022), rgba(56, 67, 38, 0.038))',
  'linear-gradient(309deg, rgba(83, 45, 49, 0.02), rgba(83, 45, 49, 0.036))',
];
const PAPER_IMAGE_SHADOW_CONFORM = color.image.blackConform;

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function getPaperTextureOverlay(id: string): string {
  return PAPER_TEXTURE_OVERLAYS[hashString(id) % PAPER_TEXTURE_OVERLAYS.length];
}

function getArticleTextureSrc(id: string): string {
  return `${import.meta.env.BASE_URL}images/articles/${encodeURIComponent(id)}.png`;
}

export function PaperRenderer() {
  const entities = useQuery(Paper, Position, Rotation);
  return entities.map((entity) => <PaperView key={entity.id()} entity={entity} />);
}

function PaperView({ entity }: { entity: Entity }) {
  const paper = useTrait(entity, Paper);
  const world = useWorld();
  const isDragging = useHas(entity, Dragging);
  const { raiseDeskItem } = useActions(actions);

  const { enabled: isDebug } = useDebug();

  const isOpenable = paper?.openable ?? true;
  const isSketchable = paper?.sketchable ?? false;
  const sketchTexture = useSketchTexture(paper?.id ?? '');

  const handleInit = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;

      entity.add(Ref(element));

      return () => entity.remove(Ref);
    },
    [entity]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const position = entity.get(Position) ?? { x: 0, y: 0, z: 0 };
      const deskPoint = screenPointToDeskMetersForWorld(world, event.clientX, event.clientY);
      const offset = {
        x: deskPoint.x - position.x,
        y: deskPoint.y - position.y,
      };
      const rotation = entity.get(Rotation) ?? { x: 0, y: 0, z: 0 };

      entity.remove(Dragging, IsDroppedFromDragging, IsResting);
      entity.set(Velocity, { x: 0, y: 0, z: 0 });
      entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
      entity.add(
        Pressed({
          pointerId: event.pointerId,
          origin: { x: event.clientX, y: event.clientY },
          offset,
          rotation: {
            x: rotation.x,
            y: rotation.y,
            z: rotation.z,
          },
        })
      );
      entity.add(Selected);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [entity, world]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const pressed = entity.get(Pressed);

      if (!pressed || pressed.pointerId !== event.pointerId) return;

      const dx = event.clientX - pressed.origin.x;
      const dy = event.clientY - pressed.origin.y;
      const distance = Math.hypot(dx, dy);

      if (distance < DRAG_THRESHOLD_PX) return;

      const position = entity.get(Position) ?? { x: 0, y: 0, z: 0 };

      entity.set(Position, { x: position.x, y: position.y, z: 0 });
      entity.set(Velocity, { x: 0, y: 0, z: 0 });
      entity.set(AngularVelocity, { x: 0, y: 0, z: 0 });
      entity.remove(Pressed, IsResting);
      entity.remove(Selected);
      raiseDeskItem(entity);
      entity.add(IsControlled);
      entity.add(
        Dragging({
          offset: pressed.offset,
          rotation: pressed.rotation,
          liftProgress: 0,
        })
      );
    },
    [entity, raiseDeskItem]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const pressed = entity.get(Pressed);
      const dragging = entity.get(Dragging);

      if (pressed && pressed.pointerId === event.pointerId) {
        entity.remove(Pressed);
        entity.remove(Selected);

        if (paper?.openable || paper?.sketchable) {
          world.set(ActiveSlug, { slug: paper.id });
        }
      }

      if (dragging) {
        entity.remove(Dragging, IsControlled);
        entity.add(IsDroppedFromDragging);
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [entity, paper, world]
  );

  const handlePointerCancel = useCallback(() => {
    entity.remove(Pressed);
    entity.remove(Selected);
    if (entity.has(Dragging)) entity.add(IsDroppedFromDragging);
    entity.remove(Dragging, IsControlled);
  }, [entity]);

  const handleLostPointerCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.buttons === 0) {
        entity.remove(Pressed);
        entity.remove(Selected);
        if (entity.has(Dragging)) entity.add(IsDroppedFromDragging);
        entity.remove(Dragging, IsControlled);
      }
    },
    [entity]
  );

  if (!paper) return null;

  return (
    <div
      ref={handleInit}
      className="absolute top-0 left-0 isolate will-change-transform [transform-style:preserve-3d]"
      style={{
        ...PAPER_INITIAL_STYLE,
        width: paper.width,
        height: paper.height,
        marginLeft: paper.width / -2,
        marginTop: paper.height / -2,
      }}
    >
      {isDebug && <BoundingBoxDebug entity={entity} />}
      <PaperShadow paperId={paper.id} />
      <div
        role={isOpenable || isSketchable ? 'button' : undefined}
        tabIndex={isOpenable || isSketchable ? 0 : undefined}
        aria-label={isOpenable ? 'Open article' : isSketchable ? 'Draw on page' : 'Blank sheet'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onDragStart={(event) => event.preventDefault()}
        className={`absolute inset-0 cursor-grab touch-none rounded-[3px] select-none [-webkit-user-drag:none] ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{
          transform:
            'translateZ(var(--item-z)) rotateZ(var(--item-rotate-z)) scale(var(--item-lift-scale))',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            perspective: 'var(--item-perspective)',
            perspectiveOrigin: 'calc(50% + var(--item-persp-x)) calc(50% + var(--item-persp-y))',
          }}
        >
          <div
            className="absolute inset-0 will-change-transform [transform-style:preserve-3d]"
            style={{
              transform: 'rotateX(var(--item-rotate-x)) rotateY(var(--item-rotate-y))',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3px] p-6 text-left text-gray-950"
              style={{
                backgroundColor: paper.color,
                ...(paper.openable && {
                  backgroundImage: `${getPaperTextureOverlay(paper.id)}, ${PAPER_IMAGE_SHADOW_CONFORM}, url(${getArticleTextureSrc(paper.id)})`,
                  backgroundBlendMode: 'multiply, lighten, normal',
                  backgroundSize: 'cover, cover, cover',
                  backgroundPosition: 'center, center, top center',
                  backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
                }),
                ...(!paper.openable &&
                  sketchTexture && {
                    backgroundImage: `${getPaperTextureOverlay(paper.id)}, url(${sketchTexture})`,
                    backgroundBlendMode: 'multiply, normal',
                    backgroundSize: 'cover, cover',
                    backgroundPosition: 'center, center',
                    backgroundRepeat: 'no-repeat, no-repeat',
                  }),
              }}
            />
            <PaperLinesOverlay paperId={paper.id} lineColor={paper.lineColor} paused={isDragging} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaperShadow({ paperId }: { paperId: string }) {
  const phaseOffset = getShadowBoilPhaseOffset(paperId);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 will-change-transform"
      style={
        {
          '--boil-phase': `${phaseOffset}s`,
          opacity: 'var(--shadow-opacity)',
          transform:
            'translate(var(--shadow-offset-x), var(--shadow-offset-y)) rotate(var(--item-rotate-z)) scale(var(--shadow-scale-x), var(--shadow-scale-y))',
        } as CSSProperties
      }
    >
      {/* Same perspective + tilt as the item so the shadow's silhouette
          skews identically to what the viewer sees. */}
      <div
        className="absolute inset-0"
        style={{
          perspective: 'var(--item-perspective)',
          perspectiveOrigin: 'calc(50% + var(--item-persp-x)) calc(50% + var(--item-persp-y))',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: 'rotateX(var(--item-rotate-x)) rotateY(var(--item-rotate-y))' }}
        >
          {Array.from({ length: SHADOW_BOIL_FRAME_COUNT }, (_, frameIndex) => (
            <div
              key={frameIndex}
              className={`shadow-boil-frame shadow-boil-frame--${frameIndex} absolute inset-0 rounded-[3px] bg-stone-950`}
              style={getShadowBoilFrameStyle(frameIndex)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
