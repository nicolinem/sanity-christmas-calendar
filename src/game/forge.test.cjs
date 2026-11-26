/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { EMPTY_PROGRESS } = require("./quests/progress.ts");
const {
  applyForgings,
  ingredientLine,
  missingFor,
  missingText,
  recipeStates,
  caveGoal,
} = require("./forge.ts");
const { RECIPE_IDS, unlockedRecipes } = require("./recipes.ts");

const progress = (over) => ({ ...EMPTY_PROGRESS, ...over });
const shield = (id = "f1") => ({
  _id: id,
  name: "Mitt skjold",
  recipe: "recipe-isskjold",
});

test("a forging with enough materials takes them and records the recipe", () => {
  const p = progress({
    chests: { "cave-5": true },
    inventory: { malm: 5, isskar: 2 },
  });
  const { progress: next, forged } = applyForgings(p, [shield()]);
  assert.deepEqual(next.inventory, { malm: 1, isskar: 0 });
  assert.deepEqual(next.crafted, { f1: "recipe-isskjold" });
  assert.equal(forged.length, 1);
  assert.equal(forged[0].recipe, "recipe-isskjold");
  assert.equal(forged[0].forging._id, "f1");
});

test("too few materials takes nothing and is shown as missing", () => {
  const p = progress({ chests: { "cave-5": true }, inventory: { malm: 4 } });
  const f = [shield()];
  assert.equal(applyForgings(p, f).progress, p);
  assert.deepEqual(recipeStates(p, f), [
    {
      id: "recipe-isskjold",
      state: "missing",
      missing: [{ material: "isskar", count: 2 }],
    },
  ]);
  assert.equal(missingText(recipeStates(p, f)[0].missing), "Mangler 2 Isskår");
});

test("materials found later forge it without publishing again", () => {
  const f = [shield()];
  const p = progress({ chests: { "cave-5": true }, inventory: { malm: 4 } });
  assert.equal(applyForgings(p, f).forged.length, 0);
  const later = { ...p, inventory: { malm: 4, isskar: 2 } };
  const { progress: next, forged } = applyForgings(later, f);
  assert.equal(forged.length, 1);
  assert.deepEqual(next.inventory, { malm: 0, isskar: 0 });
});

test("a recipe gives its gear once", () => {
  const p = progress({
    chests: { "cave-5": true },
    inventory: { malm: 8, isskar: 4 },
  });
  const { progress: next, forged } = applyForgings(p, [
    shield("f1"),
    shield("f2"),
  ]);
  assert.equal(forged.length, 1);
  assert.equal(forged[0].forging._id, "f1");
  assert.deepEqual(next.crafted, { f1: "recipe-isskjold" });
  assert.deepEqual(next.inventory, { malm: 4, isskar: 2 });
});

test("the same forging is never used twice", () => {
  const p = progress({
    chests: { "cave-5": true },
    inventory: { malm: 8, isskar: 4 },
    crafted: { f1: "recipe-isskjold" },
  });
  const r = applyForgings(p, [shield("f1")]);
  assert.equal(r.progress, p);
  assert.equal(r.forged.length, 0);
});

test("a locked recipe forges nothing until its chest is opened", () => {
  const f = [{ _id: "h1", name: "Hjelm", recipe: "recipe-ishjelm" }];
  const inventory = { malm: 6, isskar: 4 };
  const locked = progress({ chests: { "cave-5": true }, inventory });
  assert.equal(applyForgings(locked, f).progress, locked);
  assert.deepEqual(
    recipeStates(locked, f).map((s) => s.id),
    ["recipe-isskjold"],
  );
  const open = progress({ chests: { "cave-10": true }, inventory });
  const { progress: next, forged } = applyForgings(open, f);
  assert.equal(forged.length, 1);
  assert.deepEqual(next.crafted, { h1: "recipe-ishjelm" });
  assert.deepEqual(next.inventory, { malm: 0, isskar: 0 });
});

test("unknown or empty recipes are skipped", () => {
  const p = progress({
    chests: { "cave-5": true },
    inventory: { malm: 9, isskar: 9 },
  });
  const r = applyForgings(p, [
    { _id: "a", name: "x", recipe: null },
    { _id: "b", name: "x", recipe: "recipe-x" },
  ]);
  assert.equal(r.progress, p);
  assert.deepEqual(r.forged, []);
});

test("trip does not count", () => {
  const p = progress({
    chests: { "cave-5": true },
    trip: { malm: 4, isskar: 2 },
  });
  assert.equal(applyForgings(p, [shield()]).progress, p);
  assert.deepEqual(recipeStates(p, [shield()])[0].missing, [
    { material: "malm", count: 4 },
    { material: "isskar", count: 2 },
  ]);
});

test("missingText joins two materials", () => {
  assert.equal(
    missingText([
      { material: "malm", count: 3 },
      { material: "isskar", count: 2 },
    ]),
    "Mangler 3 Gammel malm og 2 Isskår",
  );
  assert.equal(missingText([]), "");
});

test("recipeStates: todo without a forging, done once crafted, only unlocked recipes", () => {
  assert.deepEqual(recipeStates(progress({}), []), []);
  const p = progress({ chests: { "cave-5": true } });
  assert.deepEqual(recipeStates(p, []), [
    {
      id: "recipe-isskjold",
      state: "todo",
      missing: [
        { material: "malm", count: 4 },
        { material: "isskar", count: 2 },
      ],
    },
  ]);
  const done = progress({
    chests: { "cave-5": true, "cave-10": true },
    inventory: { malm: 3 },
    crafted: { f1: "recipe-isskjold" },
  });
  const states = recipeStates(done, [shield("f1")]);
  assert.deepEqual(states[0], {
    id: "recipe-isskjold",
    state: "done",
    missing: [],
  });
  assert.equal(states[1].id, "recipe-ishjelm");
  assert.equal(states[1].state, "todo");
});

test("recipes are listed with floor 5 first and unlock from chests", () => {
  assert.deepEqual(RECIPE_IDS, ["recipe-isskjold", "recipe-ishjelm"]);
  assert.deepEqual(unlockedRecipes({ chests: { "cave-10": true } }), [
    "recipe-ishjelm",
  ]);
  assert.deepEqual(unlockedRecipes({}), []);
  assert.deepEqual(missingFor({ malm: 9, isskar: 9 }, "recipe-ishjelm"), []);
});

test("the ingredient line shows held against needed", () => {
  assert.equal(
    ingredientLine({ malm: 3, isskar: 2 }, "recipe-isskjold"),
    "Gammel malm 3/4 · Isskår 2/2",
  );
  assert.equal(
    ingredientLine({}, "recipe-isskjold"),
    "Gammel malm 0/4 · Isskår 0/2",
  );
});

test("a forging already used for another recipe does not make this one missing", () => {
  const p = progress({
    chests: { "cave-5": true, "cave-10": true },
    inventory: { malm: 0, isskar: 0 },
    crafted: { f1: "recipe-isskjold" },
  });
  const reused = { _id: "f1", name: "Mitt skjold", recipe: "recipe-ishjelm" };
  assert.deepEqual(
    recipeStates(p, [reused]).map((s) => [s.id, s.state]),
    [
      ["recipe-isskjold", "done"],
      ["recipe-ishjelm", "todo"],
    ],
  );
});

test("caveGoal: the next chest, then the recipe it gave, counting the trip", () => {
  assert.equal(caveGoal(progress({})), "Kista er på etasje 5");
  assert.equal(
    caveGoal(
      progress({
        chests: { "cave-5": true },
        inventory: { malm: 2 },
        trip: { malm: 1, isskar: 1 },
      }),
    ),
    "Isskjold: Gammel malm 3/4 · Isskår 1/2",
  );
  assert.equal(
    caveGoal(
      progress({
        chests: { "cave-5": true },
        crafted: { f1: "recipe-isskjold" },
      }),
    ),
    "Kista er på etasje 10",
  );
  assert.equal(
    caveGoal(
      progress({
        chests: { "cave-5": true, "cave-10": true },
        crafted: { f1: "recipe-isskjold", f2: "recipe-ishjelm" },
      }),
    ),
    null,
  );
});
