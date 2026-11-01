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

// QUEST: Luke 2. Gi schema type-en et icon, og en preview i
// dokumentlista som viser gjenstandens egen sprite. src/components/SpriteImage.tsx
// tegner en sprite for deg.
export const item = defineType({
  name: "item",
  title: "Item",
  type: "document",
  fields: [
    // QUEST: Luke 3. Validation: ingen to gjenstander kan hete det samme.
    // Hjelpere: src/sanity/lib/guild.ts
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      options: {
        list: [
          { title: "Weapon", value: "weapon" },
          { title: "Material", value: "material" },
          { title: "Potion", value: "potion" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (rule) => rule.required(),
    }),
    // QUEST: Luke 3. Validation: alle våpen må ha en sprite (andre gjenstander trenger ikke).
    // QUEST: Luke 4. Gi feltet en custom input component som viser
    // pikselkunsten du velger mellom. src/components/SpriteImage.tsx tegner en sprite for deg.
    defineField({
      name: "sprite",
      title: "Sprite",
      type: "string",
      description: "How it looks in the game. Unknown sprites fall back to a default.",
      options: { list: KNOWN_SPRITE_IDS },
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "kind" },
  },
});
