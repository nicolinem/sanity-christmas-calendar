import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";
import { isSanityConfigured } from "@/sanity/env";

// Embeds the whole Sanity Studio at /studio. Players open this in another tab,
// create an item, publish, and watch it appear in the game.
export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!isSanityConfigured) {
    // Render friendly setup instructions instead of the Studio's raw
    // "Configuration must contain projectId" crash.
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px", fontFamily: "system-ui, sans-serif", color: "#233245" }}>
        <h1>No Sanity project connected yet</h1>
        <p>Every player forges in their own Sanity project. From the repo, run:</p>
        <pre style={{ background: "#eef2f8", padding: "12px 16px", borderRadius: 6 }}>npm run setup</pre>
        <p>
          It creates a project for you (no account needed), writes <code>.env.local</code>,
          and prints a link that signs you in to this Studio. Claim the project within
          72 hours to keep it.
        </p>
        <p>
          Already have a project? <code>npm run setup -- --project &lt;id&gt;</code>
        </p>
        <p><a href="/">← Back to the game</a></p>
      </main>
    );
  }

  return <NextStudio config={config} />;
}
