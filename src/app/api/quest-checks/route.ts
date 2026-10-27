import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

// Some quests can only be judged from the player's own code (a custom input, a
// validation rule…). `npm run quest` inspects the code and writes its verdicts
// to .quest/results.json; this route hands them to the game. Missing file just
// means nothing has been checked yet.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await readFile(join(process.cwd(), ".quest", "results.json"), "utf8");
    const parsed = JSON.parse(raw);
    return NextResponse.json({ checks: parsed?.checks ?? {} });
  } catch {
    return NextResponse.json({ checks: {} });
  }
}
