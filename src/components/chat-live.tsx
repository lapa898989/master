"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ChatLive({ requestId }: { requestId: number }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${requestId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "request_messages", filter: `request_id=eq.${requestId}` }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, router]);

  return null;
}
