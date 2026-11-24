/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
require("sucrase/register");
// sucrase/register compiles JSX to React.createElement.
global.React = React;

const HintPager = require("./HintPager.tsx").default;
const render = (props) =>
  renderToStaticMarkup(
    React.createElement(HintPager, {
      total: 3,
      onSelect: () => {},
      onReveal: () => {},
      ...props,
    }),
  );

test("on the last opened hint, the next arrow opens the next hint", () => {
  const html = render({ shown: 1, active: 0 });
  assert.match(html, /Vis hint 2 ›/);
  assert.doesNotMatch(html, /aria-label="Neste hint"/);
});

test("between opened hints the next arrow just moves", () => {
  const html = render({ shown: 2, active: 0 });
  assert.match(html, /aria-label="Neste hint"/);
  assert.doesNotMatch(html, /Vis hint/);
});

test("with every hint open, the last one has nowhere further to go", () => {
  const html = render({ shown: 3, active: 2 });
  assert.doesNotMatch(html, /Vis hint/);
  assert.match(html, /aria-label="Neste hint" disabled=""/);
});

test("nothing shows before the first hint", () => {
  assert.equal(render({ shown: 0, active: 0 }), "");
});
