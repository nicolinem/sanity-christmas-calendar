# Grotta: fase A og G0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Legg grunnmuren for grotta: XP og nivå 1–10 bak `FEATURES.rpg`, materialer i fremgangen, vinterfargede grottefliser og en ren generator som lager etasjer fra håndlagde rommaler. Til slutt et verksted i dev som viser etasjene.

**Architecture:**
- XP regnes ut av fakta (fullførte luker og leverte sideoppdrag) pluss et lagret tall for XP fra monstre. Nivået regnes ut av XP.
- Med `FEATURES.rpg` av er nivå og skade nøyaktig som i dag.
- Grotta er rene TypeScript-moduler uten Phaser i `src/game/cave/`, testet med `node --test`. Ingen scene, kamp eller HUD i denne planen. Det er G1 og G2.

**Tech Stack:** TypeScript, Next 16 (bare verkstedssiden), `node --test` med `sucrase`, Python med Pillow for fargeskriptet, som før.

**Spec:**
- `docs/plan-grotta.md`, del 4, 6 og 8, og fase A, G0 og G1 i del 9;
- `docs/plan-utforsking.md`, «XP og nivå».

## Global Constraints

- Bare Kenney-grafikk (CC0) fra `public/assets/kenney/`. Ingen nedlasting og ingen nye npm-avhengigheter.
- Nye felt i `Progress` legges bare til, og de vaskes i `readProgress`, slik `seenGear` og `side` gjøres. Felt får aldri nytt navn.
- Med `FEATURES.rpg` av endres ingenting deltakerne ser eller merker: nivået er fortsatt `forgeLevelFor` med tak på 4, og skaden er den samme.
- XP-tall (`plan-utforsking.md`): luke 100, frivillig luke 50, sideoppdrag `reward.xp`, vanlig monster lagres i `progress.xp`. `totalXpForLevel(level) = 50 × level × (level − 1)`, og maks nivå er 10.
- `FORGE_DAMAGE` utvides til 10 verdier: `[4, 6, 8, 10, 12, 14, 16, 18, 20, 22]` (startverdi). De fire første er uendret.
- Rommaler er 24 × 14 ruter med tegnene `#` (vegg), `.` (gulv), `S` (start), `T` (mulig trapp), `m` (mulig monster), `o` (mulig stein) og `k` (kiste).
- Generatoren er deterministisk: samme `depth`, `seed` og `previousRoom` gir alltid samme etasje.
- Norsk tekst i UI, med Sanity-begreper på engelsk. Replikker skal høres ut som vanlig tale.
- Jobb på en gren i repoet til brukeren (`/Users/nicoline.mork/Projects/Personal/sanity-christmas-calendar`), ikke i en egen arbeidskopi. Kjør `npm run format` før hver commit. Commit aldri `.claude/launch.json` eller `docs/presentasjon/`.
- Next 16 er ikke den Next du kjenner. Les `node_modules/next/dist/docs/` før verkstedssiden skrives, og følg mønsteret i `src/app/figur/page.tsx`.

## Review Focus

1. **Gamle eller ødelagte lagringer:** `xp` som mangler, er negativ, `NaN` eller en tekst, skal bli 0. `inventory` med negative tall eller desimaler skal miste de verdiene. Testes i task 2.
2. **Bytte av spor:** XP for fullførte luker skal ikke forsvinne når deltakeren bytter spor, fordi lukene telles mot alle kapitler. Testes i task 2.
3. **Flagget av:** `playerLevel` skal gi akkurat `forgeLevelFor` (tak 4), også når en deltaker har mer enn 300 XP. Testes i task 3.
4. **Blindgater:** hver seed (1 000 stykker, alle dybder 1–12, med og uten speiling) skal gi en trapp som kan nås fra `S` uten å gå gjennom steiner. Testes i task 6.
5. **Samme rom to ganger på rad:** skal aldri skje når `previousRoom` er gitt. Hvileplasser følger dybden, ikke regelen. Testes i task 6.

---

## Filer

| Fil | Ansvar |
| --- | --- |
| `src/game/rules.ts` (endres) | XP-kurve, nivå, skade for 10 nivåer, tak på 4 for luke-nivå |
| `src/game/xp.ts` (ny) | `totalXp` og `playerLevel`: XP fra fakta, og nivået etter flagget |
| `src/game/materials.ts` (ny) | Materialer som data, og `addItems` |
| `src/game/quests/types.ts`, `progress.ts` (endres) | Feltene `xp` og `inventory`, med vasking |
| `src/game/sideQuests/engine.ts` (endres) | `deliverSide` legger `reward.items` i `inventory` |
| `src/components/hud/useQuests.ts`, `PlayerPlate.tsx`, `src/components/figure/CharacterSheet.tsx`, `DevPanel.tsx`, `GameClient.tsx` (endres) | Nivå og XP-stripe, materialer i Ting-fanen, og en dev-knapp |
| `scripts/winterize-tiles.py` (endres) | Lager `public/assets/winter-cave.png` og `winter-cave-deep.png` |
| `src/game/sprites.ts` (endres) | Arkene `cave` og `caveDeep` |
| `src/game/cave/random.ts` (ny) | Seedet tilfeldighet |
| `src/game/cave/rooms.ts` (ny) | Rommalene og hvileplassene |
| `src/game/cave/enemies.ts` (ny) | Monster-id, navn, sprite og fra hvilken dybde de kan komme (statistikk kommer i G2) |
| `src/game/cave/generate.ts` (ny) | `generateFloor` |
| `src/app/grotte/page.tsx`, `src/components/cave/CaveLab.tsx` (nye) | Verkstedet, bare i utvikling |

---

### Task 1: XP-kurve og skade for 10 nivåer

**Files:**
- Modify: `src/game/rules.ts`, `src/game/quests/engine.ts`, `src/game/community.ts`
- Test: `src/game/rules.test.cjs` (ny)

**Interfaces:**
- Produces:
  - `MAX_LEVEL = 10`;
  - `LUKE_LEVEL_CAP = 4`;
  - `XP_PER_LUKE = 100`;
  - `XP_PER_BONUS_LUKE = 50`;
  - `totalXpForLevel(level: number): number`;
  - `levelForXp(xp: number): number`;
  - `xpProgress(xp: number): { level: number; into: number; needed: number }`.

  `FORGE_DAMAGE` får 10 verdier, og `MAX_FORGE_LEVEL` blir 10. `clampForgeLevel` klemmer til 1–10.

- [ ] **Step 1: Skriv de feilende testene**

```js
test("the XP curve: each level needs 100 more than the last", () => {
  assert.deepEqual([1, 2, 3, 4, 10].map(totalXpForLevel), [0, 100, 300, 600, 4500]);
});
test("level from XP, capped at 10", () => {
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(99), 1);
  assert.equal(levelForXp(100), 2);
  assert.equal(levelForXp(4499), 9);
  assert.equal(levelForXp(99999), 10);
  assert.equal(levelForXp(-5), 1);
  assert.equal(levelForXp(Number.NaN), 1);
});
test("progress towards the next level, full at the top", () => {
  assert.deepEqual(xpProgress(150), { level: 2, into: 50, needed: 200 });
  assert.deepEqual(xpProgress(5000), { level: 10, into: 0, needed: 0 });
});
test("damage keeps the first four forge levels and grows by 2 after", () => {
  assert.deepEqual([...FORGE_DAMAGE], [4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
  assert.equal(MAX_FORGE_LEVEL, MAX_LEVEL);
  assert.equal(forgedPower(10).damage, 22);
});
```

- [ ] **Step 2: Kjør `node --test src/game/rules.test.cjs`.** Forventet: FAIL, fordi `totalXpForLevel` ikke er definert.
- [ ] **Step 3: Implementer i `src/game/rules.ts`.** `levelForXp` er det høyeste nivået der `totalXpForLevel(level) <= xp`, og ugyldig XP regnes som 0. `LUKE_LEVEL_CAP` får en kommentar: «taket for nivå fra luker når `FEATURES.rpg` er av».
- [ ] **Step 4: Bruk `LUKE_LEVEL_CAP`** i `forgeLevelFor` (`src/game/quests/engine.ts`) og `forgeLevelFromMilestones` (`src/game/community.ts`): `Math.min(LUKE_LEVEL_CAP, …)` før `clampForgeLevel`. Da gir de fortsatt høyst 4.
- [ ] **Step 5: Kjør `npm test`.** Forventet: alle består, også `forgeLevelFor`-testene i `engine.test.cjs` og testene i `community.test.cjs`.
- [ ] **Step 6: Commit** `rules.ts`, `rules.test.cjs`, `quests/engine.ts` og `community.ts` med meldingen «XP-kurve og skade for 10 nivåer».

### Task 2: `xp` og `inventory` i fremgangen, og XP regnet ut av fakta

**Files:**
- Modify: `src/game/quests/types.ts`, `src/game/quests/progress.ts`
- Create: `src/game/xp.ts`, `src/game/materials.ts`
- Test: `src/game/xp.test.cjs` (ny), `src/game/quests/progress.test.cjs`

**Interfaces:**
- Consumes: `XP_PER_LUKE` og `XP_PER_BONUS_LUKE` (task 1), `SIDE_QUESTS` fra `src/game/sideQuests/data.ts`, `CHAPTERS`.
- Produces:
  - `Progress.xp: number`, XP fra vanlige monstre, standard 0;
  - `Progress.inventory: Record<string, number>`, standard `{}`;
  - `totalXp(progress: Pick<Progress, "completed" | "side" | "xp">): number` i `src/game/xp.ts`;
  - `type MaterialId = "isskar" | "malm"`;
  - `MATERIALS: Record<MaterialId, { name: string; sprite: SpriteDef; description: string }>`;
  - `addItems(progress: Progress, items: { id: string; count: number }[]): Progress` i `src/game/materials.ts`.

- [ ] **Step 1: Skriv de feilende testene** i `xp.test.cjs` og `progress.test.cjs`.

```js
test("lukes give 100 XP, optional ones 50, counted over both tracks", () => {
  const completed = { "the-broken-forge": AT, "archive-questions": AT, "weapon-description": AT };
  assert.equal(totalXp({ completed, side: {}, xp: 0 }), 100 + 50 + 100);
});
test("delivered side quests give their reward.xp; taken ones give nothing", () => {
  const side = { "warm-drink": { at: AT, step: 1, done: AT }, "flour-sack": { at: AT, step: 1 } };
  assert.equal(totalXp({ completed: {}, side, xp: 0 }), 30);
});
test("stored monster XP is added; unknown ids are ignored", () => {
  assert.equal(totalXp({ completed: { gone: AT }, side: { gone: { at: AT, step: 0, done: AT } }, xp: 40 }), 40);
});
test("addItems adds counts and never goes below zero or keeps fractions", () => {
  const p = addItems({ ...EMPTY_PROGRESS }, [{ id: "isskar", count: 2 }]);
  assert.equal(addItems(p, [{ id: "isskar", count: 1 }]).inventory.isskar, 3);
  assert.equal(addItems(p, [{ id: "isskar", count: -5 }]).inventory.isskar, 0);
});
// progress.test.cjs
test("xp and inventory default safely and drop bad values", () => {
  // missing → 0 and {}; xp -3, "x", NaN → 0;
  // inventory { isskar: 2, malm: -1, x: 1.5, y: "2" } → { isskar: 2 }
});
```

- [ ] **Step 2: Kjør `npm test`.** Forventet: FAIL, fordi `totalXp` og `addItems` ikke finnes.
- [ ] **Step 3: Legg `xp` og `inventory` til `Progress`.** De legges også i `EMPTY_PROGRESS` og vaskes i `readProgress`.
  - `xp`: endelig tall ≥ 0, ellers 0.
  - `inventory`: et vanlig objekt med bare heltall ≥ 0.
- [ ] **Step 4: Implementer `totalXp`.**
  - Luker teller mot alle kapitler i `CHAPTERS`, ikke bare sporet. Da forsvinner ingen XP ved bytte av spor.
  - XP for sideoppdrag gjelder bare de med `done`.
  - Steder i `found` gir ikke XP. Sideoppdragenes steder ligger der, og «overraskelser» med XP kommer først i fase B.
- [ ] **Step 5: Implementer `materials.ts`.**
  - `isskar`: navn «Isskår», sprite `{ sheet: "dungeon", frame: 56 }`, beskrivelse «Kald og klar. Brukes i smia senere.».
  - `malm`: navn «Gammel malm», sprite `{ sheet: "dungeon", frame: 42 }`, beskrivelse «Tung og rusten. Brukes i smia senere.».
  - `addItems` avrunder ned og holder hvert antall ≥ 0.
- [ ] **Step 6: Kjør `npm test`.** Forventet: alle består.
- [ ] **Step 7: Commit** med meldingen «XP og materialer i fremgangen».

### Task 3: Nivå etter flagget, XP-stripe og materialer i Ting-fanen

**Files:**
- Modify: `src/game/xp.ts`, `src/game/sideQuests/engine.ts`, `src/components/hud/useQuests.ts`, `src/components/hud/PlayerPlate.tsx`, `src/components/figure/CharacterSheet.tsx`, `src/components/hud/DevPanel.tsx`, `src/components/GameClient.tsx`, `src/app/globals.css`
- Test: `src/game/xp.test.cjs`, `src/game/sideQuests/engine.test.cjs`

**Interfaces:**
- Consumes: `levelForXp`, `xpProgress`, `LUKE_LEVEL_CAP` (task 1); `totalXp`, `addItems`, `MATERIALS` (task 2).
- Produces:
  - `playerLevel(chapters: Chapter[], progress: Progress, rpg: boolean): number` i `src/game/xp.ts`;
  - `useProgress()` returnerer `forgeLevel` (nå `playerLevel(…, FEATURES.rpg)`) og `xp: { total: number; into: number; needed: number }`;
  - `PlayerPlate` får prop `xp?: { into: number; needed: number }`.

- [ ] **Step 1: Skriv de feilende testene.**

```js
test("with the flag off the level is the forge level, capped at 4", () => {
  // progress with 7 completed reward lukes on the non-technical track:
  assert.equal(playerLevel(chapters, progress, false), 4);
  assert.equal(playerLevel(chapters, progress, false), forgeLevelFor(chapters, progress));
});
test("with the flag on the level comes from XP", () => {
  assert.equal(playerLevel(chapters, progress, true), levelForXp(totalXp(progress)));
});
// engine.test.cjs
test("delivering a side quest adds its reward.items once", () => {
  // quest with reward { items: [{ id: "isskar", count: 2 }] }: deliver → inventory.isskar === 2;
  // delivering again (already done) leaves it at 2.
});
```

- [ ] **Step 2: Kjør `npm test`.** Forventet: FAIL.
- [ ] **Step 3: Implementer `playerLevel`.** Med `rpg` av: `forgeLevelFor(chapters, progress)`. Med `rpg` på: `levelForXp(totalXp(progress))`.
- [ ] **Step 4: La `deliverSide` legge til `reward.items`** med `addItems`, i samme oppdatering som setter `done`.
- [ ] **Step 5: Koble inn i appen.**
  - **`useQuests.ts`:** bruk `playerLevel` både i `useProgress` og i nivå-opp-feiringen (`before` og `after`). Eksporter `xp` fra `xpProgress(totalXp(progress))`.
  - **`PlayerPlate`:** vis en tynn stripe under «Nivå N» når `FEATURES.rpg` er på, med bredde `into / needed`. Ved maks nivå er den full og gyllen (`needed === 0`). Klassene er `plate-xp` og `plate-xp-fill`, med farge `var(--amber)`.
  - **`CharacterSheet`:** i Ting-fanen, under filtrene «Alle» og «Materialer», kommer en liste «Fra grotta» med `MATERIALS`-sprite, navn og «× N» for hvert materiale med antall over 0. Den vises ikke når `inventory` er tom.
  - **`DevPanel`:** en knapp «Gi 2 Isskår» som kaller `updateProgress` med `addItems(p, [{ id: "isskar", count: 2 }])`.
- [ ] **Step 6: Kjør `npm test` og `npx tsc --noEmit`.** Forventet: alt grønt.
- [ ] **Step 7: Sjekk i nettleseren** med `NEXT_PUBLIC_FEATURE_RPG=1` og `?dev`:
  - platen viser «Nivå N» og en stripe;
  - «Gi 2 Isskår» gir «Isskår × 2» i Ting-fanen.

  Uten flagget skal platen se ut som før.
- [ ] **Step 8: Commit** med meldingen «Nivå fra XP bak rpg-flagget, og materialer i Ting-fanen».

### Task 4: Vinterfarger på grotteflisene

**Files:**
- Modify: `scripts/winterize-tiles.py`, `src/game/sprites.ts`
- Create: `public/assets/winter-cave.png`, `public/assets/winter-cave-deep.png` (laget av skriptet)
- Test: `src/game/cave/tiles.test.cjs` (ny)

**Interfaces:**
- Produces:
  - `SpriteSheet` får `"cave" | "caveDeep"`, og `SHEETS.cave` og `SHEETS.caveDeep` peker på de nye filene (12 × 11, samme rekkefølge som Tiny Dungeon);
  - verdiene til `CAVE_FRAMES = { floor: 0, floorPebbles: 12, floorRocks: 24, wall: 40 } as const`, som legges i `src/game/cave/rooms.ts` i task 5.

- [ ] **Step 1: Utvid skriptet.** Det skal lese `public/assets/kenney/tiny-dungeon.png` og skrive to kopier med fargebytte på gulvrutene 0, 12 og 24 (startverdier, fargene er målt fra Tiny Dungeon).

```python
CAVE_FLOOR = {"#763b36": "#3a4466", "#3f2631": "#262b44", "#bd6c4a": "#0099db"}
CAVE_DEEP_FLOOR = {"#763b36": "#262b44", "#3f2631": "#181425", "#bd6c4a": "#124e89"}
CAVE_DEEP_WALL = {"#c0cbdc": "#8b9bb4", "#8b9bb4": "#5a6988", "#52607c": "#3a4466"}  # rute 40
```

  `winter-cave.png` bruker `CAVE_FLOOR`. `winter-cave-deep.png` bruker `CAVE_DEEP_FLOOR` på gulvet og `CAVE_DEEP_WALL` på rute 40. Skriptet skal fortsatt lage `winter-town.png` som før.
- [ ] **Step 2: Kjør `python3 scripts/winterize-tiles.py`.** Forventet: «wrote public/assets/winter-town.png», «wrote public/assets/winter-cave.png» og «wrote public/assets/winter-cave-deep.png». `git diff --stat public/assets/winter-town.png` skal være tom.
- [ ] **Step 3: Skriv en test** som leser bredde og høyde fra PNG-hodet (byte 16–23) i begge filene og sjekker at de er 192 × 176 px. Den skal også sjekke at `SHEETS.cave.url === "/assets/winter-cave.png"` og `SHEETS.caveDeep.url === "/assets/winter-cave-deep.png"`.
- [ ] **Step 4: Kjør `npm test`.** Forventet: PASS. Legg `src/game/cave/*.test.cjs` til test-skriptet i `package.json` hvis det mangler.
- [ ] **Step 5: Commit** skriptet, de to PNG-filene, `sprites.ts`, `package.json` og testen med meldingen «Vinterfarger for grotta».

### Task 5: Rommaler og monstre som data

**Files:**
- Create: `src/game/cave/rooms.ts`, `src/game/cave/enemies.ts`
- Test: `src/game/cave/rooms.test.cjs`

**Interfaces:**
- Produces:
  - `ROOM_W = 24`, `ROOM_H = 14`;
  - `type RoomTemplate = { id: string; rows: string[] }`;
  - `ROOMS: RoomTemplate[]`, 6 vanlige rom;
  - `REST_ROOMS: { 5: RoomTemplate; 10: RoomTemplate }`;
  - `CAVE_FRAMES` (verdier fra task 4);
  - `mirror(rows: string[]): string[]`;
  - `reachable(rows: string[], from: [number, number]): Set<string>`, som gir rutene `"x,y"` du kan gå til fra `from` uten å gå gjennom `#` eller `o`;
  - `type EnemyId = "rat" | "slime" | "bat" | "spider" | "troll" | "cyclops" | "yeti" | "drake"`;
  - `ENEMIES: Record<EnemyId, { name: string; sprite: SpriteDef; from: number; boss?: true }>` med verdiene fra `docs/plan-grotta.md` del 3: Rotte `dungeon` 123 fra 1, Slim 108 fra 1, Flaggermus 120 fra 3, Edderkopp 122 fra 5, Troll 112 fra 6, Kyklop 109 fra 8, Isvette `ski` 78 (sjef, fra 5), Isdrage `dungeon` 110 (sjef, fra 10);
  - `enemiesAt(depth: number): EnemyId[]`, de som ikke er sjefer, med `from <= depth`.

- [ ] **Step 1: Skriv de feilende testene** for hvert rom i `ROOMS` og hver hvileplass:
  - 14 rader på 24 tegn, og bare tegnene `#.STmok`;
  - kanten er bare `#`;
  - nøyaktig én `S`;
  - vanlige rom har minst 2 `T`, 3–8 `m` og ingen `k`;
  - hvileplassene har nøyaktig én `T`, nøyaktig én `k` og nøyaktig én `m` (sjefen);
  - alle `T`, `m` og `k` kan nås fra `S`, både normalt og speilet (`mirror`);
  - hver `o` grenser til en rute som kan nås;
  - ingen `m` står nærmere `S` enn 4 ruter (euklidsk);
  - rom-id-ene er unike.

  For monstrene: `enemiesAt(1)` gir `["rat", "slime"]`, `enemiesAt(5)` har med `spider`, og ingen sjef er med i `enemiesAt(n)` for noen `n`.
- [ ] **Step 2: Kjør `npm test`.** Forventet: FAIL.
- [ ] **Step 3: Tegn de 6 rommene og de 2 hvileplassene** som tekst, slik figurdelene er tegnet i `figure.ts`. Rommene skal være ulike i form: åpen hall, ganger, søyler, to rom med en åpning, isflekker med steiner, og en ring. Testene i step 1 er reglene.
- [ ] **Step 4: Implementer `mirror` og `reachable`.** `mirror` snur hver rad. `reachable` er et bredde-først-søk i fire retninger.
- [ ] **Step 5: Kjør `npm test`.** Forventet: PASS.
- [ ] **Step 6: Commit** med meldingen «Rommaler og monstre for grotta».

### Task 6: Generatoren

**Files:**
- Create: `src/game/cave/random.ts`, `src/game/cave/generate.ts`
- Test: `src/game/cave/generate.test.cjs`

**Interfaces:**
- Consumes: `ROOMS`, `REST_ROOMS`, `CAVE_FRAMES`, `mirror`, `reachable`, `enemiesAt`, `EnemyId` (task 5).
- Produces:
  - `rng(seed: number): () => number` (mulberry32, gir tall i [0, 1));
  - `type Point = { x: number; y: number }` (px, midt i ruta: `x * 16 + 8`);
  - `type Box = { x: number; y: number; w: number; h: number }`;
  - `type Floor`, med feltene under;
  - `generateFloor(depth: number, seed: number, previousRoom?: string): Floor`.

```ts
export type Floor = {
  depth: number;
  room: string;            // template id
  mirrored: boolean;
  rows: string[];          // the template as used, after mirroring
  tiles: number[][];       // frames in the cave sheet, [y][x]
  solids: Box[];           // one 16×16 box per wall tile
  start: Point;
  stairs: Point;
  spawns: { enemy: EnemyId; x: number; y: number }[];
  rocks: Point[];
  chest?: { id: string; x: number; y: number }; // rest floors: id `cave-${depth}`
  locked: boolean;         // stairs open when every spawn is defeated
  rest: boolean;
  sheet: "cave" | "caveDeep"; // depth >= 10 is deep
};
```

- [ ] **Step 1: Skriv de feilende testene.**

```js
test("the same seed gives the same floor", () => {
  assert.deepEqual(generateFloor(3, 42), generateFloor(3, 42));
});
test("never the same room twice in a row", () => {
  for (let seed = 0; seed < 200; seed++) {
    const first = generateFloor(2, seed);
    assert.notEqual(generateFloor(3, seed + 1, first.room).room, first.room);
  }
});
test("floors 5 and 10 are rest floors with a boss and a chest; never locked", () => {
  const five = generateFloor(5, 1);
  assert.equal(five.rest, true);
  assert.equal(five.locked, false);
  assert.deepEqual(five.spawns.map((s) => s.enemy), ["yeti"]);
  assert.equal(five.chest.id, "cave-5");
  assert.deepEqual(generateFloor(10, 1).spawns.map((s) => s.enemy), ["drake"]);
  assert.equal(generateFloor(10, 1).sheet, "caveDeep");
});
test("monster count grows with depth: 2–3 on floor 1, at most 6", () => {
  for (let seed = 0; seed < 300; seed++) {
    const n1 = generateFloor(1, seed).spawns.length;
    assert.ok(n1 >= 2 && n1 <= 3);
    assert.ok(generateFloor(9, seed).spawns.length <= 6);
  }
});
test("only monsters that belong at that depth", () => {
  for (let seed = 0; seed < 300; seed++)
    for (const s of generateFloor(2, seed).spawns)
      assert.ok(["rat", "slime"].includes(s.enemy));
});
test("floor 1 and rest floors are never locked; about one in four others is", () => {
  let locked = 0;
  for (let seed = 0; seed < 1000; seed++) {
    assert.equal(generateFloor(1, seed).locked, false);
    if (generateFloor(3, seed).locked) locked++;
  }
  assert.ok(locked > 180 && locked < 320);
});
test("1 000 seeds on depths 1–12: no errors, and the stairs are always reachable", () => {
  // For each floor: reachable(floor.rows, startTile) includes the stairs tile;
  // every spawn sits on an 'm' and every rock on an 'o' in floor.rows;
  // floor.solids.length equals the number of '#' in floor.rows.
});
```

- [ ] **Step 2: Kjør `npm test`.** Forventet: FAIL.
- [ ] **Step 3: Implementer `rng` i `random.ts`** og `generateFloor` i `generate.ts`. Rekkefølgen og startverdiene er:
  1. Er dybden delelig med 5, brukes hvileplassen: `REST_ROOMS[5]` når `depth % 10 === 5`, ellers `REST_ROOMS[10]`. Sjefen er `yeti` på 5, 15, … og `drake` på 10, 20, …. Ellers trekkes et rom fra `ROOMS` som ikke er `previousRoom`.
  2. Speil med sannsynlighet 0,5. Hvileplasser speiles ikke.
  3. Én `T` velges som trapp. De andre blir gulv.
  4. Antall monstre er `Math.min(6, 2 + Math.floor((depth - 1) / 2) + (r() < 0.5 ? 0 : 1))`, men aldri flere enn det er `m`. Plassene trekkes blant `m`, og typen trekkes jevnt fra `enemiesAt(depth)`.
  5. Hver `o` blir en stein med sannsynlighet 0,6.
  6. `locked` er `!rest && depth > 1 && r() < 0.25`.
  7. Fliser: `#` gir `wall`. Alt annet gir `floor`, eller med sannsynlighet 0,1 hver `floorPebbles` eller `floorRocks`.
  8. `sheet` er `"caveDeep"` når `depth >= 10`.

  Bruk én `rng(seed)` gjennom hele funksjonen, i rekkefølgen over, så samme seed gir samme etasje.
- [ ] **Step 4: Kjør `npm test`.** Forventet: PASS.
- [ ] **Step 5: Commit** med meldingen «Generator for etasjer i grotta».

### Task 7: Verkstedet `/grotte`, bare i utvikling

**Files:**
- Create: `src/app/grotte/page.tsx`, `src/components/cave/CaveLab.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `generateFloor`, `Floor` (task 6); `ENEMIES` (task 5); `SHEETS` (task 4); `SpriteIcon` (`src/components/hud/SpriteIcon.tsx`).

- [ ] **Step 1: Les dokumentasjonen.** Les `node_modules/next/dist/docs/` om sider i App Router, og `src/app/figur/page.tsx`. Siden skal gi `notFound()` i produksjon, akkurat som `/figur`.
- [ ] **Step 2: Lag `CaveLab`**, en klientkomponent:
  - Kontroller: dybde (1–12), seed (tall) og «Ny seed» (tilfeldig), pluss «Neste etasje», som kaller `generateFloor(depth + 1, seed + 1, floor.room)`.
  - Etasjen tegnes på et `<canvas>` i skala 3 fra arket i `floor.sheet`.
  - Oppå tegnes `S`, trappa (`dungeon` 55), monstrene med `ENEMIES[id].sprite`, steinene (`dungeon` 24) og kista (`dungeon` 89).
  - Under står `room`, «speilet», «låst» og antall monstre.
- [ ] **Step 3: Åpne `http://localhost:3000/grotte`** (brukerens dev-server kjører allerede på port 3000). Forventet:
  - en etasje med is-blått gulv og grå murer, ulik for ulike seeds;
  - dybde 10 er mørkere;
  - dybde 5 og 10 viser sjefen og kista.

  Ta et skjermbilde på 1280 × 720.
- [ ] **Step 4: Kjør `npx tsc --noEmit`, `npx eslint src/components/cave src/app/grotte` og `npm test`.** Forventet: grønt, og ingen nye eslint-feil.
- [ ] **Step 5: Commit** med meldingen «Verksted for grotta i dev».

---

## Ferdig når

- `npm test`, `npx tsc --noEmit` og `npm run format` er grønne.
- Med `FEATURES.rpg` av er spillet uendret for deltakerne (Review Focus 3).
- Med `FEATURES.rpg` på viser platen nivå og XP-stripe, og Ting-fanen viser «Isskår × 2» etter dev-knappen.
- `/grotte` i dev viser etasjer for alle dybder, med trapp, monstre, steiner og hvileplasser.

## Åpent etter denne planen

- **«Hvem er med»** viser fortsatt nivå fra luker (`forgeLevelFromMilestones`, tak 4), også når `FEATURES.rpg` er på. Det er i tråd med beslutningen om at ingenting fra utforskingen vises der ennå (`plan-grotta.md`, del 11). Når `rpg` skal på for alle, må vi bestemme om platen og «Hvem er med» kan vise ulikt nivå.
- **G1** (scene, inngang og trapp), **G2** (kamp) og **G3–G4** får egne planer når denne er ferdig.

## Til G1-planen (fra gjennomgangen 2026-11-25)

Dette ble funnet i gjennomgangen. Ingenting av det synes for deltakerne så lenge `FEATURES.rpg` er av og grotta ikke kan nås. Det skal med i G1-planen.

- **Steiner og gulvpynt:** `dungeon` 24 er en hel gulvrute, så steinene blir brune firkanter på isgulvet. Pynten `floorRocks` bruker samme rute, og pynten `floorPebbles` blir lyseblå prikker som ser ut som noe man kan plukke opp. Bruk en gjennomsiktig prop for steiner, dropp `floorRocks` som pynt eller senk tettheten (nå 0,1 + 0,1), og demp blåfargen i småsteinene.
- **Arkene lastes for alle:** `cave` og `caveDeep` lastes i `WinterQuestScene.preload` og i `villageCanvas.ts`, selv om bygda ikke bruker dem. La grotte-scenen laste sine egne ark, og la løkkene i bygda hoppe over dem.
- **«Fra grotta» i Ting-fanen** ligger inne i `<nav className="cs-cats">`. Det blir en ekstra fane på smal skjerm, og «Materialer» teller ikke grottematerialene. Flytt den før materialer kan tjenes (G3).
- **Nivå opp fra sideoppdrag** gir ingen feiring med rpg på. Ordnes før flagget slås på.
- **Smia ved nivå 10:** glød og gnister i `WinterQuestScene.ts` er laget for nivå 1–4. Begrens til 4 eller juster før flagget slås på.
- **Tester som mangler:**
  - nye monstertyper først fra dybde 3, 5, 6 og 8;
  - full etasje aldri på 5 og 10, over mange seeds;
  - `xp` og `inventory` overlever en `updateProgress`;
  - `depth >= 1` sikres hos den som kaller.
- **Romdesign** etter testspilling i G2: gang-rommet er trangt (gangene er én rute brede), og trappa i søyle-rommet står nær starten.
- **XP-tallene:** `plan-utforsking.md` sier at den som bare gjør lukene, ender rundt nivå 7. Med lukene vi har (11 tekniske, 9 ikke-tekniske) gir de 900–1 050 XP, altså nivå 4–5. Se på tallene før rpg-flagget slås på for deltakerne.
