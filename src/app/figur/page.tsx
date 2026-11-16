import { notFound } from "next/navigation";
import FigureLab from "@/components/figure/FigureLab";

// The figure workbench: only in development, never in the deployed game.
export default function FigurePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <FigureLab />;
}
