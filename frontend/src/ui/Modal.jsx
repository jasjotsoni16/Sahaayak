import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-3xl' };

export default function Modal({ open, onClose, title, size = 'md', closeLabel = 'Close', children }) {
  const panelRef = useRef(null);
  const bodyRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose; // the effect below must not re-run (and steal focus) when the parent re-renders
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusables = () => Array.from(panel.querySelectorAll(FOCUSABLE));
    const firstInBody = bodyRef.current && bodyRef.current.querySelector(FOCUSABLE);
    (firstInBody || focusables()[0] || panel).focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0]; const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div data-testid="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeRef.current(); }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4">
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} tabIndex={-1}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-surface shadow-overlay sm:rounded-card ${SIZES[size]}`}>
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5">
          {title ? <h2 id={titleId} className="text-lg font-semibold text-ink">{title}</h2> : <span />}
          <button type="button" aria-label={closeLabel} onClick={() => closeRef.current()}
            className="-mr-2 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-muted hover:bg-page hover:text-ink">×</button>
        </div>
        <div ref={bodyRef} className="px-5 pb-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
