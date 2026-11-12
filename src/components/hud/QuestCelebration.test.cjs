/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("sucrase");

const filename = path.resolve(__dirname, "QuestCelebration.tsx");
const moduleResult = { exports: {} };
vm.runInNewContext(
  transform(readFileSync(filename, "utf8"), {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
  }).code,
  {
    module: moduleResult,
    exports: moduleResult.exports,
    require,
  },
);
const QuestCelebration = moduleResult.exports.default;

test("quest celebration announces the door and provides a dismiss button", () => {
  const html = renderToStaticMarkup(
    React.createElement(QuestCelebration, {
      door: 3,
      title: "Validation: regler for våpen",
      onClose() {},
    }),
  );
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /Luke 3 er åpnet/);
  assert.match(html, /Gratulerer!/);
  assert.match(html, /Validation: regler for våpen/);
  assert.match(html, />Fortsett<\/button>/);
});
