import { NextResponse } from "next/server";
import { setupStatus } from "@/sanity/setupStatus";

// What the setup checklist shows: is the project connected, readable, claimed,
// and can the Studio sign in by itself. No secrets in the answer.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await setupStatus());
}
