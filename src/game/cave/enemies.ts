import type { SpriteDef } from "../sprites";

export type EnemyId =
  "rat" | "slime" | "bat" | "spider" | "troll" | "cyclops" | "yeti" | "drake";

export const ENEMIES: Record<
  EnemyId,
  { name: string; sprite: SpriteDef; from: number; boss?: true }
> = {
  rat: { name: "Rotte", sprite: { sheet: "dungeon", frame: 123 }, from: 1 },
  slime: { name: "Slim", sprite: { sheet: "dungeon", frame: 108 }, from: 1 },
  bat: {
    name: "Flaggermus",
    sprite: { sheet: "dungeon", frame: 120 },
    from: 3,
  },
  spider: {
    name: "Edderkopp",
    sprite: { sheet: "dungeon", frame: 122 },
    from: 5,
  },
  troll: { name: "Troll", sprite: { sheet: "dungeon", frame: 112 }, from: 6 },
  cyclops: {
    name: "Kyklop",
    sprite: { sheet: "dungeon", frame: 109 },
    from: 8,
  },
  yeti: {
    name: "Isvette",
    sprite: { sheet: "ski", frame: 78 },
    from: 5,
    boss: true,
  },
  drake: {
    name: "Isdrage",
    sprite: { sheet: "dungeon", frame: 110 },
    from: 10,
    boss: true,
  },
};

export function enemiesAt(depth: number): EnemyId[] {
  return (Object.keys(ENEMIES) as EnemyId[]).filter(
    (id) => !ENEMIES[id].boss && ENEMIES[id].from <= depth,
  );
}
