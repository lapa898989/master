"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function NotificationsNavLink({ userId }: { userId: string }) {
  const [unread, setUnread] = useState<number | null>(null);

  const loadCount = useCallback(async () => {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) {
      setUnread(0);
      return;
    }
    setUnread(count ?? 0);
  }, [userId]);

  useEffect(() => {
    void loadCount();
  }, [loadCount]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-nav-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const eventType = (payload as { eventType?: unknown }).eventType;
          const nextRow = (payload as { new?: unknown }).new as { read_at?: unknown } | null | undefined;
          const prevRow = (payload as { old?: unknown }).old as { read_at?: unknown } | null | undefined;

          // Если мы ещё не знаем текущее значение — один раз посчитаем и дальше работаем инкрементально.
          if (unread === null) {
            void loadCount();
            return;
          }

          const nextUnread = nextRow?.read_at == null;
          const prevUnread = prevRow?.read_at == null;

          setUnread((current) => {
            const n = current ?? 0;
            if (eventType === "INSERT") return nextUnread ? n + 1 : n;
            if (eventType === "DELETE") return prevUnread ? Math.max(0, n - 1) : n;
            if (eventType === "UPDATE") {
              if (prevUnread && !nextUnread) return Math.max(0, n - 1);
              if (!prevUnread && nextUnread) return n + 1;
              return n;
            }
            return n;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadCount, unread]);

  const n = unread ?? 0;
  const label = n > 99 ? "99+" : n > 0 ? String(n) : null;

  return (
    <Link href="/notifications" className="relative text-white/90 hover:text-white">
      Уведомления
      {label ? (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-950">
          {label}
        </span>
      ) : null}
    </Link>
  );
}
