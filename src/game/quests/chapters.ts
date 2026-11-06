import type { GameItemView } from "../items";
import type {
  Chapter,
  CodeCheck,
  CheckResult,
  Quest,
  QuestContext,
} from "./types";

// The calendar's quests, in the order they unlock. Every quest teaches one new
// Sanity idea. Quests say what to achieve; the hints get gradually closer to
// how. Player-facing text is Norwegian, but developer words stay English and
// are marked: `code` for what you type, *term* for Sanity concepts (see
// src/components/hud/richText.tsx). See docs/utviklingsplan.md.

const DOCS = "https://www.sanity.io/docs/studio";
const LEARN = "https://www.sanity.io/learn/course";

// The newest published weapon that actually hits. Verified purely from fetched
// content, no hardcoding of the specific item.
export function findForgedWeapon(
  items: GameItemView[],
): GameItemView | undefined {
  return items.find(
    (i) =>
      i.source === "sanity" &&
      i.kind === "weapon" &&
      (i.power?.damage ?? 0) > 0,
  );
}

// Quests judged from the player's code report in through `npm run quest`.
function fromCode(id: string) {
  return ({ codeChecks }: QuestContext): CheckResult => {
    const check: CodeCheck | undefined = codeChecks[id];
    // No check yet: the HUD explains how code quests are verified.
    return { done: Boolean(check?.done), message: check?.message };
  };
}

const theBrokenForge: Quest = {
  id: "the-broken-forge",
  door: 1,
  title: "Lag og publiser et våpen",
  villageSite: "forge",
  intro: [
    "Hei! Jeg er Brann, smeden. Hver uke åpner et nytt kapittel med Sanity-oppgaver. Det du lager i Studio, dukker opp her i spillet.",
    "Luke 1: lag et våpen i Studio, gi det et navn og en sprite, og trykk *Publish*. Test det så på snømonsteret øst for brønnen.",
  ],
  goal: "Lag et våpen i Sanity Studio, trykk *Publish*, og test det på snømonsteret.",
  where: "I Sanity Studio.",
  hints: [
    {
      text: "Åpne Studio fra samtalen med Brann, og lag et nytt *Item*-dokument.",
    },
    {
      text: "Velg *Weapon* som *Kind*, gi det et navn, og trykk *Publish*. En *draft* kommer aldri med i spillet.",
    },
    {
      text: "Snømonsteret står øst for brønnen. Gå helt bort til det og trykk mellomrom.",
    },
  ],
  learn: {
    label: "Hello, Studio",
    url: `${LEARN}/day-one-with-sanity-studio/hello-studio`,
  },
  lesson: {
    title: "*Draft* og *published*",
    text: "Det du skriver i Studio, er en *draft* helt til du trykker *Publish*. Spillet leser bare publiserte *documents*, og fikk våpenet ditt i samme øyeblikk fordi *Content Lake* sender endringer ut i sanntid.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({
    items,
    progress,
    sanityConfigured,
    unpublishedDrafts,
  }: QuestContext) => {
    const forged = findForgedWeapon(items);
    return {
      done: Boolean(forged) && progress.wraithDefeated,
      objectives: [
        { label: "Publiser et våpen i Sanity Studio", done: Boolean(forged) },
        { label: "Beseir snømonsteret", done: progress.wraithDefeated },
      ],
      message:
        sanityConfigured === false
          ? "Spillet er ikke koblet til Sanity ennå. Kjør `npm run setup`."
          : !forged && unpublishedDrafts
            ? "Du har et utkast som ikke er publisert. Trykk *Publish* i Studio."
            : undefined,
    };
  },
};

const brannsLedger: Quest = {
  id: "branns-ledger",
  door: 2,
  title: "Ikon og preview i lista",
  villageSite: "noticeboard",
  intro: [
    "I går skulle jeg finne den nye øksa i Studio, men lista viser bare navn. Jeg åpnet tre sverd før jeg endelig fant den.",
    "Kan du hjelpe meg å gjøre våpnene lettere å kjenne igjen, så jeg slipper å lete neste gang?",
  ],
  goal: "Gjør gjenstander lette å kjenne igjen i Studio: et `icon` på *schema type*-en og en *preview* med spriten.",
  where: "I kodevinduet i spillet. Åpne luka fra Brann eller kalenderen.",
  hints: [
    {
      text: "En *schema type* kan ha et `icon`, og det lista viser styres av `preview`.",
      link: {
        label: "Document type properties",
        url: `${DOCS}/document-type#fadba8b5-f0d1-4f90-a181-e14aca95598e`,
      },
    },
    {
      text: 'Sanity sitt eget ikonsett følger med Studio. Hvert ikon har sin egen sti: `import { BoltIcon } from "@sanity/icons/Bolt"`.',
      link: { label: "Sanity Icons", url: "https://icons.sanity.build" },
    },
    {
      text: "`preview.prepare()` kan returnere `media`: en hvilken som helst React-komponent, ikke bare et bilde.",
      link: {
        label: "React components in previews",
        url: `${DOCS}/previews-list-views#k75b9321e2389`,
      },
    },
    {
      text: "Du trenger ikke tegne pikselkunsten selv: `<SpriteImage spriteId={…} kind={…} />` gjør det. Den er allerede importert, og i fanen `SpriteImage.tsx` ser du hvordan den virker.",
    },
  ],
  learn: {
    label: "Sublime schemas",
    url: `${LEARN}/studio-excellence/sublime-schemas`,
  },
  lesson: {
    title: "*Previews*",
    text: "`preview.select` henter rå verdier fra dokumentet, og `prepare()` gjør dem om til det lista viser, også en React-komponent som `media`.",
  },
  checkedBy: "window",
  check: ({ progress }) => ({
    done: Boolean(progress.solved["branns-ledger"]),
  }),
};

const theGuildsLaw: Quest = {
  id: "the-guilds-law",
  door: 3,
  title: "Validation: regler for våpen",
  villageSite: "westHouse",
  intro: [
    "To regler: alle våpen må ha en sprite, og ingen to gjenstander kan hete det samme. Få Studio til å nekte begge deler.",
  ],
  goal: "Legg til *validation* så Studio nekter våpen uten sprite, og navn som allerede er tatt.",
  where: "I kodevinduet i spillet. Åpne luka fra Brann eller kalenderen.",
  hints: [
    {
      text: "En *validation rule* kan gjøre akkurat det du vil med `rule.custom(...)`.",
      link: {
        label: "Custom validation",
        url: `${DOCS}/validation#k091e10f957aa`,
      },
    },
    {
      text: "En *rule* kan se på resten av dokumentet: `context` har `document`. Bare våpen trenger sprite.",
      link: {
        label: "Validating against other fields",
        url: `${DOCS}/validation#k1d8eb8fbb695`,
      },
    },
    {
      text: "Duplikater krever *dataset*-et: `context` gir deg `getClient`, og den vil ha en `apiVersion`. Ferdig *GROQ* for å finne duplikater er allerede importert: `SAME_NAME_QUERY` og `sameNameParams()`. I fanen `guild.ts` ser du hva de gjør.",
      link: {
        label: "Asynchronous validation using the client",
        url: `${DOCS}/validation#k71fb43753fd9`,
      },
    },
    {
      text: "Står du fast på duplikatene? Dokumentasjonen har en oppskrift på akkurat dette.",
      link: {
        label: "Enforce a unique field value",
        url: `${DOCS}/validation#u1a4f7c93e21`,
      },
    },
  ],
  learn: { label: "Validation", url: `${DOCS}/validation` },
  lesson: {
    title: "*Validation* med `context`",
    text: "`rule.custom()` får både verdien og en `context`: hele dokumentet, og en klient som kan spørre *dataset*-et. En *rule* som feiler som `error`, stopper *Publish*; en `warning` gjør det ikke.",
  },
  checkedBy: "window",
  check: ({ progress }) => ({
    done: Boolean(progress.solved["the-guilds-law"]),
  }),
};

const theDrawingBoard: Quest = {
  id: "the-drawing-board",
  door: 4,
  title: "Custom input: velg sprite med bilder",
  intro: [
    "Å velge sprite fra en liste med navn er tungvint. Lag en velger som viser selve pikselkunsten.",
    "Dette er en bonus, og den er annerledes: du løser den ikke i kodevinduet, men i selve koden, i din egen editor. En *custom input component* er en React-komponent i Studio, og den trenger mer enn én fil.",
  ],
  goal: "Lag en *custom input component* for `sprite` som viser pikselkunsten i stedet for en liste med navn.",
  goalPreview: {
    before: "I dag velger du sprite fra en liste med navn.",
    after: "Etterpå ser du bildene og klikker på den du vil ha.",
  },
  where:
    "I editoren din: startfila `src/sanity/studio/SpritePicker.tsx`, og `src/sanity/schemaTypes/item.tsx` (kommentaren `QUEST: Luke 4`).",
  hints: [
    {
      text: "Åpne `src/sanity/studio/SpritePicker.tsx`. Den er klar, men viser bare standardfeltet.",
    },
    {
      text: 'Lag en `<button type="button">` per id i `KNOWN_SPRITE_IDS`, med en `SpriteImage` inni.',
    },
    {
      text: "Klikket endrer verdien med `props.onChange(set(id))`. `unset()` fjerner den.",
      link: {
        label: "Form components API reference",
        url: `${DOCS}/form-components-reference`,
      },
    },
    {
      text: "Koble den på: i `item.tsx` kan et *field* bytte ut *input component*-en sin med `components: { input: ... }`.",
      link: {
        label: "Form components",
        url: `${DOCS}/form-components#f5793c951d53`,
      },
    },
  ],
  learn: {
    label: "Custom input components",
    url: `${LEARN}/studio-excellence/custom-form-components`,
  },
  lesson: {
    title: "*Custom input components*",
    text: "Et *field* kan bytte ut *input component*-en sin med `components.input`. Komponenten får verdien, og endrer den med `onChange(set(...))` eller `unset()`.",
  },
  checkedBy: "code",
  bonus: true,
  check: fromCode("the-drawing-board"),
};

const theProvingRoom: Quest = {
  id: "the-proving-room",
  door: 5,
  title: "Document view: se våpenet i Studio",
  intro: [
    "Lag en egen fane i Studio som viser gjenstanden slik den ser ut i spillet, med ridderen som svinger våpenet.",
    "Dette er en bonus, og den løses i selve koden, i din egen editor, ikke i kodevinduet. En *document view* er en React-komponent i Studio, og den trenger mer enn én fil.",
  ],
  goal: "Legg til en *document view* i Studio som viser gjenstanden slik spillet ser den.",
  goalPreview: {
    before: "I dag har et item bare skjemaet.",
    after:
      "Etterpå har det en ekstra fane, «I spillet», med ridderen og våpenet.",
  },
  where:
    "I editoren din: `sanity.config.ts` (kommentaren `QUEST: Luke 5`), og en ny fil for selve visningen. Legg den for eksempel i `src/sanity/studio/`.",
  hints: [
    {
      text: "Lag en ny komponent som tar imot `document` som prop. Verdiene ligger i `document.displayed`, også mens du skriver.",
      link: {
        label: "Displaying document data",
        url: `${DOCS}/create-custom-document-views-with-structure-builder#k62b9d3ceb281`,
      },
    },
    {
      text: "Spillet har en ferdig `<KnightPreview spriteId={…} kind={…} />` i `src/components/KnightPreview.tsx`. Bruk den i komponenten din.",
    },
    {
      text: "Gi `structureTool()` i `sanity.config.ts` en `defaultDocumentNode` som returnerer `S.document().views([...])`.",
      link: {
        label: "Custom document views",
        url: `${DOCS}/create-custom-document-views-with-structure-builder`,
      },
    },
    {
      text: "Lista må ha både skjemaet, `S.view.form()`, og din egen, `S.view.component(...)`. Bare items skal ha den nye fanen: sjekk `schemaType`.",
      link: {
        label: "Views for specific types",
        url: `${DOCS}/create-custom-document-views-with-structure-builder#k452c82554fbd`,
      },
    },
  ],
  learn: {
    label: "Interactive previews",
    url: `${LEARN}/studio-excellence/intelligent-integrations`,
  },
  lesson: {
    title: "*Document views*",
    text: "*Structure tool* lar et *document* ha flere faner. En `S.view.component` får dokumentets verdier mens du skriver, og kan vise hva som helst du kan bygge i React.",
  },
  checkedBy: "code",
  bonus: true,
  check: fromCode("the-proving-room"),
};

// Belongs to week 3 (listed in its teaser), so it's not in any chapter yet.
export const theForgeButton: Quest = {
  id: "the-forge-button",
  door: 6,
  title: "Document action: egen Smi-knapp",
  intro: [
    "Lag en egen knapp i Studio, «Smi», som setter tidspunktet våpenet ble smidd og publiserer det. Ha spillet åpent ved siden av, så ser du smia lyse opp.",
  ],
  goal: "Lag en *document action* «Smi» som setter `forgedAt` og publiserer gjenstanden.",
  where:
    "`sanity.config.ts`: se etter kommentaren `QUEST: Luke 6`. Selve *action*-en kan ligge i en egen fil.",
  hints: [
    {
      text: "*Document actions* settes opp i `sanity.config.ts`, under `document.actions`.",
      link: {
        label: "Registering document actions",
        url: `${DOCS}/document-actions#k3254d0188d3e`,
      },
    },
    {
      text: "`useDocumentOperation` gir deg `patch` og `publish`.",
      link: {
        label: "Update a value then publish",
        url: `${DOCS}/document-actions#k362c883e4421`,
      },
    },
    {
      text: "Spillet ser etter en publisert gjenstand med `forgedAt`, et `datetime`-felt.",
      link: { label: "Datetime type", url: `${DOCS}/datetime-type` },
    },
  ],
  learn: { label: "Document actions", url: `${DOCS}/document-actions` },
  lesson: {
    title: "*Document actions*",
    text: "Knappene nederst i et *document* er *document actions*. Du kan legge til egne, bytte ut de innebygde som *Publish*, og endre og publisere med `useDocumentOperation`.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ items }) => {
    const stamped = items.some((i) => i.source === "sanity" && i.forgedAt);
    return {
      done: stamped,
      message: stamped
        ? undefined
        : "Ingen publisert gjenstand har et `forgedAt`-stempel ennå.",
    };
  },
};

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    title: "Studio",
    quests: [
      theBrokenForge,
      brannsLedger,
      theGuildsLaw,
      theDrawingBoard,
      theProvingRoom,
    ],
  },
  {
    number: 2,
    title: "Innholdsmodellering",
    quests: [],
    teaser: [
      "Ny document type",
      "References",
      "GROQ",
      "Bilder og assets",
      "Bonus: migrering",
      "Bonus: TypeGen",
    ],
  },
  {
    number: 3,
    title: "Utover skjemaet",
    quests: [],
    teaser: [
      "Singleton",
      "Portable Text",
      "Document action: Smi-knapp",
      "Functions",
      "Webhook",
      "Bonus: Agent Actions",
      "Bonus: plugin",
    ],
  },
];
