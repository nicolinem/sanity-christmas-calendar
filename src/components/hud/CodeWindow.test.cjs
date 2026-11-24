/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("sucrase");

const source = transform(
  readFileSync(path.resolve(__dirname, "codeWindow/CodeWindow.tsx"), "utf8"),
  {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
  },
).code;

function renderCodeWindow(initiallySolved) {
  const moduleResult = { exports: {} };
  vm.runInNewContext(source, {
    module: moduleResult,
    exports: moduleResult.exports,
    require(name) {
      if (name === "react")
        return {
          ...React,
          useEffect() {},
          useState: (initial) => [
            typeof initial === "function" ? initiallySolved : initial,
            () => {},
          ],
          useRef: (initial) => ({ current: initial }),
        };
      if (name === "./tasks")
        return {
          WINDOW_TASKS: {
            test: {
              file: "oppgave.ts",
              starter: "",
              references: [],
              resultTitle: "Resultat",
              Result: () => null,
              ours: "",
              extend: { file: "src/test.ts", marker: "QUEST", idea: "" },
            },
          },
        };
      if (name === "./drafts")
        return { draftKey: (id) => id, loadDraft: (_id, fallback) => fallback };
      if (name === "../icons")
        return { IconCheck: () => React.createElement("span", null, "✓") };
      if (name === "../richText") return { renderText: (text) => text };
      if (name === "@/game/quests/label")
        return {
          lukeName: (q) => (q.bonus ? "☆ Frivillig" : `Luke ${q.door}`),
        };
      if (
        name === "../StudioPractice" ||
        name === "../QuestHint" ||
        name === "./HintPager"
      )
        return () => null;
      if (
        name === "codemirror" ||
        name.startsWith("@codemirror/") ||
        name === "./runCode"
      )
        return {};
      return require(name);
    },
  });
  return renderToStaticMarkup(
    React.createElement(moduleResult.exports.default, {
      state: {
        status: "done",
        quest: {
          id: "test",
          door: 3,
          title: "Oppgave",
          goal: "Mål",
          hints: [],
        },
      },
      solved: true,
      onSolved() {},
      hintsShown: 0,
      onRevealHint() {},
      onClose() {},
    }),
  );
}

test("a newly solved task keeps its code visible until the player opens the celebration", () => {
  const html = renderCodeWindow(false);
  assert.match(html, /Kodevindu/);
  assert.match(html, /Oppgave godkjent!/);
  assert.match(html, /Studio bruker nå vår versjon av koden/);
  assert.doesNotMatch(html, /Luke 3 er fullført/);
  assert.match(html, />Gå videre<\/button>/);
  assert.doesNotMatch(html, /cw-success/);
});

test("reopening a completed task does not show the success prompt again", () => {
  const html = renderCodeWindow(true);
  assert.match(html, /Kodevindu/);
  assert.doesNotMatch(html, />Gå videre<\/button>/);
});
