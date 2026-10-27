import GameClient from "@/components/GameClient";

// The whole page is the game: a full-viewport world with the HUD on top.
export default function Home() {
  return (
    <main>
      <GameClient />
    </main>
  );
}
