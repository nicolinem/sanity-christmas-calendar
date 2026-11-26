import { MATERIALS, type MaterialId } from "@/game/materials";
import SpriteIcon from "./SpriteIcon";

// The floor the player is on, what the trip has found so far, and the way home.
export default function CaveHud({
  depth,
  found,
  goal,
  boss,
  stairsLocked,
  stairsHidden,
  bottomNear,
  onLeave,
  onAttack,
  waiting = false,
}: {
  depth: number;
  // The trip's finds so far, one row per material.
  found: { id: MaterialId; trip: number }[];
  // What the cave is for right now: the next chest, or a recipe's materials.
  goal?: string | null;
  // The floor's boss while it lives.
  boss?: { name: string; hp: number; maxHp: number } | null;
  // The knight is in the stairs room and its monsters still guard the way.
  stairsLocked?: boolean;
  // The stairs on this floor lie under a rock.
  stairsHidden?: boolean;
  // On the deepest floor, where the stairs would be.
  bottomNear?: boolean;
  onLeave: () => void;
  // Only given on narrow screens, where there is no Space key.
  onAttack?: () => void;
  // The cave stands still while Studio is open.
  waiting?: boolean;
}) {
  return (
    <div className="cave-hud frame frame--slate">
      <span className="cave-hud-floor">
        Etasje {depth}
        {goal && <small className="cave-hud-goal">{goal}</small>}
      </span>
      {found.length > 0 && (
        <span className="cave-hud-found">
          På turen:
          {found.map(({ id, trip }) => (
            <span
              key={id}
              className="cave-hud-find"
              title={MATERIALS[id].name}
              aria-label={`${trip} ${MATERIALS[id].name.toLowerCase()}`}
            >
              <SpriteIcon sprite={MATERIALS[id].sprite} />
              {trip}
            </span>
          ))}
        </span>
      )}
      {boss && (
        <div className="cave-hud-boss">
          <span className="cave-hud-boss-name">{boss.name}</span>
          <div
            className="cave-hud-boss-bar"
            role="progressbar"
            aria-label={boss.name}
            aria-valuemin={0}
            aria-valuenow={boss.hp}
            aria-valuemax={boss.maxHp}
          >
            <span
              style={{
                width: `${Math.max(0, Math.min(1, boss.hp / boss.maxHp)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
      {stairsLocked && (
        <span className="cave-hud-locked">
          Trappa er stengt. Slå monstrene i rommet først.
        </span>
      )}
      {stairsHidden && (
        <span className="cave-hud-locked">Trappa ligger under en stein.</span>
      )}
      {bottomNear && (
        <span className="cave-hud-locked">
          Lenger ned er det ikke gravd ennå.
        </span>
      )}
      {onAttack && (
        <button type="button" className="btn btn--amber" onClick={onAttack}>
          Angrip
        </button>
      )}
      <button type="button" className="btn" onClick={onLeave}>
        Gå hjem
      </button>
      {waiting && (
        <span className="cave-hud-wait">
          Grotta venter mens Studio er åpent.
        </span>
      )}
    </div>
  );
}
