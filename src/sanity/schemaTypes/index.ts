import type { SchemaTypeDefinition } from "sanity";
import { item } from "./item";

// Monsters arrive in chapter 2 as their own document type.
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [item],
};
