import { defineCliConfig } from "sanity/cli";
import { dataset, projectId } from "./src/sanity/env";

// Lets the `sanity` CLI (e.g. `npx sanity dataset`, `npx sanity deploy`) pick up
// the same project/dataset the app uses.
export default defineCliConfig({
  api: { projectId, dataset },
});
