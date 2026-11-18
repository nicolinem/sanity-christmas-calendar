import { useEffect, useRef } from "react";
import type { BakerySign as Sign } from "@/game/bakery";

type Props = { sign: Sign | null; onClose: () => void };

export function BakeryText({
  sign,
  empty,
}: {
  sign: Sign | null;
  empty?: string;
}) {
  const blocks =
    sign?.text?.filter(
      (block) => block._type === "block" && block.children?.length,
    ) ?? [];

  if (!blocks.length) return empty ? <p>{empty}</p> : null;

  return blocks.map((block, i) => (
    <p key={i}>
      {block.children?.map((span, j) => {
        const text = span.text ?? "";
        const content = span.marks?.includes("strong") ? (
          <strong>{text}</strong>
        ) : (
          text
        );
        const href = block.markDefs?.find(
          (mark) => mark._type === "link" && span.marks?.includes(mark._key),
        )?.href;
        let safeHref: string | undefined;
        try {
          if (href && new URL(href).protocol === "https:") safeHref = href;
        } catch {
          /* Invalid links are displayed as text. */
        }
        return (
          <span key={j}>
            {safeHref ? (
              <a href={safeHref} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              content
            )}
          </span>
        );
      })}
    </p>
  ));
}

export default function BakerySign({ sign, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);
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
        <div className="bakery-sign-views">
          <figure className="bakery-sign-view">
            <figcaption>Skiltet ved boden</figcaption>
            <div className="bakery-sign-preview bakery-sign-preview--board bakery-sign-text">
              <BakeryText
                sign={sign}
                empty="Skiltet er tomt. Publiser skilttekst i Studio for å vise den her."
              />
            </div>
          </figure>
          <figure className="bakery-sign-view">
            <figcaption>Kortversjon, som i en app</figcaption>
            <div className="bakery-sign-preview bakery-sign-preview--app bakery-sign-text">
              <BakeryText
                sign={sign}
                empty="Skiltet er tomt. Publiser skilttekst i Studio for å vise den her."
              />
            </div>
          </figure>
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
