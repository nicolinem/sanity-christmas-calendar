import { defineField, defineType } from "sanity";
import { KNOWN_SPRITE_IDS } from "../../game/sprites";

// Everything the knight can carry. Players create these in the Studio and
// they flow straight into the game: no code change needed.
//
// There are no numbers here on purpose: the game decides how hard a weapon
// hits (src/game/rules.ts). What the player shapes is what the item *is*.
//
// This file is yours: the chapter 1 quests happen here. Look for the QUEST
// comments.

// QUEST: Branns protokoll. Gi gjenstandene et ikon, og en forhåndsvisning i
// lista som viser gjenstandens egen sprite. src/components/SpriteImage.tsx
// tegner en sprite for deg.
export const item = defineType({
  name: "item",
  title: "Gjenstand",
  type: "document",
  fields: [
    // QUEST: Laugets lov. Ingen to gjenstander kan hete det samme.
    // Hjelpere: src/sanity/lib/guild.ts
    defineField({
      name: "name",
      title: "Navn",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Våpen", value: "weapon" },
          { title: "Materiale", value: "material" },
          { title: "Drikk", value: "potion" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (rule) => rule.required(),
    }),
    // QUEST: Laugets lov. Alle våpen må ha en sprite (andre gjenstander trenger ikke).
    // QUEST: Tegnebrettet. Gi feltet en input som viser pikselkunsten du velger
    // mellom. src/components/SpriteImage.tsx tegner en sprite for deg.
    defineField({
      name: "sprite",
      title: "Sprite",
      type: "string",
      description: "Hvordan den ser ut i spillet. Ukjente sprites får en reserve.",
      options: { list: KNOWN_SPRITE_IDS },
    }),
    defineField({
      name: "description",
      title: "Beskrivelse",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "kind" },
  },
});
