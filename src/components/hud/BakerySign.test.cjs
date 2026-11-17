/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("sucrase");

const result = { exports: {} };
vm.runInNewContext(
  transform(readFileSync(path.resolve(__dirname, "BakerySign.tsx"), "utf8"), {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
  }).code,
  { module: result, exports: result.exports, require, URL },
);
const BakerySign = result.exports.default;

const stripResult = { exports: {} };
vm.runInNewContext(
  transform(readFileSync(path.resolve(__dirname, "BakeryStrip.tsx"), "utf8"), {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
  }).code,
  {
    module: stripResult,
    exports: stripResult.exports,
    require: (id) => {
      if (id === "@/game/bakery")
        return {
          signText: (sign) =>
            sign?.text?.[0]?.children?.map(({ text }) => text).join("") ?? "",
        };
      if (id === "./BakerySign") return result.exports;
      return require(id);
    },
  },
);
const BakeryStrip = stripResult.exports.default;

const render = (sign) =>
  renderToStaticMarkup(React.createElement(BakerySign, { sign, onClose() {} }));

test("the village sign shows published rich text, including bold and safe links", () => {
  const html = render({
    text: [
      {
        _type: "block",
        children: [
          { text: "Nystekte ", marks: [] },
          { text: "kaker", marks: ["strong", "link-1"] },
        ],
        markDefs: [
          { _key: "link-1", _type: "link", href: "https://example.com/kaker" },
        ],
      },
    ],
  });
  assert.match(html, /Nystekte/);
  assert.match(html, /<strong>kaker<\/strong>/);
  assert.match(html, /href="https:\/\/example.com\/kaker"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /role="dialog"/);
});

test("unpublished or unsafe links cannot appear on the village sign", () => {
  assert.match(render(null), /Skiltet er tomt/);
  const html = render({
    text: [
      {
        _type: "block",
        children: [{ text: "Farlig", marks: ["link-1"] }],
        markDefs: [
          { _key: "link-1", _type: "link", href: "javascript:alert(1)" },
        ],
      },
    ],
  });
  assert.doesNotMatch(html, /href=/);
  assert.match(html, /Farlig/);
});

test("the narrow HUD strip reuses the rich-text renderer", () => {
  const sign = {
    text: [
      {
        _type: "block",
        children: [
          { text: "Nystekte ", marks: [] },
          { text: "kaker", marks: ["strong"] },
        ],
      },
    ],
  };
  const html = renderToStaticMarkup(React.createElement(BakeryStrip, { sign }));
  assert.match(html, /class="bakery-strip"/);
  assert.match(html, /Nystekte <\/span><span><strong>kaker<\/strong>/);
  assert.equal(
    renderToStaticMarkup(React.createElement(BakeryStrip, { sign: null })),
    "",
  );
});
