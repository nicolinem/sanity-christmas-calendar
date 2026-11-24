import type { SpriteDef, SpriteSheet } from "./sprites";
import type { FigureChoice } from "./figure";
import type { Element } from "./magic";
import type { NpcId, QuestSiteId } from "./village";

// The seam between React (HUD, content, rules) and Phaser (world, motion).
// Deliberately Phaser-free so HUD components can import it during SSR.
//
// React owns the game state and pushes a snapshot down with `setWorld`; the
// scene reads it on boot and on every change. The scene pushes back where the
// knight is standing (`zone`) and one-shot effects travel as events.

// `side:<spot id>`: a side quest spot (src/game/sideQuests/data.ts).
export type Zone = QuestSiteId | "wraith" | `side:${string}` | null;
// One calendar door shown in the village: a numbered window that hangs over
// the place its task belongs to. Dark while locked, outlined while open, lit
// when done.
export type DoorMarker = {
  id: string;
  door: number;
  bonus?: true; // optional: drawn with «?» instead of its number
  site: QuestSiteId;
  status: "locked" | "open" | "done";
};

export type WorldState = {
  weapon: SpriteDef | null;
  figure: FigureChoice | null; // the player's own figure; null shows the knight
  forgeLit: boolean; // the first blade has been forged
  forgeLevel: number; // 1..4, glows hotter as it grows
  npcMarker: NpcId | null; // who has a luke the player hasn't heard yet
  doors: DoorMarker[]; // this week's doors, in calendar order
  goal: { x: number; y: number } | null; // the next step, in world px
  wraithDefeated: boolean;
  frozen: boolean; // a dialogue is open: the knight stands still
  // Side quests: «!» to take, «?» to hand in, over people the lukes don't
  // need right now; and the spots still to find, with their props.
  sideMarkers: Partial<Record<string, "!" | "?">>;
  sideSpots: SideSpotView[];
};

export type SideSpotView = {
  id: string;
  x: number;
  y: number;
  prop?: { sheet: SpriteSheet; frame: number };
};

export type QuestCelebration = {
  questId: string;
  door: number;
  bonus?: true;
  title: string;
  topic?: string;
  lesson: string;
  atWork?: string;
  outro?: string[];
  objectives?: string[];
  nextDoor?: number;
  nextGiver?: NpcId; // who hands the next door over
  level?: { number: number; damage: number };
};

type EventMap = {
  zone: Zone;
  world: WorldState;
  hit: {
    damage: number;
    defeated: boolean;
    affinity?: "weak" | "immune";
    element?: Element | null;
  };
  whiff: void;
  forgeLevelUp: number;
  questCelebration: QuestCelebration;
  itemForged: SpriteDef; // a new blade was published: it rises from the forge
  forgeFlare: void; // a blade was stamped by the Forge button
  moved: void; // the knight took its first steps (scene → HUD)
  travelToSite: QuestSiteId; // the player chose a destination on the village map
  readSign: void; // the player clicked the bakery sign while standing beside it
};

type Listener<T> = (payload: T) => void;

class Bridge {
  private listeners: { [K in keyof EventMap]?: Set<Listener<EventMap[K]>> } =
    {};

  world: WorldState = {
    weapon: null,
    figure: null,
    forgeLit: false,
    forgeLevel: 1,
    npcMarker: "brann",
    doors: [],
    goal: null,
    wraithDefeated: false,
    frozen: false,
    sideMarkers: {},
    sideSpots: [],
  };

  zone: Zone = null;
  // Where the knight stands (world px); the scene writes it every frame so
  // the journal map can show it without an event per step.
  knight = { x: 0, y: 0 };

  on<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>) {
    const listeners = this.listeners as Record<
      K,
      Set<Listener<EventMap[K]>> | undefined
    >;
    const set = (listeners[event] ??= new Set());
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    const set = this.listeners[event] as Set<Listener<EventMap[K]>> | undefined;
    set?.forEach((fn) => fn(payload));
  }

  setWorld(next: Partial<WorldState>) {
    this.world = { ...this.world, ...next };
    this.emit("world", this.world);
  }

  setZone(zone: Zone) {
    if (zone === this.zone) return;
    this.zone = zone;
    this.emit("zone", zone);
  }
}

export const bridge = new Bridge();
