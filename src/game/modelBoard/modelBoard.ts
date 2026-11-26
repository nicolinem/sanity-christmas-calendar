export type BoardSlot = { id: string; label: string; about: string };
// A card is a bit of the note. In a table board it is the example for a
// field (`field`, as Studio will name it).
export type BoardCard = { id: string; text: string; field?: string };
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
  // "table": one row per field, choose its type (and toggles) in the row.
  layout?: "table";
  source?: string; // the heading over the example column, "Fra notatet"
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
      return {
        label: card.field ?? card.text,
        done: false,
        message: undefined,
      };

    if (!decision.accept.includes(answer.slot))
      return {
        label: card.field ?? card.text,
        done: false,
        message: decision.feedback[answer.slot],
      };

    // A toggle counts once it's decided, yes or no. Left untouched it isn't
    // an answer, or «not required» would pass without a thought.
    const toggles = Object.entries(decision.toggles ?? {});
    if (toggles.some(([toggle]) => answer[toggle as BoardToggle] === undefined))
      return {
        label: card.field ?? card.text,
        done: false,
        message: undefined,
      };
    const wrongToggle = toggles.find(
      ([toggle, rule]) => answer[toggle as BoardToggle] !== rule.want,
    );
    if (wrongToggle)
      return {
        label: card.field ?? card.text,
        done: false,
        message: wrongToggle[1].feedback,
      };

    return { label: card.field ?? card.text, done: true, message: undefined };
  });

  return {
    done: requirements.every(({ done }) => done),
    requirements,
  };
}
