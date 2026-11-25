/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { integerZoom } = require("./zoom.ts");

test("integerZoom picks the largest whole zoom that fits", () => {
  const view = { w: 384, h: 224 };
  assert.equal(integerZoom(1920, 1080, view), 4);
  assert.equal(integerZoom(800, 600, view), 2);
});

test("integerZoom never goes below 1", () => {
  assert.equal(integerZoom(100, 100, { w: 384, h: 224 }), 1);
});
