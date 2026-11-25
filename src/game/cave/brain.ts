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
  KEEP_MAX,
  KEEP_MIN,
  SHOOT_RANGE,
  SHOT_REST_MS,
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
  aimMs: number | null;
  everyMs: number | null;
  mode: "idle" | "chase" | "tell" | "windup" | "dash" | "aim" | "rest";
  until: number; // scene clock (ms) when the current timed mode ends
  dir: Point; // unit vector locked at windup start
  dashLeft: number; // px of dash distance still unused
  dashStruck: boolean; // a dash strikes at most once
  nextShotAt: number; // scene clock (ms); 0 = may shoot at once
  aimDir: Point; // unit vector locked toward the player at aim start
};

export type Shot = { x: number; y: number; dir: Point; damage: number };

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
    aimMs: s.aimMs,
    everyMs: s.everyMs,
    mode: "idle",
    until: 0,
    dir: { x: 0, y: 0 },
    dashLeft: 0,
    dashStruck: false,
    nextShotAt: 0,
    aimDir: { x: 1, y: 0 },
  };
}

export function stepBrain(
  b: Brain,
  player: Point,
  now: number,
  dtSec: number,
  move: (from: Point, dx: number, dy: number) => Point,
  canWake = true, // the scene says whether an idle brain may wake (same room)
): { brain: Brain; strike: number; shot?: Shot } {
  const n: Brain = { ...b, dir: { ...b.dir }, aimDir: { ...b.aimDir } };
  let strike = 0;
  let shot: Shot | undefined;
  const dx = player.x - n.x;
  const dy = player.y - n.y;
  const dist = Math.hypot(dx, dy);

  if (n.mode === "idle" && canWake && dist <= AGGRO_RANGE) n.mode = "chase";
  if (n.mode === "rest" && now >= n.until) n.mode = "chase";

  const walk = (sign: number) => {
    if (dist === 0) return;
    const step = ENEMIES[n.enemy].speed * dtSec * sign;
    const p = move({ x: n.x, y: n.y }, (dx / dist) * step, (dy / dist) * step);
    n.x = p.x;
    n.y = p.y;
  };
  const canShoot =
    n.aimMs !== null && now >= n.nextShotAt && dist <= SHOOT_RANGE;

  if (n.mode === "chase") {
    if (n.windupMs !== null && dist < CHARGE_TRIGGER) {
      n.mode = "windup";
      n.until = now + n.windupMs;
      n.dir = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 };
      n.dashLeft = DASH_MAX;
      n.dashStruck = false;
    } else if (canShoot) {
      n.mode = "aim";
      n.until = now + (n.aimMs ?? 0);
      n.aimDir = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 };
    } else if (n.aimMs !== null && n.windupMs === null) {
      // A pure shooter keeps its distance and otherwise stands still.
      if (dist < KEEP_MIN) walk(-1);
      else if (dist > KEEP_MAX) walk(1);
    } else if (n.windupMs === null && dist <= BITE_START) {
      n.mode = "tell";
      n.until = now + CHASE_TELL_MS;
    } else {
      walk(1);
    }
  } else if (n.mode === "aim" && now >= n.until) {
    // The shot leaves from the brain's own position along the locked aim.
    shot = { x: n.x, y: n.y, dir: { ...n.aimDir }, damage: n.damage };
    n.mode = "rest";
    n.until = now + SHOT_REST_MS;
    n.nextShotAt = now + (n.everyMs ?? 0);
  } else if (n.mode === "tell" && now >= n.until) {
    if (dist <= BITE_RANGE) strike = n.damage;
    n.mode = "rest";
    n.until = now + BITE_REST_MS;
  } else if (n.mode === "windup" && now >= n.until) {
    n.mode = "dash";
  } else if (n.mode === "dash") {
    const step = Math.min(DASH_SPEED * dtSec, n.dashLeft);
    const p = move({ x: n.x, y: n.y }, n.dir.x * step, n.dir.y * step);
    // A step of 0 (a frame with no time) is not a wall.
    const blocked = step > 0 && p.x === n.x && p.y === n.y;
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
  return shot ? { brain: n, strike, shot } : { brain: n, strike };
}
