import { signText, type BakerySign } from "@/game/bakery";
import { BakeryText } from "./BakerySign";

export default function BakeryStrip({ sign }: { sign: BakerySign | null }) {
  if (!signText(sign)) return null;

  return (
    <aside
      className="bakery-strip"
      aria-label="Bakerens bodskilt"
      aria-live="polite"
    >
      <BakeryText sign={sign} />
    </aside>
  );
}
