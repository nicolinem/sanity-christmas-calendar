/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
require("sucrase/register");
const { judgeBoard } = require("./modelBoard.ts");
const {
  BOARD_TASKS,
} = require("../../components/hud/modelBoard/tasks/index.ts");

const task = {
  id: "test-board",
  note: "Sorter notatet mitt.",
  slots: [
    { id: "text", label: "Tekst", about: "Ord" },
    { id: "boolean", label: "Ja/nei", about: "Sant eller usant" },
    { id: "image", label: "Bilde", about: "Et bilde" },
  ],
  cards: [
    { id: "tracks", text: "fotspor" },
    { id: "seen", text: "sett selv" },
  ],
  decisions: [
    {
      card: "tracks",
      accept: ["text"],
      feedback: {
        boolean: "Fotspor er ord, ikke et ja eller nei.",
        image: "Jeg har ikke et bilde av fotsporene.",
      },
    },
    {
      card: "seen",
      accept: ["boolean"],
      feedback: {
        text: "Fritekst kan ikke sorteres sikkert.",
        image: "Det er en opplysning, ikke et bilde.",
      },
      toggles: {
        required: {
          want: true,
          feedback: "Jeg må alltid vite om noen så det selv.",
        },
        initial: {
          want: false,
          feedback: "Ikke gjett før vitnet har svart.",
        },
      },
    },
  ],
  allowToggles: ["required", "initial"],
};

test("an empty board has one unfinished requirement per card", () => {
  const result = judgeBoard(task, {});
  assert.equal(result.done, false);
  assert.deepEqual(
    result.requirements.map(({ label, done, message }) => ({
      label,
      done,
      message,
    })),
    [
      { label: "fotspor", done: false, message: undefined },
      { label: "sett selv", done: false, message: undefined },
    ],
  );
});

test("a completely correct board is done", () => {
  const result = judgeBoard(task, {
    tracks: { slot: "text" },
    seen: { slot: "boolean", required: true, initial: false },
  });
  assert.equal(result.done, true);
  assert.ok(result.requirements.every(({ done }) => done));
});

test("every wrong placement returns its own consequence", () => {
  for (const decision of task.decisions) {
    for (const slot of task.slots) {
      if (decision.accept.includes(slot.id)) continue;
      const requirement = judgeBoard(task, {
        [decision.card]: { slot: slot.id },
      }).requirements.find(({ label }) =>
        task.cards.some(
          (card) => card.id === decision.card && card.text === label,
        ),
      );
      assert.equal(requirement.message, decision.feedback[slot.id]);
      assert.ok(requirement.message.endsWith("."));
    }
  }
});

test("toggle feedback explains the first wrong switch", () => {
  const requirement = judgeBoard(task, {
    seen: { slot: "boolean", required: false, initial: true },
  }).requirements[1];
  assert.equal(requirement.done, false);
  assert.equal(
    requirement.message,
    task.decisions[1].toggles.required.feedback,
  );
});

test("every board task covers every believable wrong slot", () => {
  for (const board of Object.values(BOARD_TASKS)) {
    for (const card of board.cards) {
      const decision = board.decisions.find(({ card: id }) => id === card.id);
      assert.ok(decision, `${board.id}/${card.id} needs a decision`);
      for (const slot of board.slots) {
        if (decision.accept.includes(slot.id)) continue;
        assert.ok(
          decision.feedback[slot.id],
          `${board.id}/${card.id} needs feedback for ${slot.id}`,
        );
      }
    }
  }
});

test("the archive model has more cards than slots, and some must be weighed", () => {
  const board = BOARD_TASKS["archive-model"];
  const placement = {
    time: { slot: "text" },
    big: { slot: "text" },
    tracks: { slot: "text" },
    smia: { slot: "place" },
    place: { slot: "place" },
    witness: { slot: "witness" },
    seen: { slot: "boolean" },
    photo: { slot: "image" },
    status: { slot: "list" },
  };
  assert.ok(board.cards.length > board.slots.length);
  assert.equal(
    board.cards.find(({ id }) => id === "seen").text,
    "Kari så det selv (ikke hørt fra andre)",
  );
  assert.equal(judgeBoard(board, placement).done, true);
  const smiaAsText = judgeBoard(board, {
    ...placement,
    smia: { slot: "text" },
  });
  assert.equal(smiaAsText.done, false);
  assert.match(
    smiaAsText.requirements.find(({ label }) => label === "Smia").message,
    /samme stedet/,
  );
});

test("the bakery model requires the intended fields and starting values", () => {
  const board = BOARD_TASKS["baker-model"];
  const placement = {
    item: { slot: "text", required: true, initial: false },
    orderedBy: { slot: "text", required: false, initial: false },
    date: { slot: "date", required: true, initial: true },
    status: { slot: "list", required: true, initial: true },
    note: { slot: "text", required: false, initial: false },
  };
  assert.equal(board.cards.length, 5);
  assert.equal(judgeBoard(board, placement).done, true);
  assert.equal(
    judgeBoard(board, {
      ...placement,
      orderedBy: { slot: "text", required: true, initial: false },
    }).done,
    false,
  );
});

test("a toggle left undecided is not an answer, and says nothing yet", () => {
  const board = BOARD_TASKS["baker-model"];
  const verdict = judgeBoard(board, {
    orderedBy: { slot: "text" },
    item: { slot: "text", required: true },
  });
  const row = (label) =>
    verdict.requirements.find((requirement) => requirement.label === label);
  assert.equal(row("Brann").done, false);
  assert.equal(row("Brann").message, undefined);
  assert.equal(row("Lussekatter").message, undefined);
});
