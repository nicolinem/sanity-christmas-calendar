import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / partial prefetching are off for this prototype: the
  // embedded Sanity Studio and the always-fresh /api/items route want classic
  // dynamic behavior, and the game gains nothing from aggressive caching.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      // `import source from "./File?raw"` gives the file's text, so the code
      // window can show the real component a task imports.
      "*.tsx": {
        condition: { query: "?raw" },
        type: "raw",
      },
      "*.ts": {
        condition: { query: "?raw" },
        type: "raw",
      },
    },
  },
};

export default nextConfig;
