"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import type { SanityItem } from "@/sanity/queries";
import {
  BUILTIN_ITEMS,
  DEMO_ITEMS,
  isUsableWeapon,
  toGameItem,
  type GameItemView,
} from "@/game/items";
import { bridge, type Zone } from "@/game/bridge";
import { findForgedWeapon } from "@/game/quests/chapters";
import type { CodeCheck } from "@/game/quests/types";
import Hotbar from "./hud/Hotbar";
import QuestTracker from "./hud/QuestTracker";
import QuestLog from "./hud/QuestLog";
import Toasts from "./hud/Toasts";
import { useProgress, useQuestBoard } from "./hud/useQuests";
import ForgeDialogue, { STUDIO_URL } from "./hud/ForgeDialogue";
import EncounterPanel from "./hud/EncounterPanel";
import { useCombat } from "./hud/useCombat";
import { IconQuill } from "./hud/icons";

// Phaser is browser-only: load it with no SSR.
const PhaserGame = dynamic(() => import("@/game/PhaserGame"), {
  ssr: false,
  loading: () => <div className="stage-loading">Lighting the lanterns…</div>,
});

function useNarrow() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(max-width: 720px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 720px)").matches,
    () => false,
  );
}

function useZone() {
  return useSyncExternalStore<Zone>(
    (cb) => bridge.on("zone", cb),
    () => bridge.zone,
    () => null,
  );
}

export default function GameClient() {
  const [sanityItems, setSanityItems] = useState<SanityItem[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [unclaimed, setUnclaimed] = useState(false);
  const [codeChecks, setCodeChecks] = useState<Record<string, CodeCheck>>({});
  const [equippedId, setEquippedId] = useState<string | null>(null);
  // While true, the game keeps the strongest weapon equipped as content loads.
  // A manual click turns it off so the player's choice sticks.
  const [autoEquip, setAutoEquip] = useState(true);

  const zone = useZone();
  const narrow = useNarrow();
  const [talking, setTalking] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [checkedForge, setCheckedForge] = useState(false);
  const { progress, forgeLevel, metBrann, reset, revealHint } = useProgress();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [res, checks] = await Promise.all([
        fetch("/api/items", { cache: "no-store" }),
        fetch("/api/quest-checks", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({ checks: {} })),
      ]);
      const data: { configured: boolean; unclaimed?: boolean; items: SanityItem[]; error?: string } =
        await res.json();
      setCodeChecks(checks.checks ?? {});
      setConfigured(data.configured);
      setUnclaimed(Boolean(data.unclaimed));
      setFetchFailed(Boolean(data.error));
      setSanityItems(data.items ?? []);
    } catch {
      setConfigured(false);
      setSanityItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Compose the full item list: Sanity content + always-present baseline, plus
  // demo items only while Sanity is unconfigured so the game is never empty.
  const items = useMemo<GameItemView[]>(() => {
    const base = configured === false ? [...DEMO_ITEMS, ...BUILTIN_ITEMS] : BUILTIN_ITEMS;
    return [...sanityItems.map((raw) => toGameItem(raw, forgeLevel)), ...base];
  }, [sanityItems, configured, forgeLevel]);

  // Auto-equip the strongest usable weapon the first time items load / change,
  // unless the player has already chosen one that still exists.
  const equipped = useMemo(
    () => items.find((i) => i.id === equippedId) ?? null,
    [items, equippedId],
  );

  useEffect(() => {
    if (!autoEquip) return;
    const best = [...items]
      .filter(isUsableWeapon)
      .sort((a, b) => (b.power?.damage ?? 0) - (a.power?.damage ?? 0))[0];
    if (best && best.id !== equippedId) setEquippedId(best.id);
  }, [items, autoEquip, equippedId]);

  const handleEquip = useCallback((item: GameItemView) => {
    setAutoEquip(false);
    setEquippedId(item.id);
  }, []);

  const forged = findForgedWeapon(items);
  const combat = useCombat(equipped);
  const board = useQuestBoard({
    items,
    codeChecks,
    sanityConfigured: configured,
    wraithDefeatedNow: combat.defeated,
    progress,
  });
  const active = board.active;

  const checkForge = useCallback(() => {
    setCheckedForge(true);
    refresh();
  }, [refresh]);

  // Walking away from Brann ends the conversation.
  const dialogueOpen = talking && zone === "forge";

  const activeId = active?.quest.id;
  const openDialogue = useCallback(() => setTalking(true), []);

  // Whatever task Brann is talking about counts as explained, including one
  // that unlocks while the dialogue is open.
  useEffect(() => {
    if (dialogueOpen) metBrann(activeId);
  }, [dialogueOpen, activeId, metBrann]);

  const openLog = useCallback(() => {
    setTalking(false);
    setLogOpen(true);
  }, []);

  // Keep the world in sync with game state.
  useEffect(() => {
    const hand =
      equipped && equipped.kind === "weapon" && !(equipped.source === "builtin" && !equipped.spriteId)
        ? equipped.sprite
        : null;
    bridge.setWorld({
      weapon: hand,
      forgeLit: Boolean(forged),
      forgeLevel,
      brannMarker: activeId ? !progress.briefed[activeId] : false,
      wraithDefeated: combat.defeated,
      frozen: dialogueOpen || logOpen,
    });
  }, [equipped, forged, forgeLevel, activeId, progress.briefed, combat.defeated, dialogueOpen, logOpen]);

  const slots = narrow ? 5 : 8;

  // Action keys. Movement keys belong to Phaser; these belong to the HUD.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onControl = (e.target as HTMLElement)?.closest?.("button, a, input, textarea");
      if (logOpen) {
        if (e.key === "Escape" || e.key === "j" || e.key === "J") setLogOpen(false);
        return;
      }
      if (e.key === "j" || e.key === "J") {
        openLog();
        return;
      }
      if (e.key === "Escape" && dialogueOpen) {
        setTalking(false);
        return;
      }
      if ((e.key === "e" || e.key === "E") && zone === "forge") {
        if (dialogueOpen) setTalking(false);
        else openDialogue();
        return;
      }
      if (e.key === " " && zone === "wraith" && !onControl) {
        e.preventDefault();
        combat.attack();
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= slots && !dialogueOpen) {
        const item = items[n - 1];
        if (item?.kind === "weapon") handleEquip(item);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zone, dialogueOpen, logOpen, openDialogue, openLog, combat, items, slots, handleEquip]);

  return (
    <div className="game-shell">
      <div className="stage">
        <PhaserGame />
        <div className="stage-vignette" aria-hidden />
      </div>

      <div className="hud">
        <div className="hud-tl">
          <h1 className="crest">
            <span className="crest-title">Winter Quest</span>
            <span className="crest-place">Frostholm</span>
          </h1>
          <QuestTracker
            key={narrow ? "compact" : "full"}
            board={board}
            forgeLevel={forgeLevel}
            compact={narrow}
            onOpenLog={openLog}
          />
        </div>

        <div className="hud-tr">
          <a className="studio-link" href={STUDIO_URL} target="_blank" rel="noreferrer">
            <IconQuill size={12} />
            Sanity Studio
          </a>
        </div>

        <div className="hud-bc">
          {dialogueOpen && (
            <ForgeDialogue
              active={active}
              forged={forged}
              sanityConfigured={configured}
              fetchFailed={fetchFailed}
              unclaimed={unclaimed}
              refreshing={loading}
              checked={checkedForge}
              onCheck={checkForge}
              onOpenLog={openLog}
              hintsShown={active ? (progress.hints[active.quest.id] ?? 0) : 0}
              onRevealHint={revealHint}
              onClose={() => setTalking(false)}
            />
          )}
          {zone === "forge" && !dialogueOpen && (
            <button type="button" className="prompt" onClick={openDialogue}>
              <kbd>E</kbd> Talk to Brann
            </button>
          )}
          {zone === "wraith" && <EncounterPanel combat={combat} weapon={equipped} />}

          <Hotbar
            items={items}
            equippedId={equippedId}
            onEquip={handleEquip}
            onRefresh={refresh}
            refreshing={loading}
            slots={slots}
          />
        </div>

        <Toasts />

        <p className="hud-bl controls" aria-label="Controls">
          <span>
            <kbd>WASD</kbd> walk
          </span>
          <span>
            <kbd>E</kbd> talk
          </span>
          <span>
            <kbd>Space</kbd> attack
          </span>
          <span>
            <kbd>1</kbd>–<kbd>{slots}</kbd> equip
          </span>
          <span>
            <kbd>J</kbd> quests
          </span>
        </p>
      </div>

      {logOpen && (
        <QuestLog
          board={board}
          forgeLevel={forgeLevel}
          hintsShown={progress.hints}
          onRevealHint={revealHint}
          onClose={() => setLogOpen(false)}
          onReset={reset}
        />
      )}
    </div>
  );
}
