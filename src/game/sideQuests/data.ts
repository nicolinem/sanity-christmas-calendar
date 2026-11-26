// The side quests themselves, and the spots they send you to: S1–S6 from
// docs/plan-sideoppdrag.md (S1–S3 in phase S1, S4–S6 in phase S2).
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

// Startverdier (docs/plan-sideoppdrag.md, del 7): one short sentence, and
// three different things in the basket.
const MIN_DESCRIPTION = 20;
const BASKET = 3;

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
  // Beside the well on the square: what Jon heard splashing.
  {
    id: "well-bucket",
    area: "bygda",
    ...tile(24, 15),
    prompt: "Se ved brønnen",
    prop: { sheet: "farm", frame: 124 }, // the bucket
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
    goal: "Publiser en gjenstand med sorten *Drikk* i Studio, og gi den til Kari.",
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
      text: "Lag en ny gjenstand i Studio, velg *Drikk* under *Sort* og trykk `Publish`.",
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
    goal: "Publiser en gjenstand med sorten *Materiale* og en beskrivelse av hvor den ble funnet.",
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
      text: "Lag en ny gjenstand med sorten *Materiale*, og skriv en setning i *Beskrivelse* før du trykker `Publish`.",
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
  {
    id: "well-splash",
    title: "Det plasket i brønnen",
    giver: "arkivaren",
    kind: "world",
    // After the first GROQ luke (technical) or «Hvem lyver?» (non-technical).
    requires: { luke: ["follow-the-trail", "who-is-lying"] },
    ask: [
      "Jon hørte noe plaske i brønnen, to ganger, men arkivet kaller det rykter. Kan du sjekke selv?",
    ],
    goal: "Se etter ved brønnen på torget hva som plasket.",
    steps: [
      {
        kind: "find",
        spot: "well-bucket",
        label: "Bøtta lå ved brønnen, full av is",
      },
    ],
    thanks:
      "Bare bøtta! Da kan jeg skrive det som bekreftet. Ta denne gamle ringbrynja fra arkivet.",
    reward: { xp: 30, unlock: ["gear:armour:chain"] },
    hint: { text: "Brønnen står midt på torget, øst for Arkivaren." },
  },
  {
    id: "kari-saw",
    title: "Det Kari så",
    giver: "kari",
    kind: "sanity",
    topic: "`reference`",
    // After «Noe varmt», and after the saksmappe (non-technical) or «Hvem
    // peker hit?» (technical): a new observation would turn up in the
    // saksmappe's reference picker, so it waits until that luke is done.
    requires: {
      side: ["warm-drink"],
      luke: ["case-file", "who-points-here"],
    },
    ask: ["Jeg så spor langs gjerdet, men ingen har skrevet det ned."],
    goal: "Publiser en ny observasjon med Kari som vitne og Gjerdet som sted.",
    steps: [
      {
        kind: "studio",
        label: "Publiser observasjonen",
        check: ({ ownObservations }) => {
          if (!ownObservations)
            return {
              done: false,
              message: "Spillet får ikke lest arkivet ditt ennå.",
            };
          const kari = ownObservations.filter(
            (o) => o.witness === "witness-kari",
          );
          if (kari.some((o) => o.place === "place-gjerdet"))
            return { done: true };
          return {
            done: false,
            message: kari.length
              ? "Observasjonen har Kari som vitne, men stedet er ikke Gjerdet."
              : "Kari venter på at noen skriver det ned.",
          };
        },
      },
    ],
    thanks: "Nå står det i arkivet, med mitt navn. Du kan få låne hjelmen min.",
    reward: { xp: 40, unlock: ["gear:hat:viking"] },
    hint: {
      text: "Lag en ny *Observasjon* i Studio. Velg Kari under *Vitne* og Gjerdet under *Sted*, skriv hva hun så, og trykk `Publish`.",
    },
  },
  {
    id: "market-basket",
    title: "Kurven til markedet",
    giver: "bakeren",
    kind: "sanity",
    topic: "*Publish* og `sprite`",
    // After the first luke of week 3 on either track.
    requires: { luke: ["baker-template", "baker-model"] },
    ask: ["Kurven til markedet er tom. Tre ulike ting, så ser den levende ut."],
    goal: "Publiser tre ting som ikke er våpen, med tre ulike sprites.",
    steps: [
      {
        kind: "studio",
        label: "Tre ulike ting i kurven",
        check: ({ items }) => {
          const sprites = new Set(
            items
              .filter(
                (item) => mine(item) && item.kind && item.kind !== "weapon",
              )
              .map((item) => item.spriteId)
              .filter(Boolean),
          );
          return sprites.size >= BASKET
            ? { done: true }
            : {
                done: false,
                message: `Kurven har ${sprites.size} av ${BASKET} ulike ting.`,
              };
        },
      },
    ],
    thanks: "Nå ser boden ut som et marked! Ta denne stjerna.",
    reward: { xp: 40, unlock: ["gear:extra:star"] },
    hint: {
      text: "Lag en drikk eller et materiale, og bytt *Sprite* til en du ikke har brukt i kurven ennå.",
    },
  },
];
