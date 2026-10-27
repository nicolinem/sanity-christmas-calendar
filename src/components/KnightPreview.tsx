// Relative imports on purpose: the Studio imports this file, and the Sanity
// CLI bundles it without the "@/" alias.
import SpriteImage from "./SpriteImage";
import { TILE } from "../game/sprites";

type Props = {
  spriteId?: string | null; // the item's sprite, e.g. "axe"
  kind?: string | null; // so unknown sprites get the right stand-in
  scale?: number; // whole-number zoom; 5 suits a Studio view
};

const KNIGHT = { sheet: "dungeon", frame: 96 } as const;
const SNOW = { sheet: "town", frame: 0 } as const;

// The knight on a patch of Frostholm snow, swinging the given weapon in a
// loop. Made for Studio views (the Proving Room quest), but works anywhere
// React renders. Animation is plain CSS, and stops for reduced motion.
export default function KnightPreview({ spriteId, kind, scale = 5 }: Props) {
  const px = TILE * scale;
  return (
    <div
      aria-label="Ridderen med våpenet"
      style={{ position: "relative", width: px * 3, height: px * 2, overflow: "hidden", borderRadius: 4 }}
    >
      <style>{`
        @keyframes wq-swing { 0%, 55%, 100% { transform: rotate(-35deg); } 70% { transform: rotate(80deg); } }
        @keyframes wq-lunge { 0%, 55%, 100% { transform: translateX(0); } 70% { transform: translateX(${scale}px); } }
        @media (prefers-reduced-motion: reduce) { .wq-swing, .wq-lunge { animation: none !important; } }
      `}</style>
      {Array.from({ length: 6 }, (_, i) => (
        <SpriteImage
          key={i}
          sprite={SNOW}
          scale={scale}
          style={{ position: "absolute", left: (i % 3) * px, top: Math.floor(i / 3) * px }}
        />
      ))}
      <div
        className="wq-lunge"
        style={{ position: "absolute", left: px, top: px / 2, animation: "wq-lunge 1.4s steps(4) infinite" }}
      >
        <div
          className="wq-swing"
          style={{
            position: "absolute",
            left: px * 0.55,
            top: -px * 0.2,
            transformOrigin: "30% 85%",
            animation: "wq-swing 1.4s steps(4) infinite",
          }}
        >
          <SpriteImage spriteId={spriteId} kind={kind ?? "weapon"} scale={scale} />
        </div>
        <SpriteImage sprite={KNIGHT} scale={scale} style={{ position: "relative" }} />
      </div>
    </div>
  );
}
