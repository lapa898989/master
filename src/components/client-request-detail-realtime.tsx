"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useDebouncedRouterRefresh } from "@/hooks/use-debounced-router-refresh";

/** Отклики, смена статуса заявки, появление assignment → обновление без F5 (с дебаунсом). */
export function ClientRequestDetailRealtime({ requestId }: { requestId: number }) {
  const scheduleRefresh = useDebouncedRouterRefresh(320);

  useEffect(() => {
    const supabase = createClient();
    const filterReq = `request_id=eq.${requestId}`;
    const filterId = `id=eq.${requestId}`;

    const channel = supabase
      .channel(`client-req-${requestId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: filterReq }, () => {
        scheduleRefresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: filterReq }, () => {
        scheduleRefresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "requests", filter: filterId }, () => {
        scheduleRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, scheduleRefresh]);

  return null;
}
