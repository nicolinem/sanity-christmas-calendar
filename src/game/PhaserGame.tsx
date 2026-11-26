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
    let lost = false;
    let resize: ResizeObserver | undefined;
    let start: (() => void) | undefined;

    const stop = () => {
      const game = gameRef.current as { destroy: (b: boolean) => void } | null;
      if (game) {
        game.destroy(true);
        gameRef.current = null;
      }
    };
    // A browser can drop the WebGL context of a tab in the background (the
    // Studio open in its own tab, say). Phaser then stops drawing and the
    // village stays white. Start the game again once the tab is in view: the
    // scene reads the world from the bridge when it boots.
    const restartIfLost = () => {
      if (!lost || document.hidden || destroyed) return;
      lost = false;
      stop();
      start?.();
    };
    document.addEventListener("visibilitychange", restartIfLost);

    (async () => {
      const Phaser = (await import("phaser")).default;
      const { WinterQuestScene } = await import("./WinterQuestScene");
      const { CaveScene } = await import("./cave/CaveScene");
      // World labels use the HUD's pixel font; make sure it's ready first.
      await document.fonts.ready;
      if (destroyed || !containerRef.current || gameRef.current) return;

      start = () => {
        if (destroyed || !containerRef.current) return;
        const game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: containerRef.current,
          backgroundColor: "#e3ebf5",
          pixelArt: true,
          // Up to 16 torches, markers and the knight light on one cave floor;
          // the default of 10 would cull the knight's.
          render: { maxLights: 20 },
          scale: {
            mode: Phaser.Scale.RESIZE,
            width: "100%",
            height: "100%",
          },
          // Only the first scene starts; the cave is launched from the village.
          scene: [WinterQuestScene, CaveScene],
        });
        gameRef.current = game;
        const watch = () =>
          game.canvas.addEventListener("webglcontextlost", () => {
            lost = true;
            // Lost while in view: give the browser a moment, then start again.
            window.setTimeout(restartIfLost, 500);
          });
        if (game.canvas) watch();
        else game.events.once("ready", watch);
        if (process.env.NODE_ENV === "development") {
          (window as unknown as { __game: unknown }).__game = game;
        }
      };
      start();
      // Phaser only polls its parent's size twice a second; follow it exactly,
      // so the world reflows the moment the Studio pane opens or is dragged.
      resize = new ResizeObserver(() => {
        const game = gameRef.current as Phaser.Game | null;
        if (game?.scale.getParentBounds()) game.scale.refresh();
      });
      resize.observe(containerRef.current);
    })();

    return () => {
      destroyed = true;
      document.removeEventListener("visibilitychange", restartIfLost);
      resize?.disconnect();
      stop();
    };
  }, []);

  return <div ref={containerRef} className="stage-canvas" />;
}
