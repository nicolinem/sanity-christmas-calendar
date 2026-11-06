/* eslint-disable @typescript-eslint/no-unused-vars -- importene er klare til du bruker dem */
import { set, unset, type StringInputProps } from "sanity";
import SpriteImage from "../../components/SpriteImage";
import { KNOWN_SPRITE_IDS } from "../../game/sprites";

// Relative imports på denne fila, ikke "@/": Sanity CLI bygger Studio uten den
// snarveien.

// QUEST: Luke 4. Dette er startfila til velgeren din. Den er ikke koblet til
// `sprite` ennå: det gjør du selv i src/sanity/schemaTypes/item.tsx
// (`components: { input: SpritePicker }` på feltet).
//
// Akkurat nå tegner den bare standardfeltet, så Studio virker som før.
export function SpritePicker(props: StringInputProps) {
  // QUEST: Luke 4. Bytt ut linja under med et rutenett av sprites.
  //   - Gå gjennom KNOWN_SPRITE_IDS og lag en <button type="button"> per id,
  //     med <SpriteImage spriteId={id} kind="weapon" /> inni.
  //   - Klikker man en knapp: `props.onChange(set(id))`.
  //   - Vil man fjerne valget: `props.onChange(unset())`.
  //   - Marker den som er valgt (`props.value`) så man ser hvilken det er.
  // Importene `set`, `unset`, `SpriteImage` og `KNOWN_SPRITE_IDS` er klare til bruk.
  return props.renderDefault(props);
}
