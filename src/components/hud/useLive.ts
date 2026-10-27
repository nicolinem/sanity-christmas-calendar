"use client";

import { useEffect } from "react";

const QUERY = '*[_type == "item"]';

// Sanity pushes every change to the browser as it happens. The game listens
// for published items and refetches, so a blade appears the moment you press
// Publish in the Studio: no refresh, no button.
//
// The listener needs the page's origin in the project's CORS list. An
// unclaimed project only allows localhost:3000; anywhere else the stream is
// refused, and the game quietly falls back to checking every few seconds.
export function useLiveRefresh(refresh: () => void, enabled: boolean) {
  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
    if (!enabled || !projectId) return;

    let debounce: number | undefined;
    let poll: number | undefined;
    // Published changes can take a moment to show up in queries.
    const soon = () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(refresh, 700);
    };

    const url =
      `https://${projectId}.api.sanity.io/v2024-01-01/data/listen/${dataset}` +
      `?query=${encodeURIComponent(QUERY)}&includeResult=false`;
    const stream = new EventSource(url);
    stream.addEventListener("mutation", soon);
    stream.onerror = () => {
      if (stream.readyState === EventSource.CLOSED && !poll) poll = window.setInterval(refresh, 4000);
    };

    return () => {
      stream.close();
      window.clearTimeout(debounce);
      window.clearInterval(poll);
    };
  }, [enabled, refresh]);
}
