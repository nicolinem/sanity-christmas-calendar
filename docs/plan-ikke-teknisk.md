# Plan: ny ikke-teknisk løype med modellbrett (17. november 2026)

Denne planen skal kunne følges av en annen AI uten mer kontekst. Les den
helt før du begynner. Les deretter `AGENTS.md` (Next 16 er ikke den Next du
kjenner), `.claude/skills/luke-design/SKILL.md` (reglene for luker) og
`docs/questplan.md`.

## 1. Hvorfor

De ikke-tekniske lukene lærer riktige begreper, men deltakeren tar ingen
beslutninger:

- **Uke 1:** bare den felles luke 1. De to foreslåtte lukene er ikke bygget.
- **Uke 2:** sortere ni observasjoner, velge sted på tre, lage en saksmappe.
  Det er registrering.
- **Uke 3:** fylle ut en mal, gjøre ett ord fett, trykke «Klar». Deltakeren
  trykker på det utvikleren har laget.
- **Titlene** er utviklertermer («Initial value template: ny bestilling»).

Målgruppen er designere, prosjektledere og salg. De trenger å forstå
**innholdsmodellering**, at **innhold og utseende er adskilt**, og at de kan
**jobbe trygt** i Studio. I et ekte prosjekt er det ofte de som bestemmer
*hva* innholdet er, mens utviklerne skriver schemaet. Den ikke-tekniske
løypa skal gi dem den rollen.

## 2. Læringsmål (pensum for ikke-teknisk løype)

Etter desember skal deltakeren kunne:

1. **Skissere en innholdsmodell:** hvilke typer, hvilke felt, hva som er
   påkrevd, og når en *reference* er bedre enn tekst. (Uke 2 og 3, modellbrettet.)
2. **Vise at samme innhold brukes flere steder**, og at det er flaten som
   bestemmer utseendet. (Uke 1 luke 2, uke 2 oppslagstavla, uke 3 skiltet.)
3. **Jobbe trygt i Studio:** utkast, *Publish*, *History* og gjenoppretting.
   (Uke 1 luke 3.)
4. **Si hva man kan be utviklerne om** (maler, regler, egne knapper) og
   hvorfor. (Uke 3.)

Skriv disse inn i `docs/questplan.md` under «Pensum og pitch», og kryss av
«Ikke-teknisk løype: læringsmål og oppgaver for alle tre ukene» når fase 6 er
ferdig.

## 3. Regler du ikke bryter

- **Gratisplanen i Sanity:** ikke Content Releases, Scheduled drafts, Comments
  eller Tasks.
- **Spillet leser bare publisert innhold** i deltakerens eget prosjekt.
- **Høyst 25 minutter per luke** for en førstegangsdeltaker.
- **Ett nytt Sanity-tema per luke.**
- **Språk:** norsk tekst, Sanity-begreper på engelsk merket med `*term*`
  (se `src/components/hud/richText.tsx`). Ingen oppdiktede stedsnavn eller
  funksjonsnavn. Ingen hjelpelinjer som ikke gir ny informasjon.
- **Kunst:** bare Kenney-grafikk som allerede finnes i `public/`. Ingen
  hoppe-/bob-animasjon.
- **Fellesprosjektet i produksjon:** skriv aldri dit uten å spørre brukeren.
- **Git:**
  - commit ofte, én commit per avsnitt i fasene under;
  - **push, PR og merge bare når brukeren ber om det**;
  - push aldri `solutions` eller taggene `solution/*`;
  - commit aldri `README.md`, `docs/pitch/` eller `.taste-skill/`.
- **Ingen nye npm-avhengigheter** uten å spørre.
- Editoren formaterer med Prettier ved lagring. Repoet har ingen
  Prettier-konfigurasjon, så unngå formateringsendringer i filer du ikke ellers
  endrer.

## 4. Forutsetninger (fase 0)

1. Uke 3 ligger på `feat/uke-3-bakeren` med ucommittede endringer
   (`BakerySign.tsx` m.fl.). **Ikke rør den grenen.** Vent til den er merget
   til `main`. Er den ikke merget, stopp og si fra.
2. Lag en ny gren fra oppdatert `main`: `feat/ikke-teknisk-modellbrett`.
3. Kjør `npm test`, `npx tsc --noEmit` og `npx eslint src` og noter hva som
   feiler fra før (se «Kjente feil» i `docs/neste-steg.md`). Det er
   utgangspunktet. Du skal ikke gjøre det verre.
4. Les disse filene før du skriver kode:
   - `src/game/quests/types.ts`: `Quest`, `Progress.solved`, `checkedBy`
   - `src/game/quests/chapters.ts`: alle lukene
   - `src/components/hud/nextStep.ts` og `QuestTracker.tsx`: neste steg-knappen
   - `src/components/hud/codeWindow/CodeWindow.tsx` og `tasks/types.ts`,
     `tasks/index.ts`: mønsteret modellbrettet skal kopiere
   - `src/sanity/lib/solved.tsx`: `isSolved`, `isTrack`, `useSolved`. Slik slår
     Studio på ting når en oppgave er løst i spillet
   - `src/sanity/schemaTypes/archive.ts`, `bakeryOrder.ts`, `bakerySign.ts`
   - `src/sanity/studio/structure.ts`, `BakeryActions.ts`
   - `src/game/archive.ts`, `src/game/bakery.ts`, `src/app/api/archive/route.ts`,
     `src/app/api/bakery/route.ts`: data som seedes i deltakerens prosjekt
   - `src/components/GameClient.tsx`: hvor vinduer åpnes og `onSolved` skrives

## 5. Lukene, slik de skal bli

Ikke-teknisk løype får ni kjerneluker i stedet for sju. Dørnumrene i
ikke-teknisk løype blir derfor:

| Uke | Luke | Id | Tittel | Tema (`topic`) | Nytt? |
|---|---|---|---|---|---|
| 1 | 1 | `the-broken-forge` | (felles, uendret) | | |
| 1 | 2 | `weapon-description` | Samme tekst, to steder | Innhold og presentasjon | ny |
| 1 | 3 | `apprentice-mistake` | Lærlingen rotet | *History* | ny |
| 2 | 4 | `archive-model` | Rydd notatene | Innholdsmodell (modellbrett) | ny |
| 2 | 5 | `who-is-lying` | Hvem lyver? | *Reference* | erstatter `source-check` og `link-the-place` |
| 2 | 6 | `case-file` | Saksmappa | *Array of references* | endret |
| 3 | 7 | `baker-model` | Hva er en bestilling? | Modell, *validation* og *initial value* (modellbrett) | erstatter `baker-first-order` |
| 3 | 8 | `baker-sign` | Bodskiltet | *Portable Text* | endret |
| 3 | 9 | `morning-rush` | Morgenrushet | *Document action* og *validation* | erstatter `baker-ready` |
| 3 | ☆ | `baker-link` | (uendret) | | |

Den tekniske løypa endres ikke, bortsett fra der koden deles (se fase 5).

Sjekk at `Progress.completed` og `hints` fortsatt virker for lagrede spill med
de gamle id-ene. Uke 2 og 3 er ikke åpnet for deltakere ennå (åpner 7. og
14. desember), så det holder at gamle id-er ikke krasjer spillet.

---

## Fase 1: Felles grunnmur

Små endringer som alle de andre fasene bruker. Én commit.

1. **`topic`:** legg til `topic?: string` på `Quest` i `types.ts`. Bruk den til
   å vise Sanity-begrepet som en liten merkelapp under tittelen, der tittelen
   vises (tracker, journal, feiring, lukekort). For ikke-tekniske luker blir
   tittelen problemet i spillverdenen («Bodskiltet»), og `topic` blir begrepet
   (`"*Portable Text*"`). Tekniske luker kan la den være tom.
2. **`lesson.atWork`:** legg til `atWork?: string` i `lesson`. Det er én setning
   som starter med hva man gjør på jobb, og som passer både designer,
   prosjektleder og salg. Vis den under lærdommen i journalen og i feiringen,
   med etiketten «På jobb».
   - Eksempel for skiltet: «Du skriver teksten én gang, så bestemmer nettsiden,
     appen og skjermen i butikken hver for seg hvordan den ser ut.»
3. **`checkedBy: "board"`:** legg til verdien i typen. Den skal oppføre seg som
   `"window"`:
   - `nextStep.ts` får `{ kind: "board"; label: "Åpne modellbrettet"; questId }`;
   - `QuestTracker.runStep` kaller en ny `onOpenBoard(questId)`;
   - teksten for «ready» blir «Alle sjekker består. Lukk modellbrettet for å
     fullføre.»
   - Selve brettet kommer i fase 3. Her er det nok med typen og en stub som
     ikke gjør noe.
4. Test: utvid `nextStep`-testene (eller lag `nextStep.test.cjs` i
   `src/components/hud/`) slik at en board-luke gir «Åpne modellbrettet», og
   aldri peker tilbake til den som ga oppgaven.

## Fase 2: Uke 1 (Brann), to nye luker

Ingen avhengighet til modellbrettet. **Uke 1 åpner 1. desember, så denne fasen
er viktigst å bli ferdig med.** Én commit per luke.

### Luke 2 `weapon-description`: «Samme tekst, to steder»

- **Mål:** deltakeren ser at ett felt i Sanity vises på to flater med ulikt
  utseende, og at én endring oppdaterer begge.
- **I spillet:**
  - Brann ber om en beskrivelse av våpenet, slik at han kan sette det på tavla
    i smia.
  - Beskrivelsen vises (a) i infoboksen for våpenet, som finnes allerede, og
    (b) på en tavle eller et skilt i smia med en annen stil (stor, kort, bare
    første setning).
  - Bruk et Kenney-skilt eller en Kenney-tavle som finnes i `public/`. Mønsteret
    for et sted man går til er `villageSite` og `QUEST_SITES` i
    `src/game/village.ts`, og `BakerySign.tsx` fra uke 3 er et eksempel på en
    HUD-visning av publisert innhold.
- **Sjekk (`checkedBy: "game"`):** spilleren har minst ett publisert våpen der
  `description` har minst 10 tegn og er endret fra den beskrivelsen våpenet
  hadde da luka ble gitt.
  - Lagre utgangsverdien ved oppstart, på samme måte som `bakeryOrderId`
    lagres i `Progress`.
  - Meldingen skal si hva som mangler: «Beskrivelsen er ikke publisert ennå» /
    «Skriv minst én hel setning».
- **Etter luka:** outro-teksten ber deltakeren endre beskrivelsen én gang til og
  se begge stedene endre seg. Dette sjekkes ikke.
- **`atWork`:** «Skriv innholdet én gang, så kan nettside, app og nyhetsbrev vise
  det hver på sin måte.»
- **Åpen beslutning, ikke din:** skal beskrivelsen også vises på «Hvem er med»?
  Det betyr å endre `community.ts` og skrive mer til fellesprosjektet i
  produksjon. **Ikke gjør det.** Legg det som et spørsmål i rapporten.

### Luke 3 `apprentice-mistake`: «Lærlingen rotet»

- **Mål:** deltakeren lærer at et publisert dokument har historikk, og at
  man kan finne og gjenopprette en tidligere versjon.
- **Seeding (server, token bare i `.env.local`, som `/api/archive`):** når
  luka gis, oppretter spillet et våpen i deltakerens eget prosjekt med fast id
  `item-brann-anvil-hammer`:
  1. publiserer det med riktige verdier (navn «Brann sin hammer», en god
     beskrivelse, en kjent sprite);
  2. publiserer det på nytt med lærlingens feil (navnet staves feil,
     beskrivelsen er overskrevet med tull, og spriten er byttet).
  - Gjør begge som ekte publiseringer, så det blir to revisjoner i *History*.
  - Seed bare hvis dokumentet ikke finnes, og overskriv aldri senere endringer.
  - Legg ruten ved siden av de andre i `src/app/api/` og følg mønsteret der.
- **I spillet:** Brann viser hammeren på veggen med feil navn og feil sprite.
  Når den er rettet, ser den riktig ut igjen.
- **Sjekk:** det publiserte dokumentet har de opprinnelige verdiene for navn,
  beskrivelse og sprite. Spillet kan ikke bevise at *Restore* ble brukt i
  stedet for at feltene ble rettet for hånd. Det er akseptert, og lærdommen
  skal si det.
- **Hint:**
  1. «Åpne hammeren i Studio. Øverst til høyre finner du historikken.»
  2. «Velg versjonen før lærlingen var der. Se hva som er forskjellig.»
  3. «Trykk *Restore* og deretter *Publish*.»
  - Lenk til riktig side i Sanity-dokumentasjonen om document history.
    **Sjekk lenken med WebFetch.**
- **Verifiser først:** at *History* og *Restore* finnes på gratisplanen, og hvor
  lenge historikken tas vare på (sanity.io/pricing og dokumentasjonen). Seeding
  skjer minutter før deltakeren gjenoppretter, så kort lagringstid er greit.
  Finnes ikke *Restore* på gratisplanen, stopp luka og si fra.
- **`atWork`:** «Noen publiserte feil rett før lansering? Du kan gå tilbake til
  en tidligere versjon uten å be en utvikler om hjelp.»

## Fase 3: Modellbrettet (motor og vindu)

Den nye mekanikken. Kopier strukturen til kodevinduet: en ren motor med tester,
og et vindu som lastes bare når det åpnes. Én commit for motoren, én for vinduet
og én for koblingen.

### Motor: `src/game/modelBoard/`

Ren TypeScript uten React, med tester i `modelBoard.test.cjs`. Legg til mappen i
`test`-skriptet i `package.json`.

```ts
// Én oppgave på brettet. Notatet er kilden. Kortene er bitene i notatet.
export type BoardSlot = { id: string; label: string; about: string };
export type BoardCard = { id: string; text: string };   // en bit av notatet, ordrett
export type BoardToggle = "required" | "initial";       // brukes i uke 3

export type BoardDecision = {
  card: string;
  accept: string[];                       // slot-id-er som er riktige
  // Hva giveren sier når kortet står i en bestemt slot. Alle slots som ikke
  // er i accept, må ha en egen setning: konsekvensen i spillverdenen, aldri bare «feil».
  feedback: Record<string, string>;
  toggles?: Partial<Record<BoardToggle, { want: boolean; feedback: string }>>;
};

export type BoardTask = {
  id: string;                             // quest id
  note: string;                           // giverens notat, vises øverst
  slots: BoardSlot[];
  cards: BoardCard[];
  decisions: BoardDecision[];
  allowToggles?: BoardToggle[];
};

export type Placement = Record<string, { slot?: string; required?: boolean; initial?: boolean }>;

export function judgeBoard(task: BoardTask, placement: Placement): {
  done: boolean;
  requirements: { label: string; done: boolean; message?: string }[];
};
```

- `judgeBoard` gir ett krav per kort. `message` er feedback-setningen når det
  står feil.
- Testene skal dekke: tomt brett, alt riktig, hver feil plassering gir sin egen
  setning, og at hver `BoardTask` har feedback for alle slots som ikke er riktige.
  Den siste testen hindrer «bare feil».
- **Ingen valg med ett åpenbart svar:** hvert kort må ha minst én feil plass som
  virker fornuftig. Står ikke svaret klart før man har tenkt på giverens regel,
  er det riktig vanskelighetsgrad.

### Vindu: `src/components/hud/modelBoard/ModelBoard.tsx`

- Lastes med `dynamic()` / lazy, akkurat som `CodeWindow`.
- **Utforming:**
  - giverens notat øverst;
  - kortene som rad med knapper;
  - slots som kolonner, som på skissen under;
  - uke 3 viser to små brytere per plassert kort: «Påkrevd» og «Startverdi».

  ```
  Arkivarens notat: «21:40 – fotspor i snøen ved smia, tror jeg. Kari så det selv, tok bilde. Ikke sjekket.»
  [fotspor i snøen] [21:40] [ved smia, tror jeg] [Kari] [så det selv] [bilde] [Ikke sjekket]
  ┌ Tekst ┐ ┌ Ja/nei ┐ ┌ Bilde ┐ ┌ Liste med valg ┐ ┌ Reference → Sted ┐ ┌ Reference → Vitne ┐
  ```

- **Bruk:** klikk et kort, klikk en slot. Det skal virke med tastatur (Tab og
  Enter) og på mobil. Dra-og-slipp er valgfritt og kommer i tillegg. Kortet kan
  flyttes eller tas av igjen.
- **Svarer med en gang:** når et kort plasseres feil, vises giverens setning
  ved kortet. Når det er riktig, vises en hake (`IconCheck`). Tellingen
  «N av M» oppdateres live.
- Gjenbruk det som finnes: `frame frame--slate`, `QuestHint` (tre hint),
  `renderText`, `lukeName` og `StudioPractice` («Prøv i Studio» når brettet er
  løst). Ingen ny visuell stil. Se `globals.css` for klassene kodevinduet
  bruker.
- **Lagre underveis** i `localStorage` per quest-id (try/catch), så en halvferdig
  plassering overlever en reload.
- **Når alt er riktig:** kall `onSolved({})`. Det skriver `progress.solved[questId]`
  slik kodevinduet gjør, og Studio slår på modellen (fase 4 og 5). Lukkes
  brettet med alt riktig, fullføres luka som for `"window"`.

### Kobling

- I `GameClient.tsx`: state for åpent brett, `onOpenBoard` fra trackeren og
  journalen, og samme `onSolved` som kodevinduet.
- Brettet er ikke åpent mens karaktersiden, kartet eller Studio er åpent.
- `src/components/hud/modelBoard/tasks/index.ts` har oppgavene keyet på quest-id,
  som `WINDOW_TASKS`.

## Fase 4: Uke 2 (Arkivaren)

Én commit per luke. Oppdater seedingen i `src/game/archive.ts` og
`/api/archive` slik at den passer de nye lukene. Seed fortsatt bare i
deltakerens eget prosjekt, uten å overskrive egne endringer.

### Luke 4 `archive-model`: «Rydd notatene» (modellbrett)

- **Intro (Arkivaren):** notatene hennes er skrevet for hånd, og hun finner
  ingenting igjen. Før hun legger dem inn, vil hun bestemme *hvordan*.
- **Kort og riktige slots** (se skissen i fase 3):

  | Kort | Riktig | Feil, og hva Arkivaren sier (konsekvens) |
  |---|---|---|
  | fotspor i snøen | Tekst | Liste med valg: «Folk ser alt mulig. Jeg kan ikke lage en liste over alt.» |
  | 21:40 | Tekst | Ja/nei: «Det er et tidspunkt, ikke et ja eller nei.» |
  | ved smia, tror jeg | Reference → Sted | Tekst: «Da står det "smia", "Smia" og "ved smia". "Per sted" finner bare én av dem.» |
  | Kari | Reference → Vitne | Tekst: «Regelen min sier *et annet vitne*. "Kari" og "kari" blir to forskjellige vitner.» |
  | så det selv | Ja/nei | Tekst: «Jeg må kunne sortere på det. Fritekst kan ikke sorteres.» |
  | bilde | Bilde | Tekst: «Jeg vil se bildet, ikke en beskrivelse av det.» |
  | Ikke sjekket | Liste med valg | Ja/nei: «Ja/nei gir bare bekreftet eller ikke. Jeg trenger tre: *Unknown*, *Confirmed* og *Rumor*.» |

  Skriv resten av feedback-setningene selv i samme stil, slik at hvert kort har
  en setning for alle feil slots.
- **Når brettet er løst** (`isSolved("archive-model")`):
  - `structure.ts`: listene «Per sted» og «Bare bekreftede» vises for
    ikke-teknisk løype. I dag står det `isSolved("archive-lists") ||
    isTrack("nonTechnical")`. Bytt ikke-teknisk-delen til
    `isSolved("archive-model")`.
  - `archive.ts` (schema): feltene `place`, `witness` og `status` er skjult
    (`hidden`) for ikke-teknisk løype til brettet er løst. Teknisk løype ser dem
    som før. Dokumentene i Studio er de samme. Modellen deltakeren valgte er det
    som dukker opp.
  - Outroen sier hva som nettopp skjedde: «Se i Studio: modellen din er der nå.»
- **`atWork`:** «Det er dette du gjør før en utvikler skriver schemaet: bestemme
  hva innholdet er, og hvordan det henger sammen.»

### Luke 5 `who-is-lying`: «Hvem lyver?»

Erstatter `source-check` og `link-the-place`. Fem observasjoner, ikke ni. Det
er et lite deduksjonsproblem, og *reference* er nøkkelen til å løse det.

- **Seed fem observasjoner** med status `unknown`:
  - **A:** sett selv, med bilde, sted Smia → *Confirmed* (bilde).
  - **B:** sett selv, Ola, sted Bakeriet → *Confirmed* (C er et annet vitne på
    samme sted).
  - **C:** sett selv, Kari, **bare `placeNote: "bakriet"`**, ingen `place` →
    *Confirmed*. Men det ser man først når stedet er koblet.
  - **D:** sett selv, Ola, sted Bakeriet → *Rumor*. Det er samme vitne som B,
    ikke et annet.
  - **E:** hørt fra andre (`seen: false`), uten bilde, sted Torget → *Rumor*.
  - Juster `what` og `time` slik at det gir en sammenheng mot bakeriet.
- **Intro:** Arkivarens regel, som i dag: bekreftet hvis sett selv og med bilde,
  eller hvis et *annet* vitne så det samme stedet.
- **Sjekk:** alle fem har riktig publisert status, og C har `place` →
  `place-bakeriet`. Gjenbruk og tilpass `sourceCheckScore` og `linkScore`.
  - To objectives: «N av 5 har riktig status» og «Stedet er koblet».
- **Hint:**
  1. «Én av dem mangler sted. Den kan ikke sjekkes før den har det.»
  2. «Bruk "Per sted". Hvem så hva på Bakeriet?»
  3. «"Et annet vitne": se på navnet, ikke bare stedet.»
- **`atWork`:** «En *reference* gjør at innhold kan sammenlignes og filtreres. Det
  kan ikke tekst som staves ulikt.»

### Luke 6 `case-file`: «Saksmappa»

- **Som i dag:** en *Case* med alle bekreftede observasjoner (A, B og C) og
  ingen rykter. Oppdater `caseFileScore` til det nye settet.
- **Nytt:** den publiserte saksmappa vises på **oppslagstavla på torget**.
  - Den viser tittel og observasjonene, med stedsnavnet hentet *gjennom*
    referansen (GROQ `place->name`), ikke kopiert.
  - Lag den som en HUD-visning som `BakerySign.tsx`, med et Kenney-skilt eller
    en Kenney-tavle ved torget.
- **Outro:** «Prøv å gi et sted nytt navn i Studio og publiser. Se på tavla.»
  Tavla oppdateres fordi mappa peker og ikke kopierer. Ikke sjekket, men tavla
  må faktisk oppdateres (les på nytt når Studio lukkes, som de andre visningene).
- **`atWork`:** «Én kilde, mange steder: endrer du den ett sted, er den riktig
  overalt.»

## Fase 5: Uke 3 (Bakeren)

Én commit per luke. **Teknisk løype skal oppføre seg nøyaktig som før.** Kjør
testene for `bakerTemplate`, `bakerForge` og `bakerFunction` etter hver commit.

### Luke 7 `baker-model`: «Hva er en bestilling?» (modellbrett med brytere)

- **Notat fra Bakeren:** «Lussekatter til Brann, fredag. Ny.» Bakeren skriver
  status og dato om igjen hver gang og glemmer varen av og til.
- **Kort:** `Lussekatter` → Tekst, `Brann` → Tekst, `fredag` → Dato,
  `Ny` → Liste med valg.
- **Brytere** (`allowToggles: ["required", "initial"]`):

  | Kort | Påkrevd | Startverdi | Hvorfor (Bakeren) |
  |---|---|---|---|
  | Vare | ja | nei | «En bestilling uten vare er ingenting. Men varen kan jeg ikke vite på forhånd.» |
  | Bestilt av | **nei** | nei | «Noen ganger vet jeg ikke hvem. Da vil jeg ikke bli stoppet.» Dette er det ekte dilemmaet. |
  | Dato | ja | ja (i dag) | «De fleste bestiller til i dag.» |
  | Status | ja | ja («ny») | «Alt begynner som nytt.» |

- **Når brettet er løst** (`isSolved("baker-model")`):
  - `bakeryOrder.ts`: `initialValue` gjelder for ikke-teknisk løype når
    brettet er løst (i dag `isTrack("nonTechnical")`).
    `isSolved("baker-template")` for teknisk løype endres ikke.
  - *Validation*: `required()` på vare, dato og status gjelder for ikke-teknisk
    løype først når brettet er løst. For teknisk løype er den som i dag.
- **Del to, i Studio:** lag og publiser én ny bestilling. Sjekk som i dag med
  `isNewOrder`, og lagre `bakeryOrderId`.
- **Sjekk:** `done` er sant når brettet er løst **og** den nye bestillingen er
  publisert. Neste steg-knappen viser «Åpne modellbrettet» til brettet er løst,
  og deretter «Åpne Sanity Studio».
- **`atWork`:** «Du spesifiserer, utvikleren bygger. Påkrevde felt og
  startverdier er det du kan be om for å slippe feil og dobbeltarbeid.»

### Luke 8 `baker-sign`: «Bodskiltet»

- **Som i uke 3-grenen:** skriv skiltet i Studio, gjør det viktigste ordet fett,
  publiser, og skiltet hentes ved bodskiltet.
- **Nytt:** de samme *Portable Text*-blokkene vises på to flater med ulik stil:
  1. skiltet ved bakeriet (finnes);
  2. en smal stripe i HUD-en med første linje (kort, liten skrift, fet som
     uthevet farge i stedet for fet).
  - Bruk samme data og samme renderer med to sett marks/styles. Det er poenget.
- **`atWork`:** «Teksten bærer ikke utseendet. Den sier bare hva som er viktig.
  Hver flate bestemmer selv hvordan "viktig" ser ut.»

### Luke 9 `morning-rush`: «Morgenrushet»

Erstatter `baker-ready`.

- **De tre ventelappene** (Brann, Arkivaren, Kari, status «venter») og
  bestillingen fra luke 7 skal bli klare før markedet:
  - **Brann:** komplett.
  - **Arkivaren:** mangler dato.
  - **Kari:** mangler vare, fordi Bakeren ikke kunne lese lappen. Snakk med Kari
    i bygda (E): «Julekake, selvfølgelig!» Dette gir en grunn til å gå ut i
    bygda.
- **Seeding:** oppdater ventelappene i `src/game/bakery.ts` og `/api/bakery` til
  denne tilstanden. Seed fortsatt bare én gang, og overskriv aldri.
- **«Klar»** (`BakeryActions.ts`) er deaktivert så lenge dokumentet har
  *validation*-feil. Bruk Studio-APIet for valideringsstatus, og sjekk det i
  Sanity-dokumentasjonen for versjonen i `package.json`. Knappen finnes for
  ikke-teknisk løype fra luke 9. Publish er alltid hovedknappen.
- **Sjekk:** alle fire er publisert med status «klar». Objectives:
  «N av 4 bestillinger er klare».
  - Når en bestilling blir klar, sier kunden én linje neste gang du går forbi.
    Er det for mye, holder det med en linje i outroen.
- **Hint:**
  1. «Hvorfor er Klar grå på to av dem? Se etter røde felt.»
  2. «Datoen kan du fylle inn selv. Varen må du spørre Kari om.»
  3. «Fyll inn feltet, og trykk så *Klar*.»
- **`atWork`:** «Regler og egne knapper gjør at ingen sender ut noe halvferdig,
  uten at du må huske alt selv.»
- **Krona** (`hat:crown` i `wardrobe.ts`) gis fortsatt når de tre kjernelukene
  i uke 3 er ferdige. Oppdater id-ene for ikke-teknisk løype i
  `GEAR_REWARDS`.

### Rydd opp i uke 3

- Fjern `useBakeryReady` i `solved.tsx` hvis den ikke lenger brukes, eller
  oppdater den til `morning-rush`.
- Oppdater `QUEST: Luke N`-kommentarene i schema-filene til de nye
  dørnumrene.

## Fase 6: Gjennomspilling og dokumenter

1. **Spill som ny ikke-teknisk spiller** i nettleseren på `localhost:3000`
   (tøm `localStorage` først, og bruk **eget** Sanity-prosjekt, aldri felles
   produksjon):
   - følg neste steg-knappen gjennom uke 1–3;
   - bruk `?dev` bare til å hoppe til riktig uke;
   - noter hvor knappen leder i hvert steg, og ta tiden per luke.
2. **Gå gjennom de fem spørsmålene og de fem testene** i luke-design-skillen
   for hver ny luke, og skriv tabellen i rapporten.
3. **Oppdater dokumentene:**
   - `docs/questplan.md`: læringsmålene, den nye tabellen for uke 2–3 og
     ikke-teknisk uke 1;
   - `docs/uke1-luker.md`: de to nye lukene erstatter forslagene der;
   - `docs/neste-steg.md`: status.
4. `npm test`, `npx tsc --noEmit`, `npx eslint` på endrede filer og
   `npm run verify-release -- --build`. Ikke dårligere enn i fase 0.

## Ferdig når

- [ ] Alle ni kjerneluker i ikke-teknisk løype kan spilles fra start til slutt
      på eget prosjekt.
- [ ] Hver ny luke har `topic`, `atWork`, `goalPreview`, tre hint med lenker
      som er sjekket, og en presis melding om hva som mangler.
- [ ] Modellbrettet virker med mus, tastatur og på mobilbredde (375 px), og
      gir giverens setning for hver feil plassering.
- [ ] Teknisk løype oppfører seg som før (egne tester grønne).
- [ ] Neste steg-knappen peker aldri tilbake til den som ga oppgaven.
- [ ] Ingen push, ingen PR, ingenting skrevet til fellesprosjektet i
      produksjon.

## Rapport til brukeren

Skriv til slutt på norsk:

- hva som er gjort per fase, med commit-hash;
- tabellen med de fem spørsmålene per ny luke;
- målt tid per luke fra gjennomspillingen;
- hva som ikke er verifisert (for eksempel ekte Studio-oppførsel du ikke kunne
  prøve);
- åpne spørsmål, minst: skal beskrivelsen vises på «Hvem er med» (luke 2), og
  finnes *Restore* på gratisplanen (luke 3).
