/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("sucrase");
require("sucrase/register");

const {
  OTHER_ITEM_SPRITE_IDS,
  spriteIdsForItemKind,
  WEAPON_SPRITE_IDS,
} = require("../../../../game/sprites.ts");
const sprites = require("../../../../game/sprites.ts");
const { toGameItem } = require("../../../../game/items.ts");
const SpriteImage = ({ spriteId }) =>
  React.createElement("span", { "data-sprite-id": spriteId });
const filename = `${__dirname}/drawingBoard.tsx`;
const moduleResult = { exports: {} };
const source = transform(readFileSync(filename, "utf8"), {
  transforms: ["typescript", "jsx", "imports"],
  jsxRuntime: "automatic",
  production: true,
}).code;
vm.runInNewContext(source, {
  module: moduleResult,
  exports: moduleResult.exports,
  require(name) {
    if (name === "@/components/SpriteImage")
      return { __esModule: true, default: SpriteImage };
    if (name === "@/components/SpriteImage?raw")
      return { __esModule: true, default: "" };
    if (name === "@/game/sprites")
      return {
        KNOWN_SPRITE_IDS: sprites.KNOWN_SPRITE_IDS,
        spriteIdsForItemKind,
        WEAPON_SPRITE_IDS,
        OTHER_ITEM_SPRITE_IDS,
      };
    if (name === "@/game/sprites?raw") return { __esModule: true, default: "" };
    if (name === "@/sanity/studio/SpritePicker?raw")
      return { __esModule: true, default: "" };
    return require(name);
  },
});
const { drawingBoardTask: task } = moduleResult.exports;
const { runModule } = require("../runCode.ts");

function load(source) {
  const loaded = runModule(source, task.modules, task.importHelp);
  assert.equal(loaded.ok, true, loaded.ok ? undefined : loaded.message);
  return loaded.exports;
}

function completeStarter() {
  return task.starter
    .replace(
      "<Text key={id} size={1}>{id}</Text>",
      `<Button
            key={id}
            width="fill"
            justify="center"
            icon={<SpriteImage spriteId={id} />}
            mode={props.value === id ? "default" : "ghost"}
            onClick={() => props.onChange(set(id))}
          />`,
    )
    .replace(
      "// TODO: send unset() til props.onChange, så valget fjernes.",
      "props.onChange(unset())",
    );
}

test("sprite categories stay separate and exclude creature art", () => {
  assert.deepEqual(
    Array.from(spriteIdsForItemKind("weapon")),
    WEAPON_SPRITE_IDS,
  );
  assert.deepEqual(
    Array.from(spriteIdsForItemKind("material")),
    OTHER_ITEM_SPRITE_IDS,
  );
  assert.deepEqual(
    Array.from(spriteIdsForItemKind("potion")),
    OTHER_ITEM_SPRITE_IDS,
  );
  assert.equal(spriteIdsForItemKind(undefined).length, 0);
  assert.equal(sprites.isSpriteAllowedForKind("sword", "material"), false);
  assert.equal(sprites.isSpriteAllowedForKind("potion-frost", "weapon"), false);
  assert.equal(sprites.isSpriteAllowedForKind("gem", "material"), true);
  for (const id of [
    "dragon",
    "wolf",
    "rat",
    "bat",
    "spider",
    "slime",
    "ghost",
  ]) {
    assert.equal(spriteIdsForItemKind("material").includes(id), false);
  }
});

test("game items get a safe category fallback for mismatched art", () => {
  const invalidWeapon = toGameItem(
    {
      id: "invalid-weapon",
      name: "Gem Blade",
      kind: "weapon",
      spriteId: "gem",
    },
    1,
  );
  assert.equal(invalidWeapon.spriteMatchesKind, false);
  assert.equal(invalidWeapon.knownSprite, true);
  assert.equal(invalidWeapon.sprite.frame, 103);

  const invalidMaterial = toGameItem(
    {
      id: "invalid-material",
      name: "Sword Ore",
      kind: "material",
      spriteId: "sword",
    },
    1,
  );
  assert.equal(invalidMaterial.spriteMatchesKind, false);
  assert.equal(invalidMaterial.sprite.frame, 89);
});

test("starter keeps type filtering and scaffolds unfinished visual choices", () => {
  assert.match(task.starter, /import SpriteImage/);
  assert.doesNotMatch(task.starter, /aria-pressed=\{selected\}/);
  assert.doesNotMatch(task.starter, /aria-label=\{"Velg " \+ id\}/);

  const verdict = task.judge(load(task.starter));
  assert.deepEqual(
    Array.from(verdict.requirements, ({ done }) => done),
    [true, true, false, false, false, false],
  );
  assert.equal(verdict.done, false);
  assert.equal(verdict.solvedAs, undefined);

  const html = renderToStaticMarkup(
    React.createElement(task.Result, { verdict }),
  );
  assert.equal((html.match(/data-sprite-id="/g) || []).length, 0);
  assert.equal(
    (html.match(/data-size="1"/g) || []).length,
    WEAPON_SPRITE_IDS.length,
  );
  assert.match(html, /Valgt: wooden-sword/);
});

test("older saved drafts using KNOWN_SPRITE_IDS still render without passing", () => {
  const oldDraft = `
    import { set } from "sanity"
    import SpriteImage from "../../components/SpriteImage"
    import { KNOWN_SPRITE_IDS } from "../../game/sprites"

    export function SpritePicker(props) {
      return (
        <div>
          {KNOWN_SPRITE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-label={\`Velg \${id}\`}
              aria-pressed={props.value === id}
              onClick={() => props.onChange(set(id))}
            >
              <SpriteImage spriteId={id} />
            </button>
          ))}
        </div>
      )
    }
  `;
  const verdict = task.judge(load(oldDraft));
  assert.equal(verdict.error, undefined);
  assert.equal(verdict.done, false);

  const html = renderToStaticMarkup(
    React.createElement(task.Result, { verdict }),
  );
  assert.match(html, /aria-label="Velg wooden-sword"/);
});

test("selection and clear buttons send the expected Sanity patches", () => {
  const verdict = task.judge(load(completeStarter()));
  assert.deepEqual(
    Array.from(verdict.requirements, ({ done }) => done),
    [true, true, true, true, true, true],
  );
  assert.equal(verdict.done, true);
  assert.deepEqual({ ...verdict.solvedAs }, {});
});

test("sprite images as Button children pass without icon or layout props", () => {
  const source = completeStarter()
    .replace(
      '            width="fill"\n            justify="center"\n            icon={<SpriteImage spriteId={id} />}\n',
      "",
    )
    .replace(
      "          />",
      "          ><SpriteImage spriteId={id} /></Button>",
    );
  const verdict = task.judge(load(source));
  assert.deepEqual(
    Array.from(verdict.requirements, ({ done }) => done),
    [true, true, true, true, true, true],
  );
  assert.equal(verdict.done, true);
  const html = renderToStaticMarkup(
    React.createElement(task.Result, { verdict }),
  );
  assert.match(html, /data-sprite-id="wooden-sword"/);
});

test("mixing icon and children also keeps all type-filtered choices", () => {
  const source = completeStarter()
    .replace(
      "icon={<SpriteImage spriteId={id} />}",
      'icon={id === "sword" ? <SpriteImage spriteId={id} /> : undefined}',
    )
    .replace(
      "          />",
      '          >{id !== "sword" && <SpriteImage spriteId={id} />}</Button>',
    );
  assert.equal(task.judge(load(source)).done, true);
});

test("a component crash cannot pass the task", () => {
  const verdict = task.judge({
    SpritePicker() {
      throw new Error("picker crashed");
    },
  });
  assert.equal(verdict.done, false);
  assert.match(verdict.error, /picker crashed/);
  assert.equal(verdict.solvedAs, undefined);
});
