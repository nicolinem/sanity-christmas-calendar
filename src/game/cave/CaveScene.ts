import Phaser from "phaser";
import { bridge } from "../bridge";
import { figureTexture } from "../figureTexture";
import { MATERIALS } from "../materials";
import { CAVE_SHEETS, SHEETS, TILE } from "../sprites";
import { moveBox, routeFromOwnTile, type Box } from "../walk";
import { integerZoom, TARGET_VIEW } from "../zoom";
import { spawnBrain, stepBrain, type Brain } from "./brain";
import {
  canDrink,
  canSwing,
  DASH_MAX,
  DRINK_HEAL,
  hitEnemy,
  inSwing,
  INVULNERABLE_MS,
  KNOCK_ENEMY,
  KNOCK_PLAYER,
  PLAYER_MAX_HP,
  rockDrop,
  type Facing,
} from "./combat";
import { ENEMIES, PLAYABLE } from "./enemies";
import { generateFloor, type Floor, type Point } from "./generate";
import { CAVE_PROPS } from "./props";

const SPEED = 64; // world px per second, as in the village
const STAIRS_RANGE = 28;
const FADE_MS = 200;
const MAX_STEP_MS = 50; // a long frame (tab switch, GC) is cut to this
const MAX_MONSTERS = 6;
const FLASH_MS = 90; // white flash on a monster that was hit
const MARK_GAP = 10; // px between the marks of a charge's line

const FACING_STEP: Record<Facing, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

type Monster = {
  brain: Brain;
  body: Phaser.GameObjects.Container; // at the feet, like the knight
  sprite: Phaser.GameObjects.Image;
  marks: Phaser.GameObjects.Image[]; // the charge's line, only during windup
  flashUntil: number; // scene clock
  white: boolean; // the sprite is drawn with a white fill tint
};

type Rock = Point & { image: Phaser.GameObjects.Image; box: Box };

// The cave: one generated floor at a time, seen whole from above. Monsters
// chase and strike, the knight swings, rocks break, and drinks heal. Nothing
// moves and no timer runs while the cave is held (fade, dialogue, Studio).
export class CaveScene extends Phaser.Scene {
  private floor!: Floor;
  private rows: string[] = []; // floor.rows with broken rocks opened up
  private depth = 1;
  private busy = false; // a fade is running: ignore input and transitions
  private leaveQueued = false; // «Gå hjem» asked for during a descend fade
  private objects: Phaser.GameObjects.GameObject[] = [];
  private solids: Box[] = [];
  private monsters: Monster[] = [];
  private rocks: Rock[] = [];
  private knight!: Phaser.GameObjects.Container;
  private knightBody!: Phaser.GameObjects.Image;
  private figureKey = "";
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<
    "up" | "down" | "left" | "right",
    Phaser.Input.Keyboard.Key
  >;
  private route: Phaser.Math.Vector2[] = [];
  private stuckFrames = 0;
  private walkClock = 0;
  private unsubscribe: (() => void)[] = [];
  private font = "monospace";
  private reducedMotion = false;
  // The scene's own clock (ms). It stands still while held, so every combat
  // timer pauses with it.
  private clock = 0;
  private hp = PLAYER_MAX_HP;
  private invulnerableUntil = 0;
  private lastSwingAt: number | null = null;
  private facing: Facing = "down";
  private drunk: string[] = []; // drinks used this trip

  constructor() {
    super("Cave");
  }

  preload() {
    const frame = { frameWidth: TILE, frameHeight: TILE };
    for (const key of CAVE_SHEETS)
      if (!this.textures.exists(key))
        this.load.spritesheet(key, SHEETS[key].url, frame);
  }

  create(data: { depth?: number }) {
    this.depth = Math.max(1, Math.floor(data?.depth ?? 1));
    this.busy = false;
    this.leaveQueued = false;
    this.route = [];
    this.stuckFrames = 0;
    this.objects = [];
    this.monsters = [];
    this.rocks = [];
    this.figureKey = "";
    this.clock = 0;
    this.hp = PLAYER_MAX_HP;
    this.invulnerableUntil = 0;
    this.lastSwingAt = null;
    this.facing = "down";
    this.drunk = [];
    this.font =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--font-ui")
        .trim() || "monospace";
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const shadow = this.add.image(0, 1, "shadow");
    this.knightBody = this.add.image(0, 0, "dungeon", 96).setOrigin(0.5, 1);
    this.knight = this.add.container(0, 0, [shadow, this.knightBody]);

    this.setupInput();
    this.buildFloor(undefined);
    this.setFigure(bridge.world.figure);

    const cam = this.cameras.main;
    cam.setBackgroundColor("#181425");
    cam.setRoundPixels(true);
    const fit = () => {
      const { width, height } = this.scale;
      cam.setZoom(integerZoom(width, height, TARGET_VIEW));
      cam.centerOn(
        (this.floor.rows[0].length * TILE) / 2,
        (this.floor.rows.length * TILE) / 2,
      );
    };
    fit();
    this.scale.on(Phaser.Scale.Events.RESIZE, fit);
    cam.fadeIn(FADE_MS);

    this.unsubscribe.push(
      bridge.on("world", (w) => this.setFigure(w.figure)),
      bridge.on("descend", () => this.descend()),
      bridge.on("leaveCave", () => this.leave()),
      bridge.on("caveAttack", () => this.swing()),
      bridge.on("drink", (id) => this.drink(id)),
    );
    this.announce();
    bridge.emit("reachedFloor", this.depth); // the first floor counts too

    const teardown = () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, fit);
      this.unsubscribe.forEach((u) => u());
      this.unsubscribe = [];
      bridge.setZone(null);
    };
    // game.destroy() only fires DESTROY; a scene stop only fires SHUTDOWN.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, teardown);
    this.events.once(Phaser.Scenes.Events.DESTROY, teardown);
  }

  // Busy with a fade, a dialogue open, or the player away: nothing moves.
  private held() {
    return this.busy || bridge.world.frozen || bridge.world.away;
  }

  // --- floors ---------------------------------------------------------------

  private buildFloor(previousRoom: string | undefined) {
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
    this.monsters.forEach((m) => this.removeMonster(m));
    this.rocks.forEach((r) => r.image.destroy());
    this.rocks = [];
    const seed = Math.floor(Math.random() * 2 ** 31);
    const floor = generateFloor(this.depth, seed, previousRoom);
    this.floor = floor;
    this.rows = [...floor.rows];

    floor.tiles.forEach((row, y) =>
      row.forEach((frame, x) =>
        this.objects.push(
          this.add
            .image(x * TILE, y * TILE, floor.sheet, frame)
            .setOrigin(0)
            .setDepth(-1),
        ),
      ),
    );
    const prop = (
      p: { sheet: "dungeon" | "ski"; frame: number },
      at: { x: number; y: number },
    ) => this.add.image(at.x, at.y, p.sheet, p.frame).setDepth(at.y - 8);
    this.objects.push(prop(CAVE_PROPS.stairs, floor.stairs));
    if (floor.chest) this.objects.push(prop(CAVE_PROPS.chest, floor.chest));
    this.rocks = floor.rocks.map((r) => ({
      x: r.x,
      y: r.y,
      image: prop(CAVE_PROPS.rock, r),
      box: { x: r.x - 8, y: r.y - 8, w: TILE, h: TILE },
    }));

    // Walls, plus one box per rock. `locked` is left alone for now.
    this.solids = [...floor.solids, ...this.rocks.map((r) => r.box)];

    this.monsters = floor.spawns
      .filter((s) => PLAYABLE.includes(s.enemy))
      .slice(0, MAX_MONSTERS)
      .map((s) => {
        const def = ENEMIES[s.enemy].sprite;
        const sprite = this.add
          .image(0, 0, def.sheet, def.frame)
          .setOrigin(0.5, 1);
        const body = this.add.container(s.x, s.y, [
          this.add.image(0, 1, "shadow"),
          sprite,
        ]);
        return {
          brain: spawnBrain(s.enemy, s, this.depth),
          body,
          sprite,
          marks: [],
          flashUntil: 0,
          white: false,
        };
      });

    // A blink in progress ends with the floor; invulnerability itself carries.
    this.knight.setPosition(floor.start.x, floor.start.y).setAlpha(1);
    this.route = [];
  }

  // The world state follows the floor the player is on and the life left.
  private announce() {
    bridge.setWorld({
      area: "grotta",
      cave: { depth: this.depth, hp: this.hp, maxHp: PLAYER_MAX_HP },
    });
  }

  private descend() {
    if (this.busy) return;
    this.busy = true;
    const cam = this.cameras.main;
    cam.fadeOut(FADE_MS);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.depth += 1;
      this.buildFloor(this.floor.room);
      this.announce();
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
        this.busy = false;
        if (this.leaveQueued) this.leave();
      });
      cam.fadeIn(FADE_MS);
      bridge.emit("reachedFloor", this.depth);
    });
  }

  private leave() {
    if (this.busy) {
      this.leaveQueued = true;
      return;
    }
    this.busy = true;
    this.fadeHome(false);
  }

  // Out of the cave: to the entrance, or to Brann after fainting.
  private fadeHome(fainted: boolean) {
    const cam = this.cameras.main;
    cam.fadeOut(FADE_MS);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      bridge.setZone(null);
      bridge.setWorld({ area: "bygda", cave: null });
      this.scene.stop();
      // The village emits leftCave once awake.
      if (fainted) this.scene.wake("WinterQuest", { at: "brann" });
      else this.scene.wake("WinterQuest");
    });
  }

  // Out of life: the trip's finds are dropped (React, on `fainted`) before
  // the village wakes and banks what is left.
  private faint() {
    if (this.busy) return;
    this.busy = true;
    this.leaveQueued = false;
    bridge.emit("fainted", undefined);
    this.puff(this.knight.x, this.knight.y);
    this.tweens.add({
      targets: this.knight,
      alpha: 0,
      duration: 450,
      onComplete: () => this.fadeHome(true),
    });
  }

  // --- the player -----------------------------------------------------------

  private setFigure(choice: typeof bridge.world.figure) {
    if (!choice) {
      if (this.figureKey) this.knightBody.setTexture("dungeon", 96);
      this.figureKey = "";
      return;
    }
    const key = figureTexture(this.textures, choice);
    if (key === this.figureKey) return;
    this.knightBody.setTexture(key);
    this.figureKey = key;
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    // Space and Shift belong to the HUD, not movement.
    kb.removeCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
    ]);
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    // Tap to walk. Nothing to reach (or already there) leaves things be.
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.held()) return;
      const path = routeFromOwnTile(
        this.rows,
        { x: this.knight.x, y: this.knight.y - 2 },
        { x: p.worldX, y: p.worldY + 4 },
      );
      if (!path.length) return;
      this.route = path.map((q) => new Phaser.Math.Vector2(q.x, q.y));
      this.stuckFrames = 0;
    });
  }

  update(_time: number, delta: number) {
    const ms = Math.min(delta, MAX_STEP_MS);
    const held = this.held();
    if (!held) this.clock += ms;
    this.moveKnight(ms / 1000, !held);
    this.knight.setDepth(this.knight.y);
    if (!held) {
      this.stepMonsters(ms / 1000);
      // Blink while nothing can hurt the player.
      const safe = this.clock < this.invulnerableUntil;
      this.knight.alpha = safe && Math.floor(this.clock / 80) % 2 ? 0.3 : 1;
    }
    this.monsters.forEach((m) => this.drawMonster(m));
    const near =
      Phaser.Math.Distance.Between(
        this.knight.x,
        this.knight.y,
        this.floor.stairs.x,
        this.floor.stairs.y,
      ) < STAIRS_RANGE;
    bridge.setZone(near ? "caveStairs" : null);
  }

  private moveKnight(dt: number, free: boolean) {
    let vx = 0;
    let vy = 0;
    if (free) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;
    }

    const target = this.route[0];
    if (!free) {
      this.route = [];
    } else if (vx || vy) {
      this.route = [];
    } else if (target) {
      const dx = target.x - this.knight.x;
      const dy = target.y - this.knight.y;
      if (this.stuckFrames > 8) this.route = [];
      else if (Math.hypot(dx, dy) < 2) {
        this.route.shift();
        this.stuckFrames = 0;
      } else {
        vx = dx;
        vy = dy;
      }
    }

    const len = Math.hypot(vx, vy);
    if (!len) {
      // Only after walking, so a lunge's nudge is left to finish.
      if (this.walkClock) this.knightBody.y = 0;
      this.walkClock = 0;
      return;
    }
    // Horizontal wins on diagonals.
    if (Math.abs(vx) >= Math.abs(vy)) this.facing = vx < 0 ? "left" : "right";
    else this.facing = vy < 0 ? "up" : "down";
    const step = SPEED * dt;
    const before = { x: this.knight.x, y: this.knight.y };
    for (const [dx, dy] of [
      [(vx / len) * step, 0],
      [0, (vy / len) * step],
    ]) {
      const p = moveBox(this.knight, dx, dy, this.solids);
      this.knight.setPosition(p.x, p.y);
    }
    const moved = Math.hypot(
      this.knight.x - before.x,
      this.knight.y - before.y,
    );
    this.stuckFrames = moved < step * 0.3 ? this.stuckFrames + 1 : 0;
    if (vx) this.knight.scaleX = vx < 0 ? -1 : 1;
    this.walkClock += dt;
    this.knightBody.y = Math.floor(this.walkClock * 8) % 2 ? -1 : 0;
  }

  // Monsters and the knight's knockback slide along walls and rocks alike.
  private move = (from: Point, dx: number, dy: number) =>
    moveBox(from, dx, dy, this.solids);

  private feet(): Point {
    return { x: this.knight.x, y: this.knight.y };
  }

  // --- monsters -------------------------------------------------------------

  private stepMonsters(dt: number) {
    for (const m of this.monsters) {
      const r = stepBrain(m.brain, this.feet(), this.clock, dt, this.move);
      m.brain = r.brain;
      if (r.strike > 0) this.struck(m.brain, r.strike);
      if (this.busy) return; // fainted
    }
  }

  private struck(from: Point, damage: number) {
    if (bridge.world.caveGod || this.clock < this.invulnerableUntil) return;
    this.hp = Math.max(0, this.hp - damage);
    this.invulnerableUntil = this.clock + INVULNERABLE_MS;
    const away = this.away(from, this.feet());
    const p = this.move(
      this.knight,
      away.x * KNOCK_PLAYER,
      away.y * KNOCK_PLAYER,
    );
    this.knight.setPosition(p.x, p.y);
    if (!this.reducedMotion) this.cameras.main.shake(120, 0.004);
    this.announce();
    if (this.hp <= 0) this.faint();
  }

  // Unit vector from `a` to `b`; the way the knight faces if they overlap.
  private away(a: Point, b: Point): Point {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    return d > 0 ? { x: dx / d, y: dy / d } : FACING_STEP[this.facing];
  }

  private drawMonster(m: Monster) {
    const b = m.brain;
    m.body.setPosition(b.x, b.y).setDepth(b.y);
    // The bite's tell: a ±1 px shake.
    m.sprite.x =
      b.mode === "tell" ? (Math.floor(this.clock / 40) % 2) * 2 - 1 : 0;

    const windup = b.mode === "windup";
    if (windup && !m.marks.length) {
      // The charge's line, drawn once when the windup starts.
      for (let d = MARK_GAP; d <= DASH_MAX; d += MARK_GAP)
        m.marks.push(
          this.add
            .image(b.x + b.dir.x * d, b.y + b.dir.y * d, "shadow")
            .setTint(0xffffff)
            .setTintMode(Phaser.TintModes.FILL)
            .setDepth(-0.5),
        );
    } else if (!windup && m.marks.length) {
      m.marks.forEach((i) => i.destroy());
      m.marks = [];
    }

    const white = windup || this.clock < m.flashUntil;
    if (white === m.white) return;
    m.white = white;
    if (white) m.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else m.sprite.clearTint();
  }

  private removeMonster(m: Monster) {
    m.marks.forEach((i) => i.destroy());
    m.body.destroy();
    this.monsters = this.monsters.filter((x) => x !== m);
  }

  // --- the swing ------------------------------------------------------------

  private swing() {
    if (this.held() || !canSwing(this.lastSwingAt, this.clock)) return;
    this.lastSwingAt = this.clock;
    this.lunge();
    const attack = bridge.world.attack;
    const from = this.feet();
    if (!attack) {
      this.floatText(this.knight.x, this.knight.y, "ingen skade", "#c0cbdc");
      return; // no damage, no knockback, no broken rocks
    }

    for (const m of [...this.monsters]) {
      if (!inSwing(from, this.facing, m.brain)) continue;
      const hit = hitEnemy(attack, m.brain.enemy, Phaser.Math.Between(0, 2));
      const { x, y } = m.brain;
      if (hit.affinity === "immune") this.floatText(x, y, "immun", "#8fd3ff");
      else if (hit.affinity === "weak")
        this.floatText(x, y, `-${hit.damage}!`, "#ff8a3c");
      else this.floatText(x, y, `-${hit.damage}`, "#fdbe53");
      const hp = m.brain.hp - hit.damage;
      if (hp <= 0) {
        this.puff(x, y);
        this.removeMonster(m);
        bridge.emit("enemyDefeated", {
          enemy: m.brain.enemy,
          depth: this.depth,
        });
        continue;
      }
      const away = this.away(from, m.brain);
      const p = this.move(m.brain, away.x * KNOCK_ENEMY, away.y * KNOCK_ENEMY);
      m.brain = { ...m.brain, hp, x: p.x, y: p.y };
      m.flashUntil = this.clock + FLASH_MS;
    }

    for (const r of this.rocks.filter((r) => inSwing(from, this.facing, r)))
      this.breakRock(r);
  }

  private breakRock(r: Rock) {
    r.image.destroy();
    this.rocks = this.rocks.filter((x) => x !== r);
    this.solids = this.solids.filter((s) => s !== r.box);
    const tx = Math.floor(r.x / TILE);
    const ty = Math.floor(r.y / TILE);
    const row = this.rows[ty];
    this.rows[ty] = row.slice(0, tx) + "." + row.slice(tx + 1);
    this.puff(r.x, r.y + 8, [0x8b9bb4, 0xc0cbdc], 10);
    const item = rockDrop(Math.random());
    if (!item) return;
    this.floatText(r.x, r.y + 8, "+1 " + MATERIALS[item].name, "#fdbe53");
    bridge.emit("found", { item, count: 1 });
  }

  // As the village's lunge, toward where the knight faces.
  private lunge() {
    const along = this.facing === "left" || this.facing === "right";
    if (along) this.knight.scaleX = this.facing === "left" ? -1 : 1;
    this.tweens.killTweensOf(this.knightBody);
    this.knightBody.x = 0;
    this.tweens.add({
      targets: this.knightBody,
      ...(along
        ? { x: { from: 0, to: 3 } }
        : { y: { from: 0, to: this.facing === "up" ? -3 : 3 } }),
      duration: 90,
      yoyo: true,
    });
  }

  // --- drinks ---------------------------------------------------------------

  private drink(id: string) {
    if (this.busy || this.hp <= 0) return; // fading or fainted: not now
    const result = canDrink(this.drunk, id, this.hp);
    if (result === "ok") {
      this.hp = Math.min(PLAYER_MAX_HP, this.hp + DRINK_HEAL);
      this.drunk = [...this.drunk, id];
      this.floatText(this.knight.x, this.knight.y, "+2", "#63c74d");
      this.announce();
    }
    bridge.emit("drinkResult", result);
  }

  // --- effects --------------------------------------------------------------

  // `x, y` are feet; the text rises from above the head.
  private floatText(x: number, y: number, value: string, color: string) {
    const t = this.add
      .text(x, y - 16, value, {
        fontFamily: this.font,
        fontSize: "9px",
        color,
        stroke: "#262b44",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setResolution(6)
      .setDepth(10010);
    this.tweens.add({
      targets: t,
      y: "-=12",
      alpha: 0,
      duration: 800,
      ease: "Cubic.out",
      onComplete: () => t.destroy(),
    });
  }

  // A snow puff, as the snow monster's in the village.
  private puff(x: number, y: number, tint = [0xffffff, 0xbfe4ff], count = 18) {
    const p = this.add
      .particles(x, y - 8, "px", {
        speed: { min: 10, max: 34 },
        lifespan: 700,
        quantity: count,
        tint,
        alpha: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(10010);
    p.explode(count);
    this.time.delayedCall(800, () => p.destroy());
  }
}
