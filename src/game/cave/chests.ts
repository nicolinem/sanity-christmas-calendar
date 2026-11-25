import type { Toast } from "@/components/hud/Toasts";

// What the player is told when a rest floor's chest opens, by chest id.
export const CHEST_TOASTS: Record<string, Omit<Toast, "id">> = {
  "cave-5": {
    title: "Rustning",
    body: "Du fant den i kista på etasje 5.",
    tone: "lesson",
  },
  "cave-10": {
    title: "Kista på etasje 10",
    body: "Den var full av gamle notater. Du fikk 100 XP.",
    tone: "lesson",
  },
};
