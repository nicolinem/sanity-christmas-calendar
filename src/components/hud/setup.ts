"use client";

import { useCallback, useEffect, useState } from "react";
import type { SetupStatus } from "@/sanity/setupStatus";

// What the game knows about the player's setup: the project (from
// /api/setup) and whether the Studio is signed in (asked straight from Sanity,
// the same way the Studio does). Both are checked again when the player comes
// back to the tab, for example after signing in or claiming in another tab.

export type StudioAuth = "checking" | "in" | "out" | "error";

export const SIGN_IN_URL = "/api/setup/login";
export const CLAIM_URL = "/api/setup/claim";
export const manageUrl = (projectId: string) =>
  `https://www.sanity.io/manage/project/${projectId}`;

// The Studio keeps its token here after signing in ({token: string}).
const tokenKey = (projectId: string) => `__studio_auth_token_${projectId}`;

function storedToken(projectId: string): string | null {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(tokenKey(projectId)) ?? "null",
    );
    return typeof saved?.token === "string" ? saved.token : null;
  } catch {
    return null;
  }
}

async function checkStudioAuth(projectId: string): Promise<StudioAuth> {
  const token = storedToken(projectId);
  try {
    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2021-06-07/users/me`,
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : { credentials: "include" },
    );
    if (!res.ok) return res.status === 401 ? "out" : "error";
    const me = await res.json();
    return me && typeof me.id === "string" ? "in" : "out";
  } catch {
    // Blocked by CORS (wrong port before claiming) or offline.
    return "error";
  }
}

export type Setup = {
  status: SetupStatus | null;
  studioAuth: StudioAuth;
  recheck: () => Promise<void>;
};

export function useSetup(): Setup {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [studioAuth, setStudioAuth] = useState<StudioAuth>("checking");
  const projectId = status?.projectId ?? null;

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/setup", { cache: "no-store" });
      if (res.ok) setStatus(await res.json());
    } catch {
      // The checklist just stays as it was.
    }
  }, []);

  const loadAuth = useCallback(async () => {
    if (!projectId) return;
    setStudioAuth(await checkStudioAuth(projectId));
  }, [projectId]);

  const recheck = useCallback(async () => {
    await Promise.all([loadStatus(), loadAuth()]);
  }, [loadStatus, loadAuth]);

  useEffect(() => {
    // Fetching on mount and on return to the tab is what this hook is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStatus();
    const onFocus = () => void loadStatus();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadStatus]);

  useEffect(() => {
    if (!projectId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAuth();
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("__studio_auth_")) void loadAuth();
    };
    const onFocus = () => void loadAuth();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [projectId, loadAuth]);

  return { status, studioAuth, recheck };
}
