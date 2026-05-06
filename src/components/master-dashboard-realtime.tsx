"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function MasterDashboardRealtime({ masterId }: { masterId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`master-dash-${masterId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, () => {
        router.refresh();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers", filter: `master_id=eq.${masterId}` },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [masterId, router]);

  return null;
}
