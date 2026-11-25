# Plan: sideoppdrag

Status: godkjent 2026-11-24. S0, S1 og S2 er bygget bak flagget. Kartprikkene og journalsiden kom med i PR 31.
Skrevet 2026-11-24. Påstandene om koden er sjekket mot `main` (b3c645f).

## 1. Kort fortalt

- Sideoppdrag er små, frivillige ønsker fra folk i bygda: Kari, Brann, Bakeren og Arkivaren. De gir utstyr, og senere XP.
- Halvparten er **Sanity-oppdrag**: lag eller endre noe i Studio, med ting du har lært i lukene. Resten er **verdensoppdrag**: finn, hent og lever.
- Seks oppdrag går i bygda slik den er i dag. To venter på det rolige området (fase B i `plan-utforsking.md`). Sammen gir de en kilde til åtte av de ni tingene i `HIDDEN_GEAR`. Den niende, rustningen, hører hjemme i grotta.
- Sideoppdragene får sin egen lille motor og sitt eget felt i `Progress` (`side`). De rører aldri `completed`, `evaluateQuests` eller fellesserveren.
- En luke vinner alltid: om markøren over hodet, om <kbd>E</kbd> og om plassen i sporingen.
- Alt ligger bak `FEATURES.sideQuests`. Fase 1 kan nå deltakerne med `git pull` før uke 2 åpner 7. desember.

## 2. Mønstrene vi låner

### Hva andre spill gjør

| Spill | Mønster | Hva vi tar med |
| --- | --- | --- |
| Stardew Valley, **Help Wanted** | Korte forespørsler på oppslagstavla: lever en ting, samle, slå monstre, fiske. Tavla får et gult `!` når det er noe nytt. Du har to dager på deg, og det koster ingenting å takke ja og så la være. Journalen teller fremgangen, og du fullfører ved å snakke med den som spurte. En levering må gis til personen, det holder ikke å ha tingen på deg. ([Quests: Help Wanted](https://stardewvalleywiki.com/Quests#Help_Wanted_Quests)) | Små mål med én levering til giveren. Ingen straff for å la være. Belønningen kommer fra den som spurte. |
| Stardew Valley, **Special Orders** | Større oppdrag fra en egen tavle. Nye kommer hver mandag, fristen er 7–28 dager, og flere kan være i gang samtidig. De fullføres av seg selv uten å snakke med noen, og kan ikke avbrytes. ([Quests: Special Orders](https://stardewvalleywiki.com/Quests#Special_Orders)) | Ukerytmen: nye oppdrag kommer med ukas kapittel, og flere kan være i gang. Ikke fristene. |
| Stardew Valley, **vennskap** | Hvert hjerte er 250 poeng. En levering gir 150 poeng med den som spurte, og hjertene åpner nye scener. ([Friendship](https://stardewvalleywiki.com/Friendship)) | Bare ideen om at en person kan ha flere oppdrag etter hverandre (Kari i uke 1 og uke 2). Ingen poeng. |
| Stardew Valley, **buntene i Community Center** | Du gir ting til en bunt. Hver bunt gir en belønning med en gang, og et fullt rom gir noe hele bygda merker. ([Bundles](https://stardewvalleywiki.com/Bundles)) | Bakerens kurv: tre ulike ting gir én belønning. |
| Zelda, **byttekjeder** | En kjede av bytter: Link hjelper én person og får en ting som en annen trenger. I de fleste Zelda-spill er kjeden frivillig. I Link's Awakening er noen av byttene påkrevd. ([Zelda Wiki: Trading Quest](https://zeldawiki.wiki/wiki/Trading_Quest)) | At ett oppdrag kan åpne det neste (`requires.side`). Ikke lange kjeder. |
| Animal Crossing, **små tjenester** | Naboer ber om små ting, som å levere en gave eller finne noe de har mistet, og gir en liten belønning. Tjenesten gjelder til naboen legger seg. Den spores i samtalen: naboen minner deg på hva som gjenstår. ([Nookipedia: Favor](https://www.nookipedia.com/wiki/Favor)) | Tonen: små, koselige ønsker med varm takk. Giveren minner deg på målet når du snakker med dem. |
| World of Warcraft, **markører** | Gul `!` over den som har et oppdrag, også på minikartet. Sølv `?`: i gang. Gul `?`: klart til levering. Hovedhistorien har et eget merke, så den skiller seg fra de frivillige sideoppdragene. ([Quest](https://warcraft.wiki.gg/wiki/Quest), [Quest giver](https://warcraft.wiki.gg/wiki/Quest_giver)) | `!` og `?` som kjente tegn. Lukene beholder den gule `!` alene, slik hovedhistorien har sitt eget merke. Givere bør også synes på kartet. |

Kildene er lest direkte 2026-11-25: Stardew-wikien, Warcraft-wikien og Zelda Wiki i nettleseren, og Nookipedia med henteverktøyet. Zelda Dungeon krever en robotsjekk og er ikke brukt.

### Journalen mot god praksis

Oppdatert 2026-11-25: hullene i tabellen er tettet, bak samme flagg. Brann nevner sideoppdragene én gang, rett etter luke 1.

Stardew-journalen åpnes fra et `!` under klokka eller med <kbd>F</kbd>. Den lister oppdragene med tittel, og hvert oppdrag kan åpnes for å lese teksten og kravene. Fremgangen telles i journalen og vises også under `!`-et mens du samler. Den har en X for å lukke og en knapp for å avbryte et oppdrag. ([Quests](https://stardewvalleywiki.com/Quests)) Et innlegg på Game Developer om UX for oppdrag anbefaler omtrent det samme: tittel og mål med en gang, hvordan du gjør det, hvor langt du har kommet, beskjed når det går fremover, et tydelig signal når det er ferdig, og at spilleren aldri står uten noe å gjøre ([Game Developer](https://www.gamedeveloper.com/design/clearly-and-considerately-ux-designing-of-quest), et blogginnlegg, ikke en standard).

| Praksis | Hos oss | Hva mangler |
| --- | --- | --- |
| Liste med tittel som kan åpnes for tekst og krav | ✓ Lukene, og sideoppdrag har egen side i journalen: replikken, målet, trinnene, hint og «Gå til» | – |
| Fremgang i journalen (Stardew teller «0/10») | ✓ Trinnene hakes av (`sideObjectives`), og lista viser «1 av 3» | – |
| Beskjed når noe går fremover | ✓ Toast for hvert funn, og «Klart: Noe varmt. Gå til Kari og lever.» når et Studio-trinn består | – |
| Tydelig signal når det er ferdig | ✓ Blå `?`, sporingslinje og toast | – |
| Hvor du skal | ✓ «Gå til» for givere. Kartet viser blå `!`/`?` over givere og neste sted på et spor | – |
| Hovedoppdrag og sideoppdrag holdes fra hverandre | ✓ Gul `!` for luker, blå for sideoppdrag, egen seksjon | – |
| Aldri uten noe å gjøre | ✓ Sporingen nevner et sideoppdrag når ingen luke venter | – |
| Avbryte et oppdrag | ✗, med vilje: ingen grense, ingen straff og få oppdrag. Special Orders kan heller ikke avbrytes | – |
| Ikke rot i lista | ✓ Ferdige er foldet sammen, låste vises ikke | – |

### Byggeklossene vi bruker

- **Hvem som gir:** en person i bygda. Ingen oppslagstavle for sideoppdrag. Tavla (`noticeboard`) er allerede en luke-plass (luke 2 teknisk og saksmappa), og en ny bruk der ville skapt kollisjoner med <kbd>E</kbd>.
- **Synlighet:**
  - en liten, blå `!` eller `?` over personen;
  - en seksjon i journalen;
  - en linje i sporingen bare når ingen luke venter.
- **Mål:**
  - snakk med;
  - finn (gå til et punkt og trykk <kbd>E</kbd>);
  - lag i Studio (spillet ser det publiserte);
  - lever (gå tilbake til giveren).

  «Beseir» og «nå et område» kommer med fase B og C.
- **Tilstander:** `available` → `active` → `ready` → `done`. «Akseptert» og «i gang» er slått sammen. I et spill uten frister er de det samme.
- **Belønning:** utstyr nå, og senere XP og materialer gjennom én `Reward`-type. Oppdragene kan ikke gjentas.

### Hva vi bevisst lar være

- **Frister** (Help Wanted, Special Orders). Deltakerne spiller i korte økter på egen tid, og en frist straffer den som har en travel uke.
- **Hjertepoeng og gaveøkonomi.** Det er et nytt system å forklare, og det er lite å vinne på tre uker.
- **Oppdrag som kan gjentas, og tilfeldige oppdrag.** De trenger balanse og innhold vi ikke har tid til. Seks gode oppdrag er bedre enn uendelig mange tynne.
- **Penger.** Spillet har ingen valuta, og vi lager ikke en for dette.
- **Lange byttekjeder.** Ett trinn med «dette åpner neste» er nok.
- **Oppdrag som krever en luke man ikke har kommet til.** Alle Sanity-oppdrag øver på noe fra en luke som er gjort (`requires.luke`).

## 3. Datamodell

### Egen motor, ikke `evaluateQuests`

`evaluateQuests` (`src/game/quests/engine.ts`) er laget for en kjede:

- Hver luke venter på den forrige (`previousResolved`).
- Kapitlene åpner på datoer.
- Den teller «N av M».
- Den har `briefed` og `pickup`.
- En luke blir `done` av seg selv når sjekken består.

Sideoppdrag trenger det motsatte:

- de har ingen rekkefølge;
- flere kan være i gang samtidig;
- de har en egen `ready`-tilstand, der sjekken består, men du må levere;
- de skal aldri telles med lukene.

**Anbefaling:** lag en egen, ren funksjon `evaluateSideQuests` i `src/game/sideQuests/engine.ts`. Den gjenbruker `QuestContext`, `CheckResult` og `chapterOpensAt`, så sjekkene leser de samme dataene som lukene. `evaluateQuests` endres ikke.

Fullførte sideoppdrag skal **ikke** ligge i `Progress.completed`. Den listen sendes til fellesserveren (`GameClient.tsx`, `questIds: Object.keys(progress.completed)`). Serveren avviser hele innsendingen hvis én id ikke er en luke (`community.ts`, `questTitles.has(id)`). Et sideoppdrag der ville stoppe «Hvem er med» for spilleren.

### Typer

Nye filer:

- `src/game/sideQuests/types.ts` for typene;
- `src/game/sideQuests/data.ts` for oppdragene (`SIDE_QUESTS`), steder og eventuelle nye personer;
- `src/game/reward.ts` for `Reward`. Fase A i `plan-utforsking.md` bygger videre på den.

```ts
// src/game/reward.ts. One reward type for lukes, side quests, chests and
// monsters (plan-utforsking.md). Phase 1 only reads `unlock` with "gear:".
export type Reward = {
  xp?: number;
  items?: { id: string; count: number }[];
  unlock?: string[]; // "gear:hat:bobble", later "recipe:…", "area:…"
};
```

```ts
// src/game/sideQuests/types.ts
import type { CheckResult, Hint, QuestContext } from "../quests/types";
import type { Reward } from "../reward";
import type { SpriteSheet } from "../sprites";
import type { NpcId } from "../village";

// New people outside NPCS (phase B): «fiskeren», «barnet». NPCS stays luke-only.
export type SideNpcId = "fisher" | "child";
export type GiverId = NpcId | SideNpcId;

// An invisible point you walk to and press E. Same idea as «overraskelser».
export type SideSpot = {
  id: string; // "flour-sack"
  area: "bygda"; // later: "skogkanten", … (Area.id in plan-utforsking.md)
  x: number; // feet position, px
  y: number;
  prompt: string; // «Se i snøen»
  prop?: { sheet: SpriteSheet; frame: number }; // shown once the step is active
};

export type SideStep =
  | { kind: "find"; spot: string; label: string }
  | { kind: "talk"; to: GiverId; line: string; label: string }
  | {
      kind: "studio"; // made or changed in the player's own Studio
      label: string;
      check: (ctx: SideContext) => CheckResult;
    };
// Later: { kind: "defeat"; enemy: string; count: number } (phase C)

export type SideRequires = {
  luke?: string[]; // at least one of these is completed (tracks differ)
  side?: string[]; // all of these side quests are done
  chapter?: number; // this chapter has opened (chapterOpensAt)
  // area?: string; level?: number;  phase B and A
};

export type SideQuest = {
  id: string; // never the same as a luke id (test)
  title: string; // «Noe varmt»
  giver: GiverId;
  kind: "world" | "sanity";
  topic?: string; // the Sanity term practised, as in Quest.topic
  requires: SideRequires;
  ask: string[]; // what the giver says; each page at most two sentences
  goal: string; // one line for the journal
  steps: SideStep[]; // in order; delivery to the giver comes after the last
  thanks: string; // said when you deliver
  reward: Reward;
  hint?: Hint; // one hint, not three: these are optional
};

export type SideStatus = "locked" | "available" | "active" | "ready" | "done";

export type SideState = {
  quest: SideQuest;
  status: SideStatus;
  step: number; // index of the step in progress; steps.length when ready
  result?: CheckResult; // for a studio step
};

// QuestContext plus what only side quests need.
export type SideContext = QuestContext & {
  ownObservations?: { _id: string; witness?: string; place?: string }[] | null;
};
```

```ts
// src/game/sideQuests/engine.ts
export function evaluateSideQuests(
  quests: SideQuest[],
  chapters: Chapter[], // the same track-filtered chapters as the board
  ctx: SideContext,
  now: Date,
  devUnlock = false, // ?dev: requires are ignored, like the lukes
): SideState[];

// Which giver shows which marker. Givers with a luke «!» get nothing.
export function sideMarkers(
  states: SideState[],
  lukeMarker: NpcId | null,
): Partial<Record<GiverId, "!" | "?">>;
```

`find`- og `talk`-trinn går videre når spilleren trykker <kbd>E</kbd>, og det lagres. `studio`-trinn går videre så lenge sjekken består. De leser dataene på nytt hver gang, slik lukene gjør. Et `studio`-trinn som er det siste, gjør oppdraget `ready`.

### Hva som lagres i `Progress`

To nye felt i `src/game/quests/types.ts`:

```ts
// Side quests the player has taken: when, how far, and when delivered.
side: Record<string, { at: string; step: number; done?: string }>;
// Spots found once (side quest steps now, «overraskelser» in phase B).
found: Record<string, true>;
```

- **Utstyr regnes ut. Det lagres ikke.** `ownedGear` i `src/game/wardrobe.ts` får `Pick<Progress, "completed" | "side">`. Den legger til `gear:`-delene fra `reward.unlock` for hvert levert sideoppdrag, slik `GEAR_REWARDS` gjør for luker i dag.
  - **Her foreslår vi noe annet enn `plan-utforsking.md`.** Den vil lagre opplåsinger i `unlocked`. Vi foreslår å lagre fakta (`side[id].done`) og regne ut belønningen.
  - Da får sideoppdrag som er levert før fase A, XP med tilbakevirkende kraft. Det trengs ingen migrering.
  - Endrer vi en belønning, gjelder endringen for alle.
  - `unlocked` trengs fortsatt for det som ikke har et fast faktum, som kister som blandes tilfeldig i grotta. Det avgjøres i fase A.
- **Migrering i `readProgress`** (`src/game/quests/progress.ts`):
  - `side` og `found` legges i `EMPTY_PROGRESS` som `{}`.
  - De vaskes som `seenGear`: de må være et objekt og ikke en liste.
  - Ukjente oppdrags-id-er i `side` blir liggende, men ignoreres av motoren. Da tåler lagringen at et oppdrag fjernes eller får nytt navn.
- **Gammel versjon og ny lagring:** dagens `readProgress` sprer `...saved`, og `updateProgress` skriver hele objektet tilbake. En deltaker som ikke har kjørt `git pull`, beholder derfor `side` og `found` urørt. Det skal en test bevise.
- **Regel:** felt i `Progress` legges bare til. De får aldri nytt navn eller ny betydning. Da trengs ingen versjonsnummer.

### Endringer i eksisterende kode

| Fil | Endring |
| --- | --- |
| `src/game/features.ts` | `sideQuests: process.env.NEXT_PUBLIC_FEATURE_SIDE_QUESTS === "1"`. Når fase 1 er klar, snus standarden: på, med `"0"` for å slå av, og sendes med `git pull`. |
| `src/game/quests/types.ts`, `progress.ts` | `side` og `found`, med vasking. Se over. |
| `src/game/wardrobe.ts` | `ownedGear` leser også `side`. |
| `src/game/figure.ts` | Ingen endring. `HIDDEN_GEAR` står til tingen er din, og da viser karaktersiden den som før. |
| `src/game/bridge.ts` | `Zone` får `` `side:${string}` ``. `WorldState` får `sideMarkers` og `sideProps` (spot-id-er som skal vises). |
| `src/game/WinterQuestScene.ts` | Liten blå `!`/`?` per giver, laget én gang i `buildCharacters`. Props for aktive spots. `updateZone` sjekker sideoppdrag **etter** alle luke-plassene. |
| `src/components/GameClient.tsx` | <kbd>E</kbd> for sideoppdrag sist i `onKey`. Ny prompt «<kbd>E</kbd> Se i snøen». `useSideQuests` kobles inn ved siden av `useQuestBoard`. |
| `src/components/hud/useSideQuests.ts` (ny) | Leser `Progress`, kjører `evaluateSideQuests` og har `accept`, `advance` og `deliver`. Ved levering vises et toast. |
| `src/components/hud/SideQuestDialogue.tsx` (ny) | Samme ramme og CSS som `ForgeDialogue`, men en egen komponent, så luke-samtalen ikke endres. |
| `src/components/hud/ForgeDialogue.tsx` | Én knapp på siste side, «Noe annet?», når personen har et sideoppdrag. Den åpner `SideQuestDialogue`. |
| `src/components/hud/QuestLog.tsx` | Seksjonen «Sideoppdrag» nederst i fanen Uka. Prikker for givere på kartet. |
| `src/components/hud/QuestTracker.tsx` | Én linje når `board.current` er `null`, eller når et sideoppdrag er `ready`. Se del 4. |
| `src/components/hud/DevPanel.tsx` | Knappene «Fullfør» og «Nullstill» per sideoppdrag. |
| `src/app/api/archive/route.ts` | GET henter også spillerens egne observasjoner utenom `ARCHIVE_IDS` (S5). Ingen nye ruter. |
| `src/sanity/schemaTypes/**` | **Ingen endring.** Det er spillerfiler (`utviklingsplan.md`), så sideoppdrag bruker bare typene som finnes: `item`, `observation`, `place` og `witness`. |

## 4. Visning og bruk

### Hvor man ser dem

- **I verden:** en liten markør over giveren. `!` betyr at personen har noe til deg, og `?` at du kan levere.
  - Markøren er frostblå og mindre enn luke-`!`-en (12 px i `#fdbe53`), og den hopper ikke.
  - Bonusluker har `?` i vinduet over en plass, ikke over hodet til en person, så de kan ikke forveksles.
- **I journalen:** seksjonen «Sideoppdrag» nederst i fanen Uka, under ukas luker.
  - Øverst står det som er i gang og det som er klart, med ett mål og hvor.
  - Under står de tilgjengelige, som «Kari har noe på hjertet» og hvor hun står.
  - Ferdige oppdrag er foldet sammen: «Ferdig (3)».
  - Ingen egen fane. Det finnes allerede fire (Uka, Kart, Boka og Andre), og det er trangt på mobil.
- **På kartet:** en liten prikk ved givere med `!` eller `?`.
- **I sporingen:** sporingen er for neste luke og forblir det. Den viser én linje for sideoppdrag bare:
  - når ukas luker er ferdige (`board.current === null`), for eksempel «Ukas luker er ferdige. Kari har noe til deg.» med «Gå til»;
  - eller når et sideoppdrag er `ready`: «Klart å levere: Noe varmt».

  Da fyller sideoppdragene tomrommet mellom ukene, slik Help Wanted fyller dagene i Stardew.
- **I Boka:** ingenting. Lærdommene hører til lukene.

### Markøren konkurrerer ikke med lukene

`sideMarkers` får `npcMarker` fra `GameClient` og gir **ingen** sidemarkør til en person som:

- har en luke-`!` (`npcMarker === id`);
- er giver for `board.current` mens den er `offered`;
- er den `board.current` spør etter (`shouldShowQuestNpc`, som Kari i Morgenrushet).

Lukene vinner alltid. Sidemarkøren kommer tilbake når luka er hentet.

### <kbd>E</kbd> når flere ting er nær

- **Én tast, én handling, fast rekkefølge.** `onKey` i `GameClient.tsx` sjekker i dag: snakk (`talkTo`), luke på stedet (`siteQuest`), bodskiltet og saksmappa. Sideoppdrag legges til **sist**.
- **Egne soner.** Steder og nye personer for sideoppdrag får `side:<id>` som sone. De deler ikke `QuestSiteId`, slik Kari gjør med `westHouse` i dag.
- **Avstandsregel med test.** Hvert `SideSpot` og hver ny person skal stå:
  - minst 56 px (2 × `FORGE_RANGE`) fra alle `QUEST_SITES`, `DOOR_ANCHORS` og `NPCS`;
  - minst 68 px (`WRAITH_RANGE` + `FORGE_RANGE`) fra `WRAITH_HOME`.

  Regelen sjekkes i `sideQuests.test.cjs`, slik `village.test.cjs` sjekker Kari i dag. Kollisjonen mellom Kari og luke 3 blir dermed en test, ikke noe vi oppdager i testspilling.
- **Personer som har både luker og sideoppdrag** (Brann, Arkivaren, Bakeren og Kari) gir sideoppdraget i samtalen, ikke med en egen <kbd>E</kbd>. Luke-samtalen kommer først. «Noe annet?» står på siste side, og bare når personen har et sideoppdrag og ingen luke venter hos dem.
- **Paneler:** `frozen` i `WorldState` dekker allerede `SideQuestDialogue`. Ved publisering lukkes panelene som i dag (PR 28). `SideQuestDialogue` følger samme regel og har X i hjørnet.

### Feiring

Mindre enn en luke, men med minst to kanaler (`luke-design`):

1. Giveren sier `thanks` i samtalen, med bildet av tingen du får.
2. Et toast (`pushToast`, tone `"forge"`): «Du fikk Topplue. Trykk C for å ta den på.» Teksten er foreslått i `neste-steg.md`.
3. Merket «ny» på Utstyr-fanen. Det finnes allerede gjennom `seenGear`.

Ingen `QuestCelebration`, ingen lys i en luke og ingen side i Boka. Feiringen viser ikke nivå før fase A.

### Mobil og liten skjerm (`useNarrow`, ≤ 720 px)

- Prompten er en knapp, som i dag, så <kbd>E</kbd> kan trykkes.
- `SideQuestDialogue` bruker samme sider som `ForgeDialogue`.
- Sidelinja i sporingen vises ikke på smal skjerm. Journalen er stedet.
- Sjekk på 375 px, 1280×720, 1440×900 og 1920×1080 med fersk, delvis og ferdig fremgang (`utviklingsplan.md`, 2026-11-13).

## 5. Innholdet i første versjon

Regler for alle:

- Replikkene er korte, med høyst to setninger før du kan gjøre noe.
- Sanity-oppdrag lager **aldri våpen**. Lukene leser våpen: luke 1, beskrivelsen i luke 2 og «Smi». Et nytt våpen kan bli utstyrt automatisk og rote til en luke.
- Sanity-oppdrag bruker heller **aldri `bakeryOrder`**. Luke 7 og 9 (ikke-teknisk) og luke 11 (teknisk) reagerer på nye bestillinger.
- En ting du har laget før, teller. Det er som en levering i Stardew: har du den, kan du gi den.

| # | Tittel | Giver og sted | Åpner | Type | Replikk | Mål | Sjekk | Belønning | Krever |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | Noe varmt | Kari, ved huset vest i bygda | Etter luke 1 (`the-broken-forge`) | Sanity: *Publish* | «Det er så kaldt i dag. Har du noe varmt å drikke?» | Publiser en ting med Kind `Potion` | `items` fra `/api/items` (live): `source === "sanity" && kind === "potion"` | Topplue (`gear:hat:bobble`). «Jeg strikket en til deg.» | Bygda som i dag |
| S2 | Malm til smia | Brann, ved smia | Etter luke 1 | Sanity: *document*, `description` | «Jeg trenger malm, og jeg vil vite hvor den kom fra.» | Publiser en ting med Kind `Material` og en beskrivelse | `kind === "material"` og en `description` på minst 20 tegn (startverdi, se del 7) | Lærvest (`gear:armour:leather`) | Bygda som i dag |
| S3 | Melsekken | Bakeren, ved bakeriet | Når uke 2 åpner (`chapter: 2`) | Verden: finn og lever | «Noen rev opp melsekken min i natt. Kan du se hvor sporet går?» | Følg melsporet og finn det som ble tatt | Tre `find`-trinn: veien ved bakeriet (rute 33,17), lenger vest (26,18) og nede på sørveien (21,26), der et brød fra Tiny Farm ligger. Plassene holder avstandsregelen (testet). | Kappe (`gear:extra:cape`) | Bygda. Nye props fra arkene vi har. |
| S4 | Det plasket i brønnen | Arkivaren, på torget | Etter `follow-the-trail` eller `who-is-lying` | Verden med Sanity-spor | «Jon hørte noe plaske i brønnen, to ganger, men arkivet kaller det rykter. Kan du sjekke selv?» | Finn det som ligger ved brønnen | `find` ved brønnen (rute 24,15, med bøtta fra Tiny Farm). Hintet sier hvor brønnen står. Et GROQ-hint ble droppet, fordi spillerens eget prosjekt bare har de fem observasjonene fra «Hvem lyver?», og ingen av dem er ved brønnen. | Ringbrynje (`gear:armour:chain`) | Bygda |
| S5 | Det Kari så | Kari, ved huset vest i bygda | Etter S1, og etter `case-file` eller `who-points-here` | Sanity: `reference` | «Jeg så spor langs gjerdet, men ingen har skrevet det ned.» | Publiser en observasjon med Kari som vitne og Gjerdet som sted | `/api/archive` (utvidet): en publisert `observation` utenfor `ARCHIVE_IDS` med `witness._ref == "witness-kari"` og `place._ref == "place-gjerdet"`. Teknisk spor får arkivet seedet når oppdraget tas (samme POST som i dag). | Vikinghjelm (`gear:hat:viking`), Karis egen | Bygda |
| S6 | Kurven til markedet | Bakeren, ved bakeriet | Etter første luke i uke 3 | Sanity: bunt | «Kurven til markedet er tom. Tre ulike ting, så ser den levende ut.» | Ha tre publiserte ting som ikke er våpen, med tre ulike sprites | `items`: `source === "sanity" && kind !== "weapon"`, og minst 3 ulike `spriteId` | Stjerne (`gear:extra:star`) | Bygda |
| S7 | Isfiske | «fiskeren», ved det frosne vannet | Etter S3, når området finnes | Verden: hent og lever | «Isboret mitt ligger igjen i skogkanten. Henter du det?» | Hent isboret og lever det | `find` i Skogkanten og så `talk` | Hjelm (`gear:hat:helmet`) | **Fase B**: nytt kart og ny person |
| S8 | Votten | «barnet», ved det frosne vannet | Etter S7 | Verden: finn | «Jeg mistet votten min da jeg lagde snømann.» | Finn votten | `find` | Ridderhjelm (`gear:hat:knight`) | **Fase B** |
| – | (Grotta) | – | – | – | – | Kiste ved hvileplassen på etasje 5 | Fase D | Rustning (`gear:armour:plate`) | **Fase D** |

Notater:

- **S1–S6** bruker bare personer som finnes, og Kenney-ark som allerede er lastet (`dungeon`, `town` og `farm`). Ingen nedlasting.
- **Nye personer:** S7 og S8 har de to nye. De er «fiskeren» og «barnet», uten egne navn. Tiny Dungeon har ledige figurer i rute 88 og 97–100. 84–87 er personene i bygda, og 96 er ridderen (`KnightPreview.tsx`). `/figur` (`FigureLab.tsx`) viser dem bare som referanse.
- **S4 og Vision:** spillet kan ikke se en spørring i Vision. Hele arkivet med femti observasjoner finnes bare i kodevinduet (`ARCHIVE_DATASET`). Spillerens eget prosjekt har bare de fem fra `WHO_IS_LYING`.
  - Et ekte «spørringen avslører kista»-oppdrag krever at vi seeder egne dokumenter for oppdraget i deltakerens prosjekt. Se åpent spørsmål 5.
  - V1 er derfor ærlig: Sanity gir sporet, og funnet er sjekken. Juks (å gå til alle steder) er lov, og det skader bare spilleren selv.
- **S3 røper ingen luke.** Melsporet går fra bakeriet vestover og ned sørveien. Det sier ingenting om hvilket vitne i «Hvem lyver?» som tar feil. Kari er vitne i to av de fem observasjonene der.
- **S5 kommer etter saksmappa** med vilje. En ekstra observasjon i deltakerens prosjekt dukker opp i *reference*-velgeren i luke 6 (ikke-teknisk). Kommer den før saksmappa er ferdig, kan den forvirre luka.
- **Ruter og steder:** `PLACES` i `archive.ts` har allerede Skogkanten, Gjerdet, Smia, Bakeriet, Torget og Brønnen i prosent av bygdekartet. Spots bør bruke de samme stedene, så Sanity-dataene og verden stemmer.

### Sideoppdrag lenger ute

Sideoppdrag skal ikke bare finnes i bygda. Hvert nytt sted får sine egne, så det lønner seg å gå lenger ut. Det er mønsteret fra Stardew: hvert område har folk med sine egne små ønsker.

**Regler:**

- **Et nytt område får 1–3 sideoppdrag og 1–2 overraskelser**, fra noen som hører til der: fiskeren ved vannet, barnet, eller noen fra bygda som har mistet noe der ute.
- **Samme modell overalt.** `SideSpot.area` og `requires.area` er forberedt i typene i del 3. Et nytt område er derfor mest kart og innhold, ikke ny kode.
- **Journalen grupperer etter sted:** Bygda, Skogkanten og Grotta. Den viser bare steder du har vært.
- **Belønningen er XP, materialer og oppskrifter.** Alle ni tingene i `HIDDEN_GEAR` har allerede en kilde (S1–S8 og grotta). Nytt utstyr til områdene lenger ute kommer med fase F («rustning og smykker»).
- **Kalenderen går foran også her.** Ingen sideoppdrag lenger ute krever en luke man ikke har kommet til.

**Forslag til grotta** (ikke besluttet, venter på [plan-grotta.md](plan-grotta.md)):

| Tittel | Giver | Mål | Trinn | Når |
| --- | --- | --- | --- | --- |
| Hammeren i dypet | Brann | Finn den gamle hammeren hans på etasje 3 | `find` med `area: "grotta"` og `depth: 3`. Generatoren legger punktet på en rute som kan nås (test). | G3 |
| Rotter i melet | Bakeren | Slå ut fem rotter i grotta | `{ kind: "defeat", enemy: "rat", count: 5 }`. Telles fra `enemyDefeated` mens oppdraget er aktivt. | G3 |
| Det du så der nede | Arkivaren | Skriv ned det du så: publiser en `observation` med Skogkanten som sted | `studio`, som S5. Åpner når Isvetten er slått. | G3 |

**Forslag til senere steder:** den forheksede skogen (fase F) får sine egne folk og oppdrag på samme måte.

**Det koden trenger i tillegg:**

- `SideSpot` får `depth?`, og `area` blir en union av områdene.
- `generateFloor` tar imot sideoppdragspunktene for dybden og plasserer dem.
- `SideRecord` får `count` for `defeat`-trinn.
- Begge deler bygges når grotta bygges, ikke før.

## 6. Faser

| Fase | Innhold | Ferdig når | Omfang |
| --- | --- | --- | --- |
| **S0: grunnmur** (bak flagg) | `reward.ts` (bare typen), `sideQuests/types.ts`, `data.ts` og `engine.ts`. `side` og `found` i `Progress` med vasking. `ownedGear` leser `side`. Tester. | `npm test` er grønn. Med flagget av endres ingenting i spillet, og en gammel lagring leses uten feil. | Liten |
| **S1: i bygda** (bak flagg) | Markører, soner og <kbd>E</kbd>, `SideQuestDialogue`, «Noe annet?», journalseksjon, kartprikker, sporingslinje, toast og DevPanel. Innholdet S1, S2 og S3. | Fra tom lagring kan en deltaker ta, gjøre og levere S1–S3 på begge spor, og få utstyret én gang. Ingen luke-prompt eller luke-`!` blir borte i noe steg (sjekk mot `gjennomspilling.md`). Avstandstesten er grønn. Sjekket på 375 px og de tre skjermstørrelsene. | Middels |
| **Lansering av S0 og S1** | Flagget snus til på som standard. Kunngjøres i kanalen med uke 2. | Er i `main` **senest fredag 4. desember**, så det rekker `git pull` før mandag 7. desember. | Liten |
| **S2: uke 2 og 3** | S4, S5 og S6. `/api/archive` GET med egne observasjoner. Seeding for teknisk spor når S5 tas. | S4–S6 virker på begge spor. Ingen luke-sjekk i uke 2 og 3, på noe spor, endrer svar med sideoppdragene gjort. | Liten til middels |
| **Fase A** (`plan-utforsking.md`) | `applyReward`/XP. Sideoppdragene har allerede `reward.xp` (30–50 i tabellen der). | XP for leverte sideoppdrag teller med tilbakevirkende kraft. | Som i planen |
| **Fase B** | Rolig område med S7 og S8 og nye personer (`SideNpcId`). `SideSpot.area` og `requires.area`. | Som fase B, og S7–S8 kan leveres. | Middels (kart) |
| **Fase C og D** | `{ kind: "defeat" }`-trinn og rustningen i grotta. | Som C og D. | Som i planen |

**Rekkefølge mot `plan-utforsking.md`:** sideoppdragene kommer **før** fase A–F, og de gjør jobb for dem:

- S0 lager `Reward`-typen som fase A fyller ut.
- `found` og `SideSpot` er det samme som «overraskelser» i fase B.
- Personer for sideoppdrag som data er forarbeid til NPC-ene i det rolige området.

Det er det andre avviket fra `plan-utforsking.md`. Der kom det første sideoppdraget i fase B. Vi foreslår å starte i bygda, fordi det ikke trenger kart og rekker uke 2.

**Ville monstre er ikke med i denne planen.** Tilfeldige monstre, grotta med etasjer og kamp begge veier står i fase C og D i `plan-utforsking.md`, og i detalj i [plan-grotta.md](plan-grotta.md). Sideoppdragene kobler seg på der med `{ kind: "defeat" }`-trinn. Det kommer ingen oppdrag som kan gjentas eller lages tilfeldig, som «slå fem ulver» på Help Wanted. Se del 2.

**Mest usikkert:**

1. **Tiden før 7. desember.** Oppsettøkta er 26. november, og uke 1 tar oppmerksomheten. S1 er den største delen. Kutt S3 og journal-kartprikkene før noe annet.
2. **<kbd>E</kbd>-logikken i `GameClient.tsx`** (1 417 linjer). Den har allerede spesialtilfeller. Egne soner holder risikoen nede, men det må testspilles.
3. **Om noen bruker dem.** Vi vet ikke om deltakerne har tid til mer enn lukene. Mål det (se del 7) før fase B bygges.

## 7. Tester og risiko

### Tester (`node --test` med `sucrase`, som `src/game/quests/*.test.cjs`)

Ny fil `src/game/sideQuests/engine.test.cjs`:

- **Tilstander:** `locked` → `available` → `active` → `ready` → `done`.
  - `requires.luke` gjelder hvis minst én av lukene er fullført, uansett spor.
  - `requires.chapter` følger `chapterOpensAt`. Med `SETUP_DAY` gjelder ikke datoene i testperioden.
  - `devUnlock` åpner alt.
- **Sjekker:**
  - S1 og S6 ignorerer `builtin`-ting og demo-ting (`DEMO_ITEMS` har en «Ice Cube» av typen `material`).
  - S5 ignorerer `ARCHIVE_IDS`.
- **Data:**
  - Ingen oppdrags-id er lik en luke-id.
  - Hver `ask`-side har høyst to setninger.
  - Ingen emoji i teksten.
  - Hver `unlock` peker på en del med `unlock === HIDDEN_GEAR` i `figure.ts`.
  - Ingen del i `HIDDEN_GEAR` gis av to oppdrag.
- **Avstand:** avstandsregelen for alle `SideSpot` og nye personer. Se del 4.
- **Markører:** `sideMarkers` gir ingen markør til en person med luke-`!`, til giveren av en `offered` luke eller til `asksNpc`.

Utvid eksisterende tester:

- `progress.test.cjs`:
  - lagring uten `side` gir `{}`;
  - søppel (liste, tall) gir `{}`;
  - en lagring fra gammel versjon som får `side`, beholder det gjennom en `updateProgress` med dagens kode.
- `wardrobe.test.cjs`:
  - et levert sideoppdrag gir utstyret;
  - et oppdrag som er `active` eller `ready`, gir det ikke.
- `useQuests.test.cjs`: å levere et sideoppdrag endrer ikke `completed`, `completedCount` eller `forgeLevelFor`.

### Risiko

| Risiko | Hva kan skje | Tiltak |
| --- | --- | --- |
| **Kollisjon med lukene** | Samme punkt eller sone. En `!` som skjuler en luke. <kbd>E</kbd> som åpner feil ting. | Egne `side:`-soner som sjekkes sist. Avstandstest. Markøren skjules for luke-givere. Sideoppdrag fra luke-personer går via «Noe annet?». |
| **Sanity-data som rører en luke** | Et nytt våpen blir utstyrt. En bestilling trigger luke 11. En observasjon havner i saksmappa. | Ingen våpen og ingen `bakeryOrder`. S5 kommer etter saksmappa. Test som kjører luke-sjekkene med sideoppdragene gjort. |
| **Fellesserveren** | En sideoppdrags-id i `completed` gjør at serveren avviser alt. | Egen `side`. Test på at levering ikke endrer `completed`. |
| **Gamle lagringer** | Deltakere som ikke har kjørt `git pull`, og eldre lagringer. | Felt legges bare til, og de vaskes. Testen for gammel og ny versjon. Ukjente id-er ignoreres. |
| **`?dev`** | `?dev` åpner alt og eier alt utstyr (`ownedGear` med `dev`). Fullføring i dev lagres i samme `localStorage`. | Som for lukene. `?dev` poster ikke til fellesserveren (`GameClient.tsx`). DevPanel får «Nullstill» per oppdrag. |
| **Det tar fra lukene** | Deltakeren gjør sideoppdrag i stedet for ukas luke. | Sidelinja i sporingen vises bare når ukas luker er ferdige eller noe skal leveres. Ingen frister og ingen poeng på «Hvem er med». Sanity-oppdragene øver på det lukene lærte. |
| **Ytelse i `WinterQuestScene`** | Flere objekter og sjekker per bilde. | Én `Text` per giver og én prop per aktivt spot, laget én gang. `updateZone` går gjennom en liste som er bygd på forhånd (≤ 10 punkter) og lager ingen nye objekter per bilde. |
| **Flagget** | `FEATURES` leses fra miljøet. Deltakerne har ikke variabelen. | Snu standarden i koden ved lansering, ikke be deltakerne endre `.env.local`. |

Tall i planen som er **startverdier** (`luke-design`, avsnitt 4):

- **20 tegn for beskrivelse (S2).** Test: alle i gjennomspillingen får det til på første forsøk. Feiler det, senkes grensen eller sjekken blir «ikke tom».
- **Tre ting i kurven (S6).** Test: høyst 10 minutter for en som har gjort luke 1. Feiler det, blir det to.
- **56 og 68 px avstand.** Avledet av `FORGE_RANGE = 28` og `WRAITH_RANGE = 40`, slik at to soner aldri overlapper.
- **Bruk måles** i gjennomspillingen, med antall levert per tester. Det finnes ingen telemetri, og vi lager ingen.

### Fem spørsmål for systemet (`luke-design`)

| Spørsmål | | Hvorfor |
| --- | --- | --- |
| Tydelig | ~ | `!` og `?` er kjent fra andre spill, og journalen sier hvor. Den blå markøren må testes mot den gule på ekte skjerm. |
| Verdt det | ✓ | Utstyret er synlig på figuren og på «Hvem er med», og det fyller de ni «Gjemt et sted i verden». |
| Svarer | ✓ | Sanity-trinn leser `/api/items` og `/api/archive` med live-lytteren (`useLive.ts` lytter allerede på `item` og `observation`). Verdenstrinn svarer på <kbd>E</kbd>. |
| Belønnende | ~ | Tre kanaler (replikk, toast og «ny» på Utstyr), men ingen lyd. Det samme svake punktet som for lukene i `spillvurdering.md`. |
| Passer | ✓ | Korte replikker, personer vi har, steder som heter det de er, og ingen nye spillbegreper utover «sideoppdrag». |

### Fem tester (`luke-design`)

1. **Ny deltaker:** ser den blå `!`, trykker <kbd>E</kbd> og skjønner hva Kari vil uten forklaring? Test i gjennomspillingen.
2. **Stresstest:**
   - Publiser og slett drikken før levering: S1 går tilbake til `active`.
   - Ta oppdraget med panelene åpne.
   - Trykk <kbd>E</kbd> mange ganger mellom Kari og luke 3.
3. **Mestring:** S1 og S2 øver på *Publish* fra luke 1. Andre gang går det raskt, og det er meningen.
4. **Misbruk:** man kan gå til alle steder i S4. `?dev` gir alt. Begge deler er greit, fordi det ikke finnes poeng eller toppliste for sideoppdrag.
5. **Tilskuer:** en som ser på, skjønner «hun ba om noe varmt, nå har han topplue». Lua synes på figuren.

### Sjekk av `docs/neste-steg.md` mot koden

Disse påstandene er utdatert:

- Utstyr uten kilde er merket «Gjemt et sted i verden» (`HIDDEN_GEAR`), ikke «Finnes i bygda».
- Krona har en kilde: hele uke 3 (`WEEK_REWARDS` i `wardrobe.ts`).
- Spillerplaten er på `main` (`PlayerPlate.tsx`).
- Testene teller nå 245, ikke 202 (`npm test` 2026-11-24, alle grønne).
- `plan-utforsking.md`, `historie.md` og `questplan.md` sier at oppsettøkta er 27. november. `release.ts` (`RELEASE_SETUP_DAY`) og denne planen bruker 26. november.

## 8. Spørsmål til brukeren (besluttet)

Brukeren godkjente planen 2026-11-24 og valgte anbefalingen på alle spørsmålene under.

| # | Spørsmål | Besluttet |
| --- | --- | --- |
| 1 | Skal sideoppdrag synes på «Hvem er med» eller i «Siste nytt»? | **Nei, ikke i V1.** Fellesserveren tar bare luke-id-er, og en endring der må deployes og testes mot klienter på gammel versjon. Utstyret synes allerede på figuren. |
| 2 | Skal sideoppdrag ha frister? | **Nei.** Korte økter og frivillig deltakelse. Ukerytmen (nye oppdrag med kapitlet) gir nok grunn til å komme tilbake. |
| 3 | Skal de nye personene ha navn? | **Nei.** «Fiskeren» og «barnet», som `plan-utforsking.md` sier. Kari heter Kari fordi hun allerede er vitne i arkivet. |
| 4 | Skal fase 1 slås på for alle før uke 2? | **Ja, i `main` senest 4. desember.** Kunngjøres med uke 2 mandag 7. desember. Rekker vi det ikke, venter den til uke 3 heller enn å lanseres halvferdig. |
| 5 | Skal et sideoppdrag få seede egne dokumenter i deltakerens prosjekt, for et ekte Vision-oppdrag? | **Ikke i V1.** Ekstra observasjoner dukker opp i lukene i uke 2. Vurder det etter julaften, eller som en bonus etter saksmappa. |
| 6 | Skal belønningen være XP også, før fase A finnes? | **Nei, bare utstyr nå.** `reward.xp` står i dataene og teller med tilbakevirkende kraft når fase A kommer, fordi belønningen regnes ut av `side`. |
| 7 | Skal utstyr fra sideoppdrag vise kilden i Utstyr-fanen når oppdraget er tilgjengelig (for eksempel «Kari vet noe»)? | **Ja, når oppdraget er `available`.** Det gjør «Gjemt et sted i verden» til et spor uten å røpe alt. Det er en liten endring i `CharacterSheet.tsx`. |
| 8 | Hvilken rekkefølge, hvis tiden er knapp? | **S1 → S2 → S3.** Kutt kartprikkene først, og så S3. Det er det eneste i fase 1 med nye props. |

## Tillegg: sprite-valg i Studio (2026-11-25)

- **Spritelista filtreres etter Kind**, også før luke 4. Velger du Potion eller Material, viser lista bare ting som ikke er våpen (`spriteIdsForItemKind`). Velger du Weapon, viser den bare våpen.
- **Potion og Material får en sprite å starte med:** `potion` og `ice-cube` (`DEFAULT_SPRITE_FOR_KIND` i `src/game/sprites.ts`). Den kan byttes. Våpen får ingen, fordi luke 1 ber deg velge en og luke 3 fanger våpen uten sprite.
- **Bare når Kind endres mens du redigerer.** Å åpne en ting som finnes, endrer den aldri. En sprite som passer den nye typen, blir stående. En som ikke passer, byttes til standarden, eller fjernes for våpen.
- Alt ligger i `ItemSpriteInput` i `src/sanity/lib/solved.tsx`, en spillfil. Spillerfila `src/sanity/schemaTypes/item.tsx` er ikke endret, så `git pull` gir ingen konflikter.
- Luke 4 (spritevelger med bilder) filtrerer på samme måte. Det nye i luka er fortsatt bildene.
