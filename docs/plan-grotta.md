# Plan: grotta og ville monstre

Status: godkjent 2026-11-24, ikke bygget. Alle anbefalingene i del 11 er besluttet. Skrevet 2026-11-24 og sjekket mot `main` (b3c645f).

Planen bygger på fase C (kamp begge veier) og D (grotta) i [plan-utforsking.md](plan-utforsking.md), og på [plan-sideoppdrag.md](plan-sideoppdrag.md). Den sier tydelig hvor den foreslår noe annet.

## 1. Kort fortalt

- Grotta er en frivillig hule med etasjer, slik gruvene i Stardew Valley har. Du går ned en trapp for hver etasje.
- Hver etasje blir laget når du kommer dit. Spillet trekker en håndlaget rommal og plasserer monstre, steiner og trapp tilfeldig, etter faste regler. Ingen to turer er like.
- Monstrene er ville dyr og troll, ikke snømonsteret fra historien. De jager, stormer mot deg og kaster ting, og de varsler alltid før de slår. De blir sterkere jo dypere du går.
- Du har liv, vist som hjerter. Blir livet tomt, besvimer du og våkner hos Brann. Da mister du bare det du fant på denne turen.
- Våpenet ditt fra Sanity bestemmer skaden. Navnet bestemmer elementet (`magic.ts`), og noen monstre tåler ikke ild eller frost.
- Etasje 5 og 10 er hvileplasser med en sterkere fiende, en kiste og et tau. Med tauet kan du starte derfra neste gang.
- Alt står bak `FEATURES.cave`. Grotta pauser når du går til Studio, og en luke tar deg alltid trygt hjem.

## 2. Mønstrene vi låner

| Spill | Mønster | Hva vi tar med |
| --- | --- | --- |
| Stardew Valley, **gruvene** | 120 etasjer. Hver etasje trenger en stige ned. På etasjer «fulle av monstre» kommer stigen først når alle er slått. Heisen går til hver femte etasje du har nådd. ([The Mines](https://stardewvalleywiki.com/The_Mines)) | Etasjer med trapp. Noen etasjer er «fulle» og låser trappa. Tau til etasje 5 og 10. |
| Stardew Valley, **å besvime** | Du mister gull og noen ting, og av og til noen etasjer av fremgangen. Én ting kan kjøpes tilbake. ([The Mines](https://stardewvalleywiki.com/The_Mines), [Steam-tråd](https://steamcommunity.com/app/413150/discussions/0/405694031549498313)) | Å våkne trygt et kjent sted. **Ikke** å miste fremgang eller ting du hadde før turen. Det er mildere, som `plan-utforsking.md` sier. |
| Spelunky, **rommaler** | Derek Yu tegnet rundt 37 rommaler. Generatoren setter dem sammen langs en sti som alltid går an å gå, og deler av hvert rom trekkes tilfeldig. ([Game Maker's Toolkit](https://amara.org/subtitles/p6MHlmreohsY/en-gb/1/download/How%20and%20Why%20Spelunky%20Makes%20its%20Own%20Levels%20%20Game%20Makers%20Toolkit.en-gb.txt), [Spelunky Generator Lessons](https://tinysubversions.com/spelunkyGen/)) | Håndlagde rom med tilfeldige deler. Garantien om at trappa alltid kan nås, sjekket av en test. |
| The Binding of Isaac, **håndlagde rom** | Bare oppsettet av rom er tilfeldig. Selve rommene kommer fra et bibliotek av håndlagde rom. I et rom med monstre er dørene låst til alle er slått. ([Level Generation](https://bindingofisaacrebirth.wiki.gg/wiki/Level_Generation), [Normal room](https://bindingofisaacrebirth.wiki.gg/wiki/Normal_room)) | Et lite bibliotek av rom vi har tegnet selv. «Fulle» etasjer låser trappa. |
| **Varslede angrep** | Spilleren må vite at et angrep kommer for å kunne unngå det. Et angrep har en start, et treff og en slutt, og varselet er starten. ([Game Developer: telegraphing](https://gamedeveloper.com/design/enemy-attacks-and-telegraphing), [Dark Souls 3](https://www.gamedeveloper.com/game-platforms/anatomy-of-an-enemy-attack-in-dark-souls-3)) | Alle angrep har en tydelig start: blink, skjelving eller en skygge på bakken. Ingen finter. |

### Hva vi lar være

- **120 etasjer og uendelig dybde.** Vi lager 10 etasjer i to soner og stopper der til vi vet om noen bruker grotta.
- **Å miste fremgang, gull eller utstyr ved død.** Det passer ikke korte økter i en julekalender.
- **Hakke, verktøy og energi.** Stardew har en energimåler og hakke til steinene. Vi lar våpenet slå steinene, og har ingen energi.
- **Mat og matlaging.** Drikker fra Studio er den eneste helbredelsen. Se del 5.
- **Finter og vanskelige mønstre.** Kampen skal være lesbar, ikke en ferdighetsprøve.
- **Tilfeldige oppdrag** (Help Wanted «slå 5 ulver»). Det ble valgt bort i `plan-sideoppdrag.md`.

## 3. Hva som finnes i dag

| Del | I koden nå |
| --- | --- |
| Grafikk | **Kenney Tiny Dungeon ligger allerede i repoet** (`public/assets/kenney/tiny-dungeon.png`, CC0, med lisensfil). Den trenger ikke lastes ned. `plan-utforsking.md` sier «hent Tiny Dungeon». Det er utdatert. Tiny Ski har snømonstre og snømann (`tiny-ski.png`). |
| Vinterfarger | `scripts/winterize-tiles.py` bytter farger på Tiny Town og lager `public/assets/winter-town.png`. Det samme kan gjøres for grotta. |
| Phaser | Phaser 4.2.1, én scene (`WinterQuestScene`, 970 linjer) i `PhaserGame.tsx`. Ingen fysikkmotor: kollisjon er egne bokser (`solids` og `tryMove`). |
| Kamp | `useCombat.ts` i React. Bare snømonsteret, og bare spilleren slår. Du trykker <kbd>Mellomrom</kbd> når du står nær. Liv og skade regnes i React, og scenen viser bare treffet (`hit`, `whiff`). |
| Skade | `FORGE_DAMAGE = [4, 6, 8, 10]` i `rules.ts`, styrt av smienivået. Fase A utvider til 10 nivåer. |
| Element | `magic.ts` leser element fra våpenets navn: ild, frost, lyn, gift og lys. Snømonsteret er svakt for ild og immunt mot frost. |
| Nivå | `FEATURES.rpg` er av. Uten den vises verken nivå eller skade. |
| Fremgang | `Progress` har verken `xp`, `inventory`, `trip` eller `deepest` ennå. Det kommer i fase A (`plan-utforsking.md`) og her. |

### Monstre vi har grafikk til

Vi har ti figurer som kan være monstre, uten ny grafikk:

| Navn | Kenney-rute | Oppførsel | Fra etasje |
| --- | --- | --- | --- |
| Rotte | `dungeon` 123 | Jager deg, rask og svak | 1 |
| Slim | `dungeon` 108 | Jager deg, sakte og seig | 1 |
| Flaggermus | `dungeon` 120 | Flyr i bølger mot deg, flyr over steiner | 3 |
| Edderkopp | `dungeon` 122 | Stopper, blinker og stormer i en rett linje | 5 |
| Troll | `dungeon` 112 | Går sakte og slår hardt etter et langt varsel | 6 |
| Kyklop | `dungeon` 109 | Holder avstand og kaster isklumper (`dungeon` 56) | 8 |
| Isvette, sjef på etasje 5 | `ski` 78 | Stormer mot deg og kaller to rotter | 5 (hvileplass) |
| Isdrage, sjef på etasje 10 | `dungeon` 110 med blå farge (`setTint`) | Stormer mot deg og kaster isklumper | 10 (hvileplass) |

`dungeon` 121 er snømonsteret og brukes ikke i grotta, så historien ikke blir forvirrende. `dungeon` 111 og 124 og `ski` 79–80 er i reserve for etasje 11–20 (fase F).

### Fliser

Tiny Dungeon har gulv (rute 0–2, 12–14, 24–26), steinvegg (4–5, 16–17, 28), trapp (36–39), dører (9–11, 21–23, 33–35, 45–47), steiner (42), kister (89–91) og en flamme (29, ovnen ved smia i dag). Et skript lager `public/assets/winter-cave.png` med to fargesett:

- etasje 1–9: is og blått;
- etasje 10 og dypere: mørkere blått.

Rutene sjekkes i verkstedet (`/figur`) før de tas i bruk.

## 4. Hvordan grotta er bygd

### Inngangen

- **Her foreslår vi noe annet:** inngangen ligger **i bygda**, i skogkanten nord, mellom huset i vest og smia. `plan-utforsking.md` la den i et rolig område (fase B).
  - Da er ikke grotta avhengig av at fase B er bygd først.
  - Skogkanten er stedet der sporene begynte i uke 2 (`PLACES` i `archive.ts`), så den finnes allerede i fortellingen.
- **Brann advarer** til du har nådd nivå 2, slik `plan-utforsking.md` sier. Grotta er likevel åpen fra start.
- **Inngangen er et sideoppdragssted** med egen sone (`side:cave`). Den følger avstandsregelen fra `plan-sideoppdrag.md`, del 4.
- **Prompten** er «<kbd>E</kbd> Gå inn i grotta». Har du nådd etasje 5 eller 10, kan du velge «Tau ned til etasje 5».

### Én scene for grotta

- **Her foreslår vi også noe annet:** grotta får sin egen Phaser-scene, `CaveScene` (`src/game/cave/CaveScene.ts`).
  - Bygda legges til side med `scene.sleep()` og vekkes igjen med `scene.wake()`. Da blir bygda nøyaktig som du forlot den.
  - `WinterQuestScene` er allerede 970 linjer og har ikke plass til kamp og etasjer.
  - `Area`-typen i `plan-utforsking.md` passer fortsatt for de rolige områdene i fase B. Grotta har sine egne regler for etasjer, så den trenger ikke samme form.
- **Overgangen** er en kort toning til svart på under et halvt sekund (`plan-utforsking.md`).
- **Kollisjon** bruker de samme boksene som i bygda (`solids` og `tryMove`). Ingen fysikkmotor og ingen nye avhengigheter.

### Rommalene

- **6–8 rom** tegnet som tekst i `src/game/cave/rooms.ts`, slik figurdelene er tegnet i `figure.ts`. Da er de lette å lese, endre og teste.
- **Hvert rom er 24 × 14 ruter.** Et rom fyller omtrent én skjerm (`TARGET_VIEW` er 480 × 300 px = 30 × 18 ruter). **Endret 2026-11-25:** en etasje er nå flere rom satt sammen, og kameraet følger deg. Se del 12.
- **Tegnene i en rommal:**

  ```
  #  vegg               .  gulv
  S  der du kommer inn  T  mulig trapp (2–3 per rom, én velges)
  m  mulig monster      o  mulig stein (kan slås, kan gi funn)
  k  kiste (bare på hvileplasser)
  ```

- **Hvileplassene** (etasje 5 og 10) er to egne, faste rom med plass til sjefen, kisten og tauet.

### Generatoren

`generateFloor(depth, seed)` i `src/game/cave/generate.ts` er en ren funksjon uten Phaser. Den gjør dette:

1. Trekker en rommal. Samme rom kommer ikke to etasjer på rad.
2. Speiler rommet vannrett halvparten av gangene. Det dobler variasjonen gratis.
3. Velger én trapp blant `T`-ene.
4. Fyller `m`-ene med monstre etter tabellen for dybden. Antallet øker med dybden: 2–3 på etasje 1, opptil 6 på etasje 9 (startverdi).
5. Fyller noen `o`-er med steiner. En stein gir et materiale med en viss sjanse.
6. Gjør av og til etasjen **full**. Da kommer trappa først når alle monstrene er slått, og spilleren får beskjeden «Trappa er sperret til alle monstrene er slått». Det skjer aldri på etasje 1 eller på en hvileplass (startverdi: hver fjerde etasje i snitt).

Samme `seed` gir alltid samme etasje. Det gjør generatoren testbar. I spillet trekkes et nytt tall hver gang du går ned en trapp.

### Hva som skjer når

| Hendelse | Hva skjer |
| --- | --- |
| Du går ned en trapp | Ny etasje. `deepest` oppdateres. Livet blir ikke fylt opp. |
| Du når en hvileplass | Livet fylles opp. `trip` flyttes til `inventory` (`plan-utforsking.md`). Tauet hit er låst opp. |
| Du slår en sjef | Den kommer aldri tilbake (`bosses` i `Progress`). Kisten kan åpnes én gang (`chests`). |
| Du går opp tauet eller ut ved inngangen | Hjem til bygda. `trip` flyttes til `inventory`. |
| Livet blir tomt | Du våkner hos Brann i bygda. `trip` tømmes. XP, utstyr og alt annet beholdes. |
| Du laster siden på nytt eller lukker fanen | Neste gang starter du i bygda, og `trip` flyttes til `inventory`. En reload er en trygg hjemtur, ikke et nederlag. Juks her skader bare spilleren selv. |
| Monstre i et rom | Kommer tilbake når du går ned igjen. Hver tur lager nye etasjer. |

## 5. Kamp

### Spilleren

- **Liv:** 5 hjerter, der hvert hjerte er 2 liv (startverdi). Hjertene vises ved spillerplaten (`PlayerPlate.tsx`) bare når du er i grotta.
- **Angrep:** <kbd>Mellomrom</kbd> slår i retningen figuren ser. Treffet er en bue foran figuren, 18 px lang (startverdi). Animasjonen er `lunge()`, som finnes i dag.
  - Det tar 350 ms mellom slagene (startverdi).
  - På mobil er det en «Angrip»-knapp, som i `EncounterPanel` i dag.
- **Skaden** kommer fra `forgedPower(nivå)` i `rules.ts`, med samme lille variasjon som i dag (+0–2).
  - Element fra navnet: et monster som er svakt for elementet, tar × 1,5. Et som er immunt, tar 0. Det er samme regel som i `useCombat.ts`.
  - Uten et våpen som kan brukes (`isUsableWeapon`), biter slaget ikke. Det er som i dag.
- **Etter et treff** er du usårbar i 1 sekund og blinker (startverdi). Både du og monsteret blir slått litt tilbake.
- **Drikker fra Studio helbreder.** Hver publiserte `item` med kind `potion` kan drikkes én gang per tur og gir 2 hjerter tilbake. Du kan drikke høyst 3 per tur (startverdi). I dag velger tast 1–8 bare våpen fra beltet (`Hotbar`). I grotta drikker tasten også en drikk.
  - Dette er Sanity som betyr noe i spillet. Sideoppdraget S1 («Noe varmt») lærer deg å lage en drikk.
  - Taket på 3 gjør at det ikke lønner seg å publisere femti drikker («ingen valg med ett åpenbart beste svar»).

### Monstrene

Typene står i `src/game/cave/enemies.ts`, med `Enemy` og `Move` fra `plan-utforsking.md`. Bare `chase`, `charge` og `shoot` bygges nå. `split`, `blink` og `freeze` venter til fase F.

```ts
// src/game/cave/enemies.ts. Base values, scaled by depth in rules.ts.
export const ENEMIES = {
  rat:    { name: "Rotte",      sprite: d(123), hp: 6,  damage: 1, speed: 46, moves: [{ kind: "chase" }], xp: 10 },
  slime:  { name: "Slim",       sprite: d(108), hp: 10, damage: 1, speed: 22, moves: [{ kind: "chase" }], weakTo: "fire", xp: 10 },
  bat:    { name: "Flaggermus", sprite: d(120), hp: 8,  damage: 1, speed: 40, moves: [{ kind: "chase" }], flies: true, xp: 12 }, // hp 6→8: raised for the 2–4 hits rule
  spider: { name: "Edderkopp",  sprite: d(122), hp: 14, damage: 2, speed: 30, moves: [{ kind: "charge", windupMs: 600 }], xp: 16 },
  troll:  { name: "Troll",      sprite: d(112), hp: 24, damage: 3, speed: 18, moves: [{ kind: "charge", windupMs: 900 }], immuneTo: "poison", xp: 20 },
  cyclops:{ name: "Kyklop",     sprite: d(109), hp: 16, damage: 2, speed: 20, moves: [{ kind: "shoot", projectile: d(56), everyMs: 2200 }], weakTo: "lightning", xp: 20 },
  // Bosses: never come back, give 100 XP and open the chest.
  yeti:   { name: "Isvette",    sprite: ski(78), hp: 70, damage: 2, speed: 26, moves: [{ kind: "charge", windupMs: 700 }], weakTo: "fire", boss: true, xp: 100 },
  drake:  { name: "Isdrage",    sprite: d(110), hp: 140, damage: 3, speed: 24, moves: [{ kind: "charge", windupMs: 600 }, { kind: "shoot", projectile: d(56), everyMs: 1800 }], weakTo: "fire", immuneTo: "frost", boss: true, xp: 100 },
} satisfies Record<string, Enemy>;
```

Alle tallene her er **startverdier** (se del 8).

- **Varsel før hvert angrep:**
  - `chase`: monsteret stopper et øyeblikk og skjelver før det biter, 250 ms (startverdi).
  - `charge`: det blinker hvitt (`setTintMode(FILL)`, som `onHit` bruker i dag) og viser en skygge på linjen det skal storme langs (teksturen `shadow` finnes).
  - `shoot`: det løfter seg og blinker før kastet. Isklumpen er stor og treg nok til å unngås.
- **Dybden skalerer:** `scale(enemy, depth)` i `rules.ts` gir +12 % liv og +8 % skade per etasje (`plan-utforsking.md`). Varselet blir kortere med 5 % per etasje, men aldri under 350 ms (startverdi).
- **Når et monster blir slått**, forsvinner det i en snøsky (partiklene fra `banishWraith`). Monstrene blir **slått ut**. De dør ikke. Det holder tonen koselig og passer historien, der snømonsteret får bli med på festen.
- **XP gis med en gang** og mistes aldri (`plan-utforsking.md`: 10 + 2 per etasje, sjef 100).
- **Små tall over monsteret** (`floatText`) viser skaden, med «immun» og «!» som i dag.

### Funn

- Materialene er data i `src/game/materials.ts` (fase A): Isskår (`dungeon` 56) og Gammel malm (`dungeon` 42). Flere kommer i fase F.
- Steiner (`o`) og noen monstre gir materialer. De havner i `trip` til du er trygg.
- Uten smiing (fase E) gjør materialene ingenting ennå. De vises i Ting-fanen med antall, slik fase A sier. Det er greit at noe venter på senere. Det må ikke se ut som en feil, så Ting-fanen skriver «Brukes i smia senere».
- **Kistene** på hvileplassene:
  - etasje 5: Rustning (`gear:armour:plate`), den niende tingen i `HIDDEN_GEAR`, og den første oppskriften (fase E);
  - etasje 10: 100 XP og en ny oppskrift.

## 6. Datamodell

### Nye filer

| Fil | Innhold |
| --- | --- |
| `src/game/cave/rooms.ts` | Rommalene som tekst og de to hvileplassene |
| `src/game/cave/generate.ts` | `generateFloor(depth, seed): Floor`. Ren, uten Phaser |
| `src/game/cave/enemies.ts` | `ENEMIES` og tabellen over hvilke monstre som kan komme på hvilken dybde |
| `src/game/cave/combat.ts` | Rene regler: `hitEnemy`, `hitPlayer`, `canDrink` og `xpFor`. Ingen Phaser og ingen React |
| `src/game/cave/CaveScene.ts` | Phaser: tegning, bevegelse, oppførsel og varsler |
| `src/game/materials.ts` | Materialene (fase A) |
| `src/components/hud/CaveHud.tsx` | Hjerter, «Etasje 3», «Funnet på turen: 4», sjefens liv og «Gå hjem» |
| `scripts/winterize-tiles.py` | Utvides til å lage `public/assets/winter-cave.png` |

### Typer

```ts
// src/game/cave/generate.ts
export type Floor = {
  depth: number;
  room: string;                       // template id, for tests and ?dev
  tiles: number[][];                  // frames in winter-cave.png
  solids: Box[];
  start: { x: number; y: number };    // px
  stairs: { x: number; y: number };
  spawns: { enemy: EnemyId; x: number; y: number }[];
  rocks: { x: number; y: number; drop?: string }[];
  chest?: { id: string; x: number; y: number; reward: Reward };
  locked: boolean;                    // «full»: stairs open when all are defeated
  rest: boolean;                      // floor 5 and 10
};
```

### Hva som lagres i `Progress`

Disse feltene legges bare til, og de vaskes i `readProgress` som `seenGear`. Det er samme regel som i `plan-sideoppdrag.md`.

```ts
xp: number;                          // phase A. Here: XP from ordinary monsters only
inventory: Record<string, number>;   // phase A
trip: Record<string, number>;        // found on this trip, not yet safe
deepest: number;                     // 0 = never been inside
bosses: Record<string, true>;        // "yeti", "drake"
chests: Record<string, true>;        // "cave-5", "cave-10"
inCave?: true;                       // set while inside: a reload moves `trip` home
```

**XP og regelen om fakta.** `plan-sideoppdrag.md` regner XP for luker og sideoppdrag ut av fakta (`completed` og `side`). Vanlige monstre kommer tilbake, så de har ikke et fast faktum. Derfor er `xp` her **bare XP fra vanlige monstre**. Sjefer og kister er fakta (`bosses`, `chests`) og regnes ut som de andre:

```ts
totalXp(p) = xpFromLukes(p.completed) + xpFromSide(p.side) + xpFromFacts(p.bosses, p.chests, p.found) + p.xp
```

Det er hele forskjellen mellom `plan-utforsking.md` (lagre `xp` for alt) og sideoppdragsplanen (regne ut alt). Hver kilde gir XP bare én gang, og ingenting trenger migrering.

**Skrives når det skjer:**

- `xp` og `trip` lagres for hvert monster og hvert funn. Det er én `localStorage`-skriving, og det er billig.
- `deepest` lagres når du kommer til en ny etasje.
- Livet ditt lagres ikke.

### Broen mellom Phaser og React

`bridge.ts` får:

```ts
// WorldState
area: "bygda" | "grotta";
cave: { depth: number; hp: number; maxHp: number; boss: { name: string; hp: number; maxHp: number } | null } | null;

// EventMap (scene → HUD, facts to save)
enemyDefeated: { enemy: EnemyId; depth: number };
found: { item: string; count: number };
reachedFloor: number;
bossDefeated: EnemyId;
chestOpened: string;
fainted: void;
leftCave: void;                      // via the rope, the entrance, «Gå hjem» or a luke
drink: string;                       // item id from the hotbar (HUD → scene)
```

React skriver til `Progress`, og scenen leser regler fra `combat.ts`. Det er samme deling som i dag: «React owns the game state», og scenen eier bevegelsen (`bridge.ts`). Det som er nytt, er at kampen i grotta regnes i scenen. Den skjer mange ganger i sekundet og kan ikke gå via React. Reglene og tallene ligger likevel i rene filer.

`useCombat.ts` og snømonsteret i bygda endres ikke.

## 7. Kalenderen går foran

- **Ingen luke leser noe fra grotta.** Grotta kan ikke blokkere eller endre en luke.
- **Grotta pauser når du ikke er der.**
  - Når et panel er åpent (`frozen`), når Studio-panelet er åpent, og når vinduet mister fokus (`blur` og `visibilitychange`), står monstrene stille, og ingen kan treffe deg.
  - Deltakerne bytter hele tiden mellom spillet og Studio. Det er den viktigste regelen i denne planen.
- **En luke tar deg hjem trygt.** Trykker du «Gå til» eller «Åpne luka» i sporingen mens du er i grotta, får du spørsmålet: «Gå hjem? Du tar med deg alt du fant.» Svarer du ja, går du til bygda, og `trip` blir trygg.
- **Feiringen av en luke** (`QuestCelebration`) kan komme mens du er i grotta, for eksempel når du har publisert i Studio. Den fryser grotta som et vanlig panel.
- **Sporingen** viser fortsatt ukas luke i grotta. Luke-vinduene og `!` synes ikke der nede, fordi de hører til bygda.
- **Inngangen i skogkanten** følger avstandsregelen, så den aldri deler sone eller <kbd>E</kbd> med en luke.
- **Feature-flagg:**
  - `FEATURES.cave` (`NEXT_PUBLIC_FEATURE_CAVE`);
  - når grotta er på, slås `FEATURES.rpg` også på, fordi nivå og skade må synes (`rpg: … || cave`);
  - ved lansering snus standarden i koden, slik `plan-sideoppdrag.md` foreslår.
- **`git pull`:** feltene er nye og legges bare til. En deltaker på gammel versjon beholder feltene urørt (`readProgress` sprer `...saved`). `trip` venter til hen oppdaterer.
- **`?dev`:** DevPanel får:
  - «Gå til etasje N»;
  - «Udødelig»;
  - «Vis seed»;
  - «Nullstill grotta», som tømmer `deepest`, `bosses`, `chests` og `trip`.

  `?dev` poster ikke til fellesserveren, som i dag.

## 8. Tall (startverdier)

Alle tallene er startverdier etter regelen i `luke-design`, avsnitt 4. Hvert tall har en test og en plan hvis testen feiler.

| Tall | Startverdi | Test | Hvis testen feiler |
| --- | --- | --- | --- |
| Spillerens liv | 5 hjerter (10) | En tester på nivå 2 klarer etasje 1–3 uten drikke, men ikke uten å bli truffet | Juster ± 1 hjerte |
| Slag til et vanlig monster er slått | 2–4 slag på forventet nivå | Enhetstest: for hver etasje 1–10 og nivået `ceil(etasje / 2) + 1` gir `combat.ts` 2–5 slag | Juster `hp` i `ENEMIES` før skaleringen |
| Skalering per etasje | +12 % liv, +8 % skade (`plan-utforsking.md`) | Testen over, og et treff på etasje 10 tar høyst 1,5 hjerter | Senk liv-skaleringen til 10 % |
| Varsel før angrep | 600–900 ms, −5 % per etasje, minst 350 ms | Tre testere uten spillvane ser varselet og rekker å gå unna på etasje 1 | Lengre varsel og større skygge |
| Monstre per etasje | 2–3 på etasje 1, opptil 10 på etasje 9 (del 12) | En etasje tar 1–3 minutter | Juster tabellen |
| Full etasje | Hver fjerde i snitt, aldri etasje 1 eller en hvileplass | Ingen tester sier at de satt fast | Sjeldnere, eller vis antall monstre igjen |
| Drikker | 2 hjerter, høyst 3 per tur | Ingen kommer til etasje 10 bare på drikker | 2 per tur |
| Usårbar etter treff | 1 s | Ingen mister to hjerter på ett sekund | 1,5 s |
| En tur | 10–15 minutter til etasje 5 | Måles i gjennomspillingen, med dato og antall | Færre monstre eller kortere rom |

## 9. Faser

Grotta kommer **etter** sideoppdragene i bygda (S0–S2), og etter fase A. Det er samme rekkefølge som `plan-utforsking.md`. Fase C og D er slått sammen til G-fasene her, fordi vi tester kampen i grotta og ikke på snømonsteret (del 6).

| Fase | Innhold | Ferdig når | Omfang |
| --- | --- | --- | --- |
| **A** (`plan-utforsking.md`) | `Reward`, `applyReward`, XP, `inventory` og `materials.ts`. Nivå 1–10 (`FORGE_DAMAGE` med 10 verdier). | Som i planen. `totalXp` regnes ut som i del 6. | Liten |
| **G0: grafikk og generator** | `winter-cave.png` fra skriptet. `rooms.ts` med 6 rom og 2 hvileplasser, og `generate.ts`. Tester. | Testene for alle rom er grønne (del 10). Et lite verksted i `?dev` viser en etasje for en gitt seed. | Liten til middels |
| **G1: gå i grotta** | `CaveScene` med inngangen i skogkanten, overgang, trapp, tau og «Gå hjem». `CaveHud`. Ingen monstre. Flagget av. | Du kan gå inn, ned 5 etasjer og hjem. Bygda er som før. Testet på 375 px og de tre skjermstørrelsene. | Middels |
| **G2: kamp begge veier** (fase C) | Liv, angrep, usårbarhet og varsler. Rotte, slim og edderkopp. Å besvime og `trip`. Pause ved Studio og `blur`. Drikker. | Du kan slå, bli truffet, besvime og våkne hos Brann uten å miste noe annet enn `trip`. Grotta står stille når Studio er åpent. | Stor |
| **G3: etasje 1–5** (fase D, del 1) | Flaggermus, full etasje, Isvette og kisten med rustning på etasje 5. `bosses`, `chests` og `deepest`. Tau til 5. | Du kan nå etasje 5, slå Isvetten, få rustningen én gang og starte fra 5 neste gang. | Middels |
| **Lansering av G0–G3** | Flagget snus til på. Kunngjøres i kanalen. | I `main` **senest fredag 18. desember** | Liten |
| **G4: etasje 6–10** (fase D, del 2) | Troll og kyklop, mørkere farger, Isdragen og kisten på etasje 10. | Du kan nå etasje 10, og tauet virker til 10. | Middels |
| **G5: smiing** (fase E) | To oppskrifter fra kistene, `recipe` og `forging` i Studio, trekk av materialer og utstyr til figuren (del 15). | En publisert Smiing gir utstyret én gang, materialene trekkes, og «Mangler 2 Isskår» vises til de er samlet. | Middels |
| **Fase F** | Etasje 11–20 med `split`, `blink` og `freeze`. | Som i `plan-utforsking.md`. | Som i planen |

**Mest usikkert:**

1. **Tid.** G2 er den største biten, og den kommer samtidig med uke 2 og 3. Kalenderen går foran. Rekker vi ikke 18. desember, lanseres G0–G3 i romjula som en bonus. Det er bedre enn å lansere halvferdig. G4 kuttes først.
2. **Om kampen føles god på 10 minutter.** Det vet vi først når G2 er testspilt. Derfor testes G2 med tre personer før G3 bygges.
3. **Mobil.** Kamp i sanntid med trykk på skjermen er vanskelig. Målet er at det går an å spille, ikke at det er like godt som med tastatur.

## 10. Tester og risiko

### Tester (`node --test` med `sucrase`)

- `src/game/cave/rooms.test.cjs`, for hver rommal:
  - riktig størrelse;
  - kanten er vegg;
  - `S` finnes;
  - minst 2 `T`;
  - **alle `T`, `m`, `o` og `k` kan nås fra `S`** (bredde-først-søk), også når rommet er speilet;
  - ingen `m` står nærmere `S` enn 4 ruter (startverdi).
- `src/game/cave/generate.test.cjs`:
  - samme `seed` gir samme etasje;
  - samme rom kommer ikke to etasjer på rad;
  - nye typer dukker først opp fra etasje 3, 5, 6 og 8;
  - hvileplass på 5 og 10;
  - full etasje aldri på 1, 5 eller 10;
  - 1 000 seeds gir ingen feil.
- `src/game/cave/combat.test.cjs`:
  - antall slag per etasje og nivå (del 8);
  - element: svak gir × 1,5, immun gir 0;
  - uten våpen er skaden 0;
  - `scale` øker med dybden;
  - varselet er aldri under 350 ms;
  - drikker: høyst 3 per tur, og hver drikk én gang.
- `progress.test.cjs`:
  - nye felt får trygge standardverdier;
  - å besvime tømmer `trip`, men ikke `xp`, `inventory` eller noe annet;
  - en hjemtur og en reload med `inCave` flytter `trip` til `inventory`;
  - en gammel versjon beholder feltene.
- `wardrobe.test.cjs`: `chests["cave-5"]` gir rustningen. Testen i sideoppdragsplanen om at hver `HIDDEN_GEAR` har én kilde, dekker nå alle ni.
- **Avstand:** inngangen til grotta er med i avstandstesten fra `plan-sideoppdrag.md`.

### Risiko

| Risiko | Hva kan skje | Tiltak |
| --- | --- | --- |
| **Det tar fra lukene** | Grotta er morsommere enn neste luke. | Den er frivillig, gir ingen poeng på «Hvem er med», og tar deg hjem fra én knapp i sporingen. XP fra lukene er fortsatt den viktigste veien opp (`plan-utforsking.md`). |
| **Studio-bytte midt i kamp** | Du blir slått ut mens du skriver i Studio. | Pause ved `blur`, `visibilitychange`, Studio-panelet og `frozen`. Egen test i gjennomspillingen. |
| **Ytelse** | Bærbare maskiner med Studio åpent. | Én scene om gangen (bygda sover). Høyst 6 monstre og 1–2 kast om gangen. Ingen nye objekter per bilde, og ingen fysikkmotor. |
| **Gamle lagringer og `git pull`** | Nye felt hos noen på gammel versjon. | Felt legges bare til, vaskes og testes for gammel og ny versjon. |
| **`?dev`** | `?dev` eier alt utstyr og kan hoppe til alle etasjer. | Som for lukene. «Nullstill grotta» i DevPanel. |
| **Generatoren lager en blindgate** | Trappa kan ikke nås. | Testen for at alt kan nås, for hvert rom, med speiling og 1 000 seeds. |
| **Tonen** | Vold i en koselig julekalender. | Monstrene blir slått ut og forsvinner i snø. Du besvimer og våkner hos Brann. Snømonsteret fra historien er ikke med. |
| **Balanse** | For vanskelig eller for lett. | Alle tall er startverdier med test og plan. Kampen testes med tre personer før G3. |

### Fem spørsmål (`luke-design`)

| Spørsmål | | Hvorfor |
| --- | --- | --- |
| Tydelig | ~ | Trapp, hjerter og «Funnet på turen» er kjent fra andre spill. Varslene må testes med folk som ikke spiller mye. |
| Verdt det | ✓ | Rustningen, XP til nivå 10 og materialer til smiing senere. Våpenets navn betyr noe. |
| Svarer | ✓ | Treff, tall og risting med en gang, slik det er i dag mot snømonsteret. |
| Belønnende | ~ | Partikler, tall og kiste, men ingen lyd. Det er det samme svake punktet som `spillvurdering.md` peker på for hele spillet. |
| Passer | ~ | Den er frivillig, koselig i tonen og bruker Sanity-våpen og -drikker. Men den er det største ikke-Sanity-systemet i spillet, så den må holdes liten. |

### Fem tester (`luke-design`)

1. **Ny deltaker:** finner hen inngangen, skjønner hjertene og ser varselet før edderkoppen stormer?
2. **Stresstest:**
   - Trykk <kbd>Mellomrom</kbd> mange ganger.
   - Bytt til Studio midt i kamp.
   - Last siden på nytt i grotta.
   - Publiser en drikk mens du er der nede.
3. **Mestring:** blir etasje 1–3 raskere andre gang? Gjenkjenner du monstrene og varslene?
4. **Misbruk:** reload for å slippe å besvime, og femti drikker. Reload skader bare spilleren selv, og drikkene har et tak.
5. **Tilskuer:** skjønner en som ser på, at «edderkoppen blinket, så stormet den»?

## 11. Spørsmål til brukeren (besluttet)

Brukeren godkjente planen 2026-11-24 og valgte anbefalingen på alle spørsmålene under.

| # | Spørsmål | Besluttet |
| --- | --- | --- |
| 1 | Skal inngangen ligge i bygda (skogkanten nordvest) eller i et rolig område (fase B)? | **I bygda.** Da venter ikke grotta på et nytt kart, og skogkanten finnes allerede i uke 2. |
| 2 | Skal monstrene hete det de er (Rotte, Slim, Troll), eller få egne navn? | **Det de er.** Det samme gjelder for steder og personer. Sjefene heter Isvette og Isdrage. |
| 3 | Skal drikker fra Studio helbrede i grotta? | **Ja, 2 hjerter, høyst 3 per tur.** Det er en enkel kobling fra Sanity til spillet, og den gir sideoppdraget S1 en mening. |
| 4 | Skal monstrene «slås ut» i stedet for å dø? | **Ja.** Det holder tonen og passer julaften, der snømonsteret blir med på festen. |
| 5 | Når skal grotta komme? | **G0–G3 i `main` senest 18. desember, G4 etter julaften.** Rekker vi ikke 18. desember, blir G0–G3 en romjulsbonus. |
| 6 | Skal snømonsteret i bygda få kamp begge veier? | **Nei.** Det er en del av historien og skal bli venn på julaften. `useCombat.ts` får være som i dag. Fase C testes i grotta. |
| 7 | Skal `deepest` eller sjefene vises på «Hvem er med»? | **Nei, ikke nå.** Det er samme grunn som for sideoppdragene: fellesserveren tar bare luke-id-er. |
| 8 | Skal et lite verksted i `?dev` vise etasjer for en gitt seed? | **Ja.** Det koster lite og gjør det raskt å tegne og sjekke nye rom, som `/figur` gjør for figurdelene. |

## 12. Stemning og større etasjer (besluttet 2026-11-25)

Etter G2 så grotta ryddig, men flat ut, og hver etasje var én skjerm. Brukeren ville ha mer stemning, og etasjer man kan utforske, slik som gruvene i Stardew. Alt står fortsatt bak `FEATURES.cave`.

### Stemning

- **Lys og mørke.**
  - Grotta bruker lyset i Phaser 4 (`this.lights`, `setLighting(true)`). Ingen ny grafikk trengs.
  - Det er mørkt rundt deg, med et kjølig lys rundt figuren.
  - Fakler på veggene lyser varmt og flakker litt.
  - Dypere ned (etasje 10 og mer) er det mørkere.
  - Uten WebGL er grotta som i dag, uten lys.
- **Vegger med dybde.**
  - En vegg som har gulv rett under seg, er en forside med murstein (Tiny Dungeon 40).
  - De andre veggene er «tak», det vil si den samme ruta mørkere.
  - Noen forsider får en variant (28, 57–59), og en sjelden gang et ansikt (19, 20).
- **Fakler.** Flammen på murstein (Tiny Dungeon 29) står på noen forsider, med lys. Det er 2–4 per rom.
- **Gulv.** Sjeldne småstein i gulvet (12), og små isklumper (Tiny Ski 95) som pynt. Steinruta (24) brukes ikke, fordi den ligner en stein man kan slå.
- **Litt liv.**
  - Noen snøfnugg som daler sakte. De vises ikke med `prefers-reduced-motion`.
  - Monstrene snur seg mot deg.

### Større etasjer

- **Flere rom per etasje** (startverdier):
  - etasje 1–2 har 2 rom side ved side;
  - de andre vanlige etasjene har 2 × 2 rom;
  - hvileplassene er fortsatt ett rom, så sjefskampen er lett å lese.
- **Rommene settes sammen** slik Spelunky gjør:
  - hvert rom er en rommal som i dag, speilet eller ikke;
  - nabo-rom får en åpning, to ruter bred der det går, i veggen mellom seg;
  - åpningen ligger der det er gulv på begge sider.
- **Du starter** i rommet øverst til venstre.
- **Trappa** ligger i et tilfeldig rom, men aldri i startrommet. Du må lete litt, men den kan alltid nås. Det sjekkes på samme måte som i dag, med 1 000 seeds.
- **Monstre:**
  - ingen i startrommet på etasje 1–2;
  - ellers 1–3 per rom;
  - høyst 10 per etasje.
  - De våkner først når du kommer nær (`AGGRO_RANGE`), som i dag.
- **Kameraet følger deg**, som i bygda.
  - Rundt etasjen er det litt mørk margin, slik at et hjørne kan komme fram fra under HUD-en.
  - Er etasjen ikke større enn skjermen (hvileplassene), står kameraet stille som før.
- **Ytelse.** Gulv og vegger tegnes én gang per etasje i ett bilde (`DynamicTexture`) i stedet for én figur per rute.
- **G3 bestemmer** hva «full etasje» betyr når etasjen er stor. Forslaget er at bare rommet med trappa er sperret.

## 13. G3: beslutninger (2026-11-25)

Etter stemning og større etasjer var grotta pen, men ensformig: hvert rom hadde 2–3 av de samme tre monstrene, og det fantes ingen ekte prøve før etasje 5. Brukeren valgte dette for G3. Alt står fortsatt bak `FEATURES.cave`.

### Rom med ulik karakter

Hvert rom unntatt startrommet får en type når etasjen lages (startverdier):

| Type | Sjanse | Innhold |
| --- | --- | --- |
| **Rolig** | 25 % | 0–1 monster. Alle steinene (`o`) står. |
| **Vanlig** | 60 % | Som i dag, 2–3 monstre. |
| **Reir** | 15 %, fra etasje 2, høyst ett per etasje | 4–5 monstre og en liten kiste med 2–3 materialer til `trip`. |

Taket på 10 monstre per etasje gjelder fortsatt.

### Full etasje

Bare **rommet med trappa** er sperret. Trappa åpner når monstrene i det rommet er slått. Resten av etasjen kan du utforske som vanlig. Det skjer aldri på etasje 1 eller på en hvileplass. Beskjeden er «Trappa er stengt. Slå monstrene i rommet først.»

### Monstre våkner bare i ditt rom

Et monster våkner når du er i samme rom og innenfor `AGGRO_RANGE`, ikke gjennom vegger. Når det først er våkent, kan det følge deg gjennom åpningene.

### Flaggermus

De kommer fra etasje 3. De flyr over steiner (`flies`), men ikke gjennom vegger.

### Etasje 5: Isvetten og kista

- **Isvetten** stormer mot deg. Når livet er halvt, kaller den på to rotter, én gang.
- **Sjefens liv** vises i HUD-en.
- **Når den er slått,** kommer den aldri tilbake (`bosses.yeti`).
- **Kista** kan bare åpnes når Isvetten er slått. Den gir Rustning (`gear:armour:plate`) én gang (`chests["cave-5"]`).
- **Første gang du kommer til en hvileplass på en tur,** fylles livet, og `trip` blir trygt (flyttes til `inventory`). Du er fortsatt i grotta.

### Materialer

Materialene får ingen bruk i G3. De venter på smiing med oppskrifter i Studio (fase E), som også lærer bort Sanity. Ting-fanen sier fortsatt «Brukes i smia senere».

### Før flagget slås på

- **Feiring når XP** fra monstre, sjefer eller sideoppdrag gir nytt nivå.
- **«Fra grotta»** flyttes ut av fanelista i Ting.
- **Spilltest** med tre personer.

## 14. G4: beslutninger (2026-11-25)

G4 fullfører etasje 6–10. Brukeren valgte at etasje 10 er bunnen inntil videre. Alt står fortsatt bak `FEATURES.cave`.

### Troll og kyklop

- **Troll** kommer fra etasje 6. Det går sakte, varsler lenge og stormer.
- **Kyklop** kommer fra etasje 8.
  - Den holder avstand, 4–7 ruter.
  - Før den kaster, løfter den seg og blinker hvitt.
  - Isklumpen (`dungeon` 56) er stor og treg nok til å unngås. Den stopper i vegger og steiner.
  - Det er høyst 3 isklumper i lufta samtidig.
- **Tallene er justert etter del 8.** Et treff på etasje 10 skal ta høyst 1,5 hjerter, så troll og Isdrage får `damage: 2` i stedet for 3.

### Etasje 10: Isdragen og kista

- **Isdragen** er `dungeon` 110 farget blå.
  - Den stormer og kaster isklumper.
  - Den er svak for ild og immun mot frost.
  - Livet vises i HUD-en.
  - Når den er slått, kommer den aldri tilbake (`bosses.drake`).
- **Kista** kan åpnes når Isdragen er slått. Den gir 100 XP én gang (`chests["cave-10"]`). Toasten er `{ title: "Kista på etasje 10", body: "Den var full av gamle notater. Du fikk 100 XP." }`. Notatene peker mot smiing med oppskrifter (fase E).
- **Bunnen.** Etasje 10 har ingen trapp ned. Der trappa ville stått, står det «Lenger ned er det ikke gravd ennå.» når du er i nærheten. Tauet til 10 virker som før.


## 15. G5: smiing (besluttet 2026-11-26)

G5 gir materialene en bruk. Kistene på etasje 5 og 10 gir hver sin oppskrift. Spilleren smir i Studio, og spillet trekker materialene. Brukeren valgte at det smidde blir **utstyr til figuren**. Det gir ingen balanse-risiko, og det synes på figuren og på «Hvem er med». Alt står bak `FEATURES.cave`.

### Oppskriftene (startverdier)

| Oppskrift | Fra | Gir | Ingredienser |
| --- | --- | --- | --- |
| **Isskjold** (`recipe-isskjold`) | Kista på etasje 5 | `extra:shield`, «Isskjold» | Gammel malm × 4, Isskår × 2 |
| **Ishjelm** (`recipe-ishjelm`) | Kista på etasje 10 | `hat:icehelm`, «Ishjelm» | Gammel malm × 6, Isskår × 4 |

- Oppskriftene står i koden (`src/game/recipes.ts`), som materialene. Det er koden som avgjør hva som trekkes, ikke dokumentet i Sanity.
- **En oppskrift er låst opp når kista er åpnet** (`chests["cave-5"]` og `chests["cave-10"]`). Det regnes ut, og ingenting nytt lagres. De som åpnet kista på etasje 5 før G5, har oppskriften med en gang.
- Utstyret er tegnet som resten av figuren, i Kenneys palett. Kilden i Utseende er «Oppskrift fra etasje 5» og «Oppskrift fra etasje 10». Med flagget av ser det ut som annet gjemt utstyr.

### I Studio

To ferdige typer, på samme måte som arkivet i uke 2. Spillerens egne filer (`item.tsx` og `sanity.config.ts`) røres ikke.

- **`recipe`** («Oppskrift»): navn, hva den gir, ingredienser (`array` av objekter med materiale og antall) og beskrivelse. Bare til å lese.
- **`forging`** («Smiing»): navn og en `reference` til en oppskrift.
  - Lista over oppskrifter viser bare dem spilleren har låst opp (`options.filter`). Den leser kistene fra den samme `localStorage`-posten som `solved.tsx`.
  - Spilleren gir tingen sitt eget navn og publiserer.
- **Oppskriftene legges inn i spillerens prosjekt** av spillet (`POST /api/forge`), første gang en låst opp oppskrift mangler der. Det samme dokumentet skrives aldri over.
- Begge tilsvarer uke 2-typene: alle spillere får dem ferdige, og ingen skriver dem som oppgave. Å skrive filteret eller en «Smi»-knapp selv kan bli en luke senere.

### I spillet

- **Når en publisert Smiing finnes,** og oppskriften er låst opp:
  - Har spilleren nok i `inventory`, trekkes materialene, og `crafted[_id]` settes til oppskriften. Utstyret er ditt. Toasten har tittelen «Isskjold» og teksten «Trykk C for å ta på deg «navnet spilleren ga det».»
  - Mangler det noe, trekkes ingenting. Smia i Ting viser «Mangler 2 Isskår». Den smis av seg selv når materialene er samlet, uten å publisere på nytt.
  - Det som ligger i `trip`, teller ikke før det er trygt.
- **Hver oppskrift gir utstyret én gang.** En ny Smiing av samme oppskrift trekker ingenting. Å publisere samme dokument igjen gjør ingenting, fordi `_id` ligger i `crafted`.
- **Utstyret beholdes** selv om dokumentet slettes. Å nullstille fremgangen tar det bort, som annet utstyr.
- **Smia i Ting** viser hver låst opp oppskrift med ingrediensene («Isskår 1/2») og én linje:
  - «Smidd»;
  - «Mangler 2 Isskår» (når en Smiing er publisert);
  - «Lag en Smiing i Studio» (når ingen er publisert).
- **Kistene sier fra:**
  - Etasje 5: `{ title: "Rustning og en oppskrift", body: "Kista på etasje 5 hadde rustning og oppskriften på et isskjold." }`.
  - Etasje 10: `{ title: "Kista på etasje 10", body: "Den var full av gamle notater, og ett var oppskriften på en ishjelm. Du fikk 100 XP." }`.
- Materialene sier «Brukes i smia.» i stedet for «Brukes i smia senere.»

### Ikke i G5

- Våpen, drikker eller andre typer ting fra oppskrifter.
- En «Smi»-knapp (*document action*) og GROQ-oppgaven «Hva kan jeg lage nå?». De passer som luker senere.
- Flere oppskrifter enn to, og oppskrifter fra steder utenfor grotta.
