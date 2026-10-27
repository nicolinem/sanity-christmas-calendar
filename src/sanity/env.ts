// Central place for Sanity connection config. Values come from env vars so the
// repo stays free of project-specific IDs. See .env.local.example / README.
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";

// The game should boot and stay playable even before Sanity is wired up, so we
// never throw here — callers check `isSanityConfigured` and degrade gracefully.
export const isSanityConfigured = projectId.length > 0;
