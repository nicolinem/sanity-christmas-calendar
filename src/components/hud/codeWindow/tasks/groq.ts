import { evaluate, parse } from "groq-js";
import { ARCHIVE_DATASET, OBSERVATIONS, PLACES } from "@/game/archive";
import type { Reference } from "./types";

// GROQ in the code window runs in the browser against Arkivarens fixed
// practice dataset (src/game/archive.ts), with the same engine Sanity
// publishes as groq-js. Everyone gets the same answers.

export async function runGroq(
  query: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const tree = parse(query, { params });
  return (await evaluate(tree, { dataset: ARCHIVE_DATASET, params })).get();
}

// groq-js errors are terse; say where to look.
export function groqError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return `GROQ-feil: ${message}. Sjekk klammer, anførselstegn og \`&&\`.`;
}

// One document of each type, so the player knows the field names.
const SAMPLE = [
  OBSERVATIONS[0],
  PLACES[0],
  { _id: "witness-ola", _type: "witness", name: "Ola" },
];

export const ARCHIVE_REFERENCE: Reference = {
  file: "observasjoner.json",
  source: JSON.stringify(SAMPLE, null, 2),
  about:
    "Arkivarens øvingsdatasett: 46 observasjoner, 6 steder og 8 vitner, likt for alle. Her er ett dokument av hver type. En `observation` peker på et `place` og et `witness` med *references*. `seen` er `false` når vitnet bare har hørt det fra andre.",
  examples: [],
};
