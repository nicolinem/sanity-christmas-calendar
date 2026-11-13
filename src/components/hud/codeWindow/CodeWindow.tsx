"use client";

import { useEffect, useRef, useState } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { lintGutter, setDiagnostics } from "@codemirror/lint";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import type { QuestState, SolvedTask } from "@/game/quests/types";
import { IconCheck } from "../icons";
import { renderText } from "../richText";
import StudioPractice from "../StudioPractice";
import QuestHint from "../QuestHint";
import { lukeName } from "@/game/quests/label";
import { runModule } from "./runCode";
import {
  WINDOW_TASKS,
  type Reference,
  type Verdict,
  type WindowTask,
} from "./tasks";

// The code window: small tasks with one right answer are written here instead
// of in the repo. The code runs in the browser against examples, and once it
// passes, the Studio switches on our own version of it. Loaded only when
// opened, so the editor and sucrase stay out of the game's first load.

// The latest run. When the code doesn't run, `verdict` is still the last one
// that did, so the list and the check stay put instead of collapsing.
type Result = {
  error: { message: string; line?: number } | null;
  verdict: Verdict | null;
};

// `verdict` is null here when the code didn't run; the caller keeps the old one.
// The judge may be async (a rule that asks the fake client), so this is too.
async function evaluate(task: WindowTask, source: string): Promise<Result> {
  const loaded = runModule(source, task.modules, task.importHelp);
  if (!loaded.ok) return { error: loaded, verdict: null };
  try {
    return { error: null, verdict: await task.judge(loaded.exports) };
  } catch (err) {
    return {
      error: {
        message: `Kunne ikke vurdere kriteriene: ${err instanceof Error ? err.message : String(err)}`,
      },
      verdict: null,
    };
  }
}

type Props = {
  state: QuestState;
  solved: boolean;
  onSolved: (how: Omit<SolvedTask, "at">) => void;
  hintsShown: number;
  onRevealHint: () => void;
  onClose: () => void;
};

// Prettier is big, so it loads the first time someone formats.
async function format(source: string): Promise<string> {
  const [prettier, typescript, estree] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/typescript"),
    import("prettier/plugins/estree"),
  ]);
  return prettier.format(source, {
    parser: "typescript",
    plugins: [typescript, estree],
    printWidth: 72,
  });
}

const draftKey = (questId: string) => `winter-quest:code:${questId}`;

function loadDraft(questId: string, starter: string) {
  try {
    return window.localStorage.getItem(draftKey(questId)) ?? starter;
  } catch {
    return starter;
  }
}

function saveDraft(questId: string, source: string) {
  try {
    window.localStorage.setItem(draftKey(questId), source);
  } catch {
    // Not remembered between visits, still works.
  }
}

export default function CodeWindow({
  state,
  solved,
  onSolved,
  hintsShown,
  onRevealHint,
  onClose,
}: Props) {
  const { quest } = state;
  const task = WINDOW_TASKS[quest.id];
  const [source, setSource] = useState(() => loadDraft(quest.id, task.starter));
  const [result, setResult] = useState<Result>({ error: null, verdict: null });
  // null is the player's own file; otherwise one of the files it imports.
  const [tab, setTab] = useState<number | null>(null);
  const [selectedHint, setSelectedHint] = useState<number | null>(null);
  const reference = tab === null ? null : task.references[tab];
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [formatNote, setFormatNote] = useState<string | null>(null);

  // Formats the player's file in place. Code that doesn't parse is left alone;
  // the status line already says where the typo is.
  const formatCode = async () => {
    const view = viewRef.current;
    if (!view) return;
    const before = view.state.doc.toString();
    try {
      const after = await format(before);
      if (view.state.doc.toString() !== before) return; // typed meanwhile
      if (after !== before)
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: after },
        });
      setFormatNote(null);
    } catch {
      setFormatNote("Rett skrivefeilen først, så kan koden formateres.");
    }
    view.focus();
  };
  const formatRef = useRef(formatCode);
  useEffect(() => {
    formatRef.current = formatCode;
  });
  const [initiallySolved] = useState(() => solved);

  // The editor owns the text; React hears about every change.
  useEffect(() => {
    if (!editorRef.current) return;
    const view = new EditorView({
      doc: source,
      parent: editorRef.current,
      extensions: [
        basicSetup,
        // Tab indents, like in an editor. Esc then Tab still leaves the field.
        keymap.of([
          indentWithTab,
          {
            key: "Shift-Alt-f",
            run: () => {
              void formatRef.current();
              return true;
            },
          },
        ]),
        lintGutter(),
        javascript({ jsx: true, typescript: true }),
        oneDark,
        EditorView.theme({ "&": { height: "100%" } }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) setSource(u.state.doc.toString());
        }),
      ],
    });
    viewRef.current = view;
    view.focus();
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Created once; later text comes from the editor itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check a moment after typing stops, and keep the draft. The first check
  // runs at once. An answer that arrives after the text has changed again is
  // dropped (the cleanup flips `current`), and while the code doesn't run the
  // last verdict stays.
  const firstCheck = useRef(true);
  useEffect(() => {
    let current = true;
    const t = window.setTimeout(
      () => {
        saveDraft(quest.id, source);
        evaluate(task, source).then((next) => {
          if (current)
            setResult((prev) =>
              next.error ? { error: next.error, verdict: prev.verdict } : next,
            );
        });
      },
      firstCheck.current ? 0 : 300,
    );
    firstCheck.current = false;
    return () => {
      current = false;
      window.clearTimeout(t);
    };
  }, [source, quest.id, task]);

  const { error, verdict } = result;
  const taskError = error?.message ?? verdict?.error;
  const stale = Boolean(error && verdict);
  useEffect(() => {
    if (
      !error &&
      verdict?.done &&
      !verdict.error &&
      !solved &&
      verdict.solvedAs
    )
      onSolved(verdict.solvedAs);
  }, [error, verdict, solved, onSolved]);

  // Point at the line the error is on, in the gutter and under the text.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const doc = view.state.doc;
    const line = error?.line;
    const diagnostics =
      error && line && line <= doc.lines
        ? [
            {
              from: doc.line(line).from,
              to: doc.line(line).to,
              severity: "error" as const,
              message: error.message.replace(/`/g, ""),
            },
          ]
        : [];
    view.dispatch(setDiagnostics(view.state, diagnostics));
  }, [error]);

  const startOver = () => {
    const view = viewRef.current;
    if (!view) return;
    setTab(null);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: task.starter },
    });
    view.focus();
  };

  const hints = quest.hints.slice(0, hintsShown);
  const activeHint =
    hintsShown > 0
      ? Math.min(hintsShown - 1, Math.max(0, selectedHint ?? hintsShown - 1))
      : 0;
  // Passing now, or (before the first run finishes) passed earlier.
  const passed = !taskError && (verdict ? verdict.done : solved);
  const passedRequirements =
    verdict?.requirements.filter((requirement) => requirement.done).length ?? 0;

  return (
    <div className="log-backdrop cw-backdrop" onClick={onClose}>
      <section
        className="cw frame"
        role="dialog"
        aria-modal="true"
        aria-label={`Kodevindu: luke ${quest.door}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="log-head">
          <h2 className="log-title">Kodevindu</h2>
          <p className="log-meta">
            <span className="cw-door">{lukeName(quest)}</span>: {quest.title}
          </p>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => void formatCode()}
            title="Shift+Alt+F"
            hidden={reference !== null}
          >
            Formater
          </button>
          <button type="button" className="btn btn--quiet" onClick={startOver}>
            Start på nytt
          </button>
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Lukk <kbd>Esc</kbd>
          </button>
        </header>
        <div className="cw-intro">
          <p className="cw-goal">{renderText(quest.goal)}</p>
          {quest.learn && (
            <a
              className="cw-doc-link"
              href={quest.learn.url}
              target="_blank"
              rel="noreferrer"
            >
              Sanity-dokumentasjon: {quest.learn.label} ↗
            </a>
          )}
        </div>

        <div className="cw-body">
          <div className="cw-code">
            <div className="cw-tabs" role="tablist" aria-label="Filer">
              <button
                type="button"
                role="tab"
                aria-selected={tab === null}
                className="cw-tab"
                onClick={() => setTab(null)}
              >
                {task.file}
              </button>
              {task.references.map((ref, i) => (
                <button
                  key={ref.file}
                  type="button"
                  role="tab"
                  aria-selected={tab === i}
                  className="cw-tab"
                  onClick={() => setTab(i)}
                >
                  {ref.file}
                </button>
              ))}
            </div>
            {reference ? (
              <ReferenceNote reference={reference} />
            ) : (
              <p className="cw-file">
                Bare i spillet. Koden lagres ikke i noen fil.
              </p>
            )}
            {/* Hidden, not unmounted, so the player's text and cursor stay put. */}
            <div
              ref={editorRef}
              className="cw-editor"
              hidden={reference !== null}
            />
            {reference && (
              <ReadOnlyCode key={reference.file} source={reference.source} />
            )}
            {passed ? (
              <div className="cw-status is-done" role="status">
                <span>
                  <strong>Oppgave godkjent!</strong>{" "}
                  {initiallySolved
                    ? task.studioCode === false
                      ? "Du har løst denne før."
                      : "Studio bruker vår versjon av koden."
                    : "Luka blir ferdig når du går videre."}
                </span>
                <button
                  type="button"
                  className="btn btn--amber"
                  onClick={onClose}
                >
                  {initiallySolved ? "Lukk" : "Gå videre"}
                </button>
              </div>
            ) : (
              <p
                className={`cw-status${taskError ? " is-error" : ""}`}
                role={taskError ? "alert" : "status"}
              >
                {taskError ? (
                  <>
                    <strong>
                      Feil i {task.file}
                      {error?.line && !taskError.includes(`linje ${error.line}`)
                        ? `, linje ${error.line}`
                        : ""}
                      :
                    </strong>{" "}
                    {renderText(taskError)}
                  </>
                ) : formatNote ? (
                  formatNote
                ) : (
                  "Koden kjører. Se hvilke kriterier som er oppfylt."
                )}
              </p>
            )}
          </div>

          <div className="cw-side">
            <div className="cw-panel-scroll">
              <div className="cw-result-check">
                <section className="cw-panel cw-preview" aria-label="Resultat">
                  <header className="cw-panel-head">
                    <p className="cw-label">{task.resultTitle}</p>
                    {stale && (
                      <span className="cw-stale-note">
                        Fra sist koden kjørte
                      </span>
                    )}
                  </header>
                  <div
                    className={`cw-preview-content${stale ? " cw-stale" : ""}`}
                  >
                    <task.Result verdict={verdict} />
                  </div>
                </section>

                <section className="cw-panel cw-check" aria-label="Kriterier">
                  <header className="cw-panel-head">
                    <p className="cw-label">Kriterier</p>
                    <span className="cw-progress" aria-live="polite">
                      {verdict
                        ? `${passedRequirements} / ${verdict.requirements.length} oppfylt`
                        : "Ikke vurdert"}
                    </span>
                  </header>
                  {verdict ? (
                    <ul
                      className={`cw-reqs${stale ? " cw-stale" : ""}`}
                      aria-live="polite"
                    >
                      {verdict.requirements.map((r) => (
                        <li
                          key={r.label}
                          className={r.done ? "is-done" : undefined}
                        >
                          <span className="tracker-box">
                            {r.done && <IconCheck size={12} />}
                          </span>
                          <span>
                            {renderText(r.label)}
                            {!r.done && r.message && (
                              <span className="cw-req-msg">
                                {renderText(r.message)}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="cw-wait">
                      Kjør koden for å se hvilke kriterier som er oppfylt.
                    </p>
                  )}
                </section>
              </div>

              {!solved && (
                <section className="cw-panel cw-hint-panel" aria-label="Hint">
                  <header className="cw-panel-head cw-hint-head">
                    <p className="cw-label">Hint</p>
                    {hintsShown > 0 && (
                      <div
                        className="cw-hint-controls"
                        aria-label="Navigasjon for hint"
                      >
                        <button
                          type="button"
                          className="cw-hint-arrow"
                          aria-label="Forrige hint"
                          disabled={activeHint === 0}
                          onClick={() => setSelectedHint(activeHint - 1)}
                        >
                          ‹
                        </button>
                        <span
                          className="cw-hint-count"
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          {activeHint + 1} / {quest.hints.length}
                        </span>
                        <button
                          type="button"
                          className="cw-hint-arrow"
                          aria-label="Neste hint"
                          disabled={activeHint === hintsShown - 1}
                          onClick={() => setSelectedHint(activeHint + 1)}
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </header>
                  {hints.length > 0 && (
                    <div className="cw-hint-content">
                      <QuestHint
                        key={activeHint}
                        hint={hints[activeHint]}
                        number={activeHint + 1}
                      />
                    </div>
                  )}
                  {hintsShown < quest.hints.length && (
                    <button
                      type="button"
                      className="btn btn--quiet cw-reveal-hint"
                      onClick={() => {
                        setSelectedHint(hintsShown);
                        onRevealHint();
                      }}
                    >
                      {hintsShown === 0 ? "Vis et hint" : "Vis et hint til"}
                    </button>
                  )}
                </section>
              )}

              {solved && (
                <section
                  className="cw-panel cw-solved"
                  aria-label="Godkjent oppgave"
                >
                  <p role="status">
                    <strong>Oppgave godkjent!</strong>{" "}
                    {task.studioCode === false
                      ? "Svaret stemmer med Arkivarens."
                      : "Studio bruker nå vår versjon av koden."}
                  </p>
                  <StudioPractice
                    state={state}
                    codePassed={solved}
                    onLeave={onClose}
                  />
                  <details>
                    <summary>
                      {task.studioCode === false
                        ? "Arkivarens spørring"
                        : "Koden som er slått på i Studio"}
                    </summary>
                    <pre className="cw-ours">{task.ours}</pre>
                  </details>
                  {task.extend && (
                  <details className="cw-extend">
                    <summary>
                      Vil du prøve mer i din egen editor? (valgfritt)
                    </summary>
                    <p>
                      Dette trengs ikke for å fullføre luka. Kodevinduet endrer
                      ingen filer i repoet.
                    </p>
                    <p>
                      Vil du eksperimentere videre, åpne{" "}
                      <code>{task.extend.file}</code> i editoren din. Finn
                      kommentaren <code>{task.extend.marker}</code>.
                    </p>
                    <p>{renderText(task.extend.idea)}</p>
                  </details>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// What an imported file is for, with a few calls and what they draw.
function ReferenceNote({ reference }: { reference: Reference }) {
  return (
    <div className="cw-ref">
      <h3 className="cw-ref-title">
        Dette gjør{" "}
        <code className="cw-filename">
          {reference.file.replace(/\.tsx?$/, "")}
        </code>
      </h3>
      <p className="cw-file">
        {reference.path && (
          <>
            Ligger i <code>{reference.path}</code> i repoet ditt.{" "}
          </>
        )}
        {renderText(reference.about)}
      </p>
      <ul className="cw-ref-examples">
        {reference.examples.map((ex) => (
          <li key={ex.code}>
            {ex.shows}
            <code>{ex.code}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadOnlyCode({ source }: { source: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const view = new EditorView({
      doc: source,
      parent: ref.current,
      extensions: [
        basicSetup,
        javascript({ jsx: true, typescript: true }),
        oneDark,
        EditorView.theme({ "&": { height: "100%" } }),
        EditorState.readOnly.of(true),
        EditorView.lineWrapping,
      ],
    });
    return () => view.destroy();
  }, [source]);
  return <div ref={ref} className="cw-editor cw-editor--read" />;
}
