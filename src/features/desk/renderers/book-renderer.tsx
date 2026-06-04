import type { Entity } from 'koota';
import { useActions, useHas, useQuery, useTrait } from 'koota/react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { BoundingBoxDebug, useDebug } from '../../debug/index.js';
import { actions } from '../actions.js';
import {
  AngularVelocity,
  Book,
  Dragging,
  IsResting,
  Position,
  Pressed,
  Ref,
  Rotation,
  Selected,
  Velocity,
} from '../traits/index.js';
import { color } from '../../../color.js';
import { cssPixelsToMeters, metersToCssPixels } from '../utils/physics-units.js';
import { getBookDepthMeters } from '../utils/resting-height.js';
import { hashSeed, SketchOutline } from './sketch-outline.js';
import { shade } from '../utils/color.js';

const DRAG_THRESHOLD_PX = 5;
// Below this depth (px) the spine/page-edge slivers are too thin for a
// legible sketched outline, so we leave them unsketched.
const SKETCH_EDGE_MIN_DEPTH_PX = 6;
// Book lies flat like paper; a tiny tilt reveals just a sliver of the page edges.
const BASE_BOOK_ROTATE_X = 5;
const BASE_BOOK_ROTATE_Y = 3;

type BookStyle = CSSProperties & Record<`--${string}`, string>;

const BOOK_INITIAL_STYLE = {
  '--book-z': '0px',
  '--book-rotate-x': '0deg',
  '--book-rotate-y': '0deg',
  '--book-rotate-z': '0deg',
  '--book-lift-scale': '1',
  '--book-shadow-size': '0px',
  '--book-shadow-clip': 'none',
  '--book-shadow-lift': 'none',
  '--book-shadow-blur': '1px',
  '--book-shadow-opacity': '0.4',
} satisfies BookStyle;

const PAGE_LINE_LIGHT = color.surface.paper;
const PAGE_LINE_DARK = color.surface.paperEdge;
// Lines run horizontally and repeat down the face (head/tail edges).
const PAGE_EDGE_HORIZONTAL_LINES = `repeating-linear-gradient(to bottom, ${PAGE_LINE_LIGHT} 0px, ${PAGE_LINE_LIGHT} 2px, ${PAGE_LINE_DARK} 2px, ${PAGE_LINE_DARK} 3px)`;
// Lines run vertically and repeat across the face (fore-edge).
const PAGE_EDGE_VERTICAL_LINES = `repeating-linear-gradient(to right, ${PAGE_LINE_LIGHT} 0px, ${PAGE_LINE_LIGHT} 2px, ${PAGE_LINE_DARK} 2px, ${PAGE_LINE_DARK} 3px)`;

export function BookRenderer() {
  const entities = useQuery(Book, Position, Rotation);
  return entities.map((entity) => <BookView key={entity.id()} entity={entity} />);
}

function BookView({ entity }: { entity: Entity }) {
  const book = useTrait(entity, Book);
  const isDragging = useHas(entity, Dragging);
  const isSelected = useHas(entity, Selected);
  const { raiseDeskItem } = useActions(actions);

  const { enabled: isDebug } = useDebug();

  function handleInit(element: HTMLDivElement | null) {
    if (!element) return;

    entity.add(Ref(element));

    return () => entity.remove(Ref);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const position = entity.get(Position) ?? { x: 0, y: 0, z: 0 };
    const offset = {
      x: cssPixelsToMeters(event.clientX) - position.x,
      y: cssPixelsToMeters(event.clientY) - position.y,
    };
    const rotation = entity.get(Rotation) ?? { x: 0, y: 0, z: 0 };

    entity.remove(Dragging, IsResting);
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
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
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
    entity.add(
      Dragging({
        offset: pressed.offset,
        rotation: pressed.rotation,
        liftProgress: 0,
      })
    );
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const pressed = entity.get(Pressed);
    const dragging = entity.get(Dragging);

    if (pressed && pressed.pointerId === event.pointerId) {
      entity.remove(Pressed);
      entity.remove(Selected);
    }

    if (dragging) {
      entity.remove(Dragging);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerCancel() {
    entity.remove(Pressed);
    entity.remove(Selected);
    entity.remove(Dragging);
  }

  function handleLostPointerCapture(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons === 0) {
      entity.remove(Pressed);
      entity.remove(Selected);
      entity.remove(Dragging);
    }
  }

  if (!book) return null;

  const depth = metersToCssPixels(getBookDepthMeters(book));
  const halfDepth = depth / 2;
  const halfWidth = book.width / 2;
  const halfHeight = book.height / 2;
  const faceCenterX = (book.width - depth) / 2;
  const faceCenterY = (book.height - depth) / 2;
  const title = book.title || book.id;
  const spineColor = shade(book.color, -28);
  const sketchEdges = depth >= SKETCH_EDGE_MIN_DEPTH_PX;
  const seed = hashSeed(book.id);

  return (
    <div
      ref={handleInit}
      className="absolute top-0 left-0 isolate will-change-transform [transform-style:preserve-3d]"
      style={{
        ...BOOK_INITIAL_STYLE,
        width: book.width,
        height: book.height,
        marginLeft: book.width / -2,
        marginTop: book.height / -2,
      }}
    >
      {isDebug && <BoundingBoxDebug entity={entity} />}
      <BookShadow />
      <div
        aria-label={title}
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        className={`absolute inset-0 cursor-grab touch-none select-none ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
      >
        <div
          className="absolute inset-0 will-change-transform [transform-style:preserve-3d]"
          style={{
            transform: `translateZ(var(--book-z)) rotateX(calc(var(--book-rotate-x) + ${BASE_BOOK_ROTATE_X}deg)) rotateY(calc(var(--book-rotate-y) - ${BASE_BOOK_ROTATE_Y}deg)) rotateZ(var(--book-rotate-z)) scale(var(--book-lift-scale))`,
          }}
        >
          <BookFace
            width={book.width}
            height={book.height}
            seed={seed + 1}
            className={`rounded-[6px] ${
              isSelected || isDragging ? 'outline-4 outline-offset-2 outline-blue-500' : ''
            }`}
            style={{
              backgroundColor: book.color,
              ...(book.coverImage && {
                backgroundImage: `url(${book.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }),
              transform: `translateZ(${halfDepth}px)`,
            }}
          >
            <div className="absolute inset-x-8 top-10 border-t border-white/35" />
            <div className="absolute inset-x-8 bottom-10 border-t border-black/20" />
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 text-center font-serif text-3xl leading-tight font-bold tracking-wide text-white uppercase drop-shadow-sm">
              {title}
            </div>
          </BookFace>
          <BookFace
            width={book.width}
            height={book.height}
            seed={seed + 2}
            className="rounded-[6px]"
            style={{
              backgroundColor: shade(book.color, -18),
              transform: `rotateY(180deg) translateZ(${halfDepth}px)`,
            }}
          />
          <BookFace
            width={depth}
            height={book.height}
            seed={sketchEdges ? seed + 3 : undefined}
            style={{
              left: faceCenterX,
              backgroundColor: spineColor,
              backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.28), rgba(255,255,255,0.08))',
              transform: `rotateY(-90deg) translateZ(${halfWidth}px)`,
            }}
          />
          <BookFace
            width={depth}
            height={book.height}
            seed={sketchEdges ? seed + 4 : undefined}
            style={{
              left: faceCenterX,
              background: PAGE_EDGE_VERTICAL_LINES,
              transform: `rotateY(90deg) translateZ(${halfWidth}px)`,
            }}
          />
          <BookFace
            width={book.width}
            height={depth}
            seed={sketchEdges ? seed + 5 : undefined}
            style={{
              top: faceCenterY,
              background: PAGE_EDGE_HORIZONTAL_LINES,
              transform: `rotateX(90deg) translateZ(${halfHeight}px)`,
            }}
          />
          <BookFace
            width={book.width}
            height={depth}
            seed={sketchEdges ? seed + 6 : undefined}
            style={{
              top: faceCenterY,
              background: PAGE_EDGE_HORIZONTAL_LINES,
              transform: `rotateX(-90deg) translateZ(${halfHeight}px)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function BookShadow() {
  // Blur lives on the wrapper so clip-path (on the child) doesn't hard-clip the soft edge.
  // clip-path is applied after filters within an element, which would erase the blur.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 will-change-transform"
      style={{
        width: 'var(--book-shadow-size)',
        height: 'var(--book-shadow-size)',
        marginLeft: 'calc(var(--book-shadow-size) / -2)',
        marginTop: 'calc(var(--book-shadow-size) / -2)',
        transform: 'var(--book-shadow-lift)',
        filter: 'blur(var(--book-shadow-blur))',
      }}
    >
      <div
        className="size-full bg-stone-950"
        style={{
          opacity: 'var(--book-shadow-opacity)',
          clipPath: 'var(--book-shadow-clip)',
        }}
      />
    </div>
  );
}

function BookFace({
  width,
  height,
  seed,
  children,
  className = '',
  style,
}: {
  width: number;
  height: number;
  seed?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`absolute top-0 left-0 shadow-sm [backface-visibility:hidden] ${className}`}
      style={{ width, height, ...style }}
    >
      {children}
      {seed !== undefined && <SketchOutline width={width} height={height} seed={seed} />}
    </div>
  );
}
