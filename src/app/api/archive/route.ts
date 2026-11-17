import { createClient } from "next-sanity";
import { getSanityClient } from "@/sanity/client";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import {
  ARCHIVE_IDS,
  FOOTPRINTS_SVG,
  PLACES,
  WHO_IS_LYING,
  WITNESSES,
  type OwnArchiveDoc,
  type OwnCase,
} from "@/game/archive";

// Arkivarens observasjoner in the player's own project (non-technical track,
// uke 2). GET reads back the published versions the quests check. POST writes
// the starting documents once; documents that already exist are left alone,
// so the player's own edits are never overwritten.

export const dynamic = "force-dynamic";

export async function GET() {
  const client = getSanityClient();
  if (!client) return Response.json({ configured: false, docs: [], cases: [] });
  try {
    const [docs, cases] = await Promise.all([
      client.fetch<OwnArchiveDoc[]>(
        '*[_type == "observation" && _id in $ids]{_id, status, "place": place._ref}',
        { ids: ARCHIVE_IDS },
      ),
      client.fetch<OwnCase[]>(
        '*[_type == "case"] | order(_updatedAt desc){_id, title, "observations": observations[]._ref, "entries": observations[]->{_id, what, "place": place->name}}',
      ),
    ]);
    return Response.json({
      configured: true,
      docs,
      cases: cases.map((c) => ({ ...c, observations: c.observations ?? [] })),
    });
  } catch (error) {
    console.error("Could not read the archive:", error);
    return Response.json({
      configured: true,
      docs: [],
      cases: [],
      error: "fetch_failed",
    });
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return Response.json({ error: "invalid_origin" }, { status: 403 });

  const token = process.env.SANITY_AUTH_TOKEN;
  if (!projectId || !token)
    return Response.json({ error: "no_token" }, { status: 503 });

  const writer = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });
  try {
    // Identical content gives the same asset, so this is safe to repeat.
    const asset = await writer.assets.upload(
      "image",
      Buffer.from(FOOTPRINTS_SVG),
      {
        filename: "fotspor.svg",
        contentType: "image/svg+xml",
      },
    );
    const ref = (id: string) => ({ _type: "reference", _ref: id });
    const tx = writer.transaction();
    for (const p of PLACES) tx.createIfNotExists({ ...p });
    for (const w of WITNESSES) tx.createIfNotExists({ ...w });
    for (const o of WHO_IS_LYING)
      tx.createIfNotExists({
        _id: o._id,
        _type: "observation",
        what: o.what,
        time: o.time,
        ...(o.place ? { place: ref(`place-${o.place}`) } : {}),
        ...(o.placeNote ? { placeNote: o.placeNote } : {}),
        witness: ref(`witness-${o.witness}`),
        seen: o.seen,
        status: "unknown",
        ...(o.image
          ? { image: { _type: "image", asset: ref(asset._id) } }
          : {}),
      });
    await tx.commit();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not write the archive:", error);
    return Response.json({ error: "write_failed" }, { status: 502 });
  }
}
