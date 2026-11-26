/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { pickEquipped } = require("./items.ts");

const weapon = (id, damage) => ({
  id,
  kind: "weapon",
  power: damage == null ? null : { damage },
});
const fists = weapon("builtin-fists", 0);
const items = [
  weapon("sword", 6),
  weapon("axe", 10),
  { id: "cube", kind: "material", power: null },
  fists,
];

test("the chosen weapon stays in hand while it exists", () => {
  assert.equal(pickEquipped(items, "sword"), "sword");
  assert.equal(pickEquipped(items, "builtin-fists"), "builtin-fists");
});

test("without a choice, or once it is gone, the strongest weapon is used", () => {
  assert.equal(pickEquipped(items, undefined), "axe");
  assert.equal(pickEquipped(items, "deleted"), "axe");
  // A choice that isn't a weapon is not held.
  assert.equal(pickEquipped(items, "cube"), "axe");
  assert.equal(pickEquipped([fists], undefined), null);
});
