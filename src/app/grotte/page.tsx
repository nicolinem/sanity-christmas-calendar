import { notFound } from "next/navigation";
import CaveLab from "@/components/cave/CaveLab";

// The cave workbench: only in development, never in the deployed game.
export default function CavePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <CaveLab />;
}
