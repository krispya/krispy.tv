import type { Entity } from 'koota';
import { useActions, useHas, useQuery, useTrait, useWorld } from 'koota/react';
import { useCallback, type CSSProperties } from 'react';
import { color } from '../../../color.js';
import { getPolaroid } from '../../polaroid/index.js';
import { BoundingBoxDebug, useDebug } from '../../debug/index.js';
import { actions } from '../actions.js';
import { PolaroidGlossOverlay } from './polaroid-gloss-overlay.js';
import {
  AngularVelocity,
  Dragging,
  IsControlled,
  IsDroppedFromDragging,
  IsOpen,
  IsResting,
  Polaroid,
  PolaroidFocusMotion,
  PolaroidFocusSpin,
  Pressed,
  Position,
  Ref,
  Rotation,
  Selected,
  Velocity,
  Viewport,
} from '../traits/index.js';
import { screenPointToDeskMetersForWorld } from '../utils/camera.js';
import {
  getShadowBoilFrameStyle,
  getShadowBoilPhaseOffset,
  SHADOW_BOIL_FRAME_COUNT,
} from '../presentation/shadow.js';
import { ITEM_PERSPECTIVE_PX } from '../presentation/stage.js';
import { POLAROID_LINES_COLOR } from '../presentation/polaroid-lines.js';
import {
  getPolaroidFocusBodyPlacement,
  POLAROID_FOCUS_BODY_SHIFT_PX,
  POLAROID_FOCUSED_SCALE,
} from '../presentation/polaroid-focus.js';
import { PolaroidLinesOverlay } from './polaroid-lines-overlay.js';

const DRAG_THRESHOLD_PX = 5;
const FRAME_PADDING_PX = 12;
const POLAROID_CAPTION_IMAGE_COLOR = color.line.ink;
type PolaroidStyle = CSSProperties & Record<`--${string}`, string>;

const POLAROID_INITIAL_STYLE = {
  '--item-perspective': `${ITEM_PERSPECTIVE_PX}px`,
  '--item-persp-x': '0px',
  '--item-persp-y': '0px',
  '--paper-z': '0px',
  '--paper-rotate-x': '0deg',
  '--paper-rotate-y': '0deg',
  '--paper-rotate-z': '0deg',
  '--paper-lift-scale': '1',
  '--shadow-offset-x': '2px',
  '--shadow-offset-y': '3px',
  '--shadow-scale-x': '1',
  '--shadow-scale-y': '1',
  '--shadow-opacity': '0.2',
  '--focus-progress': '0',
} satisfies PolaroidStyle;

export function PolaroidRenderer() {
  const entities = useQuery(Polaroid, Position, Rotation);
  return entities.map((entity) => <PolaroidView key={entity.id()} entity={entity} />);
}

function PolaroidView({ entity }: { entity: Entity }) {
  const polaroid = useTrait(entity, Polaroid);
  const world = useWorld();
  const viewport = useTrait(world, Viewport);
  const isDragging = useHas(entity, Dragging);
  const isFocusSpinning = useHas(entity, PolaroidFocusSpin);
  const isOpen = useHas(entity, IsOpen);
  const {
    endPolaroidFocusSpin,
    openPolaroid,
    raiseDeskItem,
    startPolaroidFocusSpin,
    updatePolaroidFocusSpin,
  } = useActions(actions);

  const { enabled: isDebug } = useDebug();

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

      if (entity.has(IsOpen)) {
        startPolaroidFocusSpin(
          entity,
          event.pointerId,
          event.clientX,
          event.clientY,
          event.timeStamp,
          event.pointerType
        );
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }

      const position = entity.get(Position) ?? { x: 0, y: 0, z: 0 };
      const deskPoint = screenPointToDeskMetersForWorld(world, event.clientX, event.clientY);
      const offset = {
        x: deskPoint.x - position.x,
        y: deskPoint.y - position.y,
      };
      const rotation = entity.get(Rotation) ?? { x: 0, y: 0, z: 0 };

      // Grabbing also interrupts a polaroid that is still closing from focus:
      // dropping the focus spring and control hands it back to physics.
      entity.remove(Dragging, IsDroppedFromDragging, IsResting, PolaroidFocusMotion, IsControlled);
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
    [entity, startPolaroidFocusSpin, world]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (entity.has(IsOpen)) {
        updatePolaroidFocusSpin(
          entity,
          event.pointerId,
          event.clientX,
          event.clientY,
          event.timeStamp
        );
        return;
      }

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
    [entity, raiseDeskItem, updatePolaroidFocusSpin]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const pressed = entity.get(Pressed);
      const dragging = entity.get(Dragging);

      if (entity.has(IsOpen)) {
        endPolaroidFocusSpin(entity, event.pointerId);

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        return;
      }

      if (pressed && pressed.pointerId === event.pointerId) {
        openPolaroid(entity);
      }

      if (dragging) {
        entity.remove(Dragging, IsControlled);
        entity.add(IsDroppedFromDragging);
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [endPolaroidFocusSpin, entity, openPolaroid]
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      endPolaroidFocusSpin(entity, event.pointerId);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      entity.remove(Pressed);
      entity.remove(Selected);
      if (entity.has(Dragging)) {
        entity.add(IsDroppedFromDragging);
        entity.remove(Dragging, IsControlled);
      }
    },
    [endPolaroidFocusSpin, entity]
  );

  const clearPointerState = useCallback(() => {
    entity.remove(Pressed);
    entity.remove(Selected);
    if (entity.has(Dragging)) {
      entity.add(IsDroppedFromDragging);
      entity.remove(Dragging, IsControlled);
    }
  }, [entity]);

  const handleLostPointerCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.buttons === 0) {
        endPolaroidFocusSpin(entity, event.pointerId);
        clearPointerState();
      }
    },
    [clearPointerState, endPolaroidFocusSpin, entity]
  );

  if (!polaroid) return null;

  const imageSize = polaroid.width - FRAME_PADDING_PX * 2;
  const hasBody = getPolaroid(polaroid.id)?.hasBody ?? false;
  // Shift the card left while focused so it makes room for the body beside
  // it. Skipped on narrow viewports where the body sits below instead. The
  // translate sits after the scale, so divide by the focus scale to get the
  // desired desk-plane shift.
  const shiftsForBody = hasBody && getPolaroidFocusBodyPlacement(viewport?.width ?? 0) === 'right';
  const focusShiftTransform = shiftsForBody
    ? ` translateX(calc(var(--focus-progress) * ${-POLAROID_FOCUS_BODY_SHIFT_PX / POLAROID_FOCUSED_SCALE}px))`
    : '';

  return (
    <div
      ref={handleInit}
      className="absolute top-0 left-0 isolate will-change-transform [transform-style:preserve-3d]"
      style={{
        ...POLAROID_INITIAL_STYLE,
        width: polaroid.width,
        height: polaroid.height,
        marginLeft: polaroid.width / -2,
        marginTop: polaroid.height / -2,
      }}
    >
      {isDebug && <BoundingBoxDebug entity={entity} />}
      <PolaroidShadow polaroidId={polaroid.id} />
      <div
        aria-label="Photo"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onDragStart={(event) => event.preventDefault()}
        className={`absolute inset-0 touch-none rounded-[3px] select-none [-webkit-user-drag:none] ${
          isOpen ? (isFocusSpinning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-grab'
        } ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{
          transform: `translateZ(var(--paper-z)) rotateZ(var(--paper-rotate-z)) scale(var(--paper-lift-scale))${focusShiftTransform}`,
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
              transform: 'rotateX(var(--paper-rotate-x)) rotateY(var(--paper-rotate-y))',
            }}
          >
            <div className="absolute inset-0 [transform:translateZ(0.5px)] overflow-visible rounded-[3px] bg-[#f8f6f0] p-3 shadow-inner [backface-visibility:hidden]">
              <PolaroidPhoto id={polaroid.id} imageSrc={polaroid.imageSrc} imageSize={imageSize} />
              <PolaroidCaption
                caption={polaroid.caption}
                imageAlt={polaroid.captionImageAlt}
                imageSrc={polaroid.captionImageSrc}
              />
              <PolaroidLinesOverlay
                polaroidId={polaroid.id}
                kind="outer"
                lineColor={POLAROID_LINES_COLOR}
              />
            </div>
            <div className="absolute inset-0 [transform:rotateY(180deg)_translateZ(0.5px)] overflow-visible rounded-[3px] bg-[#eee7da] p-4 shadow-inner [backface-visibility:hidden]">
              <div className="absolute inset-3 rounded-[2px] border border-stone-300/70" />
              <div className="absolute inset-x-8 top-8 h-px bg-stone-300/70" />
              <div className="absolute inset-x-8 top-[52px] h-px bg-stone-300/50" />
              <div className="absolute inset-x-8 top-[72px] h-px bg-stone-300/40" />
              <div className="absolute right-6 bottom-6 h-8 w-14 rounded-[2px] border border-stone-300/70" />
              <PolaroidLinesOverlay
                polaroidId={`${polaroid.id}:back`}
                kind="outer"
                lineColor={POLAROID_LINES_COLOR}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolaroidCaption({
  caption,
  imageAlt,
  imageSrc,
}: {
  caption: string;
  imageAlt: string;
  imageSrc: string;
}) {
  if (imageSrc) {
    return (
      <span className="relative mx-auto mt-1.5 block w-fit max-w-[78%]">
        <img
          src={imageSrc}
          alt={imageAlt}
          draggable={false}
          className="block h-8 max-w-full object-contain opacity-0"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundColor: POLAROID_CAPTION_IMAGE_COLOR,
            WebkitMaskImage: `url(${imageSrc})`,
            maskImage: `url(${imageSrc})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          }}
        />
      </span>
    );
  }

  if (!caption) return null;

  return <p className="mt-2 text-center text-sm text-stone-700">{caption}</p>;
}

function PolaroidPhoto({
  id,
  imageSrc,
  imageSize,
}: {
  id: string;
  imageSrc: string;
  imageSize: number;
}) {
  return (
    <div
      className="relative isolate shrink-0 overflow-visible"
      style={{ width: imageSize, height: imageSize }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img src={imageSrc} alt="" draggable={false} className="h-full w-full object-cover" />
        <PolaroidGlossOverlay id={id} size={imageSize} />
      </div>
      <PolaroidLinesOverlay
        polaroidId={`${id}:image`}
        kind="inner"
        lineColor={POLAROID_LINES_COLOR}
      />
    </div>
  );
}

function PolaroidShadow({ polaroidId }: { polaroidId: string }) {
  const phaseOffset = getShadowBoilPhaseOffset(polaroidId);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 will-change-transform"
      style={
        {
          '--boil-phase': `${phaseOffset}s`,
          opacity: 'var(--shadow-opacity)',
          transform:
            'translate(var(--shadow-offset-x), var(--shadow-offset-y)) rotate(var(--paper-rotate-z)) scale(var(--shadow-scale-x), var(--shadow-scale-y))',
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
          style={{
            transform: 'rotateX(var(--paper-rotate-x)) rotateY(var(--paper-rotate-y))',
          }}
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
