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
    isSolved("baker-template") ||
    (isTrack("nonTechnical") && isSolved("baker-model"))
      ? { status: "ny", date: bakeryToday() }
      : {},
  fields: [
    defineField({
      name: "item",
      title: "Vare",
      type: "string",
      validation: (r) =>
        r.custom((value) =>
          isTrack("nonTechnical") && !isSolved("baker-model")
            ? true
            : Boolean(value?.trim()) || "Required",
        ),
    }),
    defineField({ name: "orderedBy", title: "Bestilt av", type: "string" }),
    defineField({
      name: "date",
      title: "Dato",
      type: "date",
      validation: (r) =>
        r.custom((value) =>
          isTrack("nonTechnical") && !isSolved("baker-model")
            ? true
            : Boolean(value) || "Required",
        ),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Venter", value: "venter" },
          { title: "Ny", value: "ny" },
          { title: "Klar", value: "klar" },
        ],
      },
      validation: (r) =>
        r.custom((value) =>
          isTrack("nonTechnical") && !isSolved("baker-model")
            ? true
            : Boolean(value) || "Required",
        ),
    }),
  ],
  preview: {
    select: { title: "item", orderedBy: "orderedBy", status: "status" },
    prepare: ({ title, orderedBy, status }) => ({
      title: title || "Bestilling",
      subtitle: `${orderedBy || "Ukjent kunde"} · ${status || "utkast"}`,
    }),
  },
});
