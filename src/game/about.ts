// «Om meg»: what a player writes about themself in the character sheet. Other
// players' ghosts in the village say lines with these words in them
// (src/game/ghostLines.ts). Shared with the community server next to the
// name and figure, so the same rules run on both sides.

export type About = {
  food: string;
  activity: string; // a verb phrase, without a leading «å»: «gå på ski»
  topics: string[];
  saying?: string; // a whole sentence the ghost says as it is
};

export const ABOUT_LIMITS = {
  text: 40,
  saying: 80,
  minTopics: 3,
  maxTopics: 8,
};

export type AboutField = "food" | "activity" | "topics";

const DISALLOWED = /[^\p{L}\p{N} .,!?'"«»\-:()]/gu;

// While typing: drop what isn't allowed and cut to the limit. Spaces stay, so
// a word can be followed by the next one.
export function cleanAboutText(value: string, max: number): string {
  return value.replace(DISALLOWED, "").slice(0, max);
}

const clean = (value: string, max: number) => cleanAboutText(value, max).trim();

// A stored or received Om meg, cleaned. Null when it isn't shaped like one at
// all; missing fields become empty.
export function normalizeAbout(input: unknown): About | null {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  )
    return null;
  const { food, activity, topics, saying } = input as Record<string, unknown>;
  const optionalString = (v: unknown) =>
    v === undefined || typeof v === "string";
  if (
    !optionalString(food) ||
    !optionalString(activity) ||
    !optionalString(saying) ||
    (topics !== undefined &&
      (!Array.isArray(topics) ||
        topics.length > 20 ||
        !topics.every((t) => typeof t === "string")))
  )
    return null;

  const seen = new Set<string>();
  const cleanTopics: string[] = [];
  for (const topic of (topics as string[] | undefined) ?? []) {
    const text = clean(topic, ABOUT_LIMITS.text);
    const key = text.toLocaleLowerCase("nb");
    if (!text || seen.has(key)) continue;
    seen.add(key);
    cleanTopics.push(text);
    if (cleanTopics.length === ABOUT_LIMITS.maxTopics) break;
  }
  const cleanSaying = clean(
    (saying as string | undefined) ?? "",
    ABOUT_LIMITS.saying,
  );
  return {
    food: clean((food as string | undefined) ?? "", ABOUT_LIMITS.text),
    activity: clean(
      clean((activity as string | undefined) ?? "", ABOUT_LIMITS.text).replace(
        /^å\s+/i,
        "",
      ),
      ABOUT_LIMITS.text,
    ),
    topics: cleanTopics,
    ...(cleanSaying ? { saying: cleanSaying } : {}),
  };
}

// How far the Om meg tab is, and what to say next to a grey Ferdig. Only
// required while the player shares their profile: nobody else sees it
// otherwise.
export function aboutProgress(
  about: About | null | undefined,
  sharing: boolean,
): {
  done: number;
  total: 3;
  complete: boolean;
  firstMissing: AboutField | null;
  message: string | null;
} {
  const food = Boolean(about?.food.trim());
  const activity = Boolean(about?.activity.trim());
  const topicCount = about?.topics.filter((t) => t.trim()).length ?? 0;
  const topics = topicCount >= ABOUT_LIMITS.minTopics;
  const done = [food, activity, topics].filter(Boolean).length;
  const firstMissing: AboutField | null = !food
    ? "food"
    : !activity
      ? "activity"
      : !topics
        ? "topics"
        : null;
  if (!sharing || !firstMissing)
    return {
      done,
      total: 3,
      complete: true,
      firstMissing: null,
      message: null,
    };
  const left = ABOUT_LIMITS.minTopics - topicCount;
  const message =
    firstMissing === "food"
      ? "Skriv inn favorittmaten din, så får andre i bygda høre om den."
      : firstMissing === "activity"
        ? "Skriv inn noe du liker å gjøre, så får andre i bygda høre om det."
        : left === 1
          ? "Skriv minst én ting til, så får andre i bygda høre om den."
          : `Skriv ${left} ting til som du prater om.`;
  return { done, total: 3, complete: false, firstMissing, message };
}
