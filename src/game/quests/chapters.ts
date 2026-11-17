import { caseFileScore, linkScore, sourceCheckScore } from "../archive";
import {
  isNewOrder,
  isReadyOrder,
  signHasHttpsLink,
  signHasStrong,
} from "../bakery";
import type { GameItemView } from "../items";
import type { Chapter, CheckResult, Quest, QuestContext } from "./types";

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

const weaponDescription: Quest = {
  id: "weapon-description",
  track: "nonTechnical",
  door: 2,
  title: "Samme tekst, to steder",
  topic: "Innhold og presentasjon",
  intro: [
    "Våpenet virker, men ingen vet hva som er spesielt med det. Jeg vil beskrive det både i våpenkassa og på tavla i smia.",
    "Skriv minst én hel setning i *Description* på våpenet ditt, og trykk *Publish*. Den samme teksten får ulik form på de to stedene.",
  ],
  outro: [
    "Nå står den samme beskrivelsen både på våpenet og på tavla.",
    "Prøv å endre den én gang til og publiser. Begge stedene følger med.",
  ],
  goal: "Endre våpenets beskrivelse, skriv minst én hel setning, og publiser.",
  goalPreview: {
    before: "Våpenet har ingen forklaring.",
    after: "Én beskrivelse vises både på våpenet og tavla.",
  },
  where: "I Sanity Studio, på våpenet du publiserte i første luke.",
  hints: [
    {
      text: "Åpne våpenet ditt og finn feltet *Description*.",
      link: { label: "String type", url: `${DOCS}/string-type` },
    },
    {
      text: "Skriv minst én hel setning. Tavla viser bare den første setningen.",
      link: {
        label: "Content Lake",
        url: "https://www.sanity.io/docs/content-lake",
      },
    },
    {
      text: "Trykk *Publish*. Et utkast endrer ikke våpenkassa eller tavla.",
      link: {
        label: "Drafts og publisering",
        url: "https://www.sanity.io/docs/content-lake/drafts-and-versions",
      },
    },
  ],
  learn: {
    label: "Content Lake",
    url: "https://www.sanity.io/docs/content-lake",
  },
  lesson: {
    title: "Innhold er ikke utseende",
    text: "Beskrivelsen er lagret én gang. Våpenkassa viser hele teksten, mens tavla bruker bare første setning og sin egen stil.",
    atWork:
      "Skriv innholdet én gang, så kan nettside, app og nyhetsbrev vise det hver på sin måte.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ items, progress }) => {
    const weapon = items.find(
      (item) => item.id === progress.weaponDescriptionItemId,
    );
    const description = weapon?.description?.trim() ?? "";
    const changed =
      description !== (progress.weaponDescriptionBefore?.trim() ?? "");
    return {
      done: description.length >= 10 && changed,
      message:
        description && description.length < 10
          ? "Skriv minst én hel setning."
          : !description || !changed
            ? "Beskrivelsen er ikke publisert ennå."
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
  where: "I kodevinduet i spillet. Åpne det fra Brann eller kalenderen.",
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
  where: "I kodevinduet i spillet. Åpne det fra Brann eller kalenderen.",
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

// --- Uke 2: Arkivarens mysterium ----------------------------------------------
// Halve bygda vil avlyse markedet. Arkivaren har samlet observasjoner, men
// trenger hjelp til å skille det som skjedde fra rykter. Teknisk løype spør
// med GROQ i kodevinduet; ikke-teknisk løype sorterer og kobler i eget Studio.
// Begge ender med sporet fra skogkanten til bakeriet. See docs/historie.md.

const GROQ_DOCS = "https://www.sanity.io/docs/groq";

const followTheTrail: Quest = {
  id: "follow-the-trail",
  giver: "arkivaren",
  track: "technical",
  door: 5,
  title: "GROQ: følg sporet",
  intro: [
    "Halve bygda vil avlyse markedet på grunn av alle ryktene. Jeg har femti observasjoner og ingen svar. Hjelp meg å skille det som skjedde fra det folk tror skjedde.",
    "Skriv én GROQ-spørring mot observasjonene mine: bare det som er bekreftet, i tidsrekkefølge, og med stedet. Kartet viser hvor sporet går.",
  ],
  goal: "Skriv en GROQ-spørring som gir de bekreftede observasjonene i tidsrekkefølge, med stedet.",
  where: "I kodevinduet.",
  hints: [
    {
      text: "Et filter står inne i `*[ … ]`. Flere vilkår settes sammen med `&&`.",
      link: { label: "GROQ: filters", url: GROQ_DOCS },
    },
    { text: "`| order(time asc)` etter filteret sorterer radene." },
    {
      text: "`place` er en *reference*. `place->` henter dokumentet den peker på, og `place->{ name, x, y }` velger feltene.",
    },
  ],
  learn: { label: "GROQ", url: GROQ_DOCS },
  lesson: {
    title: "*Filter*, `order` og `->`",
    text: "Et filter avgjør hvilke dokumenter som er med, og det avgjør også konklusjonen. `order()` sorterer, og `->` følger en *reference* til dokumentet den peker på.",
  },
  studioPractice:
    "Vil du prøve i Studio? Åpne *Vision* og kjør den samme spørringen mot ditt eget prosjekt. Der finnes det ingen observasjoner, så prøv den på `item` i stedet.",
  checkedBy: "window",
  reward: { forgeLevel: 1 },
  check: fromWindow("follow-the-trail"),
};

const archiveLists: Quest = {
  id: "archive-lists",
  giver: "arkivaren",
  track: "technical",
  door: 6,
  title: "Structure: Arkivarens lister",
  intro: [
    "For et kart! Jeg har hengt opp noen frivillige GROQ-spørsmål på skiltet ved torget, hvis du vil ha mer. Men først: jeg kan ikke skrive GROQ hver gang jeg skal lete.",
    "Lag to lister i Studio med *Structure Builder*: «Bare bekreftede» og «Per sted». Filtrene er de samme som i spørringen din.",
  ],
  goal: "Lag listene «Bare bekreftede» og «Per sted» med *Structure Builder*.",
  where: "I kodevinduet.",
  hints: [
    {
      text: "Et punkt i lista er `S.listItem().title(…).child(…)`. Barnet kan være en `S.documentList()` med `.filter(…)`.",
      link: {
        label: "Structure Builder",
        url: `${DOCS}/structure-builder-introduction`,
      },
    },
    {
      text: '«Per sted» kan starte med `S.documentTypeList("place")`. Dens `.child((placeId) => …)` får id-en til stedet du klikker på.',
    },
    {
      text: "Gi id-en videre som en parameter: `.filter('_type == \"observation\" && references($placeId)').params({ placeId })`.",
    },
  ],
  learn: {
    label: "Structure Builder",
    url: `${DOCS}/structure-builder-introduction`,
  },
  lesson: {
    title: "*Structure Builder*",
    text: "Lista til venstre i Studio er kode. Med `S.documentList().filter()` blir en GROQ-spørring en liste redaktørene kan klikke seg gjennom, uten å skrive GROQ selv.",
  },
  studioPractice:
    "Åpne Studio. Listene «Bare bekreftede» og «Per sted» står øverst. Last Studio på nytt hvis du ikke ser dem.",
  checkedBy: "window",
  reward: { forgeLevel: 1 },
  check: fromWindow("archive-lists"),
};

const whoPointsHere: Quest = {
  id: "who-points-here",
  giver: "arkivaren",
  track: "technical",
  door: 7,
  title: "Document view: hvem peker hit?",
  intro: [
    "Når jeg åpner Bakeriet i Studio, står det ingenting om hva som er sett der. Stedet vet ikke hva som peker på det.",
    "Lag en egen fane på steder, en *document view*, som henter observasjonene som peker hit.",
  ],
  goal: "Lag en *document view* som viser observasjonene som peker på stedet du har åpnet.",
  where: "I kodevinduet.",
  hints: [
    {
      text: "`client.fetch(query, params)` gir et løfte. Send resultatet til `setRows` med `.then(setRows)`.",
      link: {
        label: "Component views",
        url: `${DOCS}/create-custom-document-views-with-structure-builder`,
      },
    },
    { text: "`references($id)` er sant for dokumenter som peker på `$id`." },
    {
      text: "Gi id-en som parameter: `{ id: props.documentId }`. `props.document.displayed._id` kan være en *draft*-id.",
    },
  ],
  learn: {
    label: "Document views",
    url: `${DOCS}/create-custom-document-views-with-structure-builder`,
  },
  lesson: {
    title: "*References* går én vei",
    text: "Et dokument vet ikke hva som peker på det. Med `references($id)` spør du etter det, og en *document view* kan vise svaret rett i Studio.",
  },
  studioPractice:
    "Åpne et sted i Studio, for eksempel Bakeriet, og velg fanen «Observasjoner her». Last Studio på nytt hvis fanen ikke vises.",
  checkedBy: "window",
  reward: { forgeLevel: 1 },
  check: fromWindow("who-points-here"),
};

// Optional: five GROQ questions gathered in one luke. It opens with the GROQ
// luke done and waits on the signpost by the square, where Arkivaren hung it.
const archiveQuestions: Quest = {
  id: "archive-questions",
  track: "technical",
  door: 8,
  title: "Arkivarens spørsmål",
  villageSite: "noticeboard",
  intro: [
    "Arkivaren har hengt opp fem spørsmål om observasjonene på skiltet. Svar på så mange du vil, med GROQ.",
  ],
  goal: "Svar på Arkivarens fem spørsmål med GROQ. Hvert svar gir en gjenstand.",
  where: "På skiltet ved torget. Etterpå i kodevinduet.",
  hints: [
    {
      text: "Hvert spørsmål har sin egen `svar`-konstant. Resultatet vises med en gang, og du kan ta dem i hvilken rekkefølge du vil.",
    },
    {
      text: "Tell med `count(…)`. En underspørring inne i en projeksjon kan bruke `^` for dokumentet utenfor.",
    },
  ],
  learn: { label: "GROQ", url: GROQ_DOCS },
  lesson: {
    title: "GROQ: tell, sammenlign og `^`",
    text: "`count()` teller, et filter kan sammenligne tekst som tidspunkter, og `^` i en underspørring peker på dokumentet utenfor. Da kan én spørring svare på spørsmål om hele datasettet.",
  },
  checkedBy: "window",
  bonus: true,
  check: fromWindow("archive-questions"),
};

function waitingForArchive(
  archive: QuestContext["archive"],
): CheckResult | null {
  if (archive == null)
    return {
      done: false,
      message: "Henter Arkivarens observasjoner fra prosjektet ditt…",
    };
  if (archive.length === 0)
    return {
      done: false,
      message:
        "Arkivarens observasjoner er ikke i Studio ennå. Spillet legger dem inn når luka er gitt.",
    };
  return null;
}

const sourceCheck: Quest = {
  id: "source-check",
  giver: "arkivaren",
  track: "nonTechnical",
  door: 2,
  title: "Kildesjekk",
  intro: [
    "Halve bygda vil avlyse markedet på grunn av alle ryktene. Jeg vil ha fakta først, og jeg trenger hjelp til å sortere.",
    "Ni observasjoner i Studio har status *Unknown*. Regelen min: bekreftet hvis den har et bilde, eller hvis et *annet* vitne så det samme stedet. Ellers er det et rykte.",
  ],
  goal: "Gi de ni observasjonene riktig *Status* etter Arkivarens regel, og publiser dem.",
  where: "I Sanity Studio, under *Observation* eller «Per sted».",
  hints: [
    {
      text: "Åpne «Per sted» i Studio. Da ser du hvilke observasjoner som hører til samme sted.",
    },
    {
      text: "Se på *Witness* også. Det teller bare hvis det er et *annet* vitne.",
    },
    {
      text: "Husk *Publish* på hver av dem. Spillet ser bare publiserte dokumenter.",
    },
  ],
  lesson: {
    title: "Innhold som henger sammen",
    text: "Et felt alene sier ikke alt. *References* til sted og vitne gjør at du kan se hva som hører sammen, og et filter finner bare det som er registrert riktig.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ archive }) => {
    const waiting = waitingForArchive(archive);
    if (waiting) return waiting;
    const { right, total } = sourceCheckScore(archive!);
    return {
      done: right === total,
      objectives: [
        {
          label: `${right} av ${total} har riktig publisert status`,
          done: right === total,
        },
      ],
    };
  },
};

const linkThePlace: Quest = {
  id: "link-the-place",
  giver: "arkivaren",
  track: "nonTechnical",
  door: 3,
  title: "Koble til stedet",
  intro: [
    "Tre bekreftede observasjoner har stedet skrevet som tekst: «bakriet», «ved smia, tror jeg». Da finner ingen liste dem.",
    "Velg riktig *Place* i hver av dem, så havner de på kartet og under «Per sted».",
  ],
  goal: "Gi de tre observasjonene med stedet som tekst en *reference* til riktig sted, og publiser.",
  where: "I Sanity Studio, under *Observation*.",
  hints: [
    {
      text: "Observasjonene det gjelder, har feltet *Place (as written down)*.",
    },
    {
      text: "Feltet *Place* over er en *reference*. Begynn å skrive navnet på stedet, og velg det fra lista.",
    },
    { text: "Husk *Publish*." },
  ],
  learn: { label: "Reference type", url: `${DOCS}/reference-type` },
  lesson: {
    title: "*References* i stedet for tekst",
    text: "Tekst kan staves på mange måter. En *reference* peker på ett bestemt dokument, så lister og spørringer finner det igjen.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ archive }) => {
    const waiting = waitingForArchive(archive);
    if (waiting) return waiting;
    const { right, total } = linkScore(archive!);
    return {
      done: right === total,
      objectives: [
        {
          label: `${right} av ${total} peker på riktig sted`,
          done: right === total,
        },
      ],
    };
  },
};

const caseFile: Quest = {
  id: "case-file",
  giver: "arkivaren",
  track: "nonTechnical",
  door: 4,
  title: "Saksmappa",
  intro: [
    "Jeg vil samle alt om det store sporet på ett sted, så hele bygda kan lese det før markedet.",
    "Lag en *Case* i Studio og legg inn alle de bekreftede observasjonene, også de tre du koblet til et sted. Ingen rykter.",
  ],
  goal: "Lag og publiser en *Case* med alle de bekreftede observasjonene, og ingen rykter.",
  where: "I Sanity Studio, under *Case*.",
  hints: [
    {
      text: "Lista «Bare bekreftede» i Studio viser hvilke observasjoner som skal med.",
    },
    {
      text: "Feltet *Observations* er en liste av *references*. Trykk «Add item» og søk etter observasjonen du vil legge til.",
    },
    { text: "Husk *Publish*. Spillet ser bare publiserte dokumenter." },
  ],
  learn: { label: "Array of references", url: `${DOCS}/array-type` },
  lesson: {
    title: "En liste av *references*",
    text: "Én *Case* kan peke på mange observasjoner uten å kopiere dem. Endrer du en observasjon, er mappa fortsatt oppdatert.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ archiveCases }) => {
    if (archiveCases == null)
      return {
        done: false,
        message: "Henter saksmappene fra prosjektet ditt…",
      };
    const { right, wrong, total } = caseFileScore(archiveCases);
    const done = right === total && wrong === 0;
    return {
      done,
      objectives: [
        {
          label: `${right} av ${total} bekreftede er med`,
          done: right === total,
        },
        {
          label:
            wrong === 0
              ? "Ingen rykter i mappa"
              : `${wrong} rykte${wrong === 1 ? "" : "r"} i mappa`,
          done: wrong === 0,
        },
      ],
    };
  },
};

const bakerTemplate: Quest = {
  id: "baker-template",
  giver: "bakeren",
  track: "technical",
  door: 9,
  title: "Initial value: ny bestilling",
  intro: [
    "Hver ny bestilling begynner likt. Jeg skriver status og dato om igjen, selv om de allerede er kjent.",
    "Brann vil ha lussekatter, Arkivaren pepperkaker og Kari julekake. De ligger allerede som eksempler, men nye lapper kommer hele tiden.",
    "Kan du gi meg en *initial value* som fyller dem ut når jeg lager en ny bestilling? Åpne kodevinduet.",
  ],
  outro: [
    "Nå slipper jeg å skrive datoen på hver nye lapp.",
    "Neste gang jeg åpner en bestilling, står startverdiene der allerede.",
  ],
  goal: "Gi en ny bestilling status «ny» og dagens dato fra start.",
  goalPreview: {
    before: "En ny lapp mangler dato og status.",
    after: "Nye lapper starter med dagens dato og «ny».",
  },
  where: "I kodevinduet hos Bakeren. Prøv den ferdige malen i Studio etterpå.",
  hints: [
    {
      text: "`initialValue` på en *document type* brukes når et nytt dokument opprettes, ikke når et gammelt redigeres.",
      link: {
        label: "Initial Value Templates",
        url: `${DOCS}/initial-value-templates`,
      },
    },
    {
      text: 'Returner et objekt med `status` og `date` fra funksjonen. Statusen skal være `"ny"`.',
    },
    {
      text: "Kall `bakeryToday()` inne i `initialValue`-funksjonen, så datoen ikke låses til dagen du skrev koden.",
    },
  ],
  learn: {
    label: "Initial Value Templates",
    url: `${DOCS}/initial-value-templates`,
  },
  lesson: {
    title: "*Initial value*",
    text: "En *initial value* fyller ut nye dokumenter når de opprettes. Endrer du et eksisterende dokument, beholder det verdiene sine. Kodevinduet testet malen din; Studio bruker vår ferdige versjon.",
  },
  checkedBy: "window",
  studioPractice:
    "Åpne en ny bestilling i Studio. Status og dagens dato skal allerede stå der; fyll inn en vare hvis du vil.",
  check: fromWindow("baker-template"),
};

const bakerForge: Quest = {
  id: "baker-forge",
  giver: "bakeren",
  track: "technical",
  door: 10,
  title: "Document action: Smi",
  intro: [
    "Brann må sette tidspunkt og publisere for hånd hver gang et våpen er klart.",
    "Han kommer inn fra smia med sot på hendene og rekker ikke både å stemple og å trykke Publish.",
    "Lag én *document action* som stempler `forgedAt` og publiserer våpenet. Bruk kodevinduet.",
  ],
  outro: [
    "Brann kan nå smi og publisere i ett trykk.",
    "Publish er der fortsatt når han bare skal publisere som vanlig.",
  ],
  goal: "Lag en Smi-action som stempler og publiserer et våpen i ett trykk.",
  goalPreview: {
    before: "Våpenet mangler smitidspunkt.",
    after: "Smi stempler våpenet og publiserer det.",
  },
  where:
    "I kodevinduet hos Bakeren. Prøv den ferdige Smi-knappen i Studio etterpå.",
  hints: [
    {
      text: "En *document action* returnerer blant annet `label` og `onHandle`.",
      link: { label: "Document actions", url: `${DOCS}/document-actions` },
    },
    {
      text: "`useDocumentOperation(props.id, props.type)` gir `patch` og `publish`.",
    },
    {
      text: "Kall `patch.execute([{ set: { forgedAt: new Date().toISOString() } }])` før `publish.execute()`.",
    },
  ],
  learn: { label: "Document actions", url: `${DOCS}/document-actions` },
  lesson: {
    title: "*Document action*",
    text: "En *document action* legger et nytt arbeidssteg i Studio. Kodevinduet sjekket både stempel og publisering; spillet kan ikke se hvilket knappetrykk som skapte feltet. Studio bruker vår trygge Smi-versjon.",
  },
  checkedBy: "window",
  studioPractice:
    "Åpne et våpen i Studio og prøv Smi. Et materiale skal ikke kunne smis.",
  check: fromWindow("baker-forge"),
};

const bakerFunction: Quest = {
  id: "baker-function",
  giver: "bakeren",
  track: "technical",
  door: 11,
  title: "Sanity Function: skiltet",
  intro: [
    "Markedet nærmer seg. Tenk om bodskiltet kunne reagere når en bestilling publiseres?",
    "Noen ganger kommer samme beskjed to ganger. Da skal skiltet ikke skrives om to ganger.",
    "Lag hendelseslogikken i kodevinduet. Vi simulerer publisering med en falsk klient; ingenting deployes til prosjektet ditt.",
  ],
  outro: [
    "Simuleringen reagerte på riktig publisering.",
    "Ingen bestilling eller skilt ble endret i prosjektet ditt.",
  ],
  goal: "Oppdater skiltet ved publisering av en bestilling, men ikke ved andre hendelser eller gjentakelser.",
  goalPreview: {
    before: "Hver hendelse ville skrevet om skiltet.",
    after: "Bare nye publiseringer endrer det – i simuleringen.",
  },
  where: "I kodevinduet hos Bakeren – ikke i Sanity Studio.",
  hints: [
    {
      text: "Sjekk `event.transition` og `event.document._type` før du henter skiltet. Tom vare må ignoreres.",
    },
    {
      text: '`getDocument("bakery-sign")` returnerer skiltet. Sammenlign tekstspennet der med den nye `text`-verdien.',
    },
    {
      text: "Legg inn `return` når hendelsen er feil, og når `sign?.text?.[0]?.children?.[0]?.text === text`. Resten av oppdateringen er klar.",
    },
  ],
  learn: { label: "Sanity Functions", url: `${DOCS}/functions` },
  lesson: {
    title: "Hendelser uten dobbeltarbeid",
    text: "Dette var en simulering av hvordan en ekte Sanity Function ville reagert på en publisering. Ingen Function ble deployet eller kjørt i prosjektet ditt. Sanity Functions finnes også på Free-planen, men skiltet i bygda endres bare når du publiserer et ekte bodskilt i Studio.",
  },
  checkedBy: "window",
  check: fromWindow("baker-function"),
};

const bakerFirstOrder: Quest = {
  id: "baker-first-order",
  giver: "bakeren",
  track: "nonTechnical",
  door: 5,
  title: "Initial value template: ny bestilling",
  intro: [
    "Brann har bestilt lussekatter, Arkivaren pepperkaker og Kari julekake. De tre ventelappene ligger i Studio.",
    "Hver *ny* bestilling må ha dato og status. Jeg har laget en mal som fyller inn begge deler – ventelappene teller ikke som din nye bestilling.",
    "Lag din egen *Ny bestilling* i Studio, skriv inn varen og trykk *Publish*. Hva står der allerede?",
  ],
  outro: [
    "Der kom lappen din inn sammen med de andre!",
    "Dato og «ny» kom fra malen; varen valgte du selv.",
  ],
  goal: "Lag og publiser en ny bestilling med vare, status «ny» og dato.",
  goalPreview: {
    before: "Eksempelbestillingene venter; din lapp er tom.",
    after: "Din publiserte bestilling har vare, dato og status «ny».",
  },
  where: "I ditt eget Sanity Studio, under *Ny bestilling*.",
  hints: [
    {
      text: "Åpne *Ny bestilling* i Studio. Den ferdige malen fyller ut dato og status når du oppretter et nytt dokument.",
      link: {
        label: "Initial Value Templates",
        url: `${DOCS}/initial-value-templates`,
      },
    },
    {
      text: "Skriv en vare i feltet *Vare*. Du kan beholde malens status «ny» og datoen.",
    },
    { text: "Trykk *Publish*; utkast er ikke synlige for spillet." },
  ],
  learn: {
    label: "Initial Value Templates",
    url: `${DOCS}/initial-value-templates`,
  },
  lesson: {
    title: "En mal starter dokumentet",
    text: "En *initial value template* gir nye dokumenter startverdier, men du kan endre dem før publisering. Spillet sjekket den publiserte bestillingen; det kan ikke vite hvilken mal du brukte.",
  },
  checkedBy: "game",
  check: ({ bakeryOrders }) => ({
    done: Boolean(bakeryOrders?.some(isNewOrder)),
    message:
      bakeryOrders === null
        ? "Henter publiserte bestillinger fra prosjektet ditt…"
        : "Publiser en ny bestilling med vare, dato og status «ny».",
  }),
};

const bakerSign: Quest = {
  id: "baker-sign",
  giver: "bakeren",
  villageSite: "bakerySign",
  track: "nonTechnical",
  door: 6,
  title: "Portable Text: bodskiltet",
  intro: [
    "Bestillingen er på plass, men boden mangler et skilt.",
    "Folk går forbi uten å se hva som er nystekt. Et tydelig ord vil få dem til å stanse.",
    "Skriv skiltet i Studio, gjør det viktigste ordet fett og trykk *Publish*. Da kan alle se det ved bakeriet.",
  ],
  outro: [
    "Nå kan folk se hva som selges før de går inn.",
    "Det fete ordet gjør skiltet lettere å lese fra stien.",
  ],
  goal: "Skriv og publiser et bodskilt med fremhevet tekst.",
  goalPreview: {
    before: "Boden har et tomt skilt.",
    after: "Det publiserte skiltet har et fremhevet ord.",
  },
  where:
    "Hent oppgaven ved bodskiltet utenfor bakeriet. Skriv deretter i ditt eget Sanity Studio under *Bodskilt*.",
  hints: [
    {
      text: "Åpne *Bodskilt* i Studio. Feltet *Skilttekst* er *Portable Text*: det kan ha tekst med formatering.",
      link: { label: "Portable Text", url: `${DOCS}/block-content` },
    },
    {
      text: "Skriv tekst, marker et ord og velg fet skrift. Hele teksten skal ikke være tom.",
    },
    {
      text: "Trykk *Publish*. Bare den publiserte teksten vises på skiltet i bygda.",
    },
  ],
  learn: { label: "Portable Text", url: `${DOCS}/block-content` },
  lesson: {
    title: "*Portable Text*",
    text: "En tekstblokk kan inneholde ord med egne *marks*, som fet skrift. Spillet leste det publiserte skiltet og viste teksten ved bakeriet; et utkast ville ikke dukket opp.",
  },
  checkedBy: "game",
  check: ({ bakerySign }) => ({
    done: signHasStrong(bakerySign ?? null),
    message: "Publiser et bodskilt med tekst og minst ett ord i fet skrift.",
  }),
};

const bakerReady: Quest = {
  id: "baker-ready",
  giver: "bakeren",
  track: "nonTechnical",
  door: 7,
  title: "Document action: Klar",
  intro: [
    "Skiltet er på plass. Nå skal den første bestillingen bli ferdig.",
    "Finn bestillingen *du* publiserte i første luke, ikke de tre ventelappene.",
    "Åpne den i Studio og velg *Klar* i menyen ved siden av *Publish*. Knappen setter status og publiserer i ett trykk.",
  ],
  outro: [
    "Din bestilling er klar til å hentes!",
    "Vi brukte ett trykk i stedet for å endre status og publisere hver for seg.",
  ],
  goal: "Merk en bestilling som «klar» og publiser den.",
  goalPreview: {
    before: "Din bestilling er publisert med status «ny».",
    after: "Klar publiserer den samme bestillingen med status «klar».",
  },
  where: "I ditt eget Sanity Studio, under *Ny bestilling*.",
  hints: [
    {
      text: "Åpne bestillingen du laget i første luke. *Klar* er en *document action* i menyen ved siden av *Publish*.",
      link: { label: "Document actions", url: `${DOCS}/document-actions` },
    },
    {
      text: "Knappen er tilgjengelig når bestillingen har en vare. Du trenger ikke skrive kode.",
    },
    {
      text: "Trykk *Klar*: den oppdaterer status og publiserer. Kontroller at den publiserte bestillingen står som «klar».",
    },
  ],
  learn: { label: "Document actions", url: `${DOCS}/document-actions` },
  lesson: {
    title: "*Document action* i praksis",
    text: "Ett trykk kan både endre et felt og publisere dokumentet. Spillet leste den publiserte statusen «klar»; det kan ikke vite hvilken knapp som ble brukt.",
  },
  checkedBy: "game",
  check: ({ bakeryOrders, progress }) => ({
    done: Boolean(
      progress.bakeryOrderId &&
      bakeryOrders?.some(
        (order) => order._id === progress.bakeryOrderId && isReadyOrder(order),
      ),
    ),
    message:
      "Bruk Klar på den samme bestillingen som i første luke; den må være publisert med status «klar».",
  }),
};

const bakerLink: Quest = {
  id: "baker-link",
  giver: "bakeren",
  villageSite: "bakerySign",
  bonus: true,
  door: 0,
  title: "☆ En lenke på skiltet",
  intro: [
    "Noen gjester vil vite mer om det vi selger. Et lenket ord på skiltet kan vise dem veien.",
    "De som spør om oppskriftene, trenger en vei videre enn selve boden.",
    "Dette er frivillig ☆: legg en relevant HTTPS-lenke på tekst i bodskiltet og publiser.",
  ],
  outro: [
    "Nå kan folk følge et ord på skiltet videre.",
    "En lenke i et tekstspenn er noe mer enn en adresse skrevet med bokstaver.",
  ],
  goal: "Legg en HTTPS-lenke på et ord i bodskiltet og publiser. Frivillig ☆.",
  goalPreview: {
    before: "Skiltet har bare vanlig tekst.",
    after: "Et markert ord har en publisert HTTPS-lenke.",
  },
  where:
    "Hent ☆ ved bodskiltet utenfor bakeriet. Legg deretter lenken til i ditt eget Sanity Studio.",
  hints: [
    {
      text: "Åpne skiltet i Studio, marker et ord og legg på *Lenke* (annotation).",
      link: { label: "Portable Text", url: `${DOCS}/block-content` },
    },
    {
      text: "Bruk en relevant adresse som begynner med `https://`. En URL skrevet som vanlig tekst teller ikke.",
    },
    {
      text: "Publiser skiltet etter endringen. Bare publiserte lenker kan sjekkes.",
    },
  ],
  learn: { label: "Portable Text annotations", url: `${DOCS}/block-content` },
  lesson: {
    title: "☆ En annotert lenke",
    text: "En *annotation* knytter lenke-data til et markert tekstspenn. Spillet sjekket den publiserte lenken; om målet er nyttig for gjestene må du vurdere selv.",
  },
  checkedBy: "game",
  check: ({ bakerySign }) => ({
    done: signHasHttpsLink(bakerySign ?? null),
    message:
      "Publiser skiltet med en HTTPS-lenke på et markert ord. Ren URL i teksten teller ikke.",
  }),
};

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    title: "Studio",
    quests: [
      theBrokenForge,
      weaponDescription,
      brannsLedger,
      theGuildsLaw,
      theDrawingBoard,
    ],
  },
  {
    number: 2,
    title: "Finne",
    quests: [
      followTheTrail,
      archiveQuestions,
      archiveLists,
      whoPointsHere,
      sourceCheck,
      linkThePlace,
      caseFile,
    ],
  },
  {
    number: 3,
    title: "Automatisere",
    quests: [
      bakerTemplate,
      bakerForge,
      bakerFunction,
      bakerFirstOrder,
      bakerSign,
      bakerReady,
      bakerLink,
    ],
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
