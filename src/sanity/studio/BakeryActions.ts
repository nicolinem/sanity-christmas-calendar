import { useDocumentOperation, type DocumentActionComponent } from "sanity";

// QUEST: Luke 10. Our working action is activated only after the code-window
// challenge is solved; the participant's code never runs in Studio.
export const ForgeAction: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const kind = (props.draft ?? props.published)?.kind;
  return {
    label: "Smi",
    disabled: !props.ready || kind !== "weapon" || Boolean(patch.disabled || publish.disabled),
    onHandle: () => {
      patch.execute([{ set: { forgedAt: new Date().toISOString() } }]);
      publish.execute();
    },
  };
};