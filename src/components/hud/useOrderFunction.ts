"use client";

import { useEffect, useRef, useState } from "react";
import type { BakeryOrder, BakerySign } from "@/game/bakery";
import {
  newPublishes,
  runOrderFunction,
  type OrderFunction,
} from "@/game/orderFunction";
import { PROGRESS_PROJECT } from "@/game/quests/progress";
import { loadDraft } from "./codeWindow/drafts";
import { runModule } from "./codeWindow/runCode";
import { bakerFunctionTask } from "./codeWindow/tasks/bakerFunction";
import { pushToast } from "./Toasts";

// What the function last wrote, and the published sign it wrote over. When
// the sign is published again in Studio, that one wins.
type Saved = { base: string; sign: BakerySign };
const savedKey = `winter-quest:function-sign:${PROGRESS_PROJECT}`;

function readSaved(): Saved | null {
  try {
    return JSON.parse(window.localStorage.getItem(savedKey) ?? "null");
  } catch {
    return null;
  }
}

function save(saved: Saved) {
  try {
    window.localStorage.setItem(savedKey, JSON.stringify(saved));
  } catch {
    // Not remembered between visits; the sign still updates now.
  }
}

// The player's own function from the code window, or ours if it's gone.
function loadFunction(): OrderFunction | null {
  const source = loadDraft(bakerFunctionTask.id, bakerFunctionTask.solution);
  const loaded = runModule(source, bakerFunctionTask.modules);
  const fn = loaded.ok ? loaded.exports.handler : null;
  return typeof fn === "function" ? (fn as OrderFunction) : null;
}

// Luke 11 after it's solved: each order published in Studio runs the
// player's function, and the sign in the village shows what it wrote.
export function useOrderFunction(
  enabled: boolean,
  orders: BakeryOrder[] | null,
  sign: BakerySign | null,
): { sign: BakerySign | null; byFunction: boolean } {
  const base = JSON.stringify(sign ?? null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const seen = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    // Read once on the client; localStorage isn't there on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(readSaved());
  }, []);

  const current = saved && saved.base === base ? saved.sign : sign;

  useEffect(() => {
    if (!enabled || !orders) return;
    const { seen: next, changed } = newPublishes(seen.current, orders);
    seen.current = next;
    if (!changed.length) return;
    const fn = loadFunction();
    if (!fn) {
      pushToast({
        tone: "lesson",
        title: "Funksjonen din kjører ikke",
        body: "Åpne kodevinduet for luke 11 og se hva som er galt.",
      });
      return;
    }
    void runOrderFunction(fn, changed, current).then((result) => {
      for (const run of result.runs)
        pushToast({
          tone: run.wrote && !run.error ? "forge" : "lesson",
          ...(run.error
            ? {
                title: "Funksjonen din feilet",
                body: `${run.item}: ${run.error}`,
              }
            : run.wrote
              ? {
                  title: "Funksjonen din oppdaterte skiltet",
                  body: `Publisert: ${run.item}. Se bodskiltet.`,
                }
              : {
                  title: "Funksjonen din kjørte",
                  body: `Publisert: ${run.item}. Skiltet trengte ingen endring.`,
                }),
        });
      if (result.sign && result.sign !== current) {
        const next = { base, sign: result.sign };
        setSaved(next);
        save(next);
      }
    });
    // Runs only when the orders change; `current` and `base` are read then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, orders]);

  return { sign: current, byFunction: current !== sign };
}
