import type { Point } from "./generate";
import { CAVE_FRAMES } from "./rooms";

const TILE = 16;

// An ice lump on the floor: tile-centre px. Drawn, never solid.
export type Decor = { sheet: "ski"; frame: 95; x: number; y: number };

const centre = (x: number, y: number): Point => ({
  x: x * TILE + TILE / 2,
  y: y * TILE + TILE / 2,
});

// Decides how every tile looks, as pure data.
// Draw order from `r` (fixed, so a seed fully determines the result):
//   1. row-major, per tile: `#` front -> variant roll, then face roll;
//      other tiles -> pebble roll, then (`.` only) ice-lump roll.
//   2. torch count, 3. Fisher-Yates over the fronts for torch placement.
export function decorate(
  rows: string[],
  r: () => number,
): {
  tiles: number[][];
  roof: boolean[][];
  torches: Point[];
  decor: Decor[];
} {
  const { wall, wallVariants, wallFaces, torch, floor, floorPebbles } =
    CAVE_FRAMES;
  const pick = <T>(list: readonly T[]): T =>
    list[Math.floor(r() * list.length)];
  const fronts: [number, number][] = [];
  const faceAt = new Set<string>();
  const roof = rows.map((row) => [...row].map(() => false));
  const decor: Decor[] = [];
  let faceUsed = false;

  const tiles = rows.map((row, y) =>
    [...row].map((c, x): number => {
      if (c === "#") {
        const below = rows[y + 1]?.[x];
        if (below === undefined || below === "#") {
          roof[y][x] = true;
          return wall;
        }
        fronts.push([x, y]);
        const variant = r() < 0.12;
        const face = r() < 0.01;
        if (face && !faceUsed) {
          faceUsed = true;
          faceAt.add(`${x},${y}`);
          return pick(wallFaces);
        }
        return variant ? pick(wallVariants) : wall;
      }
      const pebble = r() < 0.02;
      if (c === "." && r() < 0.01)
        decor.push({ sheet: "ski", frame: 95, ...centre(x, y) });
      return pebble ? floorPebbles : floor;
    }),
  );

  const wanted = 2 + Math.floor(r() * 3);
  const candidates = fronts.filter(([x, y]) => !faceAt.has(`${x},${y}`));
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const chosen: [number, number][] = [];
  for (const [x, y] of candidates) {
    if (chosen.length >= wanted) break;
    if (
      chosen.every(
        ([cx, cy]) => Math.max(Math.abs(cx - x), Math.abs(cy - y)) >= 4,
      )
    )
      chosen.push([x, y]);
  }
  for (const [x, y] of chosen) tiles[y][x] = torch;

  return { tiles, roof, torches: chosen.map(([x, y]) => centre(x, y)), decor };
}
