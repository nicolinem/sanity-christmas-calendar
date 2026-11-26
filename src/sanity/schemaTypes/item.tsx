import { defineField, defineType } from "sanity";
import { isSpriteAllowedForKind, KNOWN_SPRITE_IDS } from "../../game/sprites";
import { isNameTaken } from "../lib/guild";
import { isSolved, ItemIcon, ItemMedia, ItemSpriteInput } from "../lib/solved";

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
const KINDS = [
  { title: "Våpen", value: "weapon" },
  { title: "Materiale", value: "material" },
  { title: "Drikk", value: "potion" },
];

export const item = defineType({
  name: "item",
  title: "Gjenstand",
  type: "document",
  icon: ItemIcon,
  fields: [
    defineField({
      name: "name",
      title: "Navn",
      type: "string",
      // QUEST: Luke 3. Studio stopper like navn ved vanlig redigering. Dette er
      // ikke en databasebegrensning; API-mutasjoner valideres ikke av Studio-regler.
      // Først på når Luke 3 er løst i spillet. Gå videre: en regel på description.
      validation: (rule) => [
        rule.required(),
        rule.custom(async (name, context) => {
          const { document, getClient } = context;
          if (!isSolved("the-guilds-law") || !name || !document) return true;
          const client = getClient({ apiVersion: "2026-09-03" });
          const taken = await isNameTaken(client, name, document._id);
          return taken
            ? `Det finnes allerede en gjenstand som heter «${name}»`
            : true;
        }),
      ],
    }),
    defineField({
      name: "kind",
      title: "Sort",
      type: "string",
      options: {
        list: KINDS,
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
      components: { input: ItemSpriteInput },
      description:
        "Slik ser den ut i spillet. En ukjent sprite blir byttet med en standard.",
      options: { list: KNOWN_SPRITE_IDS },
      // QUEST: Luke 3. Vår versjon av koden fra kodevinduet: bare våpen må ha en
      // sprite. Er først på når Luke 3 er løst i spillet.
      validation: (rule) =>
        rule.custom((sprite, context) => {
          if (
            isSolved("the-guilds-law") &&
            context.document?.kind === "weapon" &&
            !sprite
          )
            return "Et våpen trenger en sprite";
          if (
            isSolved("the-drawing-board") &&
            sprite &&
            !isSpriteAllowedForKind(sprite, context.document?.kind)
          )
            return "Denne spriten passer ikke til sorten";
          return true;
        }),
    }),
    defineField({
      name: "description",
      title: "Beskrivelse",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "forgedAt",
      title: "Smidd",
      type: "datetime",
      hidden: true,
    }),
  ],
  // QUEST: Luke 2. Dette er vår versjon av koden fra kodevinduet. Gå videre:
  // bytt ut ItemMedia (src/sanity/lib/solved.tsx) med din egen komponent.
  preview: {
    select: { title: "name", subtitle: "kind", spriteId: "sprite" },
    prepare: ({ title, subtitle, spriteId }) => ({
      title,
      subtitle: KINDS.find((k) => k.value === subtitle)?.title ?? subtitle,
      media: <ItemMedia spriteId={spriteId} kind={subtitle} />,
    }),
  },
});
