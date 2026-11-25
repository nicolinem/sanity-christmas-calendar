// The floor the player is on, what the trip has found so far, and the way home.
export default function CaveHud({
  depth,
  found,
  onLeave,
  onAttack,
}: {
  depth: number;
  found: number;
  onLeave: () => void;
  // Only given on narrow screens, where there is no Space key.
  onAttack?: () => void;
}) {
  return (
    <div className="cave-hud frame frame--slate">
      <span className="cave-hud-floor">Etasje {depth}</span>
      {found > 0 && (
        <span className="cave-hud-found">Funnet på turen: {found}</span>
      )}
      {onAttack && (
        <button type="button" className="btn btn--amber" onClick={onAttack}>
          Angrip
        </button>
      )}
      <button type="button" className="btn" onClick={onLeave}>
        Gå hjem
      </button>
    </div>
  );
}
