import type { Modules } from "../runCode";
import type { Verdict, WindowTask } from "./types";

// Shaped like a real Sanity Function (documentEventHandler, event.data, a
// client from context.clientOptions), but the game plays Sanity: the client
// only knows the sign in the village. Which changes run the function is the
// blueprint's job, shown read-only beside the code.

const starter = `import { documentEventHandler } from "@sanity/functions"
import { createClient } from "@sanity/client"

// Kjører når en bestilling publiseres (se sanity.blueprint.ts).
// I spillet skriver client til bodskiltet i bygda, ikke til Sanity-prosjektet ditt.
export const handler = documentEventHandler(async ({ context, event }) => {
  const order = event.data
  const client = createClient({ ...context.clientOptions, apiVersion: "2025-05-08" })
  // Sjekk at bestillingen har en vare.

  const text = "Dagens bestilling: " + order.item.trim()
  const sign = await client.getDocument("bakery-sign")
  // Ikke skriv hvis skiltet allerede viser denne teksten.

  await client.patch("bakery-sign").set({
    text: [{
      _type: "block", _key: "order", style: "normal", markDefs: [],
      children: [{ _type: "span", _key: "order-text", text, marks: [] }],
    }],
  }).commit()
})
`;

const blueprint = `import { defineBlueprint, defineDocumentFunction } from "@sanity/blueprints"

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: "bakery-sign",
      event: {
        on: ["create", "update"],
        filter: '_type == "bakeryOrder"',
        projection: "{_id, _type, item}",
      },
    }),
  ],
})
`;

// The game hands its own client through clientOptions, so the player's
// createClient(...) gets it back. A real Function gets project, dataset and
// token there instead.
const modules: Modules = {
  "@sanity/functions": {
    documentEventHandler: (fn: unknown) => fn,
  },
  "@sanity/client": {
    createClient: (options: { gameClient?: unknown }) => options?.gameClient,
  },
};

export type FunctionArgs = {
  context: { clientOptions: { gameClient: unknown } };
  event: { data: { _type: string; item?: string } };
};
type Sign = { text: { children: { text: string }[] }[] };

async function exercise(
  fn: (args: FunctionArgs) => unknown,
  orders: FunctionArgs["event"]["data"][],
) {
  let text = "Bakerens bod";
  let writes = 0;
  const client = {
    getDocument: async () => ({ text: [{ children: [{ text }] }] }),
    patch: (id: string) => ({
      set: (value: Sign) => ({
        commit: async () => {
          if (id !== "bakery-sign" || !Array.isArray(value?.text))
            throw new Error("Oppdater bodskiltet med Portable Text.");
          const block = value.text[0] as Sign["text"][number] & {
            _type?: string;
          };
          if (
            block?._type !== "block" ||
            typeof block.children?.[0]?.text !== "string"
          )
            throw new Error("Skiltet trenger en tekstblokk med et tekstspenn.");
          text = block.children[0].text;
          writes++;
        },
      }),
    }),
  };
  for (const data of orders)
    await fn({
      context: { clientOptions: { gameClient: client } },
      event: { data },
    });
  return { text, writes };
}

const order = { _type: "bakeryOrder", item: "Julekake" };

export async function judgeBakerFunction(
  exports: Record<string, unknown>,
): Promise<Verdict> {
  const fn = exports.handler;
  let updated = false;
  let ignoresEmpty = false;
  let idempotent = false;
  let error: string | undefined;
  if (typeof fn === "function") {
    try {
      const handler = fn as (args: FunctionArgs) => unknown;
      const first = await exercise(handler, [order]);
      updated =
        first.text === "Dagens bestilling: Julekake" && first.writes === 1;
      const empty = await exercise(handler, [
        { _type: "bakeryOrder" },
        { _type: "bakeryOrder", item: "  " },
      ]);
      ignoresEmpty = empty.writes === 0;
      const repeated = await exercise(handler, [order, order]);
      idempotent =
        repeated.text === "Dagens bestilling: Julekake" &&
        repeated.writes === 1;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }
  const requirements = [
    {
      label: "Oppdater bodskiltet når en bestilling publiseres",
      done: updated,
    },
    { label: "Ignorer bestillinger uten vare", done: ignoresEmpty },
    { label: "Ikke oppdater samme skilt to ganger", done: idempotent },
  ];
  const done = requirements.every((r) => r.done);
  return { done, requirements, error, solvedAs: done ? {} : undefined };
}

function Result({ verdict }: { verdict: Verdict | null }) {
  return (
    <p>
      {verdict?.done
        ? "Bestått. Publiser en bestilling i Studio og se på bodskiltet."
        : "Når skal skiltet endres, og når skal det stå i fred?"}
    </p>
  );
}

export const bakerFunctionTask: WindowTask = {
  id: "baker-function",
  file: "functions/bakery-sign/index.ts",
  starter,
  solution: starter
    .replace(
      "  // Sjekk at bestillingen har en vare.\n",
      "  if (!order?.item?.trim()) return\n",
    )
    .replace(
      "  // Ikke skriv hvis skiltet allerede viser denne teksten.\n",
      "  if (sign?.text?.[0]?.children?.[0]?.text === text) return\n",
    ),
  modules,
  judge: judgeBakerFunction,
  resultTitle: "Sanity Function",
  Result,
  ours: `if (!order?.item?.trim()) return;
// Etter getDocument:
if (sign?.text?.[0]?.children?.[0]?.text === text) return;`,
  references: [
    {
      file: "sanity.blueprint.ts",
      source: blueprint,
      about:
        "Blueprinten sier når funksjonen kjører. Den er ferdig: bare publiserte bestillinger kommer til koden din.",
      examples: [
        {
          code: 'on: ["create", "update"]',
          shows:
            "Når en bestilling publiseres første gang, og hver gang den publiseres igjen",
        },
        {
          code: "filter: '_type == \"bakeryOrder\"'",
          shows: "Bare bestillinger, ikke våpen eller skilt",
        },
      ],
    },
  ],
  studioCode: false,
};
