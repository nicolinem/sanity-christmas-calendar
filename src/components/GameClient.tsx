"use client";

import {
  FIGURE_OPTIONS,
  normalizeFigure,
  type FigureChoice,
} from "@/game/figure";
import { communityEndpoint } from "@/game/communityEndpoint";
import { ownedGear, wearable } from "@/game/wardrobe";
import CharacterSheet from "./figure/CharacterSheet";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import type { SanityItem } from "@/sanity/queries";
import {
  BUILTIN_ITEMS,
  DEMO_ITEMS,
  isUsableWeapon,
  toGameItem,
  type GameItemView,
} from "@/game/items";
import { nextStepPoint, weekDoors } from "@/game/quests/doors";
import {
  bridge,
  type QuestCelebration as QuestCelebrationData,
  type Zone,
} from "@/game/bridge";
import { findForgedWeapon, findPlayerWeapon } from "@/game/quests/chapters";
import type { CodeCheck, QuestTrack } from "@/game/quests/types";
import Hotbar from "./hud/Hotbar";
import PlayerPlate from "./hud/PlayerPlate";
import QuestTracker from "./hud/QuestTracker";
import QuestLog from "./hud/QuestLog";
import Toasts, { pushToast } from "./hud/Toasts";
import QuestCelebration from "./hud/QuestCelebration";
import WeekComplete from "./hud/WeekComplete";
import {
  finishedWeeks,
  weekNeedsSummary,
  weekSummary,
} from "@/game/quests/weeks";
import Opening from "./hud/Opening";
import { useProgress, useQuestBoard } from "./hud/useQuests";
import { PROGRESS_PROJECT, updateProgress } from "@/game/quests/progress";
import { ARCHIVE_IDS, type OwnArchiveDoc, type OwnCase } from "@/game/archive";
import { SAMPLE_ORDERS } from "@/game/bakery";
import { APPRENTICE_ITEM_ID } from "@/game/apprentice";
import BakerySign from "./hud/BakerySign";
import ArchiveNoticeboard from "./hud/ArchiveNoticeboard";
import ForgeDescription from "./hud/ForgeDescription";
import ForgeHammer from "./hud/ForgeHammer";
import { giverOf } from "@/game/quests/label";
import { npcAtSite, type QuestSiteId } from "@/game/village";
import { useLiveRefresh } from "./hud/useLive";
import DevPanel from "./hud/DevPanel";
import ForgeDialogue from "./hud/ForgeDialogue";
import EncounterPanel from "./hud/EncounterPanel";
import { useCombat } from "./hud/useCombat";
import { IconQuill } from "./hud/icons";
import {
  closeStudio,
  focusGame,
  openStudio,
  toggleStudio,
  useStudioFocused,
  useStudioPane,
} from "./hud/studioPane";
import StudioPane from "./StudioPane";

// Phaser is browser-only: load it with no SSR.
const PhaserGame = dynamic(() => import("@/game/PhaserGame"), {
  ssr: false,
  loading: () => <div className="stage-loading">Laster spillet…</div>,
});

// The editor and the compiler only load when the code window opens.
const CodeWindow = dynamic(() => import("./hud/codeWindow/CodeWindow"), {
  ssr: false,
});
const ModelBoard = dynamic(() => import("./hud/modelBoard/ModelBoard"), {
  ssr: false,
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
    () =>
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("dev"),
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
  const [unpublishedDrafts, setUnpublishedDrafts] = useState(0);
  // Arkivarens observasjoner in the player's project (uke 2, non-technical).
  const [archive, setArchive] = useState<OwnArchiveDoc[] | null>(null);
  const [archiveCases, setArchiveCases] = useState<OwnCase[] | null>(null);
  const [archiveCaseDrafts, setArchiveCaseDrafts] = useState(false);
  const [bakeryOrders, setBakeryOrders] = useState<
    import("@/game/bakery").BakeryOrder[] | null
  >(null);
  const [bakerySign, setBakerySign] = useState<
    import("@/game/bakery").BakerySign | null
  >(null);
  const [codeChecks, setCodeChecks] = useState<Record<string, CodeCheck>>({});
  const [communityReady, setCommunityReady] = useState(false);
  const [equippedId, setEquippedId] = useState<string | null>(null);
  // While true, the game keeps the strongest weapon equipped as content loads.
  // A manual click turns it off so the player's choice sticks.
  const [autoEquip, setAutoEquip] = useState(true);

  const zone = useZone();
  const narrow = useNarrow();
  const [talking, setTalking] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [caseOpen, setCaseOpen] = useState(false);
  const [celebrations, setCelebrations] = useState<QuestCelebrationData[]>([]);
  const celebration = celebrations[0];
  const [logInitialTab, setLogInitialTab] = useState<"quests" | "map" | "book">(
    "quests",
  );
  const [logInitialQuestId, setLogInitialQuestId] = useState<
    string | undefined
  >();
  const [codeQuestId, setCodeQuestId] = useState<string | null>(null);
  const [modelQuestId, setModelQuestId] = useState<string | null>(null);
  const [checkedForge, setCheckedForge] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  useEffect(
    () =>
      bridge.on("questCelebration", (celebration) => {
        setTalking(false);
        setLogOpen(false);
        setCelebrations((queue) => [...queue, celebration]);
      }),
    [],
  );
  const {
    progress,
    forgeLevel,
    metBrann,
    reset,
    revealHint,
    solveTask,
    markWeekSeen,
    fetchQuest,
    jumpTo,
    completeQuest,
    setTrack,
  } = useProgress();
  const [entryStage, setEntryStage] = useState<
    "title" | "track" | "welcome" | "share" | "figure" | "game"
  >("title");
  useEffect(() => {
    fetch(communityEndpoint, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setCommunityReady(Boolean(data?.publishing)))
      .catch(() => {}); // The shared project is optional; the game stays playable offline.
  }, []);
  const dev = useDevMode();
  // The figure as worn: gear the player hasn't earned (yet) is left off.
  const owned = useMemo(() => ownedGear(progress, { dev }), [progress, dev]);
  const previousOwnedGear = useRef<Set<string> | null>(null);
  useEffect(() => {
    const previous = previousOwnedGear.current;
    if (previous && !dev) {
      let delay = 0;
      const categories: Partial<Record<keyof FigureChoice, string>> = {
        armour: "Rustning",
        hat: "Hodeplagg",
        scarf: "Hals",
        extra: "Ekstra",
      };
      for (const gearKey of owned) {
        if (previous.has(gearKey)) continue;
        const [part, id] = gearKey.split(":") as [keyof FigureChoice, string];
        const category = categories[part];
        const option = FIGURE_OPTIONS[part].find((item) => item.id === id);
        if (category && option) {
          const toast = {
            title: `Ny ${category}: ${option.label}.`,
            body: "Trykk C for å ta den på.",
            tone: "lesson",
          } as const;
          window.setTimeout(() => pushToast(toast), delay);
          delay += 1800;
        }
      }
    }
    previousOwnedGear.current = new Set(owned);
  }, [owned, dev]);
  const figure = useMemo(
    () =>
      progress.figure
        ? wearable(normalizeFigure(progress.figure), owned)
        : null,
    [progress.figure, owned],
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"bag" | "look">("look");
  const openSheet = useCallback((tab: "bag" | "look") => {
    setSheetTab(tab);
    setSheetOpen(true);
  }, []);
  const withdrawCommunityProfile = useCallback(() => {
    if (!communityReady || !configured || PROGRESS_PROJECT === "demo") return;
    fetch(communityEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: PROGRESS_PROJECT,
        questIds: [],
        character: { visible: false },
      }),
    }).catch(() => {});
  }, [communityReady, configured]);
  const saveFigure = useCallback(
    (choice: FigureChoice, name: string, shareProfile: boolean) => {
      if (progress.shareProfile && !shareProfile) withdrawCommunityProfile();
      updateProgress(PROGRESS_PROJECT, (p) => ({
        ...p,
        figure: { ...choice },
        name: name || undefined,
        shareProfile,
        sharePrompted: true,
        introSeen: true,
      }));
      setSheetOpen(false);
      setEntryStage("game");
    },
    [progress.shareProfile, withdrawCommunityProfile],
  );
  const begin = useCallback(() => {
    setEntryStage(progress.trackChosen ? "welcome" : "track");
  }, [progress.trackChosen]);
  const chooseShare = useCallback(
    (shareProfile: boolean) => {
      if (!shareProfile) withdrawCommunityProfile();
      updateProgress(PROGRESS_PROJECT, (p) => ({
        ...p,
        shareProfile,
        sharePrompted: true,
      }));
      setEntryStage("game");
    },
    [withdrawCommunityProfile],
  );
  const chooseTrack = useCallback(
    (track: QuestTrack) => {
      setTrack(track);
      setEntryStage("welcome");
    },
    [setTrack],
  );
  const startNewGame = useCallback(() => {
    if (progress.shareProfile || !progress.sharePrompted)
      withdrawCommunityProfile();
    reset();
    setEntryStage("track");
  }, [
    progress.shareProfile,
    progress.sharePrompted,
    reset,
    withdrawCommunityProfile,
  ]);
  const studio = useStudioPane();
  const studioFocused = useStudioFocused() && studio.open;
  // Dev panel overrides for code checks: true/false wins over npm run quest.
  const [devChecks, setDevChecks] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [res, checks, own, bakery] = await Promise.all([
        fetch("/api/items", { cache: "no-store" }),
        fetch("/api/quest-checks", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({ checks: {} })),
        fetch("/api/archive", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
        fetch("/api/bakery", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
      ]);
      setArchive(own?.error ? null : (own?.docs ?? null));
      setArchiveCases(own?.error ? null : (own?.cases ?? null));
      setArchiveCaseDrafts(Boolean(own?.caseDraft));
      setBakeryOrders(bakery?.error ? null : (bakery?.orders ?? null));
      setBakerySign(bakery?.error ? null : (bakery?.sign ?? null));
      const data: {
        configured: boolean;
        unclaimed?: boolean;
        unpublishedDrafts?: number;
        items: SanityItem[];
        error?: string;
      } = await res.json();
      setCodeChecks(checks.checks ?? {});
      setConfigured(data.configured);
      setUnclaimed(Boolean(data.unclaimed));
      setUnpublishedDrafts(data.unpublishedDrafts ?? 0);
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

  const studioWasOpen = useRef(studio.open);
  useEffect(() => {
    if (studioWasOpen.current && !studio.open) refresh();
    studioWasOpen.current = studio.open;
  }, [refresh, studio.open]);

  // Publish in the Studio and the game hears about it straight away.
  const liveMode = useLiveRefresh(refresh, configured === true);

  useEffect(() => bridge.on("moved", () => setHasMoved(true)), []);

  // Compose the full item list: Sanity content + always-present baseline, plus
  // demo items only while Sanity is unconfigured so the game is never empty.
  const items = useMemo<GameItemView[]>(() => {
    const base =
      configured === false ? [...DEMO_ITEMS, ...BUILTIN_ITEMS] : BUILTIN_ITEMS;
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
          pushToast({ title: "Nytt våpen", body: item.name, tone: "forge" });
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
  const bestWeapon = useMemo(
    () =>
      [...items]
        .filter(isUsableWeapon)
        .sort((a, b) => (b.power?.damage ?? 0) - (a.power?.damage ?? 0))[0],
    [items],
  );

  useEffect(() => {
    if (
      !communityReady ||
      configured !== true ||
      PROGRESS_PROJECT === "demo" ||
      !progress.shareProfile ||
      (autoEquip && bestWeapon && equippedId !== bestWeapon.id) ||
      new URLSearchParams(window.location.search).has("dev")
    )
      return;
    // Resend on reload: milestones deduplicate, while the selected weapon stays current.
    fetch(communityEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: PROGRESS_PROJECT,
        questIds: Object.keys(progress.completed),
        character: {
          visible: true,
          weapon:
            equipped?.source === "sanity" && equipped.kind === "weapon"
              ? { name: equipped.name, spriteId: equipped.spriteId }
              : null,
          figure,
          name: progress.name,
        },
      }),
    }).catch(() => {});
  }, [
    communityReady,
    configured,
    progress.completed,
    progress.shareProfile,
    figure,
    progress.name,
    equipped,
    autoEquip,
    bestWeapon,
    equippedId,
  ]);

  useEffect(() => {
    if (!autoEquip) return;
    if (bestWeapon && bestWeapon.id !== equippedId)
      setEquippedId(bestWeapon.id);
  }, [bestWeapon, autoEquip, equippedId]);

  const handleEquip = useCallback((item: GameItemView) => {
    setAutoEquip(false);
    setEquippedId(item.id);
  }, []);

  const forged = findForgedWeapon(items);
  const combat = useCombat(equipped);
  const checks = useMemo(() => {
    const merged = { ...codeChecks };
    for (const [id, done] of Object.entries(devChecks))
      merged[id] = {
        done,
        message: done
          ? undefined
          : "Utviklerpanelet later som kriteriene ikke er oppfylt.",
      };
    return merged;
  }, [codeChecks, devChecks]);
  const board = useQuestBoard({
    items,
    codeChecks: checks,
    codeQuestId: codeQuestId ?? modelQuestId,
    sanityConfigured: configured,
    unpublishedDrafts,
    archive,
    archiveCases,
    archiveCaseDrafts,
    bakeryOrders,
    bakerySign,
    wraithDefeatedNow: combat.defeated,
    progress,
  });
  const current = board.current;
  const currentId = current?.quest.id;
  const villageDoors = useMemo(() => weekDoors(board), [board]);
  const nextStep = useMemo(
    () => nextStepPoint(board, villageDoors),
    [board, villageDoors],
  );
  const siteQuest =
    zone && zone !== "forge"
      ? board.states.find(
          (state) =>
            state.quest.villageSite === zone &&
            (state.pickup === zone ||
              (zone !== "bakerySign" && state.status === "active")),
        )
      : undefined;

  const checkForge = useCallback(() => {
    setCheckedForge(true);
    refresh();
  }, [refresh]);

  // Who the knight is standing by, if anyone. Walking away ends the talk.
  const talkTo = npcAtSite(zone === "wraith" ? null : zone);
  const dialogueOpen = talking && Boolean(talkTo);
  const openDialogue = useCallback(() => setTalking(true), []);

  // Talking to Brann is how a quest is handed over, including one that
  // unlocks while you're still talking.
  // Only the luke's own giver hands it over.
  const currentGiver = board.current
    ? giverOf(board.current.quest).id
    : "brann";
  useEffect(() => {
    if (dialogueOpen && talkTo?.id === currentGiver)
      metBrann(currentId, equipped ?? undefined);
  }, [dialogueOpen, talkTo, currentGiver, currentId, metBrann, equipped]);

  const openLog = useCallback(() => {
    setTalking(false);
    setLogInitialTab("quests");
    setLogInitialQuestId(undefined);
    setLogOpen(true);
  }, []);

  const openMap = useCallback(() => {
    setTalking(false);
    setLogInitialTab("map");
    setLogInitialQuestId(undefined);
    setLogOpen(true);
  }, []);

  const openQuestLog = useCallback((questId: string) => {
    setTalking(false);
    setLogInitialTab("quests");
    setLogInitialQuestId(questId);
    setLogOpen(true);
  }, []);

  const travelToSite = useCallback((siteId: QuestSiteId) => {
    setTalking(false);
    setLogOpen(false);
    bridge.emit("travelToSite", siteId);
  }, []);

  const openCode = useCallback((questId: string) => {
    setTalking(false);
    setLogOpen(false);
    setModelQuestId(null);
    setCaseOpen(false);
    setCodeQuestId(questId);
  }, []);
  const openBoard = useCallback((questId: string) => {
    setTalking(false);
    setLogOpen(false);
    setSheetOpen(false);
    closeStudio();
    setCodeQuestId(null);
    setCaseOpen(false);
    setModelQuestId(questId);
  }, []);
  const openSiteQuest = useCallback(() => {
    if (!siteQuest) return;
    if (siteQuest.pickup) fetchQuest(siteQuest.quest.id);
    if (siteQuest.quest.checkedBy === "window") openCode(siteQuest.quest.id);
    else if (siteQuest.quest.checkedBy === "board")
      openBoard(siteQuest.quest.id);
    else openQuestLog(siteQuest.quest.id);
  }, [siteQuest, openCode, openBoard, openQuestLog, fetchQuest]);
  const readSign = useCallback(() => {
    if (siteQuest?.pickup) openSiteQuest();
    else setSignOpen(true);
  }, [siteQuest, openSiteQuest]);
  useEffect(() => bridge.on("readSign", readSign), [readSign]);
  const openCaseBoard = useCallback(() => {
    setTalking(false);
    setLogOpen(false);
    setCaseOpen(true);
  }, []);
  // The non-technical uke 2 tasks work on observations in the player's own
  // project. Once Brann has handed one over, the game writes the starting
  // documents (existing ones are left alone) and reads them back.
  const archiveSeeded = useRef(false);
  const needsArchive = board.states.some(
    (s) =>
      ["who-is-lying", "case-file"].includes(s.quest.id) &&
      s.status === "active",
  );
  useEffect(() => {
    if (
      !needsArchive ||
      archive === null ||
      archive.length >= ARCHIVE_IDS.length
    )
      return;
    if (archiveSeeded.current) return;
    archiveSeeded.current = true;
    fetch("/api/archive", { method: "POST" })
      .then((r) => (r.ok ? refresh() : undefined))
      .catch(() => {});
  }, [needsArchive, archive, refresh]);

  const bakerySeeded = useRef(false);
  const needsBakery = board.states.some(
    (s) => s.quest.id === "baker-model" && s.status === "active",
  );
  useEffect(() => {
    if (
      !needsBakery ||
      bakeryOrders === null ||
      bakerySeeded.current ||
      SAMPLE_ORDERS.every((sample) =>
        bakeryOrders.some((order) => order._id === sample._id),
      )
    )
      return;
    bakerySeeded.current = true;
    fetch("/api/bakery", { method: "POST" })
      .then((r) => (r.ok ? refresh() : undefined))
      .catch(() => {});
  }, [needsBakery, bakeryOrders, refresh]);

  const apprenticeSeeded = useRef(false);
  const needsApprentice = board.states.some(
    (state) =>
      state.quest.id === "apprentice-mistake" && state.status === "active",
  );
  const apprenticeHammer = items.find((item) => item.id === APPRENTICE_ITEM_ID);
  useEffect(() => {
    if (!needsApprentice || apprenticeHammer || apprenticeSeeded.current)
      return;
    apprenticeSeeded.current = true;
    fetch("/api/apprentice", { method: "POST" })
      .then((response) => (response.ok ? refresh() : undefined))
      .catch(() => {});
  }, [needsApprentice, apprenticeHammer, refresh]);

  const codeState = board.states.find((s) => s.quest.id === codeQuestId);
  const codeOpen = Boolean(codeState);
  const modelState = board.states.find((s) => s.quest.id === modelQuestId);
  const modelOpen = Boolean(modelState);
  const onCodeSolved = useCallback(
    (how: Parameters<typeof solveTask>[1]) => {
      if (codeQuestId) solveTask(codeQuestId, how);
    },
    [codeQuestId, solveTask],
  );
  const onModelSolved = useCallback(
    (how: Parameters<typeof solveTask>[1]) => {
      if (modelQuestId) solveTask(modelQuestId, how);
    },
    [modelQuestId, solveTask],
  );

  const showOpening =
    entryStage === "title" ||
    entryStage === "track" ||
    entryStage === "welcome" ||
    entryStage === "share";
  const sheetShown =
    entryStage === "figure" || (entryStage === "game" && sheetOpen);

  // A finished week gets its summary once, after the last door's celebration;
  // the journal can open it again (weekShown).
  const [weekShown, setWeekShown] = useState<number | null>(null);
  const pendingWeek = finishedWeeks(board).find((week) =>
    weekNeedsSummary(
      progress.weeksSeen?.[week],
      board.states.filter((s) => s.chapter.number === week && !s.quest.bonus)
        .length,
    ),
  );
  const quiet =
    celebrations.length === 0 &&
    codeQuestId === null &&
    modelQuestId === null &&
    !studio.open &&
    !logOpen &&
    !signOpen &&
    !caseOpen &&
    !dialogueOpen &&
    !showOpening;
  const summaryWeek = weekShown ?? (quiet ? pendingWeek : undefined);
  const summary =
    summaryWeek === undefined
      ? null
      : weekSummary(board, summaryWeek, progress);
  const closeSummary = useCallback(() => {
    if (summaryWeek !== undefined && summary)
      markWeekSeen(summaryWeek, summary.doors);
    setWeekShown(null);
  }, [summaryWeek, summary, markWeekSeen]);

  // Keep the world in sync with game state.
  useEffect(() => {
    const hand =
      equipped &&
      equipped.kind === "weapon" &&
      !(equipped.source === "builtin" && !equipped.spriteId)
        ? equipped.sprite
        : null;
    bridge.setWorld({
      weapon: hand,
      figure,
      forgeLit: Boolean(forged),
      forgeLevel,
      npcMarker:
        current?.status === "offered" && !current.pickup
          ? giverOf(current.quest).id
          : null,
      doors: villageDoors,
      goal: nextStep,
      wraithDefeated: combat.defeated,
      frozen:
        dialogueOpen ||
        logOpen ||
        signOpen ||
        caseOpen ||
        codeOpen ||
        modelOpen ||
        showOpening ||
        sheetShown ||
        Boolean(celebration) ||
        Boolean(summary),
    });
  }, [
    equipped,
    forged,
    forgeLevel,
    current?.status,
    villageDoors,
    nextStep,
    combat.defeated,
    dialogueOpen,
    logOpen,
    signOpen,
    caseOpen,
    codeOpen,
    modelOpen,
    showOpening,
    celebration,
    summary,
    sheetShown,
    figure,
  ]);

  const slots = narrow ? 5 : 8;
  const describedWeapon = findPlayerWeapon(items, equippedId);
  const dismissCelebration = useCallback(
    () => setCelebrations((queue) => queue.slice(1)),
    [],
  );

  // Action keys. Movement keys belong to Phaser; these belong to the HUD.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || showOpening || sheetShown)
        return;
      if (celebrations.length > 0 && !codeOpen) return;
      if ((e.target as HTMLElement)?.closest?.(".dev")) return;
      // Typing in the code window: every key is code, except Escape.
      if (codeOpen) {
        if (e.key === "Escape") setCodeQuestId(null);
        return;
      }
      if (modelOpen) {
        if (e.key === "Escape") setModelQuestId(null);
        return;
      }
      if (signOpen) {
        if (e.key === "Escape") setSignOpen(false);
        return;
      }
      if (caseOpen) {
        if (e.key === "Escape") setCaseOpen(false);
        return;
      }
      const onControl = (e.target as HTMLElement)?.closest?.(
        "button, a, input, textarea",
      );
      if (logOpen) {
        if (["Escape", "j", "J", "m", "M"].includes(e.key)) setLogOpen(false);
        return;
      }
      if (e.key === "j" || e.key === "J") {
        openLog();
        return;
      }
      if (e.key === "m" || e.key === "M") {
        openMap();
        return;
      }
      if ((e.key === "c" || e.key === "C") && !dialogueOpen) {
        openSheet("look");
        return;
      }
      if ((e.key === "i" || e.key === "I") && !dialogueOpen) {
        openSheet("bag");
        return;
      }
      if (e.key === "Escape" && dialogueOpen) {
        setTalking(false);
        return;
      }
      if ((e.key === "e" || e.key === "E") && talkTo) {
        if (!dialogueOpen) openDialogue();
        return;
      }
      if ((e.key === "e" || e.key === "E") && siteQuest) {
        e.preventDefault();
        openSiteQuest();
        return;
      }
      if ((e.key === "e" || e.key === "E") && zone === "bakerySign") {
        e.preventDefault();
        readSign();
        return;
      }
      if (
        (e.key === "e" || e.key === "E") &&
        zone === "noticeboard" &&
        (progress.briefed["case-file"] || progress.completed["case-file"])
      ) {
        e.preventDefault();
        openCaseBoard();
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
  }, [
    zone,
    talkTo,
    siteQuest,
    dialogueOpen,
    logOpen,
    signOpen,
    caseOpen,
    codeOpen,
    modelOpen,
    showOpening,
    sheetShown,
    celebrations.length,
    openDialogue,
    openLog,
    openMap,
    openSheet,
    openSiteQuest,
    readSign,
    openCaseBoard,
    progress.briefed,
    progress.completed,
    combat,
    items,
    slots,
    handleEquip,
  ]);

  return (
    <div className="game-shell">
      <div className="game-main" onPointerDown={focusGame}>
        <div className="stage">
          <PhaserGame />
          <div className="stage-vignette" aria-hidden />
        </div>
        <div className={`hud${showOpening ? " is-hidden" : ""}`}>
          <div className="hud-tl">
            <h1 className="crest">
              <span className="crest-title">Julekalenderen</span>
              <span className="crest-place">Sanity · desember 2026</span>
            </h1>
            <QuestTracker
              key={narrow ? "compact" : "full"}
              board={board}
              metBrann={progress.metBlacksmith}
              compact={narrow}
              onOpenLog={openLog}
              onOpenMap={openMap}
              onOpenQuest={openQuestLog}
              onOpenCode={openCode}
              onOpenBoard={openBoard}
              onOpenStudio={openStudio}
              onTravel={travelToSite}
              finished={
                celebration && studio.open
                  ? { door: celebration.door, title: celebration.title }
                  : null
              }
              onShowCelebration={closeStudio}
            />
          </div>

          <div className="hud-tr">
            <button
              type="button"
              className="studio-link"
              onClick={() => openSheet("look")}
              aria-label="Figuren din (C)"
            >
              Figur
            </button>
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
            {zone === "forge" && progress.briefed["weapon-description"] && (
              <ForgeDescription weapon={describedWeapon} />
            )}
            {zone === "forge" && progress.briefed["apprentice-mistake"] && (
              <ForgeHammer hammer={apprenticeHammer} />
            )}
            {dialogueOpen && (
              <ForgeDialogue
                key={`${talkTo?.id}:${currentId ?? "none"}`}
                npc={talkTo!.id}
                board={board}
                forged={forged}
                sanityConfigured={configured}
                fetchFailed={fetchFailed}
                unclaimed={unclaimed}
                refreshing={loading}
                checked={checkedForge}
                onCheck={checkForge}
                onTravelToSite={travelToSite}
                onOpenCode={openCode}
                onOpenBoard={openBoard}
                onClose={() => setTalking(false)}
              />
            )}
            {talkTo && !dialogueOpen && (
              <button type="button" className="prompt" onClick={openDialogue}>
                <kbd>E</kbd> Snakk med {talkTo.name}
              </button>
            )}
            {siteQuest && !logOpen && (
              <button type="button" className="prompt" onClick={openSiteQuest}>
                <kbd>E</kbd>{" "}
                {siteQuest.pickup
                  ? siteQuest.quest.bonus
                    ? siteQuest.quest.villageSite === "bakerySign"
                      ? "Les bodskiltet"
                      : "Les oppslaget"
                    : `Hent luke ${siteQuest.quest.door}`
                  : siteQuest.quest.checkedBy === "window"
                    ? "Åpne kodevinduet"
                    : siteQuest.quest.checkedBy === "board"
                      ? "Åpne modellbrettet"
                      : "Åpne luka her"}
              </button>
            )}
            {zone === "bakerySign" && !siteQuest && !logOpen && !signOpen && (
              <button type="button" className="prompt" onClick={readSign}>
                <kbd>E</kbd> Les bodskiltet
              </button>
            )}
            {zone === "noticeboard" &&
              !siteQuest &&
              !logOpen &&
              !caseOpen &&
              (progress.briefed["case-file"] ||
                progress.completed["case-file"]) && (
                <button
                  type="button"
                  className="prompt"
                  onClick={openCaseBoard}
                >
                  <kbd>E</kbd> Les saksmappa
                </button>
              )}
            {!hasMoved &&
              !progress.metBlacksmith &&
              !showOpening &&
              zone !== "forge" && (
                <p className="prompt prompt--hint">
                  Gå med <kbd>WASD</kbd> eller piltastene. Smia er rett nord.
                </p>
              )}
            {zone === "wraith" && (
              <EncounterPanel combat={combat} weapon={equipped} />
            )}

            <Hotbar
              plate={
                <PlayerPlate
                  figure={figure ?? normalizeFigure(undefined)}
                  name={progress.name ?? ""}
                  level={forgeLevel}
                  compact={narrow}
                  onOpen={() => openSheet("look")}
                />
              }
              items={items}
              equippedId={equippedId}
              onEquip={handleEquip}
              onOpenBag={() => openSheet("bag")}
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
              <kbd>J</kbd> journal
            </span>
            <span>
              <kbd>M</kbd> kart
            </span>
            <span>
              <kbd>C</kbd> figur
            </span>
            <span>
              <kbd>I</kbd> ting
            </span>
          </p>
        </div>
        {!showOpening && logOpen && (
          <QuestLog
            key={progress.track}
            board={board}
            initialTab={logInitialTab}
            initialQuestId={logInitialQuestId}
            forgeLevel={forgeLevel}
            hintsShown={progress.hints}
            onRevealHint={revealHint}
            onOpenCode={openCode}
            onOpenBoard={openBoard}
            solvedTasks={progress.solved}
            completedAt={progress.completed}
            onTravelToSite={travelToSite}
            onClose={() => setLogOpen(false)}
            track={progress.track}
            onTrack={setTrack}
            onReset={() => {
              setLogOpen(false);
              startNewGame();
            }}
            onShowWeek={(week) => {
              setLogOpen(false);
              setWeekShown(week);
            }}
          />
        )}
        {!showOpening && signOpen && (
          <BakerySign sign={bakerySign} onClose={() => setSignOpen(false)} />
        )}
        {!showOpening && caseOpen && (
          <ArchiveNoticeboard
            cases={archiveCases}
            onClose={() => setCaseOpen(false)}
          />
        )}
        {!showOpening && codeState && (
          <CodeWindow
            key={codeState.quest.id}
            state={codeState}
            solved={Boolean(progress.solved[codeState.quest.id])}
            onSolved={onCodeSolved}
            hintsShown={progress.hints[codeState.quest.id] ?? 0}
            onRevealHint={() => revealHint(codeState.quest.id)}
            onClose={() => setCodeQuestId(null)}
          />
        )}
        {!showOpening &&
          modelState &&
          !sheetShown &&
          !logOpen &&
          !codeOpen &&
          !signOpen &&
          !caseOpen &&
          !studio.open && (
            <ModelBoard
              key={modelState.quest.id}
              state={modelState}
              solved={Boolean(progress.solved[modelState.quest.id])}
              onSolved={onModelSolved}
              hintsShown={progress.hints[modelState.quest.id] ?? 0}
              onRevealHint={() => revealHint(modelState.quest.id)}
              onClose={() => setModelQuestId(null)}
            />
          )}
        {showOpening && (
          <Opening
            stage={entryStage}
            hasProgress={progress.trackChosen}
            track={progress.track}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo"}
            sanityConfigured={configured}
            onStart={begin}
            onContinue={() =>
              setEntryStage(
                !progress.introSeen && !progress.figure
                  ? progress.trackChosen
                    ? "welcome"
                    : "track"
                  : !progress.sharePrompted
                    ? "share"
                    : "game",
              )
            }
            onChooseTrack={chooseTrack}
            onWelcomeDone={() => setEntryStage("figure")}
            onChooseShare={chooseShare}
            onNewGame={startNewGame}
          />
        )}
        {sheetShown && (
          <CharacterSheet
            initial={normalizeFigure(progress.figure)}
            initialName={progress.name ?? ""}
            owned={owned}
            firstTime={entryStage === "figure"}
            initialTab={progress.figure ? sheetTab : "look"}
            initialShareProfile={progress.shareProfile}
            seenGear={progress.seenGear}
            items={items}
            equippedId={equippedId}
            onEquip={handleEquip}
            level={forgeLevel}
            onDone={saveFigure}
            onClose={() => setSheetOpen(false)}
          />
        )}
        {!showOpening &&
          dev &&
          codeQuestId === null &&
          modelQuestId === null &&
          !sheetShown && (
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
              onComplete={completeQuest}
              track={progress.track}
              onTrack={setTrack}
              onReset={() => {
                reset();
                setDevChecks({});
              }}
              weaponSprite={
                equipped?.kind === "weapon" ? equipped.sprite : null
              }
            />
          )}
      </div>

      {!showOpening &&
        celebration &&
        codeQuestId === null &&
        modelQuestId === null &&
        !caseOpen &&
        !studio.open && (
          <QuestCelebration
            key={`${celebration.door}:${celebration.title}`}
            {...celebration}
            onClose={dismissCelebration}
            onOpenLog={() => {
              dismissCelebration();
              openLog();
            }}
            onReadPage={() => {
              dismissCelebration();
              openQuestLog(celebration.questId);
            }}
          />
        )}

      {!showOpening && summary && !celebration && (
        <WeekComplete
          key={summary.number}
          summary={summary}
          forgeLevel={forgeLevel}
          onClose={closeSummary}
          onOpenBook={() => {
            closeSummary();
            setTalking(false);
            setLogInitialTab("book");
            setLogInitialQuestId(undefined);
            setLogOpen(true);
          }}
        />
      )}

      {!showOpening && studio.loaded && (
        <StudioPane width={studio.width} open={studio.open} />
      )}
    </div>
  );
}
