import { adoptProgress, readProgress, subscribeProgress } from "./progress";
import {
  mergeProgress,
  normalizeProgress,
  progressJson,
} from "./progressMerge";

// Keeps the backup of the player's progress (src/app/api/progress) in step:
// once at the start, which also brings back progress saved in another browser,
// then at most once a second while progress changes, and when the page is
// hidden or closed. localStorage stays the game's own copy; this only syncs it.

export const BACKUP_ENDPOINT = "/api/progress";
const GAP_MS = 1000;

// Not for the demo, nor ?dev, where organizers play with progress.
export function backupWanted(
  project: string,
  search: string,
  env = process.env.NODE_ENV,
) {
  return (
    project !== "demo" &&
    !(env !== "production" && new URLSearchParams(search).has("dev"))
  );
}

// onSettled: called once, when the first sync has an answer (or none comes).
export function startProgressBackup(
  project: string,
  {
    send = fetch,
    onSettled,
  }: { send?: typeof fetch; onSettled?: () => void } = {},
) {
  let settle = onSettled;
  let backedUp: string | null = null; // the backup's copy, as last seen
  let lastSentAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let busy = false;
  let stopped = false;
  let cancelled = false; // stopped by the caller, not by a missing token

  const changed = () => progressJson(readProgress(project)) !== backedUp;

  function later() {
    if (timer || stopped) return;
    timer = setTimeout(
      () => {
        timer = null;
        void sync();
      },
      Math.max(0, lastSentAt + GAP_MS - Date.now()),
    );
  }

  async function sync(closing = false) {
    if (stopped || !changed()) return;
    if (busy && !closing) return; // Picked up when the request is back.
    busy = true;
    lastSentAt = Date.now();
    let ok = false;
    try {
      const response = await send(BACKUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(readProgress(project)),
        keepalive: closing,
      });
      // No token, or not this origin: there is no backup to keep.
      if ([400, 403, 503].includes(response.status)) stop();
      if (!response.ok) return;
      const backup = normalizeProgress((await response.json())?.progress);
      if (!backup || stopped) return;
      backedUp = progressJson(backup);
      // Merged with what changed while the request was out, so nothing is lost.
      adoptProgress(project, mergeProgress(readProgress(project), backup));
      ok = true;
    } catch {
      // Offline: tried again on the next change.
    } finally {
      busy = false;
      if (ok && changed()) later();
      if (!cancelled) settle?.();
      settle = undefined;
    }
  }

  const unsubscribe = subscribeProgress(later);
  const close = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    void sync(true);
  };
  const hidden = () => {
    if (document.visibilityState === "hidden") close();
  };
  const events = typeof window !== "undefined" && window.addEventListener;
  if (events) {
    window.addEventListener("pagehide", close);
    document.addEventListener("visibilitychange", hidden);
  }
  void sync();

  function stop() {
    stopped = true;
    if (timer) clearTimeout(timer);
    timer = null;
    unsubscribe();
    if (events) {
      window.removeEventListener("pagehide", close);
      document.removeEventListener("visibilitychange", hidden);
    }
  }
  return () => {
    cancelled = true;
    stop();
  };
}
