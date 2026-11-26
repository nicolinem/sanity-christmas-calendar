import { createClient } from "next-sanity";
import {
  APPRENTICE_ITEM_ID,
  APPRENTICE_MISTAKE,
  BRANN_HAMMER,
  needsFreshHistory,
} from "@/game/apprentice";
import { apiVersion, dataset, projectId } from "@/sanity/env";

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
    const [published, draft] = await Promise.all([
      writer.getDocument(APPRENTICE_ITEM_ID),
      writer.getDocument(`drafts.${APPRENTICE_ITEM_ID}`),
    ]);
    if (published && !needsFreshHistory(published, draft ?? null, Date.now()))
      return Response.json({ ok: true, created: false });

    // Two separate writes create the two published revisions used in History.
    // An old hammer gets them again, so the right one is still in History.
    if (published) {
      const { name, kind, description, sprite } = BRANN_HAMMER;
      await writer
        .patch(APPRENTICE_ITEM_ID)
        .set({ name, kind, description, sprite })
        .commit();
    } else await writer.create(BRANN_HAMMER);
    await writer.patch(APPRENTICE_ITEM_ID).set(APPRENTICE_MISTAKE).commit();
    return Response.json({ ok: true, created: !published });
  } catch (error) {
    console.error("Could not seed the apprentice's mistake:", error);
    return Response.json({ error: "write_failed" }, { status: 502 });
  }
}
