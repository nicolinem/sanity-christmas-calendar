import { defineField, defineType } from "sanity";
import { PinIcon } from "@sanity/icons/Pin";
import { UserIcon } from "@sanity/icons/User";
import { FolderIcon } from "@sanity/icons/Folder";
import { EyeOpenIcon } from "@sanity/icons/EyeOpen";
import { isSolved, isTrack } from "../lib/solved";

// Arkivarens observasjoner (uke 2). These types are ready-made in every
// project: nobody writes them as a task. The non-technical track sorts and
// links the observations the game puts in your project; the technical track
// queries a fixed copy of the same kind of data in the code window.

export const STATUS_TITLES: Record<string, string> = {
  unknown: "Ukjent",
  confirmed: "Bekreftet",
  rumor: "Rykte",
};

const hideModeledField = () =>
  isTrack("nonTechnical") && !isSolved("archive-model");

export const observation = defineType({
  name: "observation",
  title: "Observasjon",
  type: "document",
  icon: EyeOpenIcon,
  fields: [
    defineField({
      name: "what",
      title: "Hva ble sett",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "time",
      title: "Tid",
      type: "string",
      description: "TT:MM, samme kveld",
    }),
    defineField({
      name: "place",
      title: "Sted",
      type: "reference",
      to: [{ type: "place" }],
      hidden: hideModeledField,
    }),
    defineField({
      name: "placeNote",
      title: "Sted (slik det ble skrevet)",
      type: "string",
      description:
        "Det vitnet skrev. Sted-feltet over er det arkivet kan søke i.",
      hidden: ({ value }) => !value,
    }),
    defineField({
      name: "witness",
      title: "Vitne",
      type: "reference",
      to: [{ type: "witness" }],
      hidden: hideModeledField,
    }),
    defineField({
      name: "seen",
      title: "Så det selv",
      type: "boolean",
      initialValue: true,
    }),
    defineField({ name: "image", title: "Bilde", type: "image" }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      initialValue: "unknown",
      hidden: hideModeledField,
      options: {
        list: Object.entries(STATUS_TITLES).map(([value, title]) => ({
          title,
          value,
        })),
        layout: "radio",
        direction: "horizontal",
      },
    }),
  ],
  orderings: [
    { title: "Tid", name: "time", by: [{ field: "time", direction: "asc" }] },
  ],
  preview: {
    select: {
      title: "what",
      time: "time",
      status: "status",
      place: "place.name",
      note: "placeNote",
      media: "image",
    },
    prepare: ({ title, time, status, place, note, media }) => ({
      title,
      subtitle: [time, place ?? note, STATUS_TITLES[status] ?? status]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});

export const place = defineType({
  name: "place",
  title: "Sted",
  type: "document",
  icon: PinIcon,
  fields: [
    defineField({
      name: "name",
      title: "Navn",
      type: "string",
      validation: (r) => r.required(),
    }),
    // Where the place is on the village map, in percent. Read by the game.
    defineField({
      name: "x",
      title: "Kart x (%)",
      type: "number",
      hidden: true,
    }),
    defineField({
      name: "y",
      title: "Kart y (%)",
      type: "number",
      hidden: true,
    }),
  ],
});

export const witness = defineType({
  name: "witness",
  title: "Vitne",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({
      name: "name",
      title: "Navn",
      type: "string",
      validation: (r) => r.required(),
    }),
  ],
});

export const caseFile = defineType({
  name: "case",
  title: "Saksmappe",
  type: "document",
  icon: FolderIcon,
  fields: [
    defineField({
      name: "title",
      title: "Tittel",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "observations",
      title: "Observasjoner",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "observation" }],
          options: { disableNew: true },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "title", observations: "observations" },
    prepare: ({ title, observations }) => ({
      title,
      subtitle: `${Array.isArray(observations) ? observations.length : 0} observasjoner`,
    }),
  },
});
