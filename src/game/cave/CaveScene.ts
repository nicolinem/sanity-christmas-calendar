import Phaser from "phaser";
import { bridge, type Zone } from "../bridge";
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
import { ENEMIES, PLAYABLE, type EnemyId } from "./enemies";
import { generateFloor, type Floor, type Point } from "./generate";
import { roomAt } from "./layout";
import {
  AMBIENT,
  AMBIENT_DEEP,
  CAMERA_PAD_TILES,
  DEEP_FROM,
  MARKER_LIGHT,
  PLAYER_LIGHT,
  ROOF_TINT,
  SNOW,
  TORCH_FLICKER,
  TORCH_LIGHT,
} from "./mood";
import { CAVE_PROPS } from "./props";
import { CAVE_FRAMES } from "./rooms";

const SPEED = 64; // world px per second, as in the village
const STAIRS_RANGE = 28;
const CACHE_RANGE = 24;
const CHEST_OPEN_FRAME = 91; // dungeon sheet: the chest with its lid up
const CHEST_RANGE = 24;
const CHEST_DEPTH = 5; // the only rest floor whose chest opens for now
const BOSS: EnemyId = "yeti"; // the only boss drawn for now
const BOSS_NAME = "Isvetten";
const SUMMON_GAP = 20; // px left and right of the boss for its two rats
const LOCKED_TINT = 0x555a70; // the stairs while their room still has monsters
const PULSE_MS = 300; // each half of the light pulse when the stairs open
const FADE_MS = 200;
const MAX_STEP_MS = 50; // a long frame (tab switch, GC) is cut to this
const FLASH_MS = 90; // white flash on a monster that was hit
const MARK_GAP = 10; // px between the marks of a charge's line
const FLOOR_TEXTURE = "cave-floor"; // floor and walls, baked once per floor

const FACING_STEP: Record<Facing, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

type Monster = {
  brain: Brain;
  room: number; // the room it spawned in; it wakes only when the knight is there
  move: (from: Point, dx: number, dy: number) => Point; // bats fly over rocks
  body: Phaser.GameObjects.Container; // at the feet, like the knight
  sprite: Phaser.GameObjects.Image;
  facesRight: boolean; // the sheet frame looks right, not left
  marks: Phaser.GameObjects.Image[]; // the charge's line, only during windup
  flashUntil: number; // scene clock
  white: boolean; // the sprite is drawn with a white fill tint
};

type Rock = Point & { image: Phaser.GameObjects.Image; box: Box };

// The cave: one generated floor at a time, seen from above; the camera follows
// the knight when the floor is bigger than the view. Monsters chase and
// strike, the knight swings, rocks break, and drinks heal. Nothing moves and
// no timer runs while the cave is held (fade, dialogue, Studio).
export class CaveScene extends Phaser.Scene {
  private floor!: Floor;
  private rows: string[] = []; // floor.rows with broken rocks opened up
  private depth = 1;
  private busy = false; // a fade is running: ignore input and transitions
  private leaveQueued = false; // «Gå hjem» asked for during a descend fade
  private objects: Phaser.GameObjects.GameObject[] = [];
  private floorImage: Phaser.GameObjects.Image | null = null; // the baked floor
  // One image per torch over the baked floor, so each can be lit on its own.
  private torches: Phaser.GameObjects.Image[] = [];
  // WebGL lighting is on; Canvas has none and draws everything unlit.
  private lit = false;
  private knightLight: Phaser.GameObjects.Light | null = null;
  private torchLights: Phaser.GameObjects.Light[] = [];
  // Stairs (and chest) glow; steady, so the flicker loop leaves them alone.
  private markerLights: Phaser.GameObjects.Light[] = [];
  private stairsImage: Phaser.GameObjects.Image | null = null;
  // The stairs room still has monsters: no way down until they are gone.
  private stairsLocked = false;
  private lockShown = false; // last world.cave.stairsLocked sent to the HUD
  private cacheImage: Phaser.GameObjects.Image | null = null;
  private cacheOpened = false;
  private chestImage: Phaser.GameObjects.Image | null = null;
  private chestOpened = false;
  // The floor's boss while it lives, and whether it has called its rats.
  private boss: Monster | null = null;
  private summoned = false;
  private restsReached: number[] = []; // rest depths reached on this trip
  private snow: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  // Each flake starts somewhere along the top edge of the view, read when it
  // is emitted, so the camera can move freely.
  private snowSource = {
    getRandomPoint: (p: Phaser.Types.Math.Vector2Like) => {
      const view = this.cameras.main.worldView;
      p.x = view.x + Math.random() * view.width;
      p.y = view.y - 4;
    },
  };
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
    this.floorImage = null;
    this.torches = [];
    this.torchLights = [];
    this.markerLights = [];
    this.stairsImage = null;
    this.stairsLocked = false;
    this.lockShown = false;
    this.cacheImage = null;
    this.cacheOpened = false;
    this.chestImage = null;
    this.chestOpened = false;
    this.boss = null;
    this.summoned = false;
    this.restsReached = [];
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

    this.lit = this.renderer.type === Phaser.WEBGL;
    this.knightLight = null;
    if (this.lit) {
      this.lights.enable();
      const l = PLAYER_LIGHT;
      this.knightLight = this.lights.addLight(
        0,
        0,
        l.radius,
        l.color,
        l.intensity,
        l.radius * l.height,
      );
    }

    const shadow = this.withLight(this.add.image(0, 1, "shadow"));
    this.knightBody = this.withLight(
      this.add.image(0, 0, "dungeon", 96).setOrigin(0.5, 1),
    );
    this.knight = this.add.container(0, 0, [shadow, this.knightBody]);

    const cam = this.cameras.main;
    cam.setBackgroundColor("#181425");
    cam.setRoundPixels(true);

    this.setupInput();
    this.snow = this.reducedMotion ? null : this.makeSnow();
    this.buildFloor(undefined); // also fits the camera to the floor
    this.setFigure(bridge.world.figure);

    const fit = () => this.fitCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, fit);
    // Nothing moves during the fade-in, as in descend.
    this.busy = true;
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
      this.busy = false;
      if (this.leaveQueued) this.leave();
    });
    cam.fadeIn(FADE_MS);

    this.unsubscribe.push(
      bridge.on("world", (w) => this.setFigure(w.figure)),
      bridge.on("descend", () => this.descend()),
      bridge.on("leaveCave", () => this.leave()),
      bridge.on("caveAttack", () => this.swing()),
      bridge.on("drink", (id) => this.drink(id)),
      bridge.on("cacheOpened", () => this.openCache()),
      bridge.on("chestOpen", () => this.openChest()),
    );
    this.announce();
    bridge.emit("reachedFloor", this.depth); // the first floor counts too

    const teardown = () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, fit);
      this.clearFloorView();
      if (this.knightLight) this.lights.removeLight(this.knightLight);
      this.knightLight = null;
      this.snow = null; // destroyed with the scene's display list
      this.unsubscribe.forEach((u) => u());
      this.unsubscribe = [];
      bridge.setZone(null);
    };
    // game.destroy() only fires DESTROY; a scene stop only fires SHUTDOWN.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, teardown);
    this.events.once(Phaser.Scenes.Events.DESTROY, teardown);
  }

  // Draw `o` under the scene's lights when there are any (WebGL).
  private withLight<T extends Phaser.GameObjects.Image>(o: T): T {
    if (this.lit) o.setLighting(true);
    return o;
  }

  // Busy with a fade, a dialogue open, or the player away: nothing moves.
  private held() {
    return this.busy || bridge.world.frozen || bridge.world.away;
  }

  // --- floors ---------------------------------------------------------------

  private buildFloor(previousRoom: string | undefined) {
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
    this.clearFloorView();
    this.monsters.forEach((m) => this.removeMonster(m));
    this.rocks.forEach((r) => r.image.destroy());
    this.rocks = [];
    const seed = Math.floor(Math.random() * 2 ** 31);
    const floor = generateFloor(this.depth, seed, previousRoom);
    this.floor = floor;
    this.rows = [...floor.rows];
    if (this.lit)
      this.lights.setAmbientColor(
        this.depth >= DEEP_FROM ? AMBIENT_DEEP : AMBIENT,
      );

    this.drawFloorView(floor);
    const prop = (
      p: { sheet: "dungeon" | "ski"; frame: number },
      at: { x: number; y: number },
    ) =>
      this.withLight(
        this.add.image(at.x, at.y, p.sheet, p.frame).setDepth(at.y - 8),
      );
    this.stairsImage = prop(CAVE_PROPS.stairs, floor.stairs);
    this.objects.push(this.stairsImage);
    this.chestOpened =
      !!floor.chest && bridge.world.openedChests.includes(floor.chest.id);
    this.chestImage = floor.chest ? prop(CAVE_PROPS.chest, floor.chest) : null;
    if (this.chestImage) {
      if (this.chestOpened) this.chestImage.setFrame(CHEST_OPEN_FRAME);
      this.objects.push(this.chestImage);
    }
    this.cacheImage = floor.cache ? prop(CAVE_PROPS.chest, floor.cache) : null;
    if (this.cacheImage) this.objects.push(this.cacheImage);
    this.cacheOpened = false;
    this.rocks = floor.rocks.map((r) => ({
      x: r.x,
      y: r.y,
      image: prop(CAVE_PROPS.rock, r),
      box: { x: r.x - 8, y: r.y - 8, w: TILE, h: TILE },
    }));

    // Walls, plus one box per rock. Flyers use flyMove, which skips rocks.
    this.solids = [...floor.solids, ...this.rocks.map((r) => r.box)];

    // A rest floor draws one boss (its first spot), unless already beaten.
    const bossSpawn =
      floor.rest && !bridge.world.defeatedBosses.includes(BOSS)
        ? floor.spawns.find((s) => s.enemy === BOSS)
        : undefined;
    this.monsters = floor.spawns
      .filter((s) => PLAYABLE.includes(s.enemy) || s === bossSpawn)
      .map((s) => this.makeMonster(s.enemy, s, s.room));
    this.boss = bossSpawn
      ? (this.monsters.find((m) => m.brain.enemy === BOSS) ?? null)
      : null;
    this.summoned = false;

    this.stairsLocked =
      floor.locked && this.monsters.some((m) => m.room === floor.stairsRoom);
    this.lockShown = false;
    if (this.stairsLocked) {
      this.stairsImage.setTint(LOCKED_TINT);
      if (this.markerLights[0]) this.markerLights[0].intensity = 0;
    }

    // A blink in progress ends with the floor; invulnerability itself carries.
    this.knight.setPosition(floor.start.x, floor.start.y).setAlpha(1);
    this.route = [];
    this.fitCamera(); // snaps to the start: no pan from the last floor

    // The first time on this trip at a rest floor: full life, finds made safe.
    if (floor.rest && !this.restsReached.includes(this.depth)) {
      this.restsReached.push(this.depth);
      this.hp = PLAYER_MAX_HP;
      this.announce();
      bridge.emit("restReached", this.depth);
    }
  }

  // One monster on the floor, scaled to its depth.
  private makeMonster(enemy: EnemyId, at: Point, room: number): Monster {
    const def = ENEMIES[enemy];
    const sprite = this.withLight(
      this.add
        .image(0, 0, def.sprite.sheet, def.sprite.frame)
        .setOrigin(0.5, 1),
    );
    const body = this.add.container(at.x, at.y, [
      this.withLight(this.add.image(0, 1, "shadow")),
      sprite,
    ]);
    return {
      brain: spawnBrain(enemy, at, this.depth),
      room,
      move: def.flies ? this.flyMove : this.move,
      body,
      sprite,
      facesRight: !!def.facesRight,
      marks: [],
      flashUntil: 0,
      white: false,
    };
  }

  // Floor and walls baked into one texture, with the torches and ice lumps as
  // images on top. Decor is drawn only; it never blocks.
  private drawFloorView(floor: Floor) {
    const width = floor.rows[0].length * TILE;
    const height = floor.rows.length * TILE;
    const baked = this.textures.addDynamicTexture(FLOOR_TEXTURE, width, height);
    if (baked) {
      floor.tiles.forEach((row, y) =>
        row.forEach((frame, x) =>
          baked.stamp(floor.sheet, frame, x * TILE, y * TILE, {
            originX: 0,
            originY: 0,
            tint: floor.roof[y][x] ? ROOF_TINT : 0xffffff,
          }),
        ),
      );
      baked.render();
      this.floorImage = this.withLight(
        this.add.image(0, 0, FLOOR_TEXTURE).setOrigin(0).setDepth(-1),
      );
    }
    // Exactly over the torch frame in the baked floor. The flames stay unlit,
    // so they glow; each casts its own warm light.
    this.torches = floor.torches.map((t) =>
      this.add.image(t.x, t.y, floor.sheet, CAVE_FRAMES.torch).setDepth(-0.5),
    );
    if (this.lit) {
      const l = TORCH_LIGHT;
      this.torchLights = floor.torches.map((t) =>
        this.lights.addLight(
          t.x,
          t.y,
          l.radius,
          l.color,
          l.intensity,
          l.radius * l.height,
        ),
      );
      const m = MARKER_LIGHT;
      const spots = floor.chest ? [floor.stairs, floor.chest] : [floor.stairs];
      this.markerLights = spots.map((p) =>
        this.lights.addLight(
          p.x,
          p.y,
          m.radius,
          m.color,
          m.intensity,
          m.radius * m.height,
        ),
      );
    }
    for (const d of floor.decor)
      this.objects.push(
        this.withLight(
          this.add.image(d.x, d.y, d.sheet, d.frame).setDepth(d.y),
        ),
      );
  }

  // The baked floor and the torches (and their lights) go with their floor,
  // and with the scene.
  private clearFloorView() {
    this.floorImage?.destroy();
    this.floorImage = null;
    this.torches.forEach((t) => t.destroy());
    this.torches = [];
    this.torchLights.forEach((l) => this.lights.removeLight(l));
    this.torchLights = [];
    this.markerLights.forEach((l) => {
      this.tweens.killTweensOf(l); // the stairs' pulse
      this.lights.removeLight(l);
    });
    this.markerLights = [];
    if (this.textures.exists(FLOOR_TEXTURE))
      this.textures.remove(FLOOR_TEXTURE);
  }

  // Whole-number zoom as in the village. A floor bigger than the view is
  // followed within a dark margin; a smaller one stands still, centred.
  // startFollow snaps at once, so a new floor or a resize never pans.
  private fitCamera() {
    const cam = this.cameras.main;
    const { width, height } = this.scale;
    const zoom = integerZoom(width, height, TARGET_VIEW);
    cam.setZoom(zoom);
    // The slowest flake lives long enough to cross the whole view.
    if (this.snow)
      this.snow.lifespan =
        ((height / zoom + TILE) / (SNOW.fallSpeed * 0.8)) * 1000;
    const floorW = this.floor.rows[0].length * TILE;
    const floorH = this.floor.rows.length * TILE;
    if (floorW * zoom <= width && floorH * zoom <= height) {
      cam.stopFollow();
      cam.removeBounds();
      cam.centerOn(floorW / 2, floorH / 2);
      return;
    }
    // Along an axis where even the padded floor fits, the bounds grow to the
    // view around the floor's middle, so the floor is centred on that axis
    // instead of pinned to the top or left.
    const pad = CAMERA_PAD_TILES * TILE;
    const axis = (size: number, view: number) =>
      size + 2 * pad >= view
        ? { from: -pad, size: size + 2 * pad }
        : { from: size / 2 - view / 2, size: view };
    const x = axis(floorW, width / zoom);
    const y = axis(floorH, height / zoom);
    cam.setBounds(x.from, y.from, x.size, y.size);
    cam.startFollow(this.knight, true, 0.15, 0.15);
  }

  // The world state follows the floor the player is on and the life left.
  private announce() {
    bridge.setWorld({
      area: "grotta",
      cave: {
        depth: this.depth,
        hp: this.hp,
        maxHp: PLAYER_MAX_HP,
        stairsLocked: this.lockShown,
        boss: this.boss
          ? {
              name: BOSS_NAME,
              hp: this.boss.brain.hp,
              maxHp: this.boss.brain.maxHp,
            }
          : null,
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

  update(time: number, delta: number) {
    const ms = Math.min(delta, MAX_STEP_MS);
    const held = this.held();
    if (!held) this.clock += ms;
    this.moveKnight(ms / 1000, !held);
    this.knight.setDepth(this.knight.y);
    this.updateMood(time, held);
    const knightRoom = roomAt(this.knight.x, this.knight.y, this.floor.layout);
    if (!held) {
      this.stepMonsters(ms / 1000, knightRoom);
      // Blink while nothing can hurt the player.
      const safe = this.clock < this.invulnerableUntil;
      this.knight.alpha = safe && Math.floor(this.clock / 80) % 2 ? 0.3 : 1;
    }
    this.monsters.forEach((m) => this.drawMonster(m));

    const lockShown = this.stairsLocked && knightRoom === this.floor.stairsRoom;
    if (lockShown !== this.lockShown) {
      this.lockShown = lockShown;
      this.announce();
    }

    const { x, y } = this.knight;
    const { stairs } = this.floor;
    let zone: Zone = null;
    if (
      !this.stairsLocked &&
      Phaser.Math.Distance.Between(x, y, stairs.x, stairs.y) < STAIRS_RANGE
    )
      zone = "caveStairs";
    else if (!this.cacheOpened && this.nearCache()) zone = "caveCache";
    else if (this.chestOpenable() && this.nearChest()) zone = "caveChest";
    bridge.setZone(zone);
  }

  // Lights, torch flicker and snow, all changed in place. The flicker is
  // cosmetic, so it runs on Phaser's time rather than the scene clock.
  private updateMood(time: number, held: boolean) {
    if (this.knightLight) {
      this.knightLight.x = this.knight.x;
      this.knightLight.y = this.knight.y - 8;
    }
    if (!this.reducedMotion) {
      const { radius } = TORCH_LIGHT;
      const { amount, hz } = TORCH_FLICKER;
      const w = 2 * Math.PI * hz * (time / 1000);
      for (let i = 0; i < this.torchLights.length; i++)
        this.torchLights[i].radius =
          radius * (1 + amount * Math.sin(w + i * 2.4));
    }
    if (this.snow) {
      if (this.snow.emitting === held) this.snow.emitting = !held;
      this.snow.timeScale = held ? 0 : 1; // freeze the flakes in the air too
    }
  }

  // A few slow flakes falling from the top of the view.
  private makeSnow() {
    return this.add
      .particles(0, 0, "px", {
        emitZone: { type: "random", source: this.snowSource },
        speedY: { min: SNOW.fallSpeed * 0.8, max: SNOW.fallSpeed * 1.2 },
        speedX: { min: -3, max: 3 },
        frequency: 1000 / SNOW.perSecond,
        tint: 0xffffff,
        alpha: SNOW.alpha,
      })
      .setDepth(10005); // over the floor and figures, under floatText
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

  // Flying monsters: walls only (the generator's solids hold no rocks).
  private flyMove = (from: Point, dx: number, dy: number) =>
    moveBox(from, dx, dy, this.floor.solids);

  private feet(): Point {
    return { x: this.knight.x, y: this.knight.y };
  }

  // --- monsters -------------------------------------------------------------

  // An idle monster wakes only while the knight is in its room.
  private stepMonsters(dt: number, knightRoom: number) {
    for (const m of this.monsters) {
      const r = stepBrain(
        m.brain,
        this.feet(),
        this.clock,
        dt,
        m.move,
        m.room === knightRoom,
      );
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
    // Face the knight; frames look left unless the kind says otherwise.
    const dx = this.knight.x - b.x;
    if (Math.abs(dx) > 2) m.sprite.setFlipX(m.facesRight ? dx < 0 : dx > 0);
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
    // A lit sprite would multiply the white down to slate.
    if (this.lit) m.sprite.setLighting(!white);
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
        // A boss's XP comes from its fact, so it never counts as a monster.
        if (m === this.boss) {
          this.boss = null;
          bridge.emit("bossDefeated", m.brain.enemy);
          this.announce();
        } else
          bridge.emit("enemyDefeated", {
            enemy: m.brain.enemy,
            depth: this.depth,
          });
        if (m.room === this.floor.stairsRoom) this.checkStairs();
        continue;
      }
      const away = this.away(from, m.brain);
      const p = m.move(m.brain, away.x * KNOCK_ENEMY, away.y * KNOCK_ENEMY);
      m.brain = { ...m.brain, hp, x: p.x, y: p.y };
      m.flashUntil = this.clock + FLASH_MS;
      if (m.brain.mode === "windup") {
        // The line was drawn at the old spot; drawMonster redraws it here.
        m.marks.forEach((i) => i.destroy());
        m.marks = [];
      }
      if (m === this.boss) {
        if (!this.summoned && hp <= m.brain.maxHp / 2) this.summon(m);
        this.announce();
      }
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

  // At half life, once: two rats beside the boss, in its room, awake at once
  // (the knight is there). Not hit by the swing that called them.
  private summon(boss: Monster) {
    this.summoned = true;
    for (const dx of [-SUMMON_GAP, SUMMON_GAP]) {
      const at = this.move(boss.brain, dx, 0);
      this.monsters.push(this.makeMonster("rat", at, boss.room));
      this.puff(at.x, at.y, [0x8b9bb4, 0xc0cbdc], 8);
    }
  }

  // --- stairs, cache and chest ----------------------------------------------

  // The last monster in the stairs room fell: the stairs open with a pulse.
  private checkStairs() {
    if (!this.stairsLocked) return;
    const room = this.floor.stairsRoom;
    if (this.monsters.some((m) => m.room === room)) return;
    this.stairsLocked = false;
    this.stairsImage?.clearTint();
    const light = this.markerLights[0]; // the stairs' own; only when lit
    if (!light) return;
    light.intensity = MARKER_LIGHT.intensity;
    if (this.reducedMotion) return;
    this.tweens.add({
      targets: light,
      radius: MARKER_LIGHT.radius * 2,
      duration: PULSE_MS,
      ease: "Sine.inOut",
      yoyo: true,
    });
  }

  private nearCache() {
    const c = this.floor.cache;
    return (
      !!c &&
      Phaser.Math.Distance.Between(this.knight.x, this.knight.y, c.x, c.y) <
        CACHE_RANGE
    );
  }

  // The nest's chest opens once per floor and drops its finds in the bag.
  private openCache() {
    const cache = this.floor.cache;
    if (!cache || this.cacheOpened || this.held() || !this.nearCache()) return;
    this.cacheOpened = true;
    this.cacheImage?.setFrame(CHEST_OPEN_FRAME);
    cache.items.forEach(({ item, count }, i) => {
      bridge.emit("found", { item, count });
      this.floatText(
        cache.x,
        cache.y - i * 10,
        `+${count} ${MATERIALS[item].name}`,
        "#fdbe53",
      );
    });
  }

  // The rest floor's chest opens once its boss is gone, and only once ever.
  private chestOpenable() {
    return (
      !!this.floor.chest &&
      this.depth === CHEST_DEPTH &&
      !this.boss &&
      !this.chestOpened
    );
  }

  private nearChest() {
    const c = this.floor.chest;
    return (
      !!c &&
      Phaser.Math.Distance.Between(this.knight.x, this.knight.y, c.x, c.y) <
        CHEST_RANGE
    );
  }

  private openChest() {
    const chest = this.floor.chest;
    if (!chest || this.held() || !this.chestOpenable() || !this.nearChest())
      return;
    this.chestOpened = true;
    this.chestImage?.setFrame(CHEST_OPEN_FRAME);
    bridge.emit("chestOpened", chest.id);
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
