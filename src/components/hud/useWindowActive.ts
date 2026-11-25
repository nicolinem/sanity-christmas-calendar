import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  window.addEventListener("focus", cb);
  window.addEventListener("blur", cb);
  document.addEventListener("visibilitychange", cb);
  return () => {
    window.removeEventListener("focus", cb);
    window.removeEventListener("blur", cb);
    document.removeEventListener("visibilitychange", cb);
  };
}

// True while the window has focus and the tab is visible.
export function useWindowActive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.hasFocus() && document.visibilityState === "visible",
    () => true,
  );
}
