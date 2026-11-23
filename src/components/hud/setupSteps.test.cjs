/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const { setupSteps, setupUrgent, deadlineText } = require("./setupSteps.ts");
const {
  isLocalRequest,
  claimStateFromMembers,
  readStateFromStatus,
} = require("../../game/setupAccess.ts");

const base = {
  configured: true,
  projectId: "abc123",
  dataset: "production",
  read: "ok",
  claim: "claimed",
  claimExpires: null,
  canSignIn: false,
  canClaim: false,
  expired: false,
};
const ids = (steps) => steps.map((s) => `${s.id}:${s.done ? "ok" : "todo"}`);

test("no project: only the setup command", () => {
  const steps = setupSteps({ ...base, configured: false }, "checking", "3000");
  assert.deepEqual(ids(steps), ["project:todo"]);
  assert.equal(steps[0].command, "npm run setup");
});

test("a claimed, readable project signed in is all done", () => {
  assert.deepEqual(ids(setupSteps(base, "in", "3000")), [
    "project:ok",
    "read:ok",
    "studio:ok",
    "claim:ok",
  ]);
});

test("unclaimed: sign-in, claim with deadline, and port 3000", () => {
  const now = Date.parse("2026-11-27T09:00:00Z");
  const status = {
    ...base,
    claim: "unclaimed",
    claimExpires: "2026-11-30T09:00:00Z",
    canSignIn: true,
    canClaim: true,
  };
  const steps = setupSteps(status, "out", "3001", now);
  assert.deepEqual(ids(steps), [
    "project:ok",
    "read:ok",
    "port:todo",
    "studio:todo",
    "claim:todo",
  ]);
  assert.match(steps.at(-1).detail, /om 72 timer/);
  assert.deepEqual(
    ids(setupSteps(status, "out", "3000", now)).includes("port:todo"),
    false,
  );
});

test("a private dataset gives the command to make it public", () => {
  const read = setupSteps({ ...base, read: "private" }, "in", "3000")[1];
  assert.equal(read.done, false);
  assert.match(read.command, /datasets visibility set production public/);
});

test("a claimed project the Studio can't reach suggests CORS", () => {
  const studio = setupSteps(base, "error", "3001").find(
    (s) => s.id === "studio",
  );
  assert.equal(studio.command, "npm run setup -- --cors");
});

test("a passed deadline says so", () => {
  assert.match(
    deadlineText("2026-11-01T00:00:00Z", Date.parse("2026-11-02T00:00:00Z")),
    /gått ut/,
  );
});

test("secrets only go to the player's own game on localhost", () => {
  const h = (o) => new Headers(o);
  assert.equal(isLocalRequest(h({ host: "localhost:3000" })), true);
  assert.equal(
    isLocalRequest(
      h({ host: "localhost:3000", "sec-fetch-site": "same-origin" }),
    ),
    true,
  );
  assert.equal(
    isLocalRequest(
      h({ host: "localhost:3000", "sec-fetch-site": "cross-site" }),
    ),
    false,
  );
  assert.equal(isLocalRequest(h({ host: "evil.example" })), false);
  assert.equal(isLocalRequest(h({ host: "127.0.0.1:3000" })), true);
});

test("claim and read states", () => {
  assert.equal(claimStateFromMembers([{ isRobot: true }]), "unclaimed");
  assert.equal(
    claimStateFromMembers([{ isRobot: true }, { isRobot: false }]),
    "claimed",
  );
  assert.equal(claimStateFromMembers(undefined), "unknown");
  assert.equal(readStateFromStatus(200), "ok");
  assert.equal(readStateFromStatus(403), "private");
  assert.equal(readStateFromStatus(404), "missing");
  assert.equal(readStateFromStatus(null), "offline");
});

test("a deleted project says so and how to start over", () => {
  const steps = setupSteps(
    { ...base, claim: "unknown", read: "missing", expired: true },
    "error",
    "3000",
  );
  assert.deepEqual(ids(steps), ["project:todo"]);
  assert.equal(steps[0].command, "npm run setup -- --new");
});

test("the checklist interrupts only when it matters", () => {
  const now = Date.parse("2026-11-27T09:00:00Z");
  const unclaimed = { ...base, claim: "unclaimed", canClaim: true };
  assert.equal(setupUrgent(base, now), false);
  assert.equal(setupUrgent({ ...base, configured: false }, now), true);
  assert.equal(setupUrgent({ ...base, expired: true }, now), true);
  assert.equal(setupUrgent({ ...base, read: "private" }, now), true);
  assert.equal(
    setupUrgent({ ...unclaimed, claimExpires: "2026-11-29T09:00:00Z" }, now),
    false,
  );
  assert.equal(
    setupUrgent({ ...unclaimed, claimExpires: "2026-11-28T08:00:00Z" }, now),
    true,
  );
});
