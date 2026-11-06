import { groq } from "next-sanity";

// All published items, newest first. The game maps whatever comes back onto
// game entities via the sprite registry and the rules in src/game/rules.ts: it
// does not assume it knows every item in advance. There is deliberately no
// damage in the content: the game decides that.
export const itemsQuery = groq`
  *[_type == "item"] | order(_createdAt desc) {
    "id": _id,
    name,
    kind,
    "spriteId": sprite,
    description,
    forgedAt
  }
`;

// How many weapons exist only as a draft (saved, never published). Needs the
// "raw" perspective and a token: drafts are not public. Only this number leaves
// the server, never the drafts themselves.
export const unpublishedWeaponDraftsQuery = groq`
  count(*[
    _type == "item" && kind == "weapon" && _id in path("drafts.**")
    && !defined(*[_id == string::split(^._id, "drafts.")[1]][0]._id)
  ])
`;

export type SanityItem = {
  id: string;
  name: string | null;
  kind: string | null; // "weapon" | "material" | "potion", but data can hold anything
  spriteId: string | null;
  description: string | null;
  forgedAt?: string | null; // set by the player's own Forge action (a chapter 1 quest)
};
