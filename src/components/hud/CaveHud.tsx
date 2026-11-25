// The floor the player is on, and the way home.
export default function CaveHud({
  depth,
  onLeave,
}: {
  depth: number;
  onLeave: () => void;
}) {
  return (
    <div className="cave-hud frame frame--slate">
      <span className="cave-hud-floor">Etasje {depth}</span>
      <button type="button" className="btn" onClick={onLeave}>
        Gå hjem
      </button>
    </div>
  );
}
