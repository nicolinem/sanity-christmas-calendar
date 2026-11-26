import type { Toast } from "@/components/hud/Toasts";

// What the player is told when a rest floor's chest opens, by chest id.
export const CHEST_TOASTS: Record<string, Omit<Toast, "id">> = {
  "cave-5": {
    title: "Rustning og en oppskrift",
    body: "Kista på etasje 5 hadde rustning og oppskriften på et isskjold.",
    tone: "lesson",
  },
  "cave-10": {
    title: "Kista på etasje 10",
    body: "Den var full av gamle notater, og ett var oppskriften på en ishjelm. Du fikk 100 XP.",
    tone: "lesson",
  },
};
