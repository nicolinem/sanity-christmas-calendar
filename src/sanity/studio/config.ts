"use client";

import config from "../../../sanity.config";
import { isTypeShown } from "../lib/solved";

// The Studio at /studio: the player's own sanity.config.ts, with «+» leaving
// out document types whose luke hasn't opened yet. structure.ts does the same
// for the lists. Sanity reads «+» when the Studio loads.
const playerOptions = config.document.newDocumentOptions;

const studioConfig: typeof config = {
  ...config,
  document: {
    ...config.document,
    newDocumentOptions: (previous) =>
      playerOptions(previous).filter((item) => isTypeShown(item.templateId)),
  },
};

export default studioConfig;
