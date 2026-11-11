/* eslint-disable @typescript-eslint/no-require-imports */
require("sucrase/register");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("sucrase");
const guild = require("../../../../sanity/lib/guild.ts");
const { runModule } = require("../runCode.ts");
function loadJsx(relativePath, resolveImport) {
  const moduleResult = { exports: {} };
  const source = transform(readFileSync(`${__dirname}/${relativePath}`, "utf8"), {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
  }).code;
  vm.runInNewContext(source, { module: moduleResult, exports: moduleResult.exports, require: resolveImport });
  return moduleResult.exports;
}
const richText = loadJsx("../../richText.tsx", require);
const QuestHint = loadJsx("../../QuestHint.tsx", name => name === "./richText" ? richText : require(name)).default;

test("legacy hints still render their number, code and documentation link", () => {
  const html = renderToStaticMarkup(React.createElement(QuestHint, {
    number: 1,
    hint: { text: "Bruk `rule.custom()`.", link: { label: "Custom validation", url: "https://www.sanity.io/docs/studio/validation" } },
  }));
  assert.match(html, /aria-label="Hint 1"/);
  assert.match(html, /<code>rule\.custom\(\)<\/code>/);
  assert.match(html, /class="log-hint-link"/);
  assert.match(html, /rel="noreferrer"/);
  assert.doesNotMatch(html, /<ol/);
});

test("structured hints separate the title, paragraphs, ordered steps and link", () => {
  const html = renderToStaticMarkup(React.createElement(QuestHint, {
    number: 3,
    hint: {
      title: "Er navnet ledig?",
      text: "Bruk `async`.\n\nSjekk antallet.",
      steps: ["Hent klienten.", "Bruk `await`.", "Returner `true` eller en feil."],
      link: { label: "Les mer", url: "https://www.sanity.io/docs/studio/validation" },
    },
  }));
  assert.match(html, /aria-label="Hint 3: Er navnet ledig\?"/);
  assert.match(html, /<strong>Er navnet ledig\?<\/strong>/);
  assert.match(html, /<p>Bruk <code>async<\/code>\.<\/p><p>Sjekk antallet\.<\/p>/);
  assert.match(html, /<ol class="log-hint-steps">/);
  assert.equal((html.match(/<li>/g) || []).length, 3);
  assert.ok(html.indexOf('</ol>') < html.indexOf('class="log-hint-link"'));
});

// Real rules, fake dataset, helpers and React rendering. Only Next's raw
// source import and application alias need adapting to Node.
const result = { exports: {} };
vm.runInNewContext(transform(readFileSync(`${__dirname}/validation.tsx`, "utf8"), {
  transforms: ["typescript", "jsx", "imports"],
  jsxRuntime: "automatic",
  production: true,
}).code, {
  module: result,
  exports: result.exports,
  Error,
  setTimeout,
  clearTimeout,
  require(name) {
    if (name === "@/sanity/lib/guild?raw") return { __esModule: true, default: "" };
    if (name === "@/sanity/lib/guild") return guild;
    if (name === "../fakeClient") return require("../fakeClient.ts");
    if (name === "../recordRules") return require("../recordRules.ts");
    if (name === "../../richText") return richText;
    return require(name);
  },
});
const { validationTask: task } = result.exports;
const spriteRule = rule => rule.custom((sprite, context) =>
  context.document.kind === "weapon" && !sprite ? "Våpen trenger sprite" : true);
const nameRuleSource = `rule => [
  rule.required(),
  rule.custom(async (name, context) => {
    const { document, getClient } = context
    if (!name || !document) return true
    const client = getClient({ apiVersion: "2026-09-03" })
    const taken = await isNameTaken(client, name, document._id)
    return taken ? "Navnet er tatt" : true
  }),
]`;
const nameRule = rule => [
  rule.required(),
  rule.custom(async (name, context) => {
    const client = context.getClient({ apiVersion: "2026-09-03" });
    const taken = await client.fetch(guild.SAME_NAME_QUERY, guild.sameNameParams(name, context.document._id));
    return taken ? "Navnet er tatt" : true;
  }),
];
const item = (sprite = spriteRule, name = nameRule, extra = {}) => ({
  item: {
    fields: [
      { name: "name", validation: name },
      { name: "kind" },
      { name: "sprite", validation: sprite },
    ],
    ...extra,
  },
});
const statuses = verdict => Array.from(verdict.requirements, r => r.done);
const crashRule = field => rule => rule.custom(() => { throw new Error(`${field} exploded`); });
const assertUnsolved = verdict => {
  assert.equal(verdict.done, false);
  assert.equal(verdict.solvedAs, undefined);
};

test("name helper converts the query result into a taken/not-taken answer", async () => {
  const answers = [true, false, false];
  const calls = [];
  const client = { fetch: async (query, params) => {
    calls.push({ query, params });
    return answers.shift();
  } };
  assert.equal(await guild.isNameTaken(client, "Frostbit", "drafts.new"), true);
  assert.equal(await guild.isNameTaken(client, "Rimøks", "drafts.ny"), false);
  assert.equal(await guild.isNameTaken(client, "Frostbit", "versions.release-1.frostbit"), false);
  assert.equal(calls[0].query, guild.SAME_NAME_QUERY);
  assert.deepEqual(calls[0].params, { name: "Frostbit", published: "new" });
  assert.deepEqual(calls[2].params, { name: "Frostbit", published: "frostbit" });
});

function starterExports({ name = false, sprite = false } = {}) {
  let source = task.starter;
  if (name) {
    const field = 'defineField({ name: "name", title: "Name", type: "string" })';
    assert.ok(source.includes(field));
    source = source.replace(field, `defineField({ name: "name", title: "Name", type: "string", validation: ${nameRuleSource} })`);
  }
  if (sprite) {
    const field = 'defineField({ name: "sprite", title: "Sprite", type: "string" })';
    assert.ok(source.includes(field));
    source = source.replace(field, `defineField({ name: "sprite", title: "Sprite", type: "string", validation: ${spriteRule} })`);
  }
  const loaded = runModule(source, task.modules, task.importHelp);
  assert.equal(loaded.ok, true, loaded.message);
  return loaded.exports;
}

test("starter leaves every validation check unfinished", async () => {
  const verdict = await task.judge(starterExports());
  assert.equal(verdict.error, undefined);
  assert.deepEqual(statuses(verdict), [false, false, false, false]);
  assert.deepEqual(Array.from(verdict.requirements, r => r.label), [
    "Et våpen uten `sprite` nektes",
    "Materialer uten `sprite` og våpen med `sprite` er greit",
    "Et våpen uten navn nektes",
    "Et navn som er tatt nektes",
  ]);
  assertUnsolved(verdict);
});

test("name rule can be completed independently of sprite validation", async () => {
  const nameOnly = await task.judge(starterExports({ name: true }));
  assert.deepEqual(statuses(nameOnly), [false, false, true, true]);
  assertUnsolved(nameOnly);
});

test("sprite rule can be completed independently of name validation", async () => {
  const spriteOnly = await task.judge(starterExports({ sprite: true }));
  assert.deepEqual(statuses(spriteOnly), [true, true, false, false]);
  assertUnsolved(spriteOnly);
});

test("both authored rules complete the task", async () => {
  const complete = await task.judge(starterExports({ name: true, sprite: true }));
  assert.equal(complete.error, undefined);
  assert.deepEqual(statuses(complete), [true, true, true, true]);
  assert.equal(complete.done, true);
});

test("sprite-only success is preserved while name validation is unfinished", async () => {
  const verdict = await task.judge(item(spriteRule, null));
  assert.deepEqual(statuses(verdict), [true, true, false, false]);
  assert.match(verdict.requirements[3].message, /Fullfør regelen på `name`/);
  assertUnsolved(verdict);
});

test("the name field must reject an empty value", async () => {
  const optionalName = rule => rule.custom(async (name, context) => {
    const client = context.getClient({ apiVersion: "2026-09-03" });
    const taken = await client.fetch(guild.SAME_NAME_QUERY, guild.sameNameParams(name, context.document._id));
    return taken ? "Navnet er tatt" : true;
  });
  const verdict = await task.judge(item(spriteRule, optionalName));
  assert.deepEqual(statuses(verdict), [true, true, false, true]);
  assert.match(verdict.requirements[2].message, /rule\.required\(\)/);
  assertUnsolved(verdict);
});

test("a unique-name rule must check custom's value argument", async () => {
  const wrongValue = rule => [
    rule.required(),
    rule.custom(async (sku, context) => {
      const client = context.getClient({ apiVersion: "2026-09-03" });
      const taken = await client.fetch(guild.SAME_NAME_QUERY, guild.sameNameParams("", context.document._id));
      return taken ? "Navnet er tatt" : true;
    }),
  ];
  const verdict = await task.judge(item(spriteRule, wrongValue));
  assert.deepEqual(statuses(verdict), [true, true, true, false]);
  assert.match(verdict.requirements[3].message, /verdien fra første parameter/);
  assertUnsolved(verdict);
});

test("a sprite crash does not contaminate name results or messages", async () => {
  const verdict = await task.judge(item(crashRule("sprite"), null));
  assert.match(verdict.error, /sprite.*sprite exploded/);
  assert.match(verdict.requirements[0].message, /sprite exploded/);
  assert.doesNotMatch(verdict.requirements[2].message, /sprite|exploded/);
  assertUnsolved(verdict);

  const namesDone = await task.judge(item(crashRule("sprite")));
  assert.deepEqual(statuses(namesDone), [false, false, true, true]);
  assertUnsolved(namesDone);
});

test("a name crash does not remove earned sprite results", async () => {
  const verdict = await task.judge(item(spriteRule, crashRule("name")));
  assert.deepEqual(statuses(verdict), [true, true, false, false]);
  assert.match(verdict.error, /name.*name exploded/);
  assert.match(verdict.requirements[2].message, /name exploded/);
  assertUnsolved(verdict);
});

test("rejecting every weapon fails the positive sprite check", async () => {
  const rejectWeapons = rule => rule.custom((_, ctx) => ctx.document.kind !== "weapon" || "Nei");
  const verdict = await task.judge(item(rejectWeapons));
  assert.deepEqual(statuses(verdict), [true, false, true, true]);
  assert.match(verdict.requirements[1].message, /våpen som har sprite nektes/);
  assertUnsolved(verdict);
});

test("required sprite for every kind still fails the material check", async () => {
  const verdict = await task.judge(item(rule => rule.required()));
  assert.equal(verdict.requirements[0].done, true);
  assert.equal(verdict.requirements[1].done, false);
  assert.match(verdict.requirements[1].message, /materiale uten sprite nektes/);
  assertUnsolved(verdict);
});

test("an always-rejecting name rule cannot stand in for sprite validation", async () => {
  const verdict = await task.judge(item(null, rule => rule.custom(() => "Nei")));
  assert.deepEqual(statuses(verdict), [false, false, true, true]);
  assert.equal(verdict.done, false);
  assertUnsolved(verdict);
});

test("warnings cannot satisfy either blocking requirement", async () => {
  const sprite = rule => spriteRule(rule).warning();
  const name = rule => [
    rule.required(),
    rule.custom(async (value, context) => {
      const client = context.getClient({ apiVersion: "2026-09-03" });
      const taken = await client.fetch(guild.SAME_NAME_QUERY, guild.sameNameParams(value, context.document._id));
      return taken ? "Navnet er tatt" : true;
    }).warning(),
  ];
  const verdict = await task.judge(item(sprite, name));
  assert.deepEqual(statuses(verdict), [false, false, true, false]);
  assert.match(verdict.requirements[0].message, /warning/);
  assert.match(verdict.requirements[3].message, /warning/);
  assertUnsolved(verdict);
});

test("missing await gets fresh-name guidance, not a sprite failure", async () => {
  const noAwait = rule => [rule.required(), rule.custom((name, ctx) => {
    const taken = ctx.getClient({ apiVersion: "2024-01-01" }).fetch(
      guild.SAME_NAME_QUERY, guild.sameNameParams(name, ctx.document._id));
    return taken ? "Navnet er tatt" : true;
  })];
  const verdict = await task.judge(item(spriteRule, noAwait));
  assert.deepEqual(statuses(verdict), [true, true, true, true]);
  assert.match(verdict.error, /Nytt våpen med nytt navn.*skal kunne publiseres/);
  assertUnsolved(verdict);
});

test("missing apiVersion is an editor error only on the name side", async () => {
  const noVersion = rule => [rule.required(), rule.custom((_, ctx) => ctx.getClient())];
  const verdict = await task.judge(item(spriteRule, noVersion));
  assert.deepEqual(statuses(verdict), [true, true, false, false]);
  assert.match(verdict.error, /apiVersion/);
  assert.match(verdict.requirements[2].message, /apiVersion/);
  assert.match(verdict.requirements[3].message, /apiVersion/);
  assertUnsolved(verdict);
});

test("resaving is separate from fresh names, for both draft and published IDs", async () => {
  const ids = new Set();
  const rejectPublishedSelf = rule => [rule.required(), rule.custom(async (name, ctx) => {
    ids.add(ctx.document._id);
    if (ctx.document._id === "frostbit") return "Finner seg selv";
    const client = ctx.getClient({ apiVersion: "2024-01-01" });
    const taken = await client.fetch(guild.SAME_NAME_QUERY, guild.sameNameParams(name, ctx.document._id));
    return taken ? "Navnet er tatt" : true;
  })];
  const verdict = await task.judge(item(spriteRule, rejectPublishedSelf));
  assert.deepEqual(statuses(verdict), [true, true, true, true]);
  assert.ok(ids.has("drafts.frostbit"));
  assert.ok(ids.has("frostbit"));
  assert.match(verdict.error, /Publisert Frostbit lagres på nytt.*skal kunne publiseres/);
  assertUnsolved(verdict);
});

test("valueOfField coercion error points to custom's document context", async () => {
  const badSprite = rule => rule.custom(() => {
    if (rule.valueOfField("kind") === "material") return true;
    // Reproduce the reported loose-comparison coercion, not strict equality.
    return rule.valueOfField("kind") == "material";
  });
  const verdict = await task.judge(item(badSprite));
  assert.match(verdict.error, /context\.document\?\.kind/);
  assert.deepEqual(statuses(verdict).slice(2), [true, true]);
  assertUnsolved(verdict);
});

test("document-level rules remain supported", async () => {
  const validation = rule => rule.custom(async (doc, ctx) => {
    if (doc.kind === "weapon" && !doc.sprite) return "Sprite mangler";
    if (!doc.name) return "Navn mangler";
    const client = ctx.getClient({ apiVersion: "2024-01-01" });
    const taken = await client.fetch(guild.SAME_NAME_QUERY, guild.sameNameParams(doc.name, doc._id));
    return taken ? "Navnet er tatt" : true;
  });
  const verdict = await task.judge(item(null, null, { validation }));
  assert.deepEqual(statuses(verdict), [true, true, true, true]);
  assert.equal(verdict.done, true);
});

test("unrelated field errors cannot solve a task with otherwise correct rules", async () => {
  const config = item();
  config.item.fields[1].validation = rule => rule.custom(() => "Kind er feil");
  const verdict = await task.judge(config);
  assert.deepEqual(statuses(verdict), [true, true, true, true]);
  assert.match(verdict.error, /nektes fortsatt/);
  assertUnsolved(verdict);
});

test("correct field rules solve the task and render publish feedback", async () => {
  const verdict = await task.judge(item());
  assert.deepEqual(statuses(verdict), [true, true, true, true]);
  assert.equal(verdict.done, true);
  assert.equal(verdict.error, undefined);
  assert.ok(verdict.solvedAs);
  const html = renderToStaticMarkup(React.createElement(task.Result, { verdict }));
  assert.match(html, /Navnet er tatt/);
  assert.match(html, /Våpen trenger sprite/);
  assert.equal((html.match(/disabled=""/g) || []).length, 3);
});