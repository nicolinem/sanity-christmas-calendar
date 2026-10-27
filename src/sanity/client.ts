import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, dataset, projectId, isSanityConfigured } from "./env";

// Read-only, public client. No token is ever used here, so this is safe to run
// on the server for public content. useCdn:false keeps reads fresh so newly
// published items show up as soon as the player refreshes the inventory.
//
// Created lazily so an unconfigured project (empty projectId) doesn't throw at
// import time — the game must still boot and serve its built-in demo items.
let cached: SanityClient | null = null;

export function getSanityClient(): SanityClient | null {
  if (!isSanityConfigured) return null;
  if (!cached) {
    cached = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      perspective: "published",
    });
  }
  return cached;
}
