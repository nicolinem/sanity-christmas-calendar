// The code the player wrote in the code window, kept between visits.
export const draftKey = (questId: string) => `winter-quest:code:${questId}`;

export function loadDraft(questId: string, fallback: string) {
  try {
    return window.localStorage.getItem(draftKey(questId)) ?? fallback;
  } catch {
    return fallback;
  }
}
