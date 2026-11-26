import { NextStudio } from "next-sanity/studio";
import config from "@/sanity/studio/config";
import { isSanityConfigured } from "@/sanity/env";

// Embeds the whole Sanity Studio at /studio. The game shows it in a pane beside
// the world (or players open it in its own tab): create an item, publish, and
// watch it appear in the game.
export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!isSanityConfigured) {
    // Render friendly setup instructions instead of the Studio's raw
    // "Configuration must contain projectId" crash.
    return (
      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "48px 20px",
          fontFamily: "system-ui, sans-serif",
          color: "#233245",
        }}
      >
        <h1>Ingen Sanity-prosjekt er koblet til ennå</h1>
        <p>
          Hver spiller smir i sitt eget Sanity-prosjekt. Kjør dette i repoet:
        </p>
        <pre
          style={{
            background: "#eef2f8",
            padding: "12px 16px",
            borderRadius: 6,
          }}
        >
          npm run setup
        </pre>
        <p>
          Det lager et prosjekt for deg (uten konto), skriver{" "}
          <code>.env.local</code>, og skriver ut en lenke som logger deg inn i
          Studio. Gjør <em>claim</em> på prosjektet innen 72 timer for å beholde
          det.
        </p>
        <p>
          Har du allerede et prosjekt?{" "}
          <code>npm run setup -- --project &lt;id&gt;</code>
        </p>
        <p>
          <a href="/">← Tilbake til spillet</a>
        </p>
      </main>
    );
  }

  return <NextStudio config={config} />;
}
