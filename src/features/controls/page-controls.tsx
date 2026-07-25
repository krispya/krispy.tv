import { useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { routes } from '../../routes.js';

const CONTROL_CLASS_NAME =
  'flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg backdrop-blur hover:bg-white hover:text-gray-950 disabled:cursor-wait disabled:opacity-80';
const EXIT_SPINNER_DELAY_MS = 120;

/**
 * Control cluster for an open page, pinned to its top-right corner.
 * `anchor="page"` positions against the nearest positioned ancestor — the page
 * itself — while `anchor="viewport"` keeps the controls in view on pages that
 * scroll past the viewport.
 */
export function PageControls({
  anchor = 'page',
  children,
  label,
}: {
  anchor?: 'page' | 'viewport';
  children: ReactNode;
  label: string;
}) {
  return (
    <nav
      className={`${
        anchor === 'viewport' ? 'fixed' : 'absolute'
      } pointer-events-auto top-4 right-4 z-2001 flex items-center gap-2`}
      aria-label={label}
    >
      {children}
    </nav>
  );
}

export function ControlButton({
  busy = false,
  children,
  label,
  onClick,
}: {
  busy?: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={CONTROL_CLASS_NAME}
      aria-busy={busy}
      aria-label={label}
      disabled={busy}
      onClick={onClick}
      title={label}
    >
      {children}
    </button>
  );
}

export function ControlLink({
  children,
  href,
  label,
}: {
  children: ReactNode;
  href: string;
  label: string;
}) {
  return (
    <Link href={href} className={CONTROL_CLASS_NAME} aria-label={label} title={label}>
      {children}
    </Link>
  );
}

/** Wrapper for the stroked glyphs the controls are drawn with. */
export function ControlIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Opens the page's own route, leaving the sheet it is presented in. */
export function EnterFullscreenControl({ href }: { href: string }) {
  return (
    <ControlLink href={href} label="Fullscreen">
      <ControlIcon>
        <path d="M7 3H3v4" />
        <path d="M13 3h4v4" />
        <path d="M17 13v4h-4" />
        <path d="M3 13v4h4" />
      </ControlIcon>
    </ControlLink>
  );
}

/**
 * Leaves fullscreen. The handler can await work such as preloading the desk, so
 * the button blocks repeat clicks and shows a spinner once the wait becomes
 * noticeable.
 */
export function ExitFullscreenControl({
  onExitFullscreen,
}: {
  onExitFullscreen?: () => Promise<void> | void;
}) {
  const [exitPending, setExitPending] = useState(false);
  const [showExitSpinner, setShowExitSpinner] = useState(false);

  async function exitFullscreen() {
    if (exitPending) return;

    setExitPending(true);

    const spinnerTimeout = window.setTimeout(() => {
      setShowExitSpinner(true);
    }, EXIT_SPINNER_DELAY_MS);

    try {
      await onExitFullscreen?.();
      setExitPending(false);
      setShowExitSpinner(false);
    } catch {
      setExitPending(false);
      setShowExitSpinner(false);
    } finally {
      window.clearTimeout(spinnerTimeout);
    }
  }

  return (
    <ControlButton
      busy={exitPending}
      label={exitPending ? 'Preparing desk' : 'Exit fullscreen'}
      onClick={exitFullscreen}
    >
      {showExitSpinner ? (
        <SpinnerIcon />
      ) : (
        <ControlIcon>
          <path d="M3 7h4V3" />
          <path d="M17 7h-4V3" />
          <path d="M13 17v-4h4" />
          <path d="M7 17v-4H3" />
        </ControlIcon>
      )}
    </ControlButton>
  );
}

/**
 * Closes the page: a button when the host can dismiss it in place, otherwise a
 * link back to the desk.
 */
export function CloseControl({ onClose }: { onClose?: () => void }) {
  const label = 'Back to desk';

  if (onClose) {
    return (
      <ControlButton label={label} onClick={onClose}>
        <CloseIcon />
      </ControlButton>
    );
  }

  return (
    <ControlLink href={routes.desk.href()} label={label}>
      <CloseIcon />
    </ControlLink>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      className="loading-spinner h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M17 10a7 7 0 0 0-7-7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}
