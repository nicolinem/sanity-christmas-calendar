"use client";

import { useEffect, useRef } from "react";
import type { GameItemView } from "@/game/items";
import type { QuestState } from "@/game/quests/types";
import { ELEMENTS } from "@/game/magic";
import SpriteIcon from "./SpriteIcon";
import { IconQuill } from "./icons";
import { renderCode } from "./QuestTracker";

type Props = {
  active: QuestState | null; // what Brann wants from the player next
  forged: GameItemView | undefined;
  sanityConfigured: boolean | null;
  fetchFailed: boolean; // configured, but the project couldn't be read
  unclaimed: boolean; // made by `npm run setup` and not claimed yet
  refreshing: boolean;
  checked: boolean; // the player has asked the forge at least once
  onCheck: () => void;
  onOpenLog: () => void;
  hintsShown: number; // hints revealed so far for the active quest
  onRevealHint: (questId: string) => void;
  onClose: () => void;
};

export const STUDIO_URL = "/studio";

const FIRST_QUEST = "the-broken-forge";

// Talking to Brann is where Sanity enters the story: he can't forge anything,
// but the player can, in the Studio. He hands out each quest in his own words;
// "Check the forge" re-fetches published content so quests can verify themselves.
export default function ForgeDialogue({
  active,
  forged,
  sanityConfigured,
  fetchFailed,
  unclaimed,
  refreshing,
  checked,
  onCheck,
  onOpenLog,
  hintsShown,
  onRevealHint,
  onClose,
}: Props) {
  const firstButton = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    firstButton.current?.focus({ preventScroll: true });
  }, []);

  const onboarding = !active || active.quest.id === FIRST_QUEST;
  const firstForging = onboarding && !forged;

  let speech: React.ReactNode;
  if (sanityConfigured === false) {
    speech = (
      <>
        This forge isn&apos;t hooked up to a Sanity project yet, so all I can lend you is demo gear.
        Every smith needs their own. Run <code>npm run setup</code> in the repo, then come back and
        we&apos;ll forge something real.
      </>
    );
  } else if (!active) {
    speech = (
      <>
        {forged && <>{appraise(forged)} </>}
        That&apos;s all the work I have for now. Come back when the calendar turns.
      </>
    );
  } else if (active.quest.id === "test-the-blade" && forged) {
    speech = (
      <>
        {appraise(forged)} {active.quest.intro}
      </>
    );
  } else {
    speech = active.quest.intro;
  }

  return (
    <section className="dialogue frame frame--wood" role="dialog" aria-label="Brann the blacksmith">
      <div className="dialogue-portrait frame frame--inset">
        <SpriteIcon sprite={{ sheet: "dungeon", frame: 86 }} scale={4} />
      </div>
      <div className="dialogue-body">
        <p className="dialogue-name">
          Brann, the blacksmith
          {active && sanityConfigured !== false && <span className="dialogue-task">{active.quest.title}</span>}
        </p>
        <p className="dialogue-speech">{speech}</p>

        {firstForging && sanityConfigured !== false && (
          <ol className="dialogue-steps">
            <li>Open the Studio and create an Item</li>
            <li>
              Make it a <em>weapon</em> and give it a name worth fearing
            </li>
            <li>Publish, then check the forge</li>
          </ol>
        )}

        {fetchFailed && !refreshing && (
          <p className="dialogue-feedback" role="status">
            The forge can&apos;t reach your Sanity project. If its dataset is private the game can&apos;t
            read it; run <code>npm run setup</code> to check.
          </p>
        )}

        {firstForging && checked && !refreshing && !fetchFailed && sanityConfigured !== false && (
          <p className="dialogue-feedback" role="status">
            Nothing on the anvil yet. Only published weapons reach the forge.
          </p>
        )}

        {!onboarding && active && sanityConfigured !== false && (
          <TaskNotes state={active} hintsShown={hintsShown} onRevealHint={onRevealHint} refreshing={refreshing} />
        )}

        {unclaimed && firstForging && (
          <p className="dialogue-hint">
            First time in the Studio? Open the sign-in link that <code>npm run setup</code> printed. Run it
            again to see the link. The Studio remembers you after that.
          </p>
        )}

        <div className="dialogue-actions">
          <a ref={firstButton} className="btn btn--amber" href={STUDIO_URL} target="_blank" rel="noreferrer">
            <IconQuill />
            Open Sanity Studio
          </a>
          <button type="button" className="btn" onClick={onCheck} disabled={refreshing}>
            {refreshing ? "Checking…" : "Check the forge"}
          </button>
          {!onboarding && (
            <button type="button" className="btn" onClick={onOpenLog}>
              Quest log <kbd>J</kbd>
            </button>
          )}
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Leave <kbd>Esc</kbd>
          </button>
        </div>
      </div>
    </section>
  );
}

// Under Brann's words: where to work, how he'll check it, his latest verdict,
// and hints the player can reveal one by one (shared with the quest log).
function TaskNotes({
  state,
  hintsShown,
  onRevealHint,
  refreshing,
}: {
  state: QuestState;
  hintsShown: number;
  onRevealHint: (questId: string) => void;
  refreshing: boolean;
}) {
  const { quest, result } = state;
  const hints = quest.hints.slice(0, hintsShown);
  return (
    <div className="dialogue-notes">
      {quest.where && (
        <p className="dialogue-note">
          <span className="dialogue-note-label">Where to work</span> {renderCode(quest.where)}
        </p>
      )}
      {quest.checkedBy === "code" && (
        <p className="dialogue-note">
          <span className="dialogue-note-label">How Brann checks</span> run <code>npm run quest</code> in your
          terminal, then press Check the forge.
        </p>
      )}
      {result.message && !refreshing && !result.done && (
        <p className="dialogue-feedback" role="status">
          <span className="dialogue-note-label">Brann&apos;s verdict</span> {renderCode(result.message)}
        </p>
      )}
      {hints.map((hint, i) => (
        <p key={i} className="dialogue-note dialogue-hint-line">
          <span className="dialogue-note-label">Hint {i + 1}</span> {renderCode(hint.text)}
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
        <button type="button" className="dialogue-more-hint" onClick={() => onRevealHint(quest.id)}>
          {hintsShown === 0 ? "Need a hint?" : "Another hint"}
        </button>
      )}
    </div>
  );
}

// Brann's verdict on a weapon. Every blade from his forge hits as hard as the
// forge allows; what sets one apart is its name (and soon, its element).
function appraise(weapon: GameItemView) {
  return (
    <>
      <strong>{weapon.name}</strong>! Fresh from the fire, it&apos;ll bite for {weapon.power?.damage ?? 0}.
      {weapon.magic.kind === "element" && <> And I can feel {ELEMENTS[weapon.magic.element].title.toLowerCase()} in that name.</>}
    </>
  );
}
