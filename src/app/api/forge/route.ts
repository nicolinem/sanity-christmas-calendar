import { createClient } from "next-sanity";
import { getSanityClient } from "@/sanity/client";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { RECIPES, RECIPE_IDS } from "@/game/recipes";
import type { Forging } from "@/game/forge";

// Smia in the player's own project (the cave). GET reads the published
// Smiinger and which recipe documents exist. POST writes the recipe documents
// once; ones that already exist are left alone. The code (RECIPES) decides
// what a forging costs; the documents are only something to point at.

export const dynamic = "force-dynamic";

export async function GET() {
  const client = getSanityClient();
  if (!client)
    return Response.json({ configured: false, forgings: [], recipes: [] });
  try {
    const [forgings, recipes] = await Promise.all([
      client.fetch<Forging[]>(
        '*[_type == "forging"] | order(_createdAt asc){_id, name, "recipe": recipe._ref}',
      ),
      client.fetch<string[]>('*[_type == "recipe"]._id'),
    ]);
    return Response.json({ configured: true, forgings, recipes });
  } catch (error) {
    console.error("Could not read the forge:", error);
    return Response.json({
      configured: true,
      forgings: [],
      recipes: [],
      error: "fetch_failed",
    });
  }
}

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
    for (const id of RECIPE_IDS) {
      const r = RECIPES[id];
      tx.createIfNotExists({
        _id: r.id,
        _type: "recipe",
        name: r.name,
        gear: r.gear,
        description: r.description,
        ingredients: r.ingredients.map(({ material, count }) => ({
          _key: material,
          _type: "ingredient",
          material,
          count,
        })),
      });
    }
    await tx.commit();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not write the recipes:", error);
    return Response.json({ error: "write_failed" }, { status: 502 });
  }
}
