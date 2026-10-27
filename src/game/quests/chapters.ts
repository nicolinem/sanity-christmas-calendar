import type { GameItemView } from "../items";
import type { Chapter, CodeCheck, CheckResult, Quest, QuestContext } from "./types";

// The calendar's quests, in the order they unlock. Every quest teaches one new
// Sanity idea. Quests say what to achieve; the hints get gradually closer to
// how. Player-facing text is Norwegian, but developer words stay English and
// are marked: `code` for what you type, *term* for Sanity concepts (see
// src/components/hud/richText.tsx). See docs/utviklingsplan.md.

const DOCS = "https://www.sanity.io/docs/studio";
const LEARN = "https://www.sanity.io/learn/course";

// The newest published weapon that actually hits. Verified purely from fetched
// content, no hardcoding of the specific item.
export function findForgedWeapon(items: GameItemView[]): GameItemView | undefined {
  return items.find((i) => i.source === "sanity" && i.kind === "weapon" && (i.power?.damage ?? 0) > 0);
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
  title: "Den knuste smia",
  intro: [
    "Endelig, en som tør gå ut i denne kulda. Jeg er Brann, smeden i Frostholm. Den lengste natta kom, ilden i smia sloknet, og hvert eneste blad i bygda sprakk av frosten.",
    "Uten tegninger kan jeg ikke smi noe nytt. Men du har Sanity Studio. Det du lager og trykker *Publish* på der, henter jeg rett ut av smia.",
    "Lag et våpen til meg, gi det et navn og en sprite, og publiser det. Så tester vi det på frostdraugen som lusker i lysningen øst for brønnen.",
  ],
  goal: "Lag et våpen i Sanity Studio, trykk *Publish*, og test det på frostdraugen.",
  where: "I Sanity Studio: åpne det fra samtalen med Brann.",
  hints: [
    { text: "Åpne Studio fra samtalen med Brann, og lag et nytt *Item*-dokument." },
    { text: "Velg *Weapon* som *Kind*, gi det et navn, og trykk *Publish*. En *draft* når aldri smia." },
    { text: "Frostdraugen holder til i lysningen øst for brønnen. Gå helt bort til den og trykk mellomrom." },
  ],
  learn: { label: "Hello, Studio", url: `${LEARN}/day-one-with-sanity-studio/hello-studio` },
  lesson: {
    title: "*Draft* og *published*",
    text: "Det du skriver i Studio, er en *draft* helt til du trykker *Publish*. Spillet leser bare publiserte *documents*, og fikk bladet ditt i samme øyeblikk fordi *Content Lake* sender endringer ut i sanntid.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ items, progress, sanityConfigured }) => {
    const forged = findForgedWeapon(items);
    return {
      done: Boolean(forged) && progress.wraithDefeated,
      objectives: [
        { label: "Publiser et våpen i Sanity Studio", done: Boolean(forged) },
        { label: "Beseir frostdraugen i lysningen", done: progress.wraithDefeated },
      ],
      message:
        sanityConfigured === false ? "Smia er ikke koblet til Sanity ennå. Kjør `npm run setup`." : undefined,
    };
  },
};

const brannsLedger: Quest = {
  id: "branns-ledger",
  title: "Branns protokoll",
  intro: [
    "Protokollen min er et rot. Alle bladene ser like ut i dokumentlista i Studio. Gi gjenstandene et ordentlig ikon, og vis hvert blads egen sprite ved siden av navnet.",
  ],
  goal: "Gjør gjenstander lette å kjenne igjen i Studio: et `icon` på *schema type*-en og en *preview* med spriten.",
  where: "`src/sanity/schemaTypes/item.tsx`: se etter kommentaren `QUEST: Branns protokoll`.",
  hints: [
    {
      text: "En *schema type* kan ha et `icon`, og det lista viser styres av `preview`.",
      link: { label: "Document type properties", url: `${DOCS}/document-type#fadba8b5-f0d1-4f90-a181-e14aca95598e` },
    },
    {
      text: "Sanity sitt eget ikonsett følger med Studio: `@sanity/icons`.",
      link: { label: "Sanity Icons", url: "https://icons.sanity.build" },
    },
    {
      text: "`preview.prepare()` kan returnere `media`: en hvilken som helst React-komponent, ikke bare et bilde.",
      link: { label: "React components in previews", url: `${DOCS}/previews-list-views#k75b9321e2389` },
    },
    {
      text: "Du trenger ikke tegne pikselkunsten selv: `<SpriteImage spriteId={…} kind={…} />` i `src/components/SpriteImage.tsx` gjør det.",
    },
  ],
  learn: { label: "Sublime schemas", url: `${LEARN}/studio-excellence/sublime-schemas` },
  lesson: {
    title: "*Previews*",
    text: "`preview.select` henter rå verdier fra dokumentet, og `prepare()` gjør dem om til det lista viser, også en React-komponent som `media`.",
  },
  checkedBy: "code",
  check: fromCode("branns-ledger"),
};

const theGuildsLaw: Quest = {
  id: "the-guilds-law",
  title: "Laugets lov",
  intro: [
    "Smedlauget har to lover. Et våpen uten utseende kan ingen smi, så alle våpen må ha en sprite. Og ingen to blader kan bære samme navn. Få Studio til å nekte begge deler, før de havner på ambolten min.",
  ],
  goal: "Legg til *validation* så Studio nekter våpen uten sprite, og navn som allerede er tatt.",
  where: "`src/sanity/schemaTypes/item.tsx`: se etter kommentaren `QUEST: Laugets lov`.",
  hints: [
    {
      text: "En *validation rule* kan gjøre akkurat det du vil med `rule.custom(...)`.",
      link: { label: "Custom validation", url: `${DOCS}/validation#k091e10f957aa` },
    },
    {
      text: "En *rule* kan se på resten av dokumentet: `context` har `document`. Bare våpen trenger sprite.",
      link: { label: "Validating against other fields", url: `${DOCS}/validation#k1d8eb8fbb695` },
    },
    {
      text: "Duplikater krever *dataset*-et: `context` gir deg `getClient`. Ferdig *GROQ* for å finne tvillinger ligger i `src/sanity/lib/guild.ts`.",
      link: { label: "Asynchronous validation using the client", url: `${DOCS}/validation#k71fb43753fd9` },
    },
    {
      text: "Står du fast på duplikatene? Dokumentasjonen har en oppskrift på akkurat dette.",
      link: { label: "Enforce a unique field value", url: `${DOCS}/validation#u1a4f7c93e21` },
    },
  ],
  learn: { label: "Validation", url: `${DOCS}/validation` },
  lesson: {
    title: "*Validation* med `context`",
    text: "`rule.custom()` får både verdien og en `context`: hele dokumentet, og en klient som kan spørre *dataset*-et. En *rule* som feiler som `error`, stopper *Publish*; en `warning` gjør det ikke.",
  },
  checkedBy: "code",
  check: fromCode("the-guilds-law"),
};

const theDrawingBoard: Quest = {
  id: "the-drawing-board",
  title: "Spritevelgeren",
  intro: [
    "Velge utseendet på et blad fra en liste med ord? Ingen smed jobber sånn. Gi `sprite`-feltet en ordentlig velger, en som viser selve pikselkunsten du velger mellom.",
  ],
  goal: "Lag en *custom input component* for `sprite` som viser pikselkunsten i stedet for en liste med navn.",
  where: "`src/sanity/schemaTypes/item.tsx`: se etter kommentaren `QUEST: Spritevelgeren`.",
  hints: [
    {
      text: "Et *field* kan bytte ut *input component*-en sin med din egen: `components: { input: ... }`.",
      link: { label: "Form components", url: `${DOCS}/form-components#f5793c951d53` },
    },
    {
      text: "Endre verdien med `onChange(set(...))` og `unset()` fra `sanity`.",
      link: { label: "Form components API reference", url: `${DOCS}/form-components-reference` },
    },
    { text: "`SpriteImage` tegner én sprite, og `KNOWN_SPRITE_IDS` i `src/game/sprites.ts` er lista over alle." },
  ],
  learn: { label: "Custom input components", url: `${LEARN}/studio-excellence/custom-form-components` },
  lesson: {
    title: "*Custom input components*",
    text: "Et *field* kan bytte ut *input component*-en sin med `components.input`. Komponenten får verdien, og endrer den med `onChange(set(...))` eller `unset()`.",
  },
  checkedBy: "code",
  check: fromCode("the-drawing-board"),
};

const theProvingRoom: Quest = {
  id: "the-proving-room",
  title: "Prøvestua",
  intro: [
    "Før et blad forlater smia, vil jeg se det i hånda på ridderen. Bygg meg en prøvestue i Studio, en egen fane der jeg ser gjenstanden slik den ser ut i spillet.",
  ],
  goal: "Legg til en *document view* i Studio som viser gjenstanden slik spillet ser den.",
  where: "`sanity.config.ts`: se etter kommentaren `QUEST: Prøvestua`.",
  hints: [
    {
      text: "Et *document* kan ha flere *views*: `S.document().views([...])` i *Structure tool*.",
      link: { label: "Custom document views", url: `${DOCS}/create-custom-document-views-with-structure-builder` },
    },
    {
      text: "En `S.view.component` får dokumentets verdier som props, også mens du skriver (`document.displayed`).",
      link: {
        label: "Displaying document data",
        url: `${DOCS}/create-custom-document-views-with-structure-builder#k62b9d3ceb281`,
      },
    },
    {
      text: "Spillet har en ferdig `<KnightPreview spriteId={…} kind={…} />` i `src/components/KnightPreview.tsx`: ridderen som svinger våpenet.",
    },
    {
      text: "Bare gjenstander trenger prøvestue: *views* kan settes opp per *schema type* (`schemaType`).",
      link: {
        label: "Views for specific types",
        url: `${DOCS}/create-custom-document-views-with-structure-builder#k452c82554fbd`,
      },
    },
  ],
  learn: { label: "Interactive previews", url: `${LEARN}/studio-excellence/intelligent-integrations` },
  lesson: {
    title: "*Document views*",
    text: "*Structure tool* lar et *document* ha flere faner. En `S.view.component` får dokumentets verdier mens du skriver, og kan vise hva som helst du kan bygge i React.",
  },
  checkedBy: "code",
  check: fromCode("the-proving-room"),
};

const theForgeButton: Quest = {
  id: "the-forge-button",
  title: "Smi-knappen",
  intro: [
    "*Publish* er for papirarbeid. Et blad skal smis! Gi gjenstandene en «Smi»-knapp som stempler tidspunktet bladet ble smidd, og publiserer det. Ha spillet åpent ved siden av, så ser du smia blusse opp.",
  ],
  goal: "Lag en *document action* «Smi» som setter `forgedAt` og publiserer gjenstanden.",
  where: "`sanity.config.ts`: se etter kommentaren `QUEST: Smi-knappen`. Selve *action*-en kan ligge i en egen fil.",
  hints: [
    {
      text: "*Document actions* settes opp i `sanity.config.ts`, under `document.actions`.",
      link: { label: "Registering document actions", url: `${DOCS}/document-actions#k3254d0188d3e` },
    },
    {
      text: "`useDocumentOperation` gir deg `patch` og `publish`.",
      link: { label: "Update a value then publish", url: `${DOCS}/document-actions#k362c883e4421` },
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
      message: stamped ? undefined : "Ingen publisert gjenstand har et `forgedAt`-stempel ennå.",
    };
  },
};

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    title: "Smia",
    quests: [theBrokenForge, brannsLedger, theGuildsLaw, theDrawingBoard, theProvingRoom, theForgeButton],
  },
  {
    number: 2,
    title: "Jegeren",
    quests: [],
    teaser: ["Bestiariet", "Byttet", "Orakelets gåter", "Laugets nye lov", "Runeskriveren"],
  },
  {
    number: 3,
    title: "Byen våkner",
    quests: [],
    teaser: ["Byropet", "Skalden", "Prøv før du smir", "Julaftenslippet", "Smiens regnskap", "Del verktøyet"],
  },
];
