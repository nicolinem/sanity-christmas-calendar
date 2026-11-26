/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { normalizeAbout, aboutProgress, cleanAboutText } = require("./about.ts");

test("normalizeAbout cleans, trims, strips «å» and dedupes topics", () => {
  const about = normalizeAbout({
    food: "  pepperkaker<script> ",
    activity: "Å gå på ski",
    topics: ["GROQ", "groq", "", "hunden min", "a", "b", "c", "d", "e", "f"],
    saying: "   ",
  });
  assert.deepEqual(about, {
    food: "pepperkakerscript",
    activity: "gå på ski",
    topics: ["GROQ", "hunden min", "a", "b", "c", "d", "e", "f"],
  });
});

test("normalizeAbout rejects wrong types and oversized lists", () => {
  assert.equal(normalizeAbout(null), null);
  assert.equal(normalizeAbout([]), null);
  assert.equal(normalizeAbout("taco"), null);
  assert.equal(normalizeAbout({ food: 3 }), null);
  assert.equal(normalizeAbout({ saying: {} }), null);
  assert.equal(normalizeAbout({ topics: "GROQ" }), null);
  assert.equal(normalizeAbout({ topics: [1] }), null);
  assert.equal(normalizeAbout({ topics: Array(21).fill("x") }), null);
  assert.deepEqual(normalizeAbout({}), { food: "", activity: "", topics: [] });
});

test("normalizeAbout cuts to the limits", () => {
  const about = normalizeAbout({
    food: "x".repeat(60),
    activity: "y",
    topics: ["z".repeat(60)],
    saying: "s".repeat(120),
  });
  assert.equal(about.food.length, 40);
  assert.equal(about.topics[0].length, 40);
  assert.equal(about.saying.length, 80);
});

test("cleanAboutText keeps allowed punctuation and doesn't trim while typing", () => {
  assert.equal(
    cleanAboutText("Hei, «du»! (ja?) <b>", 80),
    "Hei, «du»! (ja?) b",
  );
  assert.equal(cleanAboutText("taco ", 40), "taco ");
  assert.equal(cleanAboutText("abcdef", 3), "abc");
});

test("aboutProgress counts the three requirements and names the first gap", () => {
  const empty = aboutProgress(undefined, true);
  assert.deepEqual(
    { done: empty.done, complete: empty.complete, first: empty.firstMissing },
    { done: 0, complete: false, first: "food" },
  );
  assert.equal(
    empty.message,
    "Skriv inn favorittmaten din, så får andre i bygda høre om den.",
  );
  assert.equal(
    aboutProgress({ food: "taco", activity: "", topics: [] }, true).message,
    "Skriv inn noe du liker å gjøre, så får andre i bygda høre om det.",
  );
  assert.equal(
    aboutProgress({ food: "taco", activity: "ski", topics: ["a"] }, true)
      .message,
    "Skriv 2 ting til som du prater om.",
  );
  const twoTopics = aboutProgress(
    { food: "taco", activity: "ski", topics: ["a", "b"] },
    true,
  );
  assert.equal(twoTopics.done, 2);
  assert.equal(twoTopics.firstMissing, "topics");
  assert.equal(
    twoTopics.message,
    "Skriv minst én ting til, så får andre i bygda høre om den.",
  );
  const done = aboutProgress(
    { food: "taco", activity: "ski", topics: ["a", "b", "c"] },
    true,
  );
  assert.equal(done.complete, true);
  assert.equal(done.done, 3);
  assert.equal(done.message, null);
});

test("aboutProgress lets a player who doesn't share finish with nothing", () => {
  const p = aboutProgress(undefined, false);
  assert.equal(p.complete, true);
  assert.equal(p.firstMissing, null);
  assert.equal(p.message, null);
});
