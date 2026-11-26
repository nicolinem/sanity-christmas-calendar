import type { Modules } from "../runCode";
import bakeryDateSource from "@/sanity/lib/bakeryDate?raw";
import { BAKERY_CUSTOMERS } from "@/sanity/lib/bakeryTemplates";
import type { Verdict, WindowTask } from "./types";

// The fake clock makes the second new order a different day. The learner's
// templates run here; the real Studio switches to our own safe version.
let clock = "2026-12-14";
const modules: Modules = {
  "./bakeryDate": { bakeryToday: () => clock },
};

const starter = `import { bakeryToday } from "./bakeryDate"

// Bakerens faste kunder, og det de alltid bestiller.
const CUSTOMERS = [
  { name: "Brann", item: "Lussekatter" },
  { name: "Arkivaren", item: "Pepperkaker" },
  { name: "Kari", item: "Julekake" },
]

// Studio kaller denne med malene som finnes fra før, som «Bestilling».
export function templates(previous) {
  return [
    ...previous,
    // Én mal per kunde: «Bestilling fra Brann» med vare, kunde,
    // status «ny» og dagens dato.
  ]
}
`;

type Template = {
  id?: unknown;
  title?: unknown;
  schemaType?: unknown;
  value?: unknown;
};
type Order = {
  item?: unknown;
  orderedBy?: unknown;
  status?: unknown;
  date?: unknown;
};

const DEFAULT: Template = {
  id: "bakeryOrder",
  title: "Bestilling",
  schemaType: "bakeryOrder",
};

// A template's value is an object or a function Studio calls when the order
// is created.
function valueOf(template: Template): Order {
  const value = template.value;
  return ((typeof value === "function" ? value() : value) ?? {}) as Order;
}

export function judgeBakerTemplate(exports: Record<string, unknown>): Verdict {
  const make = exports.templates;
  let list: Template[] = [];
  let first: Order[] = [];
  let second: Order[] = [];
  let error: string | undefined;
  if (typeof make === "function") {
    try {
      const result = (make as (previous: Template[]) => unknown)([DEFAULT]);
      list = Array.isArray(result) ? (result as Template[]) : [];
      const orders = list.filter(
        (t) => t && t.schemaType === "bakeryOrder" && t !== DEFAULT,
      );
      clock = "2026-12-14";
      first = orders.map(valueOf);
      clock = "2026-12-15";
      second = orders.map(valueOf);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      clock = "2026-12-14";
    }
  }
  const forCustomer = (orders: Order[], name: string) =>
    orders.find((order) => order.orderedBy === name);
  const everyCustomer = (test: (order: Order, item: string) => boolean) =>
    BAKERY_CUSTOMERS.every(({ name, item }) => {
      const order = forCustomer(first, name);
      return Boolean(order && test(order, item));
    });
  const titled = BAKERY_CUSTOMERS.every(({ name }) =>
    list.some(
      (t) =>
        t?.schemaType === "bakeryOrder" &&
        typeof t.title === "string" &&
        t.title.includes(name) &&
        typeof t.id === "string" &&
        t.id !== DEFAULT.id,
    ),
  );
  const requirements = [
    {
      label: "«Bestilling» er fortsatt med",
      done: list.includes(DEFAULT),
    },
    {
      label: "En mal for hver kunde, med navnet i tittelen",
      done: titled,
    },
    {
      label: "Malen fyller inn kunden og varen deres",
      done: everyCustomer((order, item) => order.item === item),
    },
    {
      label: "Status «ny» og datoen fra når bestillingen lages",
      done:
        everyCustomer((order) => order.status === "ny") &&
        BAKERY_CUSTOMERS.every(
          ({ name }) =>
            forCustomer(first, name)?.date === "2026-12-14" &&
            forCustomer(second, name)?.date === "2026-12-15",
        ),
    },
  ];
  const done = requirements.every((r) => r.done);
  return {
    done,
    requirements,
    error,
    solvedAs: done ? {} : undefined,
    data: { titles: list.map((t) => t?.title), orders: first },
  };
}

function Result({ verdict }: { verdict: Verdict | null }) {
  const data = verdict?.data as
    { titles?: unknown[]; orders?: Order[] } | undefined;
  const titles = (data?.titles ?? []).filter(
    (title): title is string => typeof title === "string",
  );
  return (
    <div className="cw-groq-result">
      <p>Ny … i Studio</p>
      {titles.length ? (
        titles.map((title) => <p key={title}>+ {title}</p>)
      ) : (
        <p>Ingen maler ennå</p>
      )}
    </div>
  );
}

export const bakerTemplateTask: WindowTask = {
  id: "baker-template",
  file: "bakeryTemplates.ts",
  starter,
  solution: starter.replace(
    `    // Én mal per kunde: «Bestilling fra Brann» med vare, kunde,
    // status «ny» og dagens dato.
`,
    `    ...CUSTOMERS.map((customer) => ({
      id: "order-" + customer.name,
      title: "Bestilling fra " + customer.name,
      schemaType: "bakeryOrder",
      value: () => ({
        item: customer.item,
        orderedBy: customer.name,
        status: "ny",
        date: bakeryToday(),
      }),
    })),
`,
  ),
  modules,
  judge: judgeBakerTemplate,
  resultTitle: "Når du trykker + i Studio",
  Result,
  ours: `CUSTOMERS.map((c) => ({
  id: "order-" + c.name, title: "Bestilling fra " + c.name, schemaType: "bakeryOrder",
  value: () => ({ item: c.item, orderedBy: c.name, status: "ny", date: bakeryToday() }),
}))`,
  references: [
    {
      file: "bakeryDate.ts",
      path: "src/sanity/lib/bakeryDate.ts",
      source: bakeryDateSource,
      about:
        "bakeryToday() gir dagens dato som YYYY-MM-DD. Bruk den når en ny bestilling lages.",
      examples: [{ code: "bakeryToday()", shows: "2026-12-14 (eksempel)" }],
    },
  ],
  extend: {
    file: "src/sanity/lib/bakeryTemplates.ts",
    marker: "QUEST: Luke 9",
    idea: "Trykk + i Studio etter at du har løst luka, og velg «Bestilling fra Kari».",
  },
};
