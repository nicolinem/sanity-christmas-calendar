/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const path = require("node:path");
const vm = require("node:vm");
const { transform } = require("sucrase");

const mod = { exports: {} };
const code = transform(
  readFileSync(path.join(__dirname, "archive.ts"), "utf8"),
  {
    transforms: ["typescript", "imports"],
    production: true,
  },
).code;
vm.runInNewContext(code, { module: mod, exports: mod.exports });
const { CASE_FILE_EXPECTED, caseFileScore } = mod.exports;
const plain = (x) => JSON.parse(JSON.stringify(x));

test("the expected folder is the nine confirmed observations", () => {
  assert.equal(CASE_FILE_EXPECTED.length, 9);
  assert.ok(!CASE_FILE_EXPECTED.includes("archive-e1"));
  assert.ok(CASE_FILE_EXPECTED.includes("archive-l3"));
});

test("no published case scores zero", () => {
  assert.deepEqual(plain(caseFileScore([])), { right: 0, wrong: 0, total: 9 });
  assert.deepEqual(plain(caseFileScore([{ _id: "c", observations: [] }])), {
    right: 0,
    wrong: 0,
    total: 9,
  });
});

test("all nine is done", () => {
  const s = caseFileScore([
    { _id: "c", observations: [...CASE_FILE_EXPECTED] },
  ]);
  assert.deepEqual(plain(s), { right: 9, wrong: 0, total: 9 });
});

test("a rumour in the folder counts against it", () => {
  const s = caseFileScore([
    { _id: "c", observations: [...CASE_FILE_EXPECTED, "archive-e1"] },
  ]);
  assert.deepEqual(plain(s), { right: 9, wrong: 1, total: 9 });
  assert.equal(s.right === s.total && s.wrong === 0, false);
});

test("the best case is chosen", () => {
  const s = caseFileScore([
    { _id: "a", observations: ["archive-a1"] },
    {
      _id: "b",
      observations: [...CASE_FILE_EXPECTED.slice(0, 7), "archive-d1"],
    },
    { _id: "c", observations: CASE_FILE_EXPECTED.slice(0, 4) },
  ]);
  assert.deepEqual(plain(s), { right: 7, wrong: 1, total: 9 });
});
