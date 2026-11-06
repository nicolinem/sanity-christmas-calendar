import { defineField, defineType } from "sanity";
import { KNOWN_SPRITE_IDS } from "../../game/sprites";
import { SAME_NAME_QUERY, sameNameParams } from "../lib/guild";
import { isSolved, ItemIcon, ItemMedia } from "../lib/solved";

// Everything the knight can carry. Players create these in the Studio and
// they flow straight into the game: no code change needed.
//
// There are no numbers here on purpose: the game decides how hard a weapon
// hits (src/game/rules.ts). What the player shapes is what the item *is*.
//
// Luke 2 (icon and preview) and Luke 3 (validation) are solved in the game's
// code window. What you see here is our version of the same code: it switches
// on once you've solved the task there. This file is yours from Luke 4 on.
// Look for the QUEST comments.
export const item = defineType({
  name: "item",
  title: "Item",
  type: "document",
  icon: ItemIcon,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      // QUEST: Luke 3. Vår versjon av koden fra kodevinduet: ingen to gjenstander
      // kan hete det samme. Den spør dataset-et med den ekte klienten, og er
      // først på når Luke 3 er løst i spillet. Gå videre: en regel på description.
      validation: (rule) => [
        rule.required(),
        rule.custom(async (name, context) => {
          if (!isSolved("the-guilds-law") || !name) return true;
          const client = context.getClient({ apiVersion: "2024-01-01" });
          const others = await client.fetch(SAME_NAME_QUERY, sameNameParams(name, context.document?._id ?? ""));
          return others === 0 ? true : `Another item is already called "${name}"`;
        }),
      ],
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
    // QUEST: Luke 4. Gi feltet en custom input component som viser
    // pikselkunsten du velger mellom. Startfila ligger i
    // src/sanity/studio/SpritePicker.tsx: fyll den ut, importer den her og
    // sett `components: { input: SpritePicker }` på feltet under.
    defineField({
      name: "sprite",
      title: "Sprite",
      type: "string",
      description: "How it looks in the game. Unknown sprites fall back to a default.",
      options: { list: KNOWN_SPRITE_IDS },
      // QUEST: Luke 3. Vår versjon av koden fra kodevinduet: bare våpen må ha en
      // sprite. Er først på når Luke 3 er løst i spillet.
      validation: (rule) =>
        rule.custom((sprite, context) =>
          isSolved("the-guilds-law") && context.document?.kind === "weapon" && !sprite ? "A weapon needs a sprite" : true,
        ),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
  ],
  // QUEST: Luke 2. Dette er vår versjon av koden fra kodevinduet. Gå videre:
  // bytt ut ItemMedia (src/sanity/lib/solved.tsx) med din egen komponent.
  preview: {
    select: { title: "name", subtitle: "kind", spriteId: "sprite" },
    prepare: ({ title, subtitle, spriteId }) => ({
      title,
      subtitle,
      media: <ItemMedia spriteId={spriteId} kind={subtitle} />,
    }),
  },
});
