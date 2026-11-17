import type { Modules } from "../runCode";
import type { Verdict, WindowTask } from "./types";

// The fake Studio operations record patch/publish in order; no Sanity writes.
type Call = { op: "patch" | "publish"; value?: unknown };
let calls: Call[] = [];
const modules: Modules = {
  sanity: {
    useDocumentOperation: () => ({
      patch: {
        execute: (value: unknown) => calls.push({ op: "patch", value }),
      },
      publish: { execute: () => calls.push({ op: "publish" }) },
    }),
  },
};

const starter = `import { useDocumentOperation } from "sanity"

// Brann trenger én action som stempler og publiserer et våpen.
export function ForgeAction(props) {
  const { patch, publish } = useDocumentOperation(props.id, props.type)
  return {
    label: "Smi",
    onHandle: () => {
      // Sett forgedAt til nå og publiser dokumentet.
    },
  }
}
`;

function result({ verdict }: { verdict: Verdict | null }) {
  return (
    <p>
      {verdict?.done
        ? "Ett trykk: smidd og publisert."
        : "Trykk Smi: hva skjer med våpenet?"}
    </p>
  );
}

export function judgeBakerForge(exports: Record<string, unknown>): Verdict {
  calls = [];
  const action = exports.ForgeAction;
  let label = "";
  let error: string | undefined;
  if (typeof action === "function") {
    try {
      const description = (
        action as (props: object) => { label: string; onHandle: () => void }
      )({ id: "test-weapon", type: "item", draft: { kind: "weapon" } });
      label = description?.label;
      description?.onHandle?.();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }
  const stamp = (
    calls[0]?.value as { set?: { forgedAt?: unknown } }[] | undefined
  )?.[0]?.set?.forgedAt;
  const timestamp = typeof stamp === "string" ? Date.parse(stamp) : NaN;
  const requirements = [
    { label: "En action som heter Smi", done: label === "Smi" },
    {
      label: "Sett forgedAt til nå",
      done:
        calls[0]?.op === "patch" &&
        Number.isFinite(timestamp) &&
        Math.abs(Date.now() - timestamp) < 60_000,
    },
    {
      label: "Publiser etter stemplingen",
      done: calls.length === 2 && calls[1]?.op === "publish",
    },
  ];
  return { done: requirements.every((r) => r.done), requirements, error };
}

export const bakerForgeTask: WindowTask = {
  id: "baker-forge",
  file: "ForgeAction.ts",
  starter,
  modules,
  judge: judgeBakerForge,
  resultTitle: "Ett trykk i Studio",
  Result: result,
  ours: `patch.execute([{ set: { forgedAt: new Date().toISOString() } }]);\npublish.execute();`,
  references: [],
  extend: {
    file: "src/sanity/studio/BakeryActions.ts",
    marker: "QUEST: Luke 10",
    idea: "Prøv Smi på et våpen i Studio.",
  },
};
