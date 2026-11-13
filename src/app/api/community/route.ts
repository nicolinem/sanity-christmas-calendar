import { createClient } from "next-sanity";
import {
  characterFor,
  milestonesFor,
  playersFromMilestones,
  type CommunityEvent,
  type CommunityPlayer,
} from "@/game/community";
import { apiVersion } from "@/sanity/env";

export const dynamic = "force-dynamic";

function client(write = false) {
  const projectId = process.env.COMMUNITY_SANITY_PROJECT_ID;
  const token = process.env.COMMUNITY_SANITY_TOKEN;
  if (!projectId || (write && !token)) return null;
  return createClient({
    projectId,
    dataset: process.env.COMMUNITY_SANITY_DATASET || "production",
    apiVersion,
    ...(token ? { token } : {}),
    useCdn: false,
    perspective: "published",
  });
}

export async function GET() {
  const reader = client();
  if (!reader) return Response.json({ configured: false, events: [], players: [] });
  try {
    const [events, profiles, milestones] = await Promise.all([
      reader.fetch<CommunityEvent[]>(
        '*[_type == "questMilestone"] | order(_createdAt desc)[0...100]{playerId, questId, title, "at": _createdAt}',
      ),
      reader.fetch<Pick<CommunityPlayer, "playerId" | "weapon">[]>(
        '*[_type == "communityPlayer"]{playerId, weapon}',
      ),
      reader.fetch<Pick<CommunityEvent, "playerId" | "questId">[]>(
        '*[_type == "questMilestone"]{playerId, questId}',
      ),
    ]);
    const players = playersFromMilestones(milestones, profiles);
    return Response.json({ configured: true, publishing: Boolean(process.env.COMMUNITY_SANITY_TOKEN) && process.env.COMMUNITY_DEMO_WRITES === "1", events, players });
  } catch (error) {
    console.error("Could not read community milestones:", error);
    return Response.json({ configured: true, events: [], players: [], error: "read_failed" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const writer = client(true);
  if (!writer || process.env.COMMUNITY_DEMO_WRITES !== "1")
    return Response.json({ error: "not_configured" }, { status: 503 });

  // This is a local prototype, not an authenticated public write API.
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return Response.json({ error: "invalid_origin" }, { status: 403 });

  let input: unknown;
  try {
    if (Number(request.headers.get("content-length")) > 4096)
      return Response.json({ error: "invalid_input" }, { status: 400 });
    input = await request.json();
  } catch {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  const milestones = milestonesFor(input);
  const character = characterFor(input);
  if (!milestones || (input !== null && typeof input === "object" &&
      Object.hasOwn(input, "character") && !character))
    return Response.json({ error: "invalid_input" }, { status: 400 });
  if (!milestones.length && !character) return Response.json({ ok: true });

  try {
    let transaction = writer.transaction();
    for (const milestone of milestones)
      transaction = transaction.createIfNotExists(milestone);
    if (character) {
      transaction = transaction.createIfNotExists(character);
      transaction = transaction.patch(character._id, (patch) => patch.set({ weapon: character.weapon }));
    }
    await transaction.commit();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not publish community milestones:", error);
    return Response.json({ error: "write_failed" }, { status: 502 });
  }
}