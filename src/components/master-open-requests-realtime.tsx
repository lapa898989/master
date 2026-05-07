"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useDebouncedRouterRefresh } from "@/hooks/use-debounced-router-refresh";

/**
 * Новые/изменённые открытые заявки: события приходят только по строкам, доступным мастеру по RLS.
 */
export function MasterOpenRequestsRealtime() {
  const scheduleRefresh = useDebouncedRouterRefresh(420);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("master-open-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, () => {
        scheduleRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scheduleRefresh]);

  return null;
}
