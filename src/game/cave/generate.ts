import { ENEMIES, enemiesAt, type EnemyId } from "./enemies";
import { rng } from "./random";
import { CAVE_FRAMES, REST_ROOMS, ROOMS, mirror } from "./rooms";

const TILE = 16;

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

export type Floor = {
  depth: number;
  room: string;
  mirrored: boolean;
  rows: string[];
  tiles: number[][];
  solids: Box[];
  start: Point;
  stairs: Point;
  spawns: { enemy: EnemyId; x: number; y: number }[];
  rocks: Point[];
  chest?: { id: string; x: number; y: number };
  locked: boolean;
  rest: boolean;
  sheet: "cave" | "caveDeep";
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
  depth: number,
  seed: number,
  previousRoom?: string,
): Floor {
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

  const rocks = cells(rows, "o")
    .filter(() => r() < 0.6)
    .map(center);

  const locked = !rest && depth > 1 && r() < 0.25;

  const tiles = rows.map((row) =>
    [...row].map((c) => {
      if (c === "#") return CAVE_FRAMES.wall;
      const v = r();
      if (v < 0.1) return CAVE_FRAMES.floorPebbles;
      if (v < 0.2) return CAVE_FRAMES.floorRocks;
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
    rows,
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
