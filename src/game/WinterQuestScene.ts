import Phaser from "phaser";
import type { FigureChoice } from "./figure";
import { figureTexture } from "./figureTexture";
import { moveBox, type Box } from "./walk";
import { integerZoom, TARGET_VIEW } from "./zoom";
import {
  bridge,
  type DoorMarker,
  type SideSpotView,
  type WorldState,
  type Zone,
} from "./bridge";
import { CAVE_PROPS } from "./cave/props";
import { FEATURES } from "./features";
import { LUKE_LEVEL_CAP } from "./rules";
import { SHEETS, TILE, VILLAGE_SHEETS, type SpriteDef } from "./sprites";
import {
  BUILDINGS,
  CAVE_ENTRANCE,
  CAVE_MOUTH,
  FORGE_FIRE,
  FURNACE,
  GLADE,
  GROUND,
  MAP_H,
  MAP_W,
  NPCS,
  PROPS,
  QUEST_SITES,
  pathRoute,
  placeDoors,
  SPAWN,
  TREES,
  WRAITH_HOME,
} from "./village";
import type { NpcId, QuestSiteId } from "./village";

// Frostholm at blue hour. The world is a 54×30 tile village built from Kenney's
// Tiny Town/Dungeon sheets; the camera follows the knight at an integer zoom so
// every sprite pixel lands on whole screen pixels.
//
// The scene owns motion and presentation only. Items, damage, HP and quest
// state live in React and arrive through `bridge` (see bridge.ts).

const WORLD_W = MAP_W * TILE;
const WORLD_H = MAP_H * TILE;

const FORGE_RANGE = 28;
const WRAITH_RANGE = 40;

export class WinterQuestScene extends Phaser.Scene {
  private knight!: Phaser.GameObjects.Container;
  private knightBody!: Phaser.GameObjects.Image;
  private weapon!: Phaser.GameObjects.Image;
  private markers = new Map<NpcId, Phaser.GameObjects.Text>();
  // Side quests: a smaller, frost-blue «!» or «?» that never bobs, so the
  // lukes' gold «!» stays the one that calls loudest.
  private sideMarkers = new Map<NpcId, Phaser.GameObjects.Text>();
  private sideProps = new Map<string, Phaser.GameObjects.Image>();
  private sideSpots: SideSpotView[] = [];
  private doorMarkers: Phaser.GameObjects.Container[] = [];
  private doorsKey = "";
  private goalBadge!: Phaser.GameObjects.Container;
  private goalPointer!: Phaser.GameObjects.Graphics;
  private wraith!: Phaser.GameObjects.Image;
  private forgeGlow!: Phaser.GameObjects.Image;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<
    "up" | "down" | "left" | "right",
    Phaser.Input.Keyboard.Key
  >;
  private solids: Box[] = [];
  private moveTarget: Phaser.Math.Vector2 | null = null;
  private pendingSite: QuestSiteId | "wraith" | null = null;
  private stuckFrames = 0;
  private route: Phaser.Math.Vector2[] = []; // legs still to walk after moveTarget
  private walkClock = 0;
  private speed = 64; // world px per second

  private wraithTarget = new Phaser.Math.Vector2(WRAITH_HOME.x, WRAITH_HOME.y);
  private wraithBase = new Phaser.Math.Vector2(WRAITH_HOME.x, WRAITH_HOME.y);
  private wraithGone = false;
  private hasMoved = false;
  private knock = 0; // visual-only knockback offset, decays each frame

  private font = "monospace";
  private reducedMotion = false;
  private unsubscribe: (() => void)[] = [];

  constructor() {
    super("WinterQuest");
  }

  preload() {
    const frame = { frameWidth: TILE, frameHeight: TILE };
    for (const key of VILLAGE_SHEETS)
      this.load.spritesheet(key, SHEETS[key].url, frame);
  }

  create() {
    this.font =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--font-ui")
        .trim() || "monospace";
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.makeTextures();
    this.buildGround();
    this.buildVillage();
    this.buildCharacters();
    this.buildAtmosphere();
    this.setupInput();
    this.setupCamera();
    this.buildGoalArrow();

    this.unsubscribe.push(
      bridge.on("world", (w) => this.applyWorld(w)),
      bridge.on("travelToSite", (id) => {
        if (bridge.world.frozen) this.pendingSite = id;
        else this.moveToSite(id);
      }),
      bridge.on("hit", ({ damage, defeated, affinity }) =>
        this.onHit(damage, defeated, affinity),
      ),
      bridge.on("whiff", () => this.onWhiff()),
      bridge.on("forgeLevelUp", () => this.onForgeLevelUp()),
      bridge.on("itemForged", (sprite) => this.onItemForged(sprite)),
      bridge.on("forgeFlare", () => this.flareForge()),
      bridge.on("enterCave", (depth) => this.enterCave(depth)),
    );
    this.applyWorld(bridge.world);

    // Back from the cave: stand in front of the entrance and fade in.
    this.enteringCave = false;
    const onWake = (_sys: unknown, data?: { at?: "brann" }) => {
      if (data?.at === "brann") this.knight.setPosition(SPAWN.x, SPAWN.y);
      else this.knight.setPosition(CAVE_ENTRANCE.x, CAVE_ENTRANCE.y + 16);
      this.moveTarget = null;
      this.route = [];
      this.cameras.main.fadeIn(200);
      // Only now: a pending «Gå til» sets its route after the reset above.
      bridge.emit("leftCave", undefined);
    };
    this.events.on(Phaser.Scenes.Events.WAKE, onWake);

    const teardown = () => {
      this.events.off(Phaser.Scenes.Events.WAKE, onWake);
      this.unsubscribe.forEach((u) => u());
      this.unsubscribe = [];
      bridge.setZone(null);
    };
    // game.destroy() only fires DESTROY; a scene stop only fires SHUTDOWN.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, teardown);
    this.events.once(Phaser.Scenes.Events.DESTROY, teardown);
  }

  // Fade out, put the village to sleep and start the cave on `depth`. A second
  // call while the fade runs is ignored.
  private enteringCave = false;
  private enterCave(depth: number) {
    if (bridge.world.area !== "bygda") return;
    if (this.enteringCave || bridge.world.frozen) return;
    this.enteringCave = true;
    this.cameras.main.fadeOut(200);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        bridge.setZone(null);
        this.enteringCave = false;
        this.scene.sleep();
        this.scene.launch("Cave", { depth });
      },
    );
  }

  // --- construction ---------------------------------------------------------

  private makeTextures() {
    // Stepped radial light: posterised rings read as pixel art when scaled.
    const size = 32;
    const tex = this.textures.createCanvas("glow", size, size)!;
    const ctx = tex.getContext();
    const c = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c;
        if (d >= 1) continue;
        const a = Math.round((1 - d) * 5) / 5;
        ctx.fillStyle = `rgba(255,255,255,${a * 0.55})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    tex.refresh();

    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillRect(0, 0, 1, 1);
    g.generateTexture("px", 1, 1);
    g.clear()
      .fillStyle(0x262b44, 0.28)
      .fillRect(1, 0, 8, 1)
      .fillRect(0, 1, 10, 2)
      .fillRect(1, 3, 8, 1);
    g.generateTexture("shadow", 10, 4);
    g.destroy();
  }

  private buildGround() {
    const map = this.make.tilemap({
      data: GROUND,
      tileWidth: TILE,
      tileHeight: TILE,
    });
    const tiles = map.addTilesetImage("town", "town", TILE, TILE, 0, 0)!;
    map.createLayer(0, tiles, 0, 0)!.setDepth(-10);
  }

  private buildVillage() {
    for (const b of BUILDINGS) {
      const w = b.rows[0].length;
      const h = b.rows.length;
      const baseY = (b.y + h) * TILE;
      b.rows.forEach((row, r) =>
        row.forEach((frame, c) => {
          this.add
            .image((b.x + c) * TILE, (b.y + r) * TILE, "town", frame)
            .setOrigin(0)
            .setDepth(baseY);
        }),
      );
      // Leave a strip at the roof top walkable so the knight can tuck behind.
      this.solids.push({
        x: b.x * TILE,
        y: (b.y + 1) * TILE,
        w: w * TILE,
        h: (h - 1) * TILE,
      });
      for (const [wx, wy] of b.windows)
        this.addLight(wx * TILE + 8, wy * TILE + 7, 0xffc56b, 1.3, 0.9);
    }

    for (const p of PROPS) {
      const x = p.x * TILE;
      const y = p.y * TILE;
      this.add
        .image(x, y, p.sheet, p.frame)
        .setOrigin(0)
        .setDepth(y + TILE);
      if (p.solid) this.solids.push({ x: x + 2, y: y + 6, w: 12, h: 10 });
    }

    if (FEATURES.cave) {
      CAVE_PROPS.entrance.forEach((def, i) => {
        const [tx, ty] = CAVE_MOUTH[i];
        this.add
          .image(tx * TILE, ty * TILE, def.sheet, def.frame)
          .setOrigin(0)
          .setDepth((ty + 1) * TILE);
      });
      const [mx, my] = CAVE_MOUTH[0];
      this.solids.push({ x: mx * TILE + 2, y: my * TILE + 6, w: 28, h: 10 });
    }

    const sign = QUEST_SITES.bakerySign;
    const post = this.add.rectangle(0, 0, 3, 10, 0x705038).setPosition(0, -3);
    const board = this.add
      .rectangle(0, 0, 30, 16, 0x443020)
      .setStrokeStyle(1, 0xfdbe53)
      .setPosition(0, -12)
      .setInteractive({ useHandCursor: true });
    board.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _x: number,
        _y: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        if (
          bridge.world.frozen ||
          Phaser.Math.Distance.Between(
            bridge.knight.x,
            bridge.knight.y,
            sign.x,
            sign.y,
          ) >= FORGE_RANGE
        )
          return;
        event.stopPropagation();
        bridge.emit("readSign", undefined);
      },
    );
    const label = this.add
      .text(0, -12, "BOD", {
        fontFamily: this.font,
        fontSize: "6px",
        color: "#ffe2a0",
      })
      .setOrigin(0.5)
      .setResolution(6);
    this.add.container(sign.x, sign.y, [post, board, label]).setDepth(sign.y);

    for (const t of TREES) {
      this.add.image(t.x, t.y, "town", t.frame).setOrigin(0.5, 1).setDepth(t.y);
      this.solids.push({ x: t.x - 4, y: t.y - 6, w: 8, h: 6 });
    }

    // World edges.
    this.solids.push(
      { x: -16, y: 0, w: 16, h: WORLD_H },
      { x: WORLD_W, y: 0, w: 16, h: WORLD_H },
      { x: 0, y: -16, w: WORLD_W, h: 16 },
      { x: 0, y: WORLD_H, w: WORLD_W, h: 16 },
    );
  }

  private buildCharacters() {
    // The people who hand out lukes: Brann by his anvil, Arkivaren on the
    // square, Bakeren by the bakery. Each gets a «!» while they have a luke
    // the player hasn't heard about yet.
    for (const npc of Object.values(NPCS)) {
      this.add.image(npc.x, npc.y + 1, "shadow").setDepth(npc.y - 1);
      this.add
        .image(npc.x, npc.y, npc.sprite.sheet, npc.sprite.frame)
        .setOrigin(0.5, 1)
        .setDepth(npc.y);
      this.solids.push({ x: npc.x - 5, y: npc.y - 5, w: 10, h: 5 });
      const marker = this.text(npc.x, npc.y - 22, "!", 12, "#fdbe53")
        .setDepth(9000)
        .setVisible(false);
      if (!this.reducedMotion)
        this.tweens.add({
          targets: marker,
          y: "-=2",
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        });
      this.markers.set(npc.id, marker);
      this.sideMarkers.set(
        npc.id,
        this.text(npc.x, npc.y - 21, "!", 10, "#8fd3ff")
          .setDepth(9000)
          .setVisible(false),
      );
    }

    // The Frost Wraith: Kenney's ghost, tinted to glacier blue.
    this.wraith = this.add
      .image(WRAITH_HOME.x, WRAITH_HOME.y, "dungeon", 121)
      .setOrigin(0.5, 1)
      .setTint(0xbfe4ff)
      .setAlpha(0.92);
    this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => this.pickWraithTarget(),
    });

    // The knight, holding whatever weapon is equipped.
    const shadow = this.add.image(0, 1, "shadow");
    this.knightBody = this.add.image(0, 0, "dungeon", 96).setOrigin(0.5, 1);
    this.weapon = this.add
      .image(5, -4, "dungeon", 103)
      .setOrigin(0.3, 0.85)
      .setAngle(20)
      .setVisible(false);
    this.knight = this.add.container(SPAWN.x, SPAWN.y, [
      shadow,
      this.weapon,
      this.knightBody,
    ]);
  }

  private buildAtmosphere() {
    // Blue-hour wash over the whole world, then warm lights added on top.
    this.add
      .rectangle(0, 0, WORLD_W, WORLD_H, 0xaab9da)
      .setOrigin(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(10000);

    this.forgeGlow = this.addLight(
      FORGE_FIRE.x,
      FORGE_FIRE.y,
      0xff9a3c,
      3,
      0.75,
    );
    const furnace = this.addLight(FURNACE.x, FURNACE.y, 0xff8a2a, 2, 0.8);
    if (!this.reducedMotion) {
      this.tweens.add({
        targets: [this.forgeGlow, furnace],
        alpha: { from: 0.65, to: 0.95 },
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: "Stepped",
        easeParams: [3],
      });
    }
    this.addLight(WRAITH_HOME.x, WRAITH_HOME.y - 6, 0x7fc8ff, 3.2, 0.35);

    this.sparks = this.add.particles(FURNACE.x, FURNACE.y - 6, "px", {
      speedY: { min: -26, max: -12 },
      speedX: { min: -6, max: 6 },
      lifespan: { min: 500, max: 1100 },
      frequency: 260,
      tint: [0xffd15a, 0xff9a3c, 0xfff1b8],
      alpha: { start: 1, end: 0 },
    });
    this.sparks.setDepth(10002);

    if (!this.reducedMotion) {
      this.add
        .particles(0, -8, "px", {
          x: { min: -40, max: WORLD_W + 40 },
          speedY: { min: 9, max: 18 },
          speedX: { min: -6, max: 3 },
          lifespan: 34000,
          frequency: 70,
          alpha: { min: 0.55, max: 0.95 },
          tint: [0xffffff, 0xe3ebf5],
        })
        .setDepth(10003);
    }
  }

  // --- calendar doors in the village -----------------------------------------

  private syncDoors(doors: DoorMarker[]) {
    const key = doors.map((d) => `${d.id}:${d.status}`).join("|");
    if (key === this.doorsKey) return;
    this.doorsKey = key;
    this.doorMarkers.forEach((m) => {
      this.tweens.killTweensOf([m, ...m.list]);
      m.destroy();
    });
    this.doorMarkers = [];

    for (const d of placeDoors(doors))
      this.doorMarkers.push(this.makeDoor(d, d.x, d.y));
  }

  // A numbered Kenney window: dark and faded while locked, dark with a
  // pulsing amber frame while open, lit and glowing when done.
  private makeDoor(d: DoorMarker, x: number, y: number) {
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (d.status === "done") {
      parts.push(
        this.add
          .image(0, -8, "glow")
          .setTint(0xffc56b)
          .setScale(1.1)
          .setAlpha(0.8)
          .setBlendMode(Phaser.BlendModes.ADD),
      );
    }
    // An optional luke is blue with «?», so it reads as extra, not next.
    const colour = d.bonus ? 0x8fd3ff : 0xfdbe53;
    const frame = this.add
      .rectangle(0, -8, 20, 20)
      .setStrokeStyle(1, colour)
      .setVisible(d.status === "open");
    const pane = this.add.image(0, 0, "town", 84).setOrigin(0.5, 1);
    if (d.status !== "done") pane.setTint(0x6b7899);
    const label = this.text(
      8,
      5,
      d.bonus ? "?" : String(d.door),
      9,
      d.status === "locked" ? "#c0cbdc" : d.bonus ? "#8fd3ff" : "#fdbe53",
    );
    parts.push(frame, pane, label);
    const door = this.add
      .container(x, y, parts)
      .setDepth(9000)
      .setAlpha(d.status === "locked" ? 0.75 : 1);
    if (!this.reducedMotion) {
      this.tweens.add({
        targets: door,
        y: y - 2,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      if (d.status === "open") {
        this.tweens.add({
          targets: frame,
          alpha: 0.25,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: "Stepped",
          easeParams: [2],
        });
      }
    }
    return door;
  }

  private addLight(
    x: number,
    y: number,
    color: number,
    scale: number,
    alpha: number,
  ) {
    return this.add
      .image(x, y, "glow")
      .setTint(color)
      .setScale(scale)
      .setAlpha(alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(10001);
  }

  private text(
    x: number,
    y: number,
    value: string,
    size: number,
    color: string,
  ) {
    return this.add
      .text(x, y, value, {
        fontFamily: this.font,
        fontSize: `${size}px`,
        color,
        stroke: "#262b44",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setResolution(6);
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    // Space and Shift belong to the HUD (attack / buttons), not movement.
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

    // Tap/click to walk: makes the game playable without a keyboard.
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.moveTarget = new Phaser.Math.Vector2(p.worldX, p.worldY + 4);
      this.route = [];
      this.stuckFrames = 0;
    });
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setRoundPixels(true);
    cam.setBackgroundColor("#e3ebf5");
    cam.startFollow(this.knight, true, 0.15, 0.15);
    const fit = () => {
      const { width, height } = this.scale;
      let zoom = integerZoom(width, height, TARGET_VIEW);
      while (width / zoom > WORLD_W || height / zoom > WORLD_H) zoom++;
      cam.setZoom(zoom);
    };
    fit();
    this.scale.on(Phaser.Scale.Events.RESIZE, fit);
    const off = () => this.scale.off(Phaser.Scale.Events.RESIZE, fit);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    this.events.once(Phaser.Scenes.Events.DESTROY, off);
  }

  // --- state from React -----------------------------------------------------

  // The player's own figure, drawn from their choices into a texture once per
  // look. Without one, the knight from Tiny Dungeon.
  private figureKey = "";
  private setFigure(choice: FigureChoice | null) {
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

  private applyWorld(w: WorldState) {
    this.setWeapon(w.weapon);
    this.setFigure(w.figure);
    for (const [id, marker] of this.markers)
      marker.setVisible(w.npcMarker === id);
    for (const [id, marker] of this.sideMarkers) {
      const mark = w.npcMarker === id ? undefined : w.sideMarkers[id];
      marker.setVisible(Boolean(mark));
      if (mark) marker.setText(mark);
    }
    this.syncSideSpots(w.sideSpots);
    this.syncDoors(w.doors);
    // A cold forge smoulders; once lit it burns brighter with every level.
    const forge = Math.min(LUKE_LEVEL_CAP, w.forgeLevel);
    this.forgeGlow.setScale(w.forgeLit ? 3.4 + forge * 0.3 : 3);
    this.sparks.frequency = w.forgeLit ? Math.round(150 / forge) : 260;
    if (w.frozen) {
      this.moveTarget = null;
      this.route = [];
    } else if (this.pendingSite) {
      this.moveToSite(this.pendingSite);
      this.pendingSite = null;
    }
    // While a window is open, arrows and WASD are letters to type (the code
    // window), so stop swallowing them.
    const kb = this.input.keyboard;
    if (w.frozen) kb?.disableGlobalCapture();
    else kb?.enableGlobalCapture();

    if (w.wraithDefeated && !this.wraithGone) this.banishWraith();
    if (!w.wraithDefeated && this.wraithGone) this.reviveWraith();
  }

  // Props for the side quest spots still to find; gone once found.
  private syncSideSpots(spots: SideSpotView[]) {
    this.sideSpots = spots;
    const keep = new Set(spots.map((s) => s.id));
    for (const [id, image] of this.sideProps)
      if (!keep.has(id)) {
        image.destroy();
        this.sideProps.delete(id);
      }
    for (const spot of spots) {
      if (!spot.prop || this.sideProps.has(spot.id)) continue;
      this.sideProps.set(
        spot.id,
        this.add
          .image(spot.x, spot.y + 4, spot.prop.sheet, spot.prop.frame)
          .setOrigin(0.5, 1)
          .setDepth(spot.y),
      );
    }
  }

  private setWeapon(sprite: SpriteDef | null) {
    if (!sprite) {
      this.weapon.setVisible(false);
      return;
    }
    this.weapon.setTexture(sprite.sheet, sprite.frame).setVisible(true);
  }

  private moveToSite(id: QuestSiteId | "wraith") {
    // The wraith wanders, so walk to where it is now and stop just short of
    // it, inside its range, where Space strikes.
    const destination =
      id === "wraith"
        ? { x: this.wraithBase.x - 24, y: this.wraithBase.y }
        : QUEST_SITES[id];
    this.route = pathRoute(this.knight, destination).map(
      (p) => new Phaser.Math.Vector2(p.x, p.y),
    );
    this.moveTarget = this.route.shift() ?? null;
    this.stuckFrames = 0;
  }

  // A burst of sparks and a flare of light when the forge levels up.
  private onForgeLevelUp() {
    this.flareForge();
    if (!this.reducedMotion) this.cameras.main.shake(140, 0.002);
  }

  private flareForge() {
    this.sparks.explode(28);
    const flare = this.addLight(FORGE_FIRE.x, FORGE_FIRE.y, 0xffd27a, 2, 0.9);
    this.tweens.add({
      targets: flare,
      scale: 6,
      alpha: 0,
      duration: 900,
      ease: "Cubic.out",
      onComplete: () => flare.destroy(),
    });
  }

  // A blade published in the Studio rises out of the forge mouth and flies to
  // the knight: the moment Sanity's live updates become visible.
  private onItemForged(sprite: SpriteDef) {
    this.flareForge();
    const blade = this.add
      .image(FORGE_FIRE.x, FORGE_FIRE.y, sprite.sheet, sprite.frame)
      .setDepth(10011)
      .setAlpha(0);
    const glow = this.addLight(
      FORGE_FIRE.x,
      FORGE_FIRE.y,
      0xffd27a,
      1.2,
      0.8,
    ).setDepth(10010);
    this.tweens.chain({
      targets: [blade, glow],
      tweens: [
        { alpha: 1, y: "-=18", duration: 500, ease: "Back.out" },
        { angle: { from: 0, to: 360 }, duration: 450, targets: blade },
        {
          x: () => this.knight.x + 5,
          y: () => this.knight.y - 8,
          duration: 650,
          ease: "Cubic.in",
        },
        { alpha: 0, duration: 150 },
      ],
      onComplete: () => {
        blade.destroy();
        glow.destroy();
        this.add
          .particles(this.knight.x, this.knight.y - 8, "px", {
            speed: { min: 8, max: 24 },
            lifespan: 500,
            tint: [0xffd15a, 0xfff1b8],
            alpha: { start: 1, end: 0 },
            emitting: false,
          })
          .setDepth(10010)
          .explode(14);
      },
    });
  }

  // --- combat effects -------------------------------------------------------

  private lunge() {
    const dir = Math.sign(this.wraith.x - this.knight.x) || 1;
    this.knight.scaleX = dir;
    this.tweens.add({
      targets: this.weapon,
      angle: { from: -40, to: 70 },
      duration: 140,
      yoyo: true,
    });
    this.tweens.add({
      targets: this.knightBody,
      x: 3,
      duration: 90,
      yoyo: true,
    });
  }

  private onHit(
    damage: number,
    defeated: boolean,
    affinity?: "weak" | "immune",
  ) {
    this.lunge();
    this.wraith.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(90, () =>
      this.wraith.setTint(0xbfe4ff).setTintMode(Phaser.TintModes.MULTIPLY),
    );
    this.knock = (Math.sign(this.wraith.x - this.knight.x) || 1) * 5;
    if (affinity === "immune") this.floatText("immun", "#8fd3ff");
    else if (affinity === "weak") this.floatText(`-${damage}!`, "#ff8a3c");
    else this.floatText(`-${damage}`, "#fdbe53");
    if (!this.reducedMotion) this.cameras.main.shake(90, 0.003);
    if (defeated) this.time.delayedCall(160, () => this.banishWraith());
  }

  private onWhiff() {
    this.lunge();
    this.floatText("ingen skade", "#c0cbdc");
  }

  private floatText(value: string, color: string) {
    const t = this.text(
      this.wraith.x,
      this.wraith.y - 16,
      value,
      9,
      color,
    ).setDepth(10010);
    this.tweens.add({
      targets: t,
      y: "-=12",
      alpha: 0,
      duration: 800,
      ease: "Cubic.out",
      onComplete: () => t.destroy(),
    });
  }

  private banishWraith() {
    if (this.wraithGone) return;
    this.wraithGone = true;
    this.add
      .particles(this.wraith.x, this.wraith.y - 8, "px", {
        speed: { min: 10, max: 34 },
        lifespan: 700,
        quantity: 18,
        tint: [0xffffff, 0xbfe4ff],
        alpha: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(10010)
      .explode(18);
    this.tweens.killTweensOf(this.wraith);
    this.tweens.add({ targets: this.wraith, alpha: 0, duration: 450 });
  }

  private reviveWraith() {
    // Re-forms where it fell, so a rematch starts right where the player is.
    this.wraithGone = false;
    this.tweens.killTweensOf(this.wraith);
    this.wraithTarget.copy(this.wraithBase);
    this.wraith.setPosition(this.wraithBase.x, this.wraithBase.y).setAlpha(0);
    this.tweens.add({ targets: this.wraith, alpha: 0.92, duration: 600 });
  }

  private pickWraithTarget() {
    if (this.wraithGone || bridge.zone === "wraith") return;
    this.wraithTarget.set(
      Phaser.Math.Between((GLADE.x + 1) * TILE, (GLADE.x + GLADE.w - 1) * TILE),
      Phaser.Math.Between((GLADE.y + 2) * TILE, (GLADE.y + GLADE.h - 1) * TILE),
    );
  }

  // --- per frame ------------------------------------------------------------

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    this.moveKnight(dt);
    this.moveWraith(dt);
    this.knight.setDepth(this.knight.y);
    this.updateZone();
    bridge.knight.x = Math.round(this.knight.x);
    bridge.knight.y = Math.round(this.knight.y);
    this.updateGoalArrow();
  }

  // --- pointer to the next step ----------------------------------------------

  // An amber «!» that sits on the edge of the view, pointing at the next step
  // whenever it's off screen. Hidden when the goal is in view.
  private buildGoalArrow() {
    const box = this.add
      .rectangle(0, 0, 11, 11, 0xfdbe53)
      .setStrokeStyle(1, 0x2a140e);
    const mark = this.add
      .text(0, 0, "!", {
        fontFamily: this.font,
        fontSize: "9px",
        fontStyle: "bold",
        color: "#2a140e",
      })
      .setOrigin(0.5)
      .setResolution(6);
    this.goalBadge = this.add
      .container(0, 0, [box, mark])
      .setDepth(10005)
      .setVisible(false);
    this.goalPointer = this.add
      .graphics()
      .fillStyle(0x2a140e)
      .fillTriangle(6, 0, -2, -5, -2, 5)
      .fillStyle(0xfdbe53)
      .fillTriangle(4, 0, -1, -3, -1, 3)
      .setDepth(10005)
      .setVisible(false);
  }

  private updateGoalArrow() {
    const goal = bridge.world.goal;
    const view = this.cameras.main.worldView;
    const pad = 12;
    const inView =
      goal &&
      goal.x > view.x + pad &&
      goal.x < view.right - pad &&
      goal.y > view.y + pad &&
      goal.y < view.bottom - pad;
    if (!goal || inView || bridge.world.frozen) {
      this.goalBadge.setVisible(false);
      this.goalPointer.setVisible(false);
      return;
    }
    const cx = view.centerX;
    const cy = view.centerY;
    const dx = goal.x - cx;
    const dy = goal.y - cy;
    const t = Math.min(
      (view.width / 2 - pad) / Math.max(Math.abs(dx), 0.001),
      (view.height / 2 - pad) / Math.max(Math.abs(dy), 0.001),
    );
    const x = Math.round(cx + dx * t);
    const y = Math.round(cy + dy * t);
    const angle = Math.atan2(dy, dx);
    this.goalBadge.setPosition(x, y).setVisible(true);
    this.goalPointer
      .setPosition(
        Math.round(x + Math.cos(angle) * 9),
        Math.round(y + Math.sin(angle) * 9),
      )
      .setRotation(angle)
      .setVisible(true);
  }

  private moveKnight(dt: number) {
    let vx = 0;
    let vy = 0;
    if (!bridge.world.frozen) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;
    }

    if (vx || vy) {
      this.moveTarget = null;
      this.route = [];
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.knight.x;
      const dy = this.moveTarget.y - this.knight.y;
      if (this.stuckFrames > 8) {
        this.moveTarget = null;
        this.route = [];
      } else if (Math.hypot(dx, dy) < 2) {
        this.moveTarget = this.route.shift() ?? null;
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

    const step = this.speed * dt;
    const before = { x: this.knight.x, y: this.knight.y };
    this.tryMove((vx / len) * step, 0);
    this.tryMove(0, (vy / len) * step);
    const moved = Math.hypot(
      this.knight.x - before.x,
      this.knight.y - before.y,
    );
    this.stuckFrames = moved < step * 0.3 ? this.stuckFrames + 1 : 0;

    if (vx) this.knight.scaleX = vx < 0 ? -1 : 1;
    if (!this.hasMoved) {
      this.hasMoved = true;
      bridge.emit("moved", undefined);
    }
    // A two-step hop reads as walking for a single-frame sprite.
    this.walkClock += dt;
    this.knightBody.y = Math.floor(this.walkClock * 8) % 2 ? -1 : 0;
  }

  private tryMove(dx: number, dy: number) {
    const p = moveBox(this.knight, dx, dy, this.solids);
    this.knight.setPosition(p.x, p.y);
  }

  private moveWraith(dt: number) {
    if (this.wraithGone) return;
    const near = bridge.zone === "wraith";
    if (!near) {
      const dx = this.wraithTarget.x - this.wraithBase.x;
      const dy = this.wraithTarget.y - this.wraithBase.y;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        this.wraithBase.x += (dx / d) * 10 * dt;
        this.wraithBase.y += (dy / d) * 10 * dt;
      }
    }
    const bob = this.reducedMotion
      ? 0
      : Math.round(Math.sin(this.time.now / 380) * 2);
    this.knock =
      Math.abs(this.knock) < 0.5 ? 0 : this.knock * Math.pow(0.002, dt);
    this.wraith.setPosition(
      Math.round(this.wraithBase.x + this.knock),
      Math.round(this.wraithBase.y) + bob,
    );
    this.wraith.flipX =
      (near ? this.knight.x : this.wraithTarget.x) < this.wraith.x;
    this.wraith.setDepth(this.wraithBase.y);
  }

  private updateZone() {
    const k = this.knight;
    let zone: Zone = null;
    const spot = this.sideSpots.find(
      (s) => Phaser.Math.Distance.Between(k.x, k.y, s.x, s.y) < FORGE_RANGE,
    );
    const npc = Object.values(NPCS).find(
      (n) => Phaser.Math.Distance.Between(k.x, k.y, n.x, n.y) < FORGE_RANGE,
    );
    if (npc) zone = npc.site;
    else if (
      Phaser.Math.Distance.Between(
        k.x,
        k.y,
        QUEST_SITES.noticeboard.x,
        QUEST_SITES.noticeboard.y,
      ) < FORGE_RANGE
    )
      zone = "noticeboard";
    else if (
      Phaser.Math.Distance.Between(
        k.x,
        k.y,
        QUEST_SITES.westHouse.x,
        QUEST_SITES.westHouse.y,
      ) < FORGE_RANGE
    )
      zone = "westHouse";
    else if (
      Phaser.Math.Distance.Between(
        k.x,
        k.y,
        QUEST_SITES.bakerySign.x,
        QUEST_SITES.bakerySign.y,
      ) < FORGE_RANGE
    )
      zone = "bakerySign";
    // Side quest spots come after every luke place, so a luke always wins E.
    else if (spot) zone = `side:${spot.id}`;
    else if (
      FEATURES.cave &&
      Phaser.Math.Distance.Between(k.x, k.y, CAVE_ENTRANCE.x, CAVE_ENTRANCE.y) <
        FORGE_RANGE
    )
      zone = "cave";
    // Where the wraith stands, or where it fell (which offers a rematch).
    else if (
      Phaser.Math.Distance.Between(
        k.x,
        k.y,
        this.wraithBase.x,
        this.wraithBase.y,
      ) < WRAITH_RANGE
    )
      zone = "wraith";
    bridge.setZone(zone);
  }
}
