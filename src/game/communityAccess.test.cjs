/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const {
  allowedCommunityOrigin,
  communityRateLimited,
} = require("./communityAccess.ts");

test("only same-origin, configured origins and expected localhost ports get CORS", () => {
  const url = "https://calendar.example/api/community";
  assert.equal(allowedCommunityOrigin("https://calendar.example", url), true);
  assert.equal(allowedCommunityOrigin("http://localhost:3000", url), true);
  assert.equal(allowedCommunityOrigin("http://localhost:3001", url), true);
  assert.equal(allowedCommunityOrigin("http://evil.example", url), false);
  assert.equal(allowedCommunityOrigin(null, url), false);
  process.env.COMMUNITY_ALLOWED_ORIGINS = "https://participant.example";
  try {
    assert.equal(
      allowedCommunityOrigin("https://participant.example", url),
      true,
    );
  } finally {
    delete process.env.COMMUNITY_ALLOWED_ORIGINS;
  }
});

test("rate limit applies to a client for one minute, not to another client", () => {
  for (let i = 0; i < 300; i++)
    assert.equal(communityRateLimited("limit-a", 1000), false);
  assert.equal(communityRateLimited("limit-a", 1000), true);
  assert.equal(communityRateLimited("limit-b", 1000), false);
  assert.equal(communityRateLimited("limit-a", 61_000), false);
});

test("the shipped community URL is empty or a full https /api/community address", () => {
  const { RELEASE } = require("./release.ts");
  if (RELEASE.communityUrl)
    assert.match(RELEASE.communityUrl, /^https:\/\/[^/]+\/api\/community$/);
  assert.match(RELEASE.calendarStart, /^\d{4}-\d{2}-\d{2}$/);
});
