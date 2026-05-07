"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useDebouncedRouterRefresh } from "@/hooks/use-debounced-router-refresh";

export function ClientRequestsRealtime({ clientId }: { clientId: string }) {
  const scheduleRefresh = useDebouncedRouterRefresh(380);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`client-requests-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests", filter: `client_id=eq.${clientId}` },
        () => {
          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${clientId}` },
        () => {
          scheduleRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, scheduleRefresh]);

  return null;
}
