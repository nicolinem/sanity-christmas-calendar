"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schema } from "./src/sanity/schemaTypes";
import { defaultDocumentNode, structure } from "./src/sanity/studio/structure";
import { isSolved } from "./src/sanity/lib/solved";
import { ForgeAction, ReadyAction } from "./src/sanity/studio/BakeryActions";

// Config for the Studio embedded at /studio. This file
// is yours; the later chapter 1 quests happen here.
export default defineConfig({
  name: "sanity-winter-quest",
  title: "Winter Quest",
  basePath: "/studio",
  projectId,
  dataset,
  schema,
  plugins: [
    structureTool({ structure, defaultDocumentNode }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  // QUEST: Luke 10. Our Smi action switches on after the code challenge.
  document: {
    actions: (previous, { schemaType }) => {
      if (schemaType === "item" && isSolved("baker-forge"))
        return [...previous, ForgeAction];
      if (schemaType === "bakeryOrder") return [...previous, ReadyAction];
      return previous;
    },
  },
});
