/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const {
  DEFAULT_FIGURE,
  FIGURE_OPTIONS,
  drawFigure,
  normalizeFigure,
  randomFigure,
} = require("./figure.ts");

const opaque = (px) => px.filter((_, i) => i % 4 === 3 && px[i] > 0).length;

test("stored choices are cleaned: unknown ids fall back to the default", () => {
  assert.deepEqual(normalizeFigure(null), DEFAULT_FIGURE);
  const c = normalizeFigure({ hair: "long", hat: "jetpack", skin: 42 });
  assert.equal(c.hair, "long");
  assert.equal(c.hat, DEFAULT_FIGURE.hat);
  assert.equal(c.skin, DEFAULT_FIGURE.skin);
});

test("every option draws a 16×16 figure with an outline", () => {
  for (const [key, options] of Object.entries(FIGURE_OPTIONS))
    for (const o of options) {
      const px = drawFigure({ ...DEFAULT_FIGURE, [key]: o.id });
      assert.equal(px.length, 16 * 16 * 4, `${key}:${o.id}`);
      assert.ok(opaque(px) > 60, `${key}:${o.id} draws something`);
    }
});

test("facial hair is its own choice, drawn in the hair colour", () => {
  const plain = drawFigure({ ...DEFAULT_FIGURE, facialHair: "none" });
  const beard = drawFigure({ ...DEFAULT_FIGURE, facialHair: "beard" });
  assert.notDeepEqual([...plain], [...beard]);
  assert.equal(normalizeFigure({ hair: "beard" }).hair, DEFAULT_FIGURE.hair, "beard is no longer a hairstyle");
});

test("random figures are always valid", () => {
  for (let i = 0; i < 50; i++) {
    const f = randomFigure();
    assert.deepEqual(normalizeFigure(f), f);
  }
});

test("helmets cover a bald head completely: no skin above or beside them", () => {
  // The default figure's light skin (main and shade).
  const SKIN = new Set(["247,194,130", "225,154,101"]);
  for (const hat of ["helmet", "knight", "viking"]) {
    const px = drawFigure({ ...DEFAULT_FIGURE, hair: "bald", hat });
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 16; x++) {
        const i = (y * 16 + x) * 4;
        assert.ok(!SKIN.has(`${px[i]},${px[i + 1]},${px[i + 2]}`), `${hat}: skin at ${x},${y}`);
      }
  }
});
