import type { Element } from "../magic";
import type { MaterialId } from "../materials";
import { ENEMIES, type EnemyId } from "./enemies";
import type { Point } from "./generate";

export const PLAYER_MAX_HP = 10;
export const SWING_REACH = 18;
export const SWING_ARC_DEG = 60; // each side of facing
export const SWING_COOLDOWN_MS = 350;
export const INVULNERABLE_MS = 1000;
export const KNOCK_ENEMY = 8;
export const KNOCK_PLAYER = 6;
export const DRINK_HEAL = 4;
export const MAX_DRINKS = 3;
export const WEAK_MULTIPLIER = 1.5;
export const CHASE_TELL_MS = 250;
export const MIN_WINDUP_MS = 350;
export const AGGRO_RANGE = 112;
export const BITE_START = 14;
export const BITE_RANGE = 16;
export const BITE_REST_MS = 900;
export const CHARGE_TRIGGER = 96;
export const DASH_SPEED = 150;
export const DASH_MAX = 80;
export const DASH_HIT = 10;
export const CHARGE_REST_MS = 1000;
export const KEEP_MIN = 64;
export const KEEP_MAX = 112;
export const SHOOT_RANGE = 160;
export const AIM_MS = 600;
export const SHOT_REST_MS = 400;
export const PROJECTILE_SPEED = 60;
export const PROJECTILE_HIT = 10;
export const PROJECTILE_RANGE = 240;
export const MAX_PROJECTILES = 3;

export type Attack = { damage: number; element: Element | null };
export type Facing = "left" | "right" | "up" | "down";

export function scaleEnemy(
  id: EnemyId,
  depth: number,
): {
  hp: number;
  damage: number;
  windupMs: number | null;
  aimMs: number | null;
  everyMs: number | null;
} {
  const e = ENEMIES[id];
  const n = depth - 1;
  const charge = e.moves.find((m) => m.kind === "charge");
  const shoot = e.moves.find((m) => m.kind === "shoot");
  return {
    hp: Math.round(e.hp * (1 + 0.12 * n)),
    damage: Math.max(1, Math.round(e.damage * (1 + 0.08 * n))),
    windupMs: charge
      ? Math.max(MIN_WINDUP_MS, Math.round(charge.windupMs * (1 - 0.05 * n)))
      : null,
    // The aim tell shortens with depth like the windup, with the same floor.
    aimMs: shoot
      ? Math.max(MIN_WINDUP_MS, Math.round(AIM_MS * (1 - 0.05 * n)))
      : null,
    everyMs: shoot ? shoot.everyMs : null,
  };
}

export function hitEnemy(
  attack: Attack | null,
  id: EnemyId,
  roll: number,
): { damage: number; affinity?: "weak" | "immune" } {
  if (!attack) return { damage: 0 };
  const e = ENEMIES[id];
  const base = attack.damage + roll;
  if (attack.element && e.immuneTo === attack.element)
    return { damage: 0, affinity: "immune" };
  if (attack.element && e.weakTo === attack.element)
    return { damage: Math.round(base * WEAK_MULTIPLIER), affinity: "weak" };
  return { damage: base };
}

export function canSwing(lastAt: number | null, now: number): boolean {
  return lastAt === null || now - lastAt >= SWING_COOLDOWN_MS;
}

// Screen coordinates: "up" is -y.
const FACING_VECTOR: Record<Facing, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

export function inSwing(from: Point, facing: Facing, target: Point): boolean {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist > SWING_REACH) return false;
  if (dist === 0) return true;
  const f = FACING_VECTOR[facing];
  const cos = (dx * f.x + dy * f.y) / dist;
  return cos >= Math.cos((SWING_ARC_DEG * Math.PI) / 180);
}

export function canDrink(
  drunk: string[],
  itemId: string,
  hp: number,
): "ok" | "again" | "limit" | "full" {
  if (hp >= PLAYER_MAX_HP) return "full";
  if (drunk.includes(itemId)) return "again";
  if (drunk.length >= MAX_DRINKS) return "limit";
  return "ok";
}

export function xpFor(id: EnemyId, depth: number): number {
  return ENEMIES[id].xp + 2 * (depth - 1);
}

export function rockDrop(roll: number): MaterialId | null {
  if (roll < 0.4) return "malm";
  if (roll < 0.55) return "isskar";
  return null;
}
