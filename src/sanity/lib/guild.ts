// Helpers for the quest "Laugets lov".
//
// They take care of the fiddly parts (the GROQ, and how drafts are stored), so
// the quest is about the Sanity part: which rule goes where, what it gets in
// its context, and what it returns.

// Counts *other* items with the same name. Run it with the params from
// sameNameParams().
export const SAME_NAME_QUERY = `count(*[_type == "item" && name == $name && !(_id in [$id, $draftId])])`;

// While you edit, a document exists as a draft ("drafts.<id>") next to its
// published version. Neither of those should count as a twin of itself.
export function sameNameParams(name: string, documentId: string) {
  const id = documentId.replace(/^drafts\./, "");
  return { name, id, draftId: `drafts.${id}` };
}
