import type { About } from "./about";

// What other players' ghosts say in the village. `{ord}` is one of the
// speaker's own Om meg words, shown in colour; in `gossip`, `{navn}` is another
// ghost and `{ord}` one of that ghost's topics. Fixed in code: players never
// fetch new code after they've cloned, so these have to be right from the
// start. Spoken Norwegian, never han/hun about players.

export type LineKind =
  "food" | "activity" | "topic" | "saying" | "gossip" | "plain";

export const GHOST_LINES: Record<LineKind, string[]> = {
  // Any food: «taco», «pepperkaker», «mammas fiskekaker».
  food: [
    "Jeg kunne spist {ord} hver eneste dag.",
    "Vet du hva jeg har lyst på nå? Jo, {ord}.",
    "Hvis noen spanderer {ord}, er jeg med.",
    "Jeg drømte om {ord} i natt. Helt sant.",
    "Bakeren burde lage {ord}. Jeg har sagt det mange ganger.",
    "Det beste med desember er at ingen kommenterer hvor mye {ord} jeg spiser.",
    "Smia lukter nesten som {ord} i dag. Eller så er jeg bare sulten.",
    "Jeg har med meg {ord} i lomma. Ikke si det til noen.",
  ],
  // A bare verb phrase: «gå på ski», «strikke», «spille brettspill».
  activity: [
    "Skulle ønske jeg kunne {ord} nå i stedet for å stå her.",
    "Har du prøvd å {ord}? Du burde.",
    "I helga skal jeg bare {ord}. Ingen andre planer.",
    "Jeg blir aldri lei av å {ord}.",
    "Når lukene er ferdige, skal jeg {ord} resten av dagen.",
    "Jeg tenkte å {ord} i lunsjen. Blir du med?",
    "Folk synes det er rart at jeg liker å {ord}. Det får de bare synes.",
    "Det er ikke jul før jeg har fått {ord} minst én gang.",
  ],
  // Anything at all: «GROQ», «hunden min», «Formel 1».
  topic: [
    "Har du hørt om {ord}? Nei? Sett deg ned.",
    "Jeg kan prate om {ord} i timevis. Bare si fra hvis jeg skal stoppe.",
    "Spør meg om {ord}. Hva som helst.",
    "Jeg har tenkt på {ord} hele formiddagen.",
    "Unnskyld, jeg mistet tråden. Jeg tenkte på {ord} igjen.",
    "Hvis det kommer en luke om {ord}, vinner jeg.",
    "Noen må snakke om {ord}, og det blir visst meg.",
    "Jeg prøvde å fortelle Brann om {ord}. Det gikk ikke så bra.",
  ],
  // A whole sentence the player wrote, said as it is.
  saying: [
    "Du vet hva jeg alltid sier: {ord}",
    "Som jeg pleier å si: {ord}",
    "Jeg sier det igjen: {ord}",
    "Hvis du bare skal huske én ting fra meg: {ord}",
    "Noen synes det er rart, men jeg står for det: {ord}",
    "Skriv dette ned: {ord}",
  ],
  // About another ghost in the village and one of their topics.
  gossip: [
    "{navn} begynte å snakke om {ord} igjen. Ikke spør.",
    "Har du snakket med {navn}? Det handler mye om {ord} for tiden.",
    "Jeg spurte {navn} om veien og fikk en hel forelesning om {ord}.",
    "{navn} sier at {ord} er det beste som finnes. Jeg er ikke overbevist.",
    "Ikke nevn {ord} når {navn} er i nærheten. Da blir du stående lenge.",
    "Jeg tror {navn} har en hemmelig plan, og den handler om {ord}.",
    "{navn} og jeg pratet om {ord} i en time. Eller, det var ikke jeg som pratet.",
  ],
  // For everyone, also those without Om meg.
  plain: [
    "Kaldt i dag, hva?",
    "Har du vært innom bakeriet? Det lukter fantastisk der.",
    "Jeg skulle bare ta en liten tur, og så ble det tre runder rundt torget.",
    "Jeg venter på neste luke. Det er verre enn å vente på julaften.",
    "Snøen knaser så fint her.",
    "Brann har fyrt godt i smia i dag.",
    "Hei! Godt å se et kjent fjes.",
    "Jeg har gått meg vill to ganger i dag. Bygda er større enn den ser ut.",
  ],
};

const MAX_LENGTH = 140;
const PLACEHOLDER = /\{[^}]*\}/g;
const PRONOUN = /(^|[^\p{L}])(han|hun|ham|henne|hans|hennes)(?=[^\p{L}]|$)/iu;

// What's wrong with a line, if anything. Empty means it may be used.
export function lineProblems(kind: LineKind, template: string): string[] {
  const problems: string[] = [];
  const slots = template.match(PLACEHOLDER) ?? [];
  const count = (slot: string) => slots.filter((s) => s === slot).length;
  if (template.length > MAX_LENGTH)
    problems.push(`longer than ${MAX_LENGTH} characters`);
  if (slots.some((s) => s !== "{ord}" && s !== "{navn}"))
    problems.push("unknown placeholder");
  if (kind === "plain") {
    if (slots.length) problems.push("plain lines have no placeholder");
  } else {
    if (count("{ord}") !== 1) problems.push("needs exactly one {ord}");
    if (kind === "gossip" && count("{navn}") !== 1)
      problems.push("needs exactly one {navn}");
    if (kind !== "gossip" && count("{navn}"))
      problems.push("only gossip has {navn}");
  }
  if (PRONOUN.test(template)) problems.push("uses han/hun: use the name");
  return problems;
}

export type Talker = { playerId: string; name: string; about: About | null };
export type LinePart = { text: string; word?: true };
export type PickedLine = { template: string; parts: LinePart[] };

const pick = <T>(list: readonly T[], random: () => number) =>
  list[Math.min(list.length - 1, Math.floor(random() * list.length))];

// One line for `speaker` to say. `others` are the other ghosts in the village,
// for gossip. Never the same template twice in a row.
export function pickLine(
  speaker: Talker,
  others: Talker[],
  lastTemplate: string | null,
  random: () => number = Math.random,
): PickedLine {
  const about = speaker.about;
  const gossipees = others.filter(
    (o) => o.playerId !== speaker.playerId && (o.about?.topics.length ?? 0) > 0,
  );
  const kinds: LineKind[] = ["plain"];
  if (about?.food) kinds.push("food");
  if (about?.activity) kinds.push("activity");
  if (about?.topics.length) kinds.push("topic");
  if (about?.saying) kinds.push("saying");
  if (gossipees.length) kinds.push("gossip");

  const kind = pick(kinds, random);
  const all = GHOST_LINES[kind];
  const fresh = all.filter((t) => t !== lastTemplate);
  const template = pick(fresh.length ? fresh : all, random);

  let word = "";
  let name = "";
  if (kind === "food") word = about!.food;
  else if (kind === "activity") word = about!.activity;
  else if (kind === "topic") word = pick(about!.topics, random);
  else if (kind === "saying") word = about!.saying!;
  else if (kind === "gossip") {
    const other = pick(gossipees, random);
    name = other.name;
    word = pick(other.about!.topics, random);
  }

  const parts: LinePart[] = [];
  const text = (t: string) => {
    if (!t) return;
    const last = parts.at(-1);
    if (last && !last.word) last.text += t;
    else parts.push({ text: t });
  };
  let at = 0;
  for (const match of template.matchAll(PLACEHOLDER)) {
    text(template.slice(at, match.index));
    if (match[0] === "{ord}") parts.push({ text: word, word: true });
    else text(name);
    at = match.index! + match[0].length;
  }
  text(template.slice(at));
  return { template, parts };
}
