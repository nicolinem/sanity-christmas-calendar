import { defineField, defineType } from "sanity";

// QUEST: Luke 6. One skilt for the bakery's market stall, edited in Studio.
export const bakerySign = defineType({
  name: "bakerySign",
  title: "Bodskilt",
  type: "document",
  fields: [
    defineField({
      name: "text",
      title: "Skilttekst",
      type: "array",
      of: [
        {
          type: "block",
          marks: {
            decorators: [{ title: "Fet", value: "strong" }],
            annotations: [
              {
                name: "link",
                title: "Lenke",
                type: "object",
                fields: [
                  { name: "href", title: "Adresse (https://)", type: "url" },
                ],
              },
            ],
          },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Bodskilt" }) },
});
