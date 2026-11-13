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

export type ArchivePlace = { _id: string; _type: "place"; name: string; x: number; y: number };
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
  "Ola", "Kari", "Per", "Liv", "Nils", "Mari", "Jon", "Siri",
].map((name) => ({ _id: `witness-${name.toLowerCase()}`, _type: "witness", name }));

const ref = (id: string) => ({ _type: "reference" as const, _ref: id });
const PHOTO = { _type: "image" as const, asset: ref("image-footprints-16x16-png") };

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
  obs("skogkanten", "18:10", "Store fotspor i snøen", "ola", { ...C, image: true }),
  obs("gjerdet", "18:32", "Spor langs gjerdet", "kari", { ...C, image: true }),
  obs("smia", "18:45", "Rim på smiedøra", "per", C),
  obs("smia", "18:47", "Noe stort gikk forbi vinduet", "liv", C),
  obs("bakeriet", "19:05", "Kaker har forsvunnet", "mari", C),
  obs("bakeriet", "19:10", "Iskaldt i rommet etterpå", "nils", C),
];

// Seen, but not enough for the rule: one witness twice, and one alone.
const SEEN_RUMOURS = [
  obs("bronnen", "18:20", "Noe plasket i brønnen", "jon", { seen: true, status: "rumor" }),
  obs("bronnen", "18:50", "Det plasket igjen", "jon", { seen: true, status: "rumor" }),
  obs("torget", "19:40", "En skygge ved juletreet", "siri", { seen: true, status: "rumor" }),
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
const TELLERS = ["jon", "liv", "jon", "ola", "kari", "mari", "per", "siri", "nils", "jon"];
const HEARD_RUMOURS = HEARD.map(([place, what], i) => {
  const minutes = 17 * 60 + 30 + ((i * 37) % 210); // 17:30–20:59
  const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return obs(place, time, what, TELLERS[i % TELLERS.length], { status: "rumor" });
});

export const OBSERVATIONS: ArchiveObservation[] = [
  ...CONFIRMED,
  ...SEEN_RUMOURS,
  ...HEARD_RUMOURS,
];

// The whole practice dataset, as GROQ sees it in the code window.
export const ARCHIVE_DATASET: ArchiveDoc[] = [...PLACES, ...WITNESSES, ...OBSERVATIONS];

// --- The player's own project (non-technical track) -------------------------

// Nine observations for the source check. They start as "unknown"; the player
// sets each status by Arkivaren's rule and publishes.
export const SOURCE_CHECK: { _id: string; place: string; time: string; what: string; witness: string; image?: true; expected: "confirmed" | "rumor" }[] = [
  { _id: "archive-a1", place: "skogkanten", time: "18:10", what: "Store fotspor i snøen", witness: "ola", image: true, expected: "confirmed" },
  { _id: "archive-a2", place: "gjerdet", time: "18:32", what: "Spor langs gjerdet", witness: "kari", image: true, expected: "confirmed" },
  { _id: "archive-b1", place: "smia", time: "18:45", what: "Rim på smiedøra", witness: "per", expected: "confirmed" },
  { _id: "archive-b2", place: "smia", time: "18:47", what: "Noe stort gikk forbi vinduet", witness: "liv", expected: "confirmed" },
  { _id: "archive-c1", place: "bakeriet", time: "19:05", what: "Kaker har forsvunnet", witness: "mari", expected: "confirmed" },
  { _id: "archive-c2", place: "bakeriet", time: "19:10", what: "Iskaldt i rommet etterpå", witness: "nils", expected: "confirmed" },
  { _id: "archive-d1", place: "torget", time: "19:40", what: "En skygge ved juletreet", witness: "siri", expected: "rumor" },
  { _id: "archive-e1", place: "bronnen", time: "18:20", what: "Noe plasket i brønnen", witness: "jon", expected: "rumor" },
  { _id: "archive-e2", place: "bronnen", time: "18:50", what: "Det plasket igjen", witness: "jon", expected: "rumor" },
];

// Three confirmed observations where someone typed the place as text. The
// player replaces the text with a reference to the right place.
export const LINK_THE_PLACE: { _id: string; placeNote: string; time: string; what: string; witness: string; expected: string }[] = [
  { _id: "archive-l1", placeNote: "bakriet", time: "19:20", what: "Melspor ut døra", witness: "mari", expected: "place-bakeriet" },
  { _id: "archive-l2", placeNote: "ved smia, tror jeg", time: "18:50", what: "Smeltet snø rundt smia", witness: "per", expected: "place-smia" },
  { _id: "archive-l3", placeNote: "skogen (kanten)", time: "18:05", what: "Grener knekt høyt oppe", witness: "ola", expected: "place-skogkanten" },
];

export const ARCHIVE_IDS = [...SOURCE_CHECK, ...LINK_THE_PLACE].map((d) => d._id);

// What the game reads back from the player's project (published only).
export type OwnArchiveDoc = { _id: string; status?: string | null; place?: string | null };

export function sourceCheckScore(docs: OwnArchiveDoc[]) {
  const right = SOURCE_CHECK.filter(
    (s) => docs.find((d) => d._id === s._id)?.status === s.expected,
  ).length;
  return { right, total: SOURCE_CHECK.length };
}

export function linkScore(docs: OwnArchiveDoc[]) {
  const right = LINK_THE_PLACE.filter(
    (s) => docs.find((d) => d._id === s._id)?.place === s.expected,
  ).length;
  return { right, total: LINK_THE_PLACE.length };
}

// Saksmappa: one published `case` whose observations array references every
// confirmed observation (the six from the source check plus the three linked).
export const CASE_FILE_EXPECTED: string[] = [
  ...SOURCE_CHECK.filter((s) => s.expected === "confirmed").map((s) => s._id),
  ...LINK_THE_PLACE.map((s) => s._id),
];

export type OwnCase = { _id: string; observations: string[] };

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
