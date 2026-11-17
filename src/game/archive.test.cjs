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
const {
  CASE_FILE_EXPECTED,
  WHO_IS_LYING,
  caseFileResult,
  caseFileScore,
  linkScore,
  sourceCheckScore,
} = mod.exports;
const plain = (x) => JSON.parse(JSON.stringify(x));

test("the five clues have three confirmed observations", () => {
  assert.equal(WHO_IS_LYING.length, 5);
  assert.deepEqual(plain(CASE_FILE_EXPECTED), [
    "archive-a",
    "archive-b",
    "archive-c",
  ]);
  assert.equal(
    WHO_IS_LYING.find(({ _id }) => _id === "archive-c").place,
    undefined,
  );
});

test("no published case scores zero", () => {
  assert.deepEqual(plain(caseFileScore([])), { right: 0, wrong: 0, total: 3 });
  assert.deepEqual(plain(caseFileScore([{ _id: "c", observations: [] }])), {
    right: 0,
    wrong: 0,
    total: 3,
  });
});

test("all three confirmed observations complete the case", () => {
  const s = caseFileScore([
    { _id: "c", observations: [...CASE_FILE_EXPECTED] },
  ]);
  assert.deepEqual(plain(s), { right: 3, wrong: 0, total: 3 });
});

test("a rumour in the folder counts against it", () => {
  const s = caseFileScore([
    { _id: "c", observations: [...CASE_FILE_EXPECTED, "archive-e"] },
  ]);
  assert.deepEqual(plain(s), { right: 3, wrong: 1, total: 3 });
  assert.equal(s.right === s.total && s.wrong === 0, false);
});

test("the best case is chosen", () => {
  const s = caseFileScore([
    { _id: "a", observations: ["archive-a"] },
    {
      _id: "b",
      observations: [...CASE_FILE_EXPECTED, "archive-d"],
    },
    { _id: "c", observations: CASE_FILE_EXPECTED.slice(0, 1) },
  ]);
  assert.deepEqual(plain(s), { right: 3, wrong: 1, total: 3 });
});

test("case feedback names every missing and wrong observation", () => {
  const result = caseFileResult(
    [
      {
        _id: "case-one",
        observations: ["archive-a", "archive-e"],
        entries: [{ _id: "archive-e", what: "Noen hørte et brøl" }],
      },
    ],
    false,
  );
  assert.equal(result.objectives.length, 4);
  assert.ok(
    result.objectives.some((item) => item.label.includes("Melsekken revnet")),
  );
  assert.ok(
    result.objectives.some((item) => item.label.includes("Noen hørte et brøl")),
  );
  assert.equal(result.objectives.filter((item) => !item.done).length, 3);
});

test("case feedback identifies an unpublished draft when no case is published", () => {
  const result = caseFileResult([], true);
  assert.equal(result.done, false);
  assert.equal(result.message, "Saksmappa er ikke publisert.");
  assert.equal(result.objectives.length, CASE_FILE_EXPECTED.length);
});

test("who-is-lying needs five correct statuses and C linked to Bakeriet", () => {
  const docs = WHO_IS_LYING.map(({ _id, expected }) => ({
    _id,
    status: expected,
    ...(_id === "archive-c" ? { place: "place-bakeriet" } : {}),
  }));
  assert.deepEqual(plain(sourceCheckScore(docs)), { right: 5, total: 5 });
  assert.deepEqual(plain(linkScore(docs)), { right: 1, total: 1 });
  docs.find(({ _id }) => _id === "archive-d").status = "confirmed";
  assert.equal(sourceCheckScore(docs).right, 4);
});
