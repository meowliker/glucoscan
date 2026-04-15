"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAppStore } from "@/lib/store/useAppStore";

/**
 * DataSync watches the auth state and keeps the app store in sync with
 * Supabase. When a user logs in, it loads their settings and history.
 * When they log out, it clears the local store.
 */
export default function DataSync() {
  const user = useAuthStore((s) => s.user);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentId = user?.id ?? null;
    const lastId = lastUserIdRef.current;

    // User logged in (or changed)
    if (currentId && currentId !== lastId) {
      const store = useAppStore.getState();
      store.loadSettings(currentId);
      store.loadHistory(currentId);
      store.loadBloodSugar();
    }

    // User logged out
    if (!currentId && lastId) {
      useAppStore.getState().resetUserData();
    }

    lastUserIdRef.current = currentId;
  }, [user]);

  return null;
}
