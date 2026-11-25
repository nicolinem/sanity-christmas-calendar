# Grotta: stemning og større etasjer – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grotta får stemning (lys og mørke, fakler, vegger med dybde, litt liv) og etasjer som er større enn skjermen, med et kamera som følger deg. Alt ligger bak `FEATURES.cave`.

**Architecture:**
- Ren data først. `cave/decor.ts` bestemmer hvordan hver rute ser ut: forside, tak, variant, fakkel eller pynt. `cave/layout.ts` setter flere rommaler sammen til én etasje med åpninger mellom rommene. Begge er rene funksjoner med tester, og `generateFloor` bruker dem.
- Scenen tegner gulv og vegger én gang per etasje i én `DynamicTexture` og lar kameraet følge figuren.
- Stemningen kommer fra lyset i Phaser 4: `this.lights`, `addLight` og `setLighting(true)`.

**Tech Stack:** Phaser 4.2.1, React 19 / Next 16, TypeScript, `node --test` med `sucrase`.

**Spec:** `docs/plan-grotta.md`, del 12 («Stemning og større etasjer»). Del 4–8 gjelder fortsatt der del 12 ikke sier noe annet.

## Global Constraints

- Med `FEATURES.cave` av er bygda nøyaktig som før.
- Bare Kenney-ark som allerede ligger i repoet: `cave`/`caveDeep` (Tiny Dungeon) og `ski`. Farge-tint i Phaser er lov. Ingen nedlasting og ingen nye npm-avhengigheter.
- Kampen fra G2 skal virke som før. Det gjelder `clock`, `held`, pause ved Studio og vindusfokus, å besvime, funn og drikker.
- `prefers-reduced-motion`: ingen snøfnugg og ingen flakkende fakler, men lyset står.
- Uten WebGL (Canvas-renderer) brukes ikke lys. Grotta tegnes da som i G2, og ingenting krasjer.
- Alle tall under er startverdier og står som navngitte konstanter.
- Kjør `npx prettier --write` på endrede filer. Commit aldri `.claude/launch.json` eller `docs/presentasjon/`.

## Review Focus

1. **Trappa og alle rom kan alltid nås fra start** i en sammensatt etasje, med alle steiner som vegg. Testes i task 2 med 1 000 seeds × dybde 1–12.
2. **Ingen åpning går inn i en stein eller en vegg-blindgate.** Ruta innenfor hver åpning er gulv i begge rom. Testes i task 2.
3. **Ytelse på 2 × 2 rom ved 1920 × 1080:** `game.loop.actualFps` er minst 50 i grotta med lys på. Sjekkes i nettleseren i task 4.
4. **Pause og kamp på stor etasje:** monstre utenfor skjermen sover til du kommer nær. Å stå stille (Studio, fokus) virker. Trykk for å gå går gjennom åpningene. Sjekkes i nettleseren i task 3.
5. **Canvas-reserve:** scenen sjekker `this.renderer.type === Phaser.WEBGL` før den bruker lys. Sjekkes i review av task 4.

---

## Filer

| Fil | Ansvar |
| --- | --- |
| `src/game/cave/decor.ts` (ny) | `decorate(rows, r)`: ruter, tak, fakler og pynt |
| `src/game/cave/layout.ts` (ny) | `floorLayout(depth)` og `stitchRooms(...)`: rom satt sammen med åpninger |
| `src/game/cave/rooms.ts` | Nye rammer i `CAVE_FRAMES` |
| `src/game/cave/generate.ts` | Bruker `layout.ts` og `decor.ts`. Nye felt i `Floor` |
| `src/game/cave/mood.ts` (ny) | Lys- og stemningskonstanter, uten Phaser |
| `src/game/cave/CaveScene.ts` | Bakt gulvtekstur, kamera som følger, lys, fakler, snø, monstre som snur seg |
| `src/components/cave/CaveLab.tsx` | Tegner etasjer i alle størrelser |

---

### Task 1: Pynt som data (`decor.ts`)

**Files:**
- Create: `src/game/cave/decor.ts`, `src/game/cave/decor.test.cjs`
- Modify: `src/game/cave/rooms.ts`, `src/game/cave/rooms.test.cjs`

**Interfaces:**
- `CAVE_FRAMES` gets `wallVariants: [28, 57, 58, 59]`, `wallFaces: [19, 20]` and `torch: 29`. Existing keys are unchanged; update the frames test in `rooms.test.cjs`.
- `type Decor = { sheet: "ski"; frame: 95; x: number; y: number }`: tile-centre px, an ice lump on the floor. It is drawn but never solid.
- `decorate(rows: string[], r: () => number): { tiles: number[][]; roof: boolean[][]; torches: Point[]; decor: Decor[] }`
  - **Wall face.** A `#` whose tile below exists and is not `#` is a front.
    - It gets `wall` (40), or with probability 0.12 one of `wallVariants`.
    - With probability 0.01 it gets one of `wallFaces`, at most one face per call.
    - `roof` is `false` for a front.
  - **Roof.** Every other `#` gets `wall` (40) and `roof = true`.
  - **Torches.** `torches` are 2–4 fronts (`2 + floor(r() × 3)`, fewer if there are fewer fronts), at least 4 tiles apart (Chebyshev distance). A torch tile's frame is `torch` (29), and `torches` holds its tile-centre px.
  - **Floor tiles.** Every non-`#` tile gets `floorPebbles` (12) with probability 0.02, otherwise `floor` (0). There is no `floorRocks` (24), as in G1.
  - **Ice lumps.** Each `.` tile becomes a `decor` ice lump with probability 0.01. `S`, `T`, `m`, `o` and `k` never do.
- `generateFloor` uses `decorate` for `tiles`. `Floor` gains `roof: boolean[][]`, `torches: Point[]` and `decor: Decor[]`.

- [ ] **Step 1: Write the failing tests** in `decor.test.cjs`, using small handmade rows and a seeded `rng` from `random.ts`:
  - **Faces and roofs:** for `["####", "#..#", "####"]`, the top row's x=1 and x=2 tiles are fronts. Every other `#` has `roof === true`.
  - **Torches:**
    - Over 200 seeds of one `ROOMS` template, every torch is on a front.
    - Torches are pairwise ≥ 4 tiles apart.
    - There are 2–4 when the room has enough fronts.
  - **Wall faces:** at most one tile from `wallFaces` per call.
  - **Floor tiles:**
    - No floor tile is 24.
    - Over 200 seeds the pebble share is 1–3.5 %, matching the existing test's band.
  - **Ice lumps:** no `decor` lands on an `S`, `T`, `m`, `o` or `k` tile.
  - **Seed:** the same seed gives the same result.
- [ ] **Step 2: Run** `node --test --require sucrase/register src/game/cave/decor.test.cjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `decorate` and wire it into `generateFloor`. The existing generate tests stay green; adjust only the decoration test if it reads `tiles` directly.
- [ ] **Step 4: Run** `npm test`. Expected: all pass.
- [ ] **Step 5: Commit** «Grotta: vegger med forside og tak, fakler og pynt som data».

### Task 2: Flere rom per etasje (`layout.ts`)

**Files:**
- Create: `src/game/cave/layout.ts`, `src/game/cave/layout.test.cjs`
- Modify: `src/game/cave/generate.ts`, `src/game/cave/generate.test.cjs`, `src/components/cave/CaveLab.tsx`

**Interfaces:**
- **`floorLayout(depth): { cols: number; rows: number }`.** Rest floors (`depth % 5 === 0`) are 1 × 1. Depth 1–2 is 2 × 1. Everything else is 2 × 2.
- **`stitchRooms(cells: string[][], r: () => number): string[] | null`.**
  - `cells[row][col]` holds a room's rows (24 × 14, already mirrored or not).
  - It returns the whole floor's rows (`cols × 24` wide, `rows × 14` tall) with an opening in every shared wall.
  - It returns `null` when some pair has no possible opening.
- **Opening between horizontal neighbours A (left) and B (right):**
  - The candidate rows are `y ∈ 2..11` where `A[y][22]` and `B[y][1]` are both not `#` and not `o`.
  - Prefer a pair `y, y+1` that are both candidates, and pick it with `r()`. Otherwise use a single `y`.
  - Carve `A[y][23]` and `B[y][0]` to `.`, and `y+1` too for a pair.
  - Vertical neighbours work the same way on columns `x ∈ 2..21`, using `A[12][x]` / `B[1][x]` and carving `A[13][x]` / `B[0][x]`.
- **`Floor` gains:**
  - `layout: { cols: number; rows: number }`;
  - `rooms: string[]`: template ids, row-major;
  - `room` stays the start room's id, and `mirrored` stays the start room's flag;
  - `previousRoom` only stops the start room from repeating.
- **Picking rooms:**
  - Each cell draws a template from `ROOMS`, and every room is mirrored half the time.
  - If `stitchRooms` returns `null`, draw the whole set again, up to 20 tries. After that, throw: the test below makes sure that never happens.
- **Start and stairs:**
  - Start is the `S` of room (0, 0). Every other room's `S` becomes `.`.
  - The stairs go in a random room other than the start room (`r()`), on one of that room's `T`. On a 1 × 1 floor they go in the only room.
- **Monsters:**
  - The start room has none on depth 1–2. It has at most 1 elsewhere.
  - Other rooms get `1 + floor((depth − 1) / 3) + (r() < 0.5 ? 0 : 1)` each, capped at 3 per room. A room never gets more than its `m` spots.
  - The floor total is capped at `MAX_SPAWNS_PER_FLOOR = 10`.
  - Kinds come from `enemiesAt(depth)`, as today.
- **Unchanged:** rocks (60 % of each room's `o`), `locked`, `rest` and `chest`, now computed over the whole stitched floor.
- **`CaveLab`** sizes its canvas from `floor.rows[0].length` and `floor.rows.length` instead of `ROOM_W` / `ROOM_H`.

- [ ] **Step 1: Write the failing tests:**
  - **`layout.test.cjs`:**
    - `floorLayout`: 1 and 2 give 2 × 1; 3, 4, 6, 9, 11 give 2 × 2; 5 and 10 give 1 × 1.
    - `stitchRooms` on two `hall` rooms side by side gives 48 × 14 rows, with an opening at `x = 23` and `x = 24` on the same `y`.
    - `stitchRooms` gives `null` when B's column 1 is all `#`.
  - **`generate.test.cjs`, updated:**
    - **Sizes:** `rows` is 48 × 14 on depth 1–2, 48 × 28 on depth 3, and 24 × 14 on depth 5.
    - **Reachability:** 1 000 seeds × depth 1–12, with `o` and `#` blocking. The stairs and every room's interior (at least one `.` per room) can be reached from start.
    - **Stairs placement:** they are never in the start room when the floor has more than one room.
    - **Start room:** no monster in the start room on depth 1–2.
    - **Monster count:** 2–3 on depth 1, never more than 10. This replaces the old «at most 6» test.
    - **Existing tests:** same seed gives the same floor; rest floors; locked; new kinds per depth; depth below 1. Adapt only what the sizes force.
- [ ] **Step 2: Run** the two test files. Expected: FAIL.
- [ ] **Step 3: Implement** `layout.ts` and the new `generateFloor`. `decorate` from task 1 runs on the stitched rows.
- [ ] **Step 4: Run** `npm test` and `npx tsc --noEmit`. Expected: green. Also open `/grotte` in dev: it shows a 2 × 2 floor without errors.
- [ ] **Step 5: Commit** «Grotta: etasjer av flere rom satt sammen».

### Task 3: Store etasjer i scenen

**Files:**
- Modify: `src/game/cave/CaveScene.ts`

**Interfaces:**
- **Consumes:** `Floor` from tasks 1–2 (`tiles`, `roof`, `torches`, `decor`, `layout`).
- **Baked floor texture.** Per floor, gulv and walls are baked into one `DynamicTexture` (key `cave-floor`, replaced on every `buildFloor`) and shown as one `Image` at (0, 0), depth −1.
  - Roof tiles are drawn with the tint `ROOF_TINT` from `mood.ts`. That file is created in this task with just that constant: `0x30344c`.
  - Read `node_modules/phaser/src/textures/DynamicTexture.js` for the 4.2.1 API (`stamp`/`draw`, and `render()`).
- **Torches.** Each torch is its own `Image` (the `torch` frame) over the baked texture, so task 4 can light it.
- **Decor.** Each `decor` item is an `Image` at depth `y`.
- **Camera.** If the floor (`rows[0].length × 16` by `rows.length × 16`) is larger than the camera's view at the current zoom:
  - `startFollow(knight, true, 0.15, 0.15)`;
  - bounds are the floor rect padded by `CAMERA_PAD_TILES × 16` on each side, with `CAMERA_PAD_TILES = 4`.
  - Otherwise, keep today's static centring. Re-check this on `RESIZE`.
- **Everything from G2 stays:**
  - tap-to-walk uses the mutable rows, now 48 wide;
  - monsters, rocks, the swing, drinks, fainting, `held` and `clock`.

- [ ] **Step 1: Build** the baked texture, torches and decor images, and the follow camera.
- [ ] **Step 2: Run** `npx tsc --noEmit`, `npx eslint src/game` and `npm test`.
- [ ] **Step 3: Check in the browser** (the controller does this) with `NEXT_PUBLIC_FEATURE_CAVE=1` and `?dev`, at 1280 × 720 and 375 px:
  - Walk through every room on a 2 × 2 floor, both by keys and by tapping through the openings.
  - Find the stairs and go down.
  - Monsters far away stand still until you come near.
  - Studio and window focus still pause the cave.
  - Floor 5 is still one static screen.
- [ ] **Step 4: Commit** «Grotta: kamera som følger deg, og gulvet tegnet én gang».

### Task 4: Lys og liv

**Files:**
- Modify: `src/game/cave/mood.ts`, `src/game/cave/CaveScene.ts`

**Interfaces:**
- **`mood.ts`** adds these constants:

  | Constant | Value |
  | --- | --- |
  | `AMBIENT` | `0x3c4260` (depth 1–9) |
  | `AMBIENT_DEEP` | `0x262a3e` (depth ≥ 10) |
  | `PLAYER_LIGHT` | `{ radius: 110, color: 0xcfdcff, intensity: 1.1 }` |
  | `TORCH_LIGHT` | `{ radius: 72, color: 0xffa45c, intensity: 1.5 }` |
  | `TORCH_FLICKER` | `{ amount: 0.1, hz: 5 }` |
  | `SNOW` | `{ perSecond: 3, fallSpeed: 10, alpha: 0.5 }` |

- **Lighting.** Only when `this.renderer.type === Phaser.WEBGL`:
  - `this.lights.enable().setAmbientColor(...)` per depth;
  - one light follows the knight;
  - one light per torch.
  - These get `setLighting(true)`: the floor image, decor, rocks, stairs, chest, monster sprites and shadows, and the knight's images.
  - The torch flames themselves stay unlit, so they glow.
  - Lights are removed in `buildFloor` and on shutdown.
  - Torch radius flickers by ±`amount` at `hz`, unless reduced motion is on.
- **Snow.** A particle emitter with the `"px"` texture, tinted white. It spawns across the top of the camera's `worldView` and falls slowly. It is off with reduced motion and paused while `held`.
- **Monsters face the knight.** Each monster sprite flips to face the knight.
  - Kenney's creatures face left in the sheet, so `setFlipX(knight.x > monster.x)`.
  - Check this per sprite in the browser and note any exceptions.

- [ ] **Step 1: Build** the lighting, torches, snow and facing.
- [ ] **Step 2: Run** `npx tsc --noEmit`, `npx eslint src/game` and `npm test`.
- [ ] **Step 3: Check in the browser** (controller) at 1280 × 720, 1440 × 900, 1920 × 1080 and 375 px:
  - dark around you, light around the figure;
  - torches glow warm and flicker;
  - deeper floors are darker;
  - snow falls;
  - monsters turn toward you;
  - `game.loop.actualFps ≥ 50` on a 2 × 2 floor at 1920 × 1080;
  - with reduced motion emulated, no snow and no flicker.
- [ ] **Step 4: Commit** «Grotta: lys, fakler og snø».

---

## Ferdig når

- `npm test`, `npx tsc --noEmit` and Prettier are green.
- With `FEATURES.cave` on:
  - floors are larger than the screen and you can explore them;
  - the stairs can always be reached;
  - the cave is dark with light around you and warm torches;
  - combat from G2 works as before.
- Checked on all four screen sizes, at ≥ 50 fps.
- With the flag off the village is unchanged.

## Ikke i denne planen

- **G3:**
  - full etasje on big floors (the proposal is to lock only the stairs room);
  - flaggermus;
  - Isvetten;
  - the chest.
- A minimap, sound, and new art.
