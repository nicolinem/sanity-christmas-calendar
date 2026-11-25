import {
  AGGRO_RANGE,
  BITE_RANGE,
  BITE_REST_MS,
  BITE_START,
  CHARGE_REST_MS,
  CHARGE_TRIGGER,
  CHASE_TELL_MS,
  DASH_HIT,
  DASH_MAX,
  DASH_SPEED,
  scaleEnemy,
} from "./combat";
import { ENEMIES, type EnemyId } from "./enemies";
import type { Point } from "./generate";

export type Brain = {
  enemy: EnemyId;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  windupMs: number | null;
  mode: "idle" | "chase" | "tell" | "windup" | "dash" | "rest";
  until: number; // scene clock (ms) when the current timed mode ends
  dir: Point; // unit vector locked at windup start
  dashLeft: number; // px of dash distance still unused
  dashStruck: boolean; // a dash strikes at most once
};

export function spawnBrain(enemy: EnemyId, at: Point, depth: number): Brain {
  const s = scaleEnemy(enemy, depth);
  return {
    enemy,
    x: at.x,
    y: at.y,
    hp: s.hp,
    maxHp: s.hp,
    damage: s.damage,
    windupMs: s.windupMs,
    mode: "idle",
    until: 0,
    dir: { x: 0, y: 0 },
    dashLeft: 0,
    dashStruck: false,
  };
}

export function stepBrain(
  b: Brain,
  player: Point,
  now: number,
  dtSec: number,
  move: (from: Point, dx: number, dy: number) => Point,
): { brain: Brain; strike: number } {
  let n: Brain = { ...b, dir: { ...b.dir } };
  let strike = 0;
  const dx = player.x - n.x;
  const dy = player.y - n.y;
  const dist = Math.hypot(dx, dy);

  if (n.mode === "idle" && dist <= AGGRO_RANGE) n.mode = "chase";
  if (n.mode === "rest" && now >= n.until) n.mode = "chase";

  if (n.mode === "chase") {
    if (n.windupMs !== null && dist < CHARGE_TRIGGER) {
      n.mode = "windup";
      n.until = now + n.windupMs;
      n.dir = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 };
      n.dashLeft = DASH_MAX;
      n.dashStruck = false;
    } else if (n.windupMs === null && dist <= BITE_START) {
      n.mode = "tell";
      n.until = now + CHASE_TELL_MS;
    } else if (dist > 0) {
      const step = ENEMIES[n.enemy].speed * dtSec;
      const p = move(
        { x: n.x, y: n.y },
        (dx / dist) * step,
        (dy / dist) * step,
      );
      n.x = p.x;
      n.y = p.y;
    }
  } else if (n.mode === "tell" && now >= n.until) {
    if (dist <= BITE_RANGE) strike = n.damage;
    n.mode = "rest";
    n.until = now + BITE_REST_MS;
  } else if (n.mode === "windup" && now >= n.until) {
    n.mode = "dash";
  } else if (n.mode === "dash") {
    const step = Math.min(DASH_SPEED * dtSec, n.dashLeft);
    const p = move({ x: n.x, y: n.y }, n.dir.x * step, n.dir.y * step);
    const blocked = p.x === n.x && p.y === n.y;
    n.x = p.x;
    n.y = p.y;
    n.dashLeft -= step;
    if (
      !n.dashStruck &&
      Math.hypot(player.x - n.x, player.y - n.y) <= DASH_HIT
    ) {
      strike = n.damage;
      n.dashStruck = true;
    }
    if (blocked || n.dashLeft <= 0) {
      n.mode = "rest";
      n.until = now + CHARGE_REST_MS;
    }
  }
  return { brain: n, strike };
}
