import type { Verdict, WindowTask } from "./types";

const starter = `// Simulering: event og client kommer fra kodevinduet, ikke ditt Sanity-prosjekt.
export async function onOrderPublished(event, { client }) {
  const order = event.document
  // Sjekk at dette er en publisert bakeryOrder med en vare.

  const text = "Dagens bestilling: " + order.item.trim()
  const sign = await client.getDocument("bakery-sign")
  // Ikke skriv hvis skiltet allerede viser denne teksten.

  await client.patch("bakery-sign").set({
    text: [{
      _type: "block", _key: "order", style: "normal", markDefs: [],
      children: [{ _type: "span", _key: "order-text", text, marks: [] }],
    }],
  }).commit()
}
`;

type Event = { transition: string; document: { _type: string; item?: string } };
type Sign = { text: { children: { text: string }[] }[] };

async function exercise(
  fn: (event: Event, context: object) => unknown,
  events: Event[],
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
  for (const event of events) await fn(event, { client });
  return { text, writes };
}

const order: Event = {
  transition: "publish",
  document: { _type: "bakeryOrder", item: "Julekake" },
};

export async function judgeBakerFunction(
  exports: Record<string, unknown>,
): Promise<Verdict> {
  const fn = exports.onOrderPublished;
  let updated = false;
  let ignoresOthers = false;
  let idempotent = false;
  let error: string | undefined;
  if (typeof fn === "function") {
    try {
      const handler = fn as (event: Event, context: object) => unknown;
      const first = await exercise(handler, [order]);
      updated =
        first.text === "Dagens bestilling: Julekake" && first.writes === 1;
      const unrelated = await exercise(handler, [
        {
          transition: "update",
          document: { _type: "bakeryOrder", item: "Julekake" },
        },
        { transition: "publish", document: { _type: "item", item: "Sverd" } },
        { transition: "publish", document: { _type: "bakeryOrder" } },
      ]);
      ignoresOthers = unrelated.writes === 0;
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
    {
      label: "Ignorer andre hendelser og tomme bestillinger",
      done: ignoresOthers,
    },
    { label: "Ikke oppdater samme skilt to ganger", done: idempotent },
  ];
  return { done: requirements.every((r) => r.done), requirements, error };
}

function Result({ verdict }: { verdict: Verdict | null }) {
  return (
    <p>
      {verdict?.done
        ? "Publisert bestilling oppdaterte skiltet én gang – i simuleringen."
        : "Hvilke hendelser skal endre skiltet?"}
    </p>
  );
}

export const bakerFunctionTask: WindowTask = {
  id: "baker-function",
  file: "onOrderPublished.ts",
  starter,
  solution: starter
    .replace(
      "  // Sjekk at dette er en publisert bakeryOrder med en vare.\n",
      '  if (event.transition !== "publish" || order?._type !== "bakeryOrder" || !order.item?.trim()) return\n',
    )
    .replace(
      "  // Ikke skriv hvis skiltet allerede viser denne teksten.\n",
      "  if (sign?.text?.[0]?.children?.[0]?.text === text) return\n",
    ),
  modules: {},
  judge: judgeBakerFunction,
  resultTitle: "Simulert Sanity Function",
  Result,
  ours: `if (event.transition !== "publish" || order?._type !== "bakeryOrder" || !order.item?.trim()) return;
// Etter getDocument:
if (sign?.text?.[0]?.children?.[0]?.text === text) return;`,
  references: [],
  studioCode: false,
};
