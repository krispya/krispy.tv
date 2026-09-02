import type { Entity } from 'koota';
import { useActions, useHas, useQuery, useTrait, useWorld } from 'koota/react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { BoundingBoxDebug, useDebug } from '../../debug/index.js';
import { actions } from '../actions.js';
import {
  AngularVelocity,
  Book,
  Dragging,
  FoldedPaperMotion,
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
import { clamp } from '../utils/math.js';
import {
  FOLDED_PAPER_FOLD_X_VAR,
  FOLDED_PAPER_FOLD_Y_VAR,
  FOLDED_PAPER_INITIAL_POSE_STYLE,
  FOLDED_PAPER_LAYER_PX,
  FOLDED_PAPER_LIFT_HEIGHT_PX,
  FOLDED_PAPER_DRIFT_VAR,
  FOLDED_PAPER_RISE_VAR,
  FOLDED_PAPER_PANEL_HEIGHT_PX,
  FOLDED_PAPER_PANEL_WIDTH_PX,
  FOLDED_PAPER_SHEET_HEIGHT_PX,
  FOLDED_PAPER_SHEET_WIDTH_PX,
  FOLDED_PAPER_SLIDE_GAP_PX,
  FOLDED_PAPER_SLIDE_VAR,
} from '../presentation/folded-paper.js';
import { getBookDepthMeters } from '../utils/resting-height.js';
import { shade, withAlpha } from '../utils/color.js';
import { screenPointToDeskMetersForWorld } from '../utils/camera.js';
import { ITEM_PERSPECTIVE_PX } from '../presentation/stage.js';
import { BASE_BOOK_ROTATE_X, BASE_BOOK_ROTATE_Y } from '../presentation/book.js';
import { BOOK_LINES_COLOR, type BookLineKind } from '../presentation/book-lines.js';
import { BookLinesOverlay } from './book-lines-overlay.js';
import { StickyNoteLinesOverlay } from './sticky-note-lines-overlay.js';

const DRAG_THRESHOLD_PX = 5;
// Below this depth (px) the spine/page-edge slivers are too thin for legible line art.
const BOOK_EDGE_LINES_MIN_DEPTH_PX = 6;
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
  ...FOLDED_PAPER_INITIAL_POSE_STYLE,
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
const STICKY_NOTE_INK_COLOR = withAlpha('#522520', 0.75);
/** Visual thickness of the folded packet's edge while it is tucked in. */
const FOLDED_PAPER_THICKNESS_PX = 1.6;
/** Fraction of the book height where the tucked packet's top edge sits. */
const FOLDED_PAPER_TOP_RATIO = 0.4;
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
  // Spinning is locked while the letter is out, so don't advertise a grab.
  const isLetterOut = useHas(entity, FoldedPaperMotion);
  const {
    endItemFocusSpin,
    focusItem,
    raiseDeskItem,
    startItemFocusSpin,
    toggleFoldedPaper,
    updateItemFocusSpin,
  } = useActions(actions);

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
        image: book.stickyNoteImage,
        color: book.stickyNoteColor,
        rotation: book.stickyNoteRotation,
      }
    : undefined;
  const foldedPaper = book.hasFoldedPaper
    ? {
        color: book.foldedPaperColor,
        pageFraction: book.foldedPaperPageFraction,
        overhang: book.foldedPaperOverhang,
        rotation: book.foldedPaperRotation,
        text: book.foldedPaperText,
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
    foldedPaper ? 'a folded paper tucked between the pages' : '',
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
        className="absolute inset-0"
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
            aria-label={accessibleTitle}
            role="img"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handleLostPointerCapture}
            className={`pointer-events-auto absolute inset-0 touch-none will-change-transform select-none [transform-style:preserve-3d] ${
              isFocused && isLetterOut ? 'cursor-default' : 'cursor-grab'
            } ${isFocused && isFocusSpinning ? 'cursor-grabbing' : ''} ${
              isDragging ? 'cursor-grabbing' : ''
            }`}
            style={{
              transform: `rotateX(calc(var(--item-rotate-x) + ${BASE_BOOK_ROTATE_X}deg)) rotateY(calc(var(--item-rotate-y) - ${BASE_BOOK_ROTATE_Y}deg))`,
            }}
          >
            {foldedPaper && (
              <FoldedPaper
                paper={foldedPaper}
                bookWidth={book.width}
                bookHeight={book.height}
                bookDepth={depth}
                isOut={isLetterOut}
                onToggle={() => toggleFoldedPaper(entity)}
              />
            )}
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
        {note.image ? (
          <div
            className="absolute inset-x-[10%] inset-y-[12%]"
            style={{
              backgroundColor: STICKY_NOTE_INK_COLOR,
              WebkitMaskImage: `url(${note.image})`,
              maskImage: `url(${note.image})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
            }}
          />
        ) : (
          text && (
            <div
              className="absolute inset-x-[12%] top-[14%] font-serif leading-tight text-[#522520]/75"
              style={{ fontSize: textSize }}
            >
              {text}
            </div>
          )
        )}
        <StickyNoteLinesOverlay stickyNoteId={stickyNoteId} lineColor={lineColor} />
      </div>
    </div>
  );
}

type FoldedPaperData = {
  color: string;
  pageFraction: number;
  overhang: number;
  rotation: number;
  text: string;
};

type FoldedPaperQuadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * A letter folded in quarters and slid between the pages. Tucked in, it is a
 * thin packet inside the closed book's volume, so the covers occlude everything
 * but the sliver past the fore-edge. Clicking pulls it out along the fore-edge,
 * floats it over the cover and unfolds it (bottom half first, then the right
 * half) into the full sheet. All motion comes from CSS variables the frameloop
 * writes onto the book node, so nothing here re-renders per frame.
 */
function FoldedPaper({
  paper,
  bookWidth,
  bookHeight,
  bookDepth,
  isOut,
  onToggle,
}: {
  paper: FoldedPaperData;
  bookWidth: number;
  bookHeight: number;
  bookDepth: number;
  /** Letter is out (or on its way): hover no longer nudges the packet. */
  isOut: boolean;
  onToggle: () => void;
}) {
  const panelWidth = FOLDED_PAPER_PANEL_WIDTH_PX;
  const panelHeight = FOLDED_PAPER_PANEL_HEIGHT_PX;
  const layer = FOLDED_PAPER_LAYER_PX;
  const paperColor = paper.color || color.surface.paper;
  // Tucked: fore-edge is +x and the packet's outer edge lands `overhang` px past it.
  const tuckedLeft = bookWidth + paper.overhang - panelWidth;
  const tuckedTop = (bookHeight - panelHeight) * FOLDED_PAPER_TOP_RATIO;
  const maxInset = Math.max(0, bookDepth / 2 - layer * 2 - 0.5);
  const tuckedZ = clamp(bookDepth / 2 - bookDepth * paper.pageFraction, -maxInset, maxInset);
  // Slid out: the packet fully clears the fore-edge.
  const slideX = panelWidth + FOLDED_PAPER_SLIDE_GAP_PX;
  // Lifted: the unfolded sheet is centered over the book, floating above the cover.
  const liftedLeft = (bookWidth - FOLDED_PAPER_SHEET_WIDTH_PX) / 2;
  const liftedTop = (bookHeight - FOLDED_PAPER_SHEET_HEIGHT_PX) / 2;
  const liftX = liftedLeft - (tuckedLeft + slideX);
  const liftY = liftedTop - tuckedTop;
  const liftZ = bookDepth / 2 + FOLDED_PAPER_LIFT_HEIGHT_PX - tuckedZ;
  const slide = `var(${FOLDED_PAPER_SLIDE_VAR})`;
  const rise = `var(${FOLDED_PAPER_RISE_VAR})`;
  const drift = `var(${FOLDED_PAPER_DRIFT_VAR})`;
  const foldX = `var(${FOLDED_PAPER_FOLD_X_VAR})`;
  const foldY = `var(${FOLDED_PAPER_FOLD_Y_VAR})`;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    // Keep the press from grabbing or spinning the book underneath.
    event.stopPropagation();
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    onToggle();
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  const panelProps = {
    width: panelWidth,
    height: panelHeight,
    color: paperColor,
    text: paper.text,
  };

  return (
    <div
      role="button"
      aria-label="Folded paper tucked between the pages"
      className="group absolute cursor-pointer touch-none select-none [transform-style:preserve-3d]"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{
        left: tuckedLeft,
        top: tuckedTop,
        width: panelWidth,
        height: panelHeight,
        transform: `translate3d(calc(${slide} * ${slideX}px + ${drift} * ${liftX}px), calc(${drift} * ${liftY}px), calc(${tuckedZ}px + ${rise} * ${liftZ}px)) rotateZ(calc(${paper.rotation}deg * (1 - ${drift})))`,
      }}
    >
      {/* Hover nudges the tucked packet a little further past the fore-edge. */}
      <div
        className={`absolute inset-0 transition-[translate] duration-300 ease-out [transform-style:preserve-3d] ${
          isOut ? '' : 'group-hover:translate-x-2.5'
        }`}
      >
        {/* Top-left panel is the fixed leaf every fold hinges off. */}
        <FoldedPaperPanel {...panelProps} quadrant="top-left" />
        {/* Bottom-left folds up over it; the hinge's z-shift stacks it on the outside. */}
        <div
          className="absolute [transform-style:preserve-3d]"
          style={{
            left: 0,
            top: panelHeight,
            width: panelWidth,
            height: panelHeight,
            transformOrigin: 'top center',
            transform: `translateZ(${layer * 1.5}px) rotateX(${foldX}) translateZ(${layer * -1.5}px)`,
          }}
        >
          <FoldedPaperPanel {...panelProps} quadrant="bottom-left" />
        </div>
        {/* Right half swings over the left half, carrying its own bottom fold. */}
        <div
          className="absolute [transform-style:preserve-3d]"
          style={{
            left: panelWidth,
            top: 0,
            width: panelWidth,
            height: panelHeight,
            transformOrigin: 'left center',
            transform: `translateZ(${layer * 0.5}px) rotateY(calc(-1 * ${foldY})) translateZ(${layer * -0.5}px)`,
          }}
        >
          <FoldedPaperPanel {...panelProps} quadrant="top-right" />
          <div
            className="absolute [transform-style:preserve-3d]"
            style={{
              left: 0,
              top: panelHeight,
              width: panelWidth,
              height: panelHeight,
              transformOrigin: 'top center',
              // Inside the flipped half the local x axis is mirrored, so the
              // fold direction and layer shift are negated to match the left side.
              transform: `translateZ(${layer * -0.5}px) rotateX(calc(-1 * ${foldX})) translateZ(${layer * 0.5}px)`,
            }}
          >
            <FoldedPaperPanel {...panelProps} quadrant="bottom-right" />
          </div>
        </div>
        <FoldedPaperEdges width={panelWidth} height={panelHeight} color={paperColor} />
      </div>
    </div>
  );
}

/** One quadrant of the sheet: its slice of the written side plus a blank back. */
function FoldedPaperPanel({
  width,
  height,
  color: paperColor,
  text,
  quadrant,
}: {
  width: number;
  height: number;
  color: string;
  text: string;
  quadrant: FoldedPaperQuadrant;
}) {
  const inkColor = withAlpha(BOOK_LINES_COLOR, 0.55);
  const creaseColor = withAlpha(shade(paperColor, -70), 0.07);
  const isLeft = quadrant.endsWith('left');
  const isTop = quadrant.startsWith('top');
  const offsetX = isLeft ? 0 : -width;
  const offsetY = isTop ? 0 : -height;
  // Faint crease shading along the edges that meet a fold.
  const creaseX = isLeft ? 'to left' : 'to right';
  const creaseY = isTop ? 'to top' : 'to bottom';
  // Ink the sheet's outer edges only; where quadrants meet, the crease shading
  // alone marks the fold so it doesn't read as a drawn line.
  const outerEdgeInk = [
    `inset ${isLeft ? 1 : -1}px 0 0 0 ${inkColor}`,
    `inset 0 ${isTop ? 1 : -1}px 0 0 ${inkColor}`,
  ].join(', ');
  const faceStyle: CSSProperties = {
    width,
    height,
    backgroundColor: paperColor,
  };

  return (
    <div className="absolute inset-0 [transform-style:preserve-3d]">
      <div
        className="absolute top-0 left-0 overflow-hidden [backface-visibility:hidden]"
        style={{
          ...faceStyle,
          boxShadow: outerEdgeInk,
          backgroundImage: `linear-gradient(${creaseX}, transparent 92%, ${creaseColor} 100%), linear-gradient(${creaseY}, transparent 94%, ${creaseColor} 100%)`,
        }}
      >
        <FoldedPaperWriting text={text} offsetX={offsetX} offsetY={offsetY} />
      </div>
      <div
        className="absolute top-0 left-0 [backface-visibility:hidden]"
        style={{
          ...faceStyle,
          boxShadow: `0 0 0 1px ${inkColor} inset`,
          backgroundColor: shade(paperColor, -6),
          backgroundImage: `linear-gradient(160deg, ${withAlpha('#ffffff', 0.28)} 0%, transparent 45%)`,
          transform: 'rotateY(180deg)',
        }}
      />
    </div>
  );
}

/** The whole written sheet, shifted so a panel shows only its quadrant. */
function FoldedPaperWriting({
  text,
  offsetX,
  offsetY,
}: {
  text: string;
  offsetX: number;
  offsetY: number;
}) {
  const paragraphs = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;

  return (
    <div
      className="font-typewriter text-ink/85 absolute space-y-4 px-9 py-10 text-[15px] leading-relaxed"
      style={{
        left: offsetX,
        top: offsetY,
        width: FOLDED_PAPER_SHEET_WIDTH_PX,
        height: FOLDED_PAPER_SHEET_HEIGHT_PX,
      }}
    >
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

/**
 * Thin edge faces around the tucked packet so it still reads as a stack of
 * paper when the book is viewed fore-edge on. Edge-on to the viewer once the
 * sheet is unfolded, so they vanish on their own.
 */
function FoldedPaperEdges({
  width,
  height,
  color: paperColor,
}: {
  width: number;
  height: number;
  color: string;
}) {
  const thickness = FOLDED_PAPER_THICKNESS_PX;
  const edgeColor = shade(paperColor, -22);
  const faceCenterX = (width - thickness) / 2;
  const faceCenterY = (height - thickness) / 2;
  const faceClass = 'pointer-events-none absolute top-0 left-0 [backface-visibility:hidden]';

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 [transform-style:preserve-3d]"
      style={{ transform: `translateZ(${FOLDED_PAPER_LAYER_PX * 1.5}px)` }}
    >
      <div
        className={faceClass}
        style={{
          left: faceCenterX,
          width: thickness,
          height,
          backgroundColor: edgeColor,
          transform: `rotateY(90deg) translateZ(${width / 2}px)`,
        }}
      />
      <div
        className={faceClass}
        style={{
          top: faceCenterY,
          width,
          height: thickness,
          backgroundColor: edgeColor,
          transform: `rotateX(90deg) translateZ(${height / 2}px)`,
        }}
      />
      <div
        className={faceClass}
        style={{
          top: faceCenterY,
          width,
          height: thickness,
          backgroundColor: edgeColor,
          transform: `rotateX(-90deg) translateZ(${height / 2}px)`,
        }}
      />
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
  image: string;
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
