// The player's own figure: layered 16×16 parts in the Tiny Dungeon style.
// Ported from the prototype in design/figur/figur.py.
//
// Each part is a 16×16 map of role letters. A role gets its colour from the
// player's choices, so one drawing gives many variants. The dark outline is
// added last, around everything drawn, like the Kenney sheets. No image files:
// the same code draws the figure in the game, in Studio and on cards, and
// there are no licence questions.
//
// Pure data and pixels, no DOM or Phaser, so it runs anywhere (and in tests).

export const FIGURE_SIZE = 16;
export const OUTLINE = "#3f2631"; // Kenney's outline, as in the rest of the art

type Pair = readonly [main: string, shade: string];
// Gear that will be found out in the world (monsters, chests, secrets). The
// figure sheet shows it blurred, without a name, until the player has it.
export const HIDDEN_GEAR = "Gjemt et sted i verden";
// Source label of the floor-5 cave chest gear.
export const CAVE_CHEST_5_SOURCE = "Kista på etasje 5";
// Source labels of the gear forged from the cave recipes.
export const RECIPE_5_SOURCE = "Oppskrift fra etasje 5";
export const RECIPE_10_SOURCE = "Oppskrift fra etasje 10";

type Option<T> = { id: string; label: string; unlock?: string } & T;

// --- Colours: (main, shade) pairs from the same palette as the UI -------------

export const SKINS: Option<{ colors: Pair }>[] = [
  { id: "pale", label: "Blek", colors: ["#ead4aa", "#e4a672"] },
  { id: "light", label: "Lys", colors: ["#f7c282", "#e19a65"] },
  { id: "medium", label: "Middels", colors: ["#e4a672", "#b86f50"] },
  { id: "tan", label: "Gyllen", colors: ["#c28569", "#8a4836"] },
  { id: "brown", label: "Brun", colors: ["#bd6c4a", "#8a4836"] },
  { id: "dark", label: "Mørk", colors: ["#8a4836", "#5c2f2a"] },
  { id: "deep", label: "Dyp", colors: ["#733e39", "#4a2e2a"] },
];

// Natural shades first, some of them muted on purpose, then the fun ones.
export const HAIR_COLORS: Option<{ colors: Pair }>[] = [
  { id: "black", label: "Svart", colors: ["#3a4466", "#262b44"] },
  { id: "darkbrown", label: "Mørkebrun", colors: ["#6e4a3a", "#52362c"] },
  { id: "brown", label: "Brun", colors: ["#b86f50", "#763b36"] },
  { id: "ashbrown", label: "Askebrun", colors: ["#9c7a5c", "#6b5040"] },
  { id: "dirtyblond", label: "Mørkeblond", colors: ["#c4a46e", "#8c7350"] },
  { id: "blond", label: "Blond", colors: ["#fee761", "#feae34"] },
  { id: "copper", label: "Kobber", colors: ["#b5583a", "#7d3a2a"] },
  { id: "red", label: "Rød", colors: ["#f77622", "#be4a2f"] },
  { id: "grey", label: "Grå", colors: ["#8b9bb4", "#5a6988"] },
  { id: "white", label: "Hvit", colors: ["#ffffff", "#c0cbdc"] },
  { id: "pink", label: "Rosa", colors: ["#f6757a", "#b55088"] },
  { id: "green", label: "Grønn", colors: ["#63c74d", "#3e8948"] },
  { id: "blue", label: "Blå", colors: ["#0099db", "#124e89"] },
];

export const CLOTH_COLORS: Option<{ colors: Pair }>[] = [
  { id: "red", label: "Rød", colors: ["#e43b44", "#a22633"] },
  { id: "orange", label: "Oransje", colors: ["#f77622", "#be4a2f"] },
  { id: "yellow", label: "Gul", colors: ["#feae34", "#f77622"] },
  { id: "green", label: "Grønn", colors: ["#3e8948", "#265c42"] },
  { id: "darkgreen", label: "Mørkegrønn", colors: ["#265c42", "#193c3e"] },
  { id: "teal", label: "Turkis", colors: ["#2ce8f5", "#0099db"] },
  { id: "blue", label: "Blå", colors: ["#0099db", "#124e89"] },
  { id: "navy", label: "Marineblå", colors: ["#124e89", "#262b44"] },
  { id: "purple", label: "Lilla", colors: ["#b55088", "#68386c"] },
  { id: "pink", label: "Rosa", colors: ["#f6757a", "#e43b44"] },
  { id: "white", label: "Hvit", colors: ["#ffffff", "#c0cbdc"] },
  { id: "grey", label: "Grå", colors: ["#8b9bb4", "#5a6988"] },
  { id: "brown", label: "Brun", colors: ["#b86f50", "#733e39"] },
  { id: "black", label: "Svart", colors: ["#3a4466", "#262b44"] },
];

// The shade sits just above the boots (#262b44), so new trousers avoid it.
export const PANTS: Option<{ colors: Pair }>[] = [
  { id: "green", label: "Grønn", colors: ["#3e8948", "#265c42"] },
  { id: "blue", label: "Blå", colors: ["#124e89", "#193c3e"] },
  { id: "beige", label: "Beige", colors: ["#c28569", "#733e39"] },
  { id: "grey", label: "Grå", colors: ["#5a6988", "#3a4466"] },
  { id: "brown", label: "Brun", colors: ["#763b36", "#5c2f2a"] },
  { id: "dark", label: "Mørk", colors: ["#3a4466", "#262b44"] },
];

// Roles that never change colour: eyes, white trim, gold.
const FIXED: Record<string, string> = {
  E: "#262b44",
  W: "#ffffff",
  w: "#c0cbdc",
  Y: "#feae34",
  y: "#f77622",
  k: "#262b44",
  G: "#fee761",
  B: "#262b44",
  L: "#b86f50",
  l: "#763b36",
  I: "#c0cbdc",
  i: "#8b9bb4",
  O: "#ffffff",
  V: "#52607c", // dark steel
  R: "#eaa56c", // horn
  r: "#bd6c4a", // horn shade
  X: OUTLINE, // lines drawn inside a part, like a helmet's ridges
  F: "#2ce8f5", // ice
  f: "#0099db", // ice shade
};

// --- Parts --------------------------------------------------------------------

type Grid = string[];

// A part: a drawing, and optionally where it's earned. `behind` parts are
// drawn before the body (a cape), `front` hair over the clothes (braids).
export type Part = {
  id: string;
  label: string;
  grid: Grid;
  behind?: true;
  front?: true;
  unlock?: string;
};

const BLANK: Grid = Array.from({ length: 16 }, () => ".".repeat(16));

// Rows of up to 16 characters, starting at row `top`; the rest is empty.
function grid(top: number, ...rows: string[]): Grid {
  const out = [...BLANK];
  rows.forEach((r, i) => (out[top + i] = r.padEnd(16, ".").slice(0, 16)));
  return out;
}

// Head, hands, legs, measured from Tiny Dungeon's villagers (frames 85, 88):
// an 8×7 head with two-pixel eyes, 2×2 hands beside the shirt, a belt row,
// legs and boots. S/s skin, E eyes, P/p trousers, B boots.
const BODY = grid(
  3,
  ".....SSSSSS",
  "....SSSSSSSS",
  "....SSSSSSSS",
  "....SSSSSSSS",
  "....SSESSSES",
  "....sSEsssEs",
  ".....ssSSSs",
  "......ssss",
  "",
  "..SS........SS",
  "..SS.PPPPPP.SS",
  ".....pp..pp",
  ".....BB..BB",
);

// Hair: H main, h shade. Strands of shade run down the sides and fringe.
// Under a hat only the sides show, so styles differ most there.
export const HAIRSTYLES: Part[] = [
  {
    id: "short",
    label: "Kort",
    grid: grid(3, ".....hHHHHh", "....hHHHHHHh", "....HH.HhH.h", "....h"),
  },
  // Three small uneven tufts on top (two read as horns), sideburns on both sides.
  {
    id: "spiky",
    label: "Bustete",
    grid: grid(
      2,
      ".....H.H.H",
      ".....hHHHHh",
      "....hHHHHhHh",
      "....HhHH.HhH",
      "....h......h",
    ),
  },
  // A swept quiff, higher on one side, with a fringe across the forehead.
  {
    id: "quiff",
    label: "Sveis",
    grid: grid(
      1,
      ".....hHH",
      ".....HHHHH",
      "....hHHHHHHh",
      "....HHHHHhHh",
      "....HhHHH..h",
      "....h",
    ),
  },
  // Down to the chin, the same on both sides.
  {
    id: "medium",
    label: "Halvlangt",
    grid: grid(
      3,
      ".....hHHHHh",
      "....HHHHHHHH",
      "....HhHHHhHH",
      "...hHh....hHh",
      "...HH......HH",
      "...hh......hh",
    ),
  },
  // Like Tiny Dungeon's woman (frame 99): a fringe swept to one side, framing
  // the face down to the shoulders, thick on one side and thin on the other.
  {
    id: "long",
    label: "Langt",
    grid: grid(
      3,
      ".....hHHHHh",
      "....HHHHHHHH",
      "....HHHHHhHH",
      "...hHHHhH..Hh",
      "...HhH......h",
      "...Hh.......h",
      "...hH.......H",
      "...hHh.....hh",
    ),
  },
  // The knot sits right on the head, like Tiny Dungeon's frame 88, so no
  // outline cuts between them.
  {
    id: "bun",
    label: "Knute",
    grid: grid(
      1,
      "......hHHh",
      "......hHHh",
      ".....hHHHHh",
      "....hHHHHHHh",
      "....HH.HhH.h",
      "....h",
    ),
  },
  // Two braids in front of the shoulders, tied off at the ends.
  {
    id: "braids",
    label: "Fletter",
    grid: grid(
      3,
      ".....hHHHHh",
      "....HHHHHHHH",
      "....HHHHHhHH",
      "...hHHHhH..Hh",
      "...HH.......H",
      "...hH.......h",
      "...H........H",
      "...h........h",
      "...H........H",
      "...w........w",
    ),
    front: true,
  },
  { id: "bald", label: "Skallet", grid: BLANK },
];

// Facial hair, in the hair colour, drawn over the clothes.
export const FACIAL_HAIR: Part[] = [
  { id: "none", label: "Ingen", grid: BLANK },
  { id: "moustache", label: "Bart", grid: grid(9, "......HhhH") },
  {
    id: "beard",
    label: "Skjegg",
    grid: grid(8, "....H......H", "....HHHHHHHH", ".....hHHHHh"),
  },
  {
    id: "long",
    label: "Langt skjegg",
    grid: grid(
      8,
      "....H......H",
      "....HHHHHHHH",
      ".....HHHHHH",
      "......HHHH",
      ".......hh",
    ),
  },
  // Down to the belt, like the wizard's (frame 84).
  {
    id: "wizard",
    label: "Trollmannsskjegg",
    grid: grid(
      8,
      "....H......H",
      "....HHHHHHHH",
      "....HHHHHHHH",
      ".....HHHHHH",
      ".....HHHHHH",
      "......HHhH",
      ".......hH",
    ),
  },
];

// Tops: shoulders, sleeves, waist (rows 10–12), like the Kenney shirts.
// C/c main and shade; trim and details use fixed colours.
export const TOPS: Part[] = [
  {
    id: "sweater",
    label: "Genser",
    grid: grid(10, "....Cc....cC", "...CCCCCCCCCC", "....cCWCCWCc"),
  },
  {
    id: "santa",
    label: "Nissedrakt",
    grid: grid(
      10,
      "....Ww....wW",
      "...CCCCWWCCCC",
      "....ckkYYkkc",
      ".....CCCCCC",
    ),
  },
  {
    id: "coat",
    label: "Frakk",
    grid: grid(
      10,
      "....Ww....wW",
      "...CCCCCYCCCC",
      "....cCCCYCCc",
      ".....cCCYCc",
    ),
  },
  // A baker's or smith's apron over the shirt (Tiny Dungeon frame 86).
  {
    id: "apron",
    label: "Forkle",
    grid: grid(
      10,
      "....Cc....cC",
      "...CCWWWWWWCC",
      "....cWWWWWWc",
      ".....WWWWWW",
    ),
  },
  // A long robe to the feet, like the wizard (frame 84).
  // Below the waist both are only as wide as the legs, so they don't bulge.
  {
    id: "robe",
    label: "Kjortel",
    grid: grid(
      10,
      "....Cc....cC",
      "...CCCCCCCCCC",
      "....cCCYCCCc",
      ".....CCCCCc",
      ".....cCCCCc",
      ".....cCCCCc",
    ),
  },
  {
    id: "dress",
    label: "Kjole",
    grid: grid(
      10,
      "....Cc....cC",
      "...CCCCCCCCCC",
      "....cCCYYCCc",
      ".....CCCCCc",
      ".....cccccc",
    ),
  },
];

// Armour over the top. Fixed colours: L/l leather, I/i iron, O shine.
export const ARMOURS: Part[] = [
  { id: "none", label: "Ingen", grid: BLANK },
  {
    id: "leather",
    label: "Lærvest",
    grid: grid(
      10,
      "....Ll....lL",
      "....LLLLLLLL",
      "....lLLkkLLl",
      ".....lLLLLl",
    ),
    unlock: HIDDEN_GEAR,
  },
  {
    id: "chain",
    label: "Ringbrynje",
    grid: grid(
      10,
      "....Ii....iI",
      "...IiIiIiIiI",
      "....iIiIiIiI",
      ".....IiIiIi",
    ),
    unlock: HIDDEN_GEAR,
  },
  {
    id: "plate",
    label: "Rustning",
    grid: grid(
      10,
      "....OI....IO",
      "...IIIOIIOIII",
      "....iIIIIIIi",
      ".....ikkkki",
    ),
    unlock: CAVE_CHEST_5_SOURCE,
  },
];

// Hats: A/a main and shade. A helmet is iron whatever the colour choice.
export const HATS: Part[] = [
  { id: "none", label: "Ingen", grid: BLANK },
  {
    id: "santa",
    label: "Nisselue",
    grid: grid(
      0,
      "..........WW",
      "........AAWW",
      "......AAAAa",
      ".....AAAAAAa",
      "...WWWWWWWWWW",
    ),
  },
  {
    id: "bobble",
    label: "Topplue",
    grid: grid(
      0,
      ".......WW",
      "......WWWW",
      ".....AaAaAa",
      "....AaAaAaAa",
      "...wWWWWWWWWw",
    ),
    unlock: HIDDEN_GEAR,
  },
  {
    id: "earmuffs",
    label: "Øreklokker",
    grid: grid(
      2,
      ".....aAAAAa",
      "....a......a",
      "",
      "..WW........WW",
      "..Ww........wW",
      "..ww........ww",
    ),
  },
  {
    id: "hood",
    label: "Hette",
    grid: grid(
      2,
      ".....aAAAAa",
      "....aAAAAAAa",
      "...aAAAAAAAAa",
      "...aA......Aa",
      "...aA......Aa",
      "...aa......aa",
    ),
  },
  // An open knight's helmet, like Tiny Dungeon's frame 97: ridged cap, brim
  // and a cheek guard, with the face showing.
  {
    id: "helmet",
    label: "Hjelm",
    grid: grid(
      3,
      ".....IiiiiiI",
      "....XiXiXiXi",
      "....ViXiXiXi",
      "....iiiiiiii",
      "....i",
      "....i",
      "....i",
    ),
    unlock: HIDDEN_GEAR,
  },
  // The open helmet again, in ice instead of iron.
  {
    id: "icehelm",
    label: "Ishjelm",
    grid: grid(
      3,
      ".....FfffffF",
      "....XfXfXfXf",
      "....ffXfXfXf",
      "....ffffffff",
      "....f",
      "....f",
      "....f",
    ),
    unlock: RECIPE_10_SOURCE,
  },
  // Closed knight's helmet with a crest and visor slits (frame 96).
  {
    id: "knight",
    label: "Ridderhjelm",
    // Starts a row above the head (Kenney's knight has a lower head), so no
    // skin shows above it; the visor slits stay at eye height.
    grid: grid(
      2,
      ".......II",
      ".....iIIIIi",
      "....ViIIIIiV",
      "....iiiiiiii",
      "....iiiiiiii",
      "....iiXiXiXi",
      "....iiXiXiXi",
      "....iiiiiiii",
    ),
    unlock: HIDDEN_GEAR,
  },
  // Horned helmet (frame 87).
  {
    id: "viking",
    label: "Vikinghjelm",
    grid: grid(
      3,
      ".....iIIiIi",
      "..RRiIIIiIIirR",
      "..RRrIIIiIIIrR",
      "...rRIiiIiiIR",
    ),
    unlock: HIDDEN_GEAR,
  },
  // Pointed hat tipped to one side, its brim shading the eyes (frame 84).
  {
    id: "wizard",
    label: "Trollmannshatt",
    grid: grid(
      1,
      ".....aAa",
      "....aAAAa",
      "...a.aAAAAa",
      ".....aAAAAAa",
      "...aAAAAAAAAa",
      "...AaXXXXXXaA",
    ),
  },
  // A cloth band across the forehead (frame 112).
  { id: "bandana", label: "Bandana", grid: grid(5, "....aAAWAWAa", "...a") },
  {
    id: "crown",
    label: "Krone",
    grid: grid(2, "....Y..Y..Y", "....YyYYYyYY", "....YGYYYGYY"),
    unlock: "Bakeren: fullført uke 3",
  },
];

// Scarves: K main.
export const SCARVES: Part[] = [
  { id: "none", label: "Ingen", grid: BLANK },
  {
    id: "scarf",
    label: "Skjerf",
    grid: grid(10, "....KWKWKWKW", "....KW", ".....W"),
    unlock: "Brann: fullført uke 1",
  },
];

// Small extras. M mittens and the cape (K/q) use the scarf colour; the cape
// hangs behind the body.
export const EXTRAS: Part[] = [
  { id: "none", label: "Ingen", grid: BLANK },
  {
    id: "mittens",
    label: "Votter",
    grid: grid(12, "..MM........MM", "..MM........MM"),
  },
  {
    id: "lantern",
    label: "Lykt",
    grid: grid(
      11,
      "..............k",
      ".............kkk",
      ".............YGY",
      ".............YGY",
      ".............kkk",
    ),
    unlock: "Arkivarens spørsmål",
  },
  {
    id: "shield",
    label: "Isskjold",
    // Held at the other hand from the lantern.
    grid: grid(10, "XXXX", "XWFX", "XFfX", "XFfX", ".XfX", "..X"),
    unlock: RECIPE_5_SOURCE,
  },
  {
    id: "cape",
    label: "Kappe",
    // Shows at the waist and behind the legs; the body covers the rest.
    grid: grid(
      10,
      "...KKKKKKKKKK",
      "...KKKKKKKKKK",
      "...KKKKKKKKKK",
      "...KKKKKKKKKK",
      "...KqqqqqqqqK",
      "....qqqqqqqq",
    ),
    behind: true,
    unlock: HIDDEN_GEAR,
  },
  {
    id: "star",
    label: "Stjerne",
    grid: grid(10, "", "........G", ".......GYG", "........Y"),
    unlock: HIDDEN_GEAR,
  },
];

// --- Choices ------------------------------------------------------------------

export type FigureChoice = {
  skin: string;
  hair: string;
  hairColor: string;
  facialHair: string;
  top: string;
  topColor: string;
  armour: string;
  pants: string;
  hat: string;
  hatColor: string;
  scarf: string;
  scarfColor: string;
  extra: string;
};

// What each choice picks from, in the order a creator would show them.
export const FIGURE_OPTIONS: {
  [K in keyof FigureChoice]: readonly Option<object>[];
} = {
  skin: SKINS,
  hair: HAIRSTYLES,
  hairColor: HAIR_COLORS,
  facialHair: FACIAL_HAIR,
  top: TOPS,
  topColor: CLOTH_COLORS,
  armour: ARMOURS,
  pants: PANTS,
  hat: HATS,
  hatColor: CLOTH_COLORS,
  scarf: SCARVES,
  scarfColor: CLOTH_COLORS,
  extra: EXTRAS,
};

export const DEFAULT_FIGURE: FigureChoice = {
  skin: "light",
  hair: "short",
  hairColor: "brown",
  facialHair: "none",
  top: "sweater",
  topColor: "red",
  armour: "none",
  pants: "dark",
  hat: "santa",
  hatColor: "red",
  scarf: "none",
  scarfColor: "green",
  extra: "none",
};

// Any stored choice becomes a valid one: unknown ids fall back to the default,
// so content from Sanity can never break the drawing.
export function normalizeFigure(
  input: Partial<Record<string, unknown>> | null | undefined,
): FigureChoice {
  const out = { ...DEFAULT_FIGURE };
  for (const key of Object.keys(FIGURE_OPTIONS) as (keyof FigureChoice)[]) {
    const value = input?.[key];
    if (
      typeof value === "string" &&
      FIGURE_OPTIONS[key].some((o) => o.id === value)
    )
      out[key] = value;
  }
  return out;
}

export function randomFigure(random: () => number = Math.random): FigureChoice {
  const pick = <T extends { id: string }>(list: readonly T[]) =>
    list[Math.floor(random() * list.length)].id;
  const out = {} as FigureChoice;
  for (const key of Object.keys(FIGURE_OPTIONS) as (keyof FigureChoice)[])
    out[key] = pick(FIGURE_OPTIONS[key]);
  return out;
}

// --- Drawing ------------------------------------------------------------------

const find = <T extends { id: string }>(list: readonly T[], id: string) =>
  list.find((o) => o.id === id) ?? list[0];

function hexToRgba(hex: string): [number, number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    255,
  ];
}

export type OutlineMode = "kenney" | "thin"; // two-pixel outline like Kenney, or one

// The figure as RGBA pixels (16×16×4). One still frame, like the Kenney
// figures; the game adds its own step when walking.
export function drawFigure(
  choice: FigureChoice,
  opts: { outline?: OutlineMode } = {},
): Uint8ClampedArray<ArrayBuffer> {
  const c = normalizeFigure(choice);
  const pair = (list: readonly Option<{ colors: Pair }>[], id: string) =>
    find(list, id).colors;
  const roles: Record<string, string> = {
    ...FIXED,
    S: pair(SKINS, c.skin)[0],
    s: pair(SKINS, c.skin)[1],
    H: pair(HAIR_COLORS, c.hairColor)[0],
    h: pair(HAIR_COLORS, c.hairColor)[1],
    C: pair(CLOTH_COLORS, c.topColor)[0],
    c: pair(CLOTH_COLORS, c.topColor)[1],
    P: pair(PANTS, c.pants)[0],
    p: pair(PANTS, c.pants)[1],
    A: pair(CLOTH_COLORS, c.hatColor)[0],
    a: pair(CLOTH_COLORS, c.hatColor)[1],
    K: pair(CLOTH_COLORS, c.scarfColor)[0],
    M: pair(CLOTH_COLORS, c.scarfColor)[0],
    q: pair(CLOTH_COLORS, c.scarfColor)[1],
  };
  const extra = find(EXTRAS, c.extra);
  const hair = find(HAIRSTYLES, c.hair);
  const layers = [
    ...(extra.behind ? [extra.grid] : []),
    BODY,
    ...(hair.front ? [] : [hair.grid]),
    find(TOPS, c.top).grid,
    find(ARMOURS, c.armour).grid,
    ...(hair.front ? [hair.grid] : []),
    find(SCARVES, c.scarf).grid,
    find(FACIAL_HAIR, c.facialHair).grid,
    find(HATS, c.hat).grid,
    ...(extra.behind ? [] : [extra.grid]),
  ];

  const N = FIGURE_SIZE;
  // Hair never pokes out above a hat that sits on the head (a bun on a helmet,
  // tufts over a crown). A band lower down, like the bandana, leaves it be.
  const top = find(HATS, c.hat).grid.findIndex((row) => /[^.]/.test(row));
  const hatTop = top <= 3 ? top : -1;
  const art: (string | null)[] = new Array(N * N).fill(null);
  for (const layer of layers)
    layer.forEach((row, y) => {
      if (layer === hair.grid && hatTop > 0 && y < hatTop) return;
      [...row].forEach((ch, x) => {
        if (ch !== "." && roles[ch]) art[y * N + x] = roles[ch];
      });
    });

  const placed = art;

  const out = new Uint8ClampedArray(N * N * 4);
  const outline = hexToRgba(OUTLINE);
  // Kenney's outline is two pixels: one all round (corners too), then one
  // more on the sides only. "thin" keeps just the first ring.
  const ALL = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ];
  const SIDES = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ];
  const filled = placed.map(Boolean);
  const grow = (mask: boolean[], near: number[][]) => {
    const next = [...mask];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (!mask[y * N + x]) continue;
        for (const [dx, dy] of near) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N) next[ny * N + nx] = true;
        }
      }
    return next;
  };
  let ring = grow(filled, ALL);
  if ((opts.outline ?? "kenney") === "kenney") ring = grow(ring, SIDES);
  for (let i = 0; i < N * N; i++)
    if (ring[i] && !filled[i]) out.set(outline, i * 4);
  for (let i = 0; i < N * N; i++) {
    const col = placed[i];
    if (col) out.set(hexToRgba(col), i * 4);
  }
  return out;
}
