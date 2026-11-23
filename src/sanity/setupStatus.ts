import { apiVersion, dataset, projectId, isSanityConfigured } from "./env";
import {
  claimStateFromMembers,
  readStateFromStatus,
  type ClaimState,
  type ReadState,
} from "@/game/setupAccess";

// Server only: what the setup checklist needs to know about the player's
// project. Secrets (the token, the claim link) never leave this file; the
// redirects in /api/setup/login and /api/setup/claim use them directly.

export type SetupStatus = {
  configured: boolean;
  projectId: string | null;
  dataset: string;
  read: ReadState | null;
  claim: ClaimState;
  claimExpires: string | null;
  canSignIn: boolean; // the Studio can sign in with the setup's token
  canClaim: boolean;
  expired: boolean; // not claimed in time, and Sanity has deleted it
};

const token = () => process.env.SANITY_AUTH_TOKEN || "";
const claimUrl = () => process.env.SANITY_CLAIM_URL || "";

let claimCache: "claimed" | null = null;

// No claim link in .env.local: the player brought their own project or has
// claimed it. Otherwise ask Sanity who the members are.
async function claimState(): Promise<ClaimState> {
  if (!claimUrl()) return "claimed";
  if (!token()) return "unknown";
  if (claimCache) return claimCache;
  try {
    const res = await fetch(
      `https://api.sanity.io/v2021-06-07/projects/${projectId}`,
      { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store" },
    );
    const state = res.ok
      ? claimStateFromMembers((await res.json()).members)
      : "unknown";
    // Only "claimed" is remembered: it can't change back, and a player who
    // just claimed should see it the moment they return to the game.
    if (state === "claimed") claimCache = state;
    return state;
  } catch {
    return "unknown";
  }
}

// The game reads published content without a token, so the dataset must be public.
async function readState(): Promise<ReadState> {
  const query = encodeURIComponent("count(*)");
  try {
    const res = await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${query}`,
      { cache: "no-store" },
    );
    return readStateFromStatus(res.status);
  } catch {
    return readStateFromStatus(null);
  }
}

export async function setupStatus(): Promise<SetupStatus> {
  if (!isSanityConfigured)
    return {
      configured: false,
      projectId: null,
      dataset,
      read: null,
      claim: "unknown",
      claimExpires: null,
      canSignIn: false,
      canClaim: false,
      expired: false,
    };
  const [read, claim] = await Promise.all([readState(), claimState()]);
  const unclaimed = claim !== "claimed";
  const deadline = process.env.SANITY_CLAIM_EXPIRES;
  // A deleted project answers like one that never existed, so the passed
  // deadline is what tells the two apart.
  const expired =
    unclaimed &&
    read === "missing" &&
    Boolean(deadline) &&
    new Date(deadline!).getTime() < Date.now();
  return {
    configured: true,
    projectId,
    dataset,
    read,
    claim,
    claimExpires: unclaimed ? process.env.SANITY_CLAIM_EXPIRES || null : null,
    canSignIn: unclaimed && !expired && Boolean(token()),
    canClaim: unclaimed && !expired && Boolean(claimUrl()),
    expired,
  };
}

// Only before the project is claimed: once someone owns it, the Studio signs
// out a session that comes from the setup's token and asks for a real login.
export async function studioSignInPath(): Promise<string | null> {
  if (!token() || (await claimState()) === "claimed") return null;
  const claim = claimUrl() ? `&claim=${encodeURIComponent(claimUrl())}` : "";
  return `/studio#token=${encodeURIComponent(token())}${claim}`;
}

export function claimLink(): string | null {
  return claimUrl() || null;
}
