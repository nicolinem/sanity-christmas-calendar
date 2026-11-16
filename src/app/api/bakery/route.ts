import { getSanityClient } from "@/sanity/client";
import type { BakeryOrder, BakerySign } from "@/game/bakery";

// Published documents from the player's own project, never a shared dataset.
export async function GET() {
  const client = getSanityClient();
  if (!client) return Response.json({ configured: false, orders: [], sign: null });
  try {
    const [orders, sign] = await Promise.all([
      client.fetch<BakeryOrder[]>('*[_type == "bakeryOrder"]{_id, item, date, status}'),
      client.fetch<BakerySign | null>('*[_id == "bakery-sign"][0]{_id, text}'),
    ]);
    return Response.json({ configured: true, orders, sign });
  } catch (error) {
    console.error("Could not read the bakery:", error);
    return Response.json({ configured: true, orders: [], sign: null, error: "fetch_failed" });
  }
}