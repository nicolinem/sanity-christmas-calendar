/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");

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
  require: (name) => (name.endsWith("?raw") ? { default: "" } : require(name)),
});
const { bakerTemplateTask } = moduleResult.exports;

test("the starter cannot pass without setting the initial values", () => {
  const result = bakerTemplateTask.judge({
    bakeryOrder: { name: "bakeryOrder", initialValue: () => ({}) },
  });
  assert.equal(result.done, false);
});

test("new orders get the correct status and a fresh date", () => {
  const { modules } = bakerTemplateTask;
  const result = bakerTemplateTask.judge({
    bakeryOrder: {
      name: "bakeryOrder",
      initialValue: () => ({
        status: "ny",
        date: modules["./bakeryDate"].bakeryToday(),
      }),
    },
  });
  assert.equal(result.done, true);
  assert.deepEqual(
    Array.from(result.requirements, (r) => r.done),
    [true, true, true],
  );
});

test("a fixed date or wrong status does not pass", () => {
  const fixed = bakerTemplateTask.judge({
    bakeryOrder: {
      name: "bakeryOrder",
      initialValue: () => ({ status: "ny", date: "2026-12-14" }),
    },
  });
  assert.equal(fixed.done, false);
  assert.equal(fixed.requirements[2].done, false);
  const wrong = bakerTemplateTask.judge({
    bakeryOrder: {
      name: "bakeryOrder",
      initialValue: () => ({ status: "klar", date: "2026-12-14" }),
    },
  });
  assert.equal(wrong.requirements[1].done, false);
});
