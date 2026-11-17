/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");

const { CHAPTERS, findPlayerWeapon } = require("./quests/chapters.ts");
const { BRANN_HAMMER } = require("./apprentice.ts");

const quest = (id) =>
  CHAPTERS.flatMap((chapter) => chapter.quests).find((item) => item.id === id);

const context = (overrides = {}) => ({
  items: [],
  progress: {
    track: "nonTechnical",
    completed: {},
    briefed: {},
    fetched: {},
    hints: {},
    solved: {},
  },
  codeChecks: {},
  sanityConfigured: true,
  ...overrides,
});

const weapon = (description) => ({
  id: "my-weapon",
  source: "sanity",
  kind: "weapon",
  power: { damage: 3 },
  name: "Frostsverd",
  description,
});

test("weapon description must be published, long enough and changed", () => {
  const check = quest("weapon-description").check;
  const progress = {
    ...context().progress,
    weaponDescriptionItemId: "my-weapon",
    weaponDescriptionBefore: "Kort tekst",
  };

  assert.match(check(context({ progress })).message, /ikke publisert/);
  assert.match(
    check(context({ progress, items: [weapon("For kort")] })).message,
    /hel setning/,
  );
  assert.equal(
    check(context({ progress, items: [weapon("Kort tekst")] })).done,
    false,
  );
  assert.equal(
    check(
      context({
        progress,
        items: [weapon("Et tydelig våpen for vinterens farer.")],
      }),
    ).done,
    true,
  );
  assert.match(
    check(context({ progress, items: [weapon("Kort tekst")] })).goal,
    /Frostsverd/,
  );
});

test("the forge sign picks the equipped published player weapon, never Brann's hammer", () => {
  const playerWeapon = weapon("En beskrivelse.");
  const hammer = {
    ...playerWeapon,
    id: "item-brann-anvil-hammer",
    name: "Branns hammer",
  };
  assert.equal(
    findPlayerWeapon([hammer, playerWeapon], playerWeapon.id),
    playerWeapon,
  );
  assert.equal(findPlayerWeapon([hammer, playerWeapon]), playerWeapon);
});

test("the apprentice hammer needs all original published values", () => {
  const check = quest("apprentice-mistake").check;
  const hammer = {
    id: BRANN_HAMMER._id,
    source: "sanity",
    kind: "weapon",
    power: { damage: 3 },
    name: BRANN_HAMMER.name,
    description: BRANN_HAMMER.description,
    spriteId: BRANN_HAMMER.sprite,
  };
  assert.equal(check(context()).done, false);
  assert.equal(
    check(context({ items: [{ ...hammer, name: "Feil" }] })).done,
    false,
  );
  assert.deepEqual(check(context({ items: [hammer] })), {
    done: true,
    message: undefined,
  });
});

test("the History hints cover a wider pane, pre-apprentice revision, and Draft publish", () => {
  const hints = quest("apprentice-mistake").hints.map(({ text }) => text);
  assert.match(hints[0], /History.*bredere/);
  assert.match(hints[1], /før lærlingen/);
  assert.match(hints[2], /Published.*Draft.*Publish/);
});
