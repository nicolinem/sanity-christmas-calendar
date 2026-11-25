import { enemiesAt, type EnemyId } from "./enemies";
import { rng } from "./random";
import { CAVE_FRAMES, REST_ROOMS, ROOMS, mirror } from "./rooms";

const TILE = 16;

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

export type Floor = {
  depth: number; // 1-based dungeon depth; drives the enemy mix
  room: string; // id of the room template this floor was built from
  mirrored: boolean; // the template was flipped left-right
  // The floor as built: one T (at stairs), o only where rocks are.
  rows: string[];
  tiles: number[][]; // frame index into SHEETS[sheet], indexed [y][x]
  // One 16×16 box per wall tile, top-left px (x*16, y*16). Rocks are NOT here:
  // a scene adds rock collision from `rocks`.
  solids: Box[];
  start: Point; // tile-centre px (x*16+8, y*16+8)
  stairs: Point; // tile-centre px; the way down
  // Tile-centre px. Normal floors get up to 6 random enemies from the depth's
  // mix; rest floors get one boss on every m.
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

export function generateFloor(
  rawDepth: number,
  seed: number,
  previousRoom?: string,
): Floor {
  const depth = Math.max(1, Math.floor(rawDepth) || 1);
  const r = rng(seed);
  const pick = <T>(list: T[]): T => list[Math.floor(r() * list.length)];
  const rest = depth % 5 === 0;

  let template;
  if (rest) {
    template = depth % 10 === 5 ? REST_ROOMS[5] : REST_ROOMS[10];
  } else {
    template = pick(ROOMS.filter((room) => room.id !== previousRoom));
  }

  const mirrored = !rest && r() < 0.5;
  const rows = mirrored ? mirror(template.rows) : template.rows;

  const stairsTile = pick(cells(rows, "T"));
  const startTile = cells(rows, "S")[0];

  const spots = cells(rows, "m");
  let spawns: Floor["spawns"];
  if (rest) {
    const boss: EnemyId = depth % 10 === 5 ? "yeti" : "drake";
    spawns = spots.map((s) => ({ enemy: boss, ...center(s) }));
  } else {
    const count = Math.min(
      6,
      2 + Math.floor((depth - 1) / 2) + (r() < 0.5 ? 0 : 1),
    );
    // Fisher–Yates, then take the first n spots.
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    const kinds = enemiesAt(depth);
    spawns = spots.slice(0, count).map((s) => ({
      enemy: pick(kinds),
      ...center(s),
    }));
  }

  const rockTiles = cells(rows, "o").filter(() => r() < 0.6);
  const rocks = rockTiles.map(center);

  const locked = !rest && depth > 1 && r() < 0.25;

  const built = rows.map((row, y) =>
    [...row]
      .map((c, x) => {
        if (c === "T")
          return x === stairsTile[0] && y === stairsTile[1] ? "T" : ".";
        if (c === "o")
          return rockTiles.some(([rx, ry]) => rx === x && ry === y) ? "o" : ".";
        return c;
      })
      .join(""),
  );

  const tiles = rows.map((row) =>
    [...row].map((c) => {
      if (c === "#") return CAVE_FRAMES.wall;
      const v = r();
      if (v < 0.05) return CAVE_FRAMES.floorPebbles;
      return CAVE_FRAMES.floor;
    }),
  );

  const solids: Box[] = cells(rows, "#").map(([x, y]) => ({
    x: x * TILE,
    y: y * TILE,
    w: TILE,
    h: TILE,
  }));

  const chestTile = rest ? cells(rows, "k")[0] : undefined;

  return {
    depth,
    room: template.id,
    mirrored,
    rows: built,
    tiles,
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
