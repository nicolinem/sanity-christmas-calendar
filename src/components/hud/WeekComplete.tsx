"use client";

import { useEffect, useRef, useState } from "react";
import { forgedPower } from "@/game/rules";
import { shareText, type WeekSummary } from "@/game/quests/weeks";
import SpriteIcon from "./SpriteIcon";

type Props = {
  summary: WeekSummary;
  forgeLevel: number;
  onClose: () => void;
  onOpenBook: () => void;
};

const dateLabel = (date: Date) =>
  date.toLocaleDateString("nb-NO", { day: "numeric", month: "long" });

// Shown once when the last door of a week is done (and again from the
// journal): every window lit, what the week gave, a text to share with the
// team, and what comes next.
export default function WeekComplete({
  summary,
  forgeLevel,
  onClose,
  onOpenBook,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const text = shareText(summary, forgeLevel);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // No clipboard (insecure context or denied): the text is selectable.
    }
  };

  return (
    <div className="week-done-backdrop" onClick={onClose}>
      <section
        className="week-done frame frame--wood"
        role="dialog"
        aria-modal="true"
        aria-labelledby="week-done-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="week-done-kicker">
          Uke {summary.number} · {summary.title}
        </p>
        <h2 id="week-done-heading">Uke {summary.number} er ferdig</h2>
        <div className="week-done-lights" aria-hidden="true">
          {Array.from({ length: summary.doors }, (_, i) => (
            <span key={i} className="week-done-light">
              <SpriteIcon sprite={{ sheet: "town", frame: 84 }} scale={3} />
            </span>
          ))}
        </div>

        <ul className="week-done-list">
          <li>Alle {summary.doors} lukene lyser i bygda.</li>
          <li>
            {summary.pages} nye {summary.pages === 1 ? "side" : "sider"} i boka.
          </li>
          <li>
            Smia nivå {forgeLevel}: våpnene gjør{" "}
            {forgedPower(forgeLevel).damage} skade.
          </li>
        </ul>

        <p className="week-done-friday">
          {summary.friday
            ? `Fredag ${dateLabel(summary.friday)} har Bakeren fredagskake, og løsningene ligger ved siden av.`
            : "På fredag har Bakeren fredagskake, og løsningene ligger ved siden av."}
        </p>

        <div className="week-done-share">
          <p className="week-done-label">Del med teamet</p>
          <pre>{text}</pre>
          <button type="button" className="btn" onClick={copy}>
            {copied ? "Kopiert" : "Kopier"}
          </button>
        </div>

        <p className="week-done-friday">
          {summary.optional
            ? `Til neste uke kan du utforske bygda. Har du lyst på mer, henger «${summary.optional.title}» fortsatt ved ${summary.optional.place}.`
            : "Til neste uke kan du utforske bygda og prøve våpnene dine."}
        </p>

        {summary.next ? (
          <div className="week-done-next">
            <p className="week-done-label">
              Neste uke: Uke {summary.next.number} · {summary.next.title}
              {summary.next.opensAt
                ? `, åpner mandag ${dateLabel(summary.next.opensAt)}`
                : ""}
            </p>
            <ul>
              {summary.next.topics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="week-done-friday">
            Det var siste uke. Julemarkedet åpner snart.
          </p>
        )}

        <div className="week-done-actions">
          <button
            ref={closeRef}
            type="button"
            className="btn btn--amber"
            onClick={onClose}
          >
            Tilbake til bygda
          </button>
          <button type="button" className="btn" onClick={onOpenBook}>
            Les boka
          </button>
        </div>
      </section>
    </div>
  );
}
