export type BakeryOrder = {
  _id: string;
  item?: string | null;
  orderedBy?: string | null;
  date?: string | null;
  status?: string | null;
  createdAt?: string | null;
  // Changes on every publish: how the game sees a new publish (luke 11).
  updatedAt?: string | null;
};

export const SAMPLE_ORDERS: (BakeryOrder & { _type: "bakeryOrder" })[] = [
  {
    _id: "bakery-sample-brann",
    _type: "bakeryOrder",
    item: "Lussekatter",
    orderedBy: "Brann",
    date: "2026-12-14",
    status: "venter",
  },
  {
    _id: "bakery-sample-arkivaren",
    _type: "bakeryOrder",
    item: "Pepperkaker",
    orderedBy: "Arkivaren",
    status: "venter",
  },
  {
    _id: "bakery-sample-kari",
    _type: "bakeryOrder",
    orderedBy: "Kari",
    date: "2026-12-14",
    status: "venter",
  },
];

export type BakerySign = {
  _id: string;
  text?:
    | {
        _type?: string;
        children?: { _type?: string; text?: string; marks?: string[] }[];
        markDefs?: { _key: string; _type: string; href?: string }[];
      }[]
    | null;
};

export function signText(sign: BakerySign | null): string {
  return (
    sign?.text
      ?.flatMap((block) =>
        block._type === "block"
          ? (block.children ?? []).map((span) => span.text ?? "")
          : [],
      )
      .join(" ")
      .trim() ?? ""
  );
}

export const signHasStrong = (sign: BakerySign | null) =>
  Boolean(
    signText(sign) &&
    sign?.text?.some((block) =>
      block.children?.some(
        (span) => span.text?.trim() && span.marks?.includes("strong"),
      ),
    ),
  );

// Luke 8: the app shows only the first paragraph, so the sign needs at least
// two, with the bold word in the first. Portable Text is a list of blocks.
const textBlocks = (sign: BakerySign | null) =>
  sign?.text?.filter(
    (block) =>
      block._type === "block" &&
      block.children?.some((span) => span.text?.trim()),
  ) ?? [];

export function signCheck(sign: BakerySign | null) {
  const blocks = textBlocks(sign);
  const twoBlocks = blocks.length >= 2;
  const boldFirst = Boolean(
    blocks[0]?.children?.some(
      (span) => span.text?.trim() && span.marks?.includes("strong"),
    ),
  );
  return { twoBlocks, boldFirst, done: twoBlocks && boldFirst };
}

export const isNewOrder = (order: BakeryOrder) =>
  order.status === "ny" &&
  /^\d{4}-\d{2}-\d{2}$/.test(order.date ?? "") &&
  Boolean(order.item?.trim());

// Luke 7: an order made after the model board, so one left over from before
// doesn't tick the box. Ten minutes' slack for a browser clock that runs fast.
export const isOrderSince = (order: BakeryOrder, since: string | undefined) =>
  isNewOrder(order) &&
  Date.parse(order.createdAt ?? "") >= Date.parse(since ?? "") - 10 * 60 * 1000;

export const isReadyOrder = (order: BakeryOrder) =>
  order.status === "klar" &&
  Boolean(order.item?.trim()) &&
  /^\d{4}-\d{2}-\d{2}$/.test(order.date ?? "");

export const SAMPLE_ORDER_IDS = SAMPLE_ORDERS.map(({ _id }) => _id);

export function findNewPlayerOrder(
  orders: BakeryOrder[] | null | undefined,
): BakeryOrder | undefined {
  return orders
    ?.filter(
      (order) => !SAMPLE_ORDER_IDS.includes(order._id) && isNewOrder(order),
    )
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0];
}

export function morningRushReadyCount(
  orders: BakeryOrder[] | null | undefined,
  playerOrderId: string | undefined,
) {
  if (!orders || !playerOrderId) return 0;
  const targets = new Set([...SAMPLE_ORDER_IDS, playerOrderId]);
  return orders.filter((order) => targets.has(order._id) && isReadyOrder(order))
    .length;
}
