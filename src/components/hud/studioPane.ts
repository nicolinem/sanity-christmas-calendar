"use client";

import { useSyncExternalStore } from "react";

// The Studio opens beside the game in the same tab, so you can publish and
// watch the forge at once. Whether it's open, and how wide, is remembered per
// browser. Any button can open it: openStudio(). Once loaded, closing only
// hides it, so reopening is instant and you stay where you were.

export const STUDIO_URL = "/studio";

const KEY = "winter-quest:studio-pane";
export const MIN_WIDTH = 720;
const FOCUS_GAME = "winter-quest:focus-game";

type Pane = { open: boolean; width: number; loaded: boolean };

let pane: Pane = { open: false, width: 780, loaded: false };
let restored = false;
const listeners = new Set<() => void>();

function load() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    if (saved && typeof saved.width === "number")
      pane = {
        open: Boolean(saved.open),
        width: Math.max(MIN_WIDTH, saved.width),
        loaded: Boolean(saved.open),
      };
  } catch {
    // Storage blocked or corrupt: start closed.
  }
}

function set(next: Partial<Pane>) {
  load();
  pane = { ...pane, ...next, loaded: pane.loaded || Boolean(next.open) };
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ open: pane.open, width: pane.width }),
    );
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

// True while the Studio iframe has focus: then the game's keys go to the Studio,
// and the HUD says so. Clicking the game takes the keyboard back.
export function useStudioFocused(): boolean {
  return useSyncExternalStore(
    (cb) => {
      // Focus moves into the iframe after window blur; check on the next tick.
      // Any press on the page itself also takes focus out of the iframe.
      const check = () => window.setTimeout(cb, 0);
      window.addEventListener("blur", check);
      window.addEventListener("focus", check);
      window.addEventListener("pointerdown", check);
      window.addEventListener(FOCUS_GAME, check);
      return () => {
        window.removeEventListener("blur", check);
        window.removeEventListener("focus", check);
        window.removeEventListener("pointerdown", check);
        window.removeEventListener(FOCUS_GAME, check);
      };
    },
    () =>
      document.activeElement?.classList.contains("studio-pane-frame") ?? false,
    () => false,
  );
}

// Hands the keyboard back to the game.
export function focusGame() {
  const active = document.activeElement as HTMLElement | null;
  if (!active?.classList.contains("studio-pane-frame")) return;
  active.blur();
  window.focus();
  window.dispatchEvent(new Event(FOCUS_GAME));
}

const CLOSED: Pane = { open: false, width: 780, loaded: false };

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
