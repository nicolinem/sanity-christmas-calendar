"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ENEMIES } from "@/game/cave/enemies";
import { generateFloor } from "@/game/cave/generate";
import { CAVE_PROPS } from "@/game/cave/props";
import { SHEETS, type SpriteDef } from "@/game/sprites";

// A workbench for the cave floors, at /grotte in development. Pick depth and
// seed, and look at what the generator makes. Not part of the game.

const SCALE = 3;
const TILE = 16;

const newSeed = () => Math.floor(Math.random() * 100000);

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export default function CaveLab() {
  const [depth, setDepth] = useState(1);
  const [seed, setSeed] = useState(1);
  const [previous, setPrevious] = useState<string | undefined>();
  const floor = useMemo(
    () => generateFloor(depth, seed, previous),
    [depth, seed, previous],
  );
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    let cancelled = false;
    const urls = new Set<string>([
      SHEETS[floor.sheet].url,
      SHEETS.dungeon.url,
      ...floor.spawns.map((s) => SHEETS[ENEMIES[s.enemy].sprite.sheet].url),
    ]);
    Promise.all([...urls].map(async (u) => [u, await loadImage(u)] as const))
      .then((loaded) => {
        if (cancelled) return;
        const images = new Map(loaded);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(
          0,
          0,
          floor.rows[0].length * TILE * SCALE,
          floor.rows.length * TILE * SCALE,
        );
        const draw = (
          url: string,
          cols: number,
          frame: number,
          cx: number,
          cy: number,
        ) => {
          const img = images.get(url);
          if (!img) return;
          ctx.drawImage(
            img,
            (frame % cols) * TILE,
            Math.floor(frame / cols) * TILE,
            TILE,
            TILE,
            (cx - TILE / 2) * SCALE,
            (cy - TILE / 2) * SCALE,
            TILE * SCALE,
            TILE * SCALE,
          );
        };
        const sprite = (s: SpriteDef, x: number, y: number) => {
          const sheet = SHEETS[s.sheet];
          draw(sheet.url, sheet.cols, s.frame, x, y);
        };
        const base = SHEETS[floor.sheet];
        floor.tiles.forEach((row, y) =>
          row.forEach((frame, x) =>
            draw(
              base.url,
              base.cols,
              frame,
              x * TILE + TILE / 2,
              y * TILE + TILE / 2,
            ),
          ),
        );
        sprite(CAVE_PROPS.stairs, floor.stairs.x, floor.stairs.y);
        floor.rocks.forEach((r) => sprite(CAVE_PROPS.rock, r.x, r.y));
        if (floor.chest) sprite(CAVE_PROPS.chest, floor.chest.x, floor.chest.y);
        floor.spawns.forEach((s) => sprite(ENEMIES[s.enemy].sprite, s.x, s.y));
        // S marks where you arrive.
        ctx.font = `bold ${8 * SCALE}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#1a1d2e";
        ctx.fillStyle = "#ffd25a";
        ctx.strokeText("S", floor.start.x * SCALE, floor.start.y * SCALE);
        ctx.fillText("S", floor.start.x * SCALE, floor.start.y * SCALE);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [floor]);

  return (
    <main className="flab">
      <header className="flab-head">
        <h1>Grotteverksted</h1>
        <p>
          Etasjer fra generatoren (<code>src/game/cave/generate.ts</code>). Bare
          for utvikling.
        </p>
      </header>

      <section className="flab-actions" aria-label="Kontroller">
        <label>
          Dybde{" "}
          <input
            type="number"
            min={1}
            max={12}
            value={depth}
            onChange={(e) => {
              setPrevious(undefined);
              setDepth(Math.min(12, Math.max(1, Number(e.target.value) || 1)));
            }}
          />
        </label>
        <label>
          Seed{" "}
          <input
            type="number"
            value={seed}
            onChange={(e) => {
              setPrevious(undefined);
              setSeed(Number(e.target.value) || 0);
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn--amber"
          onClick={() => {
            setPrevious(undefined);
            setSeed(newSeed());
          }}
        >
          Ny seed
        </button>
        <button
          type="button"
          className="btn btn--quiet"
          disabled={depth >= 12}
          onClick={() => {
            setPrevious(floor.room);
            setDepth(depth + 1);
            setSeed(seed + 1);
          }}
        >
          Neste etasje
        </button>
      </section>

      <canvas
        ref={canvas}
        width={floor.rows[0].length * TILE * SCALE}
        height={floor.rows.length * TILE * SCALE}
        aria-label="Etasjen"
        style={{ imageRendering: "pixelated", maxWidth: "100%" }}
      />

      <p className="flab-label">
        Rom: {floor.room} · Speilet: {floor.mirrored ? "ja" : "nei"} · Låst:{" "}
        {floor.locked ? "ja" : "nei"} · Monstre: {floor.spawns.length}
      </p>
    </main>
  );
}
