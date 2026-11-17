import type { BoardTask } from "@/game/modelBoard/modelBoard";

export const archiveModelTask: BoardTask = {
  id: "archive-model",
  note: "Arkivarens notat: «21:40 – fotspor i snøen ved smia, tror jeg. Kari så det selv, tok bilde. Ikke sjekket.»",
  slots: [
    { id: "text", label: "Tekst", about: "Ord og korte beskrivelser" },
    { id: "boolean", label: "Ja/nei", about: "Sant eller usant" },
    { id: "image", label: "Bilde", about: "Et bilde som kan vises" },
    { id: "list", label: "Liste med valg", about: "Ett kjent valg" },
    {
      id: "place",
      label: "Reference → Sted",
      about: "Peker på ett sted",
    },
    {
      id: "witness",
      label: "Reference → Vitne",
      about: "Peker på ett vitne",
    },
  ],
  cards: [
    { id: "tracks", text: "fotspor i snøen" },
    { id: "time", text: "21:40" },
    { id: "place", text: "ved smia, tror jeg" },
    { id: "witness", text: "Kari" },
    { id: "seen", text: "så det selv" },
    { id: "photo", text: "bilde" },
    { id: "status", text: "Ikke sjekket" },
  ],
  decisions: [
    {
      card: "tracks",
      accept: ["text"],
      feedback: {
        boolean:
          "Fotspor er ikke et ja eller nei; da mister jeg det hun faktisk så.",
        image:
          "Jeg har ikke selve bildet av fotsporene, bare ordene i notatet.",
        list: "Folk ser alt mulig. Jeg kan ikke lage en liste over alt.",
        place: "Fotsporene er observasjonen, ikke stedet der den skjedde.",
        witness: "Fotspor kan ikke være vitnet jeg skal spørre igjen.",
      },
    },
    {
      card: "time",
      accept: ["text"],
      feedback: {
        boolean: "Det er et tidspunkt, ikke et ja eller nei.",
        image:
          "Et bilde av klokka lar meg ikke sortere observasjonene etter tid.",
        list: "Jeg vil ikke vedlikeholde en liste over hvert mulig klokkeslett.",
        place: "Klokkeslettet peker ikke på et sted i bygda.",
        witness: "21:40 er når det skjedde, ikke hvem som så det.",
      },
    },
    {
      card: "place",
      accept: ["place"],
      feedback: {
        text: 'Da står det "smia", "Smia" og "ved smia". "Per sted" finner bare én av dem.',
        boolean: "Jeg må vite hvilket sted, ikke bare om et sted finnes.",
        image: "Et bilde av smia kobler ikke notatet til Smia i arkivet.",
        list: "En fast liste blir utdatert når bygda får et nytt sted.",
        witness: "Smia er et sted, ikke et vitne.",
      },
    },
    {
      card: "witness",
      accept: ["witness"],
      feedback: {
        text: 'Regelen min sier *et annet vitne*. "Kari" og "kari" blir to forskjellige vitner.',
        boolean: "Jeg må vite hvem det var, ikke bare om noen var der.",
        image: "Et portrett forteller ikke arkivet hvilken Kari jeg mener.",
        list: "En navneliste blir feil så snart et nytt vitne melder seg.",
        place: "Kari er personen som så det, ikke stedet hun sto.",
      },
    },
    {
      card: "seen",
      accept: ["boolean"],
      feedback: {
        text: "Jeg må kunne sortere på det. Fritekst kan ikke sorteres.",
        image: "Et bilde beviser ikke om Kari så hendelsen med egne øyne.",
        list: "Her finnes bare to svar; en lang valgliste gjør regelen uklar.",
        place: "Dette sier hvordan hun vet det, ikke hvor det skjedde.",
        witness: "Dette er et svar fra vitnet, ikke et nytt vitne.",
      },
    },
    {
      card: "photo",
      accept: ["image"],
      feedback: {
        text: "Jeg vil se bildet, ikke en beskrivelse av det.",
        boolean:
          "Ja eller nei forteller at et bilde finnes, men viser meg det ikke.",
        list: "Jeg kan ikke velge et nytt bevis fra en ferdig liste.",
        place: "Bildet er beviset, ikke et sted i bygda.",
        witness: "Et bilde kan ikke svare når jeg spør et vitne.",
      },
    },
    {
      card: "status",
      accept: ["list"],
      feedback: {
        text: "Fritekst gir meg «ukjent», «Ukjent» og skrivefeil som ikke kan filtreres sammen.",
        boolean:
          "Ja/nei gir bare bekreftet eller ikke. Jeg trenger tre: *Unknown*, *Confirmed* og *Rumor*.",
        image: "Statusen skal kunne filtreres, ikke tydes fra et bilde.",
        place: "Status forteller hva vi vet, ikke hvor observasjonen skjedde.",
        witness:
          "Status er vurderingen min, ikke personen som fortalte historien.",
      },
    },
  ],
};
