import { isLocalRequest } from "@/game/setupAccess";
import { studioSignInPath } from "@/sanity/setupStatus";

// Signs the Studio in with the token from `npm run setup`, so nobody has to
// find the long link in the terminal. Only for the player's own game on
// localhost; anything else just goes to the Studio.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const path = isLocalRequest(request.headers)
    ? await studioSignInPath()
    : null;
  return new Response(null, {
    status: 302,
    headers: { Location: path ?? "/studio", "Cache-Control": "no-store" },
  });
}
