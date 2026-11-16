/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("sucrase");
require("sucrase/register");
const { CHAPTERS } = require("../../game/quests/chapters.ts");

const mod = { exports: {} };
vm.runInNewContext(transform(readFileSync(`${__dirname}/goalPreviews.tsx`, "utf8"), {
  transforms: ["typescript", "jsx", "imports"], jsxRuntime: "automatic", production: true,
}).code, {
  module: mod, exports: mod.exports,
  require: (id) => id === "@/game/sprites" ? { KNOWN_SPRITE_IDS: [] } :
    id === "../SpriteImage" ? () => React.createElement("span") : require(id),
});

test("every Bakery quest shows Before/After and has follow-up lines", () => {
  for (const quest of CHAPTERS[2].quests) {
    assert.equal(mod.exports.hasGoalPreview(quest), true, quest.id);
    assert.ok(quest.outro?.length >= 2, quest.id);
    assert.ok(quest.intro.length >= 3, quest.id);
    assert.ok(quest.hints.length >= 2, quest.id);
    const html = renderToStaticMarkup(React.createElement(mod.exports.default, { quest }));
    assert.match(html, /Slik blir det/, quest.id);
    assert.match(html, /Før/, quest.id);
    assert.match(html, /Etter/, quest.id);
  }
});