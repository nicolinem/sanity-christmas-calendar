import type { Modules } from "../runCode";
import bakeryDateSource from "@/sanity/lib/bakeryDate?raw";
import type { Verdict, WindowTask } from "./types";

// The fake clock makes the second new order a different day. The learner's
// schema runs here; the real Studio switches to our own safe implementation.
let clock = "2026-12-14";
const modules: Modules = {
  sanity: { defineType: <T,>(value: T) => value },
  "./bakeryDate": { bakeryToday: () => clock },
};

const starter = `import { defineType } from "sanity"
import { bakeryToday } from "./bakeryDate"

// Bakeren trenger status «ny» og dagens dato på hver NY bestilling.
export const bakeryOrder = defineType({
  name: "bakeryOrder",
  type: "document",
  initialValue: () => ({
    // Bruk bakeryToday() for datoen, ikke en fast dato.
  }),
})
`;

type InitialValue = { status?: unknown; date?: unknown };

export function judgeBakerTemplate(exports: Record<string, unknown>): Verdict {
  const schema = exports.bakeryOrder as
    { name?: unknown; initialValue?: unknown } | undefined;
  const create = schema?.initialValue;
  let first: InitialValue = {};
  let second: InitialValue = {};
  let error: string | undefined;
  if (typeof create === "function") {
    try {
      clock = "2026-12-14";
      first = (create as () => InitialValue)() ?? {};
      clock = "2026-12-15";
      second = (create as () => InitialValue)() ?? {};
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      clock = "2026-12-14";
    }
  }
  const requirements = [
    {
      label: "En initialValue for bakeryOrder",
      done: schema?.name === "bakeryOrder" && typeof create === "function",
    },
    {
      label: "Nye bestillinger starter som «ny»",
      done: first.status === "ny" && second.status === "ny",
    },
    {
      label: "Datoen hentes når bestillingen opprettes",
      done: first.date === "2026-12-14" && second.date === "2026-12-15",
    },
  ];
  return {
    done: requirements.every((r) => r.done),
    requirements,
    error,
    data: { status: first.status, date: first.date },
  };
}

function Result({ verdict }: { verdict: Verdict | null }) {
  const value = verdict?.data as InitialValue | undefined;
  return (
    <div className="cw-groq-result">
      <p>Ny bestilling</p>
      <p>Status: {typeof value?.status === "string" ? value.status : "—"}</p>
      <p>Dato: {typeof value?.date === "string" ? value.date : "—"}</p>
    </div>
  );
}

export const bakerTemplateTask: WindowTask = {
  id: "baker-template",
  file: "bakeryOrder.ts",
  starter,
  solution: starter.replace(
    "    // Bruk bakeryToday() for datoen, ikke en fast dato.",
    '    status: "ny",\n    date: bakeryToday(),',
  ),
  modules,
  judge: judgeBakerTemplate,
  resultTitle: "En ny bestilling i Studio",
  Result,
  ours: `initialValue: () => ({ status: "ny", date: bakeryToday() })`,
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
    file: "src/sanity/schemaTypes/bakeryOrder.ts",
    marker: "QUEST: Luke 9",
    idea: "Prøv å åpne en ny bestilling i Studio etter at du har løst luka.",
  },
};
