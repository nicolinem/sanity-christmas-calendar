"use client";

// Arrows between the hints you've opened. On the last one opened, the next
// arrow becomes the button that opens the next hint, so there's one way on.
// After the last hint it offers the solution, where the window has one.
type Props = {
  total: number;
  shown: number;
  active: number;
  onSelect: (index: number) => void;
  onReveal: () => void;
  onSolution?: () => void;
  solutionShown?: boolean;
};

export default function HintPager({
  total,
  shown,
  active,
  onSelect,
  onReveal,
  onSolution,
  solutionShown = false,
}: Props) {
  if (shown === 0) return null;
  // Showing the solution counts as one more: there are still only `total` hints.
  const opened = Math.min(shown, total);
  const atLastShown = active >= opened - 1;
  return (
    <div className="cw-hint-controls" aria-label="Navigasjon for hint">
      <button
        type="button"
        className="cw-hint-arrow"
        aria-label="Forrige hint"
        disabled={active === 0}
        onClick={() => onSelect(active - 1)}
      >
        ‹
      </button>
      <span className="cw-hint-count" aria-live="polite" aria-atomic="true">
        {active + 1} / {total}
      </span>
      {atLastShown && opened < total ? (
        <button
          type="button"
          className="cw-hint-next"
          onClick={() => {
            onSelect(opened);
            onReveal();
          }}
        >
          Vis hint {opened + 1} ›
        </button>
      ) : atLastShown && onSolution && !solutionShown ? (
        <button
          type="button"
          className="cw-hint-next cw-hint-next--solution"
          onClick={onSolution}
        >
          Vis løsning ›
        </button>
      ) : (
        <button
          type="button"
          className="cw-hint-arrow"
          aria-label="Neste hint"
          disabled={atLastShown}
          onClick={() => onSelect(active + 1)}
        >
          ›
        </button>
      )}
    </div>
  );
}
