import type { CSSProperties } from "react";
import { SHEETS, type SpriteDef } from "@/game/sprites";

type Props = {
  sprite: SpriteDef;
  scale?: number; // whole-number zoom; omit to follow the HUD pixel size
  className?: string;
};

// One 16×16 frame from a Kenney sheet, scaled by a whole number so the HUD
// shares the world's pixel grid. Sizing is done in CSS (.sprite) from these
// custom properties, so a slot can rescale its icon with a single variable.
export default function SpriteIcon({ sprite, scale, className }: Props) {
  const sheet = SHEETS[sprite.sheet];
  const style = {
    "--col": sprite.frame % sheet.cols,
    "--row": Math.floor(sprite.frame / sheet.cols),
    "--cols": sheet.cols,
    "--rows": sheet.rows,
    ...(scale ? { "--s": scale } : {}),
    backgroundImage: `url(${sheet.url})`,
  } as CSSProperties;
  return <span aria-hidden className={`sprite${className ? ` ${className}` : ""}`} style={style} />;
}
