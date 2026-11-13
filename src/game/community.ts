import { CHAPTERS } from "./quests/chapters";
import { clampForgeLevel } from "./rules";
import { hasKnownSprite, isSpriteAllowedForKind } from "./sprites";

const questTitles = new Map(
  CHAPTERS.flatMap((chapter) =>
    chapter.quests.map((quest) => [quest.id, quest.title] as const),
  ),
);

export type CommunityEvent = {
  playerId: string;
  questId: string;
  title: string;
  at: string;
};

export type CommunityWeapon = { name: string; spriteId: string | null };
export type CommunityPlayer = {
  playerId: string;
  completedCount: number;
  forgeLevel: number;
  weapon: CommunityWeapon | null;
};

export function forgeLevelFromMilestones(questIds: Iterable<string>) {
  const completed = new Set(questIds);
  return clampForgeLevel(1 + CHAPTERS.flatMap((chapter) => chapter.quests)
    .reduce((level, quest) => level + (completed.has(quest.id) ? quest.reward?.forgeLevel ?? 0 : 0), 0));
}

export function playersFromMilestones(
  milestones: Pick<CommunityEvent, "playerId" | "questId">[],
  profiles: Pick<CommunityPlayer, "playerId" | "weapon">[],
): CommunityPlayer[] {
  const completed = new Map<string, Set<string>>();
  for (const { playerId, questId } of milestones) {
    if (!completed.has(playerId)) completed.set(playerId, new Set());
    completed.get(playerId)!.add(questId);
  }
  const weapons = new Map(profiles.map(({ playerId, weapon }) => [playerId, weapon]));
  return [...new Set([...completed.keys(), ...weapons.keys()])]
    .map((playerId) => ({
      playerId,
      completedCount: completed.get(playerId)?.size ?? 0,
      forgeLevel: forgeLevelFromMilestones(completed.get(playerId) ?? []),
      weapon: weapons.get(playerId) ?? null,
    }))
    .sort((a, b) => b.completedCount - a.completedCount || a.playerId.localeCompare(b.playerId));
}

export function characterFor(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const { playerId, character } = input as Record<string, unknown>;
  if (typeof playerId !== "string" || !/^[a-z0-9]{6,20}$/.test(playerId) ||
      !character || typeof character !== "object") return null;
  const weapon = (character as Record<string, unknown>).weapon;
  if (weapon !== null && (
    !weapon || typeof weapon !== "object" ||
    typeof (weapon as CommunityWeapon).name !== "string" ||
    !(weapon as CommunityWeapon).name.trim() ||
    (weapon as CommunityWeapon).name.length > 64 ||
    ((weapon as CommunityWeapon).spriteId !== null &&
      (typeof (weapon as CommunityWeapon).spriteId !== "string" ||
        !hasKnownSprite((weapon as CommunityWeapon).spriteId) ||
        !isSpriteAllowedForKind((weapon as CommunityWeapon).spriteId, "weapon")))
  )) return null;
  return {
    _id: `communityPlayer.${playerId}`,
    _type: "communityPlayer" as const,
    playerId,
    weapon: weapon === null ? null : {
      name: (weapon as CommunityWeapon).name.trim(),
      spriteId: (weapon as CommunityWeapon).spriteId,
    },
  };
}

// Only known quests and Sanity project IDs may become document IDs or public data.
export function milestonesFor(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const { playerId, questIds } = input as Record<string, unknown>;
  if (
    typeof playerId !== "string" ||
    !/^[a-z0-9]{6,20}$/.test(playerId) ||
    !Array.isArray(questIds) ||
    questIds.length > 100 ||
    !questIds.every((id) => typeof id === "string" && questTitles.has(id))
  ) return null;
  return [...new Set(questIds as string[])].map((questId) => ({
    _id: `questMilestone.${playerId}.${questId}`,
    _type: "questMilestone" as const,
    playerId,
    questId,
    title: questTitles.get(questId)!,
  }));
}