"use client";

import { useEffect, useRef, useState } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import type { QuestState, SolvedTask } from "@/game/quests/types";
import { IconCheck } from "../icons";
import { renderText } from "../richText";
import { openStudio } from "../studioPane";
import { runModule } from "./runCode";
import { WINDOW_TASKS, type Reference, type Verdict, type WindowTask } from "./tasks";

// The code window: small tasks with one right answer are written here instead
// of in the repo. The code runs in the browser against examples, and once it
// passes, the Studio switches on our own version of it. Loaded only when
// opened, so the editor and sucrase stay out of the game's first load.

// The latest run. When the code doesn't run, `verdict` is still the last one
// that did, so the list and the check stay put instead of collapsing.
type Result = { error: { message: string; line?: number } | null; verdict: Verdict | null };

// `verdict` is null here when the code didn't run; the caller keeps the old one.
// The judge may be async (a rule that asks the fake client), so this is too.
async function evaluate(task: WindowTask, source: string): Promise<Result> {
  const loaded = runModule(source, task.modules, task.importHelp);
  if (!loaded.ok) return { error: loaded, verdict: null };
  try {
    return { error: null, verdict: await task.judge(loaded.exports) };
  } catch (err) {
    return { error: { message: `Sjekken krasjet: ${err instanceof Error ? err.message : String(err)}` }, verdict: null };
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

export default function CodeWindow({ state, solved, onSolved, hintsShown, onRevealHint, onClose }: Props) {
  const { quest } = state;
  const task = WINDOW_TASKS[quest.id];
  const [source, setSource] = useState(() => loadDraft(quest.id, task.starter));
  const [result, setResult] = useState<Result>({ error: null, verdict: null });
  // null is the player's own file; otherwise one of the files it imports.
  const [tab, setTab] = useState<number | null>(null);
  const reference = tab === null ? null : task.references[tab];
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // The editor owns the text; React hears about every change.
  useEffect(() => {
    if (!editorRef.current) return;
    const view = new EditorView({
      doc: source,
      parent: editorRef.current,
      extensions: [
        basicSetup,
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
          if (current) setResult((prev) => (next.error ? { error: next.error, verdict: prev.verdict } : next));
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
  const stale = Boolean(error && verdict);
  useEffect(() => {
    if (!error && verdict?.done && !solved && verdict.solvedAs) onSolved(verdict.solvedAs);
  }, [error, verdict, solved, onSolved]);

  const startOver = () => {
    const view = viewRef.current;
    if (!view) return;
    setTab(null);
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: task.starter } });
    view.focus();
  };

  const hints = quest.hints.slice(0, hintsShown);

  return (
    <div className="log-backdrop" onClick={onClose}>
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
            Luke {quest.door}: {quest.title}
          </p>
          <button type="button" className="btn btn--quiet" onClick={startOver}>
            Start på nytt
          </button>
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Lukk <kbd>Esc</kbd>
          </button>
        </header>
        <p className="cw-goal">{renderText(quest.goal)}</p>

        <div className="cw-body">
          <div className="cw-code">
            <div className="cw-tabs" role="tablist" aria-label="Filer">
              <button type="button" role="tab" aria-selected={tab === null} className="cw-tab" onClick={() => setTab(null)}>
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
                  {ref.file} <span className="cw-tab-tag">bare lese</span>
                </button>
              ))}
            </div>
            {reference ? (
              <ReferenceNote reference={reference} />
            ) : (
              <p className="cw-file">Bare i spillet. Koden lagres ikke i noen fil.</p>
            )}
            {/* Hidden, not unmounted, so the player's text and cursor stay put. */}
            <div ref={editorRef} className="cw-editor" hidden={reference !== null} />
            {reference && <ReadOnlyCode key={reference.file} source={reference.source} />}
            <p className={`cw-status${error ? " is-error" : ""}`} role="status">
              {error ? renderText(error.message) : "Koden kjører."}
            </p>
          </div>

          <div className="cw-side">
            <p className="cw-label">
              {task.resultTitle}
              {stale && <span className="cw-stale-note">Fra sist koden kjørte</span>}
            </p>
            <div className={stale ? "cw-stale" : undefined}>
              <task.Result verdict={verdict} />
            </div>

            <p className="cw-label">Sjekken</p>
            {verdict ? (
              <ul className={`cw-reqs${stale ? " cw-stale" : ""}`} aria-live="polite">
                {verdict.requirements.map((r) => (
                  <li key={r.label} className={r.done ? "is-done" : undefined}>
                    <span className="tracker-box">{r.done && <IconCheck size={12} />}</span>
                    <span>
                      {renderText(r.label)}
                      {!r.done && r.message && <span className="cw-req-msg">{renderText(r.message)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cw-wait">Sjekken venter til koden kjører.</p>
            )}

            {solved ? (
              <div className="cw-solved" role="status">
                <p>
                  <strong>Løst!</strong> Studio bruker nå vår versjon av den samme koden. Se lista med ikon og sprites.
                </p>
                <button type="button" className="btn btn--amber" onClick={openStudio}>
                  Se det i Studio
                </button>
                <details>
                  <summary>Koden som er slått på i Studio</summary>
                  <pre className="cw-ours">{task.ours}</pre>
                </details>
                <div className="cw-extend">
                  <p className="cw-extend-title">Gå videre i koden</p>
                  <p>
                    Vår versjon ligger i <code>{task.extend.file}</code>. Se etter kommentaren{" "}
                    <code>{task.extend.marker}</code>.
                  </p>
                  <p>{renderText(task.extend.idea)}</p>
                </div>
              </div>
            ) : (
              <div className="cw-hints">
                {hints.map((hint, i) => (
                  <p key={i} className="log-hint">
                    <span className="log-hint-n">Hint {i + 1}</span> {renderText(hint.text)}
                    {hint.link && (
                      <>
                        {" "}
                        <a className="log-hint-link" href={hint.link.url} target="_blank" rel="noreferrer">
                          {hint.link.label}
                        </a>
                      </>
                    )}
                  </p>
                ))}
                {hintsShown < quest.hints.length && (
                  <button type="button" className="btn btn--quiet" onClick={onRevealHint}>
                    {hintsShown === 0 ? "Vis et hint" : "Vis et hint til"}
                  </button>
                )}
              </div>
            )}
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
      <p className="cw-file">
        Ligger i <code>{reference.path}</code> i repoet ditt. {renderText(reference.about)}
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
