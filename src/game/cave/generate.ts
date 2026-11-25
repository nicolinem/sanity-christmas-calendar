import { enemiesAt, PLAYABLE, type EnemyId } from "./enemies";
import type { MaterialId } from "../materials";
import { decorate, type Decor } from "./decor";
import { rng } from "./random";
import type { Box } from "../walk";
import { floorLayout, roomAt, stitchRooms, type Layout } from "./layout";
import { REST_ROOMS, ROOMS, ROOM_H, ROOM_W, mirror, reachable } from "./rooms";

const TILE = 16;

export type Point = { x: number; y: number };

export type RoomKind = "start" | "calm" | "normal" | "nest";

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
  kinds: RoomKind[]; // per room, row-major; room 0 is always "start"
  stairsRoom: number; // index of the room the stairs are in
  // Tile-centre px. Calm rooms get 0–1 enemies, normal rooms 2–3, a nest 4–5
  // (up to 10 in all) from the depth's mix; rest floors get one boss on every
  // m. `room` is the row-major room index the spawn belongs to.
  spawns: { enemy: EnemyId; x: number; y: number; room: number }[];
  rocks: Point[]; // tile-centre px of the o tiles that survived a 60% roll
  // Rest floors only (and only if the template has a k): id is `cave-${depth}`.
  chest?: { id: string; x: number; y: number }; // tile-centre px
  // A small loot cache in the nest room (never on rest floors). Not saved: the
  // id belongs to this trip. Items are merged into counts (2–3 in total).
  cache?: {
    id: string;
    x: number;
    y: number;
    items: { item: MaterialId; count: number }[];
  };
  // The stairs room is locked until every spawn in it is defeated. Never set
  // on rest floors or depth 1, nor when that room has no playable monster.
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
  const kinds: RoomKind[] = ["start"];
  let spawns: Floor["spawns"];
  if (rest) {
    const boss: EnemyId = depth % 10 === 5 ? "yeti" : "drake";
    spawns = allSpots.map((s) => ({ enemy: boss, ...center(s), room: 0 }));
  } else {
    const mix = enemiesAt(depth);
    const perRoom: Floor["spawns"][] = [];
    for (let i = 0; i < roomCount; i++) {
      if (i > 0) {
        const roll = r();
        kinds.push(
          // Depth 1 still draws the roll, but never gets a calm room: it is where
          // combat is introduced.
          roll < 0.25 && depth > 1
            ? "calm"
            : roll < 0.4 && depth >= 2 && !kinds.includes("nest")
              ? "nest"
              : "normal",
        );
      }
      const kind = kinds[i];
      const spots = inside(allSpots, i);
      let count: number;
      if (kind === "calm") count = r() < 0.5 ? 0 : 1;
      else if (kind === "nest") count = 4 + (r() < 0.5 ? 0 : 1);
      else {
        count = Math.min(
          3,
          2 + Math.floor((depth - 1) / 3) + (r() < 0.5 ? 0 : 1),
        );
        if (i === 0) count = depth <= 2 ? 0 : Math.min(1, count);
      }
      // Fisher–Yates, then take the first n spots.
      for (let k = spots.length - 1; k > 0; k--) {
        const j = Math.floor(r() * (k + 1));
        [spots[k], spots[j]] = [spots[j], spots[k]];
      }
      perRoom.push(
        spots
          .slice(0, count)
          .map((s) => ({ enemy: pick(mix), ...center(s), room: i })),
      );
    }
    // Over the cap: trim normal rooms first, last room first, then calm, then
    // the start room. A nest is never trimmed.
    for (const kind of ["normal", "calm", "start"] as RoomKind[])
      for (let i = roomCount - 1; i >= 0; i--)
        while (
          kinds[i] === kind &&
          perRoom[i].length > 0 &&
          perRoom.reduce((n, l) => n + l.length, 0) > MAX_SPAWNS_PER_FLOOR
        )
          perRoom[i].pop();
    spawns = perRoom.flat();
  }

  const rockTiles = cells(rows, "o").filter(
    (t) =>
      kinds[roomAt(t[0] * TILE, t[1] * TILE, layout)] === "calm" || r() < 0.6,
  );
  const rocks = rockTiles.map(center);

  let locked = !rest && depth > 1 && r() < 0.25;
  if (
    locked &&
    !spawns.some((s) => s.room === stairsRoom && PLAYABLE.includes(s.enemy))
  )
    locked = false;

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

  // The cache goes on a floor tile of the nest, 3+ tiles (Chebyshev) from every
  // wall, rock and spawn. No such tile: no cache.
  let cache: Floor["cache"];
  const nest = kinds.indexOf("nest");
  if (nest >= 0) {
    const blockers: [number, number][] = [
      ...cells(built, "#"),
      ...cells(built, "o"),
      ...spawns.map(
        (s) =>
          [(s.x - TILE / 2) / TILE, (s.y - TILE / 2) / TILE] as [
            number,
            number,
          ],
      ),
    ];
    const spots = inside(cells(built, "."), nest).filter(([x, y]) =>
      blockers.every(
        ([bx, by]) => Math.max(Math.abs(bx - x), Math.abs(by - y)) >= 3,
      ),
    );
    if (spots.length) {
      const at = pick(spots);
      // 2–3 draws, merged into counts per material.
      const items: { item: MaterialId; count: number }[] = [];
      for (let n = 2 + (r() < 0.5 ? 0 : 1); n > 0; n--) {
        const item: MaterialId = r() < 0.5 ? "malm" : "isskar";
        const entry = items.find((e) => e.item === item);
        if (entry) entry.count++;
        else items.push({ item, count: 1 });
      }
      cache = { id: `nest-${depth}-${seed}`, ...center(at), items };
    }
  }

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
    kinds,
    stairsRoom,
    start: center(startTile),
    stairs: center(stairsTile),
    spawns,
    rocks,
    ...(cache && { cache }),
    ...(chestTile && { chest: { id: `cave-${depth}`, ...center(chestTile) } }),
    locked,
    rest,
    sheet: depth >= 10 ? "caveDeep" : "cave",
  };
}
