import type { BoardTask } from "@/game/modelBoard/modelBoard";

export const archiveModelTask: BoardTask = {
  id: "archive-model",
  note: "Arkivarens notat: «18:45 – store fotspor i snøen ved smia, tror jeg. Kari så det selv, tok bilde. Ikke sjekket.»",
  // A spec sheet: one row per field the observation gets in Studio, with the
  // bit of the note that goes in it. The choice is the field's type.
  layout: "table",
  source: "Fra notatet",
  slots: [
    {
      id: "text",
      label: "Tekst · `string`",
      about: "Ord og korte beskrivelser",
    },
    {
      id: "boolean",
      label: "Ja/nei · `boolean`",
      about: "Sant eller usant",
    },
    { id: "image", label: "Bilde · `image`", about: "Et bilde som kan vises" },
    {
      id: "list",
      label: "Liste med valg · `string` med `options.list`",
      about: "Ett kjent valg",
    },
    {
      id: "place",
      label: "`Reference` → Sted",
      about: "Peker på ett sted",
    },
    {
      id: "witness",
      label: "`Reference` → Vitne",
      about: "Peker på ett vitne",
    },
  ],
  cards: [
    { id: "tracks", field: "Hva ble sett", text: "store fotspor i snøen" },
    { id: "time", field: "Tid", text: "18:45" },
    { id: "place", field: "Sted", text: "ved smia, tror jeg" },
    { id: "witness", field: "Vitne", text: "Kari" },
    { id: "seen", field: "Så det selv", text: "Kari så det selv" },
    { id: "photo", field: "Bilde", text: "bildet Kari tok" },
    { id: "status", field: "Status", text: "Ikke sjekket" },
  ],
  decisions: [
    {
      card: "time",
      accept: ["text"],
      feedback: {
        boolean: "Et klokkeslett er ikke ja eller nei.",
        image: "Klokkeslettet står i notatet, ikke på bildet.",
        list: "Det finnes for mange klokkeslett til en liste. Jeg kan ikke lage et valg for hvert minutt.",
        place: "18:45 sier når, ikke hvor.",
        witness: "18:45 sier når, ikke hvem.",
      },
    },
    {
      card: "tracks",
      accept: ["text"],
      feedback: {
        boolean:
          "Fotspor er ikke et ja eller nei; da mister jeg det hun faktisk så.",
        image:
          "Bildet har sitt eget felt. Her er det ordene hennes jeg vil ta vare på.",
        list: "Folk ser alt mulig. Jeg kan ikke lage en liste over alt.",
        place: "Fotsporene er observasjonen, ikke stedet der den skjedde.",
        witness: "Fotspor kan ikke være vitnet jeg skal spørre igjen.",
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
        text: "Regelen min sier «et annet vitne». Står navnet som tekst, blir «Kari» og «kari» to forskjellige vitner.",
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
        text: "Regelen min spør bare om én ting: så hun det selv, ja eller nei? Med fritekst får jeg «ja», «Ja» og «tror det».",
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
          "Ja/nei gir bare bekreftet eller ikke. Jeg trenger tre: *Ukjent*, *Bekreftet* og *Rykte*.",
        image: "Statusen skal kunne filtreres, ikke tydes fra et bilde.",
        place: "Status forteller hva vi vet, ikke hvor observasjonen skjedde.",
        witness:
          "Status er vurderingen min, ikke personen som fortalte historien.",
      },
    },
  ],
};
