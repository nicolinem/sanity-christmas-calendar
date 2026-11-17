import { createClient } from "next-sanity";
import { getSanityClient } from "@/sanity/client";
import {
  SAMPLE_ORDERS,
  type BakeryOrder,
  type BakerySign,
} from "@/game/bakery";
import { apiVersion, dataset, projectId } from "@/sanity/env";

// Published documents from the player's own project, never a shared dataset.
export async function GET() {
  const client = getSanityClient();
  if (!client)
    return Response.json({ configured: false, orders: [], sign: null });
  try {
    const [orders, sign] = await Promise.all([
      client.fetch<BakeryOrder[]>(
        '*[_type == "bakeryOrder"]{_id, item, orderedBy, date, status}',
      ),
      client.fetch<BakerySign | null>('*[_id == "bakery-sign"][0]{_id, text}'),
    ]);
    return Response.json({ configured: true, orders, sign });
  } catch (error) {
    console.error("Could not read the bakery:", error);
    return Response.json({
      configured: true,
      orders: [],
      sign: null,
      error: "fetch_failed",
    });
  }
}

// Only in the participant's configured project; repeated calls never replace edits.
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
    const tx = writer.transaction();
    for (const order of SAMPLE_ORDERS) tx.createIfNotExists({ ...order });
    await tx.commit();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not seed bakery orders:", error);
    return Response.json({ error: "write_failed" }, { status: 502 });
  }
}
