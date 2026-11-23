import { createClient } from "next-sanity";
import {
  allowedCommunityOrigin,
  communityRateLimited,
} from "@/game/communityAccess";
import {
  characterFor,
  milestonesFor,
  playersFromMilestones,
  sharesHints,
  type CommunityEvent,
  type CommunityPlayer,
} from "@/game/community";
import { apiVersion } from "@/sanity/env";

export const dynamic = "force-dynamic";

const publishing = () =>
  Boolean(process.env.COMMUNITY_SANITY_TOKEN) &&
  process.env.COMMUNITY_WRITES_ENABLED === "1";

function corsHeaders(request: Request) {
  const headers = new Headers({ "Cache-Control": "no-store", Vary: "Origin" });
  const origin = request.headers.get("origin");
  if (allowedCommunityOrigin(origin, request.url)) {
    headers.set("Access-Control-Allow-Origin", origin!);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return headers;
}

function reply(request: Request, data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders(request) });
}

function limited(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return communityRateLimited(ip)
    ? reply(request, { error: "rate_limited" }, 429)
    : null;
}

export function OPTIONS(request: Request) {
  if (!allowedCommunityOrigin(request.headers.get("origin"), request.url))
    return reply(request, { error: "invalid_origin" }, 403);
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

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

export async function GET(request: Request) {
  const blocked = limited(request);
  if (blocked) return blocked;
  const reader = client();
  if (!reader)
    return reply(request, { configured: false, events: [], players: [] });
  try {
    const profiles = await reader.fetch<
      Pick<CommunityPlayer, "playerId" | "weapon" | "figure" | "name">[]
    >(
      '*[_type == "communityPlayer" && visible == true]{playerId, weapon, figure, name}',
    );
    const playerIds = profiles.map((profile) => profile.playerId);
    if (!playerIds.length)
      return reply(request, {
        configured: true,
        publishing: publishing(),
        events: [],
        players: [],
      });
    const [events, milestones] = await Promise.all([
      reader.fetch<CommunityEvent[]>(
        '*[_type == "questMilestone" && playerId in $playerIds] | order(_createdAt desc)[0...100]{playerId, questId, title, hints, "at": _createdAt}',
        { playerIds },
      ),
      reader.fetch<{ playerId: string; questId: string; hints?: number }[]>(
        '*[_type == "questMilestone" && playerId in $playerIds]{playerId, questId, hints}',
        { playerIds },
      ),
    ]);
    const players = playersFromMilestones(milestones, profiles);
    return reply(request, {
      configured: true,
      publishing: publishing(),
      events,
      players,
    });
  } catch (error) {
    console.error("Could not read community milestones:", error);
    return reply(
      request,
      { configured: true, events: [], players: [], error: "read_failed" },
      502,
    );
  }
}

export async function POST(request: Request) {
  const writer = client(true);
  if (!writer || !publishing())
    return reply(request, { error: "not_configured" }, 503);

  // This is a local prototype, not an authenticated public write API.
  const origin = request.headers.get("origin");
  if (!allowedCommunityOrigin(origin, request.url))
    return reply(request, { error: "invalid_origin" }, 403);

  const blocked = limited(request);
  if (blocked) return blocked;

  let input: unknown;
  try {
    if (Number(request.headers.get("content-length")) > 4096)
      return reply(request, { error: "invalid_input" }, 400);
    const reader = request.body?.getReader();
    if (!reader) return reply(request, { error: "invalid_input" }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return reply(request, { error: "invalid_input" }, 400);
      }
      chunks.push(value);
    }
    input = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
  } catch {
    return reply(request, { error: "invalid_input" }, 400);
  }
  const milestones = milestonesFor(input);
  const character = characterFor(input);
  if (
    !milestones ||
    (input !== null &&
      typeof input === "object" &&
      Object.hasOwn(input, "character") &&
      !character)
  )
    return reply(request, { error: "invalid_input" }, 400);
  if (!milestones.length && !character) return reply(request, { ok: true });

  try {
    if (character && !character.visible) {
      const documents = await writer.fetch<{ _id: string }[]>(
        '*[_id == $profileId || (_type in ["questMilestone", "communityEvent"] && playerId == $playerId)]{_id}',
        { profileId: character._id, playerId: character.playerId },
      );
      if (documents.length) {
        let removal = writer.transaction();
        for (const document of documents)
          removal = removal.delete(document._id);
        await removal.commit();
      }
      return reply(request, { ok: true });
    }
    // Hint counts: set when shared, removed when the player stops sharing.
    const hintsShared = sharesHints(input);
    let transaction = writer.transaction();
    for (const { hints, ...milestone } of milestones) {
      transaction = transaction.createIfNotExists(milestone);
      if (hintsShared === true)
        transaction = transaction.patch(milestone._id, (patch) =>
          patch.set({ hints: hints ?? 0 }),
        );
      else if (hintsShared === false)
        transaction = transaction.patch(milestone._id, (patch) =>
          patch.unset(["hints"]),
        );
    }
    if (character) {
      transaction = transaction.createIfNotExists(character);
      transaction = transaction.patch(character._id, (patch) =>
        patch.set({
          visible: true,
          weapon: character.weapon,
          ...(character.figure ? { figure: character.figure } : {}),
          ...(character.name ? { name: character.name } : {}),
        }),
      );
    }
    await transaction.commit();
    return reply(request, { ok: true });
  } catch (error) {
    console.error("Could not publish community milestones:", error);
    return reply(request, { error: "write_failed" }, 502);
  }
}
