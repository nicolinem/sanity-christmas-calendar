// Name magic: a weapon's name can carry an element. "Flaming Sword" burns,
// "Glødende øks" too. The game reads the name; the player never sets a number.
//
// Deliberately simple: words are matched by how they start, in English and
// Norwegian. That's charming and also brittle ("Gift of Yule" turns out to be
// poison, Norwegian compounds like "Isbrann" slip through), which is exactly
// what the chapter 2 quest "The Runes Fail" is about.
//
// No imports, so the Studio can use it too (the Guild's Law quest).

export type Element = "fire" | "frost" | "lightning" | "poison" | "light";

export const ELEMENTS: Record<Element, { title: string }> = {
  fire: { title: "Fire" },
  frost: { title: "Frost" },
  lightning: { title: "Lightning" },
  poison: { title: "Poison" },
  light: { title: "Light" },
};

// A word carries an element if it starts with one of these.
const STEMS: Record<Element, string[]> = {
  fire: ["fire", "flam", "blaz", "ember", "inferno", "burn", "scorch", "pyre", "ild", "flamm", "glød", "bål", "gnist"],
  frost: ["frost", "ice", "icy", "froz", "glacier", "glacial", "rime", "winter", "snow", "snø", "kulde", "kald", "frys"],
  lightning: ["thunder", "storm", "lightning", "volt", "spark", "torden", "lyn"],
  poison: ["venom", "toxic", "poison", "blight", "plague", "gift", "eiter"],
  light: ["holy", "radiant", "dawn", "solar", "light", "bright", "lys", "hellig"],
};

// Short words that would match far too much as stems, so they must stand alone.
const WHOLE_WORDS: Record<string, Element> = { is: "frost", isen: "frost", rim: "frost", sol: "light", sun: "light" };

// Old names with a little extra power. Not listed anywhere in the game: found by trying.
export const SECRET_WORDS: Record<string, Element> = {
  surt: "fire",
  muspel: "fire",
  brann: "fire",
  nifl: "frost",
  ymir: "frost",
  mjølner: "lightning",
  mjolnir: "lightning",
  thor: "lightning",
  jormund: "poison",
  balder: "light",
};

export type RuneMatch = { element: Element; word: string; secret: boolean };

function words(name: string) {
  return name.toLowerCase().match(/[a-zæøåäöü]+/g) ?? [];
}

// Every element the name carries, once each, in the order they appear.
export function findElements(name: string | null | undefined): RuneMatch[] {
  const found: RuneMatch[] = [];
  for (const word of words(name ?? "")) {
    let match: RuneMatch | null = null;
    if (SECRET_WORDS[word]) match = { element: SECRET_WORDS[word], word, secret: true };
    else if (WHOLE_WORDS[word]) match = { element: WHOLE_WORDS[word], word, secret: false };
    else
      for (const [element, stems] of Object.entries(STEMS) as [Element, string[]][]) {
        const stem = stems.find((s) => word.startsWith(s));
        if (stem) {
          match = { element, word: stem, secret: false };
          break;
        }
      }
    if (match && !found.some((f) => f.element === match.element)) found.push(match);
  }
  return found;
}

// What a name amounts to: one element, none, or two that cancel out.
export type NameMagic =
  | { kind: "none" }
  | { kind: "element"; element: Element; match: RuneMatch }
  | { kind: "fizzle"; matches: RuneMatch[] }; // the Guild forbids these

export function readName(name: string | null | undefined): NameMagic {
  const found = findElements(name);
  if (found.length === 0) return { kind: "none" };
  if (found.length === 1) return { kind: "element", element: found[0].element, match: found[0] };
  return { kind: "fizzle", matches: found };
}
