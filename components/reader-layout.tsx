"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const defaultWidth = 320;
const minimumWidth = 240;
const maximumWidth = 520;
const storageKey = "prompt-contents-width";
let sessionWidth = defaultWidth;
function widthSnapshot() {
  let saved = sessionWidth;
  try {
    const value = Number(localStorage.getItem(storageKey));
    if (value >= minimumWidth && value <= maximumWidth) saved = value;
  } catch {
    /* Use the session preference. */
  }
  return window.innerWidth >= 1024
    ? Math.min(saved, maximumWidth, window.innerWidth - 640)
    : saved;
}
function subscribeWidth(callback: () => void) {
  window.addEventListener("prompt-contents-width", callback);
  window.addEventListener("resize", callback);
  return () => {
    window.removeEventListener("prompt-contents-width", callback);
    window.removeEventListener("resize", callback);
  };
}
export function ReaderLayout({
  children,
  contents,
}: {
  children: ReactNode;
  contents: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const width = useSyncExternalStore(
    subscribeWidth,
    widthSnapshot,
    () => defaultWidth,
  );
  const drag = useRef<{ x: number; width: number; selection: string } | null>(
    null,
  );
  const frame = useRef(0);
  const pending = useRef(defaultWidth);
  const apply = useCallback((value: number, save = true) => {
    const maximum =
      window.innerWidth >= 1024
        ? Math.min(maximumWidth, window.innerWidth - 640)
        : maximumWidth;
    const next = Math.round(Math.max(minimumWidth, Math.min(value, maximum)));
    pending.current = next;
    root.current?.style.setProperty("--contents-width", `${next}px`);
    handle.current?.setAttribute("aria-valuenow", String(next));
    handle.current?.setAttribute("aria-valuemax", String(maximum));
    if (save) {
      sessionWidth = next;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        /* Resizing still works without storage. */
      }
      window.dispatchEvent(new Event("prompt-contents-width"));
    }
  }, []);
  useEffect(() => {
    apply(width, false);
  }, [apply, width]);
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      if (drag.current) document.body.style.userSelect = drag.current.selection;
    },
    [],
  );
  function finish() {
    cancelAnimationFrame(frame.current);
    if (drag.current) document.body.style.userSelect = drag.current.selection;
    drag.current = null;
    apply(pending.current);
  }
  return (
    <div ref={root} className="reader-layout">
      <div className="reader-main">{children}</div>
      <div className="reader-contents" id="reader-contents-panel">
        <div
          ref={handle}
          role="separator"
          tabIndex={0}
          aria-label="Resize table of contents"
          aria-orientation="vertical"
          aria-controls="reader-contents-panel"
          aria-valuemin={minimumWidth}
          aria-valuemax={maximumWidth}
          aria-valuenow={width}
          className="contents-resize-handle"
          title="Drag to resize · arrow keys to adjust · double-click to reset"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            drag.current = {
              x: event.clientX,
              width: pending.current,
              selection: document.body.style.userSelect,
            };
            document.body.style.userSelect = "none";
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            const next = drag.current.width + drag.current.x - event.clientX;
            pending.current = next;
            cancelAnimationFrame(frame.current);
            frame.current = requestAnimationFrame(() => apply(next, false));
          }}
          onPointerUp={finish}
          onPointerCancel={finish}
          onLostPointerCapture={() => {
            if (drag.current) finish();
          }}
          onDoubleClick={() => apply(defaultWidth)}
          onKeyDown={(event) => {
            const next =
              event.key === "ArrowLeft"
                ? pending.current + 16
                : event.key === "ArrowRight"
                  ? pending.current - 16
                  : event.key === "Home"
                    ? minimumWidth
                    : event.key === "End"
                      ? maximumWidth
                      : undefined;
            if (next !== undefined) {
              event.preventDefault();
              apply(next);
            }
          }}
        />
        {contents}
      </div>
    </div>
  );
}
