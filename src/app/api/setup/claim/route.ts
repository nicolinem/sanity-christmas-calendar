import { isLocalRequest } from "@/game/setupAccess";
import { claimLink } from "@/sanity/setupStatus";

// Opens the claim link from `npm run setup`. Whoever opens it becomes the
// project's owner, so it only answers the player's own game on localhost.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const link = isLocalRequest(request.headers) ? claimLink() : null;
  return new Response(null, {
    status: 302,
    headers: { Location: link ?? "/", "Cache-Control": "no-store" },
  });
}
