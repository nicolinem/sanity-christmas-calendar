import { useEffect, useMemo, useRef } from "react";
import { caseFileScore, type OwnCase } from "@/game/archive";

export default function ArchiveNoticeboard({
  cases,
  onClose,
}: {
  cases: OwnCase[] | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);
  const caseFile = useMemo(
    () =>
      [...(cases ?? [])].sort((a, b) => {
        const aScore = caseFileScore([a]);
        const bScore = caseFileScore([b]);
        return bScore.right - bScore.wrong - (aScore.right - aScore.wrong);
      })[0],
    [cases],
  );

  return (
    <div className="log-backdrop" onClick={onClose}>
      <section
        className="bakery-sign archive-noticeboard frame frame--wood"
        role="dialog"
        aria-modal="true"
        aria-label="Oppslagstavla på torget"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="bakery-sign-heading">Oppslagstavla på torget</p>
        <div className="bakery-sign-text">
          {caseFile ? (
            <>
              <h2>{caseFile.title || "Sak uten tittel"}</h2>
              <ul>
                {(caseFile.entries ?? []).map((entry) => (
                  <li key={entry._id}>
                    <strong>{entry.what}</strong>
                    <span>{entry.place || "Ukjent sted"}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>Ingen publisert sak er hengt opp ennå.</p>
          )}
        </div>
        <button
          ref={closeRef}
          type="button"
          className="btn btn--quiet"
          onClick={onClose}
        >
          Lukk <kbd>Esc</kbd>
        </button>
      </section>
    </div>
  );
}
