import { forgedPower } from "./rules";

// The toast for a new player level. A luke's own celebration already shows
// the level, so it gets none here.
export function levelUpToast(
  before: number,
  after: number,
  fromLuke: boolean,
): { title: string; body: string } | null {
  if (after <= before || fromLuke) return null;
  return {
    title: `Nivå ${after}`,
    body: `Våpnene dine gjør nå ${forgedPower(after).damage} skade.`,
  };
}
