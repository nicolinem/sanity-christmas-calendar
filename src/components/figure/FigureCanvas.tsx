"use client";

import { useEffect, useRef, useState } from "react";
import {
  FIGURE_SIZE,
  drawFigure,
  type FigureChoice,
  type OutlineMode,
} from "@/game/figure";

type Props = {
  choice: FigureChoice;
  scale?: number; // whole-number zoom
  animate?: boolean; // two-frame breathing idle
  outline?: OutlineMode;
  label?: string;
};

// The player's figure, drawn pixel by pixel from src/game/figure.ts and
// scaled up without smoothing, so it shares the Kenney sheets' pixel grid.
export default function FigureCanvas({ choice, scale = 4, animate = false, outline = "kenney", label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [bob, setBob] = useState(false);

  useEffect(() => {
    if (!animate) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setBob((b) => !b), 450);
    return () => window.clearInterval(id);
  }, [animate]);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const pixels = drawFigure(choice, { bob: animate && bob, outline });
    ctx.putImageData(new ImageData(pixels, FIGURE_SIZE, FIGURE_SIZE), 0, 0);
  }, [choice, animate, bob, outline]);

  const px = FIGURE_SIZE * scale;
  return (
    <canvas
      ref={ref}
      width={FIGURE_SIZE}
      height={FIGURE_SIZE}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ width: px, height: px, imageRendering: "pixelated", display: "block" }}
    />
  );
}
