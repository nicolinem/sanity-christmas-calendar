import { enemiesAt, type EnemyId } from "./enemies";
import { decorate, type Decor } from "./decor";
import { rng } from "./random";
import type { Box } from "../walk";
import { floorLayout, stitchRooms, type Layout } from "./layout";
import { REST_ROOMS, ROOMS, ROOM_H, ROOM_W, mirror, reachable } from "./rooms";

const TILE = 16;

export type Point = { x: number; y: number };

export type Floor = {
  depth: number; // 1-based dungeon depth; drives the enemy mix
  layout: Layout; // rooms across and down
  rooms: string[]; // template ids, row-major
  room: string; // id of the start room's template
  mirrored: boolean; // the start room was flipped left-right
  // The floor as built: one T (at stairs), o only where rocks are.
  rows: string[];
  tiles: number[][]; // frame index into SHEETS[sheet], indexed [y][x]
  roof: boolean[][]; // true for a # that is a dark roof, not a wall front
  torches: Point[]; // tile-centre px of the torches (on wall fronts)
  decor: Decor[]; // ice lumps on the floor; drawn, never solid
  // One 16×16 box per wall tile, top-left px (x*16, y*16). Rocks are NOT here:
  // a scene adds rock collision from `rocks`.
  solids: Box[];
  start: Point; // tile-centre px (x*16+8, y*16+8)
  stairs: Point; // tile-centre px; the way down
  // Tile-centre px. Normal floors get 2–3 enemies per room (up to 10 in all)
  // from the depth's mix; rest floors get one boss on every m.
  spawns: { enemy: EnemyId; x: number; y: number }[];
  rocks: Point[]; // tile-centre px of the o tiles that survived a 60% roll
  // Rest floors only (and only if the template has a k): id is `cave-${depth}`.
  chest?: { id: string; x: number; y: number }; // tile-centre px
  // The stairs open only when every spawn is defeated. Never set on rest
  // floors or depth 1.
  locked: boolean;
  rest: boolean; // every fifth floor: 5, 10, 15, …
  sheet: "cave" | "caveDeep"; // "caveDeep" from depth 10
};

const center = ([x, y]: [number, number]): Point => ({
  x: x * TILE + TILE / 2,
  y: y * TILE + TILE / 2,
});

function cells(rows: string[], ch: string): [number, number][] {
  const out: [number, number][] = [];
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => c === ch && out.push([x, y])),
  );
  return out;
}

const MAX_SPAWNS_PER_FLOOR = 10;
const MAX_ATTEMPTS = 20;

// Rocks block, so check against the worst case: every o stays. Every room must
// have a stairs tile the player can walk to from the start.
function allRoomsReachable(rows: string[], layout: Layout): boolean {
  const from = cells(rows, "S").find((t) => t[0] < ROOM_W && t[1] < ROOM_H)!;
  const seen = reachable(rows, from);
  for (let i = 0; i < layout.cols * layout.rows; i++) {
    const x0 = (i % layout.cols) * ROOM_W;
    const y0 = Math.floor(i / layout.cols) * ROOM_H;
    let ok = false;
    for (let y = y0; y < y0 + ROOM_H; y++)
      for (let x = x0; x < x0 + ROOM_W; x++)
        if (rows[y][x] === "T" && seen.has(`${x},${y}`)) ok = true;
    if (!ok) return false;
  }
  return true;
}

export function generateFloor(
  rawDepth: number,
  seed: number,
  previousRoom?: string,
): Floor {
  const depth = Math.max(1, Math.floor(rawDepth) || 1);
  const r = rng(seed);
  const pick = <T>(list: T[]): T => list[Math.floor(r() * list.length)];
  const rest = depth % 5 === 0;
  const layout = floorLayout(depth);
  const roomCount = layout.cols * layout.rows;

  // Draw every room and its mirroring, stitch them, and redraw the whole set
  // if the stitch fails or some room's stairs cannot be reached from the start.
  let rooms: { id: string; mirrored: boolean }[] = [];
  let rows: string[] = [];
  for (let attempt = 1; ; attempt++) {
    let grid: string[][][];
    if (rest) {
      const template = depth % 10 === 5 ? REST_ROOMS[5] : REST_ROOMS[10];
      rooms = [{ id: template.id, mirrored: false }];
      grid = [[template.rows]];
    } else {
      rooms = [];
      grid = Array.from({ length: layout.rows }, () => []);
      for (let i = 0; i < roomCount; i++) {
        const template = pick(
          ROOMS.filter((room) => i > 0 || room.id !== previousRoom),
        );
        const mirrored = r() < 0.5;
        rooms.push({ id: template.id, mirrored });
        grid[Math.floor(i / layout.cols)].push(
          mirrored ? mirror(template.rows) : template.rows,
        );
      }
    }
    const stitched = stitchRooms(grid, r);
    if (stitched) {
      rows = stitched;
      if (rest || allRoomsReachable(rows, layout)) break;
    }
    // Practically unreachable: 0 redraws seen in 30,000 floors. In a live game
    // this would throw inside a fade callback; the 1000-seed generate test
    // guards against a template change that makes it reachable.
    if (attempt >= MAX_ATTEMPTS)
      throw new Error(
        `Could not build a cave floor (depth ${depth}, seed ${seed})`,
      );
  }

  const inRoom = ([x, y]: [number, number], i: number) =>
    Math.floor(x / ROOM_W) === i % layout.cols &&
    Math.floor(y / ROOM_H) === Math.floor(i / layout.cols);
  const inside = (list: [number, number][], i: number) =>
    list.filter((t) => inRoom(t, i));

  const stairsRoom =
    roomCount === 1 ? 0 : 1 + Math.floor(r() * (roomCount - 1));
  const stairsTile = pick(inside(cells(rows, "T"), stairsRoom));
  const startTile = inside(cells(rows, "S"), 0)[0];

  const allSpots = cells(rows, "m");
  let spawns: Floor["spawns"];
  if (rest) {
    const boss: EnemyId = depth % 10 === 5 ? "yeti" : "drake";
    spawns = allSpots.map((s) => ({ enemy: boss, ...center(s) }));
  } else {
    const kinds = enemiesAt(depth);
    spawns = [];
    for (let i = 0; i < roomCount; i++) {
      const spots = inside(allSpots, i);
      let count = Math.min(
        3,
        2 + Math.floor((depth - 1) / 3) + (r() < 0.5 ? 0 : 1),
      );
      if (i === 0) count = depth <= 2 ? 0 : Math.min(1, count);
      // Fisher–Yates, then take the first n spots.
      for (let k = spots.length - 1; k > 0; k--) {
        const j = Math.floor(r() * (k + 1));
        [spots[k], spots[j]] = [spots[j], spots[k]];
      }
      for (const s of spots.slice(0, count))
        spawns.push({ enemy: pick(kinds), ...center(s) });
    }
    // A guard: today's layouts cannot exceed 10.
    spawns = spawns.slice(0, MAX_SPAWNS_PER_FLOOR);
  }

  const rockTiles = cells(rows, "o").filter(() => r() < 0.6);
  const rocks = rockTiles.map(center);

  const locked = !rest && depth > 1 && r() < 0.25;

  const built = rows.map((row, y) =>
    [...row]
      .map((c, x) => {
        if (c === "S")
          return x === startTile[0] && y === startTile[1] ? "S" : ".";
        if (c === "T")
          return x === stairsTile[0] && y === stairsTile[1] ? "T" : ".";
        if (c === "o")
          return rockTiles.some(([rx, ry]) => rx === x && ry === y) ? "o" : ".";
        return c;
      })
      .join(""),
  );

  const { tiles, roof, torches, decor } = decorate(rows, r);

  const solids: Box[] = cells(rows, "#").map(([x, y]) => ({
    x: x * TILE,
    y: y * TILE,
    w: TILE,
    h: TILE,
  }));

  const chestTile = rest ? cells(rows, "k")[0] : undefined;

  return {
    depth,
    layout,
    rooms: rooms.map((room) => room.id),
    room: rooms[0].id,
    mirrored: rooms[0].mirrored,
    rows: built,
    tiles,
    roof,
    torches,
    decor,
    solids,
    start: center(startTile),
    stairs: center(stairsTile),
    spawns,
    rocks,
    ...(chestTile && { chest: { id: `cave-${depth}`, ...center(chestTile) } }),
    locked,
    rest,
    sheet: depth >= 10 ? "caveDeep" : "cave",
  };
}
