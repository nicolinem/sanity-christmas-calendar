"use client";

import { useEffect, useRef } from "react";

// Asked before leaving the cave on the way somewhere else. Escape stays.
export default function CaveLeaveConfirm({
  onLeave,
  onStay,
}: {
  onLeave: () => void;
  onStay: () => void;
}) {
  const stayRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    stayRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="log-backdrop">
      <section
        className="cave-confirm frame frame--slate"
        role="dialog"
        aria-modal="true"
        aria-label="Gå hjem?"
      >
        <p className="cave-confirm-text">
          Gå hjem? Du tar med deg alt du fant.
        </p>
        <div className="cave-confirm-actions">
          <button type="button" className="btn btn--amber" onClick={onLeave}>
            Gå hjem
          </button>
          <button type="button" className="btn" ref={stayRef} onClick={onStay}>
            Bli her
          </button>
        </div>
      </section>
    </div>
  );
}
