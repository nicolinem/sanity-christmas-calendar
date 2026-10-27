"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
import Toasts, { pushToast } from "./hud/Toasts";
import Opening from "./hud/Opening";
import { useProgress, useQuestBoard } from "./hud/useQuests";
import { useLiveRefresh } from "./hud/useLive";
import DevPanel from "./hud/DevPanel";
import ForgeDialogue from "./hud/ForgeDialogue";
import EncounterPanel from "./hud/EncounterPanel";
import { useCombat } from "./hud/useCombat";
import { IconQuill } from "./hud/icons";
import { focusGame, toggleStudio, useStudioFocused, useStudioPane } from "./hud/studioPane";
import StudioPane from "./StudioPane";

// Phaser is browser-only: load it with no SSR.
const PhaserGame = dynamic(() => import("@/game/PhaserGame"), {
  ssr: false,
  loading: () => <div className="stage-loading">Tenner lyktene…</div>,
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

// ?dev in the address shows the organizers' panel (see docs/gjennomspilling.md).
function useDevMode() {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).has("dev"),
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
  const [hasMoved, setHasMoved] = useState(false);
  const { progress, forgeLevel, metBrann, reset, revealHint, markIntroSeen, jumpTo } = useProgress();
  const dev = useDevMode();
  const studio = useStudioPane();
  const studioFocused = useStudioFocused() && studio.open;
  // Dev panel overrides for code checks: true/false wins over npm run quest.
  const [devChecks, setDevChecks] = useState<Record<string, boolean>>({});

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

  // Publish in the Studio and the game hears about it straight away.
  const liveMode = useLiveRefresh(refresh, configured === true);

  useEffect(() => bridge.on("moved", () => setHasMoved(true)), []);

  // Compose the full item list: Sanity content + always-present baseline, plus
  // demo items only while Sanity is unconfigured so the game is never empty.
  const items = useMemo<GameItemView[]>(() => {
    const base = configured === false ? [...DEMO_ITEMS, ...BUILTIN_ITEMS] : BUILTIN_ITEMS;
    return [...sanityItems.map((raw) => toGameItem(raw, forgeLevel)), ...base];
  }, [sanityItems, configured, forgeLevel]);

  // A weapon that wasn't there a moment ago rises out of the forge; a fresh
  // forgedAt stamp (the Forge button quest) makes the forge flare. The first
  // load only sets the baseline.
  const seen = useRef<Map<string, string | null> | null>(null);
  useEffect(() => {
    if (configured !== true) return;
    const sanity = items.filter((i) => i.source === "sanity");
    if (!seen.current) {
      seen.current = new Map(sanity.map((i) => [i.id, i.forgedAt]));
      return;
    }
    for (const item of sanity) {
      if (!seen.current.has(item.id)) {
        if (item.kind === "weapon") {
          bridge.emit("itemForged", item.sprite);
          pushToast({ title: "Nytt fra smia", body: item.name, tone: "forge" });
        }
      } else if (item.forgedAt && item.forgedAt !== seen.current.get(item.id)) {
        bridge.emit("forgeFlare", undefined);
      }
      seen.current.set(item.id, item.forgedAt);
    }
  }, [items, configured]);

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
  const checks = useMemo(() => {
    const merged = { ...codeChecks };
    for (const [id, done] of Object.entries(devChecks))
      merged[id] = { done, message: done ? undefined : "Utviklerpanelet later som sjekken ikke er bestått." };
    return merged;
  }, [codeChecks, devChecks]);
  const board = useQuestBoard({
    items,
    codeChecks: checks,
    sanityConfigured: configured,
    wraithDefeatedNow: combat.defeated,
    progress,
  });
  const current = board.current;
  const currentId = current?.quest.id;

  const checkForge = useCallback(() => {
    setCheckedForge(true);
    refresh();
  }, [refresh]);

  // Walking away from Brann ends the conversation.
  const dialogueOpen = talking && zone === "forge";
  const openDialogue = useCallback(() => setTalking(true), []);

  // Talking to Brann is how a quest is handed over, including one that
  // unlocks while you're still talking.
  useEffect(() => {
    if (dialogueOpen) metBrann(currentId);
  }, [dialogueOpen, currentId, metBrann]);

  const openLog = useCallback(() => {
    setTalking(false);
    setLogOpen(true);
  }, []);

  const showOpening = !progress.introSeen;

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
      brannMarker: current?.status === "offered",
      wraithDefeated: combat.defeated,
      frozen: dialogueOpen || logOpen || showOpening,
    });
  }, [equipped, forged, forgeLevel, current?.status, combat.defeated, dialogueOpen, logOpen, showOpening]);

  const slots = narrow ? 5 : 8;

  // Action keys. Movement keys belong to Phaser; these belong to the HUD.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || showOpening) return;
      if ((e.target as HTMLElement)?.closest?.(".dev")) return;
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
  }, [zone, dialogueOpen, logOpen, showOpening, openDialogue, openLog, combat, items, slots, handleEquip]);

  return (
    <div className="game-shell">
      <div className="game-main" onPointerDown={focusGame}>
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
              metBrann={progress.metBlacksmith}
              compact={narrow}
              onOpenLog={openLog}
            />
          </div>

          <div className="hud-tr">
            <button
              type="button"
              className={`studio-link${studio.open ? " is-open" : ""}`}
              onClick={toggleStudio}
              aria-pressed={studio.open}
            >
              <IconQuill size={12} />
              Sanity Studio
            </button>
          </div>

          <div className="hud-bc">
            {dialogueOpen && (
              <ForgeDialogue
                key={currentId ?? "none"}
                board={board}
                forged={forged}
                sanityConfigured={configured}
                fetchFailed={fetchFailed}
                unclaimed={unclaimed}
                refreshing={loading}
                checked={checkedForge}
                onCheck={checkForge}
                onOpenLog={openLog}
                hintsShown={currentId ? (progress.hints[currentId] ?? 0) : 0}
                onRevealHint={revealHint}
                onClose={() => setTalking(false)}
              />
            )}
            {zone === "forge" && !dialogueOpen && (
              <button type="button" className="prompt" onClick={openDialogue}>
                <kbd>E</kbd> Snakk med Brann
              </button>
            )}
            {!hasMoved && !progress.metBlacksmith && !showOpening && zone !== "forge" && (
              <p className="prompt prompt--hint">
                Gå med <kbd>WASD</kbd> eller piltastene. Smia er rett nord.
              </p>
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

          {studioFocused && (
            <button type="button" className="keyboard-away" onClick={focusGame}>
              Studio har tastaturet. Klikk her for å spille.
            </button>
          )}

          <p className="hud-bl controls" aria-label="Kontroller">
            <span>
              <kbd>WASD</kbd> gå
            </span>
            <span>
              <kbd>E</kbd> snakk
            </span>
            <span>
              <kbd>Mellomrom</kbd> angrip
            </span>
            <span>
              <kbd>1</kbd>–<kbd>{slots}</kbd> utstyr
            </span>
            <span>
              <kbd>J</kbd> oppdrag
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

        {showOpening && <Opening onStart={markIntroSeen} />}

        {dev && (
          <DevPanel
            board={board}
            forgeLevel={forgeLevel}
            liveMode={liveMode}
            codeChecks={codeChecks}
            devChecks={devChecks}
            onDevCheck={(id, done) =>
              setDevChecks((prev) => {
                const next = { ...prev };
                if (done === null) delete next[id];
                else next[id] = done;
                return next;
              })
            }
            onJump={jumpTo}
            onReset={() => {
              reset();
              setDevChecks({});
            }}
            weaponSprite={equipped?.kind === "weapon" ? equipped.sprite : null}
          />
        )}
      </div>

      {studio.loaded && <StudioPane width={studio.width} open={studio.open} />}
    </div>
  );
}
