import type Phaser from "phaser";
import { FIGURE_SIZE, drawFigure, type FigureChoice } from "./figure";

// The figure drawn into a texture, once per look. Gives the texture's key.
export function figureTexture(
  textures: Phaser.Textures.TextureManager,
  choice: FigureChoice,
): string {
  const key = `figure:${JSON.stringify(choice)}`;
  if (!textures.exists(key)) {
    const tex = textures.createCanvas(key, FIGURE_SIZE, FIGURE_SIZE)!;
    tex
      .getContext()
      .putImageData(
        new ImageData(drawFigure(choice), FIGURE_SIZE, FIGURE_SIZE),
        0,
        0,
      );
    tex.refresh();
  }
  return key;
}
