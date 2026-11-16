export type BakeryOrder = {
  _id: string;
  item?: string | null;
  date?: string | null;
  status?: string | null;
};

export const isNewOrder = (order: BakeryOrder) =>
  order.status === "ny" && /^\d{4}-\d{2}-\d{2}$/.test(order.date ?? "") &&
  Boolean(order.item?.trim());