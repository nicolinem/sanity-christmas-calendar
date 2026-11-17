/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const { transform } = require("sucrase");

function load(file, dependencies) {
  const mod = { exports: {} };
  vm.runInNewContext(
    transform(readFileSync(`${__dirname}/../../${file}`, "utf8"), {
      transforms: ["typescript", "imports"],
    }).code,
    {
      module: mod,
      exports: mod.exports,
      require: (id) => {
        assert.ok(
          Object.hasOwn(dependencies, id),
          `Unexpected dependency: ${id}`,
        );
        return dependencies[id];
      },
    },
  );
  return mod.exports;
}

test("Publish is primary; Klar is an additional bakeryOrder action", () => {
  const Publish = () => ({ label: "Publish" });
  const Klar = () => ({ label: "Klar" });
  const config = load("sanity.config.ts", {
    sanity: { defineConfig: (config) => config },
    "sanity/structure": { structureTool: () => ({}) },
    "@sanity/vision": { visionTool: () => ({}) },
    "./src/sanity/env": {
      projectId: "test",
      dataset: "test",
      apiVersion: "test",
    },
    "./src/sanity/schemaTypes": { schema: {} },
    "./src/sanity/studio/structure": {
      defaultDocumentNode: () => {},
      structure: () => {},
    },
    "./src/sanity/lib/solved": { isSolved: () => false },
    "./src/sanity/studio/BakeryActions": {
      ForgeAction: () => {},
      ReadyAction: Klar,
    },
  }).default;
  const actions = config.document.actions([Publish], {
    schemaType: "bakeryOrder",
  });
  assert.equal(actions[0], Publish);
  assert.equal(actions[1], Klar);
  assert.equal(
    config.document.actions([Publish], { schemaType: "bakerySign" })[0],
    Publish,
  );
});

test("Klar appears in morning rush and patches before publishing", () => {
  let enabled = false;
  let validation = { validation: [], isValidating: false };
  const calls = [];
  const { ReadyAction } = load("src/sanity/studio/BakeryActions.ts", {
    "@sanity/types": {
      isValidationErrorMarker: (marker) => marker.level === "error",
    },
    sanity: {
      getDraftId: (id) => `drafts.${id}`,
      useDocumentOperation: () => ({
        patch: {
          execute: (value) => calls.push(["patch", value[0].set.status]),
        },
        publish: { execute: () => calls.push(["publish"]) },
      }),
      useValidationStatus: () => validation,
    },
    "../lib/solved": { useMorningRush: () => enabled },
  });
  const props = {
    id: "order",
    type: "bakeryOrder",
    ready: true,
    draft: { item: "Julekake", status: "ny" },
    onComplete: () => calls.push(["complete"]),
  };
  assert.equal(ReadyAction(props), null);
  enabled = true;
  const action = ReadyAction(props);
  assert.equal(action.label, "Klar");
  assert.equal(action.disabled, false);
  action.onHandle();
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["patch", "klar"],
    ["publish"],
    ["complete"],
  ]);
  validation = { validation: [{ level: "error" }], isValidating: false };
  assert.equal(ReadyAction(props).disabled, true);
  validation = { validation: [], isValidating: true };
  assert.equal(ReadyAction(props).disabled, true);
});
