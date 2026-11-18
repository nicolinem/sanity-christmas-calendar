import { createClient } from "next-sanity";
import {
  APPRENTICE_ITEM_ID,
  APPRENTICE_MISTAKE,
  BRANN_HAMMER,
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
    if (await writer.getDocument(APPRENTICE_ITEM_ID))
      return Response.json({ ok: true, created: false });

    // Two separate writes create the two published revisions used in History.
    await writer.create(BRANN_HAMMER);
    await writer.patch(APPRENTICE_ITEM_ID).set(APPRENTICE_MISTAKE).commit();
    return Response.json({ ok: true, created: true });
  } catch (error) {
    console.error("Could not seed the apprentice's mistake:", error);
    return Response.json({ error: "write_failed" }, { status: 502 });
  }
}
