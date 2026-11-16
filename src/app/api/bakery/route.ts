import { getSanityClient } from "@/sanity/client";
import type { BakeryOrder } from "@/game/bakery";

// Published documents from the player's own project, never a shared dataset.
export async function GET() {
  const client = getSanityClient();
  if (!client) return Response.json({ configured: false, orders: [] });
  try {
    const orders = await client.fetch<BakeryOrder[]>(
      '*[_type == "bakeryOrder"]{_id, item, date, status}',
    );
    return Response.json({ configured: true, orders });
  } catch (error) {
    console.error("Could not read the bakery:", error);
    return Response.json({ configured: true, orders: [], error: "fetch_failed" });
  }
}