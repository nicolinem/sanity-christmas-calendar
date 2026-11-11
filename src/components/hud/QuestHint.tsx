import type { Hint } from "@/game/quests/types";
import { renderText } from "./richText";

export default function QuestHint({ hint, number }: { hint: Hint; number: number }) {
  return (
    <section className="log-hint" aria-label={`Hint ${number}${hint.title ? `: ${hint.title}` : ""}`}>
      <header className="log-hint-heading">
        <span className="log-hint-n">Hint {number}</span>
        {hint.title && <strong>{hint.title}</strong>}
      </header>
      {hint.text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i}>{renderText(paragraph)}</p>
      ))}
      {hint.steps && hint.steps.length > 0 && (
        <ol className="log-hint-steps">
          {hint.steps.map((step, i) => <li key={i}>{renderText(step)}</li>)}
        </ol>
      )}
      {hint.link && (
        <a className="log-hint-link" href={hint.link.url} target="_blank" rel="noreferrer">
          {hint.link.label}
        </a>
      )}
    </section>
  );
}