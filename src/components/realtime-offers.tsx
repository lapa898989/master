"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function RealtimeOffers({ requestId, onEvent }: { requestId: number; onEvent: () => void }) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`offers-${requestId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: `request_id=eq.${requestId}` }, () => {
        onEvent();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, onEvent]);

  return null;
}
