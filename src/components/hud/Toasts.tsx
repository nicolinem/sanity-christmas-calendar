"use client";

import { useSyncExternalStore } from "react";

// Short banners for moments worth celebrating: a finished quest, a hotter
// forge. A tiny module-level store so anything can push without prop drilling.

export type Toast = { id: number; title: string; body?: string; tone: "forge" | "lesson" };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function pushToast(toast: Omit<Toast, "id">) {
  const id = nextId++;
  toasts = [...toasts, { ...toast, id }].slice(-3);
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 5200);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const EMPTY: Toast[] = [];

export default function Toasts() {
  const list = useSyncExternalStore(subscribe, () => toasts, () => EMPTY);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast frame frame--slate toast--${t.tone}`}>
          <p className="toast-title">{t.title}</p>
          {t.body && <p className="toast-body">{t.body}</p>}
        </div>
      ))}
    </div>
  );
}
