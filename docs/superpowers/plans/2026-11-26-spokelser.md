# Spøkelser i bygda og «Om meg» Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Other players' figures wander the village as ghosts, chat in pairs, and say lines with the words each player wrote in a new «Om meg» tab, highlighted in colour.

**Architecture:** Pure, node-tested modules hold the rules: `about.ts` (Om meg data and the Ferdig requirement), `ghostLines.ts` (lines and picking one), `ghosts.ts` (wandering and meetups). The community server stores `about` on `communityPlayer` next to name and figure. `GameClient` reads players from the existing startup GET and hands them to the Phaser scene through `bridge.world.ghosts`; the scene draws and moves them and reports a `ghost:<playerId>` zone; a new `GhostDialogue` shows one line at a time.

**Tech Stack:** Next 16, React 19, Phaser 4, TypeScript, `node --test` with `sucrase/register` (`.test.cjs` files), Sanity (community project via `/api/community`).

**Spec:** `docs/superpowers/specs/2026-11-26-spokelser-design.md`

## Global Constraints

- All player-facing text is Norwegian, natural spoken Norwegian, no rule-like phrasing; no han/hun about players (use the name).
- Dialogue lines live in code (`src/game/ghostLines.ts`); only players' Om meg words go to Sanity. Players never pull after cloning.
- No new art: figures via `figureTexture`, bubble from text and existing Kenney sprites.
- Limits: food/activity/topic 40 chars, saying 80 chars, topics 3–8, line template max 140 chars.
- Allowed Om meg characters: letters, numbers, space and `.,!?'"«»-:()`.
- Highlight colour for the inserted word: `#fdbe53`, bold. Text is rendered as text, never HTML.
- Ghost E-zone is last in priority (after luke places, side spots, cave and the wraith); no `GHOST_SPOTS` in the glade (`GLADE`) or within 40 px of doors, quest sites or NPCs.
- Up to 8 ghosts, chosen at random per load, never yourself, village only (not the cave).
- Om meg is required only while «Vis for andre» (`shareProfile`) is on.
- Format with `npm run format` before every commit (Prettier defaults). Docs are in `.prettierignore`.
- Work on branch `spokelser` in the main checkout (not a worktree).

## Review Focus

- A player with sharing on but an old save without `about` must be sent to Om meg once, without ×, and not be able to close the sheet with Esc either. Test in Task 7 (browser step).
- Community data with odd `about` (numbers, 50 topics, HTML-ish text like `<b>x</b>`) must not break the dialogue: `normalizeAbout` returns null or cleaned text; the word shows as literal text. Tests in Tasks 1 and 3.
- Turning sharing off in the sheet must make Ferdig clickable immediately even with an empty Om meg. Test in Task 1 (`aboutProgress(…, false)`).
- Only one ghost (or none) in the village: `gossip` must never be picked, meetups must never start. Tests in Tasks 3 and 4.
- Talking to a ghost while it walks: it must stop and face the player, and resume its route afterwards, without teleporting. Test in Task 4.

---

## File map

- Create `src/game/about.ts` (+ `about.test.cjs`): `About`, cleaning, normalising, Ferdig requirement.
- Modify `src/game/quests/types.ts`, `src/game/quests/progress.ts` (+ test): `Progress.about`.
- Modify `src/game/community.ts` (+ test), `src/app/api/community/route.ts`: store and return `about`.
- Create `src/game/ghostLines.ts` (+ `ghostLines.test.cjs`): lines, rules, picking.
- Modify `src/game/village.ts` (+ `village.test.cjs`): `GHOST_SPOTS`.
- Create `src/game/ghosts.ts` (+ `ghosts.test.cjs`): ghost simulation and dev ghosts.
- Modify `src/game/bridge.ts`, `src/game/WinterQuestScene.ts`: draw and move ghosts, zone.
- Create `src/components/hud/GhostDialogue.tsx`; modify `src/components/GameClient.tsx`, `src/app/globals.css`.
- Modify `src/components/figure/CharacterSheet.tsx`: «Om meg» tab and gated Ferdig.

---

### Task 1: Om meg data and the Ferdig requirement

**Files:**

- Create: `src/game/about.ts`
- Test: `src/game/about.test.cjs`

**Interfaces:**

- Produces:
  - `type About = { food: string; activity: string; topics: string[]; saying?: string }`
  - `const ABOUT_LIMITS = { text: 40, saying: 80, minTopics: 3, maxTopics: 8 }`
  - `cleanAboutText(value: string, max: number): string` — drops disallowed characters and cuts to `max`; does not trim (used while typing).
  - `normalizeAbout(input: unknown): About | null` — null when not a plain object, or when `food`/`activity`/`saying` are present but not strings, or `topics` is present but not an array of strings, or `topics` has more than 20 entries. Otherwise: clean + trim every field, strip one leading `å ` (case-insensitive) from `activity`, drop empty topics, dedupe topics case-insensitively (keep first), cap at 8, omit empty `saying`. Missing fields become `""` / `[]`.
  - `type AboutField = "food" | "activity" | "topics"`
  - `aboutProgress(about: About | null | undefined, sharing: boolean): { done: number; total: 3; complete: boolean; firstMissing: AboutField | null; message: string | null }` — `done` counts food filled, activity filled, topics ≥ 3. When `sharing` is false: `complete: true`, `firstMissing: null`, `message: null` (done/total still counted).

- [ ] **Step 1: Write the failing tests** in `src/game/about.test.cjs` (same header as `walk.test.cjs`):

```js
test("normalizeAbout cleans, trims, strips «å» and dedupes topics", () => {
  const about = normalizeAbout({
    food: "  pepperkaker<script> ",
    activity: "Å gå på ski",
    topics: ["GROQ", "groq", "", "hunden min", "a", "b", "c", "d", "e", "f"],
    saying: "   ",
  });
  assert.deepEqual(about, {
    food: "pepperkakerscript",
    activity: "gå på ski",
    topics: ["GROQ", "hunden min", "a", "b", "c", "d", "e", "f"],
  });
});

test("normalizeAbout rejects wrong types and oversized lists", () => {
  assert.equal(normalizeAbout(null), null);
  assert.equal(normalizeAbout([]), null);
  assert.equal(normalizeAbout({ food: 3 }), null);
  assert.equal(normalizeAbout({ topics: "GROQ" }), null);
  assert.equal(normalizeAbout({ topics: Array(21).fill("x") }), null);
  assert.deepEqual(normalizeAbout({}), { food: "", activity: "", topics: [] });
});

test("normalizeAbout cuts to the limits", () => {
  const about = normalizeAbout({
    food: "x".repeat(60),
    activity: "y",
    topics: ["z".repeat(60)],
    saying: "s".repeat(120),
  });
  assert.equal(about.food.length, 40);
  assert.equal(about.topics[0].length, 40);
  assert.equal(about.saying.length, 80);
});

test("aboutProgress counts the three requirements and names the first gap", () => {
  const empty = aboutProgress(undefined, true);
  assert.deepEqual(
    { done: empty.done, complete: empty.complete, first: empty.firstMissing },
    { done: 0, complete: false, first: "food" },
  );
  const twoTopics = aboutProgress(
    { food: "taco", activity: "ski", topics: ["a", "b"] },
    true,
  );
  assert.equal(twoTopics.done, 2);
  assert.equal(twoTopics.firstMissing, "topics");
  assert.equal(
    twoTopics.message,
    "Skriv minst én ting til, så får andre i bygda høre om den.",
  );
  assert.equal(
    aboutProgress({ food: "taco", activity: "ski", topics: ["a", "b", "c"] }, true)
      .complete,
    true,
  );
});

test("aboutProgress lets a player who doesn't share finish with nothing", () => {
  const p = aboutProgress(undefined, false);
  assert.equal(p.complete, true);
  assert.equal(p.message, null);
});
```

- [ ] **Step 2: Run** `node --test src/game/about.test.cjs` — expected FAIL (`Cannot find module './about.ts'`).
- [ ] **Step 3: Implement `src/game/about.ts`.** Messages, exact copy:
  - food missing: `Skriv inn favorittmaten din, så får andre i bygda høre om den.`
  - activity missing: `Skriv inn noe du liker å gjøre, så får andre i bygda høre om det.`
  - topics, 1 missing: `Skriv minst én ting til, så får andre i bygda høre om den.`
  - topics, n > 1 missing: `Skriv ${n} ting til som du prater om.`
  The allowed-character filter is the regex `/[^\p{L}\p{N} .,!?'"«»\-:()]/gu`.
- [ ] **Step 4: Run** `node --test src/game/about.test.cjs` — expected PASS.
- [ ] **Step 5: Commit** (`npm run format` first): `git add src/game/about.ts src/game/about.test.cjs && git commit -m "Om meg: data og krav for Ferdig"`

---

### Task 2: Store and share Om meg

**Files:**

- Modify: `src/game/quests/types.ts` (Progress, next to `name?`), `src/game/quests/progress.ts` (load, near `shareProfile`)
- Modify: `src/game/community.ts` (`CommunityPlayer`, `playersFromMilestones`, `characterFor`)
- Modify: `src/app/api/community/route.ts` (GET projection, POST patch)
- Test: `src/game/quests/progress.test.cjs`, `src/game/community.test.cjs`

**Interfaces:**

- Consumes: `About`, `normalizeAbout` (Task 1).
- Produces:
  - `Progress.about?: About` — loaded through `normalizeAbout`; left out when it returns null.
  - `CommunityPlayer.about: About | null`
  - `playersFromMilestones` profiles accept `about?: About | null` and pass it through (null when missing).
  - `characterFor` returns `about` when `character.about` is present and valid; returns null (reject) when present but `normalizeAbout` gives null.

- [ ] **Step 1: Write failing tests.** In `community.test.cjs`:

```js
test("player snapshot stores a cleaned Om meg and rejects a broken one", () => {
  const base = { playerId: "abc123", character: { visible: true, weapon: null } };
  const ok = characterFor({
    ...base,
    character: { ...base.character, about: { food: " taco ", activity: "å bake", topics: ["GROQ"] } },
  });
  assert.deepEqual(ok.about, { food: "taco", activity: "bake", topics: ["GROQ"] });
  assert.equal(
    characterFor({ ...base, character: { ...base.character, about: { topics: 5 } } }),
    null,
  );
  assert.equal("about" in characterFor(base), false);
});

test("players carry their Om meg, or null", () => {
  const about = { food: "taco", activity: "ski", topics: ["a", "b", "c"] };
  const [withAbout, without] = playersFromMilestones(
    [],
    [
      { playerId: "aaa111", weapon: null, about },
      { playerId: "bbb222", weapon: null },
    ],
  );
  assert.deepEqual(withAbout.about, about);
  assert.equal(without.about, null);
});
```

  In `progress.test.cjs`, following the file's existing load test pattern: a saved record with `about: { food: "taco", activity: "å gå", topics: ["x"] }` loads as `{ food: "taco", activity: "gå", topics: ["x"] }`, and `about: "tull"` loads with no `about` key.
- [ ] **Step 2: Run** `node --test src/game/community.test.cjs src/game/quests/progress.test.cjs` — expected FAIL on the new tests.
- [ ] **Step 3: Implement.** In `route.ts`: add `about` to the GET profile projection (`{playerId, weapon, figure, name, about}`) and to the POST `patch.set` (`...(character.about ? { about: character.about } : {})`). `playersFromMilestones` sorts as before; `about` does not affect order.
- [ ] **Step 4: Run** the same command — expected PASS; then `npm test` — expected all PASS.
- [ ] **Step 5: Commit:** `git commit -am "Om meg lagres lokalt og deles med fellesskapet"` (add new files if any).

---

### Task 3: Ghost lines

**Files:**

- Create: `src/game/ghostLines.ts`
- Test: `src/game/ghostLines.test.cjs`

**Interfaces:**

- Consumes: `About` (Task 1).
- Produces:
  - `type LineKind = "food" | "activity" | "topic" | "saying" | "gossip" | "plain"`
  - `const GHOST_LINES: Record<LineKind, string[]>` — templates with `{ord}` / `{navn}`.
  - `lineProblems(kind: LineKind, template: string): string[]` — empty when valid. Rules: `plain` has no `{…}`; others exactly one `{ord}`; `gossip` also exactly one `{navn}`; no other `{…}`; max 140 chars; no whole-word `han`/`hun`/`ham`/`henne`/`hans`/`hennes` (case-insensitive).
  - `type Talker = { playerId: string; name: string; about: About | null }`
  - `type LinePart = { text: string; word?: true }`
  - `type PickedLine = { template: string; parts: LinePart[] }`
  - `pickLine(speaker: Talker, others: Talker[], lastTemplate: string | null, random?: () => number): PickedLine` — picks a kind at random among kinds the speaker has data for (`food` if food, `activity` if activity, `topic` if topics, `saying` if saying, `gossip` if any other talker has topics, `plain` always), then a template of that kind other than `lastTemplate` (when the kind has more than one). `parts`: the template split around placeholders; the `{ord}` value is a part with `word: true`; `{navn}` is plain text. For `saying`, `{ord}` is the whole saying.

- [ ] **Step 1: Write failing tests:**

```js
test("every line follows the rules", () => {
  for (const [kind, lines] of Object.entries(GHOST_LINES)) {
    assert.ok(lines.length >= 6, `${kind} has at least 6 lines`);
    for (const line of lines) assert.deepEqual(lineProblems(kind, line), [], line);
  }
});

test("lineProblems catches missing slots, extra slots and pronouns", () => {
  assert.ok(lineProblems("food", "Jeg liker mat.").length);
  assert.ok(lineProblems("plain", "Hei {ord}").length);
  assert.ok(lineProblems("gossip", "Hun liker {ord}.").length);
  assert.ok(lineProblems("topic", "{ord} og {ting}").length);
  assert.ok(lineProblems("plain", "x".repeat(141)).length);
});

const ola = { playerId: "ola111", name: "Ola", about: null };
const kari = {
  playerId: "kari22",
  name: "Kari",
  about: { food: "taco", activity: "strikke", topics: ["<b>GROQ</b>"], saying: "Skru den av og på!" },
};

test("a ghost without Om meg and no one to gossip about only says plain lines", () => {
  for (let i = 0; i < 50; i++) {
    const line = pickLine(ola, [], null, Math.random);
    assert.ok(GHOST_LINES.plain.includes(line.template));
  }
});

test("gossip names the other ghost and marks their word as text", () => {
  let line;
  for (let i = 0; i < 200 && !line; i++) {
    const l = pickLine(ola, [kari], null, Math.random);
    if (GHOST_LINES.gossip.includes(l.template)) line = l;
  }
  assert.ok(line);
  assert.ok(line.parts.some((p) => !p.word && p.text.includes("Kari")));
  assert.deepEqual(line.parts.filter((p) => p.word), [{ text: "<b>GROQ</b>", word: true }]);
});

test("the same line never comes twice in a row", () => {
  let last = null;
  for (let i = 0; i < 100; i++) {
    const line = pickLine(kari, [], last, Math.random);
    assert.notEqual(line.template, last);
    last = line.template;
  }
});
```

- [ ] **Step 2: Run** `node --test src/game/ghostLines.test.cjs` — expected FAIL.
- [ ] **Step 3: Write `src/game/ghostLines.ts`** with 6–10 lines per kind in natural spoken Norwegian, in the tone of the spec's examples (`Jeg kunne spist {ord} hver eneste dag.`, `Har du hørt om {ord}? Nei? Sett deg ned.`, `{navn} begynte å snakke om {ord} igjen. Ikke spør.`, `Kaldt i dag, hva?`). `activity` lines must read well with a bare verb phrase (`gå på ski`, `strikke`), e.g. `Skulle ønske jeg kunne {ord} nå i stedet for å stå her.`
- [ ] **Step 4: Run** the test — expected PASS.
- [ ] **Step 5: STOP — get the lines approved.** Show the user the full `GHOST_LINES` list (as plain text, grouped by kind) and wait for their approval or edits before committing. They cannot be changed after colleagues clone.
- [ ] **Step 6: Commit:** `git add src/game/ghostLines.ts src/game/ghostLines.test.cjs && git commit -m "Replikker for spøkelsene"`

---

### Task 4: Ghost spots and the wandering simulation

**Files:**

- Modify: `src/game/village.ts` (add `GHOST_SPOTS` after `NPCS`)
- Create: `src/game/ghosts.ts`
- Test: `src/game/village.test.cjs`, `src/game/ghosts.test.cjs`

**Interfaces:**

- Consumes: `pathRoute`, `isPath`, `GLADE`, `QUEST_SITES`, `DOOR_ANCHORS`, `NPCS` from `village.ts`; `FigureChoice`, `normalizeFigure` from `figure.ts`; `About` (Task 1).
- Produces:
  - `const GHOST_SPOTS: { x: number; y: number }[]` (px, tile centres on paths), at least 10 spread over the village.
  - `type GhostInput = { playerId: string; name: string; figure: FigureChoice; about: About | null }`
  - `type Ghost = GhostInput & { x: number; y: number; facing: -1 | 1; walking: boolean; bubble: boolean; route: { x: number; y: number }[]; waitMs: number; partner: string | null }`
  - `const GHOST_SPEED = 38` (px/s; the knight walks at 64), `const MAX_GHOSTS = 8`
  - `chooseGhosts(players: { playerId: string; name: string | null; figure: FigureChoice | null; about?: About | null }[], ownId: string, random?: () => number): GhostInput[]` — only players with a figure and a name, never `ownId`, shuffled, at most `MAX_GHOSTS`.
  - `spawnGhosts(inputs: GhostInput[], random?: () => number): Ghost[]` — each on a distinct random `GHOST_SPOTS` entry (wrap if more ghosts than spots), waiting 0–3000 ms.
  - `stepGhosts(ghosts: Ghost[], dtMs: number, opts: { random?: () => number; holdId: string | null; face?: { x: number; y: number } }): void` — mutates. Rules:
    - `holdId` ghost: does not move, `walking=false`, faces `opts.face` if given; keeps its route and resumes from where it stands when released.
    - Waiting: count down `waitMs`; at 0 pick the next target. With probability 0.25, and when another ghost is waiting with no partner, both get `partner` set to each other and routes to the two sides (±16 px in x) of one random spot; otherwise route via `pathRoute` to a random other spot.
    - Walking: move toward `route[0]` at `GHOST_SPEED`; set `facing` from dx; drop a point when reached; when the route is empty, wait 3000–9000 ms (or, with a partner who has also arrived, face each other, `bubble=true` for 5000–8000 ms, then clear `partner`/`bubble` on both).
  - `const DEV_GHOSTS: GhostInput[]` — 4 made-up players with varied figures (built with `normalizeFigure`) and full Om meg, for `?dev`.

- [ ] **Step 1: Write failing tests.** In `village.test.cjs`:

```js
test("ghost spots are on paths, out of the glade and away from doors, sites and people", () => {
  const far = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) >= 40;
  assert.ok(GHOST_SPOTS.length >= 10);
  for (const s of GHOST_SPOTS) {
    assert.ok(isPath(Math.floor(s.x / 16), Math.floor(s.y / 16)), JSON.stringify(s));
    const tx = Math.floor(s.x / 16), ty = Math.floor(s.y / 16);
    assert.ok(!(tx >= GLADE.x && tx < GLADE.x + GLADE.w && ty >= GLADE.y && ty < GLADE.y + GLADE.h));
    for (const p of [...Object.values(QUEST_SITES), ...Object.values(DOOR_ANCHORS), ...Object.values(NPCS)])
      assert.ok(far(s, p), `${JSON.stringify(s)} too close to ${JSON.stringify(p)}`);
  }
});
```

  In `ghosts.test.cjs` (seeded random: a small LCG helper in the test file):
  - `chooseGhosts` drops `ownId`, players without figure or name, and returns at most 8 of 12.
  - A single ghost stepped for 120 s in 100 ms steps never gets a `partner` and only ever stands on path tiles (`isPath` of its tile) when not walking.
  - Two ghosts with `random` forced below 0.25 end up with `partner` set to each other, both `bubble: true`, facing each other (`a.facing === Math.sign(b.x - a.x)`), and later both cleared.
  - Held ghost: step a walking ghost, then step with `holdId` its id for 5 s: position unchanged and `walking === false`, `facing` points at `face`; release: it moves again and its next position is within `GHOST_SPEED * dt` of the held one (no teleport).
  - Wait times: after arriving alone, `waitMs` is in [3000, 9000].
- [ ] **Step 2: Run** `node --test src/game/village.test.cjs src/game/ghosts.test.cjs` — expected FAIL.
- [ ] **Step 3: Implement** `GHOST_SPOTS` (pick path tiles near the square, bakery, forge path, west house and the main roads, checked against the test) and `src/game/ghosts.ts`.
- [ ] **Step 4: Run** the same command — expected PASS.
- [ ] **Step 5: Commit:** `git add src/game/village.ts src/game/ghosts.ts src/game/*.test.cjs && git commit -m "Spøkelser: plasser og rusling"`

---

### Task 5: Ghosts in the scene

**Files:**

- Modify: `src/game/bridge.ts` (`Zone`, `WorldState`)
- Modify: `src/game/WinterQuestScene.ts` (ghost sprites in create/applyWorld/update, `updateZone`)

**Interfaces:**

- Consumes: `GhostInput`, `spawnGhosts`, `stepGhosts` (Task 4); `figureTexture`.
- Produces:
  - `Zone` gains `` `ghost:${string}` `` (playerId).
  - `WorldState.ghosts: GhostInput[]` and `WorldState.talkingGhost: string | null` (playerId of the ghost in conversation). The scene uses `bridge.knight` as `face`.

- [ ] **Step 1: Add the bridge fields** with defaults `ghosts: []`, `talkingGhost: null` wherever the initial `WorldState` is built.
- [ ] **Step 2: Scene.** When `world.ghosts` changes (compare playerIds), destroy old ghost objects and `spawnGhosts` new ones. Each ghost: shadow image (as NPCs), figure image (`figureTexture`), name text above the head (same `this.text` helper, visible only when the knight is within 48 px), and a «…» text bubble shown when `bubble`. In `update`, while `area === "bygda"`, call `stepGhosts(ghosts, dt, { holdId: world.talkingGhost, face: bridge.knight })` regardless of `frozen`, then sync positions, `flipX` from `facing`, depth from y, and a 1 px walking bob like the knight.
- [ ] **Step 3: Zone.** In `updateZone`, after the wraith branch, `else` the nearest ghost within `FORGE_RANGE` gives `` `ghost:${id}` ``. While `talkingGhost` is set, keep that ghost's zone even if another ghost walks closer.
- [ ] **Step 4: Check** `npx tsc --noEmit` — expected no errors; `npm test` — expected PASS. In `GameClient`, `placeZone` must exclude `ghost:` zones the same way it excludes `side:` (one condition) so `npcAtSite` never sees them.
- [ ] **Step 5: Commit:** `git commit -am "Spøkelser i bygda"`

---

### Task 6: Talking to a ghost, and players from the community

**Files:**

- Create: `src/components/hud/GhostDialogue.tsx`
- Modify: `src/components/GameClient.tsx` (startup GET at line ~357, world sync at ~1322, E handler at ~1450, prompts at ~1700)
- Modify: `src/app/globals.css` (`.ghost-word`)

**Interfaces:**

- Consumes: `chooseGhosts`, `DEV_GHOSTS`, `GhostInput` (Task 4); `pickLine`, `PickedLine`, `Talker` (Task 3); `CommunityPlayer.about` (Task 2); `normalizeAbout` (Task 1); `WorldState.ghosts`, `talkingGhost`, `ghost:` zone (Task 5).
- Produces: `GhostDialogue` props `{ speaker: GhostInput; others: GhostInput[]; onClose: () => void }`; it owns its current `PickedLine` and picks a new one (passing the previous template) on its «Si noe mer» button and on E.

- [ ] **Step 1: Read players at startup.** The existing startup GET keeps setting `communityReady`; also store `data.players` (each `about` run through `normalizeAbout`) in state. Build ghosts once per load with `chooseGhosts(players, PLAYER_ID)`; in `?dev` use `DEV_GHOSTS` instead. Keep the result in a ref/memo so the selection doesn't reshuffle on every render.
- [ ] **Step 2: World sync.** Add `ghosts` and `talkingGhost` to the `bridge.setWorld` call; add `ghostTalk !== null` to `frozen`.
- [ ] **Step 3: Talk.** `ghostHere` = ghost whose id matches a `ghost:` zone. Prompt button (same `prompt` class as the others, hidden while `logOpen`): `<kbd>E</kbd> Snakk med {name}`. E opens (`setGhostTalk(id)`) when no other E target applies (it is checked after `talkTo`, `siteQuest`, `spotHere`, the sign, the case board and the cave). Esc and walking out of the zone close it. While open, E asks the dialogue for a new line.
- [ ] **Step 4: `GhostDialogue`.** Reuse the `dialogue frame frame--wood` markup from `ForgeDialogue` (portrait = the ghost's figure via `FigureCanvas`, `dialogue-name` = the name, `dialogue-speech` = the parts). Word parts render as `<strong className="ghost-word">{text}</strong>`; all parts as text children. Actions: «Si noe mer» and «Ha det». CSS: `.ghost-word { color: #fdbe53; font-weight: 700; }`.
- [ ] **Step 5: Check in the browser.** Dev server is the user's on port 3000 (`npm run dev`; do not start another). Open `http://localhost:3000/?dev` in the browser pane: four ghosts wander, two sometimes stand with «…», walking up to one shows «E Snakk med …», E shows a line with the word in gold, «Si noe mer» changes it, the other ghosts keep walking, and at the forge/bakery/west house the luke prompt still wins E. Check 1280×720 and 375 px. No console errors.
- [ ] **Step 6: Commit:** `npm run format`, then `git add -A src && git commit -m "Snakk med spøkelsene"`

---

### Task 7: «Om meg» in the character sheet

**Files:**

- Modify: `src/components/figure/CharacterSheet.tsx` (`Mode`, tabs at ~438, side panel at ~680, `done` at ~289)
- Modify: `src/components/GameClient.tsx` (`CharacterSheet` props at ~1962, `onDone` handler at ~425, forced open)
- Modify: `src/app/globals.css` (tab and chip styles, following existing `cs-` classes)

**Interfaces:**

- Consumes: `About`, `ABOUT_LIMITS`, `cleanAboutText`, `normalizeAbout`, `aboutProgress`, `AboutField` (Task 1); `Progress.about` (Task 2).
- Produces:
  - `Mode = "bag" | "look" | "about"`; new prop `initialAbout: About | null`; `onDone(choice, name, shareProfile, shareHints, about: About)`.
  - `GameClient` saves `about` to progress in `onDone`; the community POST's `character` includes `about: progress.about` when present.

- [ ] **Step 1: Tab.** Add «Om meg» to the tab list, also on the first visit (first visit shows «Utseende» and «Om meg»). While `aboutProgress(about, shareProfile).complete` is false, the tab label shows the count: `Om meg ${done}/3`.
- [ ] **Step 2: Fields.** Four labelled inputs in spec order: «Favorittmat», «Liker å gjøre», «Ting jeg prater om» (input + chips: Enter adds the cleaned, trimmed text unless empty or a case-insensitive duplicate or 8 already; each chip has a × button with `aria-label="Fjern {ting}"`), «Det sier jeg ofte» (optional, marked «valgfritt»). `cleanAboutText` on every change with the right limit.
- [ ] **Step 3: Ferdig.** Both the existing Ferdig (Utseende side panel) and a new Ferdig at the bottom of Om meg use `aria-disabled` (not `disabled`, so the click still lands) while not complete. Next to them, the `message` from `aboutProgress`. A click while incomplete switches to `about` and focuses the input for `firstMissing`. When complete, `done()` passes `normalizeAbout(about)`.
- [ ] **Step 4: Share text.** Under «Vis for andre», change the small text to: «Navnet, figuren og det du skriver under Om meg vises for de andre deltakerne. Fremgangen din vises også.»
- [ ] **Step 5: Forced once.** In `GameClient`: when the game starts with `progress.shareProfile` on, a figure saved, and `aboutProgress(progress.about, true).complete` false, open the sheet on `about` with `firstTime`-style behaviour (no ×, Esc does nothing) until Ferdig.
- [ ] **Step 6: Check in the browser** (`?dev` on port 3000): new player flow (reset progress in the dev panel) with sharing on — Ferdig grey with message, clicking it jumps to the empty field, filling food, activity and 3 topics enables it; with sharing off, Ferdig works at once. Old save with sharing and no `about` (set via the dev panel or localStorage) opens Om meg without ×, and Esc doesn't close it. Reopen with C: values are kept and can be changed. Outside `?dev`, with the community server reachable, confirm in the network requests that the POST body includes `about` (your own figure is never a ghost, so it can't be checked in the village). Check 1280×720 and 375 px.
- [ ] **Step 7: Commit:** `npm run format`, then `git commit -am "Om meg i figurskaperen"`

---

### Task 8: Final verification

- [ ] **Step 1:** `npm test` — expected all PASS (note the count).
- [ ] **Step 2:** `npx tsc --noEmit` — expected no errors.
- [ ] **Step 3:** `npm run lint` — expected only the 3 known old errors (Studio page `<a>`, two set-state-in-effect in GameClient), nothing new.
- [ ] **Step 4:** `npm run format:check` — expected clean.
- [ ] **Step 5:** `npm run build` — expected success.
- [ ] **Step 6:** `npm run verify-release` — expected PASS.
- [ ] **Step 7:** Update `docs/fellesskap.md`: `about` is published with the profile, and the rate limit is 300/min (not 30).
