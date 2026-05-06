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
        () => {
          void loadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadCount]);

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
