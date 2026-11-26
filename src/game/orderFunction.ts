import type { BakeryOrder, BakerySign } from "./bakery";

// Luke 11: once the code window passes, the game plays the part of Sanity.
// When the player publishes an order in Studio, their own function gets the
// event, and what it writes to the sign shows in the village. Nothing is
// deployed and their project is never written to.

// The same arguments a real document Function gets: the document in
// `event.data`, and client options in `context`. Here the options carry the
// game's own client, which the code window's createClient hands back.
export type OrderFunction = (args: {
  context: { clientOptions: { gameClient: unknown } };
  event: { data: BakeryOrder & { _type: "bakeryOrder" } };
}) => unknown;
export type Run = { item: string; wrote: boolean; error?: string };

// The orders that were published since last time: new ones, and ones
// published again. The first look only remembers what's there.
export function newPublishes(
  seen: Map<string, string> | null,
  orders: BakeryOrder[],
): { seen: Map<string, string>; changed: BakeryOrder[] } {
  const now = new Map(
    orders.map((o) => [o._id, o.updatedAt ?? o.createdAt ?? ""]),
  );
  const changed = seen
    ? orders.filter((o) => seen.get(o._id) !== now.get(o._id))
    : [];
  return { seen: now, changed };
}

// Runs the function once per publish, against a client that only knows the
// sign the village shows.
export async function runOrderFunction(
  fn: OrderFunction,
  orders: BakeryOrder[],
  sign: BakerySign | null,
): Promise<{ sign: BakerySign | null; runs: Run[] }> {
  let shown = sign;
  const runs: Run[] = [];
  for (const order of orders) {
    let wrote = false;
    const client = {
      getDocument: async (id: string) =>
        id === "bakery-sign" ? (shown ?? { _id: "bakery-sign" }) : null,
      patch: (id: string) => ({
        set: (value: { text?: BakerySign["text"] }) => ({
          commit: async () => {
            if (id !== "bakery-sign" || !Array.isArray(value?.text))
              throw new Error("Oppdater bodskiltet med Portable Text.");
            shown = { _id: "bakery-sign", text: value.text };
            wrote = true;
          },
        }),
      }),
    };
    const item = order.item?.trim() || "en bestilling uten vare";
    try {
      await fn({
        context: { clientOptions: { gameClient: client } },
        event: { data: { ...order, _type: "bakeryOrder" } },
      });
      runs.push({ item, wrote });
    } catch (e) {
      runs.push({
        item,
        wrote,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return { sign: shown, runs };
}
