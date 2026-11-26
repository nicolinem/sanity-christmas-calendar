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
  const doc = props.draft ?? props.published
  return {
    label: "Smi",
    // Bare våpen kan smis: gjør knappen grå for alt annet.
    onHandle: () => {
      // Sett forgedAt til nå og publiser dokumentet.
      props.onComplete()
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

type ActionDescription = {
  label: string;
  disabled?: boolean;
  onHandle: () => void;
};

export function judgeBakerForge(exports: Record<string, unknown>): Verdict {
  calls = [];
  const action = exports.ForgeAction;
  let label = "";
  let weaponOpen = false;
  let othersGrey = false;
  let error: string | undefined;
  if (typeof action === "function") {
    try {
      const run = (doc: object, published = false) =>
        (action as (props: object) => ActionDescription)({
          id: "test-item",
          type: "item",
          [published ? "published" : "draft"]: doc,
          onComplete: () => {},
        });
      othersGrey =
        run({ kind: "material" })?.disabled === true &&
        run({ kind: "potion" }, true)?.disabled === true;
      weaponOpen = !run({ kind: "weapon" }, true)?.disabled;
      const description = run({ kind: "weapon" });
      label = description?.label;
      weaponOpen &&= !description?.disabled;
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
      label: "Grå for alt som ikke er våpen",
      done: othersGrey && weaponOpen,
    },
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
  const done = requirements.every((r) => r.done);
  return { done, requirements, error, solvedAs: done ? {} : undefined };
}

export const bakerForgeTask: WindowTask = {
  id: "baker-forge",
  file: "ForgeAction.ts",
  starter,
  solution: starter
    .replace(
      "    // Bare våpen kan smis: gjør knappen grå for alt annet.\n",
      '    disabled: doc?.kind !== "weapon",\n',
    )
    .replace(
      "      // Sett forgedAt til nå og publiser dokumentet.",
      "      patch.execute([{ set: { forgedAt: new Date().toISOString() } }])\n      publish.execute()",
    ),
  modules,
  judge: judgeBakerForge,
  resultTitle: "Ett trykk i Studio",
  Result: result,
  ours: `disabled: kind !== "weapon",\nonHandle: () => {\n  patch.execute([{ set: { forgedAt: new Date().toISOString() } }]);\n  publish.execute();\n  props.onComplete();\n}`,
  references: [],
  extend: {
    file: "src/sanity/studio/BakeryActions.ts",
    marker: "QUEST: Luke 10",
    idea: "Prøv Smi på et våpen i Studio.",
  },
};
