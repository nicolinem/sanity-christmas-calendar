const windows = new Map<string, { started: number; count: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export function allowedCommunityOrigin(origin: string | null, url: string) {
  if (!origin) return false;
  const allowed = [
    new URL(url).origin,
    "http://localhost:3000",
    "http://localhost:3001",
    ...(process.env.COMMUNITY_ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ];
  return allowed.includes(origin);
}

// shortcut: in-memory limits are per Vercel instance; enable a platform-wide
// rate limit before exposing this unauthenticated write endpoint broadly.
export function communityRateLimited(key: string, now = Date.now()) {
  if (windows.size > 1000) {
    for (const [id, value] of windows)
      if (now - value.started >= WINDOW_MS) windows.delete(id);
  }
  const current = windows.get(key);
  if (!current || now - current.started >= WINDOW_MS) {
    windows.set(key, { started: now, count: 1 });
    return false;
  }
  current.count++;
  return current.count > MAX_REQUESTS;
}
