// Relative import on purpose: the Sanity CLI bundles the schema without the
// "@/" alias, and the Studio imports this file.
import { SHEETS, TILE, resolveSprite, type SpriteDef } from "../game/sprites";

type Props = {
  spriteId?: string | null; // e.g. "axe"; unknown or missing ids get a stand-in
  kind?: string | null; // picks the right stand-in ("weapon", "potion", …)
  scale?: number; // whole-number zoom; 2 = 32×32 px
  sprite?: SpriteDef; // draw this exact frame instead (e.g. the knight himself)
  style?: React.CSSProperties;
};

// A game sprite you can drop anywhere React renders, including Sanity Studio
// (list previews, custom inputs, document views). Self-contained inline styles,
// so it doesn't depend on the game's stylesheet.
export default function SpriteImage({ spriteId, kind, scale = 2, sprite: exact, style }: Props) {
  const sprite = exact ?? resolveSprite(spriteId, kind);
  const sheet = SHEETS[sprite.sheet];
  const size = TILE * scale;
  const col = sprite.frame % sheet.cols;
  const row = Math.floor(sprite.frame / sheet.cols);
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        width: size,
        height: size,
        backgroundImage: `url(${sheet.url})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sheet.cols * size}px ${sheet.rows * size}px`,
        backgroundPosition: `-${col * size}px -${row * size}px`,
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}
