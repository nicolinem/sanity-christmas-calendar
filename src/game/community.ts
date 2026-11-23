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
  hints?: number | null; // hints used, only when the player shares them
  at: string;
};

// Hints counted per luke, at most this many (every luke has three).
export const MAX_HINTS = 9;

export type CommunityWeapon = { name: string; spriteId: string | null };
export type CommunityPlayer = {
  playerId: string;
  completedCount: number;
  forgeLevel: number;
  weapon: CommunityWeapon | null;
  figure: FigureChoice | null;
  name: string | null;
  // Hints used per finished luke, or null when the player keeps them private.
  hints: Record<string, number> | null;
};

export function forgeLevelFromMilestones(questIds: Iterable<string>) {
  const completed = new Set(questIds);
  return clampForgeLevel(
    1 +
      CHAPTERS.flatMap((chapter) => chapter.quests).reduce(
        (level, quest) =>
          level +
          (completed.has(quest.id) ? (quest.reward?.forgeLevel ?? 0) : 0),
        0,
      ),
  );
}

export function playersFromMilestones(
  milestones: { playerId: string; questId: string; hints?: number | null }[],
  profiles: (Pick<CommunityPlayer, "playerId" | "weapon"> &
    Partial<Pick<CommunityPlayer, "figure" | "name">>)[],
): CommunityPlayer[] {
  const completed = new Map<string, Set<string>>();
  const hints = new Map<string, Record<string, number>>();
  for (const { playerId, questId, hints: used } of milestones) {
    if (!completed.has(playerId)) completed.set(playerId, new Set());
    completed.get(playerId)!.add(questId);
    if (typeof used === "number") {
      if (!hints.has(playerId)) hints.set(playerId, {});
      hints.get(playerId)![questId] = used;
    }
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
      hints: hints.get(playerId) ?? null,
    }))
    .sort(
      (a, b) =>
        b.completedCount - a.completedCount ||
        a.playerId.localeCompare(b.playerId),
    );
}

export function characterFor(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const { playerId, character } = input as Record<string, unknown>;
  if (
    typeof playerId !== "string" ||
    !/^[a-z0-9]{6,20}$/.test(playerId) ||
    !character ||
    typeof character !== "object"
  )
    return null;
  const { weapon, figure, name, visible } = character as Record<
    string,
    unknown
  >;
  if (visible !== undefined && typeof visible !== "boolean") return null;
  if (figure != null && !isSmallStringRecord(figure)) return null;
  // A weapon the page can't show is left off (or its sprite is), so it never
  // keeps the figure, name and finished doors from being shared.
  const w = weapon as Partial<CommunityWeapon> | null | undefined;
  const weaponName =
    w && typeof w === "object" && typeof w.name === "string"
      ? w.name.trim()
      : "";
  const spriteOk =
    typeof w?.spriteId === "string" &&
    hasKnownSprite(w.spriteId) &&
    isSpriteAllowedForKind(w.spriteId, "weapon");
  const shared: CommunityWeapon | null =
    weaponName && weaponName.length <= 64
      ? { name: weaponName, spriteId: spriteOk ? w!.spriteId! : null }
      : null;
  return {
    _id: `communityPlayer.${playerId}`,
    _type: "communityPlayer" as const,
    playerId,
    visible: visible === true,
    weapon: shared,
    ...(figure != null
      ? { figure: normalizeFigure(figure as Record<string, string>) }
      : {}),
    ...(displayName(name) ? { name: displayName(name)! } : {}),
  };
}

// A stored figure: a plain object of a few short strings. Unknown ids are fine,
// normalizeFigure turns them into defaults.
function isSmallStringRecord(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    return false;
  const values = Object.values(value);
  return (
    values.length <= 20 &&
    values.every((v) => typeof v === "string" && v.length <= 24)
  );
}

function displayName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return /^[\p{L}\p{N} '-]{1,24}$/u.test(name) ? name : null;
}

// Only known quests and Sanity project IDs may become document IDs or public data.
export function milestonesFor(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const { playerId, questIds, hints } = input as Record<string, unknown>;
  if (
    typeof playerId !== "string" ||
    !/^[a-z0-9]{6,20}$/.test(playerId) ||
    !Array.isArray(questIds) ||
    questIds.length > 100 ||
    !questIds.every((id) => typeof id === "string" && questTitles.has(id)) ||
    (hints != null && !isHintCounts(hints))
  )
    return null;
  const counts = hints as Record<string, number> | null | undefined;
  return [...new Set(questIds as string[])].map((questId) => ({
    _id: `questMilestone.${playerId}.${questId}`,
    _type: "questMilestone" as const,
    playerId,
    questId,
    title: questTitles.get(questId)!,
    ...(counts ? { hints: counts[questId] ?? 0 } : {}),
  }));
}

// Whether the player shares hint counts: true (an object was sent), false
// (null was sent: remove any already shared), or undefined (left as is).
export function sharesHints(input: unknown): boolean | undefined {
  if (!input || typeof input !== "object" || !Object.hasOwn(input, "hints"))
    return undefined;
  return (input as Record<string, unknown>).hints != null;
}

function isHintCounts(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= 100 &&
    entries.every(
      ([id, n]) =>
        questTitles.has(id) &&
        Number.isInteger(n) &&
        (n as number) >= 0 &&
        (n as number) <= MAX_HINTS,
    )
  );
}
