"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schema } from "./src/sanity/schemaTypes";

// Config for the Studio embedded at /studio. Players edit game content here.
export default defineConfig({
  name: "sanity-winter-quest",
  title: "Sanity Winter Quest",
  basePath: "/studio",
  projectId,
  dataset,
  schema,
  plugins: [
    // QUEST: The Proving Room. Give items an extra view here, one that shows
    // the item the way the game will.
    structureTool(),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  // QUEST: The Forge Button. Register your Forge action here (`document.actions`).
});
