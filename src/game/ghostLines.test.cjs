/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { GHOST_LINES, lineProblems, pickLine } = require("./ghostLines.ts");

test("every line follows the rules", () => {
  for (const [kind, lines] of Object.entries(GHOST_LINES)) {
    assert.ok(lines.length >= 6, `${kind} has at least 6 lines`);
    assert.equal(new Set(lines).size, lines.length, `${kind} has no repeats`);
    for (const line of lines)
      assert.deepEqual(lineProblems(kind, line), [], line);
  }
});

test("lineProblems catches missing slots, extra slots and pronouns", () => {
  assert.ok(lineProblems("food", "Jeg liker mat.").length);
  assert.ok(lineProblems("food", "{ord} og {ord}").length);
  assert.ok(lineProblems("plain", "Hei {ord}").length);
  assert.ok(lineProblems("gossip", "Hun liker {ord}.").length);
  assert.ok(lineProblems("gossip", "{navn} liker {ord}, sa han.").length);
  assert.ok(lineProblems("gossip", "Noen liker {ord}.").length);
  assert.ok(lineProblems("topic", "{ord} og {ting}").length);
  assert.ok(lineProblems("plain", "x".repeat(141)).length);
  assert.deepEqual(lineProblems("plain", "Hanne og Hunter er her."), []);
});

const ola = { playerId: "ola111", name: "Ola", about: null };
const kari = {
  playerId: "kari22",
  name: "Kari",
  about: {
    food: "taco",
    activity: "strikke",
    topics: ["<b>GROQ</b>"],
    saying: "Skru den av og på!",
  },
};

test("a ghost without Om meg and no one to gossip about only says plain lines", () => {
  for (let i = 0; i < 50; i++) {
    const line = pickLine(ola, [], null);
    assert.ok(GHOST_LINES.plain.includes(line.template));
    assert.deepEqual(line.parts, [{ text: line.template }]);
  }
});

test("a ghost never gossips about itself or someone with no topics", () => {
  for (let i = 0; i < 100; i++) {
    const line = pickLine(kari, [kari, ola], null);
    assert.ok(!GHOST_LINES.gossip.includes(line.template));
  }
});

test("gossip names the other ghost and marks their word as text", () => {
  let line;
  for (let i = 0; i < 300 && !line; i++) {
    const l = pickLine(ola, [kari], null);
    if (GHOST_LINES.gossip.includes(l.template)) line = l;
  }
  assert.ok(line, "gossip came up");
  assert.ok(line.parts.some((p) => !p.word && p.text.includes("Kari")));
  assert.deepEqual(
    line.parts.filter((p) => p.word),
    [{ text: "<b>GROQ</b>", word: true }],
  );
});

test("the saying is said whole, marked as the word", () => {
  let line;
  for (let i = 0; i < 300 && !line; i++) {
    const l = pickLine(kari, [], null);
    if (GHOST_LINES.saying.includes(l.template)) line = l;
  }
  assert.ok(line, "saying came up");
  assert.deepEqual(
    line.parts.filter((p) => p.word),
    [{ text: "Skru den av og på!", word: true }],
  );
});

test("the parts put back together are the template filled in", () => {
  for (let i = 0; i < 100; i++) {
    const line = pickLine(kari, [], null);
    const text = line.parts.map((p) => p.text).join("");
    assert.ok(!text.includes("{"), text);
    assert.equal(line.parts.filter((p) => p.word).length <= 1, true);
  }
});

test("the same line never comes twice in a row", () => {
  let last = null;
  for (let i = 0; i < 200; i++) {
    const line = pickLine(kari, [], last);
    assert.notEqual(line.template, last);
    last = line.template;
  }
});
