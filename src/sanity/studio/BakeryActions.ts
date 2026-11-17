import { isValidationErrorMarker } from "@sanity/types";
import {
  getDraftId,
  useDocumentOperation,
  useValidationStatus,
  type DocumentActionComponent,
} from "sanity";
import { useMorningRush } from "../lib/solved";

// QUEST: Luke 10. Our working action is activated only after the code-window
// challenge is solved; the participant's code never runs in Studio.
export const ForgeAction: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const kind = (props.draft ?? props.published)?.kind;
  return {
    label: "Smi",
    disabled:
      !props.ready ||
      kind !== "weapon" ||
      Boolean(patch.disabled || publish.disabled),
    onHandle: () => {
      patch.execute([{ set: { forgedAt: new Date().toISOString() } }]);
      publish.execute();
    },
  };
};

// QUEST: Luke 9. The non-technical track uses our finished action directly
// in the real Studio, with the same patch-then-publish pattern as Smi.
export const ReadyAction: DocumentActionComponent = (props) => {
  const enabled = useMorningRush();
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const validation = useValidationStatus(
    getDraftId(props.id),
    props.type,
    true,
  );
  const hasErrors = validation.validation.some(isValidationErrorMarker);
  const current = props.draft ?? props.published;
  if (!enabled) return null;
  return {
    label: "Klar",
    disabled:
      !props.ready ||
      validation.isValidating ||
      hasErrors ||
      current?.status === "klar" ||
      Boolean(patch.disabled || publish.disabled),
    onHandle: () => {
      patch.execute([{ set: { status: "klar" } }]);
      publish.execute();
      props.onComplete();
    },
  };
};
