import { caseFileResult, linkScore, sourceCheckScore } from "../archive";
import { APPRENTICE_ITEM_ID, isRestoredHammer } from "../apprentice";
import { isNewOrder, morningRushReadyCount, signHasStrong } from "../bakery";
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

export function findPlayerWeapon(
  items: GameItemView[],
  preferredId?: string | null,
): GameItemView | undefined {
  const weapons = items.filter(
    (item) =>
      item.source === "sanity" &&
      item.kind === "weapon" &&
      item.id !== APPRENTICE_ITEM_ID,
  );
  return weapons.find((item) => item.id === preferredId) ?? weapons[0];
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

function fromBoard(id: string) {
  return ({ progress }: QuestContext): CheckResult => {
    const solved = Boolean(progress.solved[id]);
    return {
      done: solved,
      objectives: [{ label: "Modellbrettet er løst", done: solved }],
    };
  };
}

const theBrokenForge: Quest = {
  id: "the-broken-forge",
  door: 1,
  title: "Lag og publiser et våpen",
  villageSite: "forge",
  intro: [
    "Først trenger jeg et våpen, så vi kan holde snømonsteret unna til lista er på plass igjen.",
    "Luke 1: lag et våpen i Studio, og test det på snømonsteret øst for brønnen.",
  ],
  outro: [
    "Der er det, første våpen på den nye lista! Og snømonsteret trakk seg tilbake til skogen, i alle fall for nå.",
  ],
  goal: "Lag et våpen i Sanity Studio, trykk *Publish*, og test det på snømonsteret.",
  explain: {
    what: "Ditt første *document* i Studio: et våpen med navn og sprite, som du kan slå med i bygda.",
    why: "Du lærer det grunnleggende i Studio: lage et *document*, fylle det ut og publisere det. Våpenet ditt brukes også videre i de neste lukene.",
  },
  steps: [
    "Åpne Sanity Studio og lag et nytt *Item*-dokument.",
    "Sett *Kind* til *Weapon*, og gi det et navn og en sprite.",
    "Trykk *Publish*.",
    "Gå til snømonsteret øst for brønnen, og slå med mellomrom.",
  ],
  goalPreview: {
    before: "Smias liste er tom etter stormen.",
    after: "Våpenet ditt står i lista og i spillet.",
  },
  where: "I Sanity Studio.",
  hints: [
    {
      text: "Alt i Studio er *documents*. Et våpen er et *Item*-dokument der *Kind* er satt til *Weapon*.",
      link: {
        label: "Hello, Studio",
        url: `${LEARN}/day-one-with-sanity-studio/hello-studio`,
      },
    },
    {
      text: "Ser du ikke våpenet i spillet? Står det *Draft* øverst i dokumentet, er det ikke publisert ennå. Bare publiserte *documents* kommer med.",
      link: {
        label: "Drafts og publisering",
        url: "https://www.sanity.io/docs/content-lake/drafts-and-versions",
      },
    },
    {
      text: "Står du ved snømonsteret uten at noe skjer? Gå helt inntil det. Mellomrom slår bare når du er nær nok.",
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
        {
          label: "Beseir snømonsteret øst for brønnen",
          done: progress.wraithDefeated,
        },
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
    "I går sto en kunde lenge foran tavla i smia. Der står bare navnet på våpenet, så hun skjønte ikke hva det var godt for, og gikk uten å kjøpe noe.",
    "Kan du skrive en kort salgstekst om våpenet ditt? Én eller to setninger om hva det er godt for. Den skal vises både på tavla i smia og i tingene dine, men du skriver den bare ett sted: i Studio.",
  ],
  outro: [
    "Se på tavla i smia: nå står første setning der. Åpner du tingene dine (I), står hele teksten.",
    "Du skrev teksten ett sted, og to flater viste den hver på sin måte.",
  ],
  goal: "Endre våpenets beskrivelse, skriv minst én hel setning, og publiser.",
  explain: {
    what: "En salgstekst i feltet *Description* på våpenet ditt. Samme tekst vises to steder: første setning på tavla i smia, og hele teksten i tingene dine.",
    why: "Slik jobber man med innhold på jobb: skriv det én gang, og la nettside, app og nyhetsbrev vise det hver på sin måte.",
  },
  steps: [
    "Åpne våpenet ditt i Studio.",
    "Skriv minst én hel setning i feltet *Description*.",
    "Trykk *Publish*.",
    "Se på tavla i smia og i tingene dine (I).",
  ],
  goalPreview: {
    before: "Tavla i smia viser bare navnet.",
    after: "Tavla viser første setning av salgsteksten.",
  },
  where: "I Sanity Studio, på våpenet du publiserte i første luke.",
  hints: [
    {
      text: "Tenk som en selger: hva gjør dette våpenet til det rette for kunden? Skriv det først, for tavla viser bare første setning.",
    },
    {
      text: "Feltet *Description* ligger under navnet på våpenet. I tingene dine (I) ser du hele teksten når du holder musa over våpenet.",
      link: { label: "String type", url: `${DOCS}/string-type` },
    },
    {
      text: "Står det fortsatt ingenting nytt på tavla? Sjekk at du skrev på våpenet du har utstyrt, og at du trykket *Publish*. Et utkast vises ikke.",
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
    text: "Beskrivelsen er lagret én gang. Tingene dine viser hele teksten, mens tavla bruker bare første setning og sin egen stil.",
    atWork:
      "Skriv innholdet én gang, så kan nettside, app og nyhetsbrev vise det hver på sin måte.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ items, progress }) => {
    const weapon = findPlayerWeapon(items, progress.weaponDescriptionItemId);
    const description = weapon?.description?.trim() ?? "";
    const changed =
      description !== (progress.weaponDescriptionBefore?.trim() ?? "");
    return {
      done: description.length >= 10 && changed,
      goal: weapon
        ? `Skriv minst én hel setning i beskrivelsen på «${weapon.name}», og publiser.`
        : "Utstyr ditt publiserte våpen, og skriv minst én hel setning i beskrivelsen.",
      objectives: [
        {
          label: weapon
            ? `Beskrivelse på «${weapon.name}» er endret og publisert`
            : "Utstyr et publisert våpen",
          done: description.length >= 10 && changed,
        },
      ],
      message:
        description && description.length < 10
          ? "Skriv minst én hel setning."
          : !description || !changed
            ? "Beskrivelsen er ikke publisert ennå."
            : undefined,
    };
  },
};

const apprenticeMistake: Quest = {
  id: "apprentice-mistake",
  track: "nonTechnical",
  door: 3,
  title: "Lærlingen rotet",
  topic: "*History*",
  intro: [
    "Lærlingen ville hjelpe til før markedet og publiserte hammeren min i går kveld. Nå heter den «Bran sin hemmer», teksten er tull, og bildet er ei øks.",
    "For et par dager siden var den riktig. Studio husker hver versjon, så vi trenger ikke skrive alt inn på nytt. Vi henter bare den gamle tilbake.",
  ],
  outro: [
    "Der er hammeren min igjen, akkurat som før lærlingen var innom.",
    "Spillet ser bare at verdiene er riktige, ikke hvordan du fikk dem tilbake. Men nå vet du hvor *History* er neste gang noen publiserer feil.",
  ],
  goal: "Gjenopprett den riktige versjonen av hammeren fra *History*, og publiser.",
  explain: {
    what: "Du henter fram en eldre versjon av hammeren fra *History* og publiserer den på nytt. Du skriver ingenting inn selv.",
    why: "Alle publiserer feil iblant. Med *History* retter du det på minutter, uten å be en utvikler om hjelp.",
  },
  steps: [
    "Åpne «Bran sin hemmer» i Studio.",
    "Velg *History* i menyen med tre prikker øverst til høyre.",
    "Velg en versjon fra før lærlingen var der, og trykk *Revert to revision* (Restore).",
    "Trykk *Publish*. Restore lager bare et utkast; det er *Publish* som gjør hammeren riktig i bygda.",
  ],
  goalPreview: {
    before: "Hammeren har feil navn, tekst og bilde.",
    after: "Den tidligere versjonen er gjenopprettet og publisert.",
  },
  where: "I Sanity Studio, på dokumentet «Bran sin hemmer».",
  hints: [
    {
      text: "Ser du ikke *History*? Gjør Studio-vinduet bredere, så kommer den fram.",
      link: {
        label: "History experience",
        url: "https://www.sanity.io/docs/user-guides/history-experience",
      },
    },
    {
      text: "Hvilken versjon er riktig? Klikk deg gjennom dem. Den riktige heter «Brann sin hammer» og har en hammer som bilde.",
      link: {
        label: "Compare document versions",
        url: "https://www.sanity.io/docs/studio/compare-document-versions",
      },
    },
    {
      text: "Står det *Published* øverst etter Restore? Bytt til *Draft*. Der ligger den gjenopprettede versjonen, klar til *Publish*.",
      link: {
        label: "Drafts og publisering",
        url: "https://www.sanity.io/docs/content-lake/drafts-and-versions",
      },
    },
  ],
  learn: {
    label: "History experience",
    url: "https://www.sanity.io/docs/user-guides/history-experience",
  },
  lesson: {
    title: "*History* og gjenoppretting",
    text: "Sanity lagrer revisjoner i tre dager på Free-planen. *Revert to revision* henter en tidligere versjon frem igjen, og *Publish* gjør den synlig for spillet.",
    atWork:
      "Noen publiserte feil rett før lansering? Du kan gå tilbake til en tidligere versjon uten å be en utvikler om hjelp.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ items }) => {
    const hammer = items.find((item) => item.id === APPRENTICE_ITEM_ID);
    const done = isRestoredHammer(hammer);
    return {
      done,
      message: done
        ? undefined
        : hammer
          ? "Hammeren har fortsatt feil navn, beskrivelse eller bilde."
          : "Hammeren er ikke publisert ennå. Vent et øyeblikk og sjekk på nytt.",
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
  outro: [
    "Nå kjenner jeg igjen hvert våpen på bildet, uten å åpne et eneste ett.",
  ],
  goal: "Velg et `icon` for *Item*, og vis navn og sprite i hvert våpens *preview*.",
  explain: {
    what: "To ting i *schema*-koden for *Item*: et ikon for hele dokumenttypen, og en *preview* som viser navn og sprite for hvert våpen i lista i Studio.",
    why: "Med bilde i lista finner Brann riktig våpen med ett blikk, i stedet for å åpne dem ett for ett.",
  },
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
      text: "`preview.select` henter feltene du trenger, for eksempel `name`, `sprite` og `kind`. `prepare()` gjør dem om til det lista viser, og `media` kan være en hvilken som helst React-komponent, ikke bare et bilde.",
      link: {
        label: "React components in previews",
        url: `${DOCS}/previews-list-views#k75b9321e2389`,
      },
    },
    {
      text: 'Ikonet: `import { BoltIcon } from "@sanity/icons/Bolt"`, eller et annet du liker. Bildet: `media: <SpriteImage spriteId={sprite} kind={kind} />`. `SpriteImage` er allerede importert.',
      link: { label: "Sanity Icons", url: "https://icons.sanity.build" },
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
  outro: [
    "Ingen flere våpen uten bilde, og ingen to med samme navn. Huset i vest får øksa de faktisk bestilte.",
  ],
  goal: "Få Studio til å nekte våpen uten sprite og gjenstander uten navn eller med navn som allerede er brukt.",
  explain: {
    what: "*Validation*-regler i *schema*-et: et våpen uten sprite kan ikke publiseres, og to gjenstander kan ikke ha samme navn. Studio viser en rød feil og stopper *Publish*.",
    why: "Feil som stoppes i Studio, når aldri spillet eller kunden. Det er billigere enn å rydde opp etterpå.",
  },
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
  outro: ["Nå velger jeg bilde ved å se på det, ikke ved å gjette på en ID."],
  goal: "Bygg én bildeknapp for hver tillatte sprite. Vis bare ikonet, marker valget, og la det kunne fjernes.",
  explain: {
    what: "En *custom input*: en egen React-komponent som bytter ut nedtrekkslista for sprite med et rutenett av bildeknapper i Studio.",
    why: "Studio kan tilpasses arbeidet. Når redaktøren ser bildet i stedet for en ID, blir det færre feil.",
  },
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
      title: "Vis valget, oppdater og fjern",
      text: 'Sammenlign `props.value` med `id`. Bruk `mode="default"` for valgt og `mode="ghost"` for de andre; unngå `tone="primary"` (blått). Klikket sender `props.onChange(set(id))`, og fjern-knappen sender `props.onChange(unset())`.',
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
    "Femti observasjoner ligger i arkivet, rykter og fakta om hverandre. Vi begynner med det som er bekreftet.",
    "Skriv én GROQ-spørring mot observasjonene mine: bare det som er bekreftet, i tidsrekkefølge, og med stedet. Kartet viser hvor sporet går.",
  ],
  outro: [
    "Se på kartet: de bekreftede observasjonene går fra skogkanten, langs gjerdet og forbi smia, helt til bakeriet. Ryktene på torget pekte feil vei.",
    "Men hvorfor akkurat bakeriet?",
  ],
  goal: "Skriv en GROQ-spørring som gir de bekreftede observasjonene i tidsrekkefølge, med stedet.",
  explain: {
    what: "Én GROQ-spørring som filtrerer femti observasjoner ned til de bekreftede, sorterer dem på tid og henter stedet de peker på. Svaret tegnes som et spor på kartet.",
    why: "Et godt filter gir svaret: ryktene peker mot torget, men de bekreftede observasjonene viser hvor sporet egentlig går.",
  },
  goalPreview: {
    before: "Femti observasjoner, rykter og fakta om hverandre.",
    after: "Bare bekreftede, i tidsrekkefølge, med sted.",
  },
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
    "Kari kom innom og spurte hva som var sett ved bakeriet. Jeg måtte be deg skrive en ny spørring, og hun sto og ventet hele tiden.",
    "Kan du gjøre spørringene om til lister i Studio, så jeg klikker meg fram selv? «Bare bekreftede» og «Per sted» holder. Spørsmålene på skiltet ved torget kan du ta når du vil.",
  ],
  outro: ["Nå finner jeg det Kari spurte om med to klikk, uten å skrive GROQ."],
  goal: "Lag listene «Bare bekreftede» og «Per sted» med *Structure Builder*.",
  explain: {
    what: "To nye punkter øverst i venstre kolonne i Studio, laget med *Structure Builder*. «Bare bekreftede» åpner en liste med bare bekreftede observasjoner. «Per sted» viser stedene, og klikker du på ett, ser du alt som er sett der.",
    why: "Arkivaren kan ikke GROQ. Med listene finner hun svaret med to klikk, og du slipper å skrive en ny spørring hver gang noen spør.",
  },
  goalPreview: {
    before: "Studio viser bare dokumenttypene.",
    after:
      "To nye lister øverst. Per sted › Bakeriet viser alt som er sett der.",
  },
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
  outro: [
    "Der står det, rett på Bakeriet: kaker forsvant, og det var iskaldt i rommet etterpå.",
    "Noe stort og kaldt gikk fra skogen til bakeriet i natt og spiste kaker. Ingen ble skadet, og det var ikke noe troll på torget. Markedet går som planlagt.",
  ],
  goal: "Lag en *document view* som viser observasjonene som peker på stedet du har åpnet.",
  explain: {
    what: "En ny fane, en *document view*, på hvert sted i Studio. Fanen «Observasjoner her» viser alle observasjonene som peker på stedet du har åpnet.",
    why: "En *reference* går bare én vei: observasjonen vet hvor den var, men stedet vet ikke hva som skjedde der. Fanen snur spørsmålet, så svaret står der du leter.",
  },
  goalPreview: {
    before: "Bakeriet vet ikke hva som peker på det.",
    after: "En egen fane viser observasjonene her.",
  },
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
  giver: "arkivaren",
  villageSite: "noticeboard",
  intro: [
    "Folk stiller meg de samme spørsmålene hele dagen. Jeg har hengt opp de fem vanligste på skiltet ved torget. Svar på så mange du vil, med GROQ.",
  ],
  outro: ["Nå vet du mer om arkivet mitt enn jeg gjør selv."],
  goal: "Svar på Arkivarens fem spørsmål med GROQ. Hvert svar gir en gjenstand.",
  explain: {
    what: "Fem GROQ-svar på spørsmålene Arkivaren får hele dagen. Du teller, sammenligner og bruker `^` i en underspørring.",
    why: "Mer GROQ-trening i ditt eget tempo, og hvert riktige svar gir deg en gjenstand.",
  },
  goalPreview: {
    before: "Fem spørsmål på skiltet.",
    after: "Hvert svar gir en gjenstand.",
  },
  where: "På skiltet ved torget. Etterpå i kodevinduet.",
  hints: [
    {
      text: "Hvert spørsmål har sin egen `svar`-konstant. Resultatet vises med en gang, og du kan ta dem i hvilken rekkefølge du vil.",
    },
    {
      text: "Tell med `count(…)`. En underspørring inne i en projeksjon kan bruke `^` for dokumentet utenfor.",
    },
    {
      text: 'Et eksempel med `^`: `*[_type == "place"]{ name, "antall": count(*[_type == "observation" && place._ref == ^._id]) }` teller observasjonene på hvert sted.',
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

const archiveModel: Quest = {
  id: "archive-model",
  giver: "arkivaren",
  track: "nonTechnical",
  door: 4,
  title: "Rydd notatene",
  topic: "Innholdsmodell (modellbrett)",
  intro: [
    "I morges spurte Kari om noen hadde sett noe ved smia. Jeg måtte lese hver eneste lapp i arkivet for å svare, for alt står huller om buller.",
    "Før notatene kommer inn i Studio, må vi bestemme hva hver del er: tekst, ja/nei, et valg fra en liste eller en peker til et sted. Hver del blir et felt. Det bestemmer vi på modellbrettet.",
  ],
  outro: [
    "Nå har hver opplysning sin egen plass. Neste gang noen spør hva som skjedde ved smia, finner Studio det for meg.",
    "Åpne Studio og se: valgene dine er blitt feltene i *Observation*.",
  ],
  goal: "Sorter bitene i notatet etter hvordan de bør lagres.",
  explain: {
    what: "En innholdsmodell: for hver del av notatet bestemmer du hvilken type felt det blir i Studio. Når brettet er løst, slår spillet på de feltene i *Observation*.",
    why: "Felttypen avgjør hva du kan gjøre med innholdet senere: sortere på tid, filtrere på status, samle alt fra ett sted. Det er denne samtalen du har med utviklerne før de lager *schema*-et.",
  },
  steps: [
    "Trykk «Åpne modellbrettet».",
    "Velg et kort fra notatet, og trykk «Legg valgt kort her» på feltet det hører hjemme i.",
    "Et kort som ligger riktig, får en hake. Ligger det feil, forklarer Arkivaren hvorfor.",
    "Når alle kortene har hake, er notatet ryddet.",
  ],
  goalPreview: {
    before: "Ett notat der alt er blandet sammen.",
    after: "Hver del er et eget felt med sin type.",
  },
  where: "På modellbrettet. Etterpå kan du se modellen i Sanity Studio.",
  hints: [
    {
      text: "Spør hva du vil gjøre med opplysningen senere: lese den, filtrere den eller finne det den peker på.",
    },
    {
      text: "Sted og vitne kan brukes igjen i mange observasjoner. De bør peke på egne dokumenter.",
    },
    {
      text: "Status har tre kjente muligheter. «Så det selv» har bare to.",
    },
  ],
  studioPractice: "Se feltene og listene modellen slo på.",
  lesson: {
    title: "En innholdsmodell før kode",
    text: "En innholdsmodell bestemmer hva hver opplysning er, og hvordan delene henger sammen. Gode typer gjør innholdet lettere å finne, kontrollere og bruke igjen.",
    atWork:
      "Det er dette du gjør før en utvikler skriver schemaet: bestemme hva innholdet er, og hvordan det henger sammen.",
  },
  checkedBy: "board",
  reward: { forgeLevel: 1 },
  check: fromBoard("archive-model"),
};

const whoIsLying: Quest = {
  id: "who-is-lying",
  giver: "arkivaren",
  track: "nonTechnical",
  door: 5,
  title: "Hvem lyver?",
  topic: "*Reference*",
  intro: [
    "Fem historier er det hele bygda snakker om. Når jeg ser på lista over Bakeriet, mangler én av dem, for noen skrev «bakriet».",
    "Regelen min: noe er *Confirmed* hvis vitnet så det selv og har bilde, eller hvis et annet vitne så det samme på samme sted. Alt annet er *Rumor*.",
  ],
  outro: [
    "Nå vet vi hva som er fakta og hva som er rykter. Markedet blir ikke avlyst på grunn av sladder.",
    "C peker nå på Bakeriet, så den dukker opp i lista «Per sted», uansett hvordan noen staver navnet.",
  ],
  goal: "Koble observasjon C til Bakeriet, gi alle fem riktig *Status*, og publiser.",
  explain: {
    what: "Du kobler én observasjon til riktig sted med en *reference*, og gir alle fem en status: *Confirmed* eller *Rumor*.",
    why: "En *reference* samler alt fra Bakeriet på samme liste, uansett hvordan noen staver navnet. Statusen er det som skiller fakta fra rykter.",
  },
  steps: [
    "Åpne observasjon C i Studio, og velg Bakeriet i feltet *Place*.",
    "Åpne «Per sted» og se hvem som så hva på samme sted.",
    "Gi hver av de fem observasjonene *Confirmed* eller *Rumor* etter regelen.",
    "Trykk *Publish* på hver av dem.",
  ],
  goalPreview: {
    before: "Under Bakeriet står bare B. C er stavet «bakriet».",
    after: "C peker på Bakeriet, og begge er vurdert.",
  },
  where: "I Sanity Studio, under *Observation* og «Per sted».",
  hints: [
    {
      text: "Én observasjon alene er nok bare hvis vitnet så det selv og tok bilde. Se på begge feltene.",
    },
    {
      text: "«Per sted» samler det flere så på samme sted. Står det to like observasjoner der?",
      link: { label: "Reference type", url: `${DOCS}/reference-type` },
    },
    {
      text: "«Et annet vitne»: se på navnet, ikke bare stedet.",
    },
  ],
  learn: { label: "Reference type", url: `${DOCS}/reference-type` },
  lesson: {
    title: "*References* gjør innhold sammenlignbart",
    text: "En *reference* peker på ett bestemt dokument. Derfor kan Sanity samle observasjoner fra samme sted selv om noen skrev stedsnavnet feil i notatet.",
    atWork:
      "En *reference* gjør at innhold kan sammenlignes og filtreres. Det kan ikke tekst som staves ulikt.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ archive }) => {
    const waiting = waitingForArchive(archive);
    if (waiting) return waiting;
    const statuses = sourceCheckScore(archive!);
    const place = linkScore(archive!);
    return {
      done: statuses.right === statuses.total && place.right === place.total,
      objectives: [
        {
          label: `${statuses.right} av ${statuses.total} har riktig status`,
          done: statuses.right === statuses.total,
        },
        {
          label: "Stedet er koblet",
          done: place.right === place.total,
        },
      ],
    };
  },
};

const caseFile: Quest = {
  id: "case-file",
  giver: "arkivaren",
  track: "nonTechnical",
  door: 6,
  title: "Saksmappa",
  topic: "*Array of references*",
  intro: [
    "Folk på torget har hørt hver sin versjon og krangler om hvem som har rett. Løse lapper på oppslagstavla gjør det bare verre.",
    "Jeg vil henge opp én saksmappe med bare det vi vet sikkert: de tre bekreftede observasjonene, og ingen rykter.",
  ],
  outro: [
    "Saksmappa henger på torget, og krangelen har stilnet. Det som er sant: store fotspor ved smia og en revnet melsekk ved bakeriet. Noe gikk fra smia til bakeriet i natt, men ingen ble skadet. Markedet går som planlagt.",
    "Mappa peker på observasjonene i stedet for å kopiere dem. Prøv å gi Bakeriet et nytt navn i Studio og publiser: tavla på torget følger med.",
  ],
  goal: "Lag og publiser en *Case* med alle de bekreftede observasjonene, og ingen rykter.",
  explain: {
    what: "En saksmappe, et *Case*-dokument, med en liste av *references* til de tre bekreftede observasjonene. Den henges opp på oppslagstavla på torget.",
    why: "Mappa peker på observasjonene i stedet for å kopiere dem. Retter noen en observasjon, er mappa riktig med en gang.",
  },
  steps: [
    "Lag et nytt *Case*-dokument i Studio, og gi det en tittel.",
    "Under *Observations*: trykk «Add item» og velg en bekreftet observasjon. Gjør det for alle tre.",
    "Trykk *Publish*, og se saksmappa på oppslagstavla på torget.",
  ],
  goalPreview: {
    before: "Løse lapper, rykter også, på tavla.",
    after: "Én saksmappe med de tre bekreftede.",
  },
  where: "I Sanity Studio, under *Case*.",
  hints: [
    {
      text: "Lista «Bekreftede» i Studio viser hvilke observasjoner som skal med.",
    },
    {
      text: "Har du flere saksmapper? Spillet ser på den som er nærmest riktig, så rett eller slett de andre.",
    },
    {
      text: "Ser spillet ingen saksmappe? Da er den bare et utkast. Trykk *Publish*.",
    },
  ],
  learn: { label: "Array of references", url: `${DOCS}/array-type` },
  lesson: {
    title: "En liste av *references*",
    text: "Én *Case* kan peke på mange observasjoner uten å kopiere dem. Tavla følger referansene videre til stedsnavnet, så en endring slår gjennom overalt.",
    atWork:
      "Én kilde, mange steder: endrer du den ett sted, er den riktig overalt.",
  },
  checkedBy: "game",
  reward: { forgeLevel: 1 },
  check: ({ archiveCases, archiveCaseDrafts }) => {
    if (archiveCases == null)
      return {
        done: false,
        message: "Henter saksmappene fra prosjektet ditt…",
      };
    return caseFileResult(archiveCases, archiveCaseDrafts);
  },
};

const bakerTemplate: Quest = {
  id: "baker-template",
  giver: "bakeren",
  track: "technical",
  door: 9,
  title: "Initial value: faste kunder",
  intro: [
    "Brann vil alltid ha lussekatter, Arkivaren pepperkaker og Kari julekake. Likevel skriver jeg navn, vare, status og dato for hånd på hver eneste lapp.",
    "Kan du lage en mal for hver av dem? Da velger jeg «Bestilling fra Kari», og resten står der allerede. Åpne kodevinduet.",
  ],
  outro: [
    "Nå velger jeg bare kunden, så er lappen ferdig utfylt.",
    "Trykk + i Studio og se: malene står der, med dagens dato.",
  ],
  goal: "Lag en mal for hver fast kunde, med varen deres, status «ny» og dagens dato.",
  explain: {
    what: "*Initial value templates* for bestillinger: «Bestilling fra Brann», «… fra Arkivaren» og «… fra Kari» i Studios +-meny, ferdig utfylt.",
    why: "Det som nesten alltid er likt, bør ikke skrives for hånd. En mal per vanlig tilfelle gir færre tastetrykk og færre feil.",
  },
  goalPreview: {
    before: "Bare «Ny bestilling», med tomme felt.",
    after: "En mal per kunde, ferdig utfylt.",
  },
  where: "I kodevinduet hos Bakeren. Prøv malene i Studio etterpå.",
  hints: [
    {
      text: "En mal er et objekt med `id`, `title`, `schemaType` og `value`. `templates` får malene som finnes fra før, og skal returnere dem sammen med dine.",
      link: {
        label: "Initial Value Templates",
        url: `${DOCS}/initial-value-templates`,
      },
    },
    {
      text: "Du trenger ikke skrive tre maler for hånd: `CUSTOMERS.map(...)` kan lage én per kunde. Bruk kundens navn i både `id` og `title`.",
    },
    {
      text: "La `value` være en funksjon, `() => ({ ... })`, og kall `bakeryToday()` inne i den. Da får hver bestilling datoen den lages, ikke datoen du skrev koden.",
    },
  ],
  learn: {
    label: "Initial Value Templates",
    url: `${DOCS}/initial-value-templates`,
  },
  lesson: {
    title: "*Initial value templates*",
    text: "En mal fyller ut et nytt dokument når det opprettes. Flere maler for samme *document type* gir flere valg i +-menyen. Eksisterende dokumenter beholder verdiene sine. Kodevinduet testet malene dine; Studio bruker vår ferdige versjon.",
  },
  checkedBy: "window",
  studioPractice:
    "Trykk + i Studio og velg «Bestilling fra Kari». Varen, Kari, status og dagens dato skal allerede stå der.",
  check: fromWindow("baker-template"),
};

const bakerForge: Quest = {
  id: "baker-forge",
  giver: "bakeren",
  track: "technical",
  door: 10,
  title: "Document action: Smi",
  intro: [
    "Brann kom innom i morges med sot på hendene. Han hadde smidd et nytt sverd, men glemt å trykke *Publish*, så kunden ventet forgjeves i smia.",
    "Han ba meg spørre deg: kan Studio få én Smi-knapp, en *document action*, som stempler `forgedAt` og publiserer i samme trykk? Bruk kodevinduet.",
  ],
  outro: [
    "Brann kan nå smi og publisere i ett trykk.",
    "Publish er der fortsatt når han bare skal publisere som vanlig.",
  ],
  goal: "Lag en Smi-action som stempler og publiserer et våpen i ett trykk.",
  explain: {
    what: "En *document action*: en egen Smi-knapp ved siden av *Publish* som setter `forgedAt` og publiserer våpenet i samme trykk.",
    why: "Når to steg alltid hører sammen, sørger én knapp for at ingen glemmer det andre.",
  },
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
    "I går publiserte jeg en ny bestilling, men skiltet ved boden sto fortsatt med gårsdagens tekst. Folk spurte meg om det samme hele dagen.",
    "Tenk om skiltet kunne oppdatere seg selv når en bestilling publiseres, men bare når det trengs, selv om beskjeden kommer to ganger.",
    "Skriv funksjonen i kodevinduet. Når den består, kjører jeg den hver gang du publiserer en bestilling i Studio.",
  ],
  outro: [
    "Nå skriver skiltet seg selv. Folk ved boden ser dagens bestilling uten å spørre meg.",
    "Prøv: publiser en bestilling i Studio og se på bodskiltet. Publiserer du den samme igjen, lar funksjonen din skiltet være.",
  ],
  goal: "Oppdater skiltet når en bestilling publiseres, men ikke ved andre hendelser eller når skiltet allerede stemmer.",
  explain: {
    what: "En Sanity Function: kode som kjører av seg selv når en bestilling publiseres, og skriver dagens bestilling på bodskiltet. Etterpå kjører spillet funksjonen din på bestillingene du publiserer i Studio.",
    why: "En Function gjør jobben når innhold endres, uten at noen trykker på noe. Vakten mot gjentakelser hindrer at samme beskjed gjør arbeidet to ganger.",
  },
  goalPreview: {
    before: "Skiltet står med gårsdagens tekst.",
    after: "Du publiserer en bestilling, og skiltet endrer seg.",
  },
  where:
    "I kodevinduet hos Bakeren. Etterpå publiserer du en bestilling i Studio og ser på bodskiltet.",
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
    text: "En Function får en hendelse og en *client*, og bestemmer selv om den skal gjøre noe. Her spilte spillet rollen som Sanity: funksjonen din kjører i nettleseren og skriver bare til skiltet i bygda. En ekte Function deployes med `sanity blueprints deploy` og kjører i Sanity.",
  },
  checkedBy: "window",
  check: fromWindow("baker-function"),
};

const bakerModel: Quest = {
  id: "baker-model",
  giver: "bakeren",
  track: "nonTechnical",
  door: 7,
  title: "Hva er en bestilling?",
  topic: "Modell, *validation* og *initial value* (modellbrett)",
  intro: [
    "I går manglet varen på en av lappene mine. Jeg gjettet pepperkaker, men Brann ville ha lussekatter.",
    "Samtidig skriver jeg dato og «ny» på hver lapp, enda datoen nesten alltid er i dag og alle bestillinger starter som ny. Bare varen vet jeg aldri på forhånd.",
    "Bestem på modellbrettet hva en bestilling er, hva som må fylles ut, og hva Studio kan fylle ut for meg.",
  ],
  outro: [
    "Bestillingen din kom inn med dato og «ny» ferdig utfylt, og Studio passet på at varen var med.",
    "Ingen flere lussekatter som blir til pepperkaker.",
  ],
  goal: "Bestem modellen, og lag deretter én ny publisert bestilling.",
  explain: {
    what: "En modell for bestillinger: hvilke felt som finnes, hvilke som må fylles ut (*validation*), og hvilke som fylles ut av seg selv (*initial value*). Etterpå lager du en bestilling i Studio med den.",
    why: "Påkrevde felt stopper ufullstendige lapper, og startverdier sparer Bakeren for å skrive det samme hver gang. Det er dette du ber utviklerne om.",
  },
  steps: [
    "Trykk «Åpne modellbrettet», og sorter bitene fra lappen til Bakeren.",
    "Kryss av for «Påkrevd» og «Startverdi» der det passer.",
    "Lag en ny bestilling i Studio. Se at dato og status allerede er fylt ut.",
    "Fyll inn varen, og trykk *Publish*.",
  ],
  goalPreview: {
    before: "Ingenting er fylt ut, og alt kan publiseres.",
    after: "Dato og status er fylt ut. Uten vare stopper Publish.",
  },
  where:
    "Først på modellbrettet. Deretter i ditt eget Sanity Studio under *Ny bestilling*.",
  hints: [
    {
      text: "Hva må Bakeren alltid vite, og hva kan hun noen ganger mangle? Startverdier passer bare det hun vet på forhånd.",
      link: {
        label: "Initial Value Templates",
        url: `${DOCS}/initial-value-templates`,
      },
    },
    {
      text: "Vare, dato og status må finnes. Kunden er det ekte dilemmaet: noen ganger er navnet ukjent.",
      link: { label: "Validation", url: `${DOCS}/validation` },
    },
    {
      text: "«Påkrevd» stopper *Publish* når feltet er tomt. «Startverdi» fyller feltet når bestillingen lages, men kan endres. Et felt kan ha begge.",
    },
  ],
  learn: { label: "Validation", url: `${DOCS}/validation` },
  lesson: {
    title: "Modell, *validation* og startverdier",
    text: "Påkrevde felt hindrer ufullstendige bestillinger. En *initial value* fyller ut det som vanligvis er kjent, uten å låse redaktøren.",
    atWork:
      "Du spesifiserer, utvikleren bygger. Påkrevde felt og startverdier er det du kan be om for å slippe feil og dobbeltarbeid.",
  },
  checkedBy: "board",
  reward: { forgeLevel: 1 },
  check: ({ bakeryOrders, progress }) => {
    const modeled = Boolean(progress.solved["baker-model"]);
    const order = Boolean(bakeryOrders?.some(isNewOrder));
    return {
      done: modeled && order,
      objectives: [
        { label: "Modellbrettet er løst", done: modeled },
        { label: "En ny bestilling er publisert", done: order },
      ],
      message: !modeled
        ? "Løs modellbrettet først."
        : bakeryOrders === null
          ? "Henter publiserte bestillinger fra prosjektet ditt…"
          : !order
            ? "Se i Studio: dato og status er fylt ut når du lager en ny bestilling."
            : undefined,
    };
  },
};

const bakerSign: Quest = {
  id: "baker-sign",
  giver: "bakeren",
  villageSite: "bakerySign",
  track: "nonTechnical",
  door: 8,
  title: "Bodskiltet",
  topic: "*Portable Text*",
  intro: [
    "I går gikk folk rett forbi boden min. Ingen visste at det var nystekt i dag.",
    "Jeg vil ha et skilt med ett ord som virkelig synes. Den samme teksten skal stå på skiltet ved boden og i en kortversjon, slik den ville sett ut i en app.",
  ],
  outro: [
    "Folk stopper ved boden nå. Det fremhevede ordet ser forskjellig ut på skiltet og i kortversjonen, men teksten er den samme.",
    "Du skrev teksten én gang, og hver flate bestemte selv hvordan fet skrift skulle se ut.",
  ],
  goal: "Publiser én rik tekst som fungerer på skiltet og i kortversjonen.",
  explain: {
    what: "Et skilt i *Portable Text*: tekst der ett ord er fet. Samme tekst vises på skiltet ved boden og i en kortversjon, slik den ville sett ut i en app.",
    why: "Teksten sier bare hva som er viktig. Hver flate bestemmer selv hvordan «viktig» ser ut, så innholdet kan brukes overalt.",
  },
  steps: [
    "Åpne *Bodskilt* i Studio.",
    "Skriv en kort beskjed i *Skilttekst*.",
    "Marker det viktigste ordet, og gjør det fet (B, eller Cmd/Ctrl + B).",
    "Trykk *Publish*, og les skiltet ved boden (E).",
  ],
  goalPreview: {
    before: "Boden har et tomt skilt.",
    after: "Samme tekst, fet skrift på to måter.",
  },
  where:
    "Hent oppgaven ved bodskiltet utenfor bakeriet. Skriv deretter i ditt eget Sanity Studio under *Bodskilt*.",
  hints: [
    {
      text: "Hvilket ord vil du at folk skal se fra andre siden av torget? Det er det ordet som skal bli fet.",
    },
    {
      text: "*Skilttekst* er *Portable Text*: tekst der ord kan ha formatering. Fet skrift er en *mark* på ordet, ikke store bokstaver.",
      link: { label: "Portable Text", url: `${DOCS}/block-content` },
    },
    {
      text: "Ser skiltet i bygda tomt ut? Bare publisert tekst vises der.",
    },
  ],
  learn: { label: "Portable Text", url: `${DOCS}/block-content` },
  lesson: {
    title: "*Portable Text*",
    text: "En tekstblokk kan inneholde ord med egne *marks*, som fet skrift. Spillet brukte samme publiserte verdi på skiltet og i appvisningen, men ga markeringen ulik stil på de to flatene.",
    atWork:
      'Teksten bærer ikke utseendet. Den sier bare hva som er viktig. Hver flate bestemmer selv hvordan "viktig" ser ut.',
  },
  checkedBy: "game",
  check: ({ bakerySign }) => ({
    done: signHasStrong(bakerySign ?? null),
    message: "Publiser et bodskilt med tekst og minst ett ord i fet skrift.",
  }),
};

const morningRush: Quest = {
  id: "morning-rush",
  giver: "bakeren",
  asksNpc: "kari",
  track: "nonTechnical",
  door: 9,
  title: "Morgenrushet",
  topic: "*Document action* og *validation*",
  intro: [
    "Markedet åpner om ti minutter, og fire bestillinger ligger fortsatt på benken: Branns, Arkivarens, Karis og din.",
    "To av lappene er ufullstendige. Arkivaren glemte datoen, og jeg får ikke lest hva Kari skrev, så henne må du spørre.",
    "Jeg har fått en egen *Klar*-knapp i Studio. Den slipper bare gjennom bestillinger som er komplette.",
  ],
  outro: [
    "Alle fire bestillingene er klare, og markedet kan åpne!",
    "*Klar* nektet de ufullstendige lappene, og tok status og *Publish* i ett trykk for resten.",
  ],
  goal: "Rett de ufullstendige lappene og bruk Klar på alle fire bestillingene.",
  explain: {
    what: "Du retter to ufullstendige bestillinger og bruker Bakerens egen knapp, *Klar*, på alle fire. Knappen setter status og publiserer i ett trykk.",
    why: "*Validation* stopper det som mangler, og en egen *document action* gjør et arbeidssteg til ett trykk. Slik slipper ingen ut noe halvferdig.",
  },
  steps: [
    "Åpne bestillingene i Studio.",
    "Fyll inn datoen på Arkivarens bestilling.",
    "Spør Kari hva hun bestilte, og fyll inn varen hennes.",
    "Velg *Klar* på alle fire. Den ligger i menyen ved siden av *Publish*.",
  ],
  goalPreview: {
    before: "To av fire lapper har mangler, og ingen er klare.",
    after: "Alle fire er komplette og publisert med status «klar».",
  },
  where: "I ditt eget Sanity Studio, under *Ny bestilling*.",
  hints: [
    {
      text: "Hvorfor er *Klar* grå? Hold musa over den: den sier hva som mangler.",
      link: { label: "Document actions", url: `${DOCS}/document-actions` },
    },
    {
      text: "Ser du etter røde felt? Det er *validation* som sier fra om det som mangler.",
      link: { label: "Validation", url: `${DOCS}/validation` },
    },
    {
      text: "Har du trykket *Publish* i stedet? Da er status fortsatt den gamle. Trykk *Klar* også; den setter status og publiserer i ett.",
    },
  ],
  learn: { label: "Document actions", url: `${DOCS}/document-actions` },
  lesson: {
    title: "Trygge arbeidssteg",
    text: "*Validation* hindret Klar mens viktige felt manglet. En *document action* kunne deretter endre status og publisere i ett arbeidssteg.",
    atWork:
      "Regler og egne knapper gjør at ingen sender ut noe halvferdig, uten at du må huske alt selv.",
  },
  checkedBy: "game",
  check: ({ bakeryOrders, progress }) => {
    const ready = morningRushReadyCount(bakeryOrders, progress.bakeryOrderId);
    return {
      done: ready === 4,
      objectives: [
        {
          label: `${ready} av 4 bestillinger er klare`,
          done: ready === 4,
        },
      ],
      message:
        bakeryOrders === null
          ? "Henter publiserte bestillinger fra prosjektet ditt…"
          : "Rett manglene og bruk Klar på de fire bestillingene.",
    };
  },
};

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    title: "Studio",
    opening: [
      "Hei! Jeg er Brann, smeden. Hver uke åpner et nytt kapittel med Sanity-oppgaver, og det du lager i Studio, dukker opp her i spillet.",
      "Stormen i natt tok hele lista over våpnene mine. Hvert sverd, hver øks, borte med vinden. Og nå har et snømonster kommet ut av skogen, rett før julemarkedet.",
      "Denne gangen skriver vi alt ned et sted som tåler vær: i Sanity Studio.",
    ],
    quests: [
      theBrokenForge,
      weaponDescription,
      apprenticeMistake,
      brannsLedger,
      theGuildsLaw,
      theDrawingBoard,
    ],
  },
  {
    number: 2,
    title: "Finne",
    opening: [
      "Jeg er Arkivaren. Jeg skriver ned alt som skjer i bygda, stort og smått.",
      "I natt skjedde det noe. Store fotspor i snøen, en revnet melsekk ved bakeriet, og nå sier halve bygda at et monster har vært her. Mange vil avlyse markedet.",
      "Jeg har lapper fra alle som så noe, men de sier ikke det samme. Før noen bestemmer noe, må vi finne ut hva som faktisk skjedde.",
    ],
    quests: [
      followTheTrail,
      archiveQuestions,
      archiveLists,
      whoPointsHere,
      archiveModel,
      whoIsLying,
      caseFile,
    ],
  },
  {
    number: 3,
    title: "Automatisere",
    opening: [
      "Jeg er Bakeren. Noen var i bakeriet mitt i natt, men takket være deg og Arkivaren blir markedet ikke avlyst!",
      "Men nå er det få dager igjen, og alle vil ha noe fra boden min. Bestillinger, skilt og alt det andre må bli klart i tide, og jeg rekker det ikke alene.",
    ],
    quests: [
      bakerTemplate,
      bakerForge,
      bakerFunction,
      bakerModel,
      bakerSign,
      morningRush,
    ],
  },
];
