import Phaser from "phaser";
import { bridge } from "../bridge";
import { figureTexture } from "../figureTexture";
import { CAVE_SHEETS, SHEETS, TILE } from "../sprites";
import { moveBox, routeFromOwnTile, type Box } from "../walk";
import { integerZoom, TARGET_VIEW } from "../zoom";
import { PLAYER_MAX_HP } from "./combat";
import { generateFloor, type Floor } from "./generate";
import { CAVE_PROPS } from "./props";

const SPEED = 64; // world px per second, as in the village
const STAIRS_RANGE = 28;
const FADE_MS = 200;

// The cave: one generated floor at a time, seen whole from above. No monsters
// yet; the stairs are always open.
export class CaveScene extends Phaser.Scene {
  private floor!: Floor;
  private depth = 1;
  private busy = false; // a fade is running: ignore input and transitions
  private leaveQueued = false; // «Gå hjem» asked for during a descend fade
  private objects: Phaser.GameObjects.GameObject[] = [];
  private solids: Box[] = [];
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
    this.figureKey = "";

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

  // --- floors ---------------------------------------------------------------

  private buildFloor(previousRoom: string | undefined) {
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
    const seed = Math.floor(Math.random() * 2 ** 31);
    const floor = generateFloor(this.depth, seed, previousRoom);
    this.floor = floor;

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
    ) =>
      this.objects.push(
        this.add.image(at.x, at.y, p.sheet, p.frame).setDepth(at.y - 8),
      );
    prop(CAVE_PROPS.stairs, floor.stairs);
    floor.rocks.forEach((r) => prop(CAVE_PROPS.rock, r));
    if (floor.chest) prop(CAVE_PROPS.chest, floor.chest);

    // Walls, plus one box per rock. Spawns and `locked` are left alone for now.
    this.solids = [
      ...floor.solids,
      ...floor.rocks.map((r) => ({ x: r.x - 8, y: r.y - 8, w: TILE, h: TILE })),
    ];
    this.knight.setPosition(floor.start.x, floor.start.y);
    this.route = [];
  }

  // The world state follows the floor the player is on.
  private announce() {
    bridge.setWorld({
      area: "grotta",
      cave: {
        depth: this.depth,
        hp: PLAYER_MAX_HP,
        maxHp: PLAYER_MAX_HP,
      },
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
    const cam = this.cameras.main;
    cam.fadeOut(FADE_MS);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      bridge.setZone(null);
      bridge.setWorld({ area: "bygda", cave: null });
      this.scene.stop();
      this.scene.wake("WinterQuest"); // the village emits leftCave once awake
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
      if (this.busy || bridge.world.frozen) return;
      const path = routeFromOwnTile(
        this.floor.rows,
        { x: this.knight.x, y: this.knight.y - 2 },
        { x: p.worldX, y: p.worldY + 4 },
      );
      if (!path.length) return;
      this.route = path.map((q) => new Phaser.Math.Vector2(q.x, q.y));
      this.stuckFrames = 0;
    });
  }

  update(_time: number, delta: number) {
    this.moveKnight(delta / 1000);
    this.knight.setDepth(this.knight.y);
    const near =
      Phaser.Math.Distance.Between(
        this.knight.x,
        this.knight.y,
        this.floor.stairs.x,
        this.floor.stairs.y,
      ) < STAIRS_RANGE;
    bridge.setZone(near ? "caveStairs" : null);
  }

  private moveKnight(dt: number) {
    let vx = 0;
    let vy = 0;
    const free = !this.busy && !bridge.world.frozen;
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
      this.knightBody.y = 0;
      this.walkClock = 0;
      return;
    }
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
}
