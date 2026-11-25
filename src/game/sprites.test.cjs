/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const {
  DEFAULT_SPRITE_FOR_KIND,
  isSpriteAllowedForKind,
  spriteAfterKindChange,
} = require("./sprites.ts");

test("picking Potion or Material gives a fitting sprite to start from", () => {
  assert.equal(spriteAfterKindChange("potion", undefined), "potion");
  assert.equal(spriteAfterKindChange("material", null), "ice-cube");
  for (const [kind, sprite] of Object.entries(DEFAULT_SPRITE_FOR_KIND))
    assert.equal(isSpriteAllowedForKind(sprite, kind), true, kind);
});

test("a weapon gets no sprite chosen for it", () => {
  assert.equal(spriteAfterKindChange("weapon", undefined), undefined);
});

test("a sprite that fits the new kind is kept", () => {
  assert.equal(spriteAfterKindChange("potion", "potion-frost"), undefined);
  assert.equal(spriteAfterKindChange("weapon", "sword"), undefined);
  // Material and potion share their sprites, so a gem stays a gem.
  assert.equal(spriteAfterKindChange("potion", "gem"), undefined);
});

test("a sprite that doesn't fit is swapped, or cleared for a weapon", () => {
  assert.equal(spriteAfterKindChange("potion", "sword"), "potion");
  assert.equal(spriteAfterKindChange("material", "axe"), "ice-cube");
  assert.equal(spriteAfterKindChange("weapon", "potion"), null);
});

test("no kind, or an unknown one, leaves the sprite alone", () => {
  assert.equal(spriteAfterKindChange(undefined, "sword"), undefined);
  assert.equal(spriteAfterKindChange("dragon", "sword"), undefined);
});
