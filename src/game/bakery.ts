export type BakeryOrder = {
  _id: string;
  item?: string | null;
  date?: string | null;
  status?: string | null;
};

export type BakerySign = {
  _id: string;
  text?: {
    _type?: string;
    children?: { _type?: string; text?: string; marks?: string[] }[];
    markDefs?: { _key: string; _type: string; href?: string }[];
  }[] | null;
};

export function signText(sign: BakerySign | null): string {
  return sign?.text?.flatMap((block) =>
    block._type === "block" ? (block.children ?? []).map((span) => span.text ?? "") : [],
  ).join(" ").trim() ?? "";
}

export const signHasStrong = (sign: BakerySign | null) =>
  Boolean(signText(sign) && sign?.text?.some((block) =>
    block.children?.some((span) => span.text?.trim() && span.marks?.includes("strong")),
  ));

export const signHasHttpsLink = (sign: BakerySign | null) =>
  Boolean(sign?.text?.some((block) => block._type === "block" && block.children?.some((span) =>
    span.text?.trim() && block.markDefs?.some((mark) => {
      if (mark._type !== "link" || !span.marks?.includes(mark._key)) return false;
      try {
        return new URL(mark.href ?? "").protocol === "https:";
      } catch {
        return false;
      }
    }),
  )));

export const isNewOrder = (order: BakeryOrder) =>
  order.status === "ny" && /^\d{4}-\d{2}-\d{2}$/.test(order.date ?? "") &&
  Boolean(order.item?.trim());

export const isReadyOrder = (order: BakeryOrder) =>
  order.status === "klar" && Boolean(order.item?.trim());