"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Новые/изменённые открытые заявки: события приходят только по строкам, доступным мастеру по RLS.
 */
export function MasterOpenRequestsRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("master-open-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
