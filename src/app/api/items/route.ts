import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { getSanityClient } from "@/sanity/client";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { itemsQuery, unpublishedWeaponDraftsQuery, type SanityItem } from "@/sanity/queries";

// Fetch published game items from Sanity on the server. The items come from a
// public read with no token (the optional draft count below is the only token
// use, see countUnpublishedWeapons). `no-store` guarantees a freshly-published item appears the moment the
// player refreshes the inventory — that is the whole acceptance test.
export const dynamic = "force-dynamic";

// Counts weapons that were saved but never published, so the quest can say
// "press Publish". Drafts need a token, which stays on the server: only the
// number is returned. No token, or any failure, means 0 and nothing else changes.
async function countUnpublishedWeapons(): Promise<number> {
  const token = process.env.SANITY_AUTH_TOKEN;
  if (!token) return 0;
  try {
    const reader = createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: "raw" });
    return await reader.fetch<number>(unpublishedWeaponDraftsQuery);
  } catch {
    return 0;
  }
}

export async function GET() {
  const client = getSanityClient();
  if (!client) {
    return NextResponse.json({ configured: false, items: [] });
  }

  // True while the project still waits to be claimed (written by `npm run
  // setup`). Only the flag leaves the server, never the link or the token.
  const unclaimed = Boolean(process.env.SANITY_CLAIM_URL);

  try {
    const [items, unpublishedDrafts] = await Promise.all([
      client.fetch<SanityItem[]>(itemsQuery),
      countUnpublishedWeapons(),
    ]);
    return NextResponse.json({ configured: true, unclaimed, unpublishedDrafts, items });
  } catch (error) {
    console.error("Failed to fetch game items from Sanity:", error);
    return NextResponse.json(
      { configured: true, unclaimed, items: [], error: "fetch_failed" },
      { status: 200 },
    );
  }
}
