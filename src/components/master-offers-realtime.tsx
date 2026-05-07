"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useDebouncedRouterRefresh } from "@/hooks/use-debounced-router-refresh";

export function MasterOffersRealtime({ masterId }: { masterId: string }) {
  const scheduleRefresh = useDebouncedRouterRefresh(380);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`master-offers-${masterId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers", filter: `master_id=eq.${masterId}` },
        () => {
          scheduleRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [masterId, scheduleRefresh]);

  return null;
}
