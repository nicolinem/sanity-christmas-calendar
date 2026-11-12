import type { SpriteDef } from "./sprites";
import type { Element } from "./magic";
import type { QuestSiteId } from "./village";

// The seam between React (HUD, content, rules) and Phaser (world, motion).
// Deliberately Phaser-free so HUD components can import it during SSR.
//
// React owns the game state and pushes a snapshot down with `setWorld`; the
// scene reads it on boot and on every change. The scene pushes back where the
// knight is standing (`zone`) and one-shot effects travel as events.

export type Zone = "forge" | "noticeboard" | "westHouse" | "wraith" | null;
export type QuestSiteMarker = "!" | "↩" | null;

export type WorldState = {
  weapon: SpriteDef | null;
  forgeLit: boolean; // the first blade has been forged
  forgeLevel: number; // 1..4, glows hotter as it grows
  brannMarker: boolean; // Brann has a task he hasn't explained yet
  noticeboardMarker: QuestSiteMarker;
  westHouseMarker: QuestSiteMarker;
  wraithDefeated: boolean;
  frozen: boolean; // a dialogue is open: the knight stands still
};

export type QuestCelebration = { door: number; title: string };

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
};

type Listener<T> = (payload: T) => void;

class Bridge {
  private listeners: { [K in keyof EventMap]?: Set<Listener<EventMap[K]>> } =
    {};

  world: WorldState = {
    weapon: null,
    forgeLit: false,
    forgeLevel: 1,
    brannMarker: true,
    noticeboardMarker: null,
    westHouseMarker: null,
    wraithDefeated: false,
    frozen: false,
  };

  zone: Zone = null;

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
