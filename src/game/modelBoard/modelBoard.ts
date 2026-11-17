export type BoardSlot = { id: string; label: string; about: string };
export type BoardCard = { id: string; text: string };
export type BoardToggle = "required" | "initial";

export type BoardDecision = {
  card: string;
  accept: string[];
  feedback: Record<string, string>;
  toggles?: Partial<Record<BoardToggle, { want: boolean; feedback: string }>>;
};

export type BoardTask = {
  id: string;
  note: string;
  slots: BoardSlot[];
  cards: BoardCard[];
  decisions: BoardDecision[];
  allowToggles?: BoardToggle[];
};

export type Placement = Record<
  string,
  { slot?: string; required?: boolean; initial?: boolean }
>;

export function judgeBoard(task: BoardTask, placement: Placement) {
  const requirements = task.cards.map((card) => {
    const decision = task.decisions.find(({ card: id }) => id === card.id);
    if (!decision)
      throw new Error(`${task.id}: Kortet ${card.id} mangler en avgjørelse.`);

    for (const slot of task.slots) {
      if (!decision.accept.includes(slot.id) && !decision.feedback[slot.id])
        throw new Error(
          `${task.id}: Kortet ${card.id} mangler feedback for ${slot.id}.`,
        );
    }

    const answer = placement[card.id];
    if (!answer?.slot)
      return { label: card.text, done: false, message: undefined };

    if (!decision.accept.includes(answer.slot))
      return {
        label: card.text,
        done: false,
        message: decision.feedback[answer.slot],
      };

    const wrongToggle = Object.entries(decision.toggles ?? {}).find(
      ([toggle, rule]) => Boolean(answer[toggle as BoardToggle]) !== rule.want,
    );
    if (wrongToggle)
      return {
        label: card.text,
        done: false,
        message: wrongToggle[1].feedback,
      };

    return { label: card.text, done: true, message: undefined };
  });

  return {
    done: requirements.every(({ done }) => done),
    requirements,
  };
}
