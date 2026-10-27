import { defineField, defineType } from "sanity";
import { KNOWN_SPRITE_IDS } from "../../game/sprites";

// Everything the knight can carry. Players create these in the Studio and
// they flow straight into the game: no code change needed.
//
// There are no numbers here on purpose: the game decides how hard a weapon
// hits (src/game/rules.ts). What the player shapes is the name, and the
// element that name carries.
//
// This file is yours: the chapter 1 quests happen here. Look for the QUEST
// comments.

// QUEST: Brann's Ledger. Give items an icon, and a list preview that shows the
// item's own sprite. src/components/SpriteImage.tsx draws a sprite for you.
export const item = defineType({
  name: "item",
  title: "Item",
  type: "document",
  fields: [
    // QUEST: The Guild's Law. Make this field refuse names that fizzle (two
    // elements) and names another item already has. Helpers: src/sanity/lib/guild.ts
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
    // QUEST: The Drawing Board. Give this field an input that shows the pixel
    // art to pick from. src/components/SpriteImage.tsx draws a sprite for you.
    defineField({
      name: "sprite",
      title: "Sprite",
      type: "string",
      description:
        "How it looks in the game. Anything the game doesn't recognise gets a stand-in.",
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
