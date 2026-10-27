import { NextResponse } from "next/server";
import { getSanityClient } from "@/sanity/client";
import { itemsQuery, type SanityItem } from "@/sanity/queries";

// Fetch published game items from Sanity on the server. Public read only, no
// token. `no-store` guarantees a freshly-published item appears the moment the
// player refreshes the inventory — that is the whole acceptance test.
export const dynamic = "force-dynamic";

export async function GET() {
  const client = getSanityClient();
  if (!client) {
    return NextResponse.json({ configured: false, items: [] });
  }

  // True while the project still waits to be claimed (written by `npm run
  // setup`). Only the flag leaves the server, never the link or the token.
  const unclaimed = Boolean(process.env.SANITY_CLAIM_URL);

  try {
    const items = await client.fetch<SanityItem[]>(itemsQuery);
    return NextResponse.json({ configured: true, unclaimed, items });
  } catch (error) {
    console.error("Failed to fetch game items from Sanity:", error);
    return NextResponse.json(
      { configured: true, unclaimed, items: [], error: "fetch_failed" },
      { status: 200 },
    );
  }
}
