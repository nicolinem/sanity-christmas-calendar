// Other players' figures as ghosts in the village: not live, just strolling
// between GHOST_SPOTS, now and then two meeting for a chat. Pure rules, no
// Phaser, so they can be tested in node; WinterQuestScene draws them.

import type { About } from "./about";
import { normalizeFigure, randomFigure, type FigureChoice } from "./figure";
import { GHOST_SPOTS, pathRoute } from "./village";

type Point = { x: number; y: number };

export type GhostInput = {
  playerId: string;
  name: string;
  figure: FigureChoice;
  about: About | null;
};

export type Ghost = GhostInput & {
  x: number;
  y: number;
  facing: -1 | 1;
  walking: boolean;
  bubble: boolean; // chatting with `partner`: «…» over the head
  route: Point[];
  waitMs: number; // standing still, or how long the chat lasts
  partner: string | null;
};

export const GHOST_SPEED = 38; // px per second; the knight walks at 64
export const MAX_GHOSTS = 8;
const MEET_CHANCE = 0.25;
const MEET_GAP = 10; // px either side of the spot, facing each other

const between = (random: () => number, min: number, max: number) =>
  min + random() * (max - min);
const pick = <T>(list: readonly T[], random: () => number) =>
  list[Math.min(list.length - 1, Math.floor(random() * list.length))];

function shuffled<T>(list: readonly T[], random: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Who walks about in this village: others who share a figure and a name.
export function chooseGhosts(
  players: {
    playerId: string;
    name: string | null;
    figure: FigureChoice | null;
    about?: About | null;
  }[],
  ownId: string,
  random: () => number = Math.random,
): GhostInput[] {
  return shuffled(
    // Community data is other people's: a name that isn't plain text would
    // break the dialogue, so that player just isn't a ghost.
    players.filter(
      (p) =>
        p.playerId !== ownId &&
        p.figure &&
        typeof p.name === "string" &&
        p.name.trim(),
    ),
    random,
  )
    .slice(0, MAX_GHOSTS)
    .map((p) => ({
      playerId: p.playerId,
      name: p.name!.trim(),
      figure: normalizeFigure(p.figure),
      about: p.about ?? null,
    }));
}

export function spawnGhosts(
  inputs: GhostInput[],
  random: () => number = Math.random,
): Ghost[] {
  const spots = shuffled(GHOST_SPOTS, random);
  return inputs.map((input, i) => ({
    ...input,
    ...spots[i % spots.length],
    facing: random() < 0.5 ? -1 : 1,
    walking: false,
    bubble: false,
    route: [],
    waitMs: between(random, 0, 3000),
    partner: null,
  }));
}

function idle(g: Ghost, holdId: string | null) {
  return (
    g.playerId !== holdId && !g.partner && g.route.length === 0 && !g.walking
  );
}

function nextTarget(
  g: Ghost,
  ghosts: Ghost[],
  random: () => number,
  holdId: string | null,
) {
  const free = ghosts.filter((h) => h !== g && idle(h, holdId));
  if (free.length && random() < MEET_CHANCE) {
    const h = pick(free, random);
    const at = pick(GHOST_SPOTS, random);
    g.partner = h.playerId;
    h.partner = g.playerId;
    g.route = pathRoute(g, { x: at.x - MEET_GAP, y: at.y });
    h.route = pathRoute(h, { x: at.x + MEET_GAP, y: at.y });
    return;
  }
  const others = GHOST_SPOTS.filter((s) => s.x !== g.x || s.y !== g.y);
  g.route = pathRoute(g, pick(others, random));
}

// Moves every ghost on by `dtMs`. `holdId`: the ghost being talked to stands
// still and faces `face` (the player); the rest go on as normal.
export function stepGhosts(
  ghosts: Ghost[],
  dtMs: number,
  opts: { random?: () => number; holdId: string | null; face?: Point },
): void {
  const random = opts.random ?? Math.random;
  const byId = new Map(ghosts.map((g) => [g.playerId, g]));
  for (const g of ghosts) {
    if (g.playerId === opts.holdId) {
      g.walking = false;
      if (opts.face && opts.face.x !== g.x)
        g.facing = opts.face.x < g.x ? -1 : 1;
      continue;
    }

    if (g.route.length) {
      let left = (GHOST_SPEED * dtMs) / 1000;
      while (left > 0 && g.route.length) {
        const to = g.route[0];
        const dx = to.x - g.x;
        const dy = to.y - g.y;
        const d = Math.hypot(dx, dy);
        if (dx) g.facing = dx < 0 ? -1 : 1;
        if (d <= left) {
          g.x = to.x;
          g.y = to.y;
          g.route.shift();
          left -= d;
        } else {
          g.x += (dx / d) * left;
          g.y += (dy / d) * left;
          left = 0;
        }
      }
      g.walking = g.route.length > 0;
      if (!g.walking && !g.partner) g.waitMs = between(random, 3000, 9000);
      continue;
    }
    g.walking = false;

    const partner = g.partner ? byId.get(g.partner) : undefined;
    if (g.partner && (!partner || partner.partner !== g.playerId)) {
      // The other one is gone: just stand a while.
      g.partner = null;
      g.bubble = false;
      g.waitMs = between(random, 3000, 9000);
      continue;
    }
    if (partner) {
      if (partner.route.length || partner.walking) continue; // waiting for them
      if (!g.bubble) {
        const chat = between(random, 5000, 8000);
        for (const [a, b] of [
          [g, partner],
          [partner, g],
        ]) {
          a.bubble = true;
          a.waitMs = chat;
          if (b.x !== a.x) a.facing = b.x < a.x ? -1 : 1;
        }
        continue;
      }
      g.waitMs -= dtMs;
      if (g.waitMs <= 0) {
        for (const a of [g, partner]) {
          a.bubble = false;
          a.partner = null;
          a.waitMs = between(random, 1000, 3000);
        }
      }
      continue;
    }

    g.waitMs -= dtMs;
    if (g.waitMs <= 0) nextTarget(g, ghosts, random, opts.holdId);
  }
}

// For ?dev, where there's no community: four made-up players.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
export const DEV_GHOSTS: GhostInput[] = [
  {
    playerId: "devingrid",
    name: "Ingrid",
    figure: randomFigure(seeded(11)),
    about: {
      food: "pepperkaker",
      activity: "gå på ski",
      topics: ["GROQ", "hunden min", "surdeig"],
      saying: "Har du prøvd å skru den av og på?",
    },
  },
  {
    playerId: "devjonas",
    name: "Jonas",
    figure: randomFigure(seeded(23)),
    about: {
      food: "taco",
      activity: "spille brettspill",
      topics: ["Formel 1", "Portable Text", "kaffe"],
    },
  },
  {
    playerId: "devsofie",
    name: "Sofie",
    figure: randomFigure(seeded(37)),
    about: {
      food: "ribbe",
      activity: "strikke",
      topics: ["fuglekikking", "TypeScript", "podkaster"],
      saying: "Det ordner seg!",
    },
  },
  {
    playerId: "devemil",
    name: "Emil",
    figure: randomFigure(seeded(41)),
    about: {
      food: "sushi",
      activity: "løpe i skogen",
      topics: ["Sanity Studio", "bonsai", "kryssord"],
    },
  },
];
