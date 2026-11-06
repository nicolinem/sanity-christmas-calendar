import type { ReactNode } from "react";
import guildSource from "@/sanity/lib/guild?raw";
import { SAME_NAME_QUERY, sameNameParams } from "@/sanity/lib/guild";
import { createFakeGetClient } from "../fakeClient";
import { messagesOf, recordRules, type Level } from "../recordRules";
import { renderText } from "../../richText";
import type { ImportHelp, Modules } from "../runCode";
import type { Reference, Requirement, Verdict, WindowTask } from "./types";

// Luke 3 in the code window: validation rules for `item`. The player's rules
// are run on example documents the way the Studio would, with a fake
// `context.getClient()` that answers from example documents. When every
// requirement holds, the Studio switches on our own version
// (src/sanity/schemaTypes/item.tsx, gated by isSolved("the-guilds-law")).

const VALIDATION_STARTER = `import { defineField, defineType } from "sanity"
import { SAME_NAME_QUERY, sameNameParams } from "../lib/guild"

// I dag lar Studio deg publisere hva som helst. Skriv to regler:
//  - et våpen (kind "weapon") må ha en sprite. Andre gjenstander trenger ingen.
//  - ingen to gjenstander kan hete det samme.
export const item = defineType({
  name: "item",
  title: "Item",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string" }),
    defineField({ name: "kind", title: "Kind", type: "string" }),
    defineField({ name: "sprite", title: "Sprite", type: "string" }),
  ],
})
`;

const VALIDATION_MODULES: Modules = {
  sanity: { defineType: <T,>(x: T) => x, defineField: <T,>(x: T) => x },
  "../lib/guild": { SAME_NAME_QUERY, sameNameParams },
};

const validationImportHelp: ImportHelp = (name) =>
  /guild/.test(name) ? "De ferdige hjelperne ligger i `../lib/guild`. Fanen `guild.ts` viser hva som finnes der." : undefined;

const VALIDATION_REFERENCES: Reference[] = [
  {
    file: "guild.ts",
    path: "src/sanity/lib/guild.ts",
    source: guildSource,
    about:
      "Den ferdige *GROQ*-en for å finne gjenstander med samme navn, og hjelperen som lager parametrene til den. Begge er allerede importert øverst i koden din. Gi dem til `client.fetch(…)`.",
    examples: [
      { code: "SAME_NAME_QUERY", shows: "Teller andre gjenstander med samme navn. " },
      {
        code: 'sameNameParams("Frostbit", "drafts.abc")',
        shows: `Gir ${JSON.stringify(sameNameParams("Frostbit", "drafts.abc"))}: `,
      },
    ],
  },
];

// --- the example dataset and documents ----------------------------------------

type Doc = { _id: string; name: string; kind: string; sprite?: string };

// What the fake client "has published".
const DATASET: Doc[] = [
  { _id: "frostbit", name: "Frostbit", kind: "weapon", sprite: "sword" },
  { _id: "vedkloyver", name: "Vedkløyver", kind: "weapon", sprite: "axe" },
  { _id: "istapp", name: "Istapp", kind: "weapon", sprite: "dagger" },
  { _id: "jernmalm", name: "Jernmalm", kind: "material" },
];

const getClient = createFakeGetClient(
  [
    {
      query: SAME_NAME_QUERY,
      // The same count the real query makes: same name, but not this document or its draft.
      answer: (params) => DATASET.filter((d) => d.name === params.name && ![params.id, params.draftId].includes(d._id)).length,
    },
  ],
  ["`SAME_NAME_QUERY`"],
);

// The documents the rules are tried on. `show` ones are drawn as forms; the
// others are only checked.
const CASES = {
  weaponNoSprite: { label: "Nytt våpen uten sprite", show: true, doc: { _id: "drafts.ny-1", name: "Nyhugger", kind: "weapon" } },
  materialNoSprite: { label: "Nytt materiale uten sprite", show: true, doc: { _id: "drafts.ny-2", name: "Kvartsstøv", kind: "material" } },
  takenName: { label: "Nytt våpen med et navn som er tatt", show: true, doc: { _id: "drafts.ny-3", name: "Frostbit", kind: "weapon", sprite: "sword" } },
  takenName2: { label: "Et annet navn som er tatt", show: false, doc: { _id: "drafts.ny-4", name: "Istapp", kind: "weapon", sprite: "dagger" } },
  freshName: { label: "Nytt våpen med nytt navn", show: false, doc: { _id: "drafts.ny-5", name: "Rimøks", kind: "weapon", sprite: "axe" } },
  resave: { label: "Frostbit lagres på nytt", show: false, doc: { _id: "drafts.frostbit", name: "Frostbit", kind: "weapon", sprite: "sword" } },
} satisfies Record<string, { label: string; show: boolean; doc: Doc }>;

type CaseId = keyof typeof CASES;

// --- running the player's rules ------------------------------------------------

type Message = { text: string; level: Level; crashed?: boolean };
type FieldView = { name: string; title: string; value: unknown; messages: Message[] };
type Outcome = { label: string; fields: FieldView[]; errors: number; warnings: number; crash?: string };

// A rule that never answers (a promise that never settles) shouldn't hang the window.
function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Regelen ble aldri ferdig.")), 2000);
  });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}

type FieldDef = { name?: unknown; title?: unknown; validation?: unknown };

async function validate(fields: FieldDef[], itemValidation: unknown, doc: Doc): Promise<Omit<Outcome, "label">> {
  const document: Record<string, unknown> = { ...doc, _type: "item" };
  const views: FieldView[] = [];
  let crash: string | undefined;
  const run = async (validation: unknown, value: unknown, path: string[], type: unknown): Promise<Message[]> => {
    const context = {
      document,
      parent: document,
      path,
      type,
      getClient,
      i18n: { t: (key: string) => key },
      environment: "studio",
    };
    const messages: Message[] = [];
    for (const rule of recordRules(validation)) {
      try {
        const result = await withTimeout(Promise.resolve(rule.fn(value, context)));
        for (const text of messagesOf(result, rule.message)) messages.push({ text, level: rule.level });
      } catch (err) {
        const text = err instanceof Error ? err.message : String(err);
        crash ??= `Regelen på \`${path[0] ?? "item"}\` krasjet: ${text}`;
        messages.push({ text: `Regelen krasjet: ${text}`, level: "error", crashed: true });
      }
    }
    return messages;
  };
  for (const f of fields) {
    if (typeof f?.name !== "string") continue;
    const messages = await run(f.validation, document[f.name], [f.name], f);
    views.push({ name: f.name, title: typeof f.title === "string" ? f.title : f.name, value: document[f.name], messages });
  }
  const whole = await run(itemValidation, document, [], null);
  if (whole.length) views.push({ name: "", title: "Hele dokumentet", value: undefined, messages: whole });
  const all = views.flatMap((v) => v.messages);
  return {
    fields: views,
    errors: all.filter((m) => m.level === "error").length,
    warnings: all.filter((m) => m.level === "warning").length,
    crash,
  };
}

// What this task keeps in `Verdict.data`: the forms the Studio would draw.
type ValidationData = { forms: Outcome[] };

async function judgeValidation(exports: Record<string, unknown>): Promise<Verdict<ValidationData>> {
  const item = exports.item as { fields?: FieldDef[]; validation?: unknown } | undefined;
  const fieldNames = Array.isArray(item?.fields) ? item.fields.map((f) => f?.name) : [];
  if (!item || typeof item !== "object" || !Array.isArray(item.fields)) {
    return {
      done: false,
      data: { forms: [] },
      requirements: [{ label: "Fant `item`", done: false, message: "Behold `export const item = defineType({ … })`." }],
    };
  }
  if (!fieldNames.includes("name") || !fieldNames.includes("sprite")) {
    return {
      done: false,
      data: { forms: [] },
      requirements: [{ label: "Fant `name` og `sprite`", done: false, message: "`item` må beholde *field*-ene `name` og `sprite`." }],
    };
  }

  const ids = Object.keys(CASES) as CaseId[];
  const outcomes = Object.fromEntries(
    await Promise.all(
      ids.map(async (id) => [id, { label: CASES[id].label, ...(await validate(item.fields!, item.validation, CASES[id].doc)) }] as const),
    ),
  ) as Record<CaseId, Outcome>;

  const crash = ids.map((id) => outcomes[id].crash).find(Boolean);
  // "Refused" means Publish would be grey: an error, not a warning, and not a crash.
  const refused = (id: CaseId) => !outcomes[id].crash && outcomes[id].errors > 0;
  const allowed = (id: CaseId) => !outcomes[id].crash && outcomes[id].errors === 0;
  const onlyWarned = (id: CaseId) => outcomes[id].errors === 0 && outcomes[id].warnings > 0;
  const warnNote = "Regelen gir bare en `warning`, og en `warning` stopper ikke *Publish*.";

  const noSprite = refused("weaponNoSprite");
  const taken = refused("takenName") && refused("takenName2");
  const requirements: Requirement[] = [
    {
      label: "Et våpen uten `sprite` nektes",
      done: noSprite,
      message: crash ?? (onlyWarned("weaponNoSprite") ? warnNote : "Studio lar deg fortsatt publisere et våpen uten sprite."),
    },
    {
      label: "Et materiale uten `sprite` er greit",
      done: noSprite && allowed("materialNoSprite"),
      message: !noSprite
        ? "Sjekkes når et våpen uten sprite nektes."
        : (crash ?? "Et materiale uten sprite nektes også. Det er bare våpen som må ha en."),
    },
    {
      label: "Et navn som er tatt nektes",
      done: taken,
      message:
        crash ??
        (onlyWarned("takenName") || onlyWarned("takenName2")
          ? warnNote
          : `Studio lar deg fortsatt publisere en gjenstand som heter «${refused("takenName") ? CASES.takenName2.doc.name : CASES.takenName.doc.name}», og det navnet er allerede tatt.`),
    },
    {
      label: "Et nytt navn er greit, også for et våpen som lagres på nytt",
      done: taken && allowed("freshName") && allowed("resave"),
      message: !taken
        ? "Sjekkes når navn som er tatt nektes."
        : (crash ??
          (allowed("freshName")
            ? "Å lagre «Frostbit» på nytt nektes: Studio ser det som en tvilling av seg selv. Se i `guild.ts`."
            : "Et helt nytt navn nektes også.")),
    },
  ];

  const done = requirements.every((r) => r.done);
  const forms = ids.filter((id) => CASES[id].show).map((id) => outcomes[id]);
  return { requirements, done, data: { forms }, solvedAs: done ? {} : undefined };
}

// The code the Studio switches on, shown once the task is solved, so the
// player can compare. Kept in step with src/sanity/schemaTypes/item.tsx.
const VALIDATION_OURS = `// på name:
validation: (rule) => [
  rule.required(),
  rule.custom(async (name, context) => {
    if (!name) return true
    const client = context.getClient({ apiVersion: "2024-01-01" })
    const id = context.document?._id ?? ""
    const others = await client.fetch(SAME_NAME_QUERY, sameNameParams(name, id))
    return others === 0 ? true : \`Another item is already called "\${name}"\`
  }),
],

// på sprite:
validation: (rule) =>
  rule.custom((sprite, context) =>
    context.document?.kind === "weapon" && !sprite ? "A weapon needs a sprite" : true,
  ),`;

// --- the result panel ------------------------------------------------------------

const show = (v: unknown): ReactNode => (typeof v === "string" || typeof v === "number" ? v : <em>tom</em>);

// Each example document as a small Studio form: the errors the player's rules
// give, under the field they belong to, and a Publish button that goes grey.
function StudioForms({ verdict }: { verdict: Verdict | null }) {
  const forms = (verdict?.data as ValidationData | undefined)?.forms ?? [];
  return (
    <div className="cw-forms">
      {forms.length === 0 && <p className="cw-studio cw-studio-empty">Ingen skjemaer å vise ennå.</p>}
      {forms.map((form) => (
        <div key={form.label} className="cw-studio cw-form" role="group" aria-label={form.label}>
          <div className="cw-form-head">
            <span className="cw-form-title">{form.label}</span>
            <button type="button" className="cw-publish" disabled={form.errors > 0}>
              Publish
            </button>
          </div>
          {form.fields.map((field) => (
            <div key={field.name || "doc"} className="cw-field">
              <span className="cw-field-label">{field.title}</span>
              {field.name && <span className="cw-field-value">{show(field.value)}</span>}
              {field.messages.map((m, i) => (
                <p key={i} className={`cw-field-msg is-${m.level}`}>
                  {/* The player's own messages are plain text; ours (a crash) use the `code` marks. */}
                  {m.crashed ? renderText(m.text) : m.text}
                </p>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export const validationTask: WindowTask = {
  id: "the-guilds-law",
  file: "item.tsx",
  starter: VALIDATION_STARTER,
  modules: VALIDATION_MODULES,
  importHelp: validationImportHelp,
  judge: judgeValidation,
  resultTitle: "Slik blir skjemaet i Studio",
  Result: StudioForms,
  ours: VALIDATION_OURS,
  references: VALIDATION_REFERENCES,
  extend: {
    file: "src/sanity/schemaTypes/item.tsx",
    marker: "QUEST: Luke 3",
    idea: "Legg til en regel på `description` som gir en `warning`, ikke en `error`, når beskrivelsen er tom. Da kan man fortsatt publisere, men Studio minner deg på det.",
  },
};
