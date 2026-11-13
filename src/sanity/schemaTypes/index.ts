import type { SchemaTypeDefinition } from "sanity";
import { item } from "./item";
import { caseFile, observation, place, witness } from "./archive";

// Week 2 brings Arkivarens observasjoner, ready-made for every player.
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [item, observation, place, witness, caseFile],
};
