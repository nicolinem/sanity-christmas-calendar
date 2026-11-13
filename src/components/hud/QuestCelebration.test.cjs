/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("sucrase");

const filename = path.resolve(__dirname, "QuestCelebration.tsx");
const moduleResult = { exports: {} };
vm.runInNewContext(
  transform(readFileSync(filename, "utf8"), {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
  }).code,
  {
    module: moduleResult,
    exports: moduleResult.exports,
    require(name) {
      if (name === "@/game/village")
        return { NPCS: { brann: { name: "Brann", title: "smeden", at: "ved smia", sprite: {} } } };
      if (name === "./SpriteIcon")
        return () => React.createElement("span", { className: "brann-sprite" });
      return name === "./icons"
        ? { IconCheck: () => React.createElement("span", null, "✓") }
        : require(name);
    },
  },
);
const QuestCelebration = moduleResult.exports.default;

test("quest completion shows the finished task and reward before opening the next door", () => {
  const html = renderToStaticMarkup(
    React.createElement(QuestCelebration, {
      door: 3,
      title: "Validation: regler for våpen",
      lesson: "Validation",
      objectives: ["Koden er bestått"],
      nextDoor: 4,
      level: { number: 2, damage: 6 },
      onClose() {},
      onOpenLog() {},
    }),
  );
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /Luke 3 er fullført/);
  assert.match(html, /Gratulerer!/);
  assert.match(html, /Validation: regler for våpen/);
  assert.match(html, /Krysset av i journalen/);
  assert.match(html, /Koden er bestått/);
  assert.match(html, /Smia nivå 2! Våpnene dine gjør nå 6 skade/);
  assert.match(html, /Luke 3 lyser i journalen/);
  assert.match(html, /Ny side i boka: Validation/);
  assert.match(html, />Se neste luke<\/button>/);
  assert.doesNotMatch(html, /Luke 4 er åpnet/);
  assert.doesNotMatch(html, /quest-celebration-doorway/);
});

test("the second beat opens the new door and directs the player to Brann", () => {
  const stage = { exports: {} };
  vm.runInNewContext(
    transform(readFileSync(filename, "utf8"), {
      transforms: ["typescript", "jsx", "imports"],
      jsxRuntime: "automatic",
      production: true,
    }).code,
    {
      module: stage,
      exports: stage.exports,
      require(name) {
          if (name === "@/game/village")
          return { NPCS: { brann: { name: "Brann", title: "smeden", at: "ved smia", sprite: {} } } };
        if (name === "./icons")
          return { IconCheck: () => React.createElement("span", null, "✓") };
        if (name === "./SpriteIcon")
          return () => React.createElement("span", { className: "brann-sprite" });
        return name === "react"
          ? { ...React, useState: () => [true, () => {}] }
          : require(name);
      },
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(stage.exports.default, {
      door: 3,
      title: "Validation: regler for våpen",
      lesson: "Validation",
      nextDoor: 4,
      onClose() {},
      onOpenLog() {},
    }),
  );
  assert.match(html, /Luke 4 er åpnet/);
  assert.match(html, /Snakk med Brann ved smia \(E\)/);
  assert.match(html, /aria-label="Brann, smeden"/);
  assert.doesNotMatch(html, /Brann · smia/);
  assert.match(html, /brann-sprite/);
  assert.match(html, /quest-celebration-doorway/);
  assert.match(html, />Åpne journalen<\/button>/);
  assert.match(html, />Tilbake til bygda<\/button>/);
  assert.ok(html.indexOf("Tilbake til bygda") < html.indexOf("Åpne journalen"));
  assert.match(html, /class="btn btn--amber">Tilbake til bygda<\/button>/);
});

test("when there is no new unlocked door, completion just returns to the village", () => {
  const html = renderToStaticMarkup(
    React.createElement(QuestCelebration, {
      door: 4,
      title: "Siste oppgave",
      lesson: "Ferdig",
      onClose() {},
      onOpenLog() {},
    }),
  );
  assert.match(html, /Luke 4 er fullført/);
  assert.match(html, />Tilbake til bygda<\/button>/);
  assert.doesNotMatch(html, /Se neste luke/);
  assert.doesNotMatch(html, /Brann · smia/);
  assert.doesNotMatch(html, /Åpne journal/);
});

test("the finished beat links to the door's page when the journal can show it", () => {
  const html = renderToStaticMarkup(
    React.createElement(QuestCelebration, {
      questId: "the-guilds-law",
      door: 3,
      title: "Validation",
      lesson: "Validation",
      onClose() {},
      onOpenLog() {},
      onReadPage() {},
    }),
  );
  assert.match(html, />Les siden<\/button>/);
});
