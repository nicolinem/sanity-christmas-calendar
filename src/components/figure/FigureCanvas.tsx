"use client";

import { useEffect, useRef } from "react";
import {
  FIGURE_SIZE,
  drawFigure,
  type FigureChoice,
  type OutlineMode,
} from "@/game/figure";

type Props = {
  choice: FigureChoice;
  scale?: number; // whole-number zoom
  outline?: OutlineMode;
  label?: string;
};

// The player's figure, drawn pixel by pixel from src/game/figure.ts and
// scaled up without smoothing, so it shares the Kenney sheets' pixel grid.
// Still, like the Kenney figures; the game adds its own step when walking.
export default function FigureCanvas({ choice, scale = 4, outline = "kenney", label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const pixels = drawFigure(choice, { outline });
    ctx.putImageData(new ImageData(pixels, FIGURE_SIZE, FIGURE_SIZE), 0, 0);
  }, [choice, outline]);

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
