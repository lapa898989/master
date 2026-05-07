"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedRouterRefresh } from "@/hooks/use-debounced-router-refresh";

export function ChatLive({ requestId }: { requestId: number }) {
  const scheduleRefresh = useDebouncedRouterRefresh(200);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${requestId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "request_messages", filter: `request_id=eq.${requestId}` }, () => {
        scheduleRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, scheduleRefresh]);

  return null;
}
