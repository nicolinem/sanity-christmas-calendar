// Helpers for the quest "The Guild's Law".
//
// They know the game's rules, so you don't have to dig through the name magic
// or remember how drafts are stored. Wiring them into the Studio (which rule,
// where, and what it returns) is the part the quest is about.

import { ELEMENTS, readName } from "../../game/magic";

// The first law: why a name fizzles, or null if it doesn't.
// fizzleReason("Flaming Frost Blade") → "Fire and frost in one name fizzle out"
export function fizzleReason(name: string | null | undefined): string | null {
  const magic = readName(name);
  if (magic.kind !== "fizzle") return null;
  const elements = magic.matches.map((m) => ELEMENTS[m.element].title.toLowerCase()).join(" and ");
  return `${elements[0].toUpperCase()}${elements.slice(1)} in one name fizzle out`;
}

// The second law: GROQ that counts *other* items with the same name.
// Run it with the params from sameNameParams().
export const SAME_NAME_QUERY = `count(*[_type == "item" && name == $name && !(_id in [$id, $draftId])])`;

// While you edit, a document exists as a draft ("drafts.<id>") next to its
// published version. Neither of those should count as a twin of itself.
export function sameNameParams(name: string, documentId: string) {
  const id = documentId.replace(/^drafts\./, "");
  return { name, id, draftId: `drafts.${id}` };
}
