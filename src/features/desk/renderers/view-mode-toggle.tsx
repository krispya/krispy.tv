import { useActions, useTrait, useWorld } from 'koota/react';
import { actions } from '../actions.js';
import { ActiveSlug, ViewMode } from '../traits/index.js';

export function ViewModeToggle() {
  const world = useWorld();
  const viewMode = useTrait(world, ViewMode);
  const activeSlug = useTrait(world, ActiveSlug);
  const { toggleViewMode } = useActions(actions);
  const isTimeline = viewMode?.mode === 'timeline';
  const hasOpenArticle = Boolean(activeSlug?.slug);

  return (
    <button
      type="button"
      onClick={toggleViewMode}
      className={`fixed top-4 left-4 z-[1500] flex h-10 items-center gap-2 rounded-full bg-white/90 px-4 text-sm font-medium text-gray-700 shadow-lg backdrop-blur transition-[background-color,color,opacity] duration-200 hover:bg-white hover:text-gray-950 ${
        hasOpenArticle ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      aria-label={isTimeline ? 'Switch to desk view' : 'Switch to timeline view'}
      aria-hidden={hasOpenArticle}
    >
      {isTimeline ? (
        <>
          <DeskIcon />
          Desk
        </>
      ) : (
        <>
          <TimelineIcon />
          Timeline
        </>
      )}
    </button>
  );
}

function DeskIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.502 3.502 0 0 1 1.1 1.677A.75.75 0 0 1 13.086 18H6.914a.75.75 0 0 1-.659-1.323A3.502 3.502 0 0 1 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Z" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
