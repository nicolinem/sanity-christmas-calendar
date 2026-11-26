import { defineField, defineType } from "sanity";
import { unlockedRecipeIds } from "../lib/solved";
import { MATERIALS } from "../../game/materials";

// Smia i grotta. These types are ready-made in every project: nobody writes
// them as a task. An Oppskrift is found in a cave chest and can't be edited;
// a Smiing points at one you have found, and the game turns it into gear
// when the inventory has the materials.

export const recipe = defineType({
  name: "recipe",
  title: "Oppskrift",
  type: "document",
  readOnly: true,
  fields: [
    defineField({ name: "name", title: "Navn", type: "string" }),
    defineField({ name: "gear", title: "Gir", type: "string" }),
    defineField({ name: "description", title: "Beskrivelse", type: "text" }),
    defineField({
      name: "ingredients",
      title: "Ingredienser",
      type: "array",
      of: [
        {
          type: "object",
          name: "ingredient",
          fields: [
            defineField({
              name: "material",
              title: "Materiale",
              type: "string",
              options: {
                list: Object.entries(MATERIALS).map(([value, { name }]) => ({
                  title: name,
                  value,
                })),
              },
            }),
            defineField({ name: "count", title: "Antall", type: "number" }),
          ],
          preview: {
            select: { material: "material", count: "count" },
            prepare: ({ material, count }) => ({
              title: `${MATERIALS[material as keyof typeof MATERIALS]?.name ?? material} × ${count}`,
            }),
          },
        },
      ],
    }),
  ],
  preview: { select: { title: "name", subtitle: "description" } },
});

export const forging = defineType({
  name: "forging",
  title: "Smiing",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Navn",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "recipe",
      title: "Oppskrift",
      type: "reference",
      to: [{ type: "recipe" }],
      description: "Bare oppskrifter du har funnet i grotta.",
      options: {
        filter: () => ({
          filter: "_id in $ids",
          params: { ids: unlockedRecipeIds() },
        }),
        disableNew: true,
      },
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: "name", subtitle: "recipe.name" } },
});
