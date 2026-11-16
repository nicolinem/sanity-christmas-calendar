import { normalizeFigure, type FigureChoice } from "./figure";
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
  figure: FigureChoice | null;
  name: string | null;
};

export function forgeLevelFromMilestones(questIds: Iterable<string>) {
  const completed = new Set(questIds);
  return clampForgeLevel(1 + CHAPTERS.flatMap((chapter) => chapter.quests)
    .reduce((level, quest) => level + (completed.has(quest.id) ? quest.reward?.forgeLevel ?? 0 : 0), 0));
}

export function playersFromMilestones(
  milestones: Pick<CommunityEvent, "playerId" | "questId">[],
  profiles: (Pick<CommunityPlayer, "playerId" | "weapon"> & Partial<Pick<CommunityPlayer, "figure" | "name">>)[],
): CommunityPlayer[] {
  const completed = new Map<string, Set<string>>();
  for (const { playerId, questId } of milestones) {
    if (!completed.has(playerId)) completed.set(playerId, new Set());
    completed.get(playerId)!.add(questId);
  }
  const byId = new Map(profiles.map((profile) => [profile.playerId, profile]));
  return [...new Set([...completed.keys(), ...byId.keys()])]
    .map((playerId) => ({
      playerId,
      completedCount: completed.get(playerId)?.size ?? 0,
      forgeLevel: forgeLevelFromMilestones(completed.get(playerId) ?? []),
      weapon: byId.get(playerId)?.weapon ?? null,
      figure: byId.get(playerId)?.figure ?? null,
      name: byId.get(playerId)?.name ?? null,
    }))
    .sort((a, b) => b.completedCount - a.completedCount || a.playerId.localeCompare(b.playerId));
}

export function characterFor(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const { playerId, character } = input as Record<string, unknown>;
  if (typeof playerId !== "string" || !/^[a-z0-9]{6,20}$/.test(playerId) ||
      !character || typeof character !== "object") return null;
  const { weapon, figure, name } = character as Record<string, unknown>;
  if (figure != null && !isSmallStringRecord(figure)) return null;
  // A weapon the page can't show is left off (or its sprite is), so it never
  // keeps the figure, name and finished doors from being shared.
  const w = weapon as Partial<CommunityWeapon> | null | undefined;
  const weaponName = w && typeof w === "object" && typeof w.name === "string" ? w.name.trim() : "";
  const spriteOk = typeof w?.spriteId === "string" &&
    hasKnownSprite(w.spriteId) && isSpriteAllowedForKind(w.spriteId, "weapon");
  const shared: CommunityWeapon | null = weaponName && weaponName.length <= 64
    ? { name: weaponName, spriteId: spriteOk ? w!.spriteId! : null }
    : null;
  return {
    _id: `communityPlayer.${playerId}`,
    _type: "communityPlayer" as const,
    playerId,
    weapon: shared,
    ...(figure != null ? { figure: normalizeFigure(figure as Record<string, string>) } : {}),
    ...(displayName(name) ? { name: displayName(name)! } : {}),
  };
}

// A stored figure: a plain object of a few short strings. Unknown ids are fine,
// normalizeFigure turns them into defaults.
function isSmallStringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype) return false;
  const values = Object.values(value);
  return values.length <= 20 && values.every((v) => typeof v === "string" && v.length <= 24);
}

function displayName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return /^[\p{L}\p{N} '-]{1,24}$/u.test(name) ? name : null;
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