"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Требование: после выбора мастера чат должен открываться у мастера тоже.
 * Реализуем безопасно: слушаем realtime-уведомления offer_accepted и переходим по `href`,
 * отмечая уведомление прочитанным, чтобы не было зацикливания.
 */
export function AutoOpenChatOnAccepted({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const inFlight = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`auto-chat-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        async (payload) => {
          const row = payload.new as { id?: unknown; type?: unknown; href?: unknown } | null;
          if (!row || row.type !== "offer_accepted") return;
          if (typeof row.href !== "string") return;
          if (typeof row.id !== "number") return;
          if (inFlight.current) return;

          // Если уже в этом чате — просто отметим прочитанным.
          if (pathname === row.href) {
            inFlight.current = true;
            await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", row.id).eq("user_id", userId);
            inFlight.current = false;
            return;
          }

          inFlight.current = true;
          await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", row.id).eq("user_id", userId);
          router.push(row.href);
          inFlight.current = false;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathname, router, userId]);

  return null;
}

