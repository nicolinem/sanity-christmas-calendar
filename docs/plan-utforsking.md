# Plan: utforsking, belønning og smiing

Status: idé og retning, ikke bygget.

Dette kommer **etter** det som må på plass først: oppstarten, fellesdelen, oppsettøkta 27. november og uke 3. Planen ligger her så valgene vi tar nå ikke stenger for det som kommer senere.

## Kort fortalt

Spilleren kan gå ut av bygda og utforske, men det er frivillig. Der finner spilleren materialer og oppskrifter, kjemper mot monstre og får XP. I Studio smir spilleren egne ting fra oppskriftene, og spillet trekker materialene. Studio er arbeidsbenken. Spillet bestemmer hva som er mulig å lage, og hvor sterkt det er.

## Prinsipper

1. **Utforsking er alltid frivillig.** Ingen luke krever et område utenfor bygda. Lukene er kalenderen, og utforsking er for de som vil spille mer.
2. **Ingen egen backend.** Hver deltaker har sitt eget Sanity-prosjekt og sin egen lokale server, og det finnes ingen toppliste. Juks skader bare spilleren selv.
   - **Spillets fremgang** (`localStorage`, `Progress`): XP, antall materialer, hva som er låst opp, hva spilleren har på seg og hvilke ting som er smidd.
   - **Spillerens eget Sanity-prosjekt:** tingene spilleren lager (`item`) og oppskriftene arrangøren har seedet inn (`recipe`).
   - **Spillets kode:** stats, balanse, materialer, monstre og kart.
3. **Sanity former tingen, og spillet bestemmer tallene.** Det er som i `src/game/rules.ts` i dag. Navn, sprite og beskrivelse kommer fra Sanity. Skade, forsvar og sjeldenhet kommer fra spillet.
4. **Materialer brukes opp i spillet, ikke i Studio.** Se «Smiing».
5. **Enkle norske navn på ting**, som «Isskår», «Ulveskinn» og «Gammel malm». Ikke finn på stedsnavn: områdene heter det de er («Skogkanten», «Grotta», «Etasje 7»). Sanity-begreper som `reference` og *document action* er engelske.
6. **Lite og ferdig er bedre enn stort og halvferdig.** Den største kostnaden er kart, monstre og balanse, ikke kode.

## Ett stort kart eller flere områder?

**Anbefaling: flere områder som henger sammen i kantene, slik som i Stardew Valley.** Bygda er midtpunktet. Går du ut på siden av kartet, toner skjermen kort til svart, og neste område lastes inn med deg ved den matchende inngangen.

Fordeler:

- **Hvert område er et lite, eget kart.** Det er lett å lage, teste og bytte ut. Ett stort kart blir tungt å redigere og å laste, særlig på bærbare maskiner med Studio åpent ved siden av.
- **Phaser passer til det.** Ett tilemap og ett sett monstre om gangen, med kameragrenser per område. Bygda kan forbli som den er.
- **Flere områder gir naturlige porter for fremgang.** Et område kan være låst til en luke eller et nivå er nådd («Isen er for tynn ennå»), uten usynlige vegger midt i et stort kart.
- **Kartet i journalen** kan vise områdene som ruter, og bygda i detalj.

Ulempen er overgangene. De må være raske (under et halvt sekund) og gjøre det tydelig hvor man kommer ut. Kantene markeres med en sti eller et skilt, slik at ingen går ut ved et uhell.

### To slags områder

**1. Rolige, faste områder rundt bygda.** Et par håndlagde kart, for eksempel en skogkant og et frossent vann. Her bor folk du kan snakke med. Noen sier bare et par setninger, noen gir et lite sideoppdrag eller en gave én gang, og det finnes små overraskelser å finne. Det er få eller ingen monstre her. Områdene er koselige, billige å lage og gjør verden større uten at noe må balanseres.

- NPC-er er data, som `NPCS` i `village.ts`: rolle, sprite, plass, replikker (én tilfeldig eller i rekkefølge) og eventuelt en `Reward` én gang.
- Folk kalles det de er («fiskeren», «barnet ved vannet»). Ingen oppdiktede stedsnavn.
- Overraskelser er usynlige punkter som gir en kort replikk eller en liten belønning én gang (`found` i `Progress`).

**2. Grotta: én hule med etasjer, slik som gruvene i Stardew Valley.** Inngangen ligger i et av de rolige områdene. Hver etasje er et lite rom. Du går ned en trapp for å komme til neste etasje, og jo lenger ned, jo sterkere monstre og bedre funn.

- **Etasjene er bygd av ferdige rommaler.** 6–8 håndlagde rom brukes om igjen og blandes, med monstre og materialer plassert tilfeldig innenfor faste regler. Det gir mye spill for lite kartarbeid.
- **Dybden styrer vanskeligheten:** liv og skade for monstrene skaleres med etasjen. Nye monstertyper dukker opp ved etasje 5, 10 og 15, og materialene blir sjeldnere jo lenger ned du kommer.
- **Hvert femte etasje er en hvileplass** med en sterkere fiende og en kiste. Når du har nådd den, kan du starte derfra neste gang (heis eller tau). Det lagres som `deepest` i `Progress`.
- **Grafikk:** Kenney Tiny Dungeon (CC0), farget om til vinter (is, blått og hvitt) med et skript, på samme måte som vi gjorde med skogen. Hver tiende etasje kan få en ny fargepalett, så dybden synes.
- **Senere** kan en forhekset skog lages på samme måte: skogfliser med en annen palett og andre monstre. Byggemåten er den samme som i grotta, bare med et annet uttrykk.

**Anbefalt rekkefølge:** først ett rolig område med NPC-er og overraskelser. Det er lite arbeid, koselig og viser at overgangene virker. Deretter grotta med de første ti etasjene.

## Hva vi bør legge til rette for nå

Dette er billig å gjøre riktig tidlig og dyrt å rette senere.

### 1. Én belønningsløype

I dag er `Quest.reward` bare `{ forgeLevel }` (`src/game/quests/types.ts`), og utstyr gis via `GEAR_REWARDS` i `src/game/wardrobe.ts`. Lag én type og én funksjon som luker, kister og monstre bruker:

```ts
type Reward = {
  xp?: number;
  items?: { id: string; count: number }[]; // materials and consumables, defined in code
  unlock?: string[];                        // "gear:hat:helmet", "recipe:frostblad", …
};
applyReward(progress, reward, source): Progress // + one toast: «Du fant …»
```

`GEAR_REWARDS` blir da vanlige belønninger på luker.

### 2. XP og nivå

I dag øker nivået med ett per luke (`forgeLevelFor`, maks 4). Det byttes ut med XP, og nivået regnes ut av den. Hele kurven kan justeres i `rules.ts`.

**Grunnenheten er 10 XP**, det et lite monster i første etasje gir. Alt annet måles mot det:

| Kilde                              | XP                                  |
| ---------------------------------- | ----------------------------------- |
| Lite monster, etasje 1             | 10                                  |
| Monster dypere ned                 | 10 + 2 per etasje (etasje 10 = 30)  |
| Boss ved hvileplass                | 100                                 |
| Overraskelse funnet                | 10                                  |
| Sideoppdrag fra en NPC             | 30–50                               |
| Frivillig luke                     | 50                                  |
| Luke                               | 100                                 |

**Nivåkurve:** hvert nivå krever 100 XP mer enn det forrige. Det er vanlig spillprogresjon, der det går raskt i starten og tar lengre og lengre tid.

| Nivå | XP for å nå nivået | Totalt |
| ---- | ------------------ | ------ |
| 1    | 0                  | 0      |
| 2    | 100                | 100    |
| 3    | 200                | 300    |
| 4    | 300                | 600    |
| 5    | 400                | 1 000  |
| 6    | 500                | 1 500  |
| 7    | 600                | 2 100  |
| 8    | 700                | 2 800  |
| 9    | 800                | 3 600  |
| 10   | 900                | 4 500  |

**Maks nivå er 10.** Formelen er `totalXp(level) = 50 × level × (level − 1)`.

Hvorfor det går opp:

- Alle lukene i tre uker gir rundt 2 100 XP, og de frivillige rundt 300. Den som bare gjør lukene, ender rundt **nivå 7**.
- Den som også utforsker, når **nivå 10** før jul. Lukene er fortsatt den viktigste veien opp, mens utforsking er det som tar deg til topps.
- Skaden følger nivået. `FORGE_DAMAGE` utvides til 10 verdier.
- Stripen under nivået på spillerplaten viser XP mot neste nivå. Ved maks nivå er den full og gylden.

`Progress` lagrer bare `xp: number`. Nivå og stripe regnes ut. Eksisterende spillere får XP for luker de allerede har fullført første gang spillet starter med XP.

### 3. Antall og opplåsinger i fremgangen

Utvid `Progress`:

```ts
inventory: Record<string, number>; // isskar: 3, ulveskinn: 1
unlocked: Record<string, true>;    // gear, recipes, areas
crafted: Record<string, string>;   // item _id → recipe id, for items already "made"
```

- `ownedGear` i `wardrobe.ts` blir et filter på `unlocked`.
- Materialene er data i kode, `src/game/materials.ts`, på samme måte som figurdelene: id, navn, sprite og beskrivelse.

### 4. Kart som data i Phaser

I dag er alt i `WinterQuestScene`. Gjør det mulig å bytte område før det første nye området bygges. Hvert område beskrives med:

```ts
type Area = {
  id: string;                                        // "bygda", "skogkanten", "grotta-3", …
  depth?: number;                                    // floors in the cave: scales enemies and finds
  map: TileMapData;                                  // or a Tiled JSON from Kenney tiles
  exits: { edge: "e" | "w" | "n" | "s"; at: [number, number]; to: string; arrive: string }[];
  spawns: EnemySpawn[];
  chests: { id: string; at: [number, number]; reward: Reward }[];
  locked?: (p: Progress) => string | null;           // reason text, or null if open
};
```

`bridge.ts` får `area` i `WorldState`. HUD-en viser områdets navn kort ved overgangen. Kister og drept boss lagres i `Progress`, slik at de ikke gir belønning to ganger.

### 5. Monstre som data, og kamp begge veier

`useCombat` kjenner bare «wraith», og bare spilleren slår. Monstre skal slå tilbake, og spilleren trenger liv.

```ts
type Enemy = {
  id: string; name: string; sprite: SpriteRef;
  hp: number; damage: number; speed: number;  // base values, scaled by depth
  moves: Move[];                               // what makes it special
  weakTo?: Element; drops: Reward;
};
type Move =
  | { kind: "chase" }                          // walks towards you
  | { kind: "charge"; windupMs: number }       // stops, flashes, rushes in a straight line
  | { kind: "shoot"; projectile: SpriteRef; everyMs: number }
  | { kind: "split"; into: string }            // becomes two smaller ones when killed
  | { kind: "blink"; everyMs: number }         // vanishes and appears next to you
  | { kind: "freeze"; ms: number };            // its hit slows you down
```

- **Alle angrep varsles** (blink, skjelving, en skygge på bakken) før de treffer, så kampen er lesbar og ikke flaks.
- **Spilleren har liv** (hjerter i HUD-en ved spillerplaten), og kort usårbarhet etter å ha blitt truffet.
- **Når livet er tomt**, våkner spilleren i bygda og mister **det som ble funnet på denne turen**. Ingen store kriser:
  - XP mistes aldri, heller ikke innenfor nivået.
  - Ting fra Sanity, utstyr og alt du hadde før turen mistes aldri.
  - Monstre du slo, ga XP med en gang, og den beholder du.

  Slik bygges det: alt du plukker opp utenfor bygda havner først i `trip` i `Progress`, som er en egen liste og ikke inventaret. Når du kommer tilbake til bygda eller når en hvileplass i hula, flyttes `trip` over i `inventory`. Dør du, tømmes `trip`. Det er hele mekanismen, og den trenger ingen angring eller sikkerhetskopi.

  HUD-en viser «Funnet på turen: 4» ved spillerplaten mens du er ute, så det er tydelig hva som står på spill.
- **Dybden skalerer verdiene:** `scale(enemy, depth)` i `rules.ts`, for eksempel +12 % liv og +8 % skade per etasje.
- **Monstre kommer tilbake.** Et rom fylles på nytt når du forlater det og kommer inn igjen, eller ved ny etasje i grotta. Bosser ved hvileplassene kommer ikke tilbake.
- **Navnemagi** (`magic.ts`) gir allerede elementer, så svakhet for elementer kan brukes med en gang: et frostvåpen mot et ildmonster.

## Smiing

1. **Oppskrifter** er Sanity-dokumenter (`recipe`) som arrangøren seeder inn, på samme måte som arkivet i uke 2 (`/api/archive`). En oppskrift har:
   - navn;
   - hvilken type ting den gir (`kind`);
   - ingredienser, som id-er fra `materials.ts` med antall;
   - beskrivelse.
2. **Spilleren må ha låst opp oppskriften** (`unlocked["recipe:…"]`), for eksempel fra en kiste i grotta. Studio viser bare oppskrifter spilleren har låst opp. Det bruker samme mekanisme som `solved.tsx`.
3. **I Studio** lager spilleren sin variant: et `item` med `reference` til oppskriften, eget navn, egen sprite og egen beskrivelse.
4. **I spillet:** når et publisert `item` med oppskrift dukker opp, gjør spillet dette:
   - Har spilleren nok materialer, trekkes de, og `crafted[_id]` settes. Tingen havner i Ting-fanen.
   - Mangler det materialer, vises tingen grå med «Mangler 2 Isskår». Den blir ekte når materialene er samlet, uten at spilleren må publisere på nytt.
   - Å publisere samme dokument igjen gir ingen ny ting, fordi `_id`-en allerede er lagret i `crafted`.
5. **«Smi»-knappen i Studio** er en *document action* som oppretter et `item` fra en oppskrift. Den passer som luke i uke 3 (Automatisere) for teknisk spor. Den er et godt mål for luka, ikke noe vi bygger som infrastruktur først.

**Hvilke Sanity-begreper smiingen gir naturlig:**

| I spillet                   | Sanity-begrep                            |
| --------------------------- | ---------------------------------------- |
| Ting med oppskrift          | `reference`                              |
| Ingredienser                | `array` av objekter                      |
| Bare opplåste oppskrifter   | filtrert `reference` (`options.filter`)  |
| Felt som avhenger av type   | `hidden` og conditional fields           |
| «Smi»-knappen               | *document action*                        |
| Hva kan jeg lage nå?        | GROQ                                     |

## Faser

Fasene kommer i denne rekkefølgen, etter oppstarten, fellesdelen, 27. november og uke 3.

**Fase A – belønning og XP** (ingen ny verden). Kan gjøres parallelt med uke 3.

- Lag `Reward` og `applyReward`, og XP-terskler for nivå.
- Utvid `Progress` med `inventory`, `unlocked` og `crafted`.
- La de frivillige lukene gi XP og materialer, og vis materialer i Ting-fanen med antall.
- Ferdig når en luke gir XP og et materiale, spillerplaten viser nivået, og Ting-fanen viser «Isskår × 2».

**Fase B – ett rolig område.**

- Lag område-data og overganger i kantene med toning.
- Legg inn ett håndlaget område ved siden av bygda, med 3–4 NPC-er med replikker, ett sideoppdrag med gave og et par overraskelser.
- Ferdig når spilleren kan gå ut og tilbake, snakke med alle og få gaven én gang.

**Fase C – kamp begge veier.**

- Gi spilleren liv, monstre angrep med varsel, og `Move`-typene `chase`, `charge` og `shoot`.
- Spilleren våkner i bygda når livet er tomt.
- Test det på «wraith» og én ny fiende før grotta bygges.

**Fase D – grotta, etasje 1–10.**

- Hent Kenney Tiny Dungeon (CC0, spør brukeren før nedlasting) og farg den om til vinter. Lag fargebyttet som et skript, ikke for hånd, så det kan kjøres på nytt.
- Lag 6–8 rommaler, tilfeldige etasjer og trapp ned.
- Monstre skaleres med dybden, og nye typer kommer ved etasje 5 og 10.
- Lag hvileplass med sterkere fiende og kiste ved etasje 5 og 10. Kisten på etasje 5 gir den første oppskriften.
- Ferdig når spilleren kan gå ned til etasje 10, dø og våkne i bygda, og starte fra etasje 5 neste gang.

**Fase E – smiing.**

- Lag `recipe`-schema og seeding.
- Gi `item` en `reference` til oppskrift.
- Bygg trekkingen av materialer og «Mangler»-visningen i spillet.
- Ferdig når en opplåst oppskrift i Studio gir en ting i spillet og materialene er trukket.
- «Smi»-knappen kommer som luke, se over.

**Fase F – senere.**

- Etasje 11–20 med ny palett og nye monstre (`split`, `blink`, `freeze`).
- En forhekset skog laget på samme måte som grotta.
- Rustning og smykker som Sanity-ting, og flere plasser i Utstyr.
- Sjeldenhetsgrader bestemt av oppskrift og dybde.
- Forbruksvarer som virker, som drikker som gir liv.

## Avklart

- **Monstre kommer tilbake.** Rom fylles på nytt, men bosser ved hvileplassene kommer ikke tilbake.
- **Ingen bytting** av ting eller materialer mellom spillere.
- **Monstre slår tilbake**, har egne trekk og blir sterkere jo lenger unna bygda og jo lenger ned du kommer.
- **Verden består av** rolige faste områder med NPC-er, sideoppdrag, gaver og overraskelser, pluss én hule med etasjer. En forhekset skog kan komme senere.
- **XP:** grunnenheten er 10, hvert nivå krever 100 mer enn det forrige, og maks nivå er 10. Se «XP og nivå».
- **Død:** du mister det du fant på turen, og ingenting annet. XP mistes aldri.
- **Grotta** er åpen fra start. En NPC ved inngangen advarer til du har nådd nivå 2.

## Åpne spørsmål

- Skal nivå 10 gi noe ekstra, som en kosmetisk ting eller en tittel på «Hvem er med»?
- Skal XP vises på «Hvem er med», eller bare nivået?
