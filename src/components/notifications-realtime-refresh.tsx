"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useDebouncedRouterRefresh } from "@/hooks/use-debounced-router-refresh";

/** Обновляет серверный рендер списка при новых/изменённых уведомлениях. */
export function NotificationsRealtimeRefresh({ userId }: { userId: string }) {
  const scheduleRefresh = useDebouncedRouterRefresh(380);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-page-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          scheduleRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, scheduleRefresh]);

  return null;
}
