import { useState } from "react";
import { isDeepStrictEqual } from "./deepEqual";
import { ARCHIVE_REFERENCE, groqError, runGroq } from "./groq";
import type { Verdict, WindowTask } from "./types";

// Uke 2, frivillig luke: Arkivarens spørsmål, hung on the signpost by the
// square once the GROQ luke is done. Five GROQ questions on the same practice
// dataset, gathered in one luke. The answer is the data itself, so each is
// shown as JSON and compared with what our own query gives.

type Question = {
  n: number;
  ask: string; // Arkivaren's one line
  detail: string; // what shape the answer should have
  ours: string;
  // Some answers can be given in more than one shape; say how to read it.
  read?: (result: unknown) => unknown;
  forbid?: { word: string; why: string };
};

const QUESTIONS: Question[] = [
  {
    n: 1,
    ask: "Hvor mange rykter har vi egentlig?",
    detail: 'Svaret er ett tall: antall observasjoner med `status` `"rumor"`.',
    ours: `count(*[_type == "observation" && status == "rumor"])`,
  },
  {
    n: 2,
    ask: "Hva skjedde mellom seks og sju?",
    detail:
      "Alle observasjoner fra og med 18:00 til før 19:00, med `time` og `what`, i tidsrekkefølge.",
    ours: `*[_type == "observation" && time >= "18:00" && time < "19:00"]
  | order(time asc) { time, what }`,
  },
  {
    n: 3,
    ask: "Hvor mange observasjoner har hvert sted? Flest først.",
    detail:
      "Ett objekt per sted med `name` og `antall`, sortert med flest først.",
    ours: `*[_type == "place"] {
  name,
  "antall": count(*[_type == "observation" && references(^._id)])
} | order(antall desc)`,
  },
  {
    n: 4,
    ask: "Hvem sprer flest rykter?",
    detail: 'Navnet på vitnet med flest observasjoner som er `"rumor"`.',
    ours: `*[_type == "witness"] {
  name,
  "rykter": count(*[_type == "observation" && status == "rumor" && references(^._id)])
} | order(rykter desc)[0].name`,
    // A name, an object with the name, or a list starting with it.
    read: (r) => {
      const first = Array.isArray(r) ? r[0] : r;
      return typeof first === "object" && first && "name" in first
        ? (first as { name: unknown }).name
        : first;
    },
  },
  {
    n: 5,
    ask: "Hvem satte egentlig disse statusene? Bruk regelen min i stedet.",
    detail:
      "Regelen: vitnet så det selv (`seen`), og det har et bilde, eller et *annet* vitne så det samme stedet. Gi `time` og `what` i tidsrekkefølge, uten å bruke `status`.",
    ours: `*[_type == "observation" && seen && (
  defined(image) ||
  count(*[_type == "observation" && seen
    && place._ref == ^.place._ref
    && witness._ref != ^.witness._ref]) > 0
)] | order(time asc) { time, what }`,
    forbid: {
      word: "status",
      why: "Arkivaren stoler ikke på `status`. Bruk regelen i stedet.",
    },
  },
];

// One file, one answer per question. Answer as many as you like; the luke is
// done when all five match Arkivaren's.
const STARTER = `// Arkivarens spørsmål. Svar på så mange du vil, i hvilken
// rekkefølge du vil. Hvert svar er én GROQ-spørring.
${QUESTIONS.map(
  (q) => `
// ${q.n}. «${q.ask}»
//    ${q.detail.replace(/[`*]/g, "")}
export const svar${q.n} = \`
  *[_type == "observation"]
\``,
).join("\n")}
`;

const OURS = QUESTIONS.map((q) => `// ${q.n}. ${q.ask}\n${q.ours}`).join(
  "\n\n",
);

type Answer = {
  n: number;
  ask: string;
  done: boolean;
  json: string;
  message?: string;
};
type AnswersData = { answers: Answer[] };

const expected = new Map<number, Promise<unknown>>();
function answerFor(q: Question) {
  if (!expected.has(q.n))
    expected.set(
      q.n,
      runGroq(q.ours).then((r) => (q.read ? q.read(r) : r)),
    );
  return expected.get(q.n)!;
}

async function judgeOne(q: Question, query: unknown): Promise<Answer> {
  const base = { n: q.n, ask: q.ask };
  if (typeof query !== "string")
    return {
      ...base,
      done: false,
      json: "",
      message: `Behold \`export const svar${q.n} = \\\`…\\\`\`.`,
    };
  let result: unknown;
  try {
    result = await runGroq(query);
  } catch (err) {
    return { ...base, done: false, json: "", message: groqError(err) };
  }
  const json = JSON.stringify(result, null, 2) ?? "null";
  const answer = await answerFor(q);
  const same = isDeepStrictEqual(q.read ? q.read(result) : result, answer);
  if (!same) {
    const size = (v: unknown) =>
      Array.isArray(v) ? `${v.length} rader` : "én verdi";
    return {
      ...base,
      done: false,
      json,
      message: `Ikke likt ennå. Du får ${size(result)}, svaret har ${size(answer)}.`,
    };
  }
  if (q.forbid && new RegExp(`\\b${q.forbid.word}\\b`).test(query))
    return { ...base, done: false, json, message: q.forbid.why };
  return { ...base, done: true, json };
}

export async function judgeQuestions(
  exports: Record<string, unknown>,
): Promise<Verdict<AnswersData>> {
  const answers = await Promise.all(
    QUESTIONS.map((q) => judgeOne(q, exports[`svar${q.n}`])),
  );
  const done = answers.every((a) => a.done);
  return {
    requirements: answers.map((a) => ({
      label: `${a.n}. ${a.ask}`,
      done: a.done,
      message: a.message,
    })),
    done,
    solvedAs: done ? {} : undefined,
    data: { answers },
  };
}

// A row of five, and the JSON of the
// answer you pick. Opens on the first one that isn't solved yet.
function Answers({ verdict }: { verdict: Verdict | null }) {
  const answers = (verdict?.data as AnswersData | undefined)?.answers ?? [];
  const [picked, setPicked] = useState<number | null>(null);
  const shown =
    answers.find((a) => a.n === picked) ??
    answers.find((a) => !a.done) ??
    answers[0];
  return (
    <div className="cw-aq">
      <ol className="cw-aq-row">
        {answers.map((a) => (
          <li key={a.n}>
            <button
              type="button"
              className={`${a.done ? "is-done" : ""}${a === shown ? " is-shown" : ""}`}
              onClick={() => setPicked(a.n)}
              aria-pressed={a === shown}
            >
              <span className="cw-aq-n">{a.done ? `${a.n} · løst` : a.n}</span>
            </button>
          </li>
        ))}
      </ol>
      {shown && (
        <>
          <p className="cw-aq-ask">
            <span className="cw-aq-who">Arkivaren</span> {shown.ask}
          </p>
          <pre className={`cw-groq-result${shown.done ? " is-done" : ""}`}>
            {shown.json || "Ingen resultat ennå."}
          </pre>
        </>
      )}
    </div>
  );
}

export const questionsTask: WindowTask = {
  id: "archive-questions",
  file: "sporsmal.groq.ts",
  starter: STARTER,
  solution: QUESTIONS.map(
    (q) => `// ${q.n}. «${q.ask}»\nexport const svar${q.n} = \`\n${q.ours}\n\``,
  ).join("\n\n"),
  modules: {},
  judge: judgeQuestions,
  resultTitle: "Arkivarens spørsmål",
  Result: Answers,
  ours: OURS,
  references: [ARCHIVE_REFERENCE],
  studioCode: false,
};
