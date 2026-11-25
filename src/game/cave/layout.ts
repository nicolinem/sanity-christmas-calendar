import { ROOM_H, ROOM_W } from "./rooms";

export type Layout = { cols: number; rows: number };

// Rest floors stay one room; the first two floors are two rooms side by side;
// everything else is 2 × 2.
export function floorLayout(depth: number): Layout {
  if (depth % 5 === 0) return { cols: 1, rows: 1 };
  if (depth <= 2) return { cols: 2, rows: 1 };
  return { cols: 2, rows: 2 };
}

// Joins rooms (cells[row][col], each ROOM_W × ROOM_H) into one floor with an
// opening in every shared wall. Null when some pair has nowhere to open.
export function stitchRooms(
  cells: string[][][],
  r: () => number,
): string[] | null {
  const grid = cells.flatMap((rowOfRooms) =>
    Array.from({ length: ROOM_H }, (_, y) =>
      [...rowOfRooms.map((room) => room[y])].join("").split(""),
    ),
  );
  const free = (x: number, y: number) =>
    grid[y][x] !== "#" && grid[y][x] !== "o";

  // Picks one or two adjacent candidates (a pair preferred), returns them.
  const choose = (candidates: number[]): number[] | null => {
    if (!candidates.length) return null;
    const pairs = candidates.filter((c) => candidates.includes(c + 1));
    if (pairs.length) {
      const c = pairs[Math.floor(r() * pairs.length)];
      return [c, c + 1];
    }
    return [candidates[Math.floor(r() * candidates.length)]];
  };

  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      const x0 = col * ROOM_W;
      const y0 = row * ROOM_H;
      if (col + 1 < cells[row].length) {
        const ys: number[] = [];
        for (let y = 2; y <= 11; y++)
          if (free(x0 + 22, y0 + y) && free(x0 + ROOM_W + 1, y0 + y))
            ys.push(y);
        const open = choose(ys);
        if (!open) return null;
        for (const y of open) {
          grid[y0 + y][x0 + ROOM_W - 1] = ".";
          grid[y0 + y][x0 + ROOM_W] = ".";
        }
      }
      if (row + 1 < cells.length) {
        const xs: number[] = [];
        for (let x = 2; x <= 21; x++)
          if (free(x0 + x, y0 + 12) && free(x0 + x, y0 + ROOM_H + 1))
            xs.push(x);
        const open = choose(xs);
        if (!open) return null;
        for (const x of open) {
          grid[y0 + ROOM_H - 1][x0 + x] = ".";
          grid[y0 + ROOM_H][x0 + x] = ".";
        }
      }
    }
  }
  return grid.map((line) => line.join(""));
}

// Row-major index of the room that contains the px point, clamped to the layout.
export function roomAt(x: number, y: number, layout: Layout): number {
  const clamp = (v: number, n: number) => Math.min(Math.max(v, 0), n - 1);
  const col = clamp(Math.floor(x / (ROOM_W * 16)), layout.cols);
  const row = clamp(Math.floor(y / (ROOM_H * 16)), layout.rows);
  return row * layout.cols + col;
}
