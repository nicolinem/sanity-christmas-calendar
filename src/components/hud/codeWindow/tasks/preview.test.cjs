/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("sucrase");

// Only the app-specific imports are stand-ins; the judge, list and React
// renderer are real. No Next loader is needed for the read-only raw source.
const SpriteImage = () => null;
const stubIcon = (name) => (props) =>
  React.createElement("svg", { ...props, "data-icon": name });
const TASK_ICONS = {
  Bolt: stubIcon("Bolt"),
  Document: stubIcon("Document"),
  Star: stubIcon("Star"),
};
const moduleResult = { exports: {} };
const source = transform(readFileSync(`${__dirname}/preview.tsx`, "utf8"), {
  transforms: ["typescript", "jsx", "imports"],
  jsxRuntime: "automatic",
  production: true,
}).code;
vm.runInNewContext(source, {
  module: moduleResult,
  exports: moduleResult.exports,
  require(name) {
    if (name === "@/components/SpriteImage")
      return { __esModule: true, default: SpriteImage };
    if (name === "@/components/SpriteImage?raw")
      return { __esModule: true, default: "" };
    if (name === "@/sanity/lib/taskIcons") return { TASK_ICONS };
    return require(name);
  },
});
const { previewTask } = moduleResult.exports;

for (const value of [NaN, Infinity, -Infinity, 0, 42, "Et våpen"]) {
  test(`preview safely renders title and subtitle ${String(value)}`, () => {
    const verdict = previewTask.judge({
      item: { preview: { prepare: () => ({ title: value, subtitle: value }) } },
    });
    const expected =
      typeof value === "number" && !Number.isFinite(value) ? null : value;
    for (const row of verdict.data.rows) {
      assert.equal(row.title, expected);
      assert.equal(row.subtitle, expected);
    }
    // Neither malformed output nor display sanitising should solve the task.
    assert.equal(verdict.done, false);

    const errors = [];
    const previousError = console.error;
    let html;
    try {
      console.error = (...args) => errors.push(args);
      html = renderToStaticMarkup(
        React.createElement(previewTask.Result, { verdict }),
      );
    } finally {
      console.error = previousError;
    }
    assert.deepEqual(errors, [], "Rendering must not emit React warnings");
    if (expected === null) {
      assert.match(html, /<em>Uten tittel<\/em>/);
      assert.match(html, /class="cw-studio-sub"><\/span>/);
      assert.doesNotMatch(html, /NaN|Infinity/);
    } else {
      assert.match(html, new RegExp(`class="cw-studio-title">${value}<`));
      assert.match(html, new RegExp(`class="cw-studio-sub">${value}<`));
    }
  });
}

// Stand-in for a correct prepare: passes names and sprite ids through.
const correctPrepare = ({ title, subtitle, spriteId }) => ({
  title,
  subtitle,
  media: spriteId ? React.createElement(SpriteImage, { spriteId }) : undefined,
});
const withPrepare = (prepare) => ({
  item: {
    icon: TASK_ICONS.Bolt,
    preview: {
      select: { title: "name", subtitle: "kind", spriteId: "sprite" },
      prepare,
    },
  },
});

test("chosen schema icon shows in its own header, not inside the rows", () => {
  const verdict = previewTask.judge(withPrepare(correctPrepare));
  const html = renderToStaticMarkup(
    React.createElement(previewTask.Result, { verdict }),
  );
  assert.equal(verdict.data.icon, "Bolt");
  assert.equal(html.match(/cw-schema-icon/g).length, 1);
  assert.match(html, /<svg[^>]*class="cw-schema-icon"[^>]*data-icon="Bolt"/);
  assert.match(html, /<code>BoltIcon<\/code>/);
  assert.match(html, /<details class="cw-icon-gallery">/);
  assert.match(html, /<code>StarIcon<\/code>/);
});

test("a missing icon is shown as none chosen, with the gallery available", () => {
  const verdict = previewTask.judge({
    item: { preview: { select: { title: "name" } } },
  });
  const html = renderToStaticMarkup(
    React.createElement(previewTask.Result, { verdict }),
  );
  assert.equal(verdict.data.icon, undefined);
  assert.match(html, /Ingen ikon valgt/);
  assert.match(html, /<details class="cw-icon-gallery">/);
});

test("sprite and name are checked independently", () => {
  const noName = previewTask.judge(
    withPrepare(({ subtitle, spriteId }) => ({
      subtitle,
      media: React.createElement(SpriteImage, { spriteId }),
    })),
  );
  assert.deepEqual(
    Array.from(noName.requirements, (r) => r.done),
    [true, true, true, false],
  );
  assert.match(noName.requirements[3].message, /^0 av 4/);
  assert.equal(noName.done, false);
  assert.equal(noName.solvedAs, undefined);

  const wrongSprite = previewTask.judge(
    withPrepare(({ title, subtitle }) => ({
      title,
      subtitle,
      media: React.createElement(SpriteImage, { spriteId: "feil" }),
    })),
  );
  assert.deepEqual(
    Array.from(wrongSprite.requirements, (r) => r.done),
    [true, true, false, true],
  );
  assert.match(wrongSprite.requirements[2].message, /^0 av 3/);
});

test("a throwing prepare sets verdict.error and never solves the task", () => {
  const errors = [];
  const previousError = console.error;
  let verdict;
  try {
    console.error = (...args) => errors.push(args);
    verdict = previewTask.judge(
      withPrepare(() => {
        throw new Error("SpriteImage is not defined");
      }),
    );
  } finally {
    console.error = previousError;
  }
  assert.deepEqual(errors, []);
  assert.match(
    verdict.error,
    /^prepare\(\) krasjet: .*SpriteImage is not defined$/,
  );
  assert.equal(verdict.done, false);
  assert.equal(verdict.solvedAs, undefined);
  assert.deepEqual(
    Array.from(verdict.requirements, (r) => r.done),
    [true, true, false, false],
  );

  const html = renderToStaticMarkup(
    React.createElement(previewTask.Result, { verdict }),
  );
  assert.match(html, /class="cw-studio-sub">prepare\(\) krasjet/);
});

test("a correct preview solves the task with the chosen icon", () => {
  const verdict = previewTask.judge(withPrepare(correctPrepare));
  assert.equal(verdict.done, true);
  assert.equal(verdict.error, undefined);
  assert.deepEqual({ ...verdict.solvedAs }, { icon: "Bolt" });
});

test("the untouched starter is not done, but its names already show", () => {
  const verdict = previewTask.judge({
    item: {
      name: "item",
      preview: { select: { title: "name", subtitle: "kind" } },
    },
  });
  assert.deepEqual(
    Array.from(verdict.requirements, (r) => r.done),
    [false, false, false, true],
  );
  assert.equal(verdict.done, false);
  assert.equal(verdict.solvedAs, undefined);
});
