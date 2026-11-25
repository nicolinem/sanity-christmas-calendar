import type { Element } from "../magic";
import type { SpriteDef } from "../sprites";

export type EnemyId =
  "rat" | "slime" | "bat" | "spider" | "troll" | "cyclops" | "yeti" | "drake";

export type Move =
  | { kind: "chase" }
  | { kind: "charge"; windupMs: number }
  | { kind: "shoot"; projectile: SpriteDef; everyMs: number };

export type EnemyDef = {
  name: string;
  sprite: SpriteDef;
  from: number;
  boss?: true;
  hp: number;
  damage: number;
  speed: number;
  moves: Move[];
  xp: number;
  weakTo?: Element;
  immuneTo?: Element;
  flies?: true;
  // The sheet frame looks right; the scene assumes left unless this is set.
  facesRight?: true;
};

const d = (frame: number): SpriteDef => ({ sheet: "dungeon", frame });
const ski = (frame: number): SpriteDef => ({ sheet: "ski", frame });

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  rat: {
    name: "Rotte",
    sprite: d(123),
    from: 1,
    hp: 12,
    damage: 1,
    speed: 46,
    moves: [{ kind: "chase" }],
    xp: 10,
    facesRight: true,
  },
  slime: {
    name: "Slim",
    sprite: d(108),
    from: 1,
    hp: 18,
    damage: 1,
    speed: 22,
    moves: [{ kind: "chase" }],
    weakTo: "fire",
    xp: 10,
  },
  bat: {
    name: "Flaggermus",
    sprite: d(120),
    from: 3,
    hp: 8,
    damage: 1,
    speed: 40,
    moves: [{ kind: "chase" }],
    flies: true,
    xp: 12,
  },
  spider: {
    name: "Edderkopp",
    sprite: d(122),
    from: 5,
    hp: 14,
    damage: 2,
    speed: 30,
    moves: [{ kind: "charge", windupMs: 600 }],
    xp: 16,
  },
  troll: {
    name: "Troll",
    sprite: d(112),
    from: 6,
    hp: 24,
    damage: 2,
    speed: 18,
    moves: [{ kind: "charge", windupMs: 900 }],
    immuneTo: "poison",
    xp: 20,
  },
  cyclops: {
    name: "Kyklop",
    sprite: d(109),
    from: 8,
    hp: 16,
    damage: 2,
    speed: 20,
    moves: [{ kind: "shoot", projectile: d(56), everyMs: 2200 }],
    weakTo: "lightning",
    xp: 20,
  },
  yeti: {
    name: "Isvette",
    sprite: ski(78),
    from: 5,
    hp: 70,
    damage: 2,
    speed: 26,
    moves: [{ kind: "charge", windupMs: 700 }],
    weakTo: "fire",
    boss: true,
    xp: 100,
  },
  drake: {
    name: "Isdrage",
    sprite: d(110),
    from: 10,
    hp: 140,
    damage: 2,
    speed: 24,
    moves: [
      { kind: "charge", windupMs: 600 },
      { kind: "shoot", projectile: d(56), everyMs: 1800 },
    ],
    weakTo: "fire",
    immuneTo: "frost",
    boss: true,
    xp: 100,
  },
};

// The only kinds the scene draws.
export const PLAYABLE: EnemyId[] = [
  "rat",
  "slime",
  "bat",
  "spider",
  "troll",
  "cyclops",
];

export function enemiesAt(depth: number): EnemyId[] {
  return (Object.keys(ENEMIES) as EnemyId[]).filter(
    (id) => !ENEMIES[id].boss && ENEMIES[id].from <= depth,
  );
}
