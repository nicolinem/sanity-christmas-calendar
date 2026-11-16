"use client";

import { useEffect, useRef, useState } from "react";
import type { QuestTrack } from "@/game/quests/types";
import { NPCS } from "@/game/village";
import SpriteIcon from "./SpriteIcon";

type Stage = "title" | "track" | "welcome" | "share";

type Props = {
  stage: Stage;
  hasProgress: boolean;
  track: QuestTrack;
  projectId: string;
  sanityConfigured: boolean | null;
  onStart: () => void;
  onContinue: () => void;
  onChooseTrack: (track: QuestTrack) => void;
  onWelcomeDone: () => void;
  onChooseShare: (share: boolean) => void;
  onNewGame: () => void;
};

export default function Opening({
  stage,
  hasProgress,
  track,
  projectId,
  sanityConfigured,
  onStart,
  onContinue,
  onChooseTrack,
  onWelcomeDone,
  onChooseShare,
  onNewGame,
}: Props) {
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [stage, confirmNewGame]);

  const title = stage === "title";
  const tracks = stage === "track";

  return (
    <div className={`opening${tracks ? " opening--tracks" : ""}`}>
      {title ? (
        <section
          className="opening-card opening-card--title"
          aria-label="Sanity Julekalender 2026"
        >
          <h1 className="opening-title">
            Sanity Julekalender
            <span>2026</span>
          </h1>
          {hasProgress ? (
            <>
              <button
                ref={primaryRef}
                type="button"
                className="opening-button"
                onClick={onContinue}
              >
                Fortsett
              </button>
              {confirmNewGame ? (
                <div
                  className="opening-confirm"
                  role="group"
                  aria-label="Bekreft nytt spill"
                >
                  <p>Er du sikker? Fremgangen din blir slettet.</p>
                  <div>
                    <button
                      type="button"
                      className="opening-button opening-button--small"
                      onClick={onNewGame}
                    >
                      Ja, nytt spill
                    </button>
                    <button
                      type="button"
                      className="opening-link"
                      onClick={() => setConfirmNewGame(false)}
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="opening-link opening-new"
                  onClick={() => setConfirmNewGame(true)}
                >
                  Nytt spill
                </button>
              )}
            </>
          ) : (
            <button
              ref={primaryRef}
              type="button"
              className="opening-button"
              onClick={onStart}
            >
              Start
            </button>
          )}
          <p className="opening-status" aria-live="polite">
            {sanityConfigured === null ? (
              "Sjekker tilkobling …"
            ) : sanityConfigured ? (
              <>
                Koblet til prosjekt <strong>{projectId}</strong>
              </>
            ) : (
              "Ikke koblet: se oppsettet"
            )}
          </p>
        </section>
      ) : tracks ? (
        <section
          className="opening-card opening-card--tracks"
          aria-labelledby="opening-track-title"
        >
          <h2 className="opening-heading" id="opening-track-title">
            Velg spor
          </h2>
          <div
            className="opening-tracks"
            role="group"
            aria-label="Velg læringsspor"
          >
            <button
              type="button"
              className={`opening-track${track === "technical" ? " is-current" : ""}`}
              aria-pressed={track === "technical"}
              onClick={() => onChooseTrack("technical")}
            >
              <strong>Teknisk</strong>
              <span>
                Du skriver kode og bygger i <em>Studio</em>.
              </span>
            </button>
            <button
              type="button"
              className={`opening-track${track === "nonTechnical" ? " is-current" : ""}`}
              aria-pressed={track === "nonTechnical"}
              onClick={() => onChooseTrack("nonTechnical")}
            >
              <strong>Ikke-teknisk</strong>
              <span>
                Du jobber med innhold i <em>Studio</em>.
              </span>
            </button>
          </div>
        </section>
      ) : stage === "share" ? (
        <section
          className="opening-card opening-card--share"
          aria-labelledby="opening-share-title"
        >
          <h2 className="opening-heading" id="opening-share-title">
            Vil du vises for de andre?
          </h2>
          <p>
            Navnet og figuren din vises for de andre deltakerne. Fremgangen din
            vises også.
          </p>
          <p className="opening-track-note">
            Dette er frivillig. Du kan endre valget senere ved å åpne figuren
            din.
          </p>
          <div className="opening-share-actions">
            <button
              ref={primaryRef}
              type="button"
              className="opening-button"
              onClick={() => onChooseShare(true)}
            >
              Ja, vis meg
            </button>
            <button
              type="button"
              className="opening-link"
              onClick={() => onChooseShare(false)}
            >
              Nei, fortsett privat
            </button>
          </div>
        </section>
      ) : (
        <section
          className="opening-card opening-card--welcome"
          aria-label="Brann ønsker deg velkommen"
        >
          <div className="opening-brann frame frame--inset">
            <SpriteIcon sprite={NPCS.brann.sprite} scale={4} />
          </div>
          <div className="opening-welcome-text">
            <p className="opening-speaker">Brann</p>
            <p>
              Velkommen til bygda. Jeg viser deg hvordan vi får julemarkedet
              klart.
            </p>
            <p className="opening-track-note">
              Du har valgt {track === "technical" ? "teknisk" : "ikke-teknisk"}{" "}
              spor. Du kan bytte senere i journalen.
            </p>
            <button
              ref={primaryRef}
              type="button"
              className="opening-button"
              onClick={onWelcomeDone}
            >
              Lag figuren din
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
