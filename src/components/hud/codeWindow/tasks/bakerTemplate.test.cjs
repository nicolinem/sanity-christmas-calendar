/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");
require("sucrase/register");

const source = transform(
  readFileSync(`${__dirname}/bakerTemplate.tsx`, "utf8"),
  {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
  },
).code;
const moduleResult = { exports: {} };
vm.runInNewContext(source, {
  module: moduleResult,
  exports: moduleResult.exports,
  require: (name) =>
    name.endsWith("?raw")
      ? { default: "" }
      : name.startsWith("@/")
        ? require(`../../../../${name.slice(2)}.ts`)
        : require(name),
});
const { bakerTemplateTask } = moduleResult.exports;

const { modules } = bakerTemplateTask;
const today = () => modules["./bakeryDate"].bakeryToday();
const CUSTOMERS = [
  ["Brann", "Lussekatter"],
  ["Arkivaren", "Pepperkaker"],
  ["Kari", "Julekake"],
];
const withTemplates = (make) => ({
  templates: (previous) => [...previous, ...CUSTOMERS.map(make)],
});
const good = ([name, item]) => ({
  id: `order-${name}`,
  title: `Bestilling fra ${name}`,
  schemaType: "bakeryOrder",
  value: () => ({ item, orderedBy: name, status: "ny", date: today() }),
});

test("the starter does not pass", () => {
  const result = bakerTemplateTask.judge({
    templates: (previous) => [...previous],
  });
  assert.equal(result.done, false);
  assert.equal(result.requirements[0].done, true, "keeps «Ny bestilling»");
});

test("a template per customer with item, status and a fresh date passes", () => {
  const result = bakerTemplateTask.judge(withTemplates(good));
  assert.deepEqual(
    Array.from(result.requirements, (r) => r.done),
    [true, true, true, true],
  );
  assert.ok(result.solvedAs);
});

test("dropping the default, a fixed date or a wrong item does not pass", () => {
  const dropped = bakerTemplateTask.judge({
    templates: () => CUSTOMERS.map(good),
  });
  assert.equal(dropped.requirements[0].done, false);
  const fixed = bakerTemplateTask.judge(
    withTemplates((c) => ({
      ...good(c),
      value: { ...good(c).value(), date: "2026-12-14" },
    })),
  );
  assert.equal(fixed.requirements[3].done, false);
  const wrong = bakerTemplateTask.judge(
    withTemplates((c) => ({
      ...good(c),
      value: () => ({ ...good(c).value(), item: "Boller" }),
    })),
  );
  assert.equal(wrong.requirements[2].done, false);
});
