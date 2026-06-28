import type { Entity } from 'koota';
import { useActions, useHas, useQuery, useTrait, useWorld } from 'koota/react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { BoundingBoxDebug, useDebug } from '../../debug/index.js';
import { actions } from '../actions.js';
import {
  AngularVelocity,
  Book,
  Dragging,
  IsControlled,
  IsDroppedFromDragging,
  IsFocused,
  IsResting,
  ItemFocusMotion,
  ItemFocusSpin,
  Position,
  Pressed,
  Ref,
  Rotation,
  Selected,
  Velocity,
} from '../traits/index.js';
import { color } from '../../../color.js';
import {
  getShadowBoilFrameStyle,
  getShadowBoilPhaseOffset,
  SHADOW_BOIL_FRAME_COUNT,
} from '../presentation/shadow.js';
import { metersToCssPixels } from '../utils/physics-units.js';
import { getBookDepthMeters } from '../utils/resting-height.js';
import { shade, withAlpha } from '../utils/color.js';
import { screenPointToDeskMetersForWorld } from '../utils/camera.js';
import { ITEM_PERSPECTIVE_PX } from '../presentation/stage.js';
import { BOOK_LINES_COLOR, type BookLineKind } from '../presentation/book-lines.js';
import { BookLinesOverlay } from './book-lines-overlay.js';
import { StickyNoteLinesOverlay } from './sticky-note-lines-overlay.js';

const DRAG_THRESHOLD_PX = 5;
// Below this depth (px) the spine/page-edge slivers are too thin for legible line art.
const BOOK_EDGE_LINES_MIN_DEPTH_PX = 6;
// Book lies flat like paper; a tiny tilt reveals just a sliver of the page edges.
const BASE_BOOK_ROTATE_X = 5;
const BASE_BOOK_ROTATE_Y = 3;
const BOOK_VISUAL_DEPTH_SCALE = 1.8;
const BOOK_VISUAL_DEPTH_MAX_SHORT_SIDE_RATIO = 0.45;

type BookStyle = CSSProperties & Record<`--${string}`, string>;

const BOOK_INITIAL_STYLE = {
  '--item-perspective': `${ITEM_PERSPECTIVE_PX}px`,
  '--item-persp-x': '0px',
  '--item-persp-y': '0px',
  '--item-z': '0px',
  '--item-rotate-x': '0deg',
  '--item-rotate-y': '0deg',
  '--item-rotate-z': '0deg',
  '--item-lift-scale': '1',
  '--item-focus-progress': '0',
  '--book-shadow-size': '0px',
  '--book-shadow-clip': 'none',
  '--book-shadow-lift': 'none',
  '--book-shadow-opacity': '0.4',
} satisfies BookStyle;

const PAGE_LINE_LIGHT = color.surface.paper;
const PAGE_LINE_DARK = color.surface.paperEdge;
// Lines run horizontally and repeat down the face (head/tail edges).
const PAGE_EDGE_HORIZONTAL_LINES = `repeating-linear-gradient(to bottom, ${PAGE_LINE_LIGHT} 0px, ${PAGE_LINE_LIGHT} 2px, ${PAGE_LINE_DARK} 2px, ${PAGE_LINE_DARK} 3px)`;
// Lines run vertically and repeat across the face (fore-edge).
const PAGE_EDGE_VERTICAL_LINES = `repeating-linear-gradient(to right, ${PAGE_LINE_LIGHT} 0px, ${PAGE_LINE_LIGHT} 2px, ${PAGE_LINE_DARK} 2px, ${PAGE_LINE_DARK} 3px)`;
const COVER_SHADOW_CONFORM = color.image.blackConform;
const STICKY_NOTE_DEFAULT_COLOR = color.accent.gold;
/** Pixels above the cover where the note's stuck (top) edge floats. */
const STICKY_NOTE_LIFT_PX = 3;
/** Degrees. Peel of the unstuck bottom edge away from the cover. */
const STICKY_NOTE_PEEL_DEG = 14;
const STICKY_NOTE_SHADOW_CLIP_PATHS = [
  'polygon(0.2% 0%, 99.8% 0%, 113% 108%, -9% 106%)',
  'polygon(0% 0.3%, 100% 0.1%, 111% 107%, -11% 109%)',
  'polygon(0.3% 0%, 99.7% 0.2%, 114% 109%, -8% 107%)',
] as const;

export function BookRenderer() {
  const entities = useQuery(Book, Position, Rotation);
  return entities.map((entity) => <BookView key={entity.id()} entity={entity} />);
}

function BookView({ entity }: { entity: Entity }) {
  const book = useTrait(entity, Book);
  const world = useWorld();
  const isDragging = useHas(entity, Dragging);
  const isFocusSpinning = useHas(entity, ItemFocusSpin);
  const isFocused = useHas(entity, IsFocused);
  const { endItemFocusSpin, focusItem, raiseDeskItem, startItemFocusSpin, updateItemFocusSpin } =
    useActions(actions);

  const { enabled: isDebug } = useDebug();

  function handleInit(element: HTMLDivElement | null) {
    if (!element) return;

    entity.add(Ref(element));

    return () => entity.remove(Ref);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    if (entity.has(IsFocused)) {
      startItemFocusSpin(
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

    entity.remove(Dragging, IsDroppedFromDragging, IsResting, ItemFocusMotion, IsControlled);
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
    if (entity.has(IsFocused)) {
      updateItemFocusSpin(entity, event.pointerId, event.clientX, event.clientY, event.timeStamp);
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
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const pressed = entity.get(Pressed);
    const dragging = entity.get(Dragging);

    if (entity.has(IsFocused)) {
      endItemFocusSpin(entity, event.pointerId);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (pressed && pressed.pointerId === event.pointerId) {
      entity.remove(Pressed);
      entity.remove(Selected);
      focusItem(entity);
    }

    if (dragging) {
      entity.remove(Dragging, IsControlled);
      entity.add(IsDroppedFromDragging);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    endItemFocusSpin(entity, event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    entity.remove(Pressed);
    entity.remove(Selected);
    if (entity.has(Dragging)) entity.add(IsDroppedFromDragging);
    entity.remove(Dragging, IsControlled);
  }

  function handleLostPointerCapture(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons === 0) {
      endItemFocusSpin(entity, event.pointerId);
      entity.remove(Pressed);
      entity.remove(Selected);
      if (entity.has(Dragging)) entity.add(IsDroppedFromDragging);
      entity.remove(Dragging, IsControlled);
    }
  }

  if (!book) return null;

  const stickyNote = book.hasStickyNote
    ? {
        text: book.stickyNoteText,
        color: book.stickyNoteColor,
        rotation: book.stickyNoteRotation,
      }
    : undefined;
  const physicalDepth = metersToCssPixels(getBookDepthMeters(book));
  const depth = getVisualBookDepth(book.width, book.height, physicalDepth);
  const halfDepth = depth / 2;
  const halfWidth = book.width / 2;
  const halfHeight = book.height / 2;
  const faceCenterX = (book.width - depth) / 2;
  const faceCenterY = (book.height - depth) / 2;
  const title = book.title || book.id;
  const noteText = stickyNote?.text?.trim();
  const accessibleTitle = [
    book.author ? `${title} by ${book.author}` : title,
    noteText ? `sticky note: ${noteText}` : '',
  ]
    .filter(Boolean)
    .join(', ');
  const spineColor = shade(book.color, -28);
  const showBookEdgeLines = depth >= BOOK_EDGE_LINES_MIN_DEPTH_PX;
  const frontCoverImageStyle = getCoverImageStyle(book.coverImage);
  const backCoverImageStyle = getCoverImageStyle(book.backCoverImage);
  const spineImageStyle = getCoverImageStyle(book.spineImage);

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
      <BookShadow bookId={book.id} />
      <div
        aria-label={accessibleTitle}
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        className={`absolute inset-0 cursor-grab touch-none select-none ${
          isFocused && isFocusSpinning ? 'cursor-grabbing' : ''
        } ${isDragging ? 'cursor-grabbing' : ''}`}
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
              transform: `rotateX(calc(var(--item-rotate-x) + ${BASE_BOOK_ROTATE_X}deg)) rotateY(calc(var(--item-rotate-y) - ${BASE_BOOK_ROTATE_Y}deg))`,
            }}
          >
            {/* preserve-3d keeps the sticky note's lift/peel in the book's 3D
                context instead of flattening onto the cover. */}
            <BookFace
              width={book.width}
              height={book.height}
              bookId={book.id}
              lineKind="cover"
              lineColor={BOOK_LINES_COLOR}
              className="rounded-[6px] [transform-style:preserve-3d]"
              style={{
                backgroundColor: book.color,
                ...frontCoverImageStyle,
                transform: `translateZ(${halfDepth}px)`,
              }}
            >
              {!book.coverImage && (
                <>
                  <div className="absolute inset-x-8 top-10 border-t border-white/35" />
                  <div className="absolute inset-x-8 bottom-10 border-t border-black/20" />
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 text-center font-serif text-3xl leading-tight font-bold tracking-wide text-white uppercase drop-shadow-sm">
                    {title}
                  </div>
                </>
              )}
              {stickyNote && <StickyNote note={stickyNote} bookId={book.id} />}
            </BookFace>
            <BookFace
              width={book.width}
              height={book.height}
              bookId={book.id}
              lineKind="cover"
              lineColor={BOOK_LINES_COLOR}
              className="rounded-[6px]"
              style={{
                backgroundColor: shade(book.color, -18),
                ...backCoverImageStyle,
                transform: `rotateY(180deg) translateZ(${halfDepth}px)`,
              }}
            />
            <BookFace
              width={depth}
              height={book.height}
              bookId={book.id}
              lineKind={showBookEdgeLines ? 'spine' : undefined}
              lineColor={BOOK_LINES_COLOR}
              style={{
                left: faceCenterX,
                backgroundColor: spineColor,
                backgroundImage: spineImageStyle.backgroundImage
                  ? spineImageStyle.backgroundImage
                  : 'linear-gradient(to right, rgba(0,0,0,0.28), rgba(255,255,255,0.08))',
                backgroundBlendMode: spineImageStyle.backgroundBlendMode,
                backgroundSize: spineImageStyle.backgroundSize,
                backgroundPosition: spineImageStyle.backgroundPosition,
                transform: `rotateY(-90deg) translateZ(${halfWidth}px)`,
              }}
            />
            <BookFace
              width={depth}
              height={book.height}
              bookId={book.id}
              lineKind={showBookEdgeLines ? 'spine' : undefined}
              lineColor={BOOK_LINES_COLOR}
              style={{
                left: faceCenterX,
                background: PAGE_EDGE_VERTICAL_LINES,
                transform: `rotateY(90deg) translateZ(${halfWidth}px)`,
              }}
            />
            <BookFace
              width={book.width}
              height={depth}
              bookId={book.id}
              lineKind={showBookEdgeLines ? 'side' : undefined}
              lineColor={BOOK_LINES_COLOR}
              style={{
                top: faceCenterY,
                background: PAGE_EDGE_HORIZONTAL_LINES,
                transform: `rotateX(90deg) translateZ(${halfHeight}px)`,
              }}
            />
            <BookFace
              width={book.width}
              height={depth}
              bookId={book.id}
              lineKind={showBookEdgeLines ? 'side' : undefined}
              lineColor={BOOK_LINES_COLOR}
              style={{
                top: faceCenterY,
                background: PAGE_EDGE_HORIZONTAL_LINES,
                transform: `rotateX(-90deg) translateZ(${halfHeight}px)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getVisualBookDepth(width: number, height: number, physicalDepth: number) {
  const maxVisualDepth = Math.min(width, height) * BOOK_VISUAL_DEPTH_MAX_SHORT_SIDE_RATIO;
  return Math.max(physicalDepth, Math.min(physicalDepth * BOOK_VISUAL_DEPTH_SCALE, maxVisualDepth));
}

function getCoverImageStyle(image: string): CSSProperties {
  if (!image) return {};

  return {
    backgroundImage: `${COVER_SHADOW_CONFORM}, url(${image})`,
    backgroundBlendMode: 'lighten, normal',
    backgroundSize: 'cover, cover',
    backgroundPosition: 'center, center',
  };
}

function StickyNote({ note, bookId }: { note: StickyNoteData; bookId: string }) {
  const width = 132;
  const height = 132;
  const left = 82;
  const top = 59;
  const rotation = note.rotation ?? -7;
  const noteColor = note.color || STICKY_NOTE_DEFAULT_COLOR;
  const creaseColor = withAlpha(shade(noteColor, -60), 0.24);
  const lineColor = shade(noteColor, -42);
  const highlightColor = withAlpha('#ffffff', 0.32);
  const text = note.text?.trim();
  const textSize = Math.max(16, Math.min(22, width * 0.14));
  const stickyNoteId = `${bookId}:sticky-note`;

  return (
    <div
      aria-hidden="true"
      className="absolute [transform-style:preserve-3d]"
      style={{
        left,
        top,
        width,
        height,
        transform: `rotate(${rotation}deg) translateZ(2px)`,
      }}
    >
      <StickyNoteShadow shadowId={stickyNoteId} />
      <div
        className="absolute inset-0 rounded-[2px]"
        style={{
          // Stuck along the top edge, bottom edge peeling off the cover.
          transformOrigin: 'top center',
          transform: `translateZ(${STICKY_NOTE_LIFT_PX}px) rotateX(${STICKY_NOTE_PEEL_DEG}deg)`,
          backgroundColor: noteColor,
          backgroundImage: `linear-gradient(145deg, ${highlightColor} 0%, transparent 34%), linear-gradient(to bottom, transparent 0%, transparent 78%, ${creaseColor} 100%)`,
          boxShadow: `0 1px 0 ${withAlpha('#ffffff', 0.42)} inset`,
        }}
      >
        {text && (
          <div
            className="absolute inset-x-[12%] top-[14%] font-serif leading-tight text-[#522520]/75"
            style={{ fontSize: textSize }}
          >
            {text}
          </div>
        )}
        <StickyNoteLinesOverlay stickyNoteId={stickyNoteId} lineColor={lineColor} />
      </div>
    </div>
  );
}

function StickyNoteShadow({ shadowId }: { shadowId: string }) {
  const phaseOffset = getShadowBoilPhaseOffset(shadowId);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 will-change-transform"
      style={
        {
          '--boil-phase': `${phaseOffset}s`,
          opacity: 0.3,
          transform: 'scale(1, 1.1)',
          transformOrigin: 'top center',
        } as CSSProperties
      }
    >
      {Array.from({ length: SHADOW_BOIL_FRAME_COUNT }, (_, frameIndex) => (
        <div
          key={frameIndex}
          className={`shadow-boil-frame shadow-boil-frame--${frameIndex} absolute inset-0 bg-stone-950`}
          style={{
            ...getShadowBoilFrameStyle(frameIndex, false),
            clipPath:
              STICKY_NOTE_SHADOW_CLIP_PATHS[frameIndex % STICKY_NOTE_SHADOW_CLIP_PATHS.length],
          }}
        />
      ))}
    </div>
  );
}

type StickyNoteData = {
  text: string;
  color: string;
  rotation: number;
};

function BookShadow({ bookId }: { bookId: string }) {
  const phaseOffset = getShadowBoilPhaseOffset(bookId);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 will-change-transform"
      style={
        {
          '--boil-phase': `${phaseOffset}s`,
          width: 'var(--book-shadow-size)',
          height: 'var(--book-shadow-size)',
          marginLeft: 'calc(var(--book-shadow-size) / -2)',
          marginTop: 'calc(var(--book-shadow-size) / -2)',
          transform: 'var(--book-shadow-lift)',
          opacity: 'var(--book-shadow-opacity)',
        } as CSSProperties
      }
    >
      {/* Same perspective + tilt as the book so the shadow's silhouette
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
              className={`shadow-boil-frame shadow-boil-frame--${frameIndex} absolute inset-0 bg-stone-950`}
              style={{
                ...getShadowBoilFrameStyle(frameIndex, false),
                clipPath: 'var(--book-shadow-clip)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BookFace({
  width,
  height,
  bookId,
  lineKind,
  lineColor = BOOK_LINES_COLOR,
  children,
  className = '',
  style,
}: {
  width: number;
  height: number;
  bookId?: string;
  lineKind?: BookLineKind;
  lineColor?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`absolute top-0 left-0 shadow-sm [backface-visibility:hidden] ${className}`}
      style={{ width, height, ...style }}
    >
      {bookId && lineKind && (
        <BookLinesOverlay bookId={bookId} kind={lineKind} lineColor={lineColor} />
      )}
      {children}
    </div>
  );
}
