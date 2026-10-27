"use client";

import { useSyncExternalStore } from "react";

// The Studio opens beside the game in the same tab, so you can publish and
// watch the forge at once. Whether it's open, and how wide, is remembered per
// browser. Any button can open it: openStudio(). Once loaded, closing only
// hides it, so reopening is instant and you stay where you were.

export const STUDIO_URL = "/studio";

const KEY = "winter-quest:studio-pane";
export const MIN_WIDTH = 380;

type Pane = { open: boolean; width: number; loaded: boolean };

let pane: Pane = { open: false, width: 560, loaded: false };
let restored = false;
const listeners = new Set<() => void>();

function load() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    if (saved && typeof saved.width === "number")
      pane = { open: Boolean(saved.open), width: saved.width, loaded: Boolean(saved.open) };
  } catch {
    // Storage blocked or corrupt: start closed.
  }
}

function set(next: Partial<Pane>) {
  load();
  pane = { ...pane, ...next, loaded: pane.loaded || Boolean(next.open) };
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ open: pane.open, width: pane.width }));
  } catch {
    // Not remembered, still works.
  }
  listeners.forEach((l) => l());
}

export const openStudio = () => set({ open: true });
export const closeStudio = () => set({ open: false });
export const toggleStudio = () => set({ open: !snapshot().open });
export const setStudioWidth = (width: number) => set({ width });

function snapshot() {
  load();
  return pane;
}

const CLOSED: Pane = { open: false, width: 560, loaded: false };

export function useStudioPane(): Pane {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot,
    () => CLOSED,
  );
}
