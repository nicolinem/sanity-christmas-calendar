/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { bakerFunctionTask } = require("./bakerFunction.tsx");
const { runModule } = require("../runCode.ts");

const run = (source) => {
  const result = runModule(source, bakerFunctionTask.modules);
  assert.equal(result.ok, true, result.message);
  return bakerFunctionTask.judge(result.exports);
};

test("the starter does not pass the simulated Function challenge", async () => {
  assert.equal((await run(bakerFunctionTask.starter)).done, false);
});

test("event filtering and checking the current sign pass all three checks", async () => {
  const source = bakerFunctionTask.starter
    .replace("// Sjekk at dette er en publisert bakeryOrder med en vare.",
      'if (event.transition !== "publish" || order?._type !== "bakeryOrder" || !order.item?.trim()) return')
    .replace("// Ikke skriv hvis skiltet allerede viser denne teksten.",
      'if (sign?.text?.[0]?.children?.[0]?.text === text) return');
  const verdict = await run(source);
  assert.equal(verdict.done, true, verdict.error);
});

test("unconditional sign writes fail the repeat-delivery check", async () => {
  const source = bakerFunctionTask.starter.replace("// Sjekk at dette er en publisert bakeryOrder med en vare.",
    'if (event.transition !== "publish" || order?._type !== "bakeryOrder" || !order.item?.trim()) return');
  const verdict = await run(source);
  assert.equal(verdict.requirements[0].done, true);
  assert.equal(verdict.requirements[2].done, false);
});