import { bakeryToday } from "./bakeryDate";

// QUEST: Luke 9. Bakerens faste kunder, and a «Bestilling fra …» template for
// each. The game's code window checks the player's own version; Studio shows
// these once that luke is solved (see sanity.config.ts).
export const BAKERY_CUSTOMERS = [
  { name: "Brann", item: "Lussekatter" },
  { name: "Arkivaren", item: "Pepperkaker" },
  { name: "Kari", item: "Julekake" },
] as const;

export const ORDER_TEMPLATE_IDS = BAKERY_CUSTOMERS.map(
  ({ name }) => `order-${name}`,
);

type Template = {
  id: string;
  title: string;
  schemaType: string;
  value: () => Record<string, string>;
};

export function orderTemplates<T>(previous: T[]): (T | Template)[] {
  return [
    ...previous,
    ...BAKERY_CUSTOMERS.map((customer) => ({
      id: `order-${customer.name}`,
      title: `Bestilling fra ${customer.name}`,
      schemaType: "bakeryOrder",
      value: () => ({
        item: customer.item,
        orderedBy: customer.name,
        status: "ny",
        date: bakeryToday(),
      }),
    })),
  ];
}
