/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");

const output = { exports: {} };
vm.runInNewContext(
  transform(readFileSync(`${__dirname}/bakerForge.tsx`, "utf8"), {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
  }).code,
  { module: output, exports: output.exports, require },
);
const { bakerForgeTask } = output.exports;

test("the starter cannot smi or publish anything", () => {
  assert.equal(
    bakerForgeTask.judge({
      ForgeAction: () => ({ label: "Smi", onHandle() {} }),
    }).done,
    false,
  );
});

test("patching forgedAt and publishing in order completes the door", () => {
  const { useDocumentOperation } = bakerForgeTask.modules.sanity;
  const result = bakerForgeTask.judge({
    ForgeAction: () => {
      const { patch, publish } = useDocumentOperation();
      return {
        label: "Smi",
        onHandle() {
          patch.execute([{ set: { forgedAt: new Date().toISOString() } }]);
          publish.execute();
        },
      };
    },
  });
  assert.equal(result.done, true);
});

test("publishing before the stamp or stamping an old date fails", () => {
  const { useDocumentOperation } = bakerForgeTask.modules.sanity;
  for (const invalid of [
    ({ patch, publish }) => {
      publish.execute();
      patch.execute([{ set: { forgedAt: new Date().toISOString() } }]);
    },
    ({ patch, publish }) => {
      patch.execute([{ set: { forgedAt: "2020-01-01T00:00:00.000Z" } }]);
      publish.execute();
    },
  ]) {
    const result = bakerForgeTask.judge({
      ForgeAction: () => {
        const ops = useDocumentOperation();
        return { label: "Smi", onHandle: () => invalid(ops) };
      },
    });
    assert.equal(result.done, false);
  }
});
