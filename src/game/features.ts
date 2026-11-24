// Features that are built but not switched on for players yet. Turn one on
// locally with its env var in .env.local, for example NEXT_PUBLIC_FEATURE_RPG=1.
export const FEATURES = {
  // Forge levels and damage as progress: «Nivå 2», the level pips and
  // «Våpnene dine gjør nå 6 skade». Off until there are more enemies to fight.
  rpg: process.env.NEXT_PUBLIC_FEATURE_RPG === "1",
  // Side quests from people in the village (docs/plan-sideoppdrag.md).
  // Off until phase S1 is played through; then the default flips to on.
  sideQuests: process.env.NEXT_PUBLIC_FEATURE_SIDE_QUESTS === "1",
};
