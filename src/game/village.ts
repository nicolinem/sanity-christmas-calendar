// Frostholm, the village the knight wakes up in. Pure layout data (no Phaser)
// so it's easy to read and tweak: rectangles of path, a few buildings, props,
// and a seeded forest. Coordinates are in 16px tiles unless noted.

import type { SpriteSheet } from "./sprites";

export const MAP_W = 54;
export const MAP_H = 30;

type Rect = { x: number; y: number; w: number; h: number };

// Paths are carved as ≥2-tile-wide rectangles so the autotiler always has a
// proper edge on each side.
const PATHS: Rect[] = [
  { x: 22, y: 7, w: 2, h: 8 }, // forge door → plaza
  { x: 17, y: 14, w: 12, h: 4 }, // plaza
  { x: 10, y: 9, w: 2, h: 4 }, // west house door
  { x: 10, y: 11, w: 13, h: 2 }, // west lane
  { x: 33, y: 8, w: 2, h: 8 }, // east house door
  { x: 28, y: 15, w: 10, h: 2 }, // road to the glade
  { x: 21, y: 18, w: 2, h: 12 }, // south road
  { x: 6, y: 20, w: 2, h: 3 }, // south-west house door
  { x: 6, y: 21, w: 15, h: 2 }, // south-west lane
];

// Frost glade, east of the village, where the wraith drifts about.
export const GLADE: Rect = { x: 37, y: 11, w: 7, h: 10 };
const STONES: [number, number][] = [
  [38, 13], [40, 12], [42, 14], [39, 17], [41, 19], [43, 17], [37, 15], [40, 15],
];

export type Building = {
  x: number;
  y: number;
  rows: number[][]; // town-sheet frames, top to bottom
  windows: [number, number][]; // lit window tiles, for glow
};

export const FORGE: Building = {
  x: 20,
  y: 4,
  rows: [
    [52, 53, 53, 53, 54],
    [64, 65, 67, 65, 66],
    [76, 77, 78, 77, 79], // 78 is the open forge mouth
  ],
  windows: [],
};

const house = (x: number, y: number, door: "left" | "right"): Building => ({
  x,
  y,
  rows: [
    [48, 49, 49, 50],
    [60, 61, 63, 62],
    door === "right" ? [72, 84, 85, 75] : [72, 85, 84, 75],
  ],
  windows: [[door === "right" ? x + 1 : x + 2, y + 2]],
});

export const BUILDINGS: Building[] = [
  FORGE,
  house(8, 6, "right"), // door at col 10
  house(31, 5, "right"), // door at col 33
  house(5, 17, "left"), // door at col 6
];

export type Prop = {
  sheet: SpriteSheet;
  frame: number;
  x: number;
  y: number;
  solid?: boolean;
};

export const PROPS: Prop[] = [
  { sheet: "dungeon", frame: 29, x: 19, y: 6, solid: true }, // furnace against the forge
  { sheet: "dungeon", frame: 74, x: 25, y: 8, solid: true }, // anvil
  { sheet: "dungeon", frame: 82, x: 18, y: 6, solid: true }, // barrels
  { sheet: "dungeon", frame: 82, x: 18, y: 7, solid: true },
  { sheet: "dungeon", frame: 75, x: 25, y: 6, solid: true }, // weapon rack
  { sheet: "town", frame: 104, x: 25, y: 15, solid: true }, // well
  { sheet: "town", frame: 83, x: 29, y: 13, solid: true }, // signpost
  { sheet: "town", frame: 80, x: 13, y: 8, solid: true }, // fence by the west house
  { sheet: "town", frame: 81, x: 14, y: 8, solid: true },
  { sheet: "town", frame: 82, x: 15, y: 8, solid: true },
  { sheet: "town", frame: 80, x: 35, y: 18, solid: true }, // fence at the glade
  { sheet: "town", frame: 81, x: 36, y: 18, solid: true },
  { sheet: "town", frame: 82, x: 37, y: 18, solid: true },
  { sheet: "dungeon", frame: 89, x: 9, y: 9, solid: true }, // chest by a door
  { sheet: "town", frame: 106, x: 35, y: 7, solid: true }, // firewood
  { sheet: "town", frame: 106, x: 9, y: 20, solid: true },
];

export const SPAWN = { x: 23 * 16, y: 12 * 16 + 8 }; // on the forge path, Brann in view
export const BLACKSMITH = { x: 24 * 16 + 8, y: 9 * 16 }; // feet position in px
export const FORGE_FIRE = { x: 22 * 16 + 8, y: 6 * 16 + 9 };
export const FURNACE = { x: 19 * 16 + 8, y: 6 * 16 + 8 };
export const WRAITH_HOME = { x: 40 * 16 + 8, y: 16 * 16 };

// --- derived grid -----------------------------------------------------------

function inRect(x: number, y: number, r: Rect) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

const pathGrid: boolean[][] = Array.from({ length: MAP_H }, (_, y) =>
  Array.from({ length: MAP_W }, (_, x) => PATHS.some((r) => inRect(x, y, r))),
);

export function isPath(x: number, y: number) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H && pathGrid[y][x];
}

// Tiny Town's 3×3 path set plus its four inner corners.
function pathFrame(x: number, y: number): number {
  const n = isPath(x, y - 1) || y === 0;
  const s = isPath(x, y + 1) || y === MAP_H - 1;
  const w = isPath(x - 1, y);
  const e = isPath(x + 1, y);
  if (!n) return !w ? 12 : !e ? 14 : 13;
  if (!s) return !w ? 36 : !e ? 38 : 37;
  if (!w) return 24;
  if (!e) return 26;
  if (!isPath(x - 1, y - 1) && y > 0) return 39;
  if (!isPath(x + 1, y - 1) && y > 0) return 40;
  if (!isPath(x + 1, y + 1) && y < MAP_H - 1) return 41;
  if (!isPath(x - 1, y + 1) && y < MAP_H - 1) return 42;
  return 25;
}

// Small deterministic PRNG so the forest is the same on every visit.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const occupied: boolean[][] = Array.from({ length: MAP_H }, () =>
  Array.from({ length: MAP_W }, () => false),
);
function reserve(r: Rect, pad = 0) {
  for (let y = r.y - pad; y < r.y + r.h + pad; y++)
    for (let x = r.x - pad; x < r.x + r.w + pad; x++)
      if (y >= 0 && x >= 0 && y < MAP_H && x < MAP_W) occupied[y][x] = true;
}
PATHS.forEach((r) => reserve(r, 1));
BUILDINGS.forEach((b) => reserve({ x: b.x, y: b.y, w: b.rows[0].length, h: b.rows.length + 1 }, 1));
PROPS.forEach((p) => reserve({ x: p.x, y: p.y, w: 1, h: 1 }, 1));
reserve(GLADE, 0);
reserve({ x: 23, y: 7, w: 3, h: 3 }); // forge yard

export const GROUND: number[][] = [];
{
  const rand = rng(7);
  for (let y = 0; y < MAP_H; y++) {
    const row: number[] = [];
    for (let x = 0; x < MAP_W; x++) {
      if (isPath(x, y)) row.push(pathFrame(x, y));
      else if (STONES.some(([sx, sy]) => sx === x && sy === y)) row.push(43);
      else row.push(rand() < 0.14 ? 1 : 0);
    }
    GROUND.push(row);
  }
}

export type Tree = { frame: number; x: number; y: number }; // px, feet position

export const TREES: Tree[] = [];
{
  const rand = rng(42);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (occupied[y][x]) continue;
      const edge = Math.min(x, y, MAP_W - 1 - x, MAP_H - 1 - y);
      const p = edge < 2 ? 1 : edge < 3 ? 0.75 : edge < 5 ? 0.35 : 0.12;
      if (rand() > p) continue;
      const r = rand();
      const frame = edge >= 3 && r < 0.1 ? 5 : edge >= 3 && r < 0.16 ? 17 : r < 0.62 ? 28 : 4;
      TREES.push({
        frame,
        x: x * 16 + 8 + Math.round((rand() - 0.5) * 6),
        y: y * 16 + 16 + Math.round((rand() - 0.5) * 4),
      });
    }
  }
}
