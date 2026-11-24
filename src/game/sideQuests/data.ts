// The side quests themselves, and the spots they send you to. Phase 1 content
// from docs/plan-sideoppdrag.md (S1–S3); S4–S6 follow in phase S2.
//
// Rules for content:
// - Never make weapons: the lukes read weapons, and a new one can be
//   equipped on its own. Never make bakery orders: lukes react to new ones.
// - Something the player made before taking the quest counts.
// - Each page the giver says is at most two sentences.

import type { GameItemView } from "../items";
import type { SideQuest, SideSpot } from "./types";

const tile = (x: number, y: number) => ({ x: x * 16 + 8, y: y * 16 + 8 });

const mine = (item: GameItemView) => item.source === "sanity";

// Startverdi (docs/plan-sideoppdrag.md, del 7): one short sentence.
const MIN_DESCRIPTION = 20;

// The flour trail: from the road by the bakery, west along it and down the
// south road. Clear of every luke place (tested in data.test.cjs).
export const SIDE_SPOTS: SideSpot[] = [
  {
    id: "flour-trail-1",
    area: "bygda",
    ...tile(33, 17),
    prompt: "Se på sekken",
    prop: { sheet: "farm", frame: 74 }, // the torn flour sack
  },
  {
    id: "flour-trail-2",
    area: "bygda",
    ...tile(26, 18),
    prompt: "Se i snøen",
    prop: { sheet: "farm", frame: 66 }, // dropped wheat
  },
  {
    id: "flour-trail-end",
    area: "bygda",
    ...tile(21, 26),
    prompt: "Plukk opp",
    prop: { sheet: "farm", frame: 125 }, // the cake
  },
];

export const SIDE_QUESTS: SideQuest[] = [
  {
    id: "warm-drink",
    title: "Noe varmt",
    giver: "kari",
    kind: "sanity",
    topic: "*Publish*",
    requires: { luke: ["the-broken-forge"] },
    ask: ["Det er så kaldt i dag. Har du noe varmt å drikke?"],
    goal: "Publiser en ting med Kind `Potion` i Studio, og gi den til Kari.",
    steps: [
      {
        kind: "studio",
        label: "Publiser en drikk",
        check: ({ items }) =>
          items.some((item) => mine(item) && item.kind === "potion")
            ? { done: true }
            : {
                done: false,
                message: "Kari venter fortsatt på noe varmt å drikke.",
              },
      },
    ],
    thanks: "Å, så godt! Jeg strikket en topplue til deg.",
    reward: { xp: 30, unlock: ["gear:hat:bobble"] },
    hint: {
      text: "Lag en ny ting i Studio, velg Kind `Potion` og trykk `Publish`.",
    },
  },
  {
    id: "ore-for-the-forge",
    title: "Malm til smia",
    giver: "brann",
    kind: "sanity",
    topic: "*Document* og `description`",
    requires: { luke: ["the-broken-forge"] },
    ask: ["Jeg trenger malm, og jeg vil vite hvor den kom fra."],
    goal: "Publiser en ting med Kind `Material` og en beskrivelse av hvor den ble funnet.",
    steps: [
      {
        kind: "studio",
        label: "Publiser malm med beskrivelse",
        check: ({ items }) => {
          const ore = items.filter(
            (item) => mine(item) && item.kind === "material",
          );
          if (!ore.length)
            return { done: false, message: "Brann venter fortsatt på malm." };
          return ore.some(
            (item) => (item.description ?? "").trim().length >= MIN_DESCRIPTION,
          )
            ? { done: true }
            : {
                done: false,
                message:
                  "Brann vil vite hvor malmen kom fra. Skriv det i beskrivelsen.",
              };
        },
      },
    ],
    thanks: "God malm, og nå vet jeg hvor den kom fra. Ta denne lærvesten.",
    reward: { xp: 30, unlock: ["gear:armour:leather"] },
    hint: {
      text: "Lag en ny ting med Kind `Material`, og skriv en setning i `description` før du trykker `Publish`.",
    },
  },
  {
    id: "flour-sack",
    title: "Melsekken",
    giver: "bakeren",
    kind: "world",
    requires: { chapter: 2 },
    ask: ["Noen rev opp melsekken min i natt. Kan du se hvor sporet går?"],
    goal: "Følg melsporet fra bakeriet og finn det som ble tatt.",
    steps: [
      {
        kind: "find",
        spot: "flour-trail-1",
        label: "Melsekken ligger revnet ved veien",
      },
      {
        kind: "find",
        spot: "flour-trail-2",
        label: "Korn i snøen, lenger vest",
      },
      {
        kind: "find",
        spot: "flour-trail-end",
        label: "Kaka ligger i snøen på sørveien",
      },
    ],
    thanks: "Kaka mi! Litt snø på den, men den er hel. Ta denne kappen.",
    reward: { xp: 40, unlock: ["gear:extra:cape"] },
  },
];
