// Movement shared by the village and the cave. No Phaser in here, so it can be
// tested in plain node.

export type Box = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };

const hits = (a: Box, b: Box) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// The feet are a box of 8 × 4 under the figure. x and y move one after the
// other, so a wall is slid along rather than stuck to.
export function moveBox(
  pos: Point,
  dx: number,
  dy: number,
  solids: Box[],
): Point {
  const free = (x: number, y: number) => {
    const feet = { x: x - 4, y: y - 4, w: 8, h: 4 };
    return !solids.some((s) => hits(feet, s));
  };
  let { x, y } = pos;
  if (free(x + dx, y)) x += dx;
  if (free(x, y + dy)) y += dy;
  return { x, y };
}

// Tiles in px: tile (x, y) has its centre at (x * 16 + 8, y * 16 + 8). '#' and
// 'o' are shut. The route runs from the tile after the start to the target,
// keeping only the corners. Nothing to reach gives [].
export function tileRoute(rows: string[], from: Point, to: Point): Point[] {
  const open = (x: number, y: number) => {
    const c = rows[y]?.[x];
    return c !== undefined && c !== "#" && c !== "o";
  };
  const tile = (p: Point): [number, number] => [
    Math.floor(p.x / 16),
    Math.floor(p.y / 16),
  ];
  const start = tile(from);
  const end = tile(to);
  if (!open(...end) || !open(...start)) return [];

  const w = rows[0].length;
  const key = (x: number, y: number) => y * w + x;
  const cameFrom = new Map<number, number>([[key(...start), -1]]);
  const queue: [number, number][] = [start];
  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (x === end[0] && y === end[1]) break;
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ] as [number, number][]) {
      if (!open(nx, ny) || cameFrom.has(key(nx, ny))) continue;
      cameFrom.set(key(nx, ny), key(x, y));
      queue.push([nx, ny]);
    }
  }
  if (!cameFrom.has(key(...end))) return [];

  const tiles: [number, number][] = [];
  for (let k = key(...end); k !== -1; k = cameFrom.get(k)!)
    tiles.unshift([k % w, Math.floor(k / w)]);
  tiles.shift();
  const corners = tiles.filter((t, i) => {
    if (i === tiles.length - 1) return true;
    const [px, py] = i === 0 ? start : tiles[i - 1];
    const [nx, ny] = tiles[i + 1];
    return !(px === nx || py === ny);
  });
  return corners.map(([x, y]) => ({ x: x * 16 + 8, y: y * 16 + 8 }));
}
