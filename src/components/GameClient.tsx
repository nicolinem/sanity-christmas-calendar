"use client";

import {
  FIGURE_OPTIONS,
  normalizeFigure,
  type FigureChoice,
} from "@/game/figure";
import { communityEndpoint } from "@/game/communityEndpoint";
import { useOrderFunction } from "./hud/useOrderFunction";
import { MAX_HINTS } from "@/game/community";
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
import {
  PLAYER_ID,
  PROGRESS_PROJECT,
  updateProgress,
} from "@/game/quests/progress";
import {
  ARCHIVE_IDS,
  type OwnArchiveDoc,
  type OwnCase,
  type OwnObservation,
} from "@/game/archive";
import { SAMPLE_ORDERS } from "@/game/bakery";
import { APPRENTICE_ITEM_ID } from "@/game/apprentice";
import BakerySign from "./hud/BakerySign";
import CaveHud from "./hud/CaveHud";
import CaveLeaveConfirm from "./hud/CaveLeaveConfirm";
import { ropeFloors } from "@/game/cave/floors";
import { xpFor } from "@/game/cave/combat";
import { addToTrip, bankTrip, dropTrip, secureTrip } from "@/game/cave/trip";
import { useWindowActive } from "./hud/useWindowActive";
import ArchiveNoticeboard from "./hud/ArchiveNoticeboard";
import ForgeDescription from "./hud/ForgeDescription";
import ForgeHammer from "./hud/ForgeHammer";
import { giverOf } from "@/game/quests/label";
import {
  NPCS,
  npcAtSite,
  shouldShowQuestNpc,
  type NpcId,
  type QuestSiteId,
} from "@/game/village";
import { useLiveRefresh } from "./hud/useLive";
import { useSideQuests } from "./hud/useSideQuests";
import SideQuestDialogue from "./hud/SideQuestDialogue";
import { busyGivers, sideMarkers } from "@/game/sideQuests/engine";
import { FEATURES } from "@/game/features";
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
import SetupPanel, { setupProgress } from "./hud/SetupPanel";
import { setupUrgent } from "./hud/setupSteps";
import { useSetup } from "./hud/setup";

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

function useArea() {
  return useSyncExternalStore(
    (cb) => bridge.on("world", cb),
    () => bridge.world.area,
    () => "bygda" as const,
  );
}

function useCaveDepth() {
  return useSyncExternalStore(
    (cb) => bridge.on("world", cb),
    () => bridge.world.cave?.depth ?? null,
    () => null,
  );
}

function useCaveHp() {
  const hp = useSyncExternalStore(
    (cb) => bridge.on("world", cb),
    () => bridge.world.cave?.hp ?? null,
    () => null,
  );
  const max = useSyncExternalStore(
    (cb) => bridge.on("world", cb),
    () => bridge.world.cave?.maxHp ?? null,
    () => null,
  );
  return hp === null || max === null ? null : { hp, max };
}

function useZone() {
  return useSyncExternalStore<Zone>(
    (cb) => bridge.on("zone", cb),
    () => bridge.zone,
    () => null,
  );
}

const SETUP_SEEN = "winter-quest:setup-seen";

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
  // Observations the player wrote themselves (a side quest asks for one).
  const [ownObservations, setOwnObservations] = useState<
    OwnObservation[] | null
  >(null);
  const [bakeryOrders, setBakeryOrders] = useState<
    import("@/game/bakery").BakeryOrder[] | null
  >(null);
  const [bakerySign, setBakerySign] = useState<
    import("@/game/bakery").BakerySign | null
  >(null);
  const [communityReady, setCommunityReady] = useState(false);
  const [equippedId, setEquippedId] = useState<string | null>(null);
  // While true, the game keeps the strongest weapon equipped as content loads.
  // A manual click turns it off so the player's choice sticks.
  const [autoEquip, setAutoEquip] = useState(true);

  const zone = useZone();
  const area = useArea();
  const caveDepth = useCaveDepth();
  const caveHp = useCaveHp();
  const narrow = useNarrow();
  const [talking, setTalking] = useState(false);
  // «Gå hjem?» asked before leaving the cave for another place.
  const [confirmTravel, setConfirmTravel] = useState<
    QuestSiteId | "wraith" | null
  >(null);
  // A side quest conversation: who, and which quest (kept through delivery).
  const [sideTalk, setSideTalk] = useState<{
    npc: NpcId;
    questId: string;
  } | null>(null);
  // Walking off ends a side quest conversation.
  useEffect(() => bridge.on("zone", () => setSideTalk(null)), []);
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
    xp,
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
        playerId: PLAYER_ID,
        questIds: [],
        character: { visible: false },
      }),
    }).catch(() => {});
  }, [communityReady, configured]);
  const saveFigure = useCallback(
    (
      choice: FigureChoice,
      name: string,
      shareProfile: boolean,
      shareHints: boolean,
    ) => {
      if (progress.shareProfile && !shareProfile) withdrawCommunityProfile();
      updateProgress(PROGRESS_PROJECT, (p) => ({
        ...p,
        figure: { ...choice },
        name: name || undefined,
        shareProfile,
        shareHints,
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
  const setup = useSetup();
  const setupLeft = setupProgress(setup);
  const [setupOpen, setSetupOpen] = useState(false);
  // Opens by itself once per visit when it matters: no project, the claim
  // deadline is under a day away, or the project is gone.
  const [setupDismissed, setSetupDismissed] = useState(() => {
    try {
      return window.sessionStorage.getItem(SETUP_SEEN) === "1";
    } catch {
      return false;
    }
  });
  const closeSetup = useCallback(() => {
    setSetupOpen(false);
    setSetupDismissed(true);
    try {
      window.sessionStorage.setItem(SETUP_SEEN, "1");
    } catch {
      // Then it opens again next visit too.
    }
  }, []);
  const studioFocused = useStudioFocused() && studio.open;
  // Dev panel overrides for checks: pretend a quest passes or fails.
  const [devChecks, setDevChecks] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [res, own, bakery] = await Promise.all([
        fetch("/api/items", { cache: "no-store" }),
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
      setOwnObservations(own?.error ? null : (own?.own ?? null));
      setBakeryOrders(bakery?.error ? null : (bakery?.orders ?? null));
      setBakerySign(bakery?.error ? null : (bakery?.sign ?? null));
      const data: {
        configured: boolean;
        unclaimed?: boolean;
        unpublishedDrafts?: number;
        items: SanityItem[];
        error?: string;
      } = await res.json();
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

  // Publish in the Studio and the game hears about it straight away. Open
  // panels step aside so the result shows (see clearForPublish below). The
  // game's own writes (starting documents) don't count.
  const ownWriteUntil = useRef(0);
  const markOwnWrite = () => {
    ownWriteUntil.current = Date.now() + 8000;
  };
  const onPublishRef = useRef<() => void>(() => {});
  const onPublish = useCallback(() => {
    if (Date.now() > ownWriteUntil.current) onPublishRef.current();
  }, []);
  const liveMode = useLiveRefresh(refresh, configured === true, onPublish);

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
        playerId: PLAYER_ID,
        questIds: Object.keys(progress.completed),
        // Hints used per finished luke, or null to take them back.
        hints: progress.shareHints
          ? Object.fromEntries(
              Object.keys(progress.completed).map((id) => [
                id,
                Math.min(progress.hints[id] ?? 0, MAX_HINTS),
              ]),
            )
          : null,
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
    progress.shareHints,
    progress.hints,
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
    // A potion is not equipped: in the cave it is drunk, in the village nothing.
    if (item.kind === "potion") {
      if (bridge.world.area === "grotta" && item.source === "sanity")
        bridge.emit("drink", item.id);
      return;
    }
    setAutoEquip(false);
    setEquippedId(item.id);
  }, []);

  const forged = findForgedWeapon(items);
  const combat = useCombat(equipped);
  const checks = useMemo(() => {
    const merged: Record<string, CodeCheck> = {};
    for (const [id, done] of Object.entries(devChecks))
      merged[id] = {
        done,
        message: done
          ? undefined
          : "Utviklerpanelet later som kriteriene ikke er oppfylt.",
      };
    return merged;
  }, [devChecks]);
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
  const side = useSideQuests(
    {
      items,
      codeChecks: checks,
      sanityConfigured: configured,
      unpublishedDrafts,
      archive,
      archiveCases,
      archiveCaseDrafts,
      bakeryOrders,
      bakerySign,
      ownObservations,
      progress,
    },
    dev,
  );
  const current = board.current;
  const currentId = current?.quest.id;
  const villageDoors = useMemo(() => weekDoors(board), [board]);
  const nextStep = useMemo(
    () => nextStepPoint(board, villageDoors),
    [board, villageDoors],
  );
  // Luke 11: once solved, publishing an order in Studio runs the player's
  // function, and the sign shows what it wrote.
  const functionSign = useOrderFunction(
    Boolean(progress.solved["baker-function"]),
    bakeryOrders,
    bakerySign,
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

  // Who the knight is standing by, if anyone. Walking away ends the talk.
  // When a luke waits at the same place, E is for the luke, unless the luke
  // in hand asks for this person.
  const placeZone =
    zone && zone !== "wraith" && !zone.startsWith("side:")
      ? (zone as QuestSiteId)
      : null;
  const npcHere = npcAtSite(placeZone);
  const talkTo =
    npcHere &&
    siteQuest &&
    npcHere.id !==
      (board.current ? giverOf(board.current.quest).id : "brann") &&
    !shouldShowQuestNpc(board.current, npcHere.id)
      ? undefined
      : npcHere;
  const dialogueOpen = talking && Boolean(talkTo);
  const openDialogue = useCallback(() => setTalking(true), []);

  // Side quests. A person the lukes need right now (the luke's giver, or the
  // person it asks about) talks luke first, with «Noe annet?» at the end;
  // anyone else goes straight to the side quest.
  const lukeNeedsHere =
    Boolean(talkTo) &&
    ((Boolean(current) && giverOf(current!.quest).id === talkTo!.id) ||
      shouldShowQuestNpc(current, talkTo!.id));
  const sideHere = talkTo ? side.forGiver(talkTo.id) : undefined;
  const sideState =
    sideTalk && talkTo?.id === sideTalk.npc
      ? side.states.find((s) => s.quest.id === sideTalk.questId)
      : undefined;
  const sideOpen = Boolean(sideState);
  const talkOpen = dialogueOpen || sideOpen;
  const openSide = useCallback((npc: NpcId, questId: string) => {
    setTalking(false);
    setSideTalk({ npc, questId });
  }, []);
  const openTalk = useCallback(() => {
    if (!talkTo) return;
    if (sideHere && !lukeNeedsHere) openSide(talkTo.id, sideHere.quest.id);
    else openDialogue();
  }, [talkTo, sideHere, lukeNeedsHere, openSide, openDialogue]);
  // The tracker is for the next luke. It mentions a side quest only when
  // something is ready to hand in, or when no luke is waiting at all.
  const sideReady = side.states.find((s) => s.status === "ready");
  const sideNew = !current
    ? side.states.find((s) => s.status === "available")
    : undefined;
  const sideNote = sideReady ?? sideNew;
  const sideNoteGiver = sideNote
    ? NPCS[sideNote.quest.giver as NpcId]
    : undefined;
  const trackerSide =
    !narrow && sideNote && sideNoteGiver
      ? {
          text: sideReady
            ? `Klart å levere: ${sideReady.quest.title}.`
            : `Ingen luke venter nå. ${sideNoteGiver.name} har noe til deg.`,
          label: `Gå til ${sideNoteGiver.name}`,
          onClick: () => travelToSite(sideNoteGiver.site),
        }
      : null;

  // A spot on a side quest trail, when it's the next one to find.
  const spotHere = zone?.startsWith("side:")
    ? side.atSpot(zone.slice("side:".length))
    : undefined;
  const { advance: advanceSide } = side;
  const findSpot = useCallback(() => {
    if (!spotHere) return;
    const { state } = spotHere;
    const step = state.quest.steps[state.step];
    advanceSide(state);
    const lastStep = state.step === state.quest.steps.length - 1;
    const giver = NPCS[state.quest.giver as NpcId];
    pushToast({
      title: step.label,
      body: lastStep && giver ? `Gå tilbake til ${giver.name}.` : undefined,
      tone: "lesson",
    });
  }, [spotHere, advanceSide]);

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

  // «Gå til» from inside the cave: leave first, travel once the village is back.
  const pendingTravel = useRef<QuestSiteId | "wraith" | null>(null);
  const travelToSite = useCallback((siteId: QuestSiteId | "wraith") => {
    setTalking(false);
    setLogOpen(false);
    if (bridge.world.area === "grotta") {
      setConfirmTravel(siteId);
      return;
    }
    bridge.emit("travelToSite", siteId);
  }, []);

  // The cave tells us which floor we are on; the deepest one is kept.
  useEffect(
    () =>
      bridge.on("reachedFloor", (depth) => {
        updateProgress(PROGRESS_PROJECT, (p) =>
          depth > p.deepest || !p.inCave
            ? { ...p, deepest: Math.max(depth, p.deepest), inCave: true }
            : p,
        );
      }),
    [],
  );
  useEffect(
    () =>
      bridge.on("enemyDefeated", ({ enemy, depth }) =>
        updateProgress(PROGRESS_PROJECT, (p) => ({
          ...p,
          xp: p.xp + xpFor(enemy, depth),
        })),
      ),
    [],
  );
  useEffect(
    () =>
      bridge.on("found", ({ item, count }) =>
        updateProgress(PROGRESS_PROJECT, (p) => addToTrip(p, item, count)),
      ),
    [],
  );
  useEffect(
    () =>
      bridge.on("fainted", () => {
        updateProgress(PROGRESS_PROJECT, dropTrip);
        pushToast({
          title: "Du besvimte",
          body: "Du våknet hos Brann. Det du fant på turen, ble liggende igjen.",
          tone: "lesson",
        });
      }),
    [],
  );
  useEffect(
    () =>
      bridge.on("bossDefeated", (id) =>
        updateProgress(PROGRESS_PROJECT, (p) => ({
          ...p,
          bosses: { ...p.bosses, [id]: true },
        })),
      ),
    [],
  );
  useEffect(
    () =>
      bridge.on("chestOpened", (id) => {
        updateProgress(PROGRESS_PROJECT, (p) => ({
          ...p,
          chests: { ...p.chests, [id]: true },
        }));
        // Only the floor-5 chest holds the armour.
        if (id === "cave-5")
          pushToast({
            title: "Rustning",
            body: "Du fant den i kista på etasje 5.",
            tone: "lesson",
          });
      }),
    [],
  );
  // A resting place: the trip's finds so far are safe.
  useEffect(
    () =>
      bridge.on("restReached", () =>
        updateProgress(PROGRESS_PROJECT, secureTrip),
      ),
    [],
  );
  // A trip left open by a closed tab: its finds are banked once on mount.
  useEffect(() => {
    updateProgress(PROGRESS_PROJECT, (p) => (p.inCave ? bankTrip(p) : p));
  }, []);
  useEffect(
    () =>
      bridge.on("leftCave", () => {
        updateProgress(PROGRESS_PROJECT, bankTrip);
        const target = pendingTravel.current;
        pendingTravel.current = null;
        if (target) bridge.emit("travelToSite", target);
      }),
    [],
  );
  const warnedCave = useRef(false);
  const enterCave = useCallback(
    (depth: number, quiet = false) => {
      if (forgeLevel < 2 && !quiet && !warnedCave.current) {
        warnedCave.current = true;
        pushToast({
          title: "Brann",
          body: "Pass deg, det er dyr der nede. Jeg ville ventet til du er nivå 2.",
          tone: "lesson",
        });
      }
      bridge.emit("enterCave", depth);
    },
    [forgeLevel],
  );
  const confirmLeave = useCallback(() => {
    pendingTravel.current = confirmTravel;
    setConfirmTravel(null);
    bridge.emit("leaveCave", undefined);
  }, [confirmTravel]);
  const attackInCave = useCallback(
    () => bridge.emit("caveAttack", undefined),
    [],
  );
  const found = Object.values(progress.trip).reduce((sum, n) => sum + n, 0);
  useEffect(
    () =>
      bridge.on("drinkResult", (result) => {
        const title = {
          again: "Den har du alt drukket på denne turen.",
          limit: "Tre drikker er nok for én tur.",
          full: "Du har fullt liv.",
          ok: null,
        }[result];
        if (title) pushToast({ title, tone: "lesson" });
      }),
    [],
  );
  const [caveGod, setCaveGod] = useState(false);
  const descend = useCallback(() => bridge.emit("descend", undefined), []);
  const openCache = useCallback(
    () => bridge.emit("cacheOpened", undefined),
    [],
  );
  const openChest = useCallback(() => bridge.emit("chestOpen", undefined), []);
  const leaveCave = useCallback(() => bridge.emit("leaveCave", undefined), []);

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
  const needsArchive =
    // «Det Kari så» needs Kari and Gjerdet in the project, on both tracks.
    side.states.some(
      (s) => s.quest.id === "kari-saw" && s.status === "active",
    ) ||
    board.states.some(
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
    markOwnWrite();
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
    markOwnWrite();
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
    markOwnWrite();
    fetch("/api/apprentice", { method: "POST" })
      .then((response) => (response.ok ? refresh() : undefined))
      .catch(() => {});
  }, [needsApprentice, apprenticeHammer, refresh]);

  // A publish in Studio closes what's open in the game, so the weapon, the
  // sign or the celebration can be seen, and offers the way back.
  const [reopen, setReopen] = useState<{
    label: string;
    open: () => void;
  } | null>(null);
  useEffect(() => {
    onPublishRef.current = () => {
      const back = codeQuestId
        ? { label: "kodevinduet", open: () => openCode(codeQuestId) }
        : modelQuestId
          ? { label: "modellbrettet", open: () => openBoard(modelQuestId) }
          : logOpen
            ? { label: "journalen", open: openLog }
            : caseOpen
              ? { label: "saksmappa", open: openCaseBoard }
              : sheetOpen
                ? { label: "figuren", open: () => openSheet(sheetTab) }
                : signOpen
                  ? { label: "bodskiltet", open: () => setSignOpen(true) }
                  : talking
                    ? { label: "samtalen", open: () => setTalking(true) }
                    : sideTalk
                      ? {
                          label: "samtalen",
                          open: () => setSideTalk(sideTalk),
                        }
                      : null;
      if (!back) return;
      setCodeQuestId(null);
      setModelQuestId(null);
      setLogOpen(false);
      setCaseOpen(false);
      setSheetOpen(false);
      setSignOpen(false);
      setTalking(false);
      setSideTalk(null);
      setReopen(back);
    };
  });
  useEffect(() => {
    if (!reopen) return;
    const t = window.setTimeout(() => setReopen(null), 15000);
    return () => window.clearTimeout(t);
  }, [reopen]);
  // Opening something else answers the offer.
  const anyPanel =
    logOpen ||
    Boolean(codeQuestId) ||
    Boolean(modelQuestId) ||
    caseOpen ||
    sheetOpen ||
    signOpen ||
    talking;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (anyPanel) setReopen(null);
  }, [anyPanel]);

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

  // What the cave needs to fight: the weapon, and whether the player is away.
  const windowActive = useWindowActive();
  const attack = useMemo(
    () =>
      equipped && isUsableWeapon(equipped)
        ? {
            damage: equipped.power?.damage ?? 0,
            element:
              equipped.magic.kind === "element" ? equipped.magic.element : null,
          }
        : null,
    [equipped],
  );
  useEffect(() => {
    bridge.setWorld({
      attack,
      away: studio.open || !windowActive,
      caveGod: dev && caveGod,
    });
  }, [attack, studio.open, windowActive, dev, caveGod]);
  // Bosses beaten and chests opened, for the cave to leave out or draw open.
  const defeatedBosses = useMemo(
    () => Object.keys(progress.bosses),
    [progress.bosses],
  );
  const openedChests = useMemo(
    () => Object.keys(progress.chests),
    [progress.chests],
  );
  useEffect(() => {
    bridge.setWorld({ defeatedBosses, openedChests });
  }, [defeatedBosses, openedChests]);

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
      sideMarkers: sideMarkers(side.states, busyGivers(current)),
      sideSpots: side.spots.map(({ id, x, y, prop }) => ({ id, x, y, prop })),
      frozen:
        dialogueOpen ||
        sideOpen ||
        logOpen ||
        signOpen ||
        caseOpen ||
        codeOpen ||
        modelOpen ||
        showOpening ||
        sheetShown ||
        Boolean(celebration) ||
        Boolean(summary) ||
        confirmTravel !== null,
    });
  }, [
    equipped,
    forged,
    forgeLevel,
    current,
    villageDoors,
    nextStep,
    combat.defeated,
    side.states,
    side.spots,
    dialogueOpen,
    sideOpen,
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
    confirmTravel,
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
      if (confirmTravel) {
        if (e.key === "Escape") setConfirmTravel(null);
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
      if ((e.key === "c" || e.key === "C") && !talkOpen) {
        openSheet("look");
        return;
      }
      if ((e.key === "i" || e.key === "I") && !talkOpen) {
        openSheet("bag");
        return;
      }
      if (e.key === "Escape" && talkOpen) {
        setTalking(false);
        setSideTalk(null);
        return;
      }
      if ((e.key === "e" || e.key === "E") && talkTo) {
        if (!talkOpen) openTalk();
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
      if ((e.key === "e" || e.key === "E") && spotHere) {
        e.preventDefault();
        findSpot();
        return;
      }
      if ((e.key === "e" || e.key === "E") && zone === "cave") {
        e.preventDefault();
        enterCave(1);
        return;
      }
      if ((e.key === "e" || e.key === "E") && zone === "caveStairs") {
        e.preventDefault();
        descend();
        return;
      }
      if ((e.key === "e" || e.key === "E") && zone === "caveCache") {
        e.preventDefault();
        openCache();
        return;
      }
      if ((e.key === "e" || e.key === "E") && zone === "caveChest") {
        e.preventDefault();
        openChest();
        return;
      }
      if (e.key === " " && zone === "wraith" && !onControl) {
        e.preventDefault();
        combat.attack();
        return;
      }
      if (
        e.key === " " &&
        area === "grotta" &&
        !(e.target as HTMLElement)?.closest?.("input, textarea")
      ) {
        // Always swallow Space here so a focused belt button is not
        // activated again on keyup. Other buttons and links keep their own Space.
        const target = (e.target as HTMLElement)?.closest?.("button, a");
        if (target && !target.closest(".slot")) return;
        e.preventDefault();
        bridge.emit("caveAttack", undefined);
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= slots && !talkOpen) {
        const item = items[n - 1];
        if (item?.kind === "weapon" || item?.kind === "potion")
          handleEquip(item);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    zone,
    area,
    confirmTravel,
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
    openTalk,
    talkOpen,
    spotHere,
    findSpot,
    openLog,
    openMap,
    openSheet,
    openSiteQuest,
    readSign,
    openCaseBoard,
    progress.briefed,
    progress.completed,
    enterCave,
    descend,
    openCache,
    openChest,
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
              key={narrow || area === "grotta" ? "compact" : "full"}
              board={board}
              metBrann={progress.metBlacksmith}
              compact={narrow || area === "grotta"}
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
              side={trackerSide}
            />
          </div>

          <div className="hud-tr">
            {setupLeft && (
              <button
                type="button"
                className={`studio-link${setupLeft.done < setupLeft.total ? " is-todo" : ""}`}
                onClick={() => setSetupOpen(true)}
              >
                Oppsett
                {setupLeft.done < setupLeft.total &&
                  ` ${setupLeft.done}/${setupLeft.total}`}
              </button>
            )}
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

          {area === "grotta" && caveDepth !== null && (
            <div className="hud-tc">
              <CaveHud
                depth={caveDepth}
                found={found}
                onLeave={leaveCave}
                waiting={studio.open}
              />
            </div>
          )}

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
                onTravelToSite={travelToSite}
                onOpenCode={openCode}
                onOpenBoard={openBoard}
                onClose={() => setTalking(false)}
                onOther={
                  sideHere && talkTo
                    ? () => openSide(talkTo.id, sideHere.quest.id)
                    : undefined
                }
              />
            )}
            {sideState && sideTalk && (
              <SideQuestDialogue
                key={sideState.quest.id}
                npc={NPCS[sideTalk.npc]}
                state={sideState}
                onAccept={() => side.accept(sideState.quest.id)}
                onDeliver={() => side.deliver(sideState)}
                onClose={() => setSideTalk(null)}
              />
            )}
            {reopen && (
              <button
                type="button"
                className="prompt prompt--back"
                onClick={() => {
                  reopen.open();
                  setReopen(null);
                }}
              >
                ↩ Tilbake til {reopen.label}
              </button>
            )}
            {talkTo && !talkOpen && (
              <button type="button" className="prompt" onClick={openTalk}>
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
            {spotHere && !logOpen && (
              <button type="button" className="prompt" onClick={findSpot}>
                <kbd>E</kbd> {spotHere.spot.prompt}
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
            {zone === "cave" && !logOpen && (
              <>
                <button
                  type="button"
                  className="prompt"
                  onClick={() => enterCave(1)}
                >
                  <kbd>E</kbd> Gå inn i grotta
                </button>
                {ropeFloors(progress.deepest).map((floor) => (
                  <button
                    key={floor}
                    type="button"
                    className="prompt"
                    onClick={() => enterCave(floor)}
                  >
                    Tau ned til etasje {floor}
                  </button>
                ))}
              </>
            )}
            {zone === "caveStairs" && !logOpen && (
              <button type="button" className="prompt" onClick={descend}>
                <kbd>E</kbd> Gå ned trappa
              </button>
            )}
            {(zone === "caveCache" || zone === "caveChest") && !logOpen && (
              <button
                type="button"
                className="prompt"
                onClick={zone === "caveChest" ? openChest : openCache}
              >
                <kbd>E</kbd> Åpne kista
              </button>
            )}
            {!hasMoved &&
              area !== "grotta" &&
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

            {area === "grotta" && caveDepth !== null && (
              <div className="cave-hud-belt">
                <CaveHud
                  depth={caveDepth}
                  found={found}
                  onLeave={leaveCave}
                  onAttack={attackInCave}
                  waiting={studio.open}
                />
              </div>
            )}
            <Hotbar
              plate={
                <PlayerPlate
                  figure={figure ?? normalizeFigure(undefined)}
                  name={progress.name ?? ""}
                  level={forgeLevel}
                  xp={xp}
                  compact={narrow}
                  hearts={area === "grotta" && caveHp ? caveHp : undefined}
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
              drinkable={area === "grotta"}
            />
          </div>

          <Toasts />

          {studioFocused && area !== "grotta" && (
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
            sideQuests={side.states}
          />
        )}
        {!showOpening && signOpen && (
          <BakerySign
            sign={functionSign.sign}
            byFunction={functionSign.byFunction}
            onClose={() => setSignOpen(false)}
          />
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
        {confirmTravel && (
          <CaveLeaveConfirm
            onLeave={confirmLeave}
            onStay={() => setConfirmTravel(null)}
          />
        )}
        {showOpening && (
          <Opening
            stage={entryStage}
            hasProgress={progress.trackChosen}
            track={progress.track}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo"}
            sanityConfigured={configured}
            problem={
              setup.status?.expired
                ? "Prosjektet er slettet: se Oppsett i spillet"
                : setup.status?.read && setup.status.read !== "ok"
                  ? "Får ikke lest prosjektet: se Oppsett i spillet"
                  : null
            }
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
            initialShareHints={progress.shareHints}
            seenGear={progress.seenGear}
            items={items}
            equippedId={equippedId}
            onEquip={handleEquip}
            level={forgeLevel}
            inventory={progress.inventory}
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
              codeChecks={checks}
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
              cave={
                FEATURES.cave
                  ? {
                      god: caveGod,
                      inCave: area === "grotta",
                      onGod: setCaveGod,
                      onGoto: (depth) => enterCave(depth, true),
                      onReset: () =>
                        updateProgress(PROGRESS_PROJECT, (p) => ({
                          ...dropTrip(p),
                          deepest: 0,
                        })),
                    }
                  : undefined
              }
              sideQuests={side.states}
              onSide={(questId, action) =>
                updateProgress(PROGRESS_PROJECT, (p) => {
                  const side = { ...p.side };
                  if (action === "reset") delete side[questId];
                  else {
                    const at = new Date().toISOString();
                    side[questId] = { at, step: 0, done: at };
                  }
                  return { ...p, side };
                })
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
        <StudioPane width={studio.width} open={studio.open} setup={setup} />
      )}

      {(setupOpen ||
        (!showOpening &&
          !setupDismissed &&
          setup.status &&
          setupUrgent(setup.status))) && (
        <SetupPanel setup={setup} onClose={closeSetup} />
      )}
    </div>
  );
}
