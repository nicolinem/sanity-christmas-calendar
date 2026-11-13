import type { QuestState } from "@/game/quests/types";
import { giverOf } from "@/game/quests/label";
import { QUEST_SITES, type QuestSiteId } from "@/game/village";

// The one thing to do next for the current door, and where it happens. The
// tracker and the map both use this, so they never point different ways.
export type NextStep =
  | { kind: "giver"; label: string; where: string; site: QuestSiteId }
  | { kind: "code"; label: string; where?: undefined; questId: string }
  | { kind: "travel"; label: string; where: string; site: QuestSiteId }
  | { kind: "studio"; label: string; where: string }
  | { kind: "journal"; label: string; where: string; questId: string };

export function nextStep(current: QuestState | null): NextStep | null {
  if (!current) return null;
  const { quest } = current;
  if (current.pickup) {
    const place = QUEST_SITES[current.pickup].label.toLowerCase();
    return {
      kind: "travel",
      label: `Gå til ${place}`,
      where: `Oppgaven ligger ved ${place}. Trykk E der for å hente den.`,
      site: current.pickup,
    };
  }
  if (current.status === "offered") {
    const giver = giverOf(quest);
    return {
      kind: "giver",
      label: `Gå til ${giver.name}`,
      where: `${giver.name} står ${giver.at}. Trykk E når du er der.`,
      site: giver.site,
    };
  }
  const site = quest.villageSite;
  const place =
    site && site !== "forge" ? QUEST_SITES[site].label.toLowerCase() : null;
  // Once the giver has handed it over, the window opens from anywhere: the
  // button says it all, no place to explain.
  if (quest.checkedBy === "window")
    return { kind: "code", label: "Åpne kodevinduet", questId: quest.id };
  if (quest.checkedBy === "code")
    return {
      kind: "journal",
      label: "Se oppgaven",
      where: "Gjøres i koden din. Stegene står i journalen.",
      questId: quest.id,
    };
  if (site && site !== "forge" && place)
    return {
      kind: "travel",
      label: `Gå til ${place}`,
      where: `Gjøres ved ${place}.`,
      site,
    };
  return {
    kind: "studio",
    label: "Åpne Sanity Studio",
    where: "Gjøres i Sanity Studio. Spillet ser endringen med en gang.",
  };
}
