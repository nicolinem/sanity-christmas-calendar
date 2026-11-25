import { PROJECTILE_HIT, PROJECTILE_RANGE, PROJECTILE_SPEED } from "./combat";
import type { Point } from "./generate";

export type Projectile = {
  x: number;
  y: number;
  dir: Point;
  damage: number;
  travelled: number;
  alive: boolean;
};

export function spawnProjectile(shot: {
  x: number;
  y: number;
  dir: Point;
  damage: number;
}): Projectile {
  return {
    x: shot.x,
    y: shot.y,
    dir: { ...shot.dir },
    damage: shot.damage,
    travelled: 0,
    alive: true,
  };
}

export function stepProjectile(
  p: Projectile,
  dtSec: number,
  blocked: (x: number, y: number) => boolean,
  player: Point,
): { p: Projectile; hit: number } {
  if (!p.alive || dtSec <= 0) return { p, hit: 0 };
  const step = PROJECTILE_SPEED * dtSec;
  const n: Projectile = {
    ...p,
    dir: { ...p.dir },
    x: p.x + p.dir.x * step,
    y: p.y + p.dir.y * step,
    travelled: p.travelled + step,
  };
  if (blocked(n.x, n.y) || n.travelled > PROJECTILE_RANGE) {
    n.alive = false;
    return { p: n, hit: 0 };
  }
  if (Math.hypot(player.x - n.x, player.y - n.y) <= PROJECTILE_HIT) {
    n.alive = false;
    return { p: n, hit: n.damage };
  }
  return { p: n, hit: 0 };
}
