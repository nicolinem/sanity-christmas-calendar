// Tiny pixel glyphs for HUD controls that have no Kenney sprite. Drawn on an
// 8×8 grid and scaled by whole numbers, matching the world's pixel size.

type PixelProps = { rows: string[]; size?: number; className?: string };

function Pixels({ rows, size = 24, className }: PixelProps) {
  return (
    <svg
      aria-hidden
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      {rows.flatMap((row, y) =>
        [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)),
      )}
    </svg>
  );
}

export function IconRefresh({ spinning }: { spinning?: boolean }) {
  return (
    <Pixels
      className={spinning ? "icon-spin" : undefined}
      rows={[
        "..####..",
        ".#....##",
        "#....###",
        "#.......",
        ".......#",
        "###....#",
        "##....#.",
        "..####..",
      ]}
    />
  );
}

export function IconQuill({ size = 16 }: { size?: number }) {
  return (
    <Pixels
      size={size}
      rows={[
        "......##",
        ".....###",
        "....###.",
        "...###..",
        "..###...",
        ".###....",
        ".##.....",
        "#.......",
      ]}
    />
  );
}

export function IconBook({ size = 16 }: { size?: number }) {
  return (
    <Pixels
      size={size}
      rows={[
        "........",
        ".######.",
        ".#.....#",
        ".#.###.#",
        ".#.....#",
        ".#.###.#",
        ".######.",
        "..#####.",
      ]}
    />
  );
}

export function IconMap({ size = 16 }: { size?: number }) {
  return (
    <Pixels
      size={size}
      rows={[
        "........",
        "##..##..",
        "#.##.###",
        "#..#..##",
        "#.##.#.#",
        "##..##.#",
        ".###..##",
        "........",
      ]}
    />
  );
}

export function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <Pixels
      size={size}
      rows={[
        "........",
        ".......#",
        "......##",
        "#....##.",
        "##..##..",
        ".####...",
        "..##....",
        "........",
      ]}
    />
  );
}

export function IconClose({ size = 16 }: { size?: number }) {
  return (
    <Pixels
      size={size}
      rows={[
        "........",
        ".##..##.",
        "..####..",
        "...##...",
        "..####..",
        ".##..##.",
        "........",
        "........",
      ]}
    />
  );
}
