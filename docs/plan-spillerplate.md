# Plan: spillerplate i beltet, Ting-fanen og lavere lukekort

Godkjent design: variant A. Figuren din sitter i venstre ende av beltet, nederst i midten (Stardew Valley-inspirert).

Skisser: åpne `docs/skisser/spillerplate.html` i en nettleser. Skjermene der er nummerert, og planen viser til dem som «skjerm 1–5».

Les også `AGENTS.md` før du begynner. Next 16 har endringer som bryter med det du kan fra før.

## Mål

1. **Lukekortet** (`QuestTracker`) blir lavt igjen. Bunnen er én linje med sju luke-streker og knappene Kart og Journal.
2. **Nivået** flytter fra lukekortet til en **spillerplate** i beltet: figur, navn og «Nivå N».
3. **Platen** åpner karaktersiden på **Utstyr**. Sekken i beltet åpner karaktersiden på en ny fane, **Ting**, med alt du eier.

Ord: fanen heter **Ting**, ikke «Sekken». Ikonet i beltet er fortsatt en sekk, men ordet «sekk» brukes ikke i teksten spilleren ser.
4. Ordet **«smia nivå» forsvinner** fra alt brukeren ser. Det heter bare **«Nivå»**.

Ikke i denne planen: XP-stripe, flytting av ting mellom belte og sekk, og nye ting å finne.

## Utgangspunkt (16. november)

- `main` er på `f4060fa`. Arbeidstreet har ucommittede endringer fra to økter:
  - **Lukekortet:** en første versjon av ny bunn. `QuestTracker.tsx` har fremdrift med streker og knappene Kart og Journal på to linjer. `icons.tsx` har nye `IconBook` og `IconMap`. `GameClient.tsx` har `openMap` og tasten <kbd>M</kbd>. CSS-en ligger under `.tracker-foot` i `globals.css`.
  - **Fellesdelen:** `communityEndpoint.ts`, `communityAccess.ts`, `api/community/route.ts`, `docs/arrangor.md` og `docs/fellesskap.md`.

  Ikke forkast noe av dette. Bygg videre på lukekortet, og ikke rør fellesdelen.
- **Nivå:** finnes som `forgeLevel` fra `useProgress()` i `src/components/hud/useQuests.ts`, og går fra 1 til `MAX_FORGE_LEVEL` (4) i `src/game/rules.ts`. Behold variabelnavnene i koden. Bare teksten brukeren ser endres.
- **Figur og navn:** `progress.figure` og `progress.name`. I `GameClient` finnes allerede `figure`, som er det spilleren har på seg, slått sammen med det spilleren eier, via `wearable`.
- **Karaktersiden:** `src/components/figure/CharacterSheet.tsx`, med fanene Utseende og Utstyr. Åpnes via `sheetOpen` / `sheetShown` i `GameClient` og tasten <kbd>C</kbd>.
- **Beltet:** `src/components/hud/Hotbar.tsx`.
  - `items.slice(0, slots)` er beltet, og resten er «bag», en liten popover.
  - `slots` er 8, eller 5 på smal skjerm (`narrow` i `GameClient`).
  - Tooltip-innholdet for ting ligger inne i `Slot`.
- **Ting:** `GameItemView` i `src/game/items.ts`. `kind` er `"weapon" | "material" | "potion" | null`. Bare våpen kan tas i hånda, med `onEquip`.

## Steg

Gjør stegene i denne rekkefølgen. Hvert steg skal virke for seg.

### 1. «Nivå» i stedet for «smia nivå»

Bytt teksten brukeren ser. Funnet med `grep -rn "[Ss]mia nivå" src`:

- `src/game/quests/weeks.ts:115`: `Smia nivå ${forgeLevel}` → `Nivå ${forgeLevel}`
- `src/components/hud/Community.tsx:67`: aria-label → `Nivå ${…} av ${MAX_FORGE_LEVEL}`
- `src/components/hud/WeekComplete.tsx:79`: «Smia nivå {forgeLevel}: våpnene gjør …» → «Nivå {forgeLevel}: våpnene gjør …»
- `src/components/hud/QuestCelebration.tsx:141`: «Smia nivå {n}! …» → «Nivå {n}! …»
- `src/components/hud/QuestLog.tsx:131`: «Smia nivå {forgeLevel}» → «Nivå {forgeLevel}»

Søk også etter «smia» i Brann-replikker og hint. Der kan smia gjerne nevnes som sted. Bare tallet heter «nivå».

Oppdater tester som sjekker teksten (`grep -rn "Smia nivå" src`).

### 2. Lavere lukekort (skjerm 1)

`QuestTracker.tsx`, i blokken `tracker-foot`:

- Fjern teksten `tracker-meta`, både «N av M» og nivå. `forgeLevel` er ikke lenger i bruk i komponenten. Fjern den fra `Props`, og fjern `forgeLevel={forgeLevel}` der `GameClient` bruker `QuestTracker`.
- Én linje: `tracker-pips` til venstre med `margin-right: auto`, så `Kart` og `Journal`.
  - Strekene får `role="img"` og `aria-label="{completed} av {total} luker"`.
- Knappene har ikon og tekst, men **ingen** `<kbd>`. Tastene står i kontrollisten nederst til venstre.
- CSS:
  - `.tracker-foot` får `flex-wrap: nowrap`.
  - `.tracker-progress` fjernes.
  - Strekene blir 10 × 5 px med 3 px mellomrom.
  - Knappene får `padding: 3px 7px` og `font-size: 12px`.
- Sjekk at linjen får plass i et kort på 300 px. Kortet skal ikke bli høyere enn før denne endringen (omtrent 36 px lavere enn i dag).

### 3. Spillerplate i beltet (skjerm 1, 2 og 5)

**Ny komponent `src/components/hud/PlayerPlate.tsx`:**

```tsx
type Props = {
  figure: FigureChoice;      // already wearable() in GameClient
  name: string;              // "" → show nothing, only the figure
  level: number;
  compact: boolean;          // narrow screen: figure only
  onOpen: () => void;        // opens the character sheet on Utstyr
};
```

- **Markup:** én `<button type="button" className="plate">`. Inni:
  - `FigureCanvas` med `scale={3}` i en ramme på 46 × 46 (`.plate-portrait`);
  - `.plate-who` med navn (`.plate-name`, `--font-display`, 22 px) og «Nivå N» (`.plate-level`, `--font-pixel`, 11 px, amber, store bokstaver med `letter-spacing: .06em`).
- **Knappen:** `aria-label="Figur og utstyr (C)"`, og `title` med samme tekst.
- **Tooltip** (skjerm 2): gjenbruk tooltip-stilen fra `Slot` i `Hotbar` (`.tooltip frame frame--slate`), med to linjer: «Figur og utstyr» og «Bytt utseende og ta på det du har funnet». Vis den på hover og fokus, på samme måte som for slots.
- **Hover og fokus:** bakgrunn `var(--night-3)` og innvendig amber kant (`box-shadow: inset 0 0 0 var(--px) var(--amber)`).
- **Smal skjerm:** når `compact` er satt, skjules `.plate-who`.
- **Høyre kant:** `border-right: var(--px) solid var(--night-3)` skiller platen fra slotsene.
- **Ingen figur ennå:** `figure` er null før spilleren har laget figur. Vis da `normalizeFigure(undefined)`. Det skjer bare et øyeblikk, fordi karaktersiden tvinges fram etter intro-en.

**`Hotbar.tsx`:**

- Ny prop: `plate: React.ReactNode`. Platen rendres først i `.hotbar`, før `.hotbar-slots`.
- Erstatt popoveren for sekken (`bagOpen`, `bag-panel`) med en knapp som **alltid** vises: `onOpenBag`.
  - Sekk-ikonet (`SpriteIcon` town 107) beholdes.
  - `+N` vises bare når `bag.length > 0`.
  - `aria-label="Tingene dine (I)"`.
- Legg en tynn skillelinje (`.hotbar-sep`) mellom belte-slotsene og sekken.
- Oppdateringsknappen (`IconRefresh`) beholdes helt til høyre.
- Flytt tooltip-innholdet fra `Slot` til en ny komponent `src/components/hud/ItemDetails.tsx` (`{ item: GameItemView; equipped: boolean }`). Den brukes både i tooltipen og i Ting-fanen. Teksten skal være den samme.

**`GameClient.tsx`:**

```tsx
const [sheetTab, setSheetTab] = useState<"bag" | "gear" | "look">("gear");
const openSheet = (tab: "bag" | "gear" | "look") => { setSheetTab(tab); setSheetOpen(true); };
```

- `<Hotbar plate={<PlayerPlate figure={figure ?? normalizeFigure(undefined)} name={progress.name ?? ""} level={forgeLevel} compact={narrow} onOpen={() => openSheet("gear")} />} onOpenBag={() => openSheet("bag")} … />`
- **Taster** i `onKey`:
  - <kbd>C</kbd> → `openSheet("gear")`
  - <kbd>I</kbd> → `openSheet("bag")`

  Samme vilkår som dagens <kbd>C</kbd>: ikke mens en dialog er åpen.
- **Kontrollisten:** legg til `<kbd>I</kbd> ting` etter `C figur`.

**CSS i `globals.css`:**

- Legg en ny blokk `.plate*` etter `.hotbar`.
- Bruk `--px`, så alt skaleres som resten av HUD-en.
- **Ikke** bruk `transition` på `transform`. Spillet skal ikke ha bob-effekt.

### 4. Ting-fanen i karaktersiden (skjerm 3 og 4)

**`CharacterSheet.tsx`:**

- Nye props:
  - `initialTab: "bag" | "gear" | "look"`
  - `items: GameItemView[]`
  - `equippedId: string | null`
  - `onEquip: (item: GameItemView) => void`
  - `level: number`
- **Faner i denne rekkefølgen:** Ting, Utstyr, Utseende. `mode` får verdiene `"bag" | "gear" | "look"`.
- **Første gang** (`firstTime`): vis bare Utseende-fanen, ikke Ting og Utstyr, slik at nye spillere bare lager figur. Tittelen er fortsatt «Lag figuren din».
- **Tittel ellers:** spillerens navn, eller «Figuren din» hvis navnet er tomt.
- **Ting-fanen:**
  - **Kategorier til venstre:** Alt, Våpen, Materialer og Drikker, med antall. Ting der `kind` er null vises bare under Alt.
  - **Rutenett:** celler på 46 px (`.cs-inv`, `grid-template-columns: repeat(auto-fill, 46px)`). Bruk `SpriteIcon` og samme utseende som `.slot` i beltet. Tingen du har i hånda får amber kant.
  - Fyll opp med tomme celler til minst tre rader, så det ser ut som et inventar.
  - **Klikk på en ting** velger den, og `ItemDetails` vises under rutenettet. Er det et våpen, vises knappen «Ta i hånda». Er det allerede i hånda, står det «I hånda», og knappen er avslått.
  - **«Ta i hånda»** kaller `onEquip(item)` direkte. Det trenger ikke Ferdig.
  - **Tom sekk:** «Du har ingen ting ennå. Det du smir i Sanity havner her.»
- **Høyre kolonne:**
  - **I Ting og Utstyr:** figuren med `scale={10}`, navn, «Nivå N» og «I hånda: {navn}» (bare i Ting).
  - **I Utstyr:** Ferdig-knappen beholdes.
  - **I Utseende:** som i dag, med navnefelt, Tilfeldig, Angre og Ferdig.
- **Lagring:** utstyr og utseende lagres fortsatt bare med Ferdig. Esc eller å lukke uten Ferdig forkaster endringer i utseende og utstyr. Våpen tatt i hånda beholdes, fordi det lagres med en gang.
- **Taster:** piltastene blar bare i Utseende og Utstyr. I Ting gjør de ingenting.

**`GameClient.tsx`:** send `initialTab={progress.figure ? sheetTab : "look"}`, `items={items}`, `equippedId`, `onEquip={handleEquip}` og `level={forgeLevel}` til `CharacterSheet`.

### 5. Opprydding

- Fjern CSS som ikke lenger brukes: `.bag-panel`, `.bag-title`, `.bag-grid` og `.tracker-meta`.
- `docs/neste-steg.md`: legg til én linje under Status om spillerplaten og sekken.

## Kontroll før du sier ferdig

Kjør:

```bash
npm test
```

```bash
npx tsc --noEmit
```

```bash
npx eslint src/components/hud src/components/figure
```

Én test, «finishing before the next week's calendar date …», feiler fra før og avhenger av dagens dato. To lint-feil (`set-state-in-effect`) i `GameClient` er også gamle. Ikke legg til nye.

Sjekk i nettleseren mot dev-serveren (`localhost:3000`) ved 1280×800, 1350×1000 og 390×844:

1. Lukekortet har én lav bunnlinje, og Kart og Journal ligger innenfor kanten. Mål med `getBoundingClientRect` at knappenes høyre kant er mindre enn kortets.
2. Platen viser riktig figur, navn og «Nivå N». På 390 px vises bare figuren.
3. Hover og Tab-fokus på platen gir amber kant og tooltip.
4. <kbd>C</kbd> og klikk på platen åpner Utstyr. <kbd>I</kbd> og klikk på sekken åpner Ting. Esc lukker.
5. Ting-fanen:
   - filtrene virker, og antallene stemmer;
   - «Ta i hånda» bytter våpen i beltet og i spillet;
   - uten ting vises teksten for ingen ting.
6. En ny spiller (tøm `localStorage`) får bare Utseende-fanen første gang, og etterpå alle tre.
7. «Smia nivå» finnes ingen steder i HUD-en.

**Turbopack** serverer av og til gammel CSS. Hvis nye klasser ikke virker, gjør en ekte endring i `globals.css`, for eksempel i en kommentar, og last siden på nytt.

## Regler

- Norsk tekst. Sanity- og utviklerbegreper på engelsk.
- Ingen hjelpelinjer uten ny informasjon.
- Bare Kenney-grafikk og ikonene i `icons.tsx` (monokrome piksler).
- Fargene står som tokens i `:root` i `globals.css`. Ikke legg til nye farger uten grunn.
- Ikke commit, push eller lag PR før brukeren ber om det.
