import { defineField, defineType } from "sanity";

// QUEST: Luke 8. One skilt for the bakery's market stall, edited in Studio.
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
          // Only bold: the luke is about one mark, so nothing else to choose.
          marks: {
            decorators: [{ title: "Fet", value: "strong" }],
            annotations: [],
          },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Bodskilt" }) },
});
