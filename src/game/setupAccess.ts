// Rules for the setup checklist's server side. Kept free of Next and Sanity
// imports so they can be tested on their own.

// The sign-in and claim redirects hand a secret to the browser, so they only
// answer the player's own game: on their own machine, from a page of the game
// or a link they opened themselves, never from another site.
export function isLocalRequest(headers: Headers): boolean {
  const host = (headers.get("host") ?? "").replace(/:\d+$/, "").toLowerCase();
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(host);
  const site = headers.get("sec-fetch-site");
  return local && (site === null || site === "same-origin" || site === "none");
}

export type ClaimState = "claimed" | "unclaimed" | "unknown";

// A project made by `npm run setup` has only the setup's robot token as a
// member. Whoever claims it becomes the first person in the list.
export function claimStateFromMembers(members: unknown): ClaimState {
  if (!Array.isArray(members)) return "unknown";
  return members.some((m) => m && typeof m === "object" && !m.isRobot)
    ? "claimed"
    : "unclaimed";
}

export type ReadState = "ok" | "private" | "missing" | "offline";

export function readStateFromStatus(status: number | null): ReadState {
  if (status === null) return "offline";
  if (status >= 200 && status < 300) return "ok";
  if (status === 401 || status === 403) return "private";
  if (status === 404) return "missing";
  return "offline";
}
