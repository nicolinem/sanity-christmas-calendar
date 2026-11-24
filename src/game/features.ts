// Features that are built but not switched on for players yet. Turn one on
// locally with its env var in .env.local, for example NEXT_PUBLIC_FEATURE_RPG=1.
export const FEATURES = {
  // Forge levels and damage as progress: «Nivå 2», the level pips and
  // «Våpnene dine gjør nå 6 skade». Off until there are more enemies to fight.
  rpg: process.env.NEXT_PUBLIC_FEATURE_RPG === "1",
};
