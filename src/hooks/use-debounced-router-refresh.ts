"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * Склеивает всплеск событий Realtime в один `router.refresh()` — меньше лагов в кабинете.
 */
export function useDebouncedRouterRefresh(delayMs = 320) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  const scheduleRefresh = useCallback(() => {
    pendingRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (pendingRef.current) {
        pendingRef.current = false;
        router.refresh();
      }
    }, delayMs);
  }, [router, delayMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return scheduleRefresh;
}
