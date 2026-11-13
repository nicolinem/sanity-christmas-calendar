import type { GameItemView } from "../items";
import type {
  Chapter,
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

// The code window judges these tasks; trying the result in Studio is optional.
function fromWindow(id: string) {
  return ({ progress }: QuestContext): CheckResult => {
    const solved = Boolean(progress.solved[id]);
    return {
      done: solved,
      objectives: [{ label: "Koden er bestått", done: solved }],
    };
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
  track: "technical",
  door: 2,
  title: "Ikon og preview i lista",
  villageSite: "noticeboard",
  intro: [
    "I går skulle jeg finne den nye øksa i Studio, men lista viser bare navn. Jeg åpnet tre sverd før jeg endelig fant den.",
    "Jeg har hengt våpenlista på oppslagstavla. Velg et ikon for Item, og vis navn og bilde for hvert våpen, så jeg slipper å lete neste gang.",
  ],
  goal: "Velg et `icon` for *Item*, og vis navn og sprite i hvert våpens *preview*.",
  goalPreview: {
    before: "I dag viser lista bare navn.",
    after: "Etterpå ser du bildet og typen til hvert våpen.",
  },
  where:
    "I kodevinduet i spillet. Åpne det fra Brann eller kalenderen.",
  hints: [
    {
      text: "En *schema type* kan ha et `icon`. Det er ett merke for hele dokumenttypen, ikke for hvert våpen. Det lista viser for hvert våpen, styres av `preview`.",
      link: {
        label: "Document type properties",
        url: `${DOCS}/document-type#fadba8b5-f0d1-4f90-a181-e14aca95598e`,
      },
    },
    {
      text: 'Du velger selv hvilket ikon som passer for *Item*. Sanity sitt eget ikonsett følger med Studio, og hvert ikon har sin egen sti: `import { BoltIcon } from "@sanity/icons/Bolt"`.',
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
  studioPractice:
    "Vil du se det i Studio? Finn ikonet du valgte for *Item*. Åpne dokumentlista, og finn våpenet ditt ved hjelp av navn og sprite.",
  check: fromWindow("branns-ledger"),
};

const theGuildsLaw: Quest = {
  id: "the-guilds-law",
  track: "technical",
  door: 3,
  title: "Validation: regler for våpen",
  villageSite: "westHouse",
  intro: [
    "De i huset vest for brønnen bestilte ei øks, men to våpen hadde samme navn. Et av dem manglet også bilde. Jeg klarte ikke å finne ut hvilket de mente.",
    "Vi må stoppe slike feil før de kommer på lista. Kan du få Studio til å nekte våpen uten sprite og navn som allerede er i bruk?",
  ],
  goal: "Få Studio til å nekte våpen uten sprite og gjenstander uten navn eller med navn som allerede er brukt.",
  goalPreview: {
    before: "I dag kan et våpen uten sprite publiseres.",
    after: "Etterpå sier Studio fra og stopper Publish.",
  },
  where:
    "I kodevinduet i spillet. Åpne det fra Brann eller kalenderen.",
  hints: [
    {
      title: "Bare våpen trenger sprite",
      text: "Et våpen uten sprite skal stoppes. Materialer uten sprite og våpen med sprite skal fortsatt være lov. Bruk `context.document` for å sjekke typen. Du velger selv hvordan regelen skrives.",
      steps: [
        "Nekt bare når `kind` er `weapon` og `sprite` mangler.",
        "La materialer uten sprite passere.",
        "La våpen med sprite passere.",
      ],
      link: {
        label: "Validating against other fields",
        url: `${DOCS}/validation#k1d8eb8fbb695`,
      },
    },
    {
      title: "Sjekk unike navn",
      text: "På Validation-siden: bla til `Enforce a unique field value`. Les eksemplet der og sammenlign det med hjelperne i `guild.ts`.",
      link: {
        label: "Enforce a unique field value",
        url: `${DOCS}/validation`,
      },
    },
    {
      title: "Bruk de ferdige hjelperne",
      text: "`guild.ts` viser `isNameTaken(...)`, `SAME_NAME_QUERY` og `sameNameParams(...)`. De tar seg av søket og at dokumentet ikke finner seg selv.",
      steps: [
        "Hent klienten fra `context.getClient(...)`.",
        "Vent på `isNameTaken(client, name, document._id)`.",
        "Godta et ledig navn; returner en tekst for et navn som er tatt.",
      ],
      link: {
        label: "Enforce a unique field value",
        url: `${DOCS}/validation`,
      },
    },
  ],
  learn: {
    label: "Validation",
    url: "https://www.sanity.io/docs/studio/validation",
  },
  lesson: {
    title: "*Validation* med `context`",
    text: "Validation-regler stopper *Publish* i Studio, men er ingen databasebegrensning: API-mutasjoner sjekkes ikke. `rule.custom()` får verdien og en `context` med hele dokumentet. En `error` stopper *Publish*; en `warning` gjør det ikke.",
  },
  checkedBy: "window",
  studioPractice:
    "Vil du teste i Studio? Lag et *Weapon* uten sprite og prøv *Publish*. Prøv også uten navn og med et navn som allerede finnes. Studio skal nekte alle tre. Slett utkastene etterpå.",
  check: fromWindow("the-guilds-law"),
};

const theDrawingBoard: Quest = {
  id: "the-drawing-board",
  track: "technical",
  door: 4,
  title: "Custom input: bygg en visuell spritevelger",
  intro: [
    "Takk for reglene! Men når jeg velger bilde til et våpen, ser jeg bare en liste med sprite-ID-er. Jeg aner ikke hvilken som er hvilken.",
    "Kan du gi meg bildeknapper i stedet? Startfila finner allerede bildene som passer. Du viser dem, markerer valget og lar meg fjerne det igjen. Åpne kodevinduet når du er klar.",
  ],
  goal: "Bygg én bildeknapp for hver tillatte sprite. Vis bare ikonet, marker valget, og la det kunne fjernes.",
  goalPreview: {
    before: "I dag vises sprite-ID-ene som tekst.",
    after: "Etterpå velger du fra ikonknapper med tydelig valgt tilstand.",
  },
  where: "I kodevinduet i spillet. Du kan prøve resultatet i Studio etterpå.",
  hints: [
    {
      text: 'Type-feltet står over sprite-feltet. `useFormValue(["kind"])` leser typen som er valgt i dokumentet; `spriteIdsForItemKind(kind)` gir bare sprite-id-ene som passer. Nysgjerrig på egne Studio-komponenter? Les gjerne videre, men du trenger det ikke for å løse oppgaven.',
      link: {
        label: "Egne komponenter i Sanity Studio (ekstra lesing)",
        url: `${DOCS}/intro-to-custom-studio-components`,
      },
    },
    {
      title: "Vis spritebildet",
      text: "`SpriteImage` er allerede importert. Bytt ID-teksten i `spriteIds.map` med en Sanity UI `Button` per ID, og vis `<SpriteImage spriteId={id} />` i knappen. Du kan bruke `icon`-propen eller legge bildet inni knappen.",
      steps: [
        "Bruk `key={id}` på knappen; ikke vis ID-en som tekst.",
        "I vår ferdige Studio-kode brukes `icon`-propen for å midtstille, men begge måter godtas i kodevinduet.",
        "Du trenger ikke legge til `aria-label` eller `aria-pressed` i kodevinduet.",
      ],
      link: {
        label: "Sanity UI Button",
        url: "https://www.sanity.io/ui/docs/primitive/button",
      },
    },
    {
      title: "Vis valget og oppdater feltet",
      text: 'Sammenlign `props.value` med `id`. Bruk `mode="default"` for valgt og `mode="ghost"` for de andre; unngå `tone="primary"` (blått). Klikket skal sende `props.onChange(set(id))`.',
      link: {
        label: "Form components API reference",
        url: `${DOCS}/form-components-reference`,
      },
    },
    {
      title: "Fjern valget",
      text: "Fjern-knappen skal sende `unset()` til `props.onChange(...)`. Vil du se resultatet i Studio, kan du prøve begge knappene der etterpå.",
      link: {
        label: "Form components API reference",
        url: `${DOCS}/form-components-reference`,
      },
    },
  ],
  learn: {
    label: "Visual string selector field input",
    url: `${DOCS}/developer-guides/create-a-rich-string-selector-field-input`,
  },
  lesson: {
    title: "*Visual string selector*",
    text: "Sanity UI sine `Grid` og `Button` lager valgene. `mode` viser gjeldende verdi med nøytral `tone`; `set(...)` og `unset()` lager patcher som `props.onChange(...)` sender til dokumentet.",
  },
  checkedBy: "window",
  studioPractice:
    "Vil du prøve det i Studio? Åpne våpenet fra første luke, bytt sprite og trykk *Publish*. Se endringen i spillet. Test gjerne også valgene for *Material* og knappen som fjerner valget.",
  check: fromWindow("the-drawing-board"),
};

// Belongs to week 3 (listed in its teaser), so it's not in any chapter yet.
export const theForgeButton: Quest = {
  id: "the-forge-button",
  track: "technical",
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
