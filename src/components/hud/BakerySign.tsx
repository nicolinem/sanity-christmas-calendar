import { useEffect, useRef } from "react";
import type { BakerySign as Sign } from "@/game/bakery";

type Props = { sign: Sign | null; onClose: () => void };

export default function BakerySign({ sign, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);
  const blocks =
    sign?.text?.filter(
      (block) => block._type === "block" && block.children?.length,
    ) ?? [];

  return (
    <div className="log-backdrop" onClick={onClose}>
      <section
        className="bakery-sign frame frame--wood"
        role="dialog"
        aria-modal="true"
        aria-label="Bodskiltet"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="bakery-sign-heading">Bakerens bod</p>
        <div className="bakery-sign-text">
          {blocks.length ? (
            blocks.map((block, i) => (
              <p key={i}>
                {block.children?.map((span, j) => {
                  const text = span.text ?? "";
                  const content = span.marks?.includes("strong") ? (
                    <strong>{text}</strong>
                  ) : (
                    text
                  );
                  const href = block.markDefs?.find(
                    (mark) =>
                      mark._type === "link" && span.marks?.includes(mark._key),
                  )?.href;
                  let safeHref: string | undefined;
                  try {
                    if (href && new URL(href).protocol === "https:")
                      safeHref = href;
                  } catch {
                    /* Invalid links are displayed as text. */
                  }
                  return (
                    <span key={j}>
                      {safeHref ? (
                        <a
                          href={safeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {content}
                        </a>
                      ) : (
                        content
                      )}
                    </span>
                  );
                })}
              </p>
            ))
          ) : (
            <p>
              Skiltet er tomt. Publiser skilttekst i Studio for å vise den her.
            </p>
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
