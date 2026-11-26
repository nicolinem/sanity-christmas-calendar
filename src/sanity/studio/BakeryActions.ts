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
      props.onComplete();
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
  const item = typeof current?.item === "string" ? current.item : "";
  const missing = [!current?.date && "dato", !item.trim() && "vare"].filter(
    Boolean,
  );
  // A new order isn't saved until something is typed: its starting values
  // show in the form but aren't in the document yet.
  const title = !current
    ? "Fyll inn varen først."
    : missing.length
      ? `Mangler ${missing.join(" og ")}`
      : hasErrors
        ? "Rett valideringsfeil før du trykker Klar."
        : validation.isValidating
          ? "Validerer bestillingen…"
          : current?.status === "klar"
            ? "Bestillingen er allerede klar."
            : undefined;
  if (!enabled) return null;
  return {
    label: "Klar",
    title,
    disabled:
      !props.ready ||
      validation.isValidating ||
      hasErrors ||
      missing.length > 0 ||
      current?.status === "klar" ||
      Boolean(patch.disabled || publish.disabled),
    onHandle: () => {
      patch.execute([{ set: { status: "klar" } }]);
      publish.execute();
      props.onComplete();
    },
  };
};
