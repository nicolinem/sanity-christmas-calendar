// Sprites for the things that stand on a cave floor. `entrance` is the pair of
// tiles for the way into the cave.
export const CAVE_PROPS = {
  stairs: { sheet: "dungeon", frame: 55 },
  rock: { sheet: "ski", frame: 81 },
  chest: { sheet: "dungeon", frame: 89 },
  entrance: [
    { sheet: "dungeon", frame: 10 },
    { sheet: "dungeon", frame: 11 },
  ],
} as const;
