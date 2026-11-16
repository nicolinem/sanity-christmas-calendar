import { defineField, defineType } from "sanity";
import { bakeryToday } from "../lib/bakeryDate";
import { isSolved, isTrack } from "../lib/solved";

// QUEST: Luke 9 / Luke 5. Only a new order receives initial values;
// existing orders keep what the editor wrote.
export const bakeryOrder = defineType({
  name: "bakeryOrder",
  title: "Ny bestilling",
  type: "document",
  initialValue: () =>
    isSolved("baker-template") || isTrack("nonTechnical")
      ? { status: "ny", date: bakeryToday() }
      : {},
  fields: [
    defineField({ name: "item", title: "Vare", type: "string", validation: (r) => r.required() }),
    defineField({ name: "date", title: "Dato", type: "date", validation: (r) => r.required() }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: { list: [{ title: "Ny", value: "ny" }, { title: "Klar", value: "klar" }] },
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: "item", subtitle: "status" } },
});