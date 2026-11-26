import type { BoardTask } from "@/game/modelBoard/modelBoard";

export const bakerModelTask: BoardTask = {
  id: "baker-model",
  note: "Bakerens notat: «Lussekatter til Brann, i dag. Ny.»",
  slots: [
    { id: "text", label: "Tekst · `string`", about: "Ord som varierer" },
    { id: "date", label: "Dato · `date`", about: "En kalenderdato" },
    {
      id: "list",
      label: "Liste med valg · `string` med `options.list`",
      about: "Ett kjent valg",
    },
  ],
  cards: [
    { id: "item", text: "Lussekatter" },
    { id: "orderedBy", text: "Brann" },
    { id: "date", text: "i dag" },
    { id: "status", text: "Ny" },
  ],
  decisions: [
    {
      card: "item",
      accept: ["text"],
      feedback: {
        date: "Lussekatter er varen, ikke dagen kunden skal hente den.",
        list: "Jeg baker stadig noe nytt; en fast vareliste blir fort utdatert.",
      },
      toggles: {
        required: {
          want: true,
          feedback: "En bestilling uten vare er ingenting.",
        },
        initial: {
          want: false,
          feedback: "Varen kan jeg ikke vite på forhånd.",
        },
      },
    },
    {
      card: "orderedBy",
      accept: ["text"],
      feedback: {
        date: "Brann er kunden, ikke en leveringsdato.",
        list: "Nye kunder kommer til; navnene skal ikke låses i en liste.",
      },
      toggles: {
        required: {
          want: false,
          feedback:
            "Noen ganger vet jeg ikke hvem. Da vil jeg ikke bli stoppet.",
        },
        initial: {
          want: false,
          feedback: "Jeg kan ikke gjette kunden før bestillingen kommer.",
        },
      },
    },
    {
      card: "date",
      accept: ["date"],
      feedback: {
        text: "Står «i dag» bare som tekst, kan jeg ikke sortere bestillingene etter dato.",
        list: "En liste over alle mulige datoer blir aldri ferdig.",
      },
      toggles: {
        required: {
          want: true,
          feedback: "Jeg må vite hvilken dag bestillingen gjelder.",
        },
        initial: {
          want: true,
          feedback: "De fleste bestiller til i dag.",
        },
      },
    },
    {
      card: "status",
      accept: ["list"],
      feedback: {
        text: "Fritekst gir meg «ny», «Ny» og skrivefeil som ikke kan samles.",
        date: "Ny beskriver arbeidssteget, ikke en dag i kalenderen.",
      },
      toggles: {
        required: {
          want: true,
          feedback: "Uten status vet jeg ikke hva jeg skal gjøre med lappen.",
        },
        initial: {
          want: true,
          feedback: "Alt begynner som nytt.",
        },
      },
    },
  ],
  allowToggles: ["required", "initial"],
};
