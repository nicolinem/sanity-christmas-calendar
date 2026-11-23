"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck } from "./icons";
import { renderText } from "./richText";
import { CLAIM_URL, manageUrl, type Setup } from "./setup";
import { setupSteps, type SetupStep } from "./setupSteps";
import { openStudio, STUDIO_URL } from "./studioPane";

type Props = { setup: Setup; onClose: () => void };

// «Oppsett»: is the game connected to your Sanity project, can it read it, are
// you signed in to the Studio, and is the project yours. Each open step has
// the button or command that fixes it, and the links you need to find again
// (your project on sanity.io, the Studio in its own tab) are always here.
export default function SetupPanel({ setup, onClose }: Props) {
  const { status, studioAuth, recheck } = setup;
  const closeRef = useRef<HTMLButtonElement>(null);
  const [checking, setChecking] = useState<"idle" | "busy" | "done">("idle");

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

  const steps = status
    ? setupSteps(status, studioAuth, window.location.port)
    : [];

  const action = (step: SetupStep) => {
    if (step.done) return null;
    if (step.id === "studio" && studioAuth !== "error")
      return status?.canSignIn ? (
        <button
          type="button"
          className="btn btn--amber"
          onClick={() => {
            openStudio();
            onClose();
          }}
        >
          Åpne Studio
        </button>
      ) : (
        <a
          className="btn btn--amber"
          href={STUDIO_URL}
          target="_blank"
          rel="noreferrer"
        >
          Logg inn i egen fane
        </a>
      );
    if (step.id === "claim")
      return (
        <>
          <a
            className="btn btn--amber"
            href={CLAIM_URL}
            target="_blank"
            rel="noreferrer"
          >
            Gjør prosjektet til mitt
          </a>
          <small>
            Lenken gjør den som åpner den til eier. Ikke del den med andre.
          </small>
        </>
      );
    return null;
  };

  return (
    <div className="setup-backdrop" onClick={onClose}>
      <section
        className="setup frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="setup-heading">Oppsett</h2>
        {!status ? (
          <p>Sjekker oppsettet …</p>
        ) : (
          <ol className="setup-steps">
            {steps.map((step) => (
              <li
                key={step.id}
                className={step.done ? "is-done" : "is-todo"}
                aria-label={`${step.done ? "Ferdig" : "Gjenstår"}: ${step.title.replace(/\*/g, "")}`}
              >
                <span className="setup-mark" aria-hidden="true">
                  {step.done ? <IconCheck size={14} /> : null}
                </span>
                <div>
                  <p className="setup-title">{renderText(step.title)}</p>
                  {step.detail && (
                    <p className="setup-detail">{renderText(step.detail)}</p>
                  )}
                  {step.command && <Command text={step.command} />}
                  <div className="setup-action">{action(step)}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="setup-links">
          {/* Before claiming the project has no users, so sanity.io shows nothing. */}
          {status?.projectId && status.claim === "claimed" && (
            <a
              href={manageUrl(status.projectId)}
              target="_blank"
              rel="noreferrer"
            >
              Prosjektet ditt på sanity.io
            </a>
          )}
          <a href={STUDIO_URL} target="_blank" rel="noreferrer">
            Studio i egen fane
          </a>
          <button
            type="button"
            className="setup-link-btn"
            disabled={checking === "busy"}
            onClick={async () => {
              setChecking("busy");
              await recheck();
              setChecking("done");
            }}
          >
            {checking === "busy"
              ? "Sjekker …"
              : checking === "done"
                ? "Sjekket nå. Sjekk igjen"
                : "Sjekk på nytt"}
          </button>
        </div>
        <button ref={closeRef} type="button" className="btn" onClick={onClose}>
          Lukk
        </button>
      </section>
    </div>
  );
}

function Command({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <p className="setup-command">
      <code>{text}</code>
      <button
        type="button"
        className="setup-link-btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          } catch {
            // No clipboard: the command can be selected by hand.
          }
        }}
      >
        {copied ? "Kopiert" : "Kopier"}
      </button>
    </p>
  );
}

// «2 av 4» on the HUD button while something is left.
export function setupProgress(
  setup: Setup,
): { done: number; total: number } | null {
  if (!setup.status) return null;
  const steps = setupSteps(
    setup.status,
    setup.studioAuth,
    window.location.port,
  );
  return { done: steps.filter((s) => s.done).length, total: steps.length };
}
