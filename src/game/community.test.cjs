/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const { milestonesFor, characterFor, playersFromMilestones } = require("./community.ts");

test("only known quests create stable, deduplicated and server-titled events", () => {
  const input = { playerId: "abcdefgh", questIds: ["the-broken-forge", "the-broken-forge"] };
  assert.deepEqual(milestonesFor(input), [{
    _id: "questMilestone.abcdefgh.the-broken-forge",
    _type: "questMilestone",
    playerId: "abcdefgh",
    questId: "the-broken-forge",
    title: "Lag og publiser et våpen",
  }]);
});

test("rejects unknown quest IDs, invalid player IDs and unbounded batches", () => {
  assert.equal(milestonesFor({ playerId: "demo", questIds: ["the-broken-forge"] }), null);
  assert.equal(milestonesFor({ playerId: "abcdefgh", questIds: ["unknown"] }), null);
  assert.equal(milestonesFor({ playerId: "abcdefgh", questIds: ["the-broken-forge", 5] }), null);
  assert.equal(milestonesFor({ playerId: "abcdefgh", questIds: Array(101).fill("the-broken-forge") }), null);
  assert.deepEqual(milestonesFor({ playerId: "abcdefgh", questIds: [] }), []);
});

test("player snapshot accepts only published weapon identifiers and short names", () => {
  assert.deepEqual(characterFor({ playerId: "abcdefgh", character: {
    weapon: { name: "  Frostøksa  ", spriteId: "axe" },
  } }), {
    _id: "communityPlayer.abcdefgh",
    _type: "communityPlayer",
    playerId: "abcdefgh",
    weapon: { name: "Frostøksa", spriteId: "axe" },
  });
  assert.equal(characterFor({ playerId: "abcdefgh", character: { weapon: null } }).weapon, null);
  for (const weapon of [
    { name: "", spriteId: "axe" },
    { name: "x".repeat(65), spriteId: "axe" },
    { name: "Sword", spriteId: "dragon" },
    { name: "Sword", spriteId: "other" },
  ]) assert.equal(characterFor({ playerId: "abcdefgh", character: { weapon } }), null);
});

test("characters include players without milestones and count all unique milestones", () => {
  const players = playersFromMilestones([
    { playerId: "abcdefgh", questId: "the-broken-forge" },
    { playerId: "abcdefgh", questId: "branns-ledger" },
    { playerId: "abcdefgh", questId: "branns-ledger" },
    { playerId: "ijklmnop", questId: "the-broken-forge" },
  ], [
    { playerId: "abcdefgh", weapon: { name: "Sverd", spriteId: "sword" } },
    { playerId: "newcomer", weapon: null },
  ]);
  assert.deepEqual(players, [
    { playerId: "abcdefgh", completedCount: 2, forgeLevel: 2, weapon: { name: "Sverd", spriteId: "sword" } },
    { playerId: "ijklmnop", completedCount: 1, forgeLevel: 2, weapon: null },
    { playerId: "newcomer", completedCount: 0, forgeLevel: 1, weapon: null },
  ]);
});