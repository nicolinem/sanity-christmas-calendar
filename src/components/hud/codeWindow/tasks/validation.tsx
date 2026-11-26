import type { ReactNode } from "react";
import guildSource from "@/sanity/lib/guild?raw";
import {
  isNameTaken,
  SAME_NAME_QUERY,
  sameNameParams,
} from "@/sanity/lib/guild";
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
import { isNameTaken } from "../lib/guild"

// Legg til validation: krev navn, stopp navn som allerede er brukt, og våpen uten sprite.
export const item = defineType({
  name: "item",
  title: "Gjenstand",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Navn", type: "string" }),
    defineField({ name: "kind", title: "Sort", type: "string" }),
    defineField({ name: "sprite", title: "Sprite", type: "string" }),
  ],
})
`;

const VALIDATION_MODULES: Modules = {
  sanity: { defineType: <T,>(x: T) => x, defineField: <T,>(x: T) => x },
  "../lib/guild": { isNameTaken, SAME_NAME_QUERY, sameNameParams },
};

const validationImportHelp: ImportHelp = (name) =>
  /guild/.test(name)
    ? "De ferdige hjelperne ligger i `../lib/guild`. Fanen `guild.ts` viser hva som finnes der."
    : undefined;

const VALIDATION_REFERENCES: Reference[] = [
  {
    file: "guild.ts",
    path: "src/sanity/lib/guild.ts",
    source: guildSource,
    about:
      "Hjelperne er ferdige, men validation-regelen skriver du selv. `isNameTaken(client, name, documentId)` gir `true` hvis en annen gjenstand bruker navnet. Den bruker `getPublishedId()` og `sanity::versionOf()` for å overse dokumentet selv, utkast og release-versjoner.",
    examples: [
      {
        code: 'isNameTaken(client, "Frostbit", "drafts.ny")',
        shows: "Nytt dokument med navnet Frostbit: `true`, navnet er opptatt. ",
      },
      {
        code: 'isNameTaken(client, "Rimøks", "drafts.ny")',
        shows: "Nytt dokument med navnet Rimøks: `false`, navnet er ledig. ",
      },
      {
        code: 'isNameTaken(client, "Frostbit", "drafts.frostbit")',
        shows:
          "Frostbit lagres på nytt: `false`. Hjelperen utelater dokumentet selv og utkastet dets. ",
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
      // The same answer the real query makes, ignoring every version of this document.
      answer: (params) =>
        DATASET.some(
          (d) => d.name === params.name && d._id !== params.published,
        ),
    },
  ],
  ["`SAME_NAME_QUERY`"],
);

// The documents the rules are tried on. `show` ones are drawn as forms; the
// others are only checked.
const CASES = {
  weaponNoSprite: {
    label: "Nytt våpen uten sprite",
    show: true,
    doc: { _id: "drafts.ny-1", name: "Nyhugger", kind: "weapon" },
  },
  materialNoSprite: {
    label: "Nytt materiale uten sprite",
    show: true,
    doc: { _id: "drafts.ny-2", name: "Kvartsstøv", kind: "material" },
  },
  takenName: {
    label: "Nytt våpen med et navn som er tatt",
    show: true,
    doc: {
      _id: "drafts.ny-3",
      name: "Frostbit",
      kind: "weapon",
      sprite: "sword",
    },
  },
  missingName: {
    label: "Nytt våpen uten navn",
    show: true,
    doc: { _id: "drafts.ny-8", name: "", kind: "weapon", sprite: "axe" },
  },
  takenName2: {
    label: "Et annet navn som er tatt",
    show: false,
    doc: {
      _id: "drafts.ny-4",
      name: "Istapp",
      kind: "weapon",
      sprite: "dagger",
    },
  },
  freshName: {
    label: "Nytt våpen med nytt navn",
    show: false,
    doc: { _id: "drafts.ny-5", name: "Rimøks", kind: "weapon", sprite: "axe" },
  },
  resave: {
    label: "Frostbit lagres på nytt",
    show: false,
    doc: {
      _id: "drafts.frostbit",
      name: "Frostbit",
      kind: "weapon",
      sprite: "sword",
    },
  },
  resavePublished: {
    label: "Publisert Frostbit lagres på nytt",
    show: false,
    doc: { _id: "frostbit", name: "Frostbit", kind: "weapon", sprite: "sword" },
  },
} satisfies Record<string, { label: string; show: boolean; doc: Doc }>;

type CaseId = keyof typeof CASES;

// --- running the player's rules ------------------------------------------------

type Message = { text: string; level: Level; crashed?: boolean };
type FieldView = {
  name: string;
  title: string;
  value: unknown;
  messages: Message[];
};
type Outcome = {
  label: string;
  fields: FieldView[];
  errors: number;
  warnings: number;
  crash?: string;
};

// A rule that never answers (a promise that never settles) shouldn't hang the window.
function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Regelen ble aldri ferdig.")),
      2000,
    );
  });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}

type FieldDef = { name?: unknown; title?: unknown; validation?: unknown };

async function validate(
  fields: FieldDef[],
  itemValidation: unknown,
  doc: Doc,
): Promise<Omit<Outcome, "label">> {
  const document: Record<string, unknown> = { ...doc, _type: "item" };
  const views: FieldView[] = [];
  let crash: string | undefined;
  const run = async (
    validation: unknown,
    value: unknown,
    path: string[],
    type: unknown,
  ): Promise<Message[]> => {
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
        const result = await withTimeout(
          Promise.resolve(rule.fn(value, context)),
        );
        for (const text of messagesOf(result, rule.message))
          messages.push({ text, level: rule.level });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        const text = /primitive|valueOfField/i.test(detail)
          ? `${detail}. Hvis du bruker rule.valueOfField(...) i en if: les context.document?.kind inne i custom((verdi, context) => …) i stedet.`
          : detail;
        crash ??= `Regelen på \`${path[0] ?? "item"}\` krasjet: ${text}`;
        messages.push({
          text: `Regelen krasjet: ${text}`,
          level: "error",
          crashed: true,
        });
      }
    }
    return messages;
  };
  for (const f of fields) {
    if (typeof f?.name !== "string") continue;
    const messages = await run(f.validation, document[f.name], [f.name], f);
    views.push({
      name: f.name,
      title: typeof f.title === "string" ? f.title : f.name,
      value: document[f.name],
      messages,
    });
  }
  const whole = await run(itemValidation, document, [], null);
  if (whole.length)
    views.push({
      name: "",
      title: "Hele dokumentet",
      value: undefined,
      messages: whole,
    });
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

async function judgeValidation(
  exports: Record<string, unknown>,
): Promise<Verdict<ValidationData>> {
  const item = exports.item as
    { fields?: FieldDef[]; validation?: unknown } | undefined;
  const fieldNames = Array.isArray(item?.fields)
    ? item.fields.map((f) => f?.name)
    : [];
  if (!item || typeof item !== "object" || !Array.isArray(item.fields)) {
    return {
      done: false,
      data: { forms: [] },
      requirements: [
        {
          label: "Fant `item`",
          done: false,
          message: "Behold `export const item = defineType({ … })`.",
        },
      ],
    };
  }
  if (!fieldNames.includes("name") || !fieldNames.includes("sprite")) {
    return {
      done: false,
      data: { forms: [] },
      requirements: [
        {
          label: "Fant `name` og `sprite`",
          done: false,
          message: "`item` må beholde *field*-ene `name` og `sprite`.",
        },
      ],
    };
  }

  const ids = Object.keys(CASES) as CaseId[];
  const outcomes = Object.fromEntries(
    await Promise.all(
      ids.map(
        async (id) =>
          [
            id,
            {
              label: CASES[id].label,
              ...(await validate(item.fields!, item.validation, CASES[id].doc)),
            },
          ] as const,
      ),
    ),
  ) as Record<CaseId, Outcome>;

  const crash = ids.map((id) => outcomes[id].crash).find(Boolean);
  // A crash or error on sprite must not stand in for a name rule (or vice
  // versa). Document-level validation still participates in both checks.
  const messagesFor = (id: CaseId, field: string) =>
    outcomes[id].fields
      .filter((view) => view.name === field || view.name === "")
      .flatMap((view) => view.messages);
  const crashFor = (id: CaseId, field: string) =>
    messagesFor(id, field).find((m) => m.crashed)?.text;
  // "Refused" means Publish would be grey: an error, not a warning, and not a crash.
  const refused = (id: CaseId, field: string) =>
    !crashFor(id, field) &&
    messagesFor(id, field).some((m) => m.level === "error");
  const allowed = (id: CaseId, field: string) =>
    !messagesFor(id, field).some((m) => m.level === "error");
  const onlyWarned = (id: CaseId, field: string) =>
    allowed(id, field) &&
    messagesFor(id, field).some((m) => m.level === "warning");
  const warnNote =
    "Regelen gir bare en `warning`, og en `warning` stopper ikke *Publish*.";

  const noSprite = refused("weaponNoSprite", "sprite");
  const missingName = refused("missingName", "name");
  const taken = refused("takenName", "name") && refused("takenName2", "name");
  const requirements: Requirement[] = [
    {
      label: "Et våpen uten `sprite` nektes",
      done: noSprite,
      message:
        crashFor("weaponNoSprite", "sprite") ??
        (onlyWarned("weaponNoSprite", "sprite")
          ? warnNote
          : "Legg `validation` på `sprite`: et våpen uten sprite skal få en feilmelding."),
    },
    {
      label: "Materialer uten `sprite` og våpen med `sprite` er greit",
      done:
        noSprite &&
        allowed("materialNoSprite", "sprite") &&
        allowed("freshName", "sprite") &&
        allowed("resave", "sprite"),
      message: !noSprite
        ? "Vurderes når et våpen uten sprite nektes."
        : (crashFor("materialNoSprite", "sprite") ??
          crashFor("freshName", "sprite") ??
          crashFor("resave", "sprite") ??
          (!allowed("materialNoSprite", "sprite")
            ? "Et materiale uten sprite nektes også. Det er bare våpen som må ha en."
            : "Et våpen som har sprite nektes også. Bare våpen uten sprite skal nektes av denne regelen.")),
    },
    {
      label: "Et våpen uten navn nektes",
      done: missingName,
      message:
        crashFor("missingName", "name") ??
        "Krev `name` med `rule.required()`, så kan ikke et tomt navn publiseres.",
    },
    {
      label: "Et navn som er tatt nektes",
      done: taken,
      message:
        crashFor("takenName", "name") ??
        crashFor("takenName2", "name") ??
        (onlyWarned("takenName", "name") || onlyWarned("takenName2", "name")
          ? warnNote
          : `Navnet «${refused("takenName", "name") ? CASES.takenName2.doc.name : CASES.takenName.doc.name}» er allerede tatt. Fullfør regelen på \`name\`: bruk verdien fra første parameter i \`custom((verdi, context) => ...)\` når du kaller \`isNameTaken(...)\`, og gi en feilmelding når svaret er \`true\`.`),
    },
  ];

  const requirementsDone = requirements.every((r) => r.done);
  const positiveNameCase = (
    ["freshName", "resave", "resavePublished"] as CaseId[]
  ).find((id) =>
    messagesFor(id, "name").some((message) => message.level === "error"),
  );
  const isExpectedError = (id: CaseId, field: string) =>
    (id === "weaponNoSprite" && (field === "sprite" || field === "")) ||
    (id === "missingName" && (field === "name" || field === "")) ||
    ((id === "takenName" || id === "takenName2") &&
      (field === "name" || field === ""));
  const unexpected = ids.find((id) =>
    outcomes[id].fields.some(
      (view) =>
        view.messages.some((message) => message.level === "error") &&
        !isExpectedError(id, view.name),
    ),
  );
  const error =
    crash ??
    (requirementsDone && positiveNameCase
      ? `«${CASES[positiveNameCase].label}» skal kunne publiseres. Sjekk at regelen godtar ledige navn og at dokumentet ikke finner seg selv.`
      : requirementsDone && unexpected
        ? `Eksempelet «${CASES[unexpected].label}» nektes fortsatt. Se feilmeldingen i skjemaet; dette dokumentet skal kunne publiseres.`
        : undefined);
  const done = requirementsDone && !error;
  const forms = ids.filter((id) => CASES[id].show).map((id) => outcomes[id]);
  return {
    requirements,
    done,
    error,
    data: { forms },
    solvedAs: done ? {} : undefined,
  };
}

// The code the Studio switches on, shown once the task is solved, so the
// player can compare. Kept in step with src/sanity/schemaTypes/item.tsx.
const VALIDATION_OURS = `// på name:
validation: (rule) => [
  rule.required(),
  rule.custom(async (name, context) => {
    const { document, getClient } = context
    if (!name || !document) return true
    const client = getClient({ apiVersion: "2026-09-03" })
    const taken = await isNameTaken(client, name, document._id)
    return taken ? \`Det finnes allerede en gjenstand som heter «\${name}»\` : true
  }),
],

// på sprite:
validation: (rule) =>
  rule.custom((sprite, context) =>
    context.document?.kind === "weapon" && !sprite ? "Et våpen trenger en sprite" : true,
  ),`;

const VALIDATION_SOLUTION = `import { defineField, defineType } from "sanity"
import { isNameTaken } from "../lib/guild"

export const item = defineType({
  name: "item",
  title: "Gjenstand",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Navn",
      type: "string",
      validation: (rule) => [
        rule.required(),
        rule.custom(async (name, context) => {
          const { document, getClient } = context
          if (!name || !document) return true
          const client = getClient({ apiVersion: "2026-09-03" })
          const taken = await isNameTaken(client, name, document._id)
          return taken ? \`Det finnes allerede en gjenstand som heter «\${name}»\` : true
        }),
      ],
    }),
    defineField({ name: "kind", title: "Sort", type: "string" }),
    defineField({
      name: "sprite",
      title: "Sprite",
      type: "string",
      validation: (rule) =>
        rule.custom((sprite, context) =>
          context.document?.kind === "weapon" && !sprite ? "Et våpen trenger en sprite" : true,
        ),
    }),
  ],
})
`;

// --- the result panel ------------------------------------------------------------

const show = (v: unknown): ReactNode =>
  typeof v === "string" || typeof v === "number" ? v : <em>tom</em>;

// Each example document as a small Studio form: the errors the player's rules
// give, under the field they belong to, and a Publish button that goes grey.
function StudioForms({ verdict }: { verdict: Verdict | null }) {
  const forms = (verdict?.data as ValidationData | undefined)?.forms ?? [];
  return (
    <div className="cw-forms">
      {forms.length === 0 && (
        <p className="cw-studio cw-studio-empty">Ingen skjemaer å vise ennå.</p>
      )}
      {forms.map((form) => (
        <div
          key={form.label}
          className="cw-studio cw-form"
          role="group"
          aria-label={form.label}
        >
          <div className="cw-form-head">
            <span className="cw-form-title">{form.label}</span>
            <button
              type="button"
              className="cw-publish"
              disabled={form.errors > 0}
            >
              Publish
            </button>
          </div>
          {form.fields.map((field) => (
            <div key={field.name || "doc"} className="cw-field">
              <span className="cw-field-label">{field.title}</span>
              {field.name && (
                <span className="cw-field-value">{show(field.value)}</span>
              )}
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
  solution: VALIDATION_SOLUTION,
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
