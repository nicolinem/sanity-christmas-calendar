"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import {
  closeStudio,
  MIN_WIDTH,
  setStudioWidth,
  STUDIO_URL,
} from "./hud/studioPane";
import { IconClose, IconQuill } from "./hud/icons";

type Props = { width: number; open: boolean };

// Beside the game needs room for both; below this the Studio covers the game.
const SIDE_BY_SIDE = "(min-width: 1200px)";

function useSideBySide() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(SIDE_BY_SIDE);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(SIDE_BY_SIDE).matches,
    () => true,
  );
}

// The Studio, embedded beside the game. It's the same app on the same origin,
// so sign-in carries over and the game's live updates work as usual. Drag the
// left edge to resize; on small screens it covers the game instead.
export default function StudioPane({ width, open }: Props) {
  const narrow = !useSideBySide();
  const [dragging, setDragging] = useState(false);
  const paneRef = useRef<HTMLElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const max = Math.max(MIN_WIDTH, window.innerWidth - 320);
      const next = Math.min(
        max,
        Math.max(MIN_WIDTH, window.innerWidth - ev.clientX),
      );
      if (paneRef.current) paneRef.current.style.width = `${next}px`;
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      setDragging(false);
      if (paneRef.current)
        setStudioWidth(paneRef.current.getBoundingClientRect().width);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  }, []);

  return (
    <aside
      ref={paneRef}
      className={`studio-pane${narrow ? " studio-pane--cover" : ""}${dragging ? " is-dragging" : ""}`}
      style={narrow ? undefined : { width }}
      aria-label="Sanity Studio"
      hidden={!open}
    >
      {!narrow && (
        <div
          className="studio-pane-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Endre bredde på Studio"
          onPointerDown={onPointerDown}
        />
      )}
      <div className="studio-pane-bar">
        <span className="studio-pane-title">
          <IconQuill size={12} />
          Sanity Studio
        </span>
        <a
          className="studio-pane-btn"
          href={STUDIO_URL}
          target="_blank"
          rel="noreferrer"
          onClick={closeStudio}
        >
          Egen fane
        </a>
        <button
          type="button"
          className="btn studio-pane-close"
          onClick={closeStudio}
        >
          <IconClose size={12} />
          {narrow ? "Tilbake til spillet" : "Lukk Studio"}
        </button>
      </div>
      <iframe
        className="studio-pane-frame"
        src={STUDIO_URL}
        title="Sanity Studio"
      />
    </aside>
  );
}
