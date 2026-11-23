// What every player's clone needs to know, set here by the organizers and
// shipped with `git pull`, so nobody has to edit .env.local by hand. An env
// var with the same name still wins (for testing, or an organizer running the
// community server locally with NEXT_PUBLIC_COMMUNITY_URL=/api/community).

// The organizers' deployed copy of this repo, ending in /api/community. Empty
// until it's deployed: then «Hvem er med» says the community isn't connected,
// and everything else works as usual.
const RELEASE_COMMUNITY_URL = "";

// Week 1 opens this day; weeks 2 and 3 on the Mondays after (7 and 14
// December). Empty opens everything at once.
const RELEASE_CALENDAR_START = "2026-12-01";

export const COMMUNITY_URL =
  process.env.NEXT_PUBLIC_COMMUNITY_URL || RELEASE_COMMUNITY_URL;

export const CALENDAR_START =
  process.env.NEXT_PUBLIC_CALENDAR_START ?? RELEASE_CALENDAR_START;

// For verify-release and the tests: what ships, without env overrides.
export const RELEASE = {
  communityUrl: RELEASE_COMMUNITY_URL,
  calendarStart: RELEASE_CALENDAR_START,
};
