import { OBSERVATIONS, type ArchiveObservation } from "@/game/archive";
import { useVillageCanvas, VILLAGE_H, VILLAGE_W } from "../../villageCanvas";
import { ARCHIVE_REFERENCE, groqError, runGroq } from "./groq";
import type { Requirement, Verdict, WindowTask } from "./types";

// Uke 2, teknisk luke 1: «Følg sporet». One GROQ query in three parts: only
// confirmed observations, in time order, with the place followed through its
// reference. The map beside the code is the result: rumours vanish, the dots
// get numbers, and the trail is drawn over the village from the forest edge
// to the bakery.

const STARTER = `// Arkivaren: «Vis meg bare det som faktisk skjedde,
// i riktig rekkefølge, og hvor det var.»
//
// Spørringen kjøres mot Arkivarens observasjoner. Kartet
// tegner én prikk per rad, i den rekkefølgen du gir dem.
export const query = \`
  *[_type == "observation"] {
    time,
    what,
    place
  }
\`
`;

const OURS = `*[_type == "observation" && status == "confirmed"]
  | order(time asc) {
    time,
    what,
    "sted": place->{ name, x, y }
  }`;

const CONFIRMED = OBSERVATIONS.filter((o) => o.status === "confirmed");

export type TrailPoint = {
  key: string;
  time?: string;
  what?: string;
  name?: string;
  x: number;
  y: number;
  confirmed: boolean;
};
type TrailData = { points: TrailPoint[]; rows: number; json: string };

// The first field in a row that looks like a place on the map.
function coordsOf(row: Record<string, unknown>) {
  for (const value of Object.values(row)) {
    const v = value as { x?: unknown; y?: unknown; name?: unknown } | null;
    if (
      v &&
      typeof v === "object" &&
      typeof v.x === "number" &&
      typeof v.y === "number"
    )
      return {
        x: v.x,
        y: v.y,
        name: typeof v.name === "string" ? v.name : undefined,
      };
  }
  return null;
}

export async function judgeTrail(
  exports: Record<string, unknown>,
): Promise<Verdict<TrailData>> {
  const empty: TrailData = { points: [], rows: 0, json: "" };
  const query = exports.query;
  if (typeof query !== "string")
    return {
      done: false,
      data: empty,
      requirements: [
        {
          label: "Fant `query`",
          done: false,
          message: "Behold `export const query = \\`…\\``.",
        },
      ],
    };

  let result: unknown;
  try {
    result = await runGroq(query);
  } catch (err) {
    return {
      done: false,
      data: empty,
      error: groqError(err),
      requirements: [],
    };
  }
  const json = JSON.stringify(result, null, 2) ?? "null";
  if (!Array.isArray(result))
    return {
      done: false,
      data: { ...empty, json },
      requirements: [
        {
          label: "Spørringen gir en liste",
          done: false,
          message: "Kartet trenger en liste med observasjoner, `*[…]`.",
        },
      ],
    };

  const rows = result.filter(
    (r): r is Record<string, unknown> => Boolean(r) && typeof r === "object",
  );
  const matched: (ArchiveObservation | undefined)[] = rows.map((r) =>
    OBSERVATIONS.find((o) => o.time === r.time && o.what === r.what),
  );
  const known = rows.length === result.length && matched.every(Boolean);
  const rumours = matched.filter((o) => o && o.status !== "confirmed").length;
  const confirmedFound = matched.filter(
    (o) => o?.status === "confirmed",
  ).length;
  const onlyConfirmed =
    known && rumours === 0 && confirmedFound === CONFIRMED.length;

  const times = rows.map((r) => String(r.time ?? ""));
  const ordered =
    rows.length > 1 && times.every((t, i) => i === 0 || times[i - 1] <= t);

  const coords = rows.map(coordsOf);
  const placed = rows.length > 0 && coords.every(Boolean);

  const points: TrailPoint[] = rows.flatMap((r, i) => {
    const c = coords[i];
    if (!c) return [];
    return [
      {
        key: `${i}`,
        time: typeof r.time === "string" ? r.time : undefined,
        what: typeof r.what === "string" ? r.what : undefined,
        name: c.name,
        x: c.x,
        y: c.y,
        confirmed: matched[i]?.status === "confirmed",
      },
    ];
  });

  const requirements: Requirement[] = [
    {
      label: "Bare bekreftede",
      done: onlyConfirmed,
      message: !known
        ? "Behold `time` og `what` i projeksjonen, så Arkivaren kjenner igjen observasjonene."
        : rumours > 0
          ? `${rumours} rykter er med. Arkivaren vil bare ha det som er bekreftet.`
          : `${confirmedFound} av ${CONFIRMED.length} bekreftede observasjoner er med.`,
    },
    {
      label: "I tidsrekkefølge",
      done: ordered,
      message:
        "Prikkene kommer ikke i tidsrekkefølge, så stien hopper fram og tilbake.",
    },
    {
      label: "Med sted på kartet",
      done: placed,
      message:
        "Kartet trenger `x` og `y` fra stedet. `place` er bare en *reference* med en `_ref`.",
    },
  ];
  const done = requirements.every((r) => r.done);
  return {
    requirements,
    done,
    solvedAs: done ? {} : undefined,
    data: { points, rows: rows.length, json },
  };
}

// Spread points at the same place a little, so they don't hide each other.
function spread(points: TrailPoint[]) {
  const seen = new Map<string, number>();
  return points.map((p) => {
    const at = `${p.x},${p.y}`;
    const n = seen.get(at) ?? 0;
    seen.set(at, n + 1);
    const angle = n * 2.4;
    const r = n === 0 ? 0 : 2.2 + n * 0.35;
    return {
      ...p,
      x: p.x + Math.cos(angle) * r,
      y: p.y + Math.sin(angle) * r * 1.6,
    };
  });
}

export function TrailMap({ verdict }: { verdict: Verdict | null }) {
  const canvas = useVillageCanvas();
  const data = verdict?.data as TrailData | undefined;
  const points = spread(data?.points ?? []);
  const ordered = verdict?.requirements[1]?.done ?? false;
  const done = verdict?.done ?? false;
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const last = points.at(-1);
  return (
    <div className="cw-trail">
      <div
        className="cw-trail-map"
        role="img"
        aria-label={`Kart med ${points.length} observasjoner`}
      >
        <canvas
          ref={canvas}
          width={VILLAGE_W}
          height={VILLAGE_H}
          className="cw-trail-bg"
          aria-hidden
        />
        {ordered && points.length > 1 && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="cw-trail-line"
            aria-hidden
          >
            <polyline points={line} className={done ? "is-done" : undefined} />
          </svg>
        )}
        {points.map((p, i) => (
          <span
            key={p.key}
            className={`cw-trail-dot${p.confirmed ? " is-confirmed" : ""}${done && p === last ? " is-last" : ""}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            title={[p.time, p.name, p.what].filter(Boolean).join(" · ")}
          >
            {ordered && p.confirmed ? i + 1 : null}
          </span>
        ))}
        {done && last && (
          <span
            className="cw-trail-label"
            style={{ left: `${last.x}%`, top: `${last.y}%` }}
          >
            {last.name}
          </span>
        )}
        {points.length === 0 && (
          <p className="cw-trail-empty">
            {data?.rows
              ? `${data.rows} rader, men ingen av dem har et sted kartet kan tegne.`
              : "Ingen rader å tegne ennå."}
          </p>
        )}
      </div>
      <details className="cw-trail-json">
        <summary>Se resultatet som JSON ({data?.rows ?? 0} rader)</summary>
        <pre>{data?.json}</pre>
      </details>
    </div>
  );
}

export const trailTask: WindowTask = {
  id: "follow-the-trail",
  file: "spor.groq.ts",
  starter: STARTER,
  modules: {},
  judge: judgeTrail,
  resultTitle: "Kartet over bygda",
  Result: TrailMap,
  ours: OURS,
  references: [ARCHIVE_REFERENCE],
  studioCode: false,
};
