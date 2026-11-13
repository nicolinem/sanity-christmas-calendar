/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");

const filename = path.resolve(__dirname, "QuestBook.tsx");
const loaded = { exports: {} };
vm.runInNewContext(
  transform(readFileSync(filename, "utf8"), {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
  }).code,
  {
    module: loaded,
    exports: loaded.exports,
    require(name) {
      if (name.startsWith("@/") || name.startsWith("./")) return {};
      return require(name);
    },
  },
);
// The module runs in its own context; copy results into this one to compare.
const glossary = (pages) =>
  JSON.parse(JSON.stringify(loaded.exports.glossary(pages)));

const page = (id, title, text) => ({ quest: { id, lesson: { title, text } } });

test("the glossary collects marked words once, from the page they first appear on", () => {
  const terms = glossary([
    page(
      "one",
      "*Draft* og *published*",
      "En *draft* blir synlig med *Publish*.",
    ),
    page("two", "`preview`", "Bruk `preview.select` og *Publish* igjen."),
  ]);
  assert.deepEqual(
    terms.map((t) => [t.word, t.questId]),
    [
      ["Draft", "one"],
      ["published", "one"],
      ["Publish", "one"],
      ["preview", "two"],
      ["preview.select", "two"],
    ],
  );
});

test("long code snippets stay out of the glossary", () => {
  const terms = glossary([
    page("one", "Lang", "`props.onChange(set(value), unset())` og `set`"),
  ]);
  assert.deepEqual(
    terms.map((t) => t.word),
    ["set"],
  );
});
