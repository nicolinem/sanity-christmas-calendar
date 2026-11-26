// Arkivarens observasjoner (uke 2). Two sets of the same kind of content:
//
// 1. A fixed practice dataset for the technical track. GROQ runs against it in
//    the code window, so everyone gets the same answers. Unfiltered, the
//    rumours around the square pull the trail there; only the confirmed
//    observations lead from the forest edge to the bakery.
// 2. A handful of documents written into the non-technical player's own
//    project, for the source check and the reference task in their Studio.
//
// Arkivaren's rule: an observation is confirmed when someone saw it
// themselves and it has a picture, or another witness saw the same place.

export type ArchivePlace = {
  _id: string;
  _type: "place";
  name: string;
  x: number;
  y: number;
};
export type ArchiveWitness = { _id: string; _type: "witness"; name: string };
export type ArchiveObservation = {
  _id: string;
  _type: "observation";
  what: string;
  time: string; // "HH:MM", the same evening
  status: "confirmed" | "rumor";
  seen: boolean; // false: heard it from someone else
  place: { _type: "reference"; _ref: string };
  witness: { _type: "reference"; _ref: string };
  image?: { _type: "image"; asset: { _type: "reference"; _ref: string } };
};
export type ArchiveDoc = ArchivePlace | ArchiveWitness | ArchiveObservation;

// x and y are percent of the village map (src/game/village.ts), so the code
// window can draw them over the real village.
export const PLACES: ArchivePlace[] = [
  { _id: "place-skogkanten", _type: "place", name: "Skogkanten", x: 9, y: 13 },
  { _id: "place-gjerdet", _type: "place", name: "Gjerdet", x: 27, y: 30 },
  { _id: "place-smia", _type: "place", name: "Smia", x: 42, y: 24 },
  { _id: "place-bakeriet", _type: "place", name: "Bakeriet", x: 61, y: 24 },
  { _id: "place-torget", _type: "place", name: "Torget", x: 36, y: 53 },
  { _id: "place-bronnen", _type: "place", name: "Brønnen", x: 48, y: 50 },
];

export const WITNESSES: ArchiveWitness[] = [
  "Ola",
  "Kari",
  "Per",
  "Liv",
  "Nils",
  "Mari",
  "Jon",
  "Siri",
].map((name) => ({
  _id: `witness-${name.toLowerCase()}`,
  _type: "witness",
  name,
}));

const ref = (id: string) => ({ _type: "reference" as const, _ref: id });
const PHOTO = {
  _type: "image" as const,
  asset: ref("image-footprints-16x16-png"),
};

let n = 0;
function obs(
  place: string,
  time: string,
  what: string,
  witness: string,
  opts: { seen?: boolean; image?: boolean; status: "confirmed" | "rumor" },
): ArchiveObservation {
  n += 1;
  return {
    _id: `obs-${String(n).padStart(2, "0")}`,
    _type: "observation",
    what,
    time,
    status: opts.status,
    seen: opts.seen ?? false,
    place: ref(`place-${place}`),
    witness: ref(`witness-${witness}`),
    ...(opts.image ? { image: PHOTO } : {}),
  };
}

const C = { seen: true, status: "confirmed" } as const;

// The trail: forest edge → fence → forge → bakery.
const CONFIRMED = [
  obs("skogkanten", "18:10", "Store fotspor i snøen", "ola", {
    ...C,
    image: true,
  }),
  obs("gjerdet", "18:32", "Spor langs gjerdet", "kari", { ...C, image: true }),
  obs("smia", "18:45", "Rim på smiedøra", "per", C),
  obs("smia", "18:47", "Noe stort gikk forbi vinduet", "liv", C),
  obs("bakeriet", "19:05", "Kaker har forsvunnet", "mari", C),
  obs("bakeriet", "19:10", "Iskaldt i rommet etterpå", "nils", C),
];

// Seen, but not enough for the rule: one witness twice, and one alone.
const SEEN_RUMOURS = [
  obs("bronnen", "18:20", "Noe plasket i brønnen", "jon", {
    seen: true,
    status: "rumor",
  }),
  obs("bronnen", "18:50", "Det plasket igjen", "jon", {
    seen: true,
    status: "rumor",
  }),
  obs("torget", "19:40", "En skygge ved juletreet", "siri", {
    seen: true,
    status: "rumor",
  }),
];

// Heard from someone else. Most of it is about the square.
const HEARD: [string, string][] = [
  ["torget", "Noen sier det var et troll på torget"],
  ["torget", "Hørte et brøl ved juletreet"],
  ["torget", "Bodene ristet visst"],
  ["torget", "Noen så lys over torget, sies det"],
  ["torget", "En hest ble skremt, har jeg hørt"],
  ["torget", "Det knaket i isen ved torget"],
  ["torget", "Juletreet skal ha vridd seg"],
  ["torget", "Noen hørte tromming"],
  ["torget", "Visst fotspor ved brønnkanten på torget"],
  ["torget", "Sies at monsteret bor under torget"],
  ["torget", "En kurv med epler ble borte"],
  ["torget", "Noen så to øyne i mørket"],
  ["torget", "Lyden kom fra torget, sier naboen"],
  ["torget", "Folk løp fra torget"],
  ["torget", "En lykt slukket av seg selv"],
  ["torget", "Kald vind midt på torget"],
  ["torget", "Hørte at markedet blir avlyst"],
  ["torget", "Noe hylte ved bodene"],
  ["torget", "Snøen var tråkket ned overalt"],
  ["torget", "En katt nektet å gå over torget"],
  ["bronnen", "Brønnvannet frøs på et øyeblikk"],
  ["bronnen", "Sies at noe drakk av brønnen"],
  ["bronnen", "Bøtta var borte, har jeg hørt"],
  ["bronnen", "Rimfrost på brønntaket"],
  ["bronnen", "Noen hørte et sukk fra brønnen"],
  ["skogkanten", "Trærne bøyde seg visst"],
  ["skogkanten", "Det knakk i skogen"],
  ["skogkanten", "Hørte at ulvene var redde"],
  ["skogkanten", "Noen mistet lua i skogen"],
  ["skogkanten", "Lys mellom trærne, sies det"],
  ["smia", "Ilden i smia skal ha blafret"],
  ["smia", "Noen hørte hamring om natta"],
  ["smia", "Ambolten var kald om morgenen"],
  ["gjerdet", "Gjerdet knirket, sier de"],
  ["gjerdet", "En stolpe i gjerdet er visst knekt"],
  ["bakeriet", "Det luktet pepperkaker ute i snøen"],
  ["bakeriet", "Noen så melspor i snøen"],
];
const TELLERS = [
  "jon",
  "liv",
  "jon",
  "ola",
  "kari",
  "mari",
  "per",
  "siri",
  "nils",
  "jon",
];
const HEARD_RUMOURS = HEARD.map(([place, what], i) => {
  const minutes = 17 * 60 + 30 + ((i * 37) % 210); // 17:30–20:59
  const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return obs(place, time, what, TELLERS[i % TELLERS.length], {
    status: "rumor",
  });
});

export const OBSERVATIONS: ArchiveObservation[] = [
  ...CONFIRMED,
  ...SEEN_RUMOURS,
  ...HEARD_RUMOURS,
];

// The whole practice dataset, as GROQ sees it in the code window.
export const ARCHIVE_DATASET: ArchiveDoc[] = [
  ...PLACES,
  ...WITNESSES,
  ...OBSERVATIONS,
];

// --- The player's own project (non-technical track) -------------------------

// Five observations for «Hvem lyver?». They start as "unknown"; the player
// links C to Bakeriet, applies Arkivaren's rule and publishes each status.
export const WHO_IS_LYING: {
  _id: string;
  place?: string;
  placeNote?: string;
  linksTo?: string; // where a misspelt note really is: the technical track gets it linked
  time: string;
  what: string;
  witness: string;
  seen: boolean;
  image?: true;
  expected: "confirmed" | "rumor";
}[] = [
  {
    _id: "archive-a",
    place: "smia",
    time: "18:45",
    what: "Store fotspor utenfor smia",
    witness: "kari",
    seen: true,
    image: true,
    expected: "confirmed",
  },
  {
    _id: "archive-b",
    place: "bakeriet",
    time: "19:05",
    what: "Melsekken revnet ved bakdøra",
    witness: "ola",
    seen: true,
    expected: "confirmed",
  },
  {
    _id: "archive-c",
    placeNote: "bakriet",
    linksTo: "bakeriet",
    time: "19:06",
    what: "Melsekken revnet ved bakdøra",
    witness: "kari",
    seen: true,
    expected: "confirmed",
  },
  {
    _id: "archive-d",
    place: "bakeriet",
    time: "19:12",
    what: "Bjella ringte av seg selv",
    witness: "ola",
    seen: true,
    expected: "rumor",
  },
  {
    _id: "archive-e",
    place: "torget",
    time: "19:30",
    what: "Noen hørte et brøl ved juletreet",
    witness: "per",
    seen: false,
    expected: "rumor",
  },
];

export const ARCHIVE_IDS = WHO_IS_LYING.map((document) => document._id);

// What the game reads back from the player's project (published only).
export type OwnArchiveDoc = {
  _id: string;
  status?: string | null;
  place?: string | null;
};

export function sourceCheckScore(docs: OwnArchiveDoc[]) {
  const right = WHO_IS_LYING.filter(
    (s) => docs.find((d) => d._id === s._id)?.status === s.expected,
  ).length;
  return { right, total: WHO_IS_LYING.length };
}

export function linkScore(docs: OwnArchiveDoc[]) {
  const linked =
    docs.find((document) => document._id === "archive-c")?.place ===
    "place-bakeriet";
  return { right: linked ? 1 : 0, total: 1 };
}

// Saksmappa: one published `case` whose observations array references every
// confirmed observation (the six from the source check plus the three linked).
export const CASE_FILE_EXPECTED = WHO_IS_LYING.filter(
  ({ expected }) => expected === "confirmed",
).map(({ _id }) => _id);

// An observation the player published, outside the five clues (_id not in
// ARCHIVE_IDS). References are their ids: "witness-kari", "place-gjerdet".
export type OwnObservation = {
  _id: string;
  witness?: string | null;
  place?: string | null;
};

export type OwnCase = {
  _id: string;
  title?: string | null;
  observations: string[];
  entries?: {
    _id: string;
    what: string;
    time?: string | null;
    place?: string | null;
  }[];
};
const timeOf = (id: string) =>
  WHO_IS_LYING.find((observation) => observation._id === id)?.time ?? "";

export function caseFileResult(cases: OwnCase[], hasDraft = false) {
  const expected = new Set(CASE_FILE_EXPECTED);
  const bestCase = cases.reduce<OwnCase | undefined>((best, candidate) => {
    if (!best) return candidate;
    const score = (value: OwnCase) => {
      const ids = new Set(value.observations ?? []);
      const right = CASE_FILE_EXPECTED.filter((id) => ids.has(id)).length;
      return right - (ids.size - right);
    };
    return score(candidate) > score(best) ? candidate : best;
  }, undefined);
  const ids = new Set(bestCase?.observations ?? []);
  const right = CASE_FILE_EXPECTED.filter((id) => ids.has(id)).length;
  const wrongIds = [...ids].filter((id) => !expected.has(id));
  const objectives = [
    ...CASE_FILE_EXPECTED.map((id) => ({
      label: `${id.slice(-1).toUpperCase()} · ${WHO_IS_LYING.find((observation) => observation._id === id)?.what ?? "Observasjon"} er med`,
      done: ids.has(id),
    })),
    ...wrongIds.map((id) => ({
      label: `${bestCase?.entries?.find((entry) => entry._id === id)?.what ?? "Ukjent observasjon"} skal ikke være i mappa`,
      done: false,
    })),
  ];
  // An array keeps its order: the folder is read top to bottom on the
  // square, so the evidence goes in the order it happened.
  const byTime = [...CASE_FILE_EXPECTED].sort((a, b) =>
    timeOf(a).localeCompare(timeOf(b)),
  );
  const inOrder =
    right === CASE_FILE_EXPECTED.length &&
    (bestCase?.observations ?? [])
      .filter((id) => expected.has(id))
      .every((id, i) => id === byTime[i]);
  objectives.push({
    label: "Observasjonene står i tidsrekkefølge",
    done: inOrder,
  });
  const done =
    right === CASE_FILE_EXPECTED.length && wrongIds.length === 0 && inOrder;

  return {
    done,
    objectives,
    ...(cases.length === 0 && hasDraft
      ? { message: "Saksmappa er ikke publisert." }
      : {}),
  };
}

// The best published case counts: right = expected ids in it, wrong = ids in it
// that are not expected (a rumour in the folder counts against it).
export function caseFileScore(cases: OwnCase[]) {
  const total = CASE_FILE_EXPECTED.length;
  let best = { right: 0, wrong: 0, total };
  let bestNet = 0;
  for (const c of cases) {
    const ids = new Set(c.observations ?? []);
    const right = CASE_FILE_EXPECTED.filter((id) => ids.has(id)).length;
    const wrong = ids.size - right;
    if (right - wrong > bestNet) {
      bestNet = right - wrong;
      best = { right, wrong, total };
    }
  }
  return best;
}

// A 16×16 pixel picture of footprints in snow, uploaded as the observations'
// photo when the documents are written to the player's project.
export const FOOTPRINTS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" fill="#e3ebf5"/><g fill="#5a6988"><rect x="3" y="2" width="3" height="4"/><rect x="3" y="7" width="2" height="1"/><rect x="9" y="6" width="3" height="4"/><rect x="9" y="11" width="2" height="1"/><rect x="4" y="12" width="2" height="2"/></g></svg>`;
