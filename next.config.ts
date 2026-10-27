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
    },
  },
};

export default nextConfig;
