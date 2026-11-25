/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
require("sucrase/register");
const { SHEETS } = require("../sprites.ts");

const size = (url) => {
  const buf = fs.readFileSync(path.join(__dirname, "../../../public", url));
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
};

test("cave sheets point at the baked files", () => {
  assert.equal(SHEETS.cave.url, "/assets/winter-cave.png");
  assert.equal(SHEETS.caveDeep.url, "/assets/winter-cave-deep.png");
});

test("cave sheets are 12 x 11 tiles of 16 px", () => {
  for (const key of ["cave", "caveDeep"]) {
    assert.deepEqual(size(SHEETS[key].url), [192, 176]);
  }
});
