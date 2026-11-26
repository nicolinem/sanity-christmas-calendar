"use client";

import config from "../../../sanity.config";
import { isTypeShown } from "../lib/solved";
import { ReadyAction } from "./BakeryActions";

// The Studio at /studio: the player's own sanity.config.ts, with «+» leaving
// out document types whose luke hasn't opened yet. structure.ts does the same
// for the lists. Sanity reads «+» when the Studio loads.
const playerOptions = config.document.newDocumentOptions;
const playerActions = config.document.actions;

const studioConfig: typeof config = {
  ...config,
  document: {
    ...config.document,
    newDocumentOptions: (previous) =>
      playerOptions(previous).filter((item) => isTypeShown(item.templateId)),
    // Klar first for orders: Sanity makes the first action the big button,
    // so the morning rush doesn't hide it in the menu. Until the morning
    // rush, Klar renders nothing and Publish stays the big button.
    actions: (previous, context) => {
      const actions =
        typeof playerActions === "function"
          ? playerActions(previous, context)
          : (playerActions ?? previous);
      if (context.schemaType !== "bakeryOrder") return actions;
      return [
        ...actions.filter((action) => action === ReadyAction),
        ...actions.filter((action) => action !== ReadyAction),
      ];
    },
  },
};

export default studioConfig;
