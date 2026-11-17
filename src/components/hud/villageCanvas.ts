"use client";

import { useEffect, useRef } from "react";
import { SHEETS, TILE, type SpriteSheet } from "@/game/sprites";
import {
  BUILDINGS,
  GROUND,
  MAP_H,
  MAP_W,
  NPCS,
  PROPS,
  TREES,
} from "@/game/village";

// The village in miniature, drawn on a canvas from the same tile data as the
// world. Used by the journal's map and by Arkivaren's trail in the code window.
export const VILLAGE_W = MAP_W * TILE;
export const VILLAGE_H = MAP_H * TILE;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// The village drawn from the same tile data the world uses (village.ts), so
// the map is Frostholm in miniature rather than a separate drawing.
export function useVillageCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    const names = Object.keys(SHEETS) as SpriteSheet[];
    Promise.all(names.map((n) => loadImage(SHEETS[n].url)))
      .then((images) => {
        const ctx = ref.current?.getContext("2d");
        if (!ctx || cancelled) return;
        ctx.imageSmoothingEnabled = false;
        const sheets = Object.fromEntries(
          names.map((n, i) => [n, images[i]]),
        ) as Record<SpriteSheet, HTMLImageElement>;
        const draw = (
          sheet: SpriteSheet,
          frame: number,
          x: number,
          y: number,
        ) => {
          const cols = SHEETS[sheet].cols;
          ctx.drawImage(
            sheets[sheet],
            (frame % cols) * TILE,
            Math.floor(frame / cols) * TILE,
            TILE,
            TILE,
            x,
            y,
            TILE,
            TILE,
          );
        };
        GROUND.forEach((row, y) =>
          row.forEach((frame, x) => draw("town", frame, x * TILE, y * TILE)),
        );
        for (const b of BUILDINGS)
          b.rows.forEach((row, r) =>
            row.forEach((frame, c) =>
              draw("town", frame, (b.x + c) * TILE, (b.y + r) * TILE),
            ),
          );
        for (const p of PROPS) draw(p.sheet, p.frame, p.x * TILE, p.y * TILE);
        for (const n of Object.values(NPCS))
          draw(n.sprite.sheet, n.sprite.frame, n.x - 8, n.y - TILE);
        for (const t of [...TREES].sort((a, b) => a.y - b.y))
          draw("town", t.frame, t.x - 8, t.y - TILE);
      })
      .catch(() => {
        // The markers and list still work without the picture.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return ref;
}
