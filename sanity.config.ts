"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schema } from "./src/sanity/schemaTypes";

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
    // QUEST: Prøvestua. Gi item-dokumentene en ekstra document view her, en som
    // viser gjenstanden slik spillet ser den.
    structureTool(),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  // QUEST: Smi-knappen. Registrer document action-en din her (`document.actions`).
});
