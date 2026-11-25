"use client";

import { useEffect, useRef } from "react";

// Phaser must only ever run in the browser — never during server rendering.
// We import it inside useEffect so the module is never evaluated on the server,
// and we tear the game down on unmount to survive React strict-mode / HMR.
//
// The canvas fills its parent (RESIZE mode); the scene picks an integer camera
// zoom so the pixel art stays crisp at any window size.
export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<unknown>(null);

  useEffect(() => {
    let destroyed = false;
    let resize: ResizeObserver | undefined;

    (async () => {
      const Phaser = (await import("phaser")).default;
      const { WinterQuestScene } = await import("./WinterQuestScene");
      const { CaveScene } = await import("./cave/CaveScene");
      // World labels use the HUD's pixel font; make sure it's ready first.
      await document.fonts.ready;
      if (destroyed || !containerRef.current || gameRef.current) return;

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        backgroundColor: "#e3ebf5",
        pixelArt: true,
        scale: {
          mode: Phaser.Scale.RESIZE,
          width: "100%",
          height: "100%",
        },
        // Only the first scene starts; the cave is launched from the village.
        scene: [WinterQuestScene, CaveScene],
      });
      // Phaser only polls its parent's size twice a second; follow it exactly,
      // so the world reflows the moment the Studio pane opens or is dragged.
      const { scale } = gameRef.current as Phaser.Game;
      resize = new ResizeObserver(() => {
        if (scale.getParentBounds()) scale.refresh();
      });
      resize.observe(containerRef.current);
      if (process.env.NODE_ENV === "development") {
        (window as unknown as { __game: unknown }).__game = gameRef.current;
      }
    })();

    return () => {
      destroyed = true;
      resize?.disconnect();
      const game = gameRef.current as { destroy: (b: boolean) => void } | null;
      if (game) {
        game.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="stage-canvas" />;
}
