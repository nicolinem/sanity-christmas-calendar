import { createClient } from "next-sanity";
import {
  mergeProgress,
  normalizeProgress,
  progressJson,
  PROGRESS_DOC_ID,
  PROGRESS_DOC_TYPE,
} from "@/game/quests/progressMerge";
import { apiVersion, dataset, projectId } from "@/sanity/env";

// The backup of the player's progress, one document in their own project. The
// game sends its copy; this merges it with the saved one, saves the result if
// anything changed and sends it back. Never shown in the Studio: it has no
// schema type, and an id with a dot is only readable with a token.

const MAX_BYTES = 200_000;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return Response.json({ error: "invalid_origin" }, { status: 403 });

  const token = process.env.SANITY_AUTH_TOKEN;
  if (!projectId || !token)
    return Response.json({ error: "no_token" }, { status: 503 });

  const body = await request.text();
  let sent = null;
  try {
    if (body.length <= MAX_BYTES) sent = normalizeProgress(JSON.parse(body));
  } catch {
    // Not JSON: answered below.
  }
  if (!sent) return Response.json({ error: "invalid_body" }, { status: 400 });

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });

  try {
    const doc = await client.getDocument<{ progress?: string }>(
      PROGRESS_DOC_ID,
    );
    let saved = null;
    try {
      saved = doc?.progress
        ? normalizeProgress(JSON.parse(doc.progress))
        : null;
    } catch {
      // A broken backup is replaced by the game's copy.
    }
    const merged = saved ? mergeProgress(saved, sent) : sent;
    const json = progressJson(merged);
    if (json !== doc?.progress)
      await client.createOrReplace({
        _id: PROGRESS_DOC_ID,
        _type: PROGRESS_DOC_TYPE,
        savedAt: merged.savedAt,
        progress: json,
      });
    return Response.json({ progress: merged });
  } catch (error) {
    console.error("Could not back up progress:", error);
    return Response.json({ error: "write_failed" }, { status: 502 });
  }
}
