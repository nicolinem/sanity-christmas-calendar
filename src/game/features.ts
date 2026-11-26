// Built features. Every one is on unless its env var is set to 0, for example
// NEXT_PUBLIC_FEATURE_CAVE=0 in .env.local (or on Vercel) to switch the cave
// off. New features follow the same rule: on by default, a flag to turn off.
const on = (value: string | undefined) => value !== "0";

const cave = on(process.env.NEXT_PUBLIC_FEATURE_CAVE);

export const FEATURES = {
  // Forge levels and damage as progress: «Nivå 2», the level pips and
  // «Våpnene dine gjør nå 6 skade». On whenever the cave is on, since the cave
  // is where the levels are earned.
  rpg: on(process.env.NEXT_PUBLIC_FEATURE_RPG) || cave,
  // The cave («grotta») under the village: floors of enemies and materials
  // (docs/plan-grotta.md).
  cave,
  // Side quests from people in the village (docs/plan-sideoppdrag.md).
  sideQuests: on(process.env.NEXT_PUBLIC_FEATURE_SIDE_QUESTS),
};
