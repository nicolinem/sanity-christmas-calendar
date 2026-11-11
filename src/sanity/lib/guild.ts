import { getPublishedId, type SanityClient } from "sanity";

// Helpers for door 3 (validation).
//
// They take care of the fiddly parts (the GROQ, and how drafts are stored), so
// the quest can focus on the validation rule and its result.

// Finds another item with the same name. Exclude every version of this document.
export const SAME_NAME_QUERY = `defined(*[
  _type == "item" &&
  name == $name &&
  !sanity::versionOf($published)
][0]._id)`;

// Drafts and release versions share the same published ID.
export function sameNameParams(name: string, documentId: string) {
  return { name, published: getPublishedId(documentId) };
}

export async function isNameTaken(client: SanityClient, name: string, documentId: string): Promise<boolean> {
  return client.fetch<boolean>(SAME_NAME_QUERY, sameNameParams(name, documentId));
}
